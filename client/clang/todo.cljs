(ns clang.todo
  (:require-macros [clang.angular :refer [def.controller defn.scope $ def.filter]])
  (:require [clojure.string :as cs])
  (:use [clang.util :only [? ! module]]))

(def m (module "clang.todo"))

(def.controller m TodoCtrl [$scope]
  ($ todos (array (js-obj "text" "learn angular", "done" true)
                  (js-obj "text" "learn clojurescript" "done" true)
                  (js-obj "text" "build an app", "done" false)))

  (defn.scope addTodo []
    (.. ($ todos)
      (push (js-obj "text" ($ todoText) "done" false)))
    ($ todoText ""))

  (defn.scope remaining []
    (->> ($ todos)
      (remove #(aget % "done"))
      count))

  (defn.scope archive []
    ($ todos (into-array (remove #(aget % "done") ($ todos))))))


