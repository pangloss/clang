(ns clang.parser
  (:use [clang.util :only [? ! module extend]])
  (:require [cljs.reader :refer [read-string]]
            [clojure.string :as cs])
  (:require-macros
    [clang.angular :refer [fnj def.provider fn-symbol-map]]))

(def ng-parse (.get (.injector js/angular (array "ng")) "$parse"))

(letfn
  [(*if
     ([c t] (if c t))
     ([c t f] (if c t f)))
   (*or [a b] (or a b))
   (*and [a b] (and a b))
   (*not [b] (not b))
   (*when [c t] (when c t))
   (*when-not [c f] (when-not c f))]
  (let [if *if
        or *or
        and *and
        not *not
        when *when
        when-not *when-not]
    (def fn-syms
      (fn-symbol-map
        count str first last second ffirst rest next fnext nfirst nnext nthnext
        sort reverse deref rand rand-int > < >= <= not= inc dec max min nth get
        clj->js not + - * / rem mod keys vals true? false? nil? = == get-in
        even? odd? filter remove partition map take drop juxt identity comp
        if or and not when when-not))))

(defn function [sym]
  (if (keyword? sym)
    sym
    (fn-syms (name sym))))

(defn exec-list [sym args]
  (if-let [f (function sym)]
    (apply f args)
    (str (apply list sym args))))

(defn context-eval [form context]
  (cond
    (list? form) (exec-list (first form)
                            (when-let [form (next form)]
                              (map #(context-eval % context) form)))
    (symbol? form) (or (try
                         ((ng-parse (name form)) context)
                         (catch js/Error e nil))
                       (fn-syms (name form) form))
    :else form))

(defn get-atom [text [a ks]]
  (cond
    (sequential? ks)
    (fn [context]
      (get-in @(context-eval a context)
              (map #(context-eval % context) ks)))
    ks
    (fn [context]
      (get @(context-eval a context)
           (context-eval ks context)))
    :else
    (fn [context]
      @(context-eval a context))))

(defn set-atom [text [a ks]]
  (cond
    (sequential? ks)
    (fn [context value]
      (swap! (context-eval a context)
             assoc-in
             (map #(context-eval % context) ks)
             value))
    ks
    (fn [context value]
      (swap! (context-eval a context)
             assoc
             (context-eval ks context)
             value))
    :else
    (fn [context value]
      (reset! (context-eval a context)
              value))))

; To be settable, value must be on the scope, so it can't be a form
(defn get-value [text [a ks]]
  (cond
    (sequential? ks)
    (fn [context]
      (get-in ((ng-parse text) context)
              (map #(context-eval % context) ks)))
    ks
    (fn [context]
      (get ((ng-parse text) context)
           (context-eval ks context)))
    :else
    (ng-parse text)))

; value must be on the scope, so it can't be a form
;
; get the value, assoc it and set the result
(defn set-value [text [a ks]]
  (cond
    (sequential? ks)
    (fn [context value]
      (let [v (ng-parse text)]
        (.assign v context
           (assoc-in (v context)
                     (map #(context-eval % context) ks)
                     value))))
    ks
    (fn [context value]
      (let [v (ng-parse text)]
        (.assign v context
           (assoc (v context)
                  (context-eval ks context)
                  value))))
    :else
    (.-assign (ng-parse text))))

(defn assignable-parse [text]
  (letfn [(maybe-read [text]
            (try
              (read-string (str "[" text "]"))
              (catch js/Error e
                (? (? "failed to read: " text) e)
                nil)))]
    (if (= \@(first text))
      (if-let [form (maybe-read (cs/join "" (rest text)))]
        [(get-atom text form)
         (set-atom text form)]
        nil)
      (if-let [form (maybe-read text)]
        [(get-value text form)
         (set-value text form)]
        (let [p (ng-parse text)]
          [p (! p :assign)])))))

(defn read-parse [text]
  (if-let [text (cond
                  (re-find #"^:\S+$" text)   (str "(" text " $value)")
                  (re-find #"^\(.*\)$" text) text
                  (= \: (first text))        (str "(" text ")")
                  (= \@ (first text))        text)]
    (partial context-eval (read-string text))
    (ng-parse text)))

(def assignable-parse-cache (atom {}))

; Should I create 2 parse providers, one for interpolations and another for ng-model, etc parsing?

(defn AssignableParseProvider []
  (extend (js* "this")
    :$get
    (fn []
      (fn [exp]
        (when (string? exp) (? "app" exp))
        (cond
          (string? exp) (if-let [p (@assignable-parse-cache exp)]
                          p
                          (let [[p a] (assignable-parse exp)]
                            (aset p "assign" a)
                            (swap! assignable-parse-cache assoc exp p)
                            p))
          (fn? exp) exp
          :else (fn [& _])))))
  nil)

(def read-parse-cache (atom {}))

(defn ReadParseProvider []
  (extend (js* "this")
    :$get
    (fn []
      (fn [exp]
        (when (string? exp) (? "rpp" exp))
        (cond
          (string? exp) (if-let [p (@read-parse-cache exp)]
                          p
                          (let [p (read-parse exp)]
                            (swap! read-parse-cache assoc exp p)
                            p))
          (fn? exp) exp
          :else (fn [& _])))))
  nil)

; TODO: set 'ng' '$parse' provider

(def ng (module "clang"))

(def.provider ng $parse (AssignableParseProvider.))
(def.provider ng $readParse (ReadParseProvider.))
