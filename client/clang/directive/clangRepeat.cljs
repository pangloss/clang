(ns clang.directive.clangRepeat
  (:require-macros [clang.angular :refer [def.directive def.fn ??]])
  (:require clang.directive.interpolate)
  (:use [clang.util :only [? module]]))

(def m (module "clang"))

(defn kv-seq [collection]
  (if (map? collection)
    collection
    (map (fn [v] [nil v]) collection)))


;; This started as a line-by-line port of ngRepeat.
(def.directive m clangRepeat [$readParse]
  (js-obj
    "transclude" "element"
    "priority" 1000
    "terminal" true
    "compile"
    (fn [element attr linker]
      (fn [scope iterStartElement attr]
        (let [expression (.-clangRepeat attr)
              [match lhs rhs] (re-find #"^\s*(.+)\s+in\s+(.*)\s*$" expression)
              _ (when-not match
                  (throw (js/Error. (str "Expected ngRepeat in form of "
                                         "'_item_ in _collection_' but got '"
                                         expression "'."))))
              [match keyIdent valueIdent] (or (re-find #"^(?:\(([\$\w]+)\s*,\s*([\$\w]+)\))$" lhs)
                                              (re-find #"^(?:()([\$\w]+))$" lhs))
              _ (when-not match
                  (throw (js/Error. (str "'item' in 'item in collection' "
                                         "should be identifier or (key, value) "
                                         "but got '" lhs "'."))))
              lastOrder (atom (array-map))
              prevValue (atom nil)]
          (.$watch scope
             ($readParse rhs)
             (fn clangRepeatWatch [new-val old-val scope]
               (let [collection (if (coll? new-val) new-val [])
                     arrayLength (count collection)
                     collection (kv-seq collection)
                     nextOrder (atom (array-map))
                     cursor (atom iterStartElement)
                     populate-scope (fn [childScope index value]
                                      (aset childScope valueIdent value)
                                      (aset childScope "$value" value)
                                      (when keyIdent
                                        (aset childScope "$key" key)
                                        (aset childScope keyIdent key))
                                      (aset childScope "$index" index)
                                      (aset childScope "$first" (zero? index))
                                      (aset childScope "$last" (= index (dec arrayLength)))
                                      (aset childScope "$middle"
                                            (not (or (zero? index)
                                                     (= index (dec arrayLength)))))
                                      childScope)]
                 (loop [index 0 [key value] (first collection) collection (next collection)]
                   (if-let [last (@lastOrder value)]
                     (do
                       (swap! lastOrder dissoc value)
                       (swap! nextOrder assoc value last)
                       (when-not (= index (:index last))
                         (assoc! last :index index)
                         (.after @cursor (:element last)))
                       (reset! cursor (:element last))
                       (populate-scope (:scope last) index value))
                     (let [childScope (populate-scope (.$new scope) index value)]
                       (linker childScope
                               (fn [clone]
                                 (.after @cursor clone)
                                 (reset! cursor clone)
                                 (swap! nextOrder
                                        assoc value {:scope childScope
                                                     :element clone
                                                     :index index})))))
                   (when collection
                     (recur (inc index) (first collection) (next collection))))
                 (doseq [[key {:keys [element scope]}] @lastOrder]
                   (.remove element)
                   (.$destroy scope))
                 (reset! lastOrder @nextOrder)
                 new-val))
             true))))))
