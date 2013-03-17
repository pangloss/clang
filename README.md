# clang

ClojureScript well integrated with the [AngularJS](http://angularjs.org/) framework.

## What?

Clang includes an unmodified current release of AngularJS. It allows you
to use ClojureScript data structures throughout your angular app and
simplifies writing your controllers and directives, etc according to
Angular's best practices. Clang integrates ClojureScript into all of
Angular's built-in directives.

## How?

Clang defines a new $parse provider which is injected throughout Angular
and used wherever Angular reads any properties from the scope. It also
replaces the Angular $interpolate provider to enable the same thing in
{{interpolated}} blocks in your app.

Those two changes enable all of Angular's built in directives to work
with ClojureScript except for the ng-repeat which assumes Javascript
arrays. Clang's clang-repeat fills that gap.

## Show me

Here are a couple of bits of code clipped from the sample index.html

This bit calls the `remaining` function from the scope and applies the
built-in `count` function to the `todos` vector:

```html
      <span>{{(remaining)}} of {{(count todos)}} remaining</span>
      [ <a ng-click="(archive)">archive</a> ]
```

The relevant controller definitions:

```clojure
(def.controller m TodoCtrl [$scope]
  (scope! todos [{:text "learn angular" :done "yes"}
                 {:text "learn cljs" :done "yes"}
                 {:text "build an app" :done "no"}])
  (defn.scope remaining []
    (->>
      (scope! todos)
      (map :done)
      (remove #{"yes"})
      count)))
```

Here's a slightly silly but kind of awesome example of building a table:

```html
      <table>
        <tr clang-repeat="group in (drop 1 (partition 3 nums))">
          <td clang-repeat="x in (map (juxt identity odd?) group)">
            {{(first x)}} is {{(if (last x) "odd" "even")}}
          </td>
        </tr>
      </table>
```

The relevant controller definitions:

```clojure
(def.controller m TodoCtrl [$scope]
  (scope! nums (range 1 10)))
```

## Leiningen Dependency

Clang has not yet been released on clojars, but you can use it as a
dependency by checking out the repo and adding a symlink to it under the
magic checkouts folder in your project. See
[this](http://stackoverflow.com/questions/8335709/how-can-i-set-up-leiningen-to-work-with-multiple-projects)
discussion for details.

```
[clang "0.1.0-SNAPSHOT"]
```

## Try The Sample

```
lein cljsbuild auto dev
open resources/public/index.html
```

## License

Copyright © 2013 Darrick Wiebe

Distributed under the Eclipse Public License, the same as Clojure.
