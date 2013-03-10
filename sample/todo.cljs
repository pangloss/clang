(ns clang.sample.todo
  (:require-macros [clang.angular :refer [def.controller defn.scope scope! def.filter fnj]])
  (:require [clojure.string :as cs]
            clang.directive.clangRepeat)
  (:use [clang.util :only [? ! module]]))

(def m (module "clang.todo" ["clang"]))


;;; This controller uses regular clojure data

(def.controller m TodoCtrl [$scope]
  (scope! todos [{:text "learn angular" :done "yes"}
                 {:text "learn cljs" :done "yes"}
                 {:text "build an app" :done "no"}])

  (scope! nums (range 1 10))

  (scope! bool true)

  (defn.scope addone [[x _]]
    (+ 1 x))

  (defn.scope check_click []
    (? "check_click")
    (? "click check"))

  (defn.scope addTodo []
    (? "addTodo")
    (scope! todos (conj (scope! todos)
                        {:text (scope! todoText) :done false}))
    (scope! todoText ""))

  (defn.scope remaining []
    (->>
      (scope! todos)
      (map :done)
      (remove #{"yes"})
      count))

  (defn.scope archive []
    (? "archive")
    (scope! todos
            (->>
              (scope! todos)
              (map :done)
              (remove #{"yes"})))))




;;; This controller is identical but uses an atom for the todo data

(def.controller m AtomTodoCtrl [$scope]
  (scope! todos (atom [(atom {:text "learn angular" :done true})
                       (atom {:text "learn cljs" :done true})
                       (atom {:text "learn about software transactional memory" :done true})
                       (atom {:text "build an app" :done false})]))

  (defn.scope addTodo []
    (? "addTodo2")
    (swap! (scope! todos)
           conj (atom {:text (scope! todoText) :done false}))
    (scope! todoText ""))

  (defn.scope remaining []
    (->> @(scope! todos)
         (remove (comp :done deref))
         count))

  (defn.scope archive []
    (? "archive2")
    (swap! (scope! todos) (partial remove (comp :done deref)))))
