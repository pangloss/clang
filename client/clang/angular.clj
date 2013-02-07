(ns clang.angular)

; Function with dependancy injection metadata for angular
(defmacro fnj [args & body]
  (if (empty? args)
    `(fn [] ~@body)
    `(clojure.core/array ~@(map name args) (fn ~args ~@body))))

(defmacro def.controller [module n args & body]
  `(.controller ~module ~(name n) (fnj ~args ~@body)))

(defmacro def.directive [module n args & body]
  `(.directive ~module ~(name n) (fnj ~args ~@body)))

(defmacro def.factory [module n args & body]
  `(.factory ~module ~(name n) (fnj ~args ~@body)))

(defmacro def.constant [module n value]
  `(.constant ~module ~(name n) ~value))

(defmacro def.value [module n value]
  `(.value ~module ~(name n) ~value))

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

; Gets or sets a value to a $scope variable
(defmacro $
  ([k] `(aget ~'$scope ~(name k)))
  ([k v] `(aset ~'$scope ~(name k) ~v)))
