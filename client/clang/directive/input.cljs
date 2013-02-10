(ns clang.directive.input
  (:require-macros [clang.angular :refer [def.directive def.fn]])
  (:require clang.directive.interpolate
            [clang.parser :as p])
  (:use [clang.util :only [? ! module]]))

(def m (module "clang"))

(defn check-box [scope element attr ctrl $sniffer $browser]
  (let [trueValue (or (! attr :ngTrueValue) true)
        falseValue (or (! attr :ngFalseValue) false)]
    (.bind element "click"
       (fn [] (.$apply scope
                 (fn []
                   ; TODO: clojurize
                   (.$setViewValue
                      ctrl (! (first element) :checked))))))
    (! ctrl :$render
       (fn [] (! (first element) :checked
                 ; TODO: clojurize
                 (! ctrl :$viewValue))))
    (.push (! ctrl :$formatters)
       (fn [value] (= value trueValue)))
    (.push (! ctrl :$parsers)
       (fn [value] (if value trueValue falseValue)))))

(def input-types {:checkbox check-box})


(def atom-controller
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
