(ns clang.js-types
  (:require [goog.object :as gobject]))

;; This originates in Kevin Lynagh's todoFRP sample, with various
;; changes:
;;   https://github.com/lynaghk/todoFRP
;;      /blob/master/todo/angular-cljs/src/cljs/todo/util.cljs
;;
;; Namespace that extends JavaScript's object and array to play nicely
;; with Clojure's semantics and act as Clojure collections.
;;
;; This namespace only needs to be required once in the project to apply
;; these extensions project-wide.

(defn- strkey [x]
  (cond
    (string? x) x
    (keyword? x) (name x)
    :else (str x)))

(defn obj-name [this]
  (if-let [[_ n] (re-find #"^function (\w+)" (str this))]
    n
    "Object"))

;; Everything in JS inherits from js/Object. If we applied some of these
;; methods to random JS classes, we would get very odd results. For
;; instance, (count (js/Date.)) is 4
(defn- obj-only [o method]
  (when-not (identical? (type o) js/Object)
    (throw (js/TypeError. (str (obj-name (type o)) " does not implement '" (name method) "'")))))

(extend-type object
  ILookup
  (-lookup
    ([o k]
       (aget o (strkey k)))
    ([o k not-found]
      (let [s (strkey k)]
        (if (gobject/containsKey o s)
          (aget o s)
          not-found))))

  IEmptyableCollection
  (-empty [o]
    (obj-only o :empty)
    (js-obj))

  ICollection
  (-conj [parent [k v]]
    (obj-only parent :conj)
    (let [o (js-obj)]
      (assoc! o k v)
      (gobject/extend o parent)
      o))

  ICounted
  (-count [o]
    (obj-only o :count)
    (.-length (js-keys o)))

  IAssociative
  (-assoc [o k v]
    (obj-only o :assoc)
    (conj o [k v]))

  IMap
  (-dissoc [parent k]
    (obj-only parent :dissoc)
    (let [o (js-obj)]
      (gobject/extend o parent)
      (dissoc! o k)))

  ITransientCollection
  (-conj! [o [k v]]
    (assoc! o k v))
  (-persistent! [o]
    (obj-only o :persistent!)
    (into {} (map (fn [[k v]] [(keyword k) v]) o)))

  ITransientAssociative
  (-assoc! [o k v]
    (aset o (strkey k) v)
    o)

  ITransientMap
  (-dissoc! [o k]
    (gobject/remove o (strkey k))
    o)

  ISeqable
  (-seq [o]
    (obj-only o :seq)
    (map (fn [k] [k (get o k)]) (js-keys o))))

(extend-type array
  IEmptyableCollection
  (-empty [a]
    (array))

  ITransientCollection
  (-conj! [a x]
    (.push a x)
    a)
  (-persistent! [a]
    (into [] a))

  ITransientAssociative
  (-assoc! [a k v]
    (aset a (strkey k) v)
    a))
