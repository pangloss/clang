(ns clang.core
  (:require-macros [clang.angular :refer [fnj controller]])
  (:require clang.todo
            [clang.util :refer [module]]))


(def angular (.-angular js/window))

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
;
