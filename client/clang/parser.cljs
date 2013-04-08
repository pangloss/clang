(ns clang.parser
  (:use [clang.util :only [? module]])
  (:require [cljs.reader :refer [read-string]]
            [clojure.string :as cs])
  (:require-macros
    [clang.angular :refer [fnj def.provider fn-symbol-map ??]]))

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

(defn lookup-function [token context]
  (cond
    (keyword? token) token
    (symbol? token) (if-let [ctx-fn (aget context (name token))]
                      (when (fn? ctx-fn) ctx-fn)
                      (fn-syms (name token)))
    :else (throw (js/Error. (str "Can't look up function: " (prn-str token))))))

(defn exec-list [sym args context]
  (if-let [f (lookup-function sym context)]
    (apply f args)
    (str (apply list sym args))))

(defn context-eval
  "A partially applied version of this function will be returned when
   an expression is parsed (or combined with other functions first) that
   can then be applied with the context (i.e. scope) to get the actual
   value or execute the expression"
  [form context]
  (cond
    (list? form) (exec-list (first form)
                            (when-let [form (next form)]
                              (map #(context-eval % context) form))
                            context)
    (symbol? form) (or (aget context (name form))
                       (fn-syms (name form)))
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
             value)
      value)
    ks
    (fn [context value]
      (swap! (context-eval a context)
             assoc
             (context-eval ks context)
             value)
      value)
    :else
    (fn [context value]
      (reset! (context-eval a context)
              value))))

; To be settable, value must be on the scope, so it can't be a form
(defn get-value [text [a ks]]
  (cond
    (sequential? ks)
    (fn [context]
      (get-in ((ng-parse (str a)) context)
              (map #(context-eval % context) ks)))
    ks
    (fn [context]
      (get ((ng-parse (str a)) context)
           (context-eval ks context)))
    :else
    (ng-parse text)))

; value must be on the scope, so it can't be a form
;
; get the value, assoc it and set the result
(defn set-value [text [a ks]]
  ; Find the top context the value is present in, but if not found, then assign
  ; the new var into the current context.
  (letfn [(find-context* [getter context]
            (when-let [parent (.-$parent context)]
              (if (getter parent)
                (recur getter parent)
                context)))
          (find-context [getter context]
            (or (find-context* getter context) context))] (cond
    (sequential? ks)
    (fn [context value]
      (let [v (ng-parse (str a))]
        (.assign v (find-context v context)
           (assoc-in (v context)
                     (map #(context-eval % context) ks)
                     value))))
    ks
    (fn [context value]
      (let [v (ng-parse (str a))]
        (.assign v (find-context v context)
           (assoc (v context)
                  (context-eval ks context)
                  value))))
    :else
    (.-assign (ng-parse text)))))

(defn read-parse [text]
  (if-let [text (cond
                  (re-find #"^:\S+$" text)   (str "(" text " $value)")
                  (re-find #"^\(.*\)$" text) text
                  (= \: (first text))        (str "(" text ")")
                  (= \@ (first text))        text)]
    (partial context-eval (read-string text))
    (ng-parse text)))

(defn assignable-parse [text]
  (letfn [(maybe-read [text]
            (try
              (read-string (str "[" text "]"))
              (catch js/Error e
                (? "failed to read" text)
                (? "exception" e)
                nil)))]
    (cond
      (= \@ (first text))
        (if-let [form (maybe-read (cs/join "" (rest text)))]
          [(get-atom text form)
           (set-atom text form)]
          nil)
      (re-find #"^\s*\(.*\)\s*$" text)
        [(read-parse text) nil]
      :else
        (if-let [form (maybe-read text)]
          [(get-value text form)
           (set-value text form)]
          (let [p (ng-parse text)]
            [p (:assign p)])))))

(def assignable-parse-cache (atom {}))

(defn AssignableParseProvider []
  (assoc! (js* "this")
    :$get
    (fn []
      (fn [exp]
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
  (assoc! (js* "this")
    :$get
    (fn []
      (fn [exp]
        (cond
          (string? exp) (if-let [p (@read-parse-cache exp)]
                          p
                          (let [p (read-parse exp)]
                            (swap! read-parse-cache assoc exp p)
                            p))
          (fn? exp) exp
          :else (fn [& _])))))
  nil)

(def clang (module "clang"))

(def.provider clang $parse (AssignableParseProvider.))
(def.provider clang $readParse (ReadParseProvider.))
