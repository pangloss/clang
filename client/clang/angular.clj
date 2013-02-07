(ns clang.angular)

; Function with dependancy injection metadata for angular
(defmacro fnj [args & body]
  `(clojure.core/array ~@(map name args) (fn ~args ~@body)))

(defmacro controller [n app args & body]
  `(.controller ~app ~(name n) (fnj ~args ~@body)))

(defmacro module
  ([n]
   `(module ~n []))
  ([n deps]
   `(.module
       (.-angular js/window)
       ~(name n)
       (clojure.core/array ~@(map name deps)))))
