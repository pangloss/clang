(ns clang.core
  (:require-macros [clang.angular :refer [fnj controller]])
  (:require clang.todo
            [clang.util :refer [module]]))


(def angular (.-angular js/window))

