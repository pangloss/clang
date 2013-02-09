(ns clang.directive.interpolate
  (:require-macros
    [clang.angular :refer [def.value def.provider fnj]])
  (:require [clojure.string :as cs]
            [cljs.reader :refer [read-string]]
            [clang.parser :as p])
  (:use [clang.util :only [? ! module]]))

(def start "{{")
(def end "}}")
(def re-start #"\{\{")
(def re-end #"}}")

(def m (module "clang"))

(def exception-handler (atom nil))
(def parse (atom nil))

(defn parse-section [data]
  (cond
    (re-find #"^\(.*\)$" data)
      (partial p/context-eval @parse (read-string data))
    (= \: (first data))
      (partial p/context-eval @parse (read-string (str "(" data ")")))
    :else (@parse data)))

(defn plain-text [text]
  (fn [_] text))

(defn close-and-parse [text]
  (let [[to-parse text] (cs/split text re-end 2)]
    [(parse-section to-parse) (plain-text text)]))

(defn parse-sections [text]
  (let [[text & parts] (cs/split text re-start)]
    (concat [(plain-text text)]
            (mapcat close-and-parse parts))))

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


(def $get (fnj [$parse $exceptionHandler]
  (reset! parse $parse)
  (reset! exception-handler $exceptionHandler)
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
