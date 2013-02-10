(ns clang.parser
  (:use [clang.util :only [? ! module]])
  (:require [cljs.reader :refer [read-string]]
            [clojure.string :as cs])
  (:require-macros
    [clang.angular :refer [fn-symbol-map]]))

(def fn-syms
  (fn-symbol-map
    count str first last second ffirst rest next fnext nfirst nnext nthnext
    sort reverse deref rand rand-int > < >= <= not= inc dec max min nth get
    clj->js not + - * / rem mod keys vals true? false? nil? = == ))

(defn function [sym]
  (if (keyword? sym)
    sym
    (fn-syms (name sym))))

(defn exec-list [sym args]
  (if-let [f (function sym)]
    (apply f args)
    (str (apply list sym args))))

(defn context-eval [ng-parse form context]
  (cond
    (list? form) (exec-list (first form)
                            (when-let [form (next form)]
                              (map #(context-eval ng-parse % context) form)))
    (symbol? form) (or ((ng-parse (name form)) context)
                       form)
    :else form))

(defn parse [ng-parse text]
  (if-let [text (cond
                  (re-find #"^:\S+$" text)   (str "(" text " $value)")
                  (re-find #"^\(.*\)$" text) text
                  (= \: (first text))        (str "(" text ")")
                  (= \@ (first text))        text)]
    (partial context-eval ng-parse (read-string text))
    (ng-parse text)))

(defn get-atom [ng-parse text]
  (let [[a ks] (read-string (str "[" text "]"))]
    (cond
      (sequential? ks)
      (fn [context]
        (get-in @(context-eval ng-parse a context)
                (map #(context-eval ng-parse % context) ks)))
      ks
      (fn [context]
        (get @(context-eval ng-parse a context)
             (context-eval ng-parse ks context)))
      :else
      (fn [context]
        @(context-eval ng-parse a context)))))

(defn set-atom [ng-parse text]
  (let [[a ks] (read-string (str "[" text "]"))]
    (cond
      (sequential? ks)
      (fn [context value]
        (swap! (context-eval ng-parse a context)
               assoc-in
               (map #(context-eval ng-parse % context) ks)
               value))
      ks
      (fn [context value]
        (swap! (context-eval ng-parse a context)
               assoc
               (context-eval ng-parse ks context)
               value))
      :else
      (fn [context value]
        (reset! (context-eval ng-parse a context)
                value)))))

; To be settable, value must be on the scope, so it can't be a form
(defn get-value [ng-parse text]
  (let [[a ks] (read-string (str "[" text "]"))]
    (cond
      (sequential? ks)
      (fn [context]
        (get-in ((ng-parse text) context)
                (map #(context-eval ng-parse % context) ks)))
      ks
      (fn [context]
        (get ((ng-parse text) context)
             (context-eval ng-parse ks context)))
      :else
      (ng-parse text))))

; value must be on the scope, so it can't be a form
;
; get the value, assoc it and set the result
(defn set-value [ng-parse text]
  (let [[a ks] (read-string (str "[" text "]"))]
    (cond
      (sequential? ks)
      (fn [context value]
        (let [v (ng-parse text)]
          (.assign v context
             (assoc-in (v context)
                       (map #(context-eval ng-parse % context) ks)
                       value))))
      ks
      (fn [context value]
        (let [v (ng-parse text)]
          (.assign v context
             (assoc (v context)
                    (context-eval ng-parse ks context)
                    value))))
      :else
      (.-assign (ng-parse text)))))

(defn getter-setter [ng-parse text]
  (if (= \@(first text))
    (let [text (cs/join "" (rest text))]
      [(get-atom ng-parse text)
       (set-atom ng-parse text)])
    [(get-value ng-parse text)
     (set-value ng-parse text)]))
