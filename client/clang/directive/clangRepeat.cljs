(ns clang.directive.clangRepeat
  (:require-macros [clang.angular :refer [def.directive defn.scope $]])
  (:require [clojure.string :as cs])
  (:use [clang.util :only [? ! module]]))

(def m (module "clang"))

(defn kv-seq [collection]
  (if (map? collection)
    collection
    (map (fn [v] [nil v]) collection)))

(def.directive m clangRepeat []
  (js-obj
    "transclude" "element"
    "priority" 1000
    "terminal" true
    "compile"
    (fn [element attr linker]
      (fn [$scope iterStartElement attr]
        (let [expression (.-clangRepeat attr)
              [match lhs rhs] (re-find #"^\s*(.+)\s+in\s+(.*)\s*$" expression)
              _ (when-not match
                  (throw (js/Error. (str "Expected ngRepeat in form of '_item_ in _collection_' but got '" expression "'."))))
              [match keyIdent valueIdent] (or (re-find #"^(?:\(([\$\w]+)\s*,\s*([\$\w]+)\))$" lhs)
                                              (re-find #"^(?:()([\$\w]+))$" lhs))
              _ (when-not match
                  (throw (js/Error. (str "'item' in 'item in collection' should be identifier or (key, value) but got '" lhs "'."))))
              lastOrderAtom (atom (transient (array-map)))]
          (($ $watch)
             (fn clangRepeatWatch [$scope]
               (let [collection (($ $eval) rhs)
                     collection (if (coll? collection) collection [])
                     arrayLength (count collection)
                     collection (kv-seq collection)
                     nextOrder (transient (array-map))
                     lastOrder @lastOrderAtom
                     cursor (atom iterStartElement)
                     childScope (atom nil)]
                 (loop [index 0 [key value] (first collection) collection (next collection)]
                   (if-let [last (disj lastOrder value)]
                     (do
                       (reset! childScope (:scope last))
                       (assoc nextOrder value last)
                       (when-not (= index (:index last))
                         (! last :index index)
                         (.after @cursor (:element last)))
                       (reset! cursor (:element last)))
                     (reset! childScope (($ $new))))
                   (! @childScope valueIdent value)
                   (when keyIdent
                     (! @childScope keyIdent key))
                   (! @childScope :$index index)
                   (! @childScope :$first (zero? index))
                   (! @childScope :$last (= index (dec arrayLength)))
                   (! @childScope :$middle (not (or (zero? index)
                                                    (= index (dec arrayLength)))))
                   (when-not last
                     (linker @childScope (fn [clone]
                                           (.after @cursor clone)
                                           (reset! cursor clone)
                                           (assoc nextOrder value {:scope @childScope
                                                                   :element clone
                                                                   :index index}))))
                   (when collection
                     (recur (inc index) (first collection) (next collection))))
                 (doseq [[key {:keys [element scope]}] lastOrder]
                   (.remove element)
                   (.$destroy scope))
                 (reset! lastOrderAtom nextOrder)))))))))
