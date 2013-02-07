(ns clang.util)

(defn !
  ([target name]
   (js->clj (aget target name)))
  ([target name value]
   (aset target name (clj->js value))))

(defn ?
  ([x] (.log js/console (str x)) x)
  ([x y] (.log js/console (str x) (str y) y) y))


