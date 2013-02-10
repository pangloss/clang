(ns clang.directive.clangAtom
  (:require-macros [clang.angular :refer [def.directive def.controller fnj]])
  (:require clang.directive.interpolate
            [clang.parser :as p])
  (:use [clang.util :only [? ! module extend]]))

(def m (module "clang"))

(def css {:valid "ng-valid" :invalid "ng-invalid"
          :pristine "ng-pristine" :dirty "ng-dirty"})

(def model-controller
  (fnj
    [$scope $exceptionHandler $attr $element $parse]
    (let [this (js* "this")
          getfn (p/get-atom $parse (! $attr :clangAtom))
          setfn (p/set-atom $parse (! $attr :clangAtom))]
      (extend this
        :$viewValue js/Number.NaN
        :$modelValue js/Number.NaN
        :$parsers (array)
        :$formatters (array)
        :$viewChangeListeners (array)
        :$pristine true
        :$dirty false
        :$valid true
        :$invalid false
        :$name (! $attr :name)
        :$render (fn [& _])
        ))
       ))




(def.directive m clangAtom [$browser $sniffer]
  (js-obj
    "require" ["ngModel", "^?form"]
    "controller" atom-controller
    "link"
    (fn [(scope, element, attr, ctrls)]
      (let [this (first ctrls)]
        (doseq [c (rest ctrls)]
          (let [add (! c :$addControl)
                remove (! c :$removeControl)]
            (when add (add this))
            (when remove (.bind element "$destroy" (fn []) (remove this)))))))))
