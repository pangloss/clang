(ns clang.directive.interpolate
  (:require-macros
    [clang.angular :refer [def.value def.provider fnj ??]])
  (:require [clojure.string :as cs])
  (:use [clang.util :only [? ! module]]))

(def start "{{")
(def end "}}")
(def re-start #"\{\{")
(def re-end #"}}")

(def m (module "clang"))

(def exception-handler (atom nil))
(def parse (atom nil))

(defn plain-text [text]
  (fn [_] text))

(defn close-and-parse [text]
  (let [[to-parse text] (cs/split text re-end 2)]
    [(@parse to-parse) (plain-text text)]))

(defn parse-sections [text mustHaveExpression]
  (let [[text & parts] (cs/split text re-start)]
    (if (and mustHaveExpression (empty? parts))
      nil
      (concat [(plain-text text)]
              (mapcat close-and-parse parts)))))

(defn interpolate
  ([text mustHaveExpression]
   (let [parts (parse-sections text mustHaveExpression)
         f (when parts
             (fn [context]
               (try
                 (->> parts
                   (map #(% context))
                   (cs/join ""))
                 (catch js/Error e
                   (@exception-handler
                     (js/Error. (str "error while interpolating '" text "'\n"
                                     " --> " (.toString e))))))))]
     (when f
       (aset f "exp" text)
       (aset f "parts" parts)
       f)))
  ([text]
   (interpolate text false)))


(def $get (fnj [$readParse $exceptionHandler]
  (reset! exception-handler $exceptionHandler)
  (reset! parse $readParse)
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
