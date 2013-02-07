(ns clang.core
  (:require-macros [clang.angular :refer [module fnj controller]])
  (:require clang.todo))


(def angular (.-angular js/window))

(def app (module "app" [:clang.todo]))

(.config app
   (fnj [$routeProvider $locationProvider]
        ; Without server side support html5 must be disabled.
        (.html5Mode $locationProvider false)))

(.. angular
  (element js/document)
  (ready (fn []
           (.bootstrap angular
              js/document (array "app")))))

