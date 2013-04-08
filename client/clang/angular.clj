(ns clang.angular)

; Function with dependancy injection metadata for angular
(defmacro fnj [args & body]
  (if (empty? args)
    `(fn [] ~@body)
    `(clojure.core/array ~@(map name args) (fn ~args ~@body))))

(defmacro def.controller [module n args & body]
  `(.controller ~module ~(name n) (fnj ~args ~@body)))

(defmacro def.directive [module n args & body]
  (let [body (if (map? (last body))
               (conj (pop body) `(reduce (fn [obj# [k# v#]]
                                           (aset obj# (name k#) v#)
                                           obj#)
                                         (js-obj)
                                         ~(last body)))
               body)]
    `(.directive ~module ~(name n) (fnj ~args ~@body))))

(defmacro def.factory [module n args & body]
  `(.factory ~module ~(name n) (fnj ~args ~@body)))

(defmacro def.config [module args & body]
  `(.config ~module (fnj ~args ~@body)))

(defmacro def.constant [module n value]
  `(.constant ~module ~(name n) ~value))

(defmacro def.value [module n value]
  `(.value ~module ~(name n) ~value))

(defmacro def.provider [module n value]
  `(.provider ~module ~(name n) ~value))

(defmacro def.fn [module n args & body]
  `(.value ~module ~(name n) (fn ~args ~@body)))

; (def.filter m niceDate [$filter] [d]
;   (($filter "date") d "shortDate")
;
; is equivalent to
;
; m.filter("niceDate", ["$filter", function($filter) {
;   return function(d) {
;     return $filter("date")(d, "shortDate");
;   }
; }]);
(defmacro def.filter [module n deps args & body]
  `(.filter ~module ~(name n)
      (fnj ~deps (fn ~args ~@body))))

; Defines a function on the current $scope
(defmacro defn.scope [n args & body]
  `(aset ~'$scope ~(name n) (fn ~args ~@body)))

(defmacro fn-symbol-map [& syms]
  (->> syms
    (map (juxt name identity))
    (into {})))

(defmacro ?? [& values]
  `(do (.log js/console
             ~@(mapcat (fn [v] (cond
                                 (or (string? v) (keyword? v)) [(name v)]
                                 (symbol? v) [(str (name v) ":")
                                              `(let [v# ~v]
                                                 (if (or (nil? v#) (coll? v#))
                                                   (pr-str v#)
                                                   v#))]
                                 :else [v]))
                   values))
       ~(last values)))
