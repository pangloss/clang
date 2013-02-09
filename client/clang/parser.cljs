(ns clang.parser
  (:use [clang.util :only [? ! module]])
  (:require-macros
    [clang.angular :refer [fn-symbol-map]]))

(def functions (fn-symbol-map count str))

(defn exec-list [sym args]
  (if-let [f (functions (name sym))]
    (do
      (? "-->" [sym args])
      (if args
        (apply f args)
        (f)))
    (str (apply list sym args))))

(defn context-eval [parser form context]
  (cond
    (list? form) (exec-list (first form) (when-let [form (next form)]
                                           (map #(context-eval parser % context) form)))
    (symbol? form) (or ((parser (name form)) context)
                       form)
    :else form))

(defn keyword-eval [kw context]
  (? "kwe" [kw context])
  (str kw))
