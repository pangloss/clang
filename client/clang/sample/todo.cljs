(ns clang.todo
  (:require-macros [clang.angular :refer [def.controller defn.scope $ def.filter fnj]])
  (:require [clojure.string :as cs]
            clang.directive.clangRepeat)
  (:use [clang.util :only [? ! module]]))

; causes the todo controller to be initialized twice. I guess because
; the html page refers to the clang.todo module directly.
;(.. angular
;  (element js/document)
;  (ready (fn []
;           (.bootstrap angular
;              js/document (array "app")))))

(def m (module "clang.todo" ["clang"]))

(def.controller m TodoCtrl [$scope]
  ($ todos [{:text "learn angular" :done true}
            {:text "learn cljs" :done true}
            {:text "build an app" :done false}])

  (defn.scope addTodo []
    ($ todos (conj ($ todos)
                   {:text ($ todoText) :done false}))
    ($ todoText ""))

  (defn.scope remaining []
    (->> ($ todos)
      (remove :done)
      count))

  (defn.scope archive []
    ($ todos (remove :done ($ todos)))))


