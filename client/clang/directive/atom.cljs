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
    [$scope $exceptionHandler $attrs $element $parse]
    (let [ctrl (js* "this")
          [getfn setfn] (p/getter-setter (! $attrs :ngModel))
          parentForm (.inheritedData $element "$formController")
          invalid-count (atom 0)]
      (extend ctrl
        :$viewValue js/Number.NaN
        :$modelValue js/Number.NaN
        :$parsers (array)
        :$formatters (array)
        :$viewChangeListeners (array)
        :$error (js-obj)
        :$pristine true
        :$dirty false
        :$valid true
        :$invalid false
        :$name (! $attrs :name)
        ; Hopefully the input directives will set the $render fn for me
        :$render (fn [& _]
                   #_(throw (js/Error. "Called the render stub in model controller")))

        :$setValidity
        (fn [validationErrorKey isValid]
          ; TODO
          )
        :$setPristine
        (fn []
          (extend ctrl :$dirty false :$pristine true)
          (doto $element
            (.removeClass (:dirty css))
            (.addClass (:pristine css))))
        :$setViewValue
        (fn [value]
          (! ctrl :$viewValue value)
          (when (! ctrl :$pristine)
            (extend ctrl :$dirty true :$pristine false)
            (doto $element
              (.$setDirty parentForm);
              (.removeClass (:pristine css))
              (.addClass (:dirty css))))
          (let [parsers (! ctrl :$parsers)
                value (reduce #(%2 %1) value parsers)]
            (when (not= value (! ctrl :$modelValue))
              (! ctrl :$modelValue value)
              (setfn $scope value)
              (doseq [listener (! ctrl :$viewChangeListeners)]
                (try
                  (listener)
                  (catch js/Error e
                    ($exceptionHandler e))))))))

      (.addClass $element (:pristine css))

      (.$watch $scope
         (fn []
           (let [value (getfn $scope)]
             (when (not= value (! ctrl :$modelValue))
               (let [value (->> (! ctrl :$formatters)
                             reverse
                             (reduce #(%2 %1) value))]
                 (when (not= value (! ctrl :$viewValue))
                   (! ctrl :$viewValue value)
                   (.$render ctrl)))))))
    nil)))


(def.directive m ngModel [$browser $sniffer]
  (js-obj
    "require" ["ngModel", "^?form"]
    "controller" model-controller
    "terminal" true
    "priority" 100
    "link"
    (fn [scope element attr ctrls]
      (let [this (first ctrls)]
        (doseq [c (rest ctrls)]
          (let [add (! c :$addControl)
                remove (! c :$removeControl)]
            (when add (add this))
            (when remove (.bind element "$destroy" (fn []) (remove this)))))))))
