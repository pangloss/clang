(ns clang.sample.todo
  (:require-macros [clang.angular :refer [def.controller defn.scope $ def.filter fnj]])
  (:require [clojure.string :as cs]
            clang.directive.clangRepeat)
  (:use [clang.util :only [? ! module]]))

(def m (module "clang.todo" ["clang"]))


;;; This controller uses regular clojure data

(def.controller m TodoCtrl [$scope]
  ($ todos [{:text "learn angular" :done "yes"}
            {:text "learn cljs" :done "yes"}
            {:text "build an app" :done "no"}])

  ($ nums (range 1 10))

  ($ bool true)

  (defn.scope negate [x]
    (not x))

  (defn.scope check_click []
    (? "click check"))

  (defn.scope addTodo []
    ($ todos (conj ($ todos)
                   {:text ($ todoText) :done false}))
    ($ todoText ""))

  (defn.scope remaining []
    (->> ($ todos)
      (remove :done)
      count))

  (defn.scope archive []
    (? "a1")
    ($ todos (remove :done ($ todos)))))




;;; This controller is identical but uses an atom for the todo data

(def.controller m AtomTodoCtrl [$scope]
  ($ todos (atom [{:text "learn angular" :done true}
                  {:text "learn cljs" :done true}
                  {:text "learn about software transactional memory" :done true}
                  {:text "build an app" :done false}]))

  (defn.scope addTodo []
    (swap! ($ todos)
           conj {:text ($ todoText) :done false})
    ($ todoText ""))

  (defn.scope remaining []
    (->> @($ todos)
      (remove :done)
      count))

  (defn.scope archive []
    (? "a2")
    (swap! ($ todos) (partial remove :done))))


