(ns clang.sample.todo
  (:require-macros [clang.angular :refer [def.controller defn.scope def.filter fnj]])
  (:require [clojure.string :as cs]
            clang.js-types
            clang.directive.clangRepeat)
  (:use [clang.util :only [? module]]))

(def m (module "clang.todo" ["clang"]))


;;; This controller uses regular clojure data

(def.controller m TodoCtrl [$scope]
  (assoc! $scope :todos [{:text "learn angular" :done "yes"}
                         {:text "learn cljs" :done "yes"}
                         {:text "build an app" :done "no"}])

  (assoc! $scope :nums (range 1 10))

  (assoc! $scope :bool true)

  (defn.scope addone [[x _]]
    (+ 1 x))

  (defn.scope check_click []
    (? "check_click")
    (? "click check"))

  (defn.scope addTodo []
    (? "addTodo")
    (assoc! $scope :todos (conj (:todos $scope)
                                {:text (:todoText $scope) :done false}))
    (assoc! $scope :todoText ""))

  (defn.scope remaining []
    (->>
     (:todos $scope)
     (map :done)
     (remove #{"yes"})
     count))

  (defn.scope archive []
    (? "archive")
    (assoc! $scope :todos
            (->>
             (:todos $scope)
             (map :done)
             (remove #{"yes"})))))




;;; This controller is identical but uses an atom for the todo data

(def.controller m AtomTodoCtrl [$scope]
  (assoc! $scope :todos (atom [(atom {:text "learn angular" :done true})
                               (atom {:text "learn cljs" :done true})
                               (atom {:text "learn about software transactional memory" :done true})
                               (atom {:text "build an app" :done false})]))

  (defn.scope addTodo []
    (? "addTodo2")
    (swap! (:todos $scope)
           conj (atom {:text (:todoText $scope) :done false}))
    (assoc! $scope :todoText ""))

  (defn.scope remaining []
    (->> @(:todos $scope)
         (remove (comp :done deref))
         count))

  (defn.scope archive []
    (? "archive2")
    (swap! (:todos $scope) (partial remove (comp :done deref)))))
