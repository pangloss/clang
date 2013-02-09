(ns clang.directive.interpolate
  (:require-macros [clang.angular :refer [def.value def.provider fnj]])
  (:require [clojure.string :as cs]
            [cljs.reader :refer [read-string]])
  (:use [clang.util :only [? ! module]]))

(def m (module "clang"))

(def exception-handler (atom nil))

(defn context-eval [form context]
  "oh yeah")

(defn parse-section [data]
  (partial context-eval (read-string (str "[" data "]"))))

(defn close-and-parse [text]
  (let [[data & strings] (cs/split "]]" text)]
    [(parse-section data) (fn [_] (cs/join "]]" strings))]))

(defn parse-sections [text]
  (->> (cs/split text "[[")
    (mapcat close-and-parse)))

(defn interpolate
  ([text]
   (let [parts (parse-sections text)
         f (fn [context]
             (try
               (->> parts
                 (map #(% context))
                 (cs/join ""))
               (catch js/Error e
                 (? (str "error while interpolating '" text "'") e)
                 (@exception-handler
                   (js/Error. (str "error while interpolating '" text "'\n" (.toString e)))))))]
     (aset f "exp" text)
     (aset f "parts" parts)
     f))
  ([text mustHaveExpression] (interpolate text)))


(def $get (fnj [$exceptionHandler]
  (when-not @exception-handler
    (reset! exception-handler $exceptionHandler))
  interpolate))

(declare InterpolateProvider)

(defn startSymbol
  ([] "[[")
  ([value] (? "change ss to " value) (js* "this")))

(defn endSymbol
  ([] "]]")
  ([value] (js* "this")))

(aset interpolate "startSymbol" startSymbol)
(aset interpolate "endSymbol"   endSymbol)

(defn InterpolateProvider []
  (aset (js* "this") "startSymbol" startSymbol)
  (aset (js* "this") "endSymbol"   endSymbol)
  (aset (js* "this") "$get" $get)
  ; a js constructor that returns something causes problems
  nil)

(def.provider m $interpolate (InterpolateProvider.))

;(def.provider m $interpolate InterpolateProvider [$exceptionHandler]
;  (when-not @exception-handler
;    (reset! exception-handler $exceptionHandler))
;  interpolate)
