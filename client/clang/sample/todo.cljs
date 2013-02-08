(ns clang.todo
  (:require-macros [clang.angular :refer [def.controller defn.scope $ def.filter]])
  (:require [clojure.string :as cs])
  (:use [clang.util :only [? ! module]]))

(def app (module "app" [:clang.todo]))

(.config app
   (fnj [$routeProvider $locationProvider]
        ; Without server side support html5 must be disabled.
        (.html5Mode $locationProvider false)))

; causes the todo controller to be initialized twice. I guess because
; the html page refers to the clang.todo module directly.
;(.. angular
;  (element js/document)
;  (ready (fn []
;           (.bootstrap angular
;              js/document (array "app")))))

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


