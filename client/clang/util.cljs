(ns clang.util
  (:refer-clojure :exclude [assoc!]))

(defn ?
  ([x] (if (coll? x)
         (.log js/console (str x) x)
         (.log js/console (str x))) x)
  ([x y] (if (coll? x)
           (.log js/console (str x ":") (str y) y)
           (.log js/console (str x ":") (str y))) y))

(def modules (atom {}))

; The complexity here allows (module "name") to be used (almost) idempotently.
;
; NOTE: it only registers your dependencies on the first time it's called.
(defn module
  ([n] (module n []))
  ([n deps]
   (let [n (name n)]
     (if-let [m (@modules (name n))]
       m
       (let [m (.module (.-angular js/window)
                  n
                  (into-array (map name deps)))]
         (swap! modules assoc n m)
         m)))))


(def amerge goog.object/extend)

(defn assoc!
  "Transient associate allowing multiple k/v pairs.

   Replaces cljs.core/assoc!"
  ([tcoll k v]
     (-assoc! tcoll k v))
  ([tcoll k v & kvs]
     (let [ret (assoc! tcoll k v)]
       (if kvs
         (recur ret (first kvs) (second kvs) (nnext kvs))
         ret))))

(defn update-in!
  ([m [k & ks] f & args]
     (if ks
       (assoc! m k (apply update-in! (get m k) ks f args))
       (assoc! m k (apply f (get m k) args)))))
