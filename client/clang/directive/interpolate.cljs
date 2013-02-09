(ns clang.directive.interpolate
  (:require-macros [clang.angular :refer [def.value fnj]])
  (:require [clojure.string :as cs]
            [cljs.reader :refer [read-string]])
  (:use [clang.util :only [? ! module]]))

(def m (module "clang"))

(defn context-eval [form context]
  "oh yeah")

(def interpolate-provider (js* "function () {}"))

(def $get
  (fnj [$exceptionHandler]
       (? "$get")
       (letfn [(parse-section [data]
                 (partial context-eval (read-string (str "[" data "]"))))
               (close-and-parse [text]
                 (let [[data & strings] (cs/split "]]" text)]
                   [(parse-section data) (fn [_] (cs/join "]]" strings))]))
               (parse-sections [text]
                 (-> text
                   (cs/split "[[")
                   (->>
                     (mapcat close-and-parse))))
               ($interpolate [text mustHaveExpression]
                 (let [parts (parse-sections text)
                       f (fn [context]
                           (try
                             (->> parts
                               (map #(% context))
                               (cs/join ""))
                             (catch js/Error e
                               (? (str "error while interpolating '" text "'") e)
                               ($exceptionHandler
                                 (js/Error. (str "error while interpolating '" text "'\n" (.toString e)))))))]
                   (aset f "exp" text)
                   (aset f "parts" parts)
                   f))]
         (aset $interpolate "startSymbol" "[[")
         (aset $interpolate "endSymbol"   "]]")
         $interpolate)))

(defn startSymbol
  ([] "[[")
  ([value] (? "change ss to " value) startSymbol))

(defn endSymbol
  ([] "]]")
  ([value] endSymbol))

(aset interpolate-provider "startSymbol" startSymbol)
(aset interpolate-provider "endSymbol"   endSymbol)
(aset interpolate-provider "$get"        $get)

(def.value m $interpolate interpolate-provider)
