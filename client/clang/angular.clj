(ns clang.angular)

; Function with dependancy injection metadata for angular
(defmacro fnj [args & body]
  `(clojure.core/array ~@(map name args) (fn ~args ~@body)))

(defmacro def.controller [module n args & body]
  `(.controller ~module ~(name n) (fnj ~args ~@body)))

; Defines a function on the current $scope
(defmacro defn.scope [n args & body]
  `(aset ~'$scope ~(name n) (fn ~args ~@body)))

; Gets or sets a value to a $scope variable
(defmacro $
  ([k] `(aget ~'$scope ~(name k)))
  ([k v] `(aset ~'$scope ~(name k) ~v)))
