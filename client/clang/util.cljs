(ns clang.util)

(defn !
  ([target n]
   (if (coll? n)
     (let [[n & nn] n]
       (if (seq nn)
         (recur (! target n) nn)
         (recur target n)))
     (aget target (name n))))
  ([target n value]
   (if (coll? n)
     (let [[n & nn] n]
       (if (seq nn)
         (recur (or (! target n)
                    (let [x (js-obj)]
                      (! target n x)
                      x))
                nn value)
         (recur target n value)))
     (aset target (name n) value))))

(defn ?
  ([x] (.log js/console (str x) x) x)
  ([x y] (.log js/console (str x) (str y) y) y))

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
