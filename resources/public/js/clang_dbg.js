var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__122070 = x == null ? null : x;
  if(p[goog.typeOf(x__122070)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__122071__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__122071 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122071__delegate.call(this, array, i, idxs)
    };
    G__122071.cljs$lang$maxFixedArity = 2;
    G__122071.cljs$lang$applyTo = function(arglist__122072) {
      var array = cljs.core.first(arglist__122072);
      var i = cljs.core.first(cljs.core.next(arglist__122072));
      var idxs = cljs.core.rest(cljs.core.next(arglist__122072));
      return G__122071__delegate(array, i, idxs)
    };
    G__122071.cljs$lang$arity$variadic = G__122071__delegate;
    return G__122071
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.Fn = {};
void 0;
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____122136 = this$;
      if(and__3822__auto____122136) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____122136
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____122137 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122137) {
          return or__3824__auto____122137
        }else {
          var or__3824__auto____122138 = cljs.core._invoke["_"];
          if(or__3824__auto____122138) {
            return or__3824__auto____122138
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____122139 = this$;
      if(and__3822__auto____122139) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____122139
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____122140 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122140) {
          return or__3824__auto____122140
        }else {
          var or__3824__auto____122141 = cljs.core._invoke["_"];
          if(or__3824__auto____122141) {
            return or__3824__auto____122141
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____122142 = this$;
      if(and__3822__auto____122142) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____122142
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____122143 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122143) {
          return or__3824__auto____122143
        }else {
          var or__3824__auto____122144 = cljs.core._invoke["_"];
          if(or__3824__auto____122144) {
            return or__3824__auto____122144
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____122145 = this$;
      if(and__3822__auto____122145) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____122145
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____122146 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122146) {
          return or__3824__auto____122146
        }else {
          var or__3824__auto____122147 = cljs.core._invoke["_"];
          if(or__3824__auto____122147) {
            return or__3824__auto____122147
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____122148 = this$;
      if(and__3822__auto____122148) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____122148
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____122149 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122149) {
          return or__3824__auto____122149
        }else {
          var or__3824__auto____122150 = cljs.core._invoke["_"];
          if(or__3824__auto____122150) {
            return or__3824__auto____122150
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____122151 = this$;
      if(and__3822__auto____122151) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____122151
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____122152 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122152) {
          return or__3824__auto____122152
        }else {
          var or__3824__auto____122153 = cljs.core._invoke["_"];
          if(or__3824__auto____122153) {
            return or__3824__auto____122153
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____122154 = this$;
      if(and__3822__auto____122154) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____122154
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____122155 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122155) {
          return or__3824__auto____122155
        }else {
          var or__3824__auto____122156 = cljs.core._invoke["_"];
          if(or__3824__auto____122156) {
            return or__3824__auto____122156
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____122157 = this$;
      if(and__3822__auto____122157) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____122157
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____122158 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122158) {
          return or__3824__auto____122158
        }else {
          var or__3824__auto____122159 = cljs.core._invoke["_"];
          if(or__3824__auto____122159) {
            return or__3824__auto____122159
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____122160 = this$;
      if(and__3822__auto____122160) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____122160
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____122161 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122161) {
          return or__3824__auto____122161
        }else {
          var or__3824__auto____122162 = cljs.core._invoke["_"];
          if(or__3824__auto____122162) {
            return or__3824__auto____122162
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____122163 = this$;
      if(and__3822__auto____122163) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____122163
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____122164 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122164) {
          return or__3824__auto____122164
        }else {
          var or__3824__auto____122165 = cljs.core._invoke["_"];
          if(or__3824__auto____122165) {
            return or__3824__auto____122165
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____122166 = this$;
      if(and__3822__auto____122166) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____122166
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____122167 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122167) {
          return or__3824__auto____122167
        }else {
          var or__3824__auto____122168 = cljs.core._invoke["_"];
          if(or__3824__auto____122168) {
            return or__3824__auto____122168
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____122169 = this$;
      if(and__3822__auto____122169) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____122169
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____122170 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122170) {
          return or__3824__auto____122170
        }else {
          var or__3824__auto____122171 = cljs.core._invoke["_"];
          if(or__3824__auto____122171) {
            return or__3824__auto____122171
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____122172 = this$;
      if(and__3822__auto____122172) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____122172
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____122173 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122173) {
          return or__3824__auto____122173
        }else {
          var or__3824__auto____122174 = cljs.core._invoke["_"];
          if(or__3824__auto____122174) {
            return or__3824__auto____122174
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____122175 = this$;
      if(and__3822__auto____122175) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____122175
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____122176 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122176) {
          return or__3824__auto____122176
        }else {
          var or__3824__auto____122177 = cljs.core._invoke["_"];
          if(or__3824__auto____122177) {
            return or__3824__auto____122177
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____122178 = this$;
      if(and__3822__auto____122178) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____122178
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____122179 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122179) {
          return or__3824__auto____122179
        }else {
          var or__3824__auto____122180 = cljs.core._invoke["_"];
          if(or__3824__auto____122180) {
            return or__3824__auto____122180
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____122181 = this$;
      if(and__3822__auto____122181) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____122181
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____122182 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122182) {
          return or__3824__auto____122182
        }else {
          var or__3824__auto____122183 = cljs.core._invoke["_"];
          if(or__3824__auto____122183) {
            return or__3824__auto____122183
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____122184 = this$;
      if(and__3822__auto____122184) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____122184
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____122185 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122185) {
          return or__3824__auto____122185
        }else {
          var or__3824__auto____122186 = cljs.core._invoke["_"];
          if(or__3824__auto____122186) {
            return or__3824__auto____122186
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____122187 = this$;
      if(and__3822__auto____122187) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____122187
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____122188 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122188) {
          return or__3824__auto____122188
        }else {
          var or__3824__auto____122189 = cljs.core._invoke["_"];
          if(or__3824__auto____122189) {
            return or__3824__auto____122189
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____122190 = this$;
      if(and__3822__auto____122190) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____122190
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____122191 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122191) {
          return or__3824__auto____122191
        }else {
          var or__3824__auto____122192 = cljs.core._invoke["_"];
          if(or__3824__auto____122192) {
            return or__3824__auto____122192
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____122193 = this$;
      if(and__3822__auto____122193) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____122193
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____122194 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122194) {
          return or__3824__auto____122194
        }else {
          var or__3824__auto____122195 = cljs.core._invoke["_"];
          if(or__3824__auto____122195) {
            return or__3824__auto____122195
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____122196 = this$;
      if(and__3822__auto____122196) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____122196
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____122197 = cljs.core._invoke[goog.typeOf(this$)];
        if(or__3824__auto____122197) {
          return or__3824__auto____122197
        }else {
          var or__3824__auto____122198 = cljs.core._invoke["_"];
          if(or__3824__auto____122198) {
            return or__3824__auto____122198
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____122202 = coll;
    if(and__3822__auto____122202) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____122202
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122203 = cljs.core._count[goog.typeOf(coll)];
      if(or__3824__auto____122203) {
        return or__3824__auto____122203
      }else {
        var or__3824__auto____122204 = cljs.core._count["_"];
        if(or__3824__auto____122204) {
          return or__3824__auto____122204
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____122208 = coll;
    if(and__3822__auto____122208) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____122208
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122209 = cljs.core._empty[goog.typeOf(coll)];
      if(or__3824__auto____122209) {
        return or__3824__auto____122209
      }else {
        var or__3824__auto____122210 = cljs.core._empty["_"];
        if(or__3824__auto____122210) {
          return or__3824__auto____122210
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____122214 = coll;
    if(and__3822__auto____122214) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____122214
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____122215 = cljs.core._conj[goog.typeOf(coll)];
      if(or__3824__auto____122215) {
        return or__3824__auto____122215
      }else {
        var or__3824__auto____122216 = cljs.core._conj["_"];
        if(or__3824__auto____122216) {
          return or__3824__auto____122216
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____122223 = coll;
      if(and__3822__auto____122223) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____122223
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____122224 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3824__auto____122224) {
          return or__3824__auto____122224
        }else {
          var or__3824__auto____122225 = cljs.core._nth["_"];
          if(or__3824__auto____122225) {
            return or__3824__auto____122225
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____122226 = coll;
      if(and__3822__auto____122226) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____122226
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____122227 = cljs.core._nth[goog.typeOf(coll)];
        if(or__3824__auto____122227) {
          return or__3824__auto____122227
        }else {
          var or__3824__auto____122228 = cljs.core._nth["_"];
          if(or__3824__auto____122228) {
            return or__3824__auto____122228
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____122232 = coll;
    if(and__3822__auto____122232) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____122232
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122233 = cljs.core._first[goog.typeOf(coll)];
      if(or__3824__auto____122233) {
        return or__3824__auto____122233
      }else {
        var or__3824__auto____122234 = cljs.core._first["_"];
        if(or__3824__auto____122234) {
          return or__3824__auto____122234
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____122238 = coll;
    if(and__3822__auto____122238) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____122238
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122239 = cljs.core._rest[goog.typeOf(coll)];
      if(or__3824__auto____122239) {
        return or__3824__auto____122239
      }else {
        var or__3824__auto____122240 = cljs.core._rest["_"];
        if(or__3824__auto____122240) {
          return or__3824__auto____122240
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto____122244 = coll;
    if(and__3822__auto____122244) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto____122244
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122245 = cljs.core._next[goog.typeOf(coll)];
      if(or__3824__auto____122245) {
        return or__3824__auto____122245
      }else {
        var or__3824__auto____122246 = cljs.core._next["_"];
        if(or__3824__auto____122246) {
          return or__3824__auto____122246
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____122253 = o;
      if(and__3822__auto____122253) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____122253
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____122254 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3824__auto____122254) {
          return or__3824__auto____122254
        }else {
          var or__3824__auto____122255 = cljs.core._lookup["_"];
          if(or__3824__auto____122255) {
            return or__3824__auto____122255
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____122256 = o;
      if(and__3822__auto____122256) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____122256
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____122257 = cljs.core._lookup[goog.typeOf(o)];
        if(or__3824__auto____122257) {
          return or__3824__auto____122257
        }else {
          var or__3824__auto____122258 = cljs.core._lookup["_"];
          if(or__3824__auto____122258) {
            return or__3824__auto____122258
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____122262 = coll;
    if(and__3822__auto____122262) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____122262
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____122263 = cljs.core._contains_key_QMARK_[goog.typeOf(coll)];
      if(or__3824__auto____122263) {
        return or__3824__auto____122263
      }else {
        var or__3824__auto____122264 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____122264) {
          return or__3824__auto____122264
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____122268 = coll;
    if(and__3822__auto____122268) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____122268
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____122269 = cljs.core._assoc[goog.typeOf(coll)];
      if(or__3824__auto____122269) {
        return or__3824__auto____122269
      }else {
        var or__3824__auto____122270 = cljs.core._assoc["_"];
        if(or__3824__auto____122270) {
          return or__3824__auto____122270
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____122274 = coll;
    if(and__3822__auto____122274) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____122274
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____122275 = cljs.core._dissoc[goog.typeOf(coll)];
      if(or__3824__auto____122275) {
        return or__3824__auto____122275
      }else {
        var or__3824__auto____122276 = cljs.core._dissoc["_"];
        if(or__3824__auto____122276) {
          return or__3824__auto____122276
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____122280 = coll;
    if(and__3822__auto____122280) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____122280
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122281 = cljs.core._key[goog.typeOf(coll)];
      if(or__3824__auto____122281) {
        return or__3824__auto____122281
      }else {
        var or__3824__auto____122282 = cljs.core._key["_"];
        if(or__3824__auto____122282) {
          return or__3824__auto____122282
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____122286 = coll;
    if(and__3822__auto____122286) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____122286
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122287 = cljs.core._val[goog.typeOf(coll)];
      if(or__3824__auto____122287) {
        return or__3824__auto____122287
      }else {
        var or__3824__auto____122288 = cljs.core._val["_"];
        if(or__3824__auto____122288) {
          return or__3824__auto____122288
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____122292 = coll;
    if(and__3822__auto____122292) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____122292
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____122293 = cljs.core._disjoin[goog.typeOf(coll)];
      if(or__3824__auto____122293) {
        return or__3824__auto____122293
      }else {
        var or__3824__auto____122294 = cljs.core._disjoin["_"];
        if(or__3824__auto____122294) {
          return or__3824__auto____122294
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____122298 = coll;
    if(and__3822__auto____122298) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____122298
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122299 = cljs.core._peek[goog.typeOf(coll)];
      if(or__3824__auto____122299) {
        return or__3824__auto____122299
      }else {
        var or__3824__auto____122300 = cljs.core._peek["_"];
        if(or__3824__auto____122300) {
          return or__3824__auto____122300
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____122304 = coll;
    if(and__3822__auto____122304) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____122304
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122305 = cljs.core._pop[goog.typeOf(coll)];
      if(or__3824__auto____122305) {
        return or__3824__auto____122305
      }else {
        var or__3824__auto____122306 = cljs.core._pop["_"];
        if(or__3824__auto____122306) {
          return or__3824__auto____122306
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____122310 = coll;
    if(and__3822__auto____122310) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____122310
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____122311 = cljs.core._assoc_n[goog.typeOf(coll)];
      if(or__3824__auto____122311) {
        return or__3824__auto____122311
      }else {
        var or__3824__auto____122312 = cljs.core._assoc_n["_"];
        if(or__3824__auto____122312) {
          return or__3824__auto____122312
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____122316 = o;
    if(and__3822__auto____122316) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____122316
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____122317 = cljs.core._deref[goog.typeOf(o)];
      if(or__3824__auto____122317) {
        return or__3824__auto____122317
      }else {
        var or__3824__auto____122318 = cljs.core._deref["_"];
        if(or__3824__auto____122318) {
          return or__3824__auto____122318
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____122322 = o;
    if(and__3822__auto____122322) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____122322
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____122323 = cljs.core._deref_with_timeout[goog.typeOf(o)];
      if(or__3824__auto____122323) {
        return or__3824__auto____122323
      }else {
        var or__3824__auto____122324 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____122324) {
          return or__3824__auto____122324
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____122328 = o;
    if(and__3822__auto____122328) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____122328
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____122329 = cljs.core._meta[goog.typeOf(o)];
      if(or__3824__auto____122329) {
        return or__3824__auto____122329
      }else {
        var or__3824__auto____122330 = cljs.core._meta["_"];
        if(or__3824__auto____122330) {
          return or__3824__auto____122330
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____122334 = o;
    if(and__3822__auto____122334) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____122334
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____122335 = cljs.core._with_meta[goog.typeOf(o)];
      if(or__3824__auto____122335) {
        return or__3824__auto____122335
      }else {
        var or__3824__auto____122336 = cljs.core._with_meta["_"];
        if(or__3824__auto____122336) {
          return or__3824__auto____122336
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____122343 = coll;
      if(and__3822__auto____122343) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____122343
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____122344 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3824__auto____122344) {
          return or__3824__auto____122344
        }else {
          var or__3824__auto____122345 = cljs.core._reduce["_"];
          if(or__3824__auto____122345) {
            return or__3824__auto____122345
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____122346 = coll;
      if(and__3822__auto____122346) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____122346
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____122347 = cljs.core._reduce[goog.typeOf(coll)];
        if(or__3824__auto____122347) {
          return or__3824__auto____122347
        }else {
          var or__3824__auto____122348 = cljs.core._reduce["_"];
          if(or__3824__auto____122348) {
            return or__3824__auto____122348
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____122352 = coll;
    if(and__3822__auto____122352) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____122352
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____122353 = cljs.core._kv_reduce[goog.typeOf(coll)];
      if(or__3824__auto____122353) {
        return or__3824__auto____122353
      }else {
        var or__3824__auto____122354 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____122354) {
          return or__3824__auto____122354
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____122358 = o;
    if(and__3822__auto____122358) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____122358
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____122359 = cljs.core._equiv[goog.typeOf(o)];
      if(or__3824__auto____122359) {
        return or__3824__auto____122359
      }else {
        var or__3824__auto____122360 = cljs.core._equiv["_"];
        if(or__3824__auto____122360) {
          return or__3824__auto____122360
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____122364 = o;
    if(and__3822__auto____122364) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____122364
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____122365 = cljs.core._hash[goog.typeOf(o)];
      if(or__3824__auto____122365) {
        return or__3824__auto____122365
      }else {
        var or__3824__auto____122366 = cljs.core._hash["_"];
        if(or__3824__auto____122366) {
          return or__3824__auto____122366
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____122370 = o;
    if(and__3822__auto____122370) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____122370
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____122371 = cljs.core._seq[goog.typeOf(o)];
      if(or__3824__auto____122371) {
        return or__3824__auto____122371
      }else {
        var or__3824__auto____122372 = cljs.core._seq["_"];
        if(or__3824__auto____122372) {
          return or__3824__auto____122372
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____122376 = coll;
    if(and__3822__auto____122376) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____122376
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122377 = cljs.core._rseq[goog.typeOf(coll)];
      if(or__3824__auto____122377) {
        return or__3824__auto____122377
      }else {
        var or__3824__auto____122378 = cljs.core._rseq["_"];
        if(or__3824__auto____122378) {
          return or__3824__auto____122378
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____122382 = coll;
    if(and__3822__auto____122382) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____122382
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____122383 = cljs.core._sorted_seq[goog.typeOf(coll)];
      if(or__3824__auto____122383) {
        return or__3824__auto____122383
      }else {
        var or__3824__auto____122384 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____122384) {
          return or__3824__auto____122384
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____122388 = coll;
    if(and__3822__auto____122388) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____122388
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____122389 = cljs.core._sorted_seq_from[goog.typeOf(coll)];
      if(or__3824__auto____122389) {
        return or__3824__auto____122389
      }else {
        var or__3824__auto____122390 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____122390) {
          return or__3824__auto____122390
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____122394 = coll;
    if(and__3822__auto____122394) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____122394
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____122395 = cljs.core._entry_key[goog.typeOf(coll)];
      if(or__3824__auto____122395) {
        return or__3824__auto____122395
      }else {
        var or__3824__auto____122396 = cljs.core._entry_key["_"];
        if(or__3824__auto____122396) {
          return or__3824__auto____122396
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____122400 = coll;
    if(and__3822__auto____122400) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____122400
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122401 = cljs.core._comparator[goog.typeOf(coll)];
      if(or__3824__auto____122401) {
        return or__3824__auto____122401
      }else {
        var or__3824__auto____122402 = cljs.core._comparator["_"];
        if(or__3824__auto____122402) {
          return or__3824__auto____122402
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____122406 = o;
    if(and__3822__auto____122406) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____122406
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____122407 = cljs.core._pr_seq[goog.typeOf(o)];
      if(or__3824__auto____122407) {
        return or__3824__auto____122407
      }else {
        var or__3824__auto____122408 = cljs.core._pr_seq["_"];
        if(or__3824__auto____122408) {
          return or__3824__auto____122408
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3822__auto____122412 = writer;
    if(and__3822__auto____122412) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3822__auto____122412
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    return function() {
      var or__3824__auto____122413 = cljs.core._write[goog.typeOf(writer)];
      if(or__3824__auto____122413) {
        return or__3824__auto____122413
      }else {
        var or__3824__auto____122414 = cljs.core._write["_"];
        if(or__3824__auto____122414) {
          return or__3824__auto____122414
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3822__auto____122418 = writer;
    if(and__3822__auto____122418) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3822__auto____122418
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    return function() {
      var or__3824__auto____122419 = cljs.core._flush[goog.typeOf(writer)];
      if(or__3824__auto____122419) {
        return or__3824__auto____122419
      }else {
        var or__3824__auto____122420 = cljs.core._flush["_"];
        if(or__3824__auto____122420) {
          return or__3824__auto____122420
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
void 0;
void 0;
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3822__auto____122424 = o;
    if(and__3822__auto____122424) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3822__auto____122424
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    return function() {
      var or__3824__auto____122425 = cljs.core._pr_writer[goog.typeOf(o)];
      if(or__3824__auto____122425) {
        return or__3824__auto____122425
      }else {
        var or__3824__auto____122426 = cljs.core._pr_writer["_"];
        if(or__3824__auto____122426) {
          return or__3824__auto____122426
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____122430 = d;
    if(and__3822__auto____122430) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____122430
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____122431 = cljs.core._realized_QMARK_[goog.typeOf(d)];
      if(or__3824__auto____122431) {
        return or__3824__auto____122431
      }else {
        var or__3824__auto____122432 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____122432) {
          return or__3824__auto____122432
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____122436 = this$;
    if(and__3822__auto____122436) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____122436
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____122437 = cljs.core._notify_watches[goog.typeOf(this$)];
      if(or__3824__auto____122437) {
        return or__3824__auto____122437
      }else {
        var or__3824__auto____122438 = cljs.core._notify_watches["_"];
        if(or__3824__auto____122438) {
          return or__3824__auto____122438
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____122442 = this$;
    if(and__3822__auto____122442) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____122442
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____122443 = cljs.core._add_watch[goog.typeOf(this$)];
      if(or__3824__auto____122443) {
        return or__3824__auto____122443
      }else {
        var or__3824__auto____122444 = cljs.core._add_watch["_"];
        if(or__3824__auto____122444) {
          return or__3824__auto____122444
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____122448 = this$;
    if(and__3822__auto____122448) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____122448
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____122449 = cljs.core._remove_watch[goog.typeOf(this$)];
      if(or__3824__auto____122449) {
        return or__3824__auto____122449
      }else {
        var or__3824__auto____122450 = cljs.core._remove_watch["_"];
        if(or__3824__auto____122450) {
          return or__3824__auto____122450
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____122454 = coll;
    if(and__3822__auto____122454) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____122454
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122455 = cljs.core._as_transient[goog.typeOf(coll)];
      if(or__3824__auto____122455) {
        return or__3824__auto____122455
      }else {
        var or__3824__auto____122456 = cljs.core._as_transient["_"];
        if(or__3824__auto____122456) {
          return or__3824__auto____122456
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____122460 = tcoll;
    if(and__3822__auto____122460) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____122460
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____122461 = cljs.core._conj_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122461) {
        return or__3824__auto____122461
      }else {
        var or__3824__auto____122462 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____122462) {
          return or__3824__auto____122462
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____122466 = tcoll;
    if(and__3822__auto____122466) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____122466
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____122467 = cljs.core._persistent_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122467) {
        return or__3824__auto____122467
      }else {
        var or__3824__auto____122468 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____122468) {
          return or__3824__auto____122468
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____122472 = tcoll;
    if(and__3822__auto____122472) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____122472
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____122473 = cljs.core._assoc_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122473) {
        return or__3824__auto____122473
      }else {
        var or__3824__auto____122474 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____122474) {
          return or__3824__auto____122474
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____122478 = tcoll;
    if(and__3822__auto____122478) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____122478
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____122479 = cljs.core._dissoc_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122479) {
        return or__3824__auto____122479
      }else {
        var or__3824__auto____122480 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____122480) {
          return or__3824__auto____122480
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____122484 = tcoll;
    if(and__3822__auto____122484) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____122484
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____122485 = cljs.core._assoc_n_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122485) {
        return or__3824__auto____122485
      }else {
        var or__3824__auto____122486 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____122486) {
          return or__3824__auto____122486
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____122490 = tcoll;
    if(and__3822__auto____122490) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____122490
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____122491 = cljs.core._pop_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122491) {
        return or__3824__auto____122491
      }else {
        var or__3824__auto____122492 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____122492) {
          return or__3824__auto____122492
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____122496 = tcoll;
    if(and__3822__auto____122496) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____122496
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____122497 = cljs.core._disjoin_BANG_[goog.typeOf(tcoll)];
      if(or__3824__auto____122497) {
        return or__3824__auto____122497
      }else {
        var or__3824__auto____122498 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____122498) {
          return or__3824__auto____122498
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
void 0;
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto____122502 = x;
    if(and__3822__auto____122502) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto____122502
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    return function() {
      var or__3824__auto____122503 = cljs.core._compare[goog.typeOf(x)];
      if(or__3824__auto____122503) {
        return or__3824__auto____122503
      }else {
        var or__3824__auto____122504 = cljs.core._compare["_"];
        if(or__3824__auto____122504) {
          return or__3824__auto____122504
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
void 0;
void 0;
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto____122508 = coll;
    if(and__3822__auto____122508) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto____122508
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122509 = cljs.core._drop_first[goog.typeOf(coll)];
      if(or__3824__auto____122509) {
        return or__3824__auto____122509
      }else {
        var or__3824__auto____122510 = cljs.core._drop_first["_"];
        if(or__3824__auto____122510) {
          return or__3824__auto____122510
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto____122514 = coll;
    if(and__3822__auto____122514) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto____122514
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122515 = cljs.core._chunked_first[goog.typeOf(coll)];
      if(or__3824__auto____122515) {
        return or__3824__auto____122515
      }else {
        var or__3824__auto____122516 = cljs.core._chunked_first["_"];
        if(or__3824__auto____122516) {
          return or__3824__auto____122516
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto____122520 = coll;
    if(and__3822__auto____122520) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto____122520
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122521 = cljs.core._chunked_rest[goog.typeOf(coll)];
      if(or__3824__auto____122521) {
        return or__3824__auto____122521
      }else {
        var or__3824__auto____122522 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____122522) {
          return or__3824__auto____122522
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto____122526 = coll;
    if(and__3822__auto____122526) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto____122526
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____122527 = cljs.core._chunked_next[goog.typeOf(coll)];
      if(or__3824__auto____122527) {
        return or__3824__auto____122527
      }else {
        var or__3824__auto____122528 = cljs.core._chunked_next["_"];
        if(or__3824__auto____122528) {
          return or__3824__auto____122528
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__122532__122533 = coll;
      if(G__122532__122533) {
        if(function() {
          var or__3824__auto____122534 = G__122532__122533.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____122534) {
            return or__3824__auto____122534
          }else {
            return G__122532__122533.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__122532__122533.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__122532__122533)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__122532__122533)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__122539__122540 = coll;
      if(G__122539__122540) {
        if(function() {
          var or__3824__auto____122541 = G__122539__122540.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____122541) {
            return or__3824__auto____122541
          }else {
            return G__122539__122540.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__122539__122540.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__122539__122540)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__122539__122540)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__122542 = cljs.core.seq.call(null, coll);
      if(s__122542 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__122542)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__122547__122548 = coll;
      if(G__122547__122548) {
        if(function() {
          var or__3824__auto____122549 = G__122547__122548.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____122549) {
            return or__3824__auto____122549
          }else {
            return G__122547__122548.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__122547__122548.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__122547__122548)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__122547__122548)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__122550 = cljs.core.seq.call(null, coll);
      if(!(s__122550 == null)) {
        return cljs.core._rest.call(null, s__122550)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__122554__122555 = coll;
      if(G__122554__122555) {
        if(function() {
          var or__3824__auto____122556 = G__122554__122555.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto____122556) {
            return or__3824__auto____122556
          }else {
            return G__122554__122555.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__122554__122555.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__122554__122555)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__122554__122555)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____122558 = x === y;
    if(or__3824__auto____122558) {
      return or__3824__auto____122558
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__122559__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__122560 = y;
            var G__122561 = cljs.core.first.call(null, more);
            var G__122562 = cljs.core.next.call(null, more);
            x = G__122560;
            y = G__122561;
            more = G__122562;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__122559 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122559__delegate.call(this, x, y, more)
    };
    G__122559.cljs$lang$maxFixedArity = 2;
    G__122559.cljs$lang$applyTo = function(arglist__122563) {
      var x = cljs.core.first(arglist__122563);
      var y = cljs.core.first(cljs.core.next(arglist__122563));
      var more = cljs.core.rest(cljs.core.next(arglist__122563));
      return G__122559__delegate(x, y, more)
    };
    G__122559.cljs$lang$arity$variadic = G__122559__delegate;
    return G__122559
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__122564 = null;
  var G__122564__2 = function(o, k) {
    return null
  };
  var G__122564__3 = function(o, k, not_found) {
    return not_found
  };
  G__122564 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__122564__2.call(this, o, k);
      case 3:
        return G__122564__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__122564
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IPrintWithWriter["null"] = true;
cljs.core._pr_writer["null"] = function(o, writer, _) {
  return cljs.core._write.call(null, writer, "nil")
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__122565 = null;
  var G__122565__2 = function(_, f) {
    return f.call(null)
  };
  var G__122565__3 = function(_, f, start) {
    return start
  };
  G__122565 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__122565__2.call(this, _, f);
      case 3:
        return G__122565__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__122565
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__122566 = null;
  var G__122566__2 = function(_, n) {
    return null
  };
  var G__122566__3 = function(_, n, not_found) {
    return not_found
  };
  G__122566 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__122566__2.call(this, _, n);
      case 3:
        return G__122566__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__122566
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto____122567 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto____122567) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto____122567
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return cljs.core.js_mod.call(null, Math.floor(o), 2147483647)
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
void 0;
cljs.core.IWithMeta["function"] = true;
cljs.core._with_meta["function"] = function(f, meta) {
  return cljs.core.with_meta.call(null, function() {
    if(void 0 === cljs.core.t122568) {
      cljs.core.t122568 = function(meta, f, meta122569) {
        this.meta = meta;
        this.f = f;
        this.meta122569 = meta122569;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393217
      };
      cljs.core.t122568.cljs$lang$type = true;
      cljs.core.t122568.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
        return cljs.core.list.call(null, "cljs.core/t122568")
      };
      cljs.core.t122568.prototype.call = function() {
        var G__122580__delegate = function(this_sym122573, args) {
          var this_sym122573__122575 = this;
          var ___122576 = this_sym122573__122575;
          return cljs.core.apply.call(null, this__122574.f, args)
        };
        var G__122580 = function(this_sym122573, var_args) {
          var this__122574 = this;
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
          }
          return G__122580__delegate.call(this, this_sym122573, args)
        };
        G__122580.cljs$lang$maxFixedArity = 1;
        G__122580.cljs$lang$applyTo = function(arglist__122581) {
          var this_sym122573 = cljs.core.first(arglist__122581);
          var args = cljs.core.rest(arglist__122581);
          return G__122580__delegate(this_sym122573, args)
        };
        G__122580.cljs$lang$arity$variadic = G__122580__delegate;
        return G__122580
      }();
      cljs.core.t122568.prototype.apply = function(this_sym122571, args122572) {
        var this__122577 = this;
        return this_sym122571.call.apply(this_sym122571, [this_sym122571].concat(args122572.slice()))
      };
      cljs.core.t122568.prototype.cljs$core$Fn$ = true;
      cljs.core.t122568.prototype.cljs$core$IMeta$_meta$arity$1 = function(_122570) {
        var this__122578 = this;
        return this__122578.meta122569
      };
      cljs.core.t122568.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_122570, meta122569) {
        var this__122579 = this;
        return new cljs.core.t122568(this__122579.meta, this__122579.f, meta122569)
      };
      cljs.core.t122568
    }else {
    }
    return new cljs.core.t122568(meta, f, null)
  }(), meta)
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__122582 = this;
  return this__122582.val
};
cljs.core.Reduced;
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__122595 = cljs.core._count.call(null, cicoll);
    if(cnt__122595 === 0) {
      return f.call(null)
    }else {
      var val__122596 = cljs.core._nth.call(null, cicoll, 0);
      var n__122597 = 1;
      while(true) {
        if(n__122597 < cnt__122595) {
          var nval__122598 = f.call(null, val__122596, cljs.core._nth.call(null, cicoll, n__122597));
          if(cljs.core.reduced_QMARK_.call(null, nval__122598)) {
            return cljs.core.deref.call(null, nval__122598)
          }else {
            var G__122607 = nval__122598;
            var G__122608 = n__122597 + 1;
            val__122596 = G__122607;
            n__122597 = G__122608;
            continue
          }
        }else {
          return val__122596
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__122599 = cljs.core._count.call(null, cicoll);
    var val__122600 = val;
    var n__122601 = 0;
    while(true) {
      if(n__122601 < cnt__122599) {
        var nval__122602 = f.call(null, val__122600, cljs.core._nth.call(null, cicoll, n__122601));
        if(cljs.core.reduced_QMARK_.call(null, nval__122602)) {
          return cljs.core.deref.call(null, nval__122602)
        }else {
          var G__122609 = nval__122602;
          var G__122610 = n__122601 + 1;
          val__122600 = G__122609;
          n__122601 = G__122610;
          continue
        }
      }else {
        return val__122600
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__122603 = cljs.core._count.call(null, cicoll);
    var val__122604 = val;
    var n__122605 = idx;
    while(true) {
      if(n__122605 < cnt__122603) {
        var nval__122606 = f.call(null, val__122604, cljs.core._nth.call(null, cicoll, n__122605));
        if(cljs.core.reduced_QMARK_.call(null, nval__122606)) {
          return cljs.core.deref.call(null, nval__122606)
        }else {
          var G__122611 = nval__122606;
          var G__122612 = n__122605 + 1;
          val__122604 = G__122611;
          n__122605 = G__122612;
          continue
        }
      }else {
        return val__122604
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__122625 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__122626 = arr[0];
      var n__122627 = 1;
      while(true) {
        if(n__122627 < cnt__122625) {
          var nval__122628 = f.call(null, val__122626, arr[n__122627]);
          if(cljs.core.reduced_QMARK_.call(null, nval__122628)) {
            return cljs.core.deref.call(null, nval__122628)
          }else {
            var G__122637 = nval__122628;
            var G__122638 = n__122627 + 1;
            val__122626 = G__122637;
            n__122627 = G__122638;
            continue
          }
        }else {
          return val__122626
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__122629 = arr.length;
    var val__122630 = val;
    var n__122631 = 0;
    while(true) {
      if(n__122631 < cnt__122629) {
        var nval__122632 = f.call(null, val__122630, arr[n__122631]);
        if(cljs.core.reduced_QMARK_.call(null, nval__122632)) {
          return cljs.core.deref.call(null, nval__122632)
        }else {
          var G__122639 = nval__122632;
          var G__122640 = n__122631 + 1;
          val__122630 = G__122639;
          n__122631 = G__122640;
          continue
        }
      }else {
        return val__122630
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__122633 = arr.length;
    var val__122634 = val;
    var n__122635 = idx;
    while(true) {
      if(n__122635 < cnt__122633) {
        var nval__122636 = f.call(null, val__122634, arr[n__122635]);
        if(cljs.core.reduced_QMARK_.call(null, nval__122636)) {
          return cljs.core.deref.call(null, nval__122636)
        }else {
          var G__122641 = nval__122636;
          var G__122642 = n__122635 + 1;
          val__122634 = G__122641;
          n__122635 = G__122642;
          continue
        }
      }else {
        return val__122634
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__122646__122647 = x;
  if(G__122646__122647) {
    if(function() {
      var or__3824__auto____122648 = G__122646__122647.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____122648) {
        return or__3824__auto____122648
      }else {
        return G__122646__122647.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__122646__122647.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__122646__122647)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__122646__122647)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__122652__122653 = x;
  if(G__122652__122653) {
    if(function() {
      var or__3824__auto____122654 = G__122652__122653.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____122654) {
        return or__3824__auto____122654
      }else {
        return G__122652__122653.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__122652__122653.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__122652__122653)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__122652__122653)
  }
};
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__122655 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__122656 = this;
  if(this__122656.i + 1 < this__122656.a.length) {
    return new cljs.core.IndexedSeq(this__122656.a, this__122656.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__122657 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__122658 = this;
  var c__122659 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__122659 > 0) {
    return new cljs.core.RSeq(coll, c__122659 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__122660 = this;
  var this__122661 = this;
  return cljs.core.pr_str.call(null, this__122661)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__122662 = this;
  if(cljs.core.counted_QMARK_.call(null, this__122662.a)) {
    return cljs.core.ci_reduce.call(null, this__122662.a, f, this__122662.a[this__122662.i], this__122662.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__122662.a[this__122662.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__122663 = this;
  if(cljs.core.counted_QMARK_.call(null, this__122663.a)) {
    return cljs.core.ci_reduce.call(null, this__122663.a, f, start, this__122663.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__122664 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__122665 = this;
  return this__122665.a.length - this__122665.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__122666 = this;
  return this__122666.a[this__122666.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__122667 = this;
  if(this__122667.i + 1 < this__122667.a.length) {
    return new cljs.core.IndexedSeq(this__122667.a, this__122667.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__122668 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__122669 = this;
  var i__122670 = n + this__122669.i;
  if(i__122670 < this__122669.a.length) {
    return this__122669.a[i__122670]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__122671 = this;
  var i__122672 = n + this__122671.i;
  if(i__122672 < this__122671.a.length) {
    return this__122671.a[i__122672]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__122673 = this;
  return cljs.core.List.EMPTY
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__122674 = null;
  var G__122674__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__122674__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__122674 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__122674__2.call(this, array, f);
      case 3:
        return G__122674__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__122674
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__122675 = null;
  var G__122675__2 = function(array, k) {
    return array[k]
  };
  var G__122675__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__122675 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__122675__2.call(this, array, k);
      case 3:
        return G__122675__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__122675
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__122676 = null;
  var G__122676__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__122676__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__122676 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__122676__2.call(this, array, n);
      case 3:
        return G__122676__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__122676
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
void 0;
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__122677 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__122678 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__122679 = this;
  var this__122680 = this;
  return cljs.core.pr_str.call(null, this__122680)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__122681 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__122682 = this;
  return this__122682.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__122683 = this;
  return cljs.core._nth.call(null, this__122683.ci, this__122683.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__122684 = this;
  if(this__122684.i > 0) {
    return new cljs.core.RSeq(this__122684.ci, this__122684.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__122685 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__122686 = this;
  return new cljs.core.RSeq(this__122686.ci, this__122686.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__122687 = this;
  return this__122687.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__122688 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__122688.meta)
};
cljs.core.RSeq;
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__122690 = cljs.core.next.call(null, s);
    if(!(sn__122690 == null)) {
      var G__122691 = sn__122690;
      s = G__122691;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__122692__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__122693 = conj.call(null, coll, x);
          var G__122694 = cljs.core.first.call(null, xs);
          var G__122695 = cljs.core.next.call(null, xs);
          coll = G__122693;
          x = G__122694;
          xs = G__122695;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__122692 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122692__delegate.call(this, coll, x, xs)
    };
    G__122692.cljs$lang$maxFixedArity = 2;
    G__122692.cljs$lang$applyTo = function(arglist__122696) {
      var coll = cljs.core.first(arglist__122696);
      var x = cljs.core.first(cljs.core.next(arglist__122696));
      var xs = cljs.core.rest(cljs.core.next(arglist__122696));
      return G__122692__delegate(coll, x, xs)
    };
    G__122692.cljs$lang$arity$variadic = G__122692__delegate;
    return G__122692
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__122699 = cljs.core.seq.call(null, coll);
  var acc__122700 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__122699)) {
      return acc__122700 + cljs.core._count.call(null, s__122699)
    }else {
      var G__122701 = cljs.core.next.call(null, s__122699);
      var G__122702 = acc__122700 + 1;
      s__122699 = G__122701;
      acc__122700 = G__122702;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__122703 = cljs.core.next.call(null, coll);
              var G__122704 = n - 1;
              coll = G__122703;
              n = G__122704;
              continue
            }else {
              if("\ufdd0'else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__122705 = cljs.core.next.call(null, coll);
              var G__122706 = n - 1;
              var G__122707 = not_found;
              coll = G__122705;
              n = G__122706;
              not_found = G__122707;
              continue
            }else {
              if("\ufdd0'else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__122714__122715 = coll;
        if(G__122714__122715) {
          if(function() {
            var or__3824__auto____122716 = G__122714__122715.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____122716) {
              return or__3824__auto____122716
            }else {
              return G__122714__122715.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__122714__122715.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__122714__122715)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__122714__122715)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__122717__122718 = coll;
        if(G__122717__122718) {
          if(function() {
            var or__3824__auto____122719 = G__122717__122718.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____122719) {
              return or__3824__auto____122719
            }else {
              return G__122717__122718.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__122717__122718.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__122717__122718)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__122717__122718)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__122722__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__122721 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__122723 = ret__122721;
          var G__122724 = cljs.core.first.call(null, kvs);
          var G__122725 = cljs.core.second.call(null, kvs);
          var G__122726 = cljs.core.nnext.call(null, kvs);
          coll = G__122723;
          k = G__122724;
          v = G__122725;
          kvs = G__122726;
          continue
        }else {
          return ret__122721
        }
        break
      }
    };
    var G__122722 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__122722__delegate.call(this, coll, k, v, kvs)
    };
    G__122722.cljs$lang$maxFixedArity = 3;
    G__122722.cljs$lang$applyTo = function(arglist__122727) {
      var coll = cljs.core.first(arglist__122727);
      var k = cljs.core.first(cljs.core.next(arglist__122727));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__122727)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__122727)));
      return G__122722__delegate(coll, k, v, kvs)
    };
    G__122722.cljs$lang$arity$variadic = G__122722__delegate;
    return G__122722
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__122730__delegate = function(coll, k, ks) {
      while(true) {
        var ret__122729 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__122731 = ret__122729;
          var G__122732 = cljs.core.first.call(null, ks);
          var G__122733 = cljs.core.next.call(null, ks);
          coll = G__122731;
          k = G__122732;
          ks = G__122733;
          continue
        }else {
          return ret__122729
        }
        break
      }
    };
    var G__122730 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122730__delegate.call(this, coll, k, ks)
    };
    G__122730.cljs$lang$maxFixedArity = 2;
    G__122730.cljs$lang$applyTo = function(arglist__122734) {
      var coll = cljs.core.first(arglist__122734);
      var k = cljs.core.first(cljs.core.next(arglist__122734));
      var ks = cljs.core.rest(cljs.core.next(arglist__122734));
      return G__122730__delegate(coll, k, ks)
    };
    G__122730.cljs$lang$arity$variadic = G__122730__delegate;
    return G__122730
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__122738__122739 = o;
    if(G__122738__122739) {
      if(function() {
        var or__3824__auto____122740 = G__122738__122739.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto____122740) {
          return or__3824__auto____122740
        }else {
          return G__122738__122739.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__122738__122739.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__122738__122739)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__122738__122739)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__122743__delegate = function(coll, k, ks) {
      while(true) {
        var ret__122742 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__122744 = ret__122742;
          var G__122745 = cljs.core.first.call(null, ks);
          var G__122746 = cljs.core.next.call(null, ks);
          coll = G__122744;
          k = G__122745;
          ks = G__122746;
          continue
        }else {
          return ret__122742
        }
        break
      }
    };
    var G__122743 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122743__delegate.call(this, coll, k, ks)
    };
    G__122743.cljs$lang$maxFixedArity = 2;
    G__122743.cljs$lang$applyTo = function(arglist__122747) {
      var coll = cljs.core.first(arglist__122747);
      var k = cljs.core.first(cljs.core.next(arglist__122747));
      var ks = cljs.core.rest(cljs.core.next(arglist__122747));
      return G__122743__delegate(coll, k, ks)
    };
    G__122743.cljs$lang$arity$variadic = G__122743__delegate;
    return G__122743
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__122749 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__122749;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__122749
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__122751 = cljs.core.string_hash_cache[k];
  if(!(h__122751 == null)) {
    return h__122751
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto____122753 = goog.isString(o);
      if(and__3822__auto____122753) {
        return check_cache
      }else {
        return and__3822__auto____122753
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3824__auto____122755 = coll == null;
  if(or__3824__auto____122755) {
    return or__3824__auto____122755
  }else {
    return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__122759__122760 = x;
    if(G__122759__122760) {
      if(function() {
        var or__3824__auto____122761 = G__122759__122760.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____122761) {
          return or__3824__auto____122761
        }else {
          return G__122759__122760.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__122759__122760.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__122759__122760)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__122759__122760)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__122765__122766 = x;
    if(G__122765__122766) {
      if(function() {
        var or__3824__auto____122767 = G__122765__122766.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto____122767) {
          return or__3824__auto____122767
        }else {
          return G__122765__122766.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__122765__122766.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__122765__122766)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__122765__122766)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__122771__122772 = x;
  if(G__122771__122772) {
    if(function() {
      var or__3824__auto____122773 = G__122771__122772.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto____122773) {
        return or__3824__auto____122773
      }else {
        return G__122771__122772.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__122771__122772.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__122771__122772)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__122771__122772)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__122777__122778 = x;
  if(G__122777__122778) {
    if(function() {
      var or__3824__auto____122779 = G__122777__122778.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____122779) {
        return or__3824__auto____122779
      }else {
        return G__122777__122778.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__122777__122778.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__122777__122778)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__122777__122778)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__122783__122784 = x;
  if(G__122783__122784) {
    if(function() {
      var or__3824__auto____122785 = G__122783__122784.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto____122785) {
        return or__3824__auto____122785
      }else {
        return G__122783__122784.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__122783__122784.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__122783__122784)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__122783__122784)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__122789__122790 = x;
    if(G__122789__122790) {
      if(function() {
        var or__3824__auto____122791 = G__122789__122790.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto____122791) {
          return or__3824__auto____122791
        }else {
          return G__122789__122790.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__122789__122790.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__122789__122790)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__122789__122790)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__122795__122796 = x;
  if(G__122795__122796) {
    if(function() {
      var or__3824__auto____122797 = G__122795__122796.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto____122797) {
        return or__3824__auto____122797
      }else {
        return G__122795__122796.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__122795__122796.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__122795__122796)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__122795__122796)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__122801__122802 = x;
  if(G__122801__122802) {
    if(cljs.core.truth_(function() {
      var or__3824__auto____122803 = null;
      if(cljs.core.truth_(or__3824__auto____122803)) {
        return or__3824__auto____122803
      }else {
        return G__122801__122802.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__122801__122802.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__122801__122802)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__122801__122802)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__122804__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__122804 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__122804__delegate.call(this, keyvals)
    };
    G__122804.cljs$lang$maxFixedArity = 0;
    G__122804.cljs$lang$applyTo = function(arglist__122805) {
      var keyvals = cljs.core.seq(arglist__122805);
      return G__122804__delegate(keyvals)
    };
    G__122804.cljs$lang$arity$variadic = G__122804__delegate;
    return G__122804
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__122807 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__122807.push(key)
  });
  return keys__122807
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__122811 = i;
  var j__122812 = j;
  var len__122813 = len;
  while(true) {
    if(len__122813 === 0) {
      return to
    }else {
      to[j__122812] = from[i__122811];
      var G__122814 = i__122811 + 1;
      var G__122815 = j__122812 + 1;
      var G__122816 = len__122813 - 1;
      i__122811 = G__122814;
      j__122812 = G__122815;
      len__122813 = G__122816;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__122820 = i + (len - 1);
  var j__122821 = j + (len - 1);
  var len__122822 = len;
  while(true) {
    if(len__122822 === 0) {
      return to
    }else {
      to[j__122821] = from[i__122820];
      var G__122823 = i__122820 - 1;
      var G__122824 = j__122821 - 1;
      var G__122825 = len__122822 - 1;
      i__122820 = G__122823;
      j__122821 = G__122824;
      len__122822 = G__122825;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__122829__122830 = s;
    if(G__122829__122830) {
      if(function() {
        var or__3824__auto____122831 = G__122829__122830.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____122831) {
          return or__3824__auto____122831
        }else {
          return G__122829__122830.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__122829__122830.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__122829__122830)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__122829__122830)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__122835__122836 = s;
  if(G__122835__122836) {
    if(function() {
      var or__3824__auto____122837 = G__122835__122836.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____122837) {
        return or__3824__auto____122837
      }else {
        return G__122835__122836.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__122835__122836.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__122835__122836)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__122835__122836)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____122840 = goog.isString(x);
  if(and__3822__auto____122840) {
    return!function() {
      var or__3824__auto____122841 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____122841) {
        return or__3824__auto____122841
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto____122840
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____122843 = goog.isString(x);
  if(and__3822__auto____122843) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____122843
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____122845 = goog.isString(x);
  if(and__3822__auto____122845) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____122845
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3824__auto____122850 = goog.isFunction(f);
  if(or__3824__auto____122850) {
    return or__3824__auto____122850
  }else {
    var G__122851__122852 = f;
    if(G__122851__122852) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____122853 = null;
        if(cljs.core.truth_(or__3824__auto____122853)) {
          return or__3824__auto____122853
        }else {
          return G__122851__122852.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__122851__122852.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__122851__122852)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__122851__122852)
    }
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____122858 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____122858) {
    return or__3824__auto____122858
  }else {
    var G__122859__122860 = f;
    if(G__122859__122860) {
      if(function() {
        var or__3824__auto____122861 = G__122859__122860.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____122861) {
          return or__3824__auto____122861
        }else {
          return G__122859__122860.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__122859__122860.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__122859__122860)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__122859__122860)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____122865 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____122865) {
    var and__3822__auto____122866 = !isNaN(n);
    if(and__3822__auto____122866) {
      var and__3822__auto____122867 = !(n === Infinity);
      if(and__3822__auto____122867) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3822__auto____122867
      }
    }else {
      return and__3822__auto____122866
    }
  }else {
    return and__3822__auto____122865
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3822__auto____122870 = !(coll == null);
    if(and__3822__auto____122870) {
      var and__3822__auto____122871 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____122871) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____122871
      }
    }else {
      return and__3822__auto____122870
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__122880__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__122876 = cljs.core.set([y, x]);
        var xs__122877 = more;
        while(true) {
          var x__122878 = cljs.core.first.call(null, xs__122877);
          var etc__122879 = cljs.core.next.call(null, xs__122877);
          if(cljs.core.truth_(xs__122877)) {
            if(cljs.core.contains_QMARK_.call(null, s__122876, x__122878)) {
              return false
            }else {
              var G__122881 = cljs.core.conj.call(null, s__122876, x__122878);
              var G__122882 = etc__122879;
              s__122876 = G__122881;
              xs__122877 = G__122882;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__122880 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122880__delegate.call(this, x, y, more)
    };
    G__122880.cljs$lang$maxFixedArity = 2;
    G__122880.cljs$lang$applyTo = function(arglist__122883) {
      var x = cljs.core.first(arglist__122883);
      var y = cljs.core.first(cljs.core.next(arglist__122883));
      var more = cljs.core.rest(cljs.core.next(arglist__122883));
      return G__122880__delegate(x, y, more)
    };
    G__122880.cljs$lang$arity$variadic = G__122880__delegate;
    return G__122880
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__122887__122888 = x;
            if(G__122887__122888) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____122889 = null;
                if(cljs.core.truth_(or__3824__auto____122889)) {
                  return or__3824__auto____122889
                }else {
                  return G__122887__122888.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__122887__122888.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__122887__122888)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__122887__122888)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__122894 = cljs.core.count.call(null, xs);
    var yl__122895 = cljs.core.count.call(null, ys);
    if(xl__122894 < yl__122895) {
      return-1
    }else {
      if(xl__122894 > yl__122895) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__122894, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__122896 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto____122897 = d__122896 === 0;
        if(and__3822__auto____122897) {
          return n + 1 < len
        }else {
          return and__3822__auto____122897
        }
      }()) {
        var G__122898 = xs;
        var G__122899 = ys;
        var G__122900 = len;
        var G__122901 = n + 1;
        xs = G__122898;
        ys = G__122899;
        len = G__122900;
        n = G__122901;
        continue
      }else {
        return d__122896
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__122903 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__122903)) {
        return r__122903
      }else {
        if(cljs.core.truth_(r__122903)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__122905 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__122905, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__122905)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____122911 = cljs.core.seq.call(null, coll);
    if(temp__3971__auto____122911) {
      var s__122912 = temp__3971__auto____122911;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__122912), cljs.core.next.call(null, s__122912))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__122913 = val;
    var coll__122914 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__122914) {
        var nval__122915 = f.call(null, val__122913, cljs.core.first.call(null, coll__122914));
        if(cljs.core.reduced_QMARK_.call(null, nval__122915)) {
          return cljs.core.deref.call(null, nval__122915)
        }else {
          var G__122916 = nval__122915;
          var G__122917 = cljs.core.next.call(null, coll__122914);
          val__122913 = G__122916;
          coll__122914 = G__122917;
          continue
        }
      }else {
        return val__122913
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
void 0;
cljs.core.shuffle = function shuffle(coll) {
  var a__122919 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__122919);
  return cljs.core.vec.call(null, a__122919)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__122926__122927 = coll;
      if(G__122926__122927) {
        if(function() {
          var or__3824__auto____122928 = G__122926__122927.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____122928) {
            return or__3824__auto____122928
          }else {
            return G__122926__122927.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__122926__122927.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__122926__122927)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__122926__122927)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__122929__122930 = coll;
      if(G__122929__122930) {
        if(function() {
          var or__3824__auto____122931 = G__122929__122930.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto____122931) {
            return or__3824__auto____122931
          }else {
            return G__122929__122930.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__122929__122930.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__122929__122930)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__122929__122930)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__122932__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__122932 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122932__delegate.call(this, x, y, more)
    };
    G__122932.cljs$lang$maxFixedArity = 2;
    G__122932.cljs$lang$applyTo = function(arglist__122933) {
      var x = cljs.core.first(arglist__122933);
      var y = cljs.core.first(cljs.core.next(arglist__122933));
      var more = cljs.core.rest(cljs.core.next(arglist__122933));
      return G__122932__delegate(x, y, more)
    };
    G__122932.cljs$lang$arity$variadic = G__122932__delegate;
    return G__122932
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__122934__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__122934 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122934__delegate.call(this, x, y, more)
    };
    G__122934.cljs$lang$maxFixedArity = 2;
    G__122934.cljs$lang$applyTo = function(arglist__122935) {
      var x = cljs.core.first(arglist__122935);
      var y = cljs.core.first(cljs.core.next(arglist__122935));
      var more = cljs.core.rest(cljs.core.next(arglist__122935));
      return G__122934__delegate(x, y, more)
    };
    G__122934.cljs$lang$arity$variadic = G__122934__delegate;
    return G__122934
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__122936__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__122936 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122936__delegate.call(this, x, y, more)
    };
    G__122936.cljs$lang$maxFixedArity = 2;
    G__122936.cljs$lang$applyTo = function(arglist__122937) {
      var x = cljs.core.first(arglist__122937);
      var y = cljs.core.first(cljs.core.next(arglist__122937));
      var more = cljs.core.rest(cljs.core.next(arglist__122937));
      return G__122936__delegate(x, y, more)
    };
    G__122936.cljs$lang$arity$variadic = G__122936__delegate;
    return G__122936
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__122938__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__122938 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122938__delegate.call(this, x, y, more)
    };
    G__122938.cljs$lang$maxFixedArity = 2;
    G__122938.cljs$lang$applyTo = function(arglist__122939) {
      var x = cljs.core.first(arglist__122939);
      var y = cljs.core.first(cljs.core.next(arglist__122939));
      var more = cljs.core.rest(cljs.core.next(arglist__122939));
      return G__122938__delegate(x, y, more)
    };
    G__122938.cljs$lang$arity$variadic = G__122938__delegate;
    return G__122938
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__122940__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__122941 = y;
            var G__122942 = cljs.core.first.call(null, more);
            var G__122943 = cljs.core.next.call(null, more);
            x = G__122941;
            y = G__122942;
            more = G__122943;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__122940 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122940__delegate.call(this, x, y, more)
    };
    G__122940.cljs$lang$maxFixedArity = 2;
    G__122940.cljs$lang$applyTo = function(arglist__122944) {
      var x = cljs.core.first(arglist__122944);
      var y = cljs.core.first(cljs.core.next(arglist__122944));
      var more = cljs.core.rest(cljs.core.next(arglist__122944));
      return G__122940__delegate(x, y, more)
    };
    G__122940.cljs$lang$arity$variadic = G__122940__delegate;
    return G__122940
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__122945__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__122946 = y;
            var G__122947 = cljs.core.first.call(null, more);
            var G__122948 = cljs.core.next.call(null, more);
            x = G__122946;
            y = G__122947;
            more = G__122948;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__122945 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122945__delegate.call(this, x, y, more)
    };
    G__122945.cljs$lang$maxFixedArity = 2;
    G__122945.cljs$lang$applyTo = function(arglist__122949) {
      var x = cljs.core.first(arglist__122949);
      var y = cljs.core.first(cljs.core.next(arglist__122949));
      var more = cljs.core.rest(cljs.core.next(arglist__122949));
      return G__122945__delegate(x, y, more)
    };
    G__122945.cljs$lang$arity$variadic = G__122945__delegate;
    return G__122945
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__122950__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__122951 = y;
            var G__122952 = cljs.core.first.call(null, more);
            var G__122953 = cljs.core.next.call(null, more);
            x = G__122951;
            y = G__122952;
            more = G__122953;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__122950 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122950__delegate.call(this, x, y, more)
    };
    G__122950.cljs$lang$maxFixedArity = 2;
    G__122950.cljs$lang$applyTo = function(arglist__122954) {
      var x = cljs.core.first(arglist__122954);
      var y = cljs.core.first(cljs.core.next(arglist__122954));
      var more = cljs.core.rest(cljs.core.next(arglist__122954));
      return G__122950__delegate(x, y, more)
    };
    G__122950.cljs$lang$arity$variadic = G__122950__delegate;
    return G__122950
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__122955__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__122956 = y;
            var G__122957 = cljs.core.first.call(null, more);
            var G__122958 = cljs.core.next.call(null, more);
            x = G__122956;
            y = G__122957;
            more = G__122958;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__122955 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122955__delegate.call(this, x, y, more)
    };
    G__122955.cljs$lang$maxFixedArity = 2;
    G__122955.cljs$lang$applyTo = function(arglist__122959) {
      var x = cljs.core.first(arglist__122959);
      var y = cljs.core.first(cljs.core.next(arglist__122959));
      var more = cljs.core.rest(cljs.core.next(arglist__122959));
      return G__122955__delegate(x, y, more)
    };
    G__122955.cljs$lang$arity$variadic = G__122955__delegate;
    return G__122955
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__122960__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__122960 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122960__delegate.call(this, x, y, more)
    };
    G__122960.cljs$lang$maxFixedArity = 2;
    G__122960.cljs$lang$applyTo = function(arglist__122961) {
      var x = cljs.core.first(arglist__122961);
      var y = cljs.core.first(cljs.core.next(arglist__122961));
      var more = cljs.core.rest(cljs.core.next(arglist__122961));
      return G__122960__delegate(x, y, more)
    };
    G__122960.cljs$lang$arity$variadic = G__122960__delegate;
    return G__122960
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__122962__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__122962 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122962__delegate.call(this, x, y, more)
    };
    G__122962.cljs$lang$maxFixedArity = 2;
    G__122962.cljs$lang$applyTo = function(arglist__122963) {
      var x = cljs.core.first(arglist__122963);
      var y = cljs.core.first(cljs.core.next(arglist__122963));
      var more = cljs.core.rest(cljs.core.next(arglist__122963));
      return G__122962__delegate(x, y, more)
    };
    G__122962.cljs$lang$arity$variadic = G__122962__delegate;
    return G__122962
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.js_mod = function js_mod(n, d) {
  return cljs.core.js_mod.call(null, n, d)
};
cljs.core.mod = function mod(n, d) {
  return cljs.core.js_mod.call(null, cljs.core.js_mod.call(null, n, d) + d, d)
};
cljs.core.quot = function quot(n, d) {
  var rem__122965 = cljs.core.js_mod.call(null, n, d);
  return cljs.core.fix.call(null, (n - rem__122965) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__122967 = cljs.core.quot.call(null, n, d);
  return n - d * q__122967
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__122970 = v - (v >> 1 & 1431655765);
  var v__122971 = (v__122970 & 858993459) + (v__122970 >> 2 & 858993459);
  return(v__122971 + (v__122971 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__122972__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__122973 = y;
            var G__122974 = cljs.core.first.call(null, more);
            var G__122975 = cljs.core.next.call(null, more);
            x = G__122973;
            y = G__122974;
            more = G__122975;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__122972 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__122972__delegate.call(this, x, y, more)
    };
    G__122972.cljs$lang$maxFixedArity = 2;
    G__122972.cljs$lang$applyTo = function(arglist__122976) {
      var x = cljs.core.first(arglist__122976);
      var y = cljs.core.first(cljs.core.next(arglist__122976));
      var more = cljs.core.rest(cljs.core.next(arglist__122976));
      return G__122972__delegate(x, y, more)
    };
    G__122972.cljs$lang$arity$variadic = G__122972__delegate;
    return G__122972
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__122980 = n;
  var xs__122981 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____122982 = xs__122981;
      if(and__3822__auto____122982) {
        return n__122980 > 0
      }else {
        return and__3822__auto____122982
      }
    }())) {
      var G__122983 = n__122980 - 1;
      var G__122984 = cljs.core.next.call(null, xs__122981);
      n__122980 = G__122983;
      xs__122981 = G__122984;
      continue
    }else {
      return xs__122981
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__122985__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__122986 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__122987 = cljs.core.next.call(null, more);
            sb = G__122986;
            more = G__122987;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__122985 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__122985__delegate.call(this, x, ys)
    };
    G__122985.cljs$lang$maxFixedArity = 1;
    G__122985.cljs$lang$applyTo = function(arglist__122988) {
      var x = cljs.core.first(arglist__122988);
      var ys = cljs.core.rest(arglist__122988);
      return G__122985__delegate(x, ys)
    };
    G__122985.cljs$lang$arity$variadic = G__122985__delegate;
    return G__122985
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__122989__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__122990 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__122991 = cljs.core.next.call(null, more);
            sb = G__122990;
            more = G__122991;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__122989 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__122989__delegate.call(this, x, ys)
    };
    G__122989.cljs$lang$maxFixedArity = 1;
    G__122989.cljs$lang$applyTo = function(arglist__122992) {
      var x = cljs.core.first(arglist__122992);
      var ys = cljs.core.rest(arglist__122992);
      return G__122989__delegate(x, ys)
    };
    G__122989.cljs$lang$arity$variadic = G__122989__delegate;
    return G__122989
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
void 0;
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__122996 = cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3824__auto____122995 = cljs.core.keyword_QMARK_.call(null, x);
        if(or__3824__auto____122995) {
          return or__3824__auto____122995
        }else {
          return cljs.core.symbol_QMARK_.call(null, x)
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.call(null, goog.string.format, fmt, args__122996)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__122997) {
    var fmt = cljs.core.first(arglist__122997);
    var args = cljs.core.rest(arglist__122997);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", ":", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", ":", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__123000 = cljs.core.seq.call(null, x);
    var ys__123001 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__123000 == null) {
        return ys__123001 == null
      }else {
        if(ys__123001 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__123000), cljs.core.first.call(null, ys__123001))) {
            var G__123002 = cljs.core.next.call(null, xs__123000);
            var G__123003 = cljs.core.next.call(null, ys__123001);
            xs__123000 = G__123002;
            ys__123001 = G__123003;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__123004_SHARP_, p2__123005_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__123004_SHARP_, cljs.core.hash.call(null, p2__123005_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__123009 = 0;
  var s__123010 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__123010) {
      var e__123011 = cljs.core.first.call(null, s__123010);
      var G__123012 = cljs.core.js_mod.call(null, h__123009 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__123011)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__123011))), 4503599627370496);
      var G__123013 = cljs.core.next.call(null, s__123010);
      h__123009 = G__123012;
      s__123010 = G__123013;
      continue
    }else {
      return h__123009
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__123017 = 0;
  var s__123018 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__123018) {
      var e__123019 = cljs.core.first.call(null, s__123018);
      var G__123020 = cljs.core.js_mod.call(null, h__123017 + cljs.core.hash.call(null, e__123019), 4503599627370496);
      var G__123021 = cljs.core.next.call(null, s__123018);
      h__123017 = G__123020;
      s__123018 = G__123021;
      continue
    }else {
      return h__123017
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__123042__123043 = cljs.core.seq.call(null, fn_map);
  if(G__123042__123043) {
    var G__123045__123047 = cljs.core.first.call(null, G__123042__123043);
    var vec__123046__123048 = G__123045__123047;
    var key_name__123049 = cljs.core.nth.call(null, vec__123046__123048, 0, null);
    var f__123050 = cljs.core.nth.call(null, vec__123046__123048, 1, null);
    var G__123042__123051 = G__123042__123043;
    var G__123045__123052 = G__123045__123047;
    var G__123042__123053 = G__123042__123051;
    while(true) {
      var vec__123054__123055 = G__123045__123052;
      var key_name__123056 = cljs.core.nth.call(null, vec__123054__123055, 0, null);
      var f__123057 = cljs.core.nth.call(null, vec__123054__123055, 1, null);
      var G__123042__123058 = G__123042__123053;
      var str_name__123059 = cljs.core.name.call(null, key_name__123056);
      obj[str_name__123059] = f__123057;
      var temp__3974__auto____123060 = cljs.core.next.call(null, G__123042__123058);
      if(temp__3974__auto____123060) {
        var G__123042__123061 = temp__3974__auto____123060;
        var G__123062 = cljs.core.first.call(null, G__123042__123061);
        var G__123063 = G__123042__123061;
        G__123045__123052 = G__123062;
        G__123042__123053 = G__123063;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__123064 = this;
  var h__2202__auto____123065 = this__123064.__hash;
  if(!(h__2202__auto____123065 == null)) {
    return h__2202__auto____123065
  }else {
    var h__2202__auto____123066 = cljs.core.hash_coll.call(null, coll);
    this__123064.__hash = h__2202__auto____123066;
    return h__2202__auto____123066
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__123067 = this;
  if(this__123067.count === 1) {
    return null
  }else {
    return this__123067.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__123068 = this;
  return new cljs.core.List(this__123068.meta, o, coll, this__123068.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__123069 = this;
  var this__123070 = this;
  return cljs.core.pr_str.call(null, this__123070)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__123071 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__123072 = this;
  return this__123072.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__123073 = this;
  return this__123073.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__123074 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__123075 = this;
  return this__123075.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__123076 = this;
  if(this__123076.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__123076.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__123077 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__123078 = this;
  return new cljs.core.List(meta, this__123078.first, this__123078.rest, this__123078.count, this__123078.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__123079 = this;
  return this__123079.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__123080 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__123081 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__123082 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__123083 = this;
  return new cljs.core.List(this__123083.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__123084 = this;
  var this__123085 = this;
  return cljs.core.pr_str.call(null, this__123085)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__123086 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__123087 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__123088 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__123089 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__123090 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__123091 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__123092 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__123093 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__123094 = this;
  return this__123094.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__123095 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__123099__123100 = coll;
  if(G__123099__123100) {
    if(function() {
      var or__3824__auto____123101 = G__123099__123100.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto____123101) {
        return or__3824__auto____123101
      }else {
        return G__123099__123100.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__123099__123100.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__123099__123100)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__123099__123100)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__123102__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__123102 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__123102__delegate.call(this, x, y, z, items)
    };
    G__123102.cljs$lang$maxFixedArity = 3;
    G__123102.cljs$lang$applyTo = function(arglist__123103) {
      var x = cljs.core.first(arglist__123103);
      var y = cljs.core.first(cljs.core.next(arglist__123103));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123103)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123103)));
      return G__123102__delegate(x, y, z, items)
    };
    G__123102.cljs$lang$arity$variadic = G__123102__delegate;
    return G__123102
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__123104 = this;
  var h__2202__auto____123105 = this__123104.__hash;
  if(!(h__2202__auto____123105 == null)) {
    return h__2202__auto____123105
  }else {
    var h__2202__auto____123106 = cljs.core.hash_coll.call(null, coll);
    this__123104.__hash = h__2202__auto____123106;
    return h__2202__auto____123106
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__123107 = this;
  if(this__123107.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__123107.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__123108 = this;
  return new cljs.core.Cons(null, o, coll, this__123108.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__123109 = this;
  var this__123110 = this;
  return cljs.core.pr_str.call(null, this__123110)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__123111 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__123112 = this;
  return this__123112.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__123113 = this;
  if(this__123113.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__123113.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__123114 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__123115 = this;
  return new cljs.core.Cons(meta, this__123115.first, this__123115.rest, this__123115.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__123116 = this;
  return this__123116.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__123117 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__123117.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____123122 = coll == null;
    if(or__3824__auto____123122) {
      return or__3824__auto____123122
    }else {
      var G__123123__123124 = coll;
      if(G__123123__123124) {
        if(function() {
          var or__3824__auto____123125 = G__123123__123124.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____123125) {
            return or__3824__auto____123125
          }else {
            return G__123123__123124.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__123123__123124.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__123123__123124)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__123123__123124)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__123129__123130 = x;
  if(G__123129__123130) {
    if(function() {
      var or__3824__auto____123131 = G__123129__123130.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto____123131) {
        return or__3824__auto____123131
      }else {
        return G__123129__123130.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__123129__123130.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__123129__123130)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__123129__123130)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__123132 = null;
  var G__123132__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__123132__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__123132 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__123132__2.call(this, string, f);
      case 3:
        return G__123132__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__123132
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__123133 = null;
  var G__123133__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__123133__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__123133 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__123133__2.call(this, string, k);
      case 3:
        return G__123133__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__123133
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__123134 = null;
  var G__123134__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__123134__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__123134 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__123134__2.call(this, string, n);
      case 3:
        return G__123134__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__123134
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__123146 = null;
  var G__123146__2 = function(this_sym123137, coll) {
    var this__123139 = this;
    var this_sym123137__123140 = this;
    var ___123141 = this_sym123137__123140;
    if(coll == null) {
      return null
    }else {
      var strobj__123142 = coll.strobj;
      if(strobj__123142 == null) {
        return cljs.core._lookup.call(null, coll, this__123139.k, null)
      }else {
        return strobj__123142[this__123139.k]
      }
    }
  };
  var G__123146__3 = function(this_sym123138, coll, not_found) {
    var this__123139 = this;
    var this_sym123138__123143 = this;
    var ___123144 = this_sym123138__123143;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__123139.k, not_found)
    }
  };
  G__123146 = function(this_sym123138, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__123146__2.call(this, this_sym123138, coll);
      case 3:
        return G__123146__3.call(this, this_sym123138, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__123146
}();
cljs.core.Keyword.prototype.apply = function(this_sym123135, args123136) {
  var this__123145 = this;
  return this_sym123135.call.apply(this_sym123135, [this_sym123135].concat(args123136.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__123155 = null;
  var G__123155__2 = function(this_sym123149, coll) {
    var this_sym123149__123151 = this;
    var this__123152 = this_sym123149__123151;
    return cljs.core._lookup.call(null, coll, this__123152.toString(), null)
  };
  var G__123155__3 = function(this_sym123150, coll, not_found) {
    var this_sym123150__123153 = this;
    var this__123154 = this_sym123150__123153;
    return cljs.core._lookup.call(null, coll, this__123154.toString(), not_found)
  };
  G__123155 = function(this_sym123150, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__123155__2.call(this, this_sym123150, coll);
      case 3:
        return G__123155__3.call(this, this_sym123150, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__123155
}();
String.prototype.apply = function(this_sym123147, args123148) {
  return this_sym123147.call.apply(this_sym123147, [this_sym123147].concat(args123148.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__123157 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__123157
  }else {
    lazy_seq.x = x__123157.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__123158 = this;
  var h__2202__auto____123159 = this__123158.__hash;
  if(!(h__2202__auto____123159 == null)) {
    return h__2202__auto____123159
  }else {
    var h__2202__auto____123160 = cljs.core.hash_coll.call(null, coll);
    this__123158.__hash = h__2202__auto____123160;
    return h__2202__auto____123160
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__123161 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__123162 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__123163 = this;
  var this__123164 = this;
  return cljs.core.pr_str.call(null, this__123164)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__123165 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__123166 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__123167 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__123168 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__123169 = this;
  return new cljs.core.LazySeq(meta, this__123169.realized, this__123169.x, this__123169.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__123170 = this;
  return this__123170.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__123171 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__123171.meta)
};
cljs.core.LazySeq;
void 0;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__123172 = this;
  return this__123172.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__123173 = this;
  var ___123174 = this;
  this__123173.buf[this__123173.end] = o;
  return this__123173.end = this__123173.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__123175 = this;
  var ___123176 = this;
  var ret__123177 = new cljs.core.ArrayChunk(this__123175.buf, 0, this__123175.end);
  this__123175.buf = null;
  return ret__123177
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__123178 = this;
  return cljs.core.array_reduce.call(null, this__123178.arr, f, this__123178.arr[this__123178.off], this__123178.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__123179 = this;
  return cljs.core.array_reduce.call(null, this__123179.arr, f, start, this__123179.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__123180 = this;
  if(this__123180.off === this__123180.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__123180.arr, this__123180.off + 1, this__123180.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__123181 = this;
  return this__123181.arr[this__123181.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__123182 = this;
  if(function() {
    var and__3822__auto____123183 = i >= 0;
    if(and__3822__auto____123183) {
      return i < this__123182.end - this__123182.off
    }else {
      return and__3822__auto____123183
    }
  }()) {
    return this__123182.arr[this__123182.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__123184 = this;
  return this__123184.end - this__123184.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850604
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__123185 = this;
  var h__2202__auto____123186 = this__123185.__hash;
  if(!(h__2202__auto____123186 == null)) {
    return h__2202__auto____123186
  }else {
    var h__2202__auto____123187 = cljs.core.hash_coll.call(null, coll);
    this__123185.__hash = h__2202__auto____123187;
    return h__2202__auto____123187
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__123188 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__123189 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__123190 = this;
  return cljs.core._nth.call(null, this__123190.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__123191 = this;
  if(cljs.core._count.call(null, this__123191.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__123191.chunk), this__123191.more, this__123191.meta, null)
  }else {
    if(this__123191.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__123191.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__123192 = this;
  if(this__123192.more == null) {
    return null
  }else {
    return this__123192.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__123193 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__123194 = this;
  return new cljs.core.ChunkedCons(this__123194.chunk, this__123194.more, m, this__123194.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__123195 = this;
  return this__123195.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__123196 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__123196.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__123197 = this;
  return this__123197.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__123198 = this;
  if(this__123198.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__123198.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__123202__123203 = s;
    if(G__123202__123203) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____123204 = null;
        if(cljs.core.truth_(or__3824__auto____123204)) {
          return or__3824__auto____123204
        }else {
          return G__123202__123203.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__123202__123203.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__123202__123203)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__123202__123203)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__123207 = [];
  var s__123208 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__123208)) {
      ary__123207.push(cljs.core.first.call(null, s__123208));
      var G__123209 = cljs.core.next.call(null, s__123208);
      s__123208 = G__123209;
      continue
    }else {
      return ary__123207
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__123213 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__123214 = 0;
  var xs__123215 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__123215) {
      ret__123213[i__123214] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__123215));
      var G__123216 = i__123214 + 1;
      var G__123217 = cljs.core.next.call(null, xs__123215);
      i__123214 = G__123216;
      xs__123215 = G__123217;
      continue
    }else {
    }
    break
  }
  return ret__123213
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__123225 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__123226 = cljs.core.seq.call(null, init_val_or_seq);
      var i__123227 = 0;
      var s__123228 = s__123226;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____123229 = s__123228;
          if(and__3822__auto____123229) {
            return i__123227 < size
          }else {
            return and__3822__auto____123229
          }
        }())) {
          a__123225[i__123227] = cljs.core.first.call(null, s__123228);
          var G__123232 = i__123227 + 1;
          var G__123233 = cljs.core.next.call(null, s__123228);
          i__123227 = G__123232;
          s__123228 = G__123233;
          continue
        }else {
          return a__123225
        }
        break
      }
    }else {
      var n__2541__auto____123230 = size;
      var i__123231 = 0;
      while(true) {
        if(i__123231 < n__2541__auto____123230) {
          a__123225[i__123231] = init_val_or_seq;
          var G__123234 = i__123231 + 1;
          i__123231 = G__123234;
          continue
        }else {
        }
        break
      }
      return a__123225
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__123242 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__123243 = cljs.core.seq.call(null, init_val_or_seq);
      var i__123244 = 0;
      var s__123245 = s__123243;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____123246 = s__123245;
          if(and__3822__auto____123246) {
            return i__123244 < size
          }else {
            return and__3822__auto____123246
          }
        }())) {
          a__123242[i__123244] = cljs.core.first.call(null, s__123245);
          var G__123249 = i__123244 + 1;
          var G__123250 = cljs.core.next.call(null, s__123245);
          i__123244 = G__123249;
          s__123245 = G__123250;
          continue
        }else {
          return a__123242
        }
        break
      }
    }else {
      var n__2541__auto____123247 = size;
      var i__123248 = 0;
      while(true) {
        if(i__123248 < n__2541__auto____123247) {
          a__123242[i__123248] = init_val_or_seq;
          var G__123251 = i__123248 + 1;
          i__123248 = G__123251;
          continue
        }else {
        }
        break
      }
      return a__123242
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__123259 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__123260 = cljs.core.seq.call(null, init_val_or_seq);
      var i__123261 = 0;
      var s__123262 = s__123260;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____123263 = s__123262;
          if(and__3822__auto____123263) {
            return i__123261 < size
          }else {
            return and__3822__auto____123263
          }
        }())) {
          a__123259[i__123261] = cljs.core.first.call(null, s__123262);
          var G__123266 = i__123261 + 1;
          var G__123267 = cljs.core.next.call(null, s__123262);
          i__123261 = G__123266;
          s__123262 = G__123267;
          continue
        }else {
          return a__123259
        }
        break
      }
    }else {
      var n__2541__auto____123264 = size;
      var i__123265 = 0;
      while(true) {
        if(i__123265 < n__2541__auto____123264) {
          a__123259[i__123265] = init_val_or_seq;
          var G__123268 = i__123265 + 1;
          i__123265 = G__123268;
          continue
        }else {
        }
        break
      }
      return a__123259
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__123273 = s;
    var i__123274 = n;
    var sum__123275 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____123276 = i__123274 > 0;
        if(and__3822__auto____123276) {
          return cljs.core.seq.call(null, s__123273)
        }else {
          return and__3822__auto____123276
        }
      }())) {
        var G__123277 = cljs.core.next.call(null, s__123273);
        var G__123278 = i__123274 - 1;
        var G__123279 = sum__123275 + 1;
        s__123273 = G__123277;
        i__123274 = G__123278;
        sum__123275 = G__123279;
        continue
      }else {
        return sum__123275
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__123284 = cljs.core.seq.call(null, x);
      if(s__123284) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__123284)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__123284), concat.call(null, cljs.core.chunk_rest.call(null, s__123284), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__123284), concat.call(null, cljs.core.rest.call(null, s__123284), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__123288__delegate = function(x, y, zs) {
      var cat__123287 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__123286 = cljs.core.seq.call(null, xys);
          if(xys__123286) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__123286)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__123286), cat.call(null, cljs.core.chunk_rest.call(null, xys__123286), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__123286), cat.call(null, cljs.core.rest.call(null, xys__123286), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__123287.call(null, concat.call(null, x, y), zs)
    };
    var G__123288 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__123288__delegate.call(this, x, y, zs)
    };
    G__123288.cljs$lang$maxFixedArity = 2;
    G__123288.cljs$lang$applyTo = function(arglist__123289) {
      var x = cljs.core.first(arglist__123289);
      var y = cljs.core.first(cljs.core.next(arglist__123289));
      var zs = cljs.core.rest(cljs.core.next(arglist__123289));
      return G__123288__delegate(x, y, zs)
    };
    G__123288.cljs$lang$arity$variadic = G__123288__delegate;
    return G__123288
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__123290__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__123290 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__123290__delegate.call(this, a, b, c, d, more)
    };
    G__123290.cljs$lang$maxFixedArity = 4;
    G__123290.cljs$lang$applyTo = function(arglist__123291) {
      var a = cljs.core.first(arglist__123291);
      var b = cljs.core.first(cljs.core.next(arglist__123291));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123291)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123291))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123291))));
      return G__123290__delegate(a, b, c, d, more)
    };
    G__123290.cljs$lang$arity$variadic = G__123290__delegate;
    return G__123290
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__123333 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__123334 = cljs.core._first.call(null, args__123333);
    var args__123335 = cljs.core._rest.call(null, args__123333);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__123334)
      }else {
        return f.call(null, a__123334)
      }
    }else {
      var b__123336 = cljs.core._first.call(null, args__123335);
      var args__123337 = cljs.core._rest.call(null, args__123335);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__123334, b__123336)
        }else {
          return f.call(null, a__123334, b__123336)
        }
      }else {
        var c__123338 = cljs.core._first.call(null, args__123337);
        var args__123339 = cljs.core._rest.call(null, args__123337);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__123334, b__123336, c__123338)
          }else {
            return f.call(null, a__123334, b__123336, c__123338)
          }
        }else {
          var d__123340 = cljs.core._first.call(null, args__123339);
          var args__123341 = cljs.core._rest.call(null, args__123339);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__123334, b__123336, c__123338, d__123340)
            }else {
              return f.call(null, a__123334, b__123336, c__123338, d__123340)
            }
          }else {
            var e__123342 = cljs.core._first.call(null, args__123341);
            var args__123343 = cljs.core._rest.call(null, args__123341);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__123334, b__123336, c__123338, d__123340, e__123342)
              }else {
                return f.call(null, a__123334, b__123336, c__123338, d__123340, e__123342)
              }
            }else {
              var f__123344 = cljs.core._first.call(null, args__123343);
              var args__123345 = cljs.core._rest.call(null, args__123343);
              if(argc === 6) {
                if(f__123344.cljs$lang$arity$6) {
                  return f__123344.cljs$lang$arity$6(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344)
                }else {
                  return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344)
                }
              }else {
                var g__123346 = cljs.core._first.call(null, args__123345);
                var args__123347 = cljs.core._rest.call(null, args__123345);
                if(argc === 7) {
                  if(f__123344.cljs$lang$arity$7) {
                    return f__123344.cljs$lang$arity$7(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346)
                  }else {
                    return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346)
                  }
                }else {
                  var h__123348 = cljs.core._first.call(null, args__123347);
                  var args__123349 = cljs.core._rest.call(null, args__123347);
                  if(argc === 8) {
                    if(f__123344.cljs$lang$arity$8) {
                      return f__123344.cljs$lang$arity$8(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348)
                    }else {
                      return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348)
                    }
                  }else {
                    var i__123350 = cljs.core._first.call(null, args__123349);
                    var args__123351 = cljs.core._rest.call(null, args__123349);
                    if(argc === 9) {
                      if(f__123344.cljs$lang$arity$9) {
                        return f__123344.cljs$lang$arity$9(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350)
                      }else {
                        return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350)
                      }
                    }else {
                      var j__123352 = cljs.core._first.call(null, args__123351);
                      var args__123353 = cljs.core._rest.call(null, args__123351);
                      if(argc === 10) {
                        if(f__123344.cljs$lang$arity$10) {
                          return f__123344.cljs$lang$arity$10(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352)
                        }else {
                          return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352)
                        }
                      }else {
                        var k__123354 = cljs.core._first.call(null, args__123353);
                        var args__123355 = cljs.core._rest.call(null, args__123353);
                        if(argc === 11) {
                          if(f__123344.cljs$lang$arity$11) {
                            return f__123344.cljs$lang$arity$11(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354)
                          }else {
                            return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354)
                          }
                        }else {
                          var l__123356 = cljs.core._first.call(null, args__123355);
                          var args__123357 = cljs.core._rest.call(null, args__123355);
                          if(argc === 12) {
                            if(f__123344.cljs$lang$arity$12) {
                              return f__123344.cljs$lang$arity$12(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356)
                            }else {
                              return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356)
                            }
                          }else {
                            var m__123358 = cljs.core._first.call(null, args__123357);
                            var args__123359 = cljs.core._rest.call(null, args__123357);
                            if(argc === 13) {
                              if(f__123344.cljs$lang$arity$13) {
                                return f__123344.cljs$lang$arity$13(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358)
                              }else {
                                return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358)
                              }
                            }else {
                              var n__123360 = cljs.core._first.call(null, args__123359);
                              var args__123361 = cljs.core._rest.call(null, args__123359);
                              if(argc === 14) {
                                if(f__123344.cljs$lang$arity$14) {
                                  return f__123344.cljs$lang$arity$14(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360)
                                }else {
                                  return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360)
                                }
                              }else {
                                var o__123362 = cljs.core._first.call(null, args__123361);
                                var args__123363 = cljs.core._rest.call(null, args__123361);
                                if(argc === 15) {
                                  if(f__123344.cljs$lang$arity$15) {
                                    return f__123344.cljs$lang$arity$15(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362)
                                  }else {
                                    return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362)
                                  }
                                }else {
                                  var p__123364 = cljs.core._first.call(null, args__123363);
                                  var args__123365 = cljs.core._rest.call(null, args__123363);
                                  if(argc === 16) {
                                    if(f__123344.cljs$lang$arity$16) {
                                      return f__123344.cljs$lang$arity$16(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364)
                                    }else {
                                      return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364)
                                    }
                                  }else {
                                    var q__123366 = cljs.core._first.call(null, args__123365);
                                    var args__123367 = cljs.core._rest.call(null, args__123365);
                                    if(argc === 17) {
                                      if(f__123344.cljs$lang$arity$17) {
                                        return f__123344.cljs$lang$arity$17(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366)
                                      }else {
                                        return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366)
                                      }
                                    }else {
                                      var r__123368 = cljs.core._first.call(null, args__123367);
                                      var args__123369 = cljs.core._rest.call(null, args__123367);
                                      if(argc === 18) {
                                        if(f__123344.cljs$lang$arity$18) {
                                          return f__123344.cljs$lang$arity$18(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366, r__123368)
                                        }else {
                                          return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366, r__123368)
                                        }
                                      }else {
                                        var s__123370 = cljs.core._first.call(null, args__123369);
                                        var args__123371 = cljs.core._rest.call(null, args__123369);
                                        if(argc === 19) {
                                          if(f__123344.cljs$lang$arity$19) {
                                            return f__123344.cljs$lang$arity$19(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366, r__123368, s__123370)
                                          }else {
                                            return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366, r__123368, s__123370)
                                          }
                                        }else {
                                          var t__123372 = cljs.core._first.call(null, args__123371);
                                          var args__123373 = cljs.core._rest.call(null, args__123371);
                                          if(argc === 20) {
                                            if(f__123344.cljs$lang$arity$20) {
                                              return f__123344.cljs$lang$arity$20(a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366, r__123368, s__123370, t__123372)
                                            }else {
                                              return f__123344.call(null, a__123334, b__123336, c__123338, d__123340, e__123342, f__123344, g__123346, h__123348, i__123350, j__123352, k__123354, l__123356, m__123358, n__123360, o__123362, p__123364, q__123366, r__123368, s__123370, t__123372)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__123388 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__123389 = cljs.core.bounded_count.call(null, args, fixed_arity__123388 + 1);
      if(bc__123389 <= fixed_arity__123388) {
        return cljs.core.apply_to.call(null, f, bc__123389, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__123390 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__123391 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__123392 = cljs.core.bounded_count.call(null, arglist__123390, fixed_arity__123391 + 1);
      if(bc__123392 <= fixed_arity__123391) {
        return cljs.core.apply_to.call(null, f, bc__123392, arglist__123390)
      }else {
        return f.cljs$lang$applyTo(arglist__123390)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__123390))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__123393 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__123394 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__123395 = cljs.core.bounded_count.call(null, arglist__123393, fixed_arity__123394 + 1);
      if(bc__123395 <= fixed_arity__123394) {
        return cljs.core.apply_to.call(null, f, bc__123395, arglist__123393)
      }else {
        return f.cljs$lang$applyTo(arglist__123393)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__123393))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__123396 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__123397 = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc__123398 = cljs.core.bounded_count.call(null, arglist__123396, fixed_arity__123397 + 1);
      if(bc__123398 <= fixed_arity__123397) {
        return cljs.core.apply_to.call(null, f, bc__123398, arglist__123396)
      }else {
        return f.cljs$lang$applyTo(arglist__123396)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__123396))
    }
  };
  var apply__6 = function() {
    var G__123402__delegate = function(f, a, b, c, d, args) {
      var arglist__123399 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__123400 = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc__123401 = cljs.core.bounded_count.call(null, arglist__123399, fixed_arity__123400 + 1);
        if(bc__123401 <= fixed_arity__123400) {
          return cljs.core.apply_to.call(null, f, bc__123401, arglist__123399)
        }else {
          return f.cljs$lang$applyTo(arglist__123399)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__123399))
      }
    };
    var G__123402 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__123402__delegate.call(this, f, a, b, c, d, args)
    };
    G__123402.cljs$lang$maxFixedArity = 5;
    G__123402.cljs$lang$applyTo = function(arglist__123403) {
      var f = cljs.core.first(arglist__123403);
      var a = cljs.core.first(cljs.core.next(arglist__123403));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123403)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123403))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123403)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123403)))));
      return G__123402__delegate(f, a, b, c, d, args)
    };
    G__123402.cljs$lang$arity$variadic = G__123402__delegate;
    return G__123402
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
void 0;
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__123404) {
    var obj = cljs.core.first(arglist__123404);
    var f = cljs.core.first(cljs.core.next(arglist__123404));
    var args = cljs.core.rest(cljs.core.next(arglist__123404));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__123405__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__123405 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__123405__delegate.call(this, x, y, more)
    };
    G__123405.cljs$lang$maxFixedArity = 2;
    G__123405.cljs$lang$applyTo = function(arglist__123406) {
      var x = cljs.core.first(arglist__123406);
      var y = cljs.core.first(cljs.core.next(arglist__123406));
      var more = cljs.core.rest(cljs.core.next(arglist__123406));
      return G__123405__delegate(x, y, more)
    };
    G__123405.cljs$lang$arity$variadic = G__123405__delegate;
    return G__123405
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__123407 = pred;
        var G__123408 = cljs.core.next.call(null, coll);
        pred = G__123407;
        coll = G__123408;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto____123410 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____123410)) {
        return or__3824__auto____123410
      }else {
        var G__123411 = pred;
        var G__123412 = cljs.core.next.call(null, coll);
        pred = G__123411;
        coll = G__123412;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__123413 = null;
    var G__123413__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__123413__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__123413__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__123413__3 = function() {
      var G__123414__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__123414 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__123414__delegate.call(this, x, y, zs)
      };
      G__123414.cljs$lang$maxFixedArity = 2;
      G__123414.cljs$lang$applyTo = function(arglist__123415) {
        var x = cljs.core.first(arglist__123415);
        var y = cljs.core.first(cljs.core.next(arglist__123415));
        var zs = cljs.core.rest(cljs.core.next(arglist__123415));
        return G__123414__delegate(x, y, zs)
      };
      G__123414.cljs$lang$arity$variadic = G__123414__delegate;
      return G__123414
    }();
    G__123413 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__123413__0.call(this);
        case 1:
          return G__123413__1.call(this, x);
        case 2:
          return G__123413__2.call(this, x, y);
        default:
          return G__123413__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__123413.cljs$lang$maxFixedArity = 2;
    G__123413.cljs$lang$applyTo = G__123413__3.cljs$lang$applyTo;
    return G__123413
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__123416__delegate = function(args) {
      return x
    };
    var G__123416 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__123416__delegate.call(this, args)
    };
    G__123416.cljs$lang$maxFixedArity = 0;
    G__123416.cljs$lang$applyTo = function(arglist__123417) {
      var args = cljs.core.seq(arglist__123417);
      return G__123416__delegate(args)
    };
    G__123416.cljs$lang$arity$variadic = G__123416__delegate;
    return G__123416
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__123424 = null;
      var G__123424__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__123424__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__123424__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__123424__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__123424__4 = function() {
        var G__123425__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__123425 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123425__delegate.call(this, x, y, z, args)
        };
        G__123425.cljs$lang$maxFixedArity = 3;
        G__123425.cljs$lang$applyTo = function(arglist__123426) {
          var x = cljs.core.first(arglist__123426);
          var y = cljs.core.first(cljs.core.next(arglist__123426));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123426)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123426)));
          return G__123425__delegate(x, y, z, args)
        };
        G__123425.cljs$lang$arity$variadic = G__123425__delegate;
        return G__123425
      }();
      G__123424 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__123424__0.call(this);
          case 1:
            return G__123424__1.call(this, x);
          case 2:
            return G__123424__2.call(this, x, y);
          case 3:
            return G__123424__3.call(this, x, y, z);
          default:
            return G__123424__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__123424.cljs$lang$maxFixedArity = 3;
      G__123424.cljs$lang$applyTo = G__123424__4.cljs$lang$applyTo;
      return G__123424
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__123427 = null;
      var G__123427__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__123427__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__123427__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__123427__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__123427__4 = function() {
        var G__123428__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__123428 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123428__delegate.call(this, x, y, z, args)
        };
        G__123428.cljs$lang$maxFixedArity = 3;
        G__123428.cljs$lang$applyTo = function(arglist__123429) {
          var x = cljs.core.first(arglist__123429);
          var y = cljs.core.first(cljs.core.next(arglist__123429));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123429)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123429)));
          return G__123428__delegate(x, y, z, args)
        };
        G__123428.cljs$lang$arity$variadic = G__123428__delegate;
        return G__123428
      }();
      G__123427 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__123427__0.call(this);
          case 1:
            return G__123427__1.call(this, x);
          case 2:
            return G__123427__2.call(this, x, y);
          case 3:
            return G__123427__3.call(this, x, y, z);
          default:
            return G__123427__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__123427.cljs$lang$maxFixedArity = 3;
      G__123427.cljs$lang$applyTo = G__123427__4.cljs$lang$applyTo;
      return G__123427
    }()
  };
  var comp__4 = function() {
    var G__123430__delegate = function(f1, f2, f3, fs) {
      var fs__123421 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__123431__delegate = function(args) {
          var ret__123422 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__123421), args);
          var fs__123423 = cljs.core.next.call(null, fs__123421);
          while(true) {
            if(fs__123423) {
              var G__123432 = cljs.core.first.call(null, fs__123423).call(null, ret__123422);
              var G__123433 = cljs.core.next.call(null, fs__123423);
              ret__123422 = G__123432;
              fs__123423 = G__123433;
              continue
            }else {
              return ret__123422
            }
            break
          }
        };
        var G__123431 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__123431__delegate.call(this, args)
        };
        G__123431.cljs$lang$maxFixedArity = 0;
        G__123431.cljs$lang$applyTo = function(arglist__123434) {
          var args = cljs.core.seq(arglist__123434);
          return G__123431__delegate(args)
        };
        G__123431.cljs$lang$arity$variadic = G__123431__delegate;
        return G__123431
      }()
    };
    var G__123430 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__123430__delegate.call(this, f1, f2, f3, fs)
    };
    G__123430.cljs$lang$maxFixedArity = 3;
    G__123430.cljs$lang$applyTo = function(arglist__123435) {
      var f1 = cljs.core.first(arglist__123435);
      var f2 = cljs.core.first(cljs.core.next(arglist__123435));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123435)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123435)));
      return G__123430__delegate(f1, f2, f3, fs)
    };
    G__123430.cljs$lang$arity$variadic = G__123430__delegate;
    return G__123430
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__123436__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__123436 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__123436__delegate.call(this, args)
      };
      G__123436.cljs$lang$maxFixedArity = 0;
      G__123436.cljs$lang$applyTo = function(arglist__123437) {
        var args = cljs.core.seq(arglist__123437);
        return G__123436__delegate(args)
      };
      G__123436.cljs$lang$arity$variadic = G__123436__delegate;
      return G__123436
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__123438__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__123438 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__123438__delegate.call(this, args)
      };
      G__123438.cljs$lang$maxFixedArity = 0;
      G__123438.cljs$lang$applyTo = function(arglist__123439) {
        var args = cljs.core.seq(arglist__123439);
        return G__123438__delegate(args)
      };
      G__123438.cljs$lang$arity$variadic = G__123438__delegate;
      return G__123438
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__123440__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__123440 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__123440__delegate.call(this, args)
      };
      G__123440.cljs$lang$maxFixedArity = 0;
      G__123440.cljs$lang$applyTo = function(arglist__123441) {
        var args = cljs.core.seq(arglist__123441);
        return G__123440__delegate(args)
      };
      G__123440.cljs$lang$arity$variadic = G__123440__delegate;
      return G__123440
    }()
  };
  var partial__5 = function() {
    var G__123442__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__123443__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__123443 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__123443__delegate.call(this, args)
        };
        G__123443.cljs$lang$maxFixedArity = 0;
        G__123443.cljs$lang$applyTo = function(arglist__123444) {
          var args = cljs.core.seq(arglist__123444);
          return G__123443__delegate(args)
        };
        G__123443.cljs$lang$arity$variadic = G__123443__delegate;
        return G__123443
      }()
    };
    var G__123442 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__123442__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__123442.cljs$lang$maxFixedArity = 4;
    G__123442.cljs$lang$applyTo = function(arglist__123445) {
      var f = cljs.core.first(arglist__123445);
      var arg1 = cljs.core.first(cljs.core.next(arglist__123445));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123445)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123445))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123445))));
      return G__123442__delegate(f, arg1, arg2, arg3, more)
    };
    G__123442.cljs$lang$arity$variadic = G__123442__delegate;
    return G__123442
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__123446 = null;
      var G__123446__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__123446__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__123446__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__123446__4 = function() {
        var G__123447__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__123447 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123447__delegate.call(this, a, b, c, ds)
        };
        G__123447.cljs$lang$maxFixedArity = 3;
        G__123447.cljs$lang$applyTo = function(arglist__123448) {
          var a = cljs.core.first(arglist__123448);
          var b = cljs.core.first(cljs.core.next(arglist__123448));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123448)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123448)));
          return G__123447__delegate(a, b, c, ds)
        };
        G__123447.cljs$lang$arity$variadic = G__123447__delegate;
        return G__123447
      }();
      G__123446 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__123446__1.call(this, a);
          case 2:
            return G__123446__2.call(this, a, b);
          case 3:
            return G__123446__3.call(this, a, b, c);
          default:
            return G__123446__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__123446.cljs$lang$maxFixedArity = 3;
      G__123446.cljs$lang$applyTo = G__123446__4.cljs$lang$applyTo;
      return G__123446
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__123449 = null;
      var G__123449__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__123449__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__123449__4 = function() {
        var G__123450__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__123450 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123450__delegate.call(this, a, b, c, ds)
        };
        G__123450.cljs$lang$maxFixedArity = 3;
        G__123450.cljs$lang$applyTo = function(arglist__123451) {
          var a = cljs.core.first(arglist__123451);
          var b = cljs.core.first(cljs.core.next(arglist__123451));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123451)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123451)));
          return G__123450__delegate(a, b, c, ds)
        };
        G__123450.cljs$lang$arity$variadic = G__123450__delegate;
        return G__123450
      }();
      G__123449 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__123449__2.call(this, a, b);
          case 3:
            return G__123449__3.call(this, a, b, c);
          default:
            return G__123449__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__123449.cljs$lang$maxFixedArity = 3;
      G__123449.cljs$lang$applyTo = G__123449__4.cljs$lang$applyTo;
      return G__123449
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__123452 = null;
      var G__123452__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__123452__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__123452__4 = function() {
        var G__123453__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__123453 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123453__delegate.call(this, a, b, c, ds)
        };
        G__123453.cljs$lang$maxFixedArity = 3;
        G__123453.cljs$lang$applyTo = function(arglist__123454) {
          var a = cljs.core.first(arglist__123454);
          var b = cljs.core.first(cljs.core.next(arglist__123454));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123454)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123454)));
          return G__123453__delegate(a, b, c, ds)
        };
        G__123453.cljs$lang$arity$variadic = G__123453__delegate;
        return G__123453
      }();
      G__123452 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__123452__2.call(this, a, b);
          case 3:
            return G__123452__3.call(this, a, b, c);
          default:
            return G__123452__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__123452.cljs$lang$maxFixedArity = 3;
      G__123452.cljs$lang$applyTo = G__123452__4.cljs$lang$applyTo;
      return G__123452
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__123470 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____123478 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____123478) {
        var s__123479 = temp__3974__auto____123478;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__123479)) {
          var c__123480 = cljs.core.chunk_first.call(null, s__123479);
          var size__123481 = cljs.core.count.call(null, c__123480);
          var b__123482 = cljs.core.chunk_buffer.call(null, size__123481);
          var n__2541__auto____123483 = size__123481;
          var i__123484 = 0;
          while(true) {
            if(i__123484 < n__2541__auto____123483) {
              cljs.core.chunk_append.call(null, b__123482, f.call(null, idx + i__123484, cljs.core._nth.call(null, c__123480, i__123484)));
              var G__123485 = i__123484 + 1;
              i__123484 = G__123485;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__123482), mapi.call(null, idx + size__123481, cljs.core.chunk_rest.call(null, s__123479)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__123479)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__123479)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__123470.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____123495 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____123495) {
      var s__123496 = temp__3974__auto____123495;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__123496)) {
        var c__123497 = cljs.core.chunk_first.call(null, s__123496);
        var size__123498 = cljs.core.count.call(null, c__123497);
        var b__123499 = cljs.core.chunk_buffer.call(null, size__123498);
        var n__2541__auto____123500 = size__123498;
        var i__123501 = 0;
        while(true) {
          if(i__123501 < n__2541__auto____123500) {
            var x__123502 = f.call(null, cljs.core._nth.call(null, c__123497, i__123501));
            if(x__123502 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__123499, x__123502)
            }
            var G__123504 = i__123501 + 1;
            i__123501 = G__123504;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__123499), keep.call(null, f, cljs.core.chunk_rest.call(null, s__123496)))
      }else {
        var x__123503 = f.call(null, cljs.core.first.call(null, s__123496));
        if(x__123503 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__123496))
        }else {
          return cljs.core.cons.call(null, x__123503, keep.call(null, f, cljs.core.rest.call(null, s__123496)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__123530 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____123540 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____123540) {
        var s__123541 = temp__3974__auto____123540;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__123541)) {
          var c__123542 = cljs.core.chunk_first.call(null, s__123541);
          var size__123543 = cljs.core.count.call(null, c__123542);
          var b__123544 = cljs.core.chunk_buffer.call(null, size__123543);
          var n__2541__auto____123545 = size__123543;
          var i__123546 = 0;
          while(true) {
            if(i__123546 < n__2541__auto____123545) {
              var x__123547 = f.call(null, idx + i__123546, cljs.core._nth.call(null, c__123542, i__123546));
              if(x__123547 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__123544, x__123547)
              }
              var G__123549 = i__123546 + 1;
              i__123546 = G__123549;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__123544), keepi.call(null, idx + size__123543, cljs.core.chunk_rest.call(null, s__123541)))
        }else {
          var x__123548 = f.call(null, idx, cljs.core.first.call(null, s__123541));
          if(x__123548 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__123541))
          }else {
            return cljs.core.cons.call(null, x__123548, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__123541)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__123530.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123635 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123635)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____123635
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123636 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123636)) {
            var and__3822__auto____123637 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____123637)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____123637
            }
          }else {
            return and__3822__auto____123636
          }
        }())
      };
      var ep1__4 = function() {
        var G__123706__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____123638 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____123638)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____123638
            }
          }())
        };
        var G__123706 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123706__delegate.call(this, x, y, z, args)
        };
        G__123706.cljs$lang$maxFixedArity = 3;
        G__123706.cljs$lang$applyTo = function(arglist__123707) {
          var x = cljs.core.first(arglist__123707);
          var y = cljs.core.first(cljs.core.next(arglist__123707));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123707)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123707)));
          return G__123706__delegate(x, y, z, args)
        };
        G__123706.cljs$lang$arity$variadic = G__123706__delegate;
        return G__123706
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123650 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123650)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____123650
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123651 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123651)) {
            var and__3822__auto____123652 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____123652)) {
              var and__3822__auto____123653 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____123653)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____123653
              }
            }else {
              return and__3822__auto____123652
            }
          }else {
            return and__3822__auto____123651
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123654 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123654)) {
            var and__3822__auto____123655 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____123655)) {
              var and__3822__auto____123656 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____123656)) {
                var and__3822__auto____123657 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____123657)) {
                  var and__3822__auto____123658 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____123658)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____123658
                  }
                }else {
                  return and__3822__auto____123657
                }
              }else {
                return and__3822__auto____123656
              }
            }else {
              return and__3822__auto____123655
            }
          }else {
            return and__3822__auto____123654
          }
        }())
      };
      var ep2__4 = function() {
        var G__123708__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____123659 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____123659)) {
              return cljs.core.every_QMARK_.call(null, function(p1__123505_SHARP_) {
                var and__3822__auto____123660 = p1.call(null, p1__123505_SHARP_);
                if(cljs.core.truth_(and__3822__auto____123660)) {
                  return p2.call(null, p1__123505_SHARP_)
                }else {
                  return and__3822__auto____123660
                }
              }, args)
            }else {
              return and__3822__auto____123659
            }
          }())
        };
        var G__123708 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123708__delegate.call(this, x, y, z, args)
        };
        G__123708.cljs$lang$maxFixedArity = 3;
        G__123708.cljs$lang$applyTo = function(arglist__123709) {
          var x = cljs.core.first(arglist__123709);
          var y = cljs.core.first(cljs.core.next(arglist__123709));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123709)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123709)));
          return G__123708__delegate(x, y, z, args)
        };
        G__123708.cljs$lang$arity$variadic = G__123708__delegate;
        return G__123708
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123679 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123679)) {
            var and__3822__auto____123680 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____123680)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____123680
            }
          }else {
            return and__3822__auto____123679
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123681 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123681)) {
            var and__3822__auto____123682 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____123682)) {
              var and__3822__auto____123683 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____123683)) {
                var and__3822__auto____123684 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____123684)) {
                  var and__3822__auto____123685 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____123685)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____123685
                  }
                }else {
                  return and__3822__auto____123684
                }
              }else {
                return and__3822__auto____123683
              }
            }else {
              return and__3822__auto____123682
            }
          }else {
            return and__3822__auto____123681
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____123686 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____123686)) {
            var and__3822__auto____123687 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____123687)) {
              var and__3822__auto____123688 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____123688)) {
                var and__3822__auto____123689 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____123689)) {
                  var and__3822__auto____123690 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____123690)) {
                    var and__3822__auto____123691 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____123691)) {
                      var and__3822__auto____123692 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____123692)) {
                        var and__3822__auto____123693 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____123693)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____123693
                        }
                      }else {
                        return and__3822__auto____123692
                      }
                    }else {
                      return and__3822__auto____123691
                    }
                  }else {
                    return and__3822__auto____123690
                  }
                }else {
                  return and__3822__auto____123689
                }
              }else {
                return and__3822__auto____123688
              }
            }else {
              return and__3822__auto____123687
            }
          }else {
            return and__3822__auto____123686
          }
        }())
      };
      var ep3__4 = function() {
        var G__123710__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____123694 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____123694)) {
              return cljs.core.every_QMARK_.call(null, function(p1__123506_SHARP_) {
                var and__3822__auto____123695 = p1.call(null, p1__123506_SHARP_);
                if(cljs.core.truth_(and__3822__auto____123695)) {
                  var and__3822__auto____123696 = p2.call(null, p1__123506_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____123696)) {
                    return p3.call(null, p1__123506_SHARP_)
                  }else {
                    return and__3822__auto____123696
                  }
                }else {
                  return and__3822__auto____123695
                }
              }, args)
            }else {
              return and__3822__auto____123694
            }
          }())
        };
        var G__123710 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123710__delegate.call(this, x, y, z, args)
        };
        G__123710.cljs$lang$maxFixedArity = 3;
        G__123710.cljs$lang$applyTo = function(arglist__123711) {
          var x = cljs.core.first(arglist__123711);
          var y = cljs.core.first(cljs.core.next(arglist__123711));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123711)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123711)));
          return G__123710__delegate(x, y, z, args)
        };
        G__123710.cljs$lang$arity$variadic = G__123710__delegate;
        return G__123710
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__123712__delegate = function(p1, p2, p3, ps) {
      var ps__123697 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__123507_SHARP_) {
            return p1__123507_SHARP_.call(null, x)
          }, ps__123697)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__123508_SHARP_) {
            var and__3822__auto____123702 = p1__123508_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____123702)) {
              return p1__123508_SHARP_.call(null, y)
            }else {
              return and__3822__auto____123702
            }
          }, ps__123697)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__123509_SHARP_) {
            var and__3822__auto____123703 = p1__123509_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____123703)) {
              var and__3822__auto____123704 = p1__123509_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____123704)) {
                return p1__123509_SHARP_.call(null, z)
              }else {
                return and__3822__auto____123704
              }
            }else {
              return and__3822__auto____123703
            }
          }, ps__123697)
        };
        var epn__4 = function() {
          var G__123713__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____123705 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____123705)) {
                return cljs.core.every_QMARK_.call(null, function(p1__123510_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__123510_SHARP_, args)
                }, ps__123697)
              }else {
                return and__3822__auto____123705
              }
            }())
          };
          var G__123713 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__123713__delegate.call(this, x, y, z, args)
          };
          G__123713.cljs$lang$maxFixedArity = 3;
          G__123713.cljs$lang$applyTo = function(arglist__123714) {
            var x = cljs.core.first(arglist__123714);
            var y = cljs.core.first(cljs.core.next(arglist__123714));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123714)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123714)));
            return G__123713__delegate(x, y, z, args)
          };
          G__123713.cljs$lang$arity$variadic = G__123713__delegate;
          return G__123713
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__123712 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__123712__delegate.call(this, p1, p2, p3, ps)
    };
    G__123712.cljs$lang$maxFixedArity = 3;
    G__123712.cljs$lang$applyTo = function(arglist__123715) {
      var p1 = cljs.core.first(arglist__123715);
      var p2 = cljs.core.first(cljs.core.next(arglist__123715));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123715)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123715)));
      return G__123712__delegate(p1, p2, p3, ps)
    };
    G__123712.cljs$lang$arity$variadic = G__123712__delegate;
    return G__123712
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____123796 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123796)) {
          return or__3824__auto____123796
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____123797 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123797)) {
          return or__3824__auto____123797
        }else {
          var or__3824__auto____123798 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____123798)) {
            return or__3824__auto____123798
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__123867__delegate = function(x, y, z, args) {
          var or__3824__auto____123799 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____123799)) {
            return or__3824__auto____123799
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__123867 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123867__delegate.call(this, x, y, z, args)
        };
        G__123867.cljs$lang$maxFixedArity = 3;
        G__123867.cljs$lang$applyTo = function(arglist__123868) {
          var x = cljs.core.first(arglist__123868);
          var y = cljs.core.first(cljs.core.next(arglist__123868));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123868)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123868)));
          return G__123867__delegate(x, y, z, args)
        };
        G__123867.cljs$lang$arity$variadic = G__123867__delegate;
        return G__123867
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____123811 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123811)) {
          return or__3824__auto____123811
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____123812 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123812)) {
          return or__3824__auto____123812
        }else {
          var or__3824__auto____123813 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____123813)) {
            return or__3824__auto____123813
          }else {
            var or__3824__auto____123814 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____123814)) {
              return or__3824__auto____123814
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____123815 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123815)) {
          return or__3824__auto____123815
        }else {
          var or__3824__auto____123816 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____123816)) {
            return or__3824__auto____123816
          }else {
            var or__3824__auto____123817 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____123817)) {
              return or__3824__auto____123817
            }else {
              var or__3824__auto____123818 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____123818)) {
                return or__3824__auto____123818
              }else {
                var or__3824__auto____123819 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____123819)) {
                  return or__3824__auto____123819
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__123869__delegate = function(x, y, z, args) {
          var or__3824__auto____123820 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____123820)) {
            return or__3824__auto____123820
          }else {
            return cljs.core.some.call(null, function(p1__123550_SHARP_) {
              var or__3824__auto____123821 = p1.call(null, p1__123550_SHARP_);
              if(cljs.core.truth_(or__3824__auto____123821)) {
                return or__3824__auto____123821
              }else {
                return p2.call(null, p1__123550_SHARP_)
              }
            }, args)
          }
        };
        var G__123869 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123869__delegate.call(this, x, y, z, args)
        };
        G__123869.cljs$lang$maxFixedArity = 3;
        G__123869.cljs$lang$applyTo = function(arglist__123870) {
          var x = cljs.core.first(arglist__123870);
          var y = cljs.core.first(cljs.core.next(arglist__123870));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123870)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123870)));
          return G__123869__delegate(x, y, z, args)
        };
        G__123869.cljs$lang$arity$variadic = G__123869__delegate;
        return G__123869
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____123840 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123840)) {
          return or__3824__auto____123840
        }else {
          var or__3824__auto____123841 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____123841)) {
            return or__3824__auto____123841
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____123842 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123842)) {
          return or__3824__auto____123842
        }else {
          var or__3824__auto____123843 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____123843)) {
            return or__3824__auto____123843
          }else {
            var or__3824__auto____123844 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____123844)) {
              return or__3824__auto____123844
            }else {
              var or__3824__auto____123845 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____123845)) {
                return or__3824__auto____123845
              }else {
                var or__3824__auto____123846 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____123846)) {
                  return or__3824__auto____123846
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____123847 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____123847)) {
          return or__3824__auto____123847
        }else {
          var or__3824__auto____123848 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____123848)) {
            return or__3824__auto____123848
          }else {
            var or__3824__auto____123849 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____123849)) {
              return or__3824__auto____123849
            }else {
              var or__3824__auto____123850 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____123850)) {
                return or__3824__auto____123850
              }else {
                var or__3824__auto____123851 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____123851)) {
                  return or__3824__auto____123851
                }else {
                  var or__3824__auto____123852 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____123852)) {
                    return or__3824__auto____123852
                  }else {
                    var or__3824__auto____123853 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____123853)) {
                      return or__3824__auto____123853
                    }else {
                      var or__3824__auto____123854 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____123854)) {
                        return or__3824__auto____123854
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__123871__delegate = function(x, y, z, args) {
          var or__3824__auto____123855 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____123855)) {
            return or__3824__auto____123855
          }else {
            return cljs.core.some.call(null, function(p1__123551_SHARP_) {
              var or__3824__auto____123856 = p1.call(null, p1__123551_SHARP_);
              if(cljs.core.truth_(or__3824__auto____123856)) {
                return or__3824__auto____123856
              }else {
                var or__3824__auto____123857 = p2.call(null, p1__123551_SHARP_);
                if(cljs.core.truth_(or__3824__auto____123857)) {
                  return or__3824__auto____123857
                }else {
                  return p3.call(null, p1__123551_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__123871 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__123871__delegate.call(this, x, y, z, args)
        };
        G__123871.cljs$lang$maxFixedArity = 3;
        G__123871.cljs$lang$applyTo = function(arglist__123872) {
          var x = cljs.core.first(arglist__123872);
          var y = cljs.core.first(cljs.core.next(arglist__123872));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123872)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123872)));
          return G__123871__delegate(x, y, z, args)
        };
        G__123871.cljs$lang$arity$variadic = G__123871__delegate;
        return G__123871
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__123873__delegate = function(p1, p2, p3, ps) {
      var ps__123858 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__123552_SHARP_) {
            return p1__123552_SHARP_.call(null, x)
          }, ps__123858)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__123553_SHARP_) {
            var or__3824__auto____123863 = p1__123553_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____123863)) {
              return or__3824__auto____123863
            }else {
              return p1__123553_SHARP_.call(null, y)
            }
          }, ps__123858)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__123554_SHARP_) {
            var or__3824__auto____123864 = p1__123554_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____123864)) {
              return or__3824__auto____123864
            }else {
              var or__3824__auto____123865 = p1__123554_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____123865)) {
                return or__3824__auto____123865
              }else {
                return p1__123554_SHARP_.call(null, z)
              }
            }
          }, ps__123858)
        };
        var spn__4 = function() {
          var G__123874__delegate = function(x, y, z, args) {
            var or__3824__auto____123866 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____123866)) {
              return or__3824__auto____123866
            }else {
              return cljs.core.some.call(null, function(p1__123555_SHARP_) {
                return cljs.core.some.call(null, p1__123555_SHARP_, args)
              }, ps__123858)
            }
          };
          var G__123874 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__123874__delegate.call(this, x, y, z, args)
          };
          G__123874.cljs$lang$maxFixedArity = 3;
          G__123874.cljs$lang$applyTo = function(arglist__123875) {
            var x = cljs.core.first(arglist__123875);
            var y = cljs.core.first(cljs.core.next(arglist__123875));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123875)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123875)));
            return G__123874__delegate(x, y, z, args)
          };
          G__123874.cljs$lang$arity$variadic = G__123874__delegate;
          return G__123874
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__123873 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__123873__delegate.call(this, p1, p2, p3, ps)
    };
    G__123873.cljs$lang$maxFixedArity = 3;
    G__123873.cljs$lang$applyTo = function(arglist__123876) {
      var p1 = cljs.core.first(arglist__123876);
      var p2 = cljs.core.first(cljs.core.next(arglist__123876));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123876)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__123876)));
      return G__123873__delegate(p1, p2, p3, ps)
    };
    G__123873.cljs$lang$arity$variadic = G__123873__delegate;
    return G__123873
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____123895 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____123895) {
        var s__123896 = temp__3974__auto____123895;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__123896)) {
          var c__123897 = cljs.core.chunk_first.call(null, s__123896);
          var size__123898 = cljs.core.count.call(null, c__123897);
          var b__123899 = cljs.core.chunk_buffer.call(null, size__123898);
          var n__2541__auto____123900 = size__123898;
          var i__123901 = 0;
          while(true) {
            if(i__123901 < n__2541__auto____123900) {
              cljs.core.chunk_append.call(null, b__123899, f.call(null, cljs.core._nth.call(null, c__123897, i__123901)));
              var G__123913 = i__123901 + 1;
              i__123901 = G__123913;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__123899), map.call(null, f, cljs.core.chunk_rest.call(null, s__123896)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__123896)), map.call(null, f, cljs.core.rest.call(null, s__123896)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__123902 = cljs.core.seq.call(null, c1);
      var s2__123903 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____123904 = s1__123902;
        if(and__3822__auto____123904) {
          return s2__123903
        }else {
          return and__3822__auto____123904
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__123902), cljs.core.first.call(null, s2__123903)), map.call(null, f, cljs.core.rest.call(null, s1__123902), cljs.core.rest.call(null, s2__123903)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__123905 = cljs.core.seq.call(null, c1);
      var s2__123906 = cljs.core.seq.call(null, c2);
      var s3__123907 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto____123908 = s1__123905;
        if(and__3822__auto____123908) {
          var and__3822__auto____123909 = s2__123906;
          if(and__3822__auto____123909) {
            return s3__123907
          }else {
            return and__3822__auto____123909
          }
        }else {
          return and__3822__auto____123908
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__123905), cljs.core.first.call(null, s2__123906), cljs.core.first.call(null, s3__123907)), map.call(null, f, cljs.core.rest.call(null, s1__123905), cljs.core.rest.call(null, s2__123906), cljs.core.rest.call(null, s3__123907)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__123914__delegate = function(f, c1, c2, c3, colls) {
      var step__123912 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__123911 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__123911)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__123911), step.call(null, map.call(null, cljs.core.rest, ss__123911)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__123716_SHARP_) {
        return cljs.core.apply.call(null, f, p1__123716_SHARP_)
      }, step__123912.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__123914 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__123914__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__123914.cljs$lang$maxFixedArity = 4;
    G__123914.cljs$lang$applyTo = function(arglist__123915) {
      var f = cljs.core.first(arglist__123915);
      var c1 = cljs.core.first(cljs.core.next(arglist__123915));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123915)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123915))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123915))));
      return G__123914__delegate(f, c1, c2, c3, colls)
    };
    G__123914.cljs$lang$arity$variadic = G__123914__delegate;
    return G__123914
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____123918 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____123918) {
        var s__123919 = temp__3974__auto____123918;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__123919), take.call(null, n - 1, cljs.core.rest.call(null, s__123919)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__123925 = function(n, coll) {
    while(true) {
      var s__123923 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____123924 = n > 0;
        if(and__3822__auto____123924) {
          return s__123923
        }else {
          return and__3822__auto____123924
        }
      }())) {
        var G__123926 = n - 1;
        var G__123927 = cljs.core.rest.call(null, s__123923);
        n = G__123926;
        coll = G__123927;
        continue
      }else {
        return s__123923
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__123925.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__123930 = cljs.core.seq.call(null, coll);
  var lead__123931 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__123931) {
      var G__123932 = cljs.core.next.call(null, s__123930);
      var G__123933 = cljs.core.next.call(null, lead__123931);
      s__123930 = G__123932;
      lead__123931 = G__123933;
      continue
    }else {
      return s__123930
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__123939 = function(pred, coll) {
    while(true) {
      var s__123937 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____123938 = s__123937;
        if(and__3822__auto____123938) {
          return pred.call(null, cljs.core.first.call(null, s__123937))
        }else {
          return and__3822__auto____123938
        }
      }())) {
        var G__123940 = pred;
        var G__123941 = cljs.core.rest.call(null, s__123937);
        pred = G__123940;
        coll = G__123941;
        continue
      }else {
        return s__123937
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__123939.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____123944 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____123944) {
      var s__123945 = temp__3974__auto____123944;
      return cljs.core.concat.call(null, s__123945, cycle.call(null, s__123945))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__123950 = cljs.core.seq.call(null, c1);
      var s2__123951 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto____123952 = s1__123950;
        if(and__3822__auto____123952) {
          return s2__123951
        }else {
          return and__3822__auto____123952
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__123950), cljs.core.cons.call(null, cljs.core.first.call(null, s2__123951), interleave.call(null, cljs.core.rest.call(null, s1__123950), cljs.core.rest.call(null, s2__123951))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__123954__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__123953 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__123953)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__123953), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__123953)))
        }else {
          return null
        }
      }, null)
    };
    var G__123954 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__123954__delegate.call(this, c1, c2, colls)
    };
    G__123954.cljs$lang$maxFixedArity = 2;
    G__123954.cljs$lang$applyTo = function(arglist__123955) {
      var c1 = cljs.core.first(arglist__123955);
      var c2 = cljs.core.first(cljs.core.next(arglist__123955));
      var colls = cljs.core.rest(cljs.core.next(arglist__123955));
      return G__123954__delegate(c1, c2, colls)
    };
    G__123954.cljs$lang$arity$variadic = G__123954__delegate;
    return G__123954
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__123965 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____123963 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____123963) {
        var coll__123964 = temp__3971__auto____123963;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__123964), cat.call(null, cljs.core.rest.call(null, coll__123964), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__123965.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__123966__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__123966 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__123966__delegate.call(this, f, coll, colls)
    };
    G__123966.cljs$lang$maxFixedArity = 2;
    G__123966.cljs$lang$applyTo = function(arglist__123967) {
      var f = cljs.core.first(arglist__123967);
      var coll = cljs.core.first(cljs.core.next(arglist__123967));
      var colls = cljs.core.rest(cljs.core.next(arglist__123967));
      return G__123966__delegate(f, coll, colls)
    };
    G__123966.cljs$lang$arity$variadic = G__123966__delegate;
    return G__123966
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____123977 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____123977) {
      var s__123978 = temp__3974__auto____123977;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__123978)) {
        var c__123979 = cljs.core.chunk_first.call(null, s__123978);
        var size__123980 = cljs.core.count.call(null, c__123979);
        var b__123981 = cljs.core.chunk_buffer.call(null, size__123980);
        var n__2541__auto____123982 = size__123980;
        var i__123983 = 0;
        while(true) {
          if(i__123983 < n__2541__auto____123982) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__123979, i__123983)))) {
              cljs.core.chunk_append.call(null, b__123981, cljs.core._nth.call(null, c__123979, i__123983))
            }else {
            }
            var G__123986 = i__123983 + 1;
            i__123983 = G__123986;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__123981), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__123978)))
      }else {
        var f__123984 = cljs.core.first.call(null, s__123978);
        var r__123985 = cljs.core.rest.call(null, s__123978);
        if(cljs.core.truth_(pred.call(null, f__123984))) {
          return cljs.core.cons.call(null, f__123984, filter.call(null, pred, r__123985))
        }else {
          return filter.call(null, pred, r__123985)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__123989 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__123989.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__123987_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__123987_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__123993__123994 = to;
    if(G__123993__123994) {
      if(function() {
        var or__3824__auto____123995 = G__123993__123994.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3824__auto____123995) {
          return or__3824__auto____123995
        }else {
          return G__123993__123994.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__123993__123994.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__123993__123994)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__123993__123994)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__123996__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__123996 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__123996__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__123996.cljs$lang$maxFixedArity = 4;
    G__123996.cljs$lang$applyTo = function(arglist__123997) {
      var f = cljs.core.first(arglist__123997);
      var c1 = cljs.core.first(cljs.core.next(arglist__123997));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__123997)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123997))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__123997))));
      return G__123996__delegate(f, c1, c2, c3, colls)
    };
    G__123996.cljs$lang$arity$variadic = G__123996__delegate;
    return G__123996
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____124004 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____124004) {
        var s__124005 = temp__3974__auto____124004;
        var p__124006 = cljs.core.take.call(null, n, s__124005);
        if(n === cljs.core.count.call(null, p__124006)) {
          return cljs.core.cons.call(null, p__124006, partition.call(null, n, step, cljs.core.drop.call(null, step, s__124005)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____124007 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____124007) {
        var s__124008 = temp__3974__auto____124007;
        var p__124009 = cljs.core.take.call(null, n, s__124008);
        if(n === cljs.core.count.call(null, p__124009)) {
          return cljs.core.cons.call(null, p__124009, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__124008)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__124009, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return get_in.call(null, m, ks, null)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__124017 = cljs.core.lookup_sentinel;
    var m__124018 = m;
    var ks__124019 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__124019) {
        if(!function() {
          var G__124020__124021 = m__124018;
          if(G__124020__124021) {
            if(function() {
              var or__3824__auto____124022 = G__124020__124021.cljs$lang$protocol_mask$partition0$ & 256;
              if(or__3824__auto____124022) {
                return or__3824__auto____124022
              }else {
                return G__124020__124021.cljs$core$ILookup$
              }
            }()) {
              return true
            }else {
              if(!G__124020__124021.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__124020__124021)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ILookup, G__124020__124021)
          }
        }()) {
          return not_found
        }else {
          var m__124023 = cljs.core._lookup.call(null, m__124018, cljs.core.first.call(null, ks__124019), sentinel__124017);
          if(sentinel__124017 === m__124023) {
            return not_found
          }else {
            var G__124024 = sentinel__124017;
            var G__124025 = m__124023;
            var G__124026 = cljs.core.next.call(null, ks__124019);
            sentinel__124017 = G__124024;
            m__124018 = G__124025;
            ks__124019 = G__124026;
            continue
          }
        }
      }else {
        return m__124018
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__124027, v) {
  var vec__124032__124033 = p__124027;
  var k__124034 = cljs.core.nth.call(null, vec__124032__124033, 0, null);
  var ks__124035 = cljs.core.nthnext.call(null, vec__124032__124033, 1);
  if(cljs.core.truth_(ks__124035)) {
    return cljs.core.assoc.call(null, m, k__124034, assoc_in.call(null, cljs.core._lookup.call(null, m, k__124034, null), ks__124035, v))
  }else {
    return cljs.core.assoc.call(null, m, k__124034, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__124036, f, args) {
    var vec__124041__124042 = p__124036;
    var k__124043 = cljs.core.nth.call(null, vec__124041__124042, 0, null);
    var ks__124044 = cljs.core.nthnext.call(null, vec__124041__124042, 1);
    if(cljs.core.truth_(ks__124044)) {
      return cljs.core.assoc.call(null, m, k__124043, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__124043, null), ks__124044, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__124043, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__124043, null), args))
    }
  };
  var update_in = function(m, p__124036, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__124036, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__124045) {
    var m = cljs.core.first(arglist__124045);
    var p__124036 = cljs.core.first(cljs.core.next(arglist__124045));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__124045)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__124045)));
    return update_in__delegate(m, p__124036, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124048 = this;
  var h__2202__auto____124049 = this__124048.__hash;
  if(!(h__2202__auto____124049 == null)) {
    return h__2202__auto____124049
  }else {
    var h__2202__auto____124050 = cljs.core.hash_coll.call(null, coll);
    this__124048.__hash = h__2202__auto____124050;
    return h__2202__auto____124050
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124051 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124052 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__124053 = this;
  var new_array__124054 = this__124053.array.slice();
  new_array__124054[k] = v;
  return new cljs.core.Vector(this__124053.meta, new_array__124054, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__124085 = null;
  var G__124085__2 = function(this_sym124055, k) {
    var this__124057 = this;
    var this_sym124055__124058 = this;
    var coll__124059 = this_sym124055__124058;
    return coll__124059.cljs$core$ILookup$_lookup$arity$2(coll__124059, k)
  };
  var G__124085__3 = function(this_sym124056, k, not_found) {
    var this__124057 = this;
    var this_sym124056__124060 = this;
    var coll__124061 = this_sym124056__124060;
    return coll__124061.cljs$core$ILookup$_lookup$arity$3(coll__124061, k, not_found)
  };
  G__124085 = function(this_sym124056, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124085__2.call(this, this_sym124056, k);
      case 3:
        return G__124085__3.call(this, this_sym124056, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124085
}();
cljs.core.Vector.prototype.apply = function(this_sym124046, args124047) {
  var this__124062 = this;
  return this_sym124046.call.apply(this_sym124046, [this_sym124046].concat(args124047.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124063 = this;
  var new_array__124064 = this__124063.array.slice();
  new_array__124064.push(o);
  return new cljs.core.Vector(this__124063.meta, new_array__124064, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__124065 = this;
  var this__124066 = this;
  return cljs.core.pr_str.call(null, this__124066)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__124067 = this;
  return cljs.core.ci_reduce.call(null, this__124067.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__124068 = this;
  return cljs.core.ci_reduce.call(null, this__124068.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124069 = this;
  if(this__124069.array.length > 0) {
    var vector_seq__124070 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__124069.array.length) {
          return cljs.core.cons.call(null, this__124069.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__124070.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124071 = this;
  return this__124071.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__124072 = this;
  var count__124073 = this__124072.array.length;
  if(count__124073 > 0) {
    return this__124072.array[count__124073 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__124074 = this;
  if(this__124074.array.length > 0) {
    var new_array__124075 = this__124074.array.slice();
    new_array__124075.pop();
    return new cljs.core.Vector(this__124074.meta, new_array__124075, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__124076 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124077 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124078 = this;
  return new cljs.core.Vector(meta, this__124078.array, this__124078.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124079 = this;
  return this__124079.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__124080 = this;
  if(function() {
    var and__3822__auto____124081 = 0 <= n;
    if(and__3822__auto____124081) {
      return n < this__124080.array.length
    }else {
      return and__3822__auto____124081
    }
  }()) {
    return this__124080.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__124082 = this;
  if(function() {
    var and__3822__auto____124083 = 0 <= n;
    if(and__3822__auto____124083) {
      return n < this__124082.array.length
    }else {
      return and__3822__auto____124083
    }
  }()) {
    return this__124082.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124084 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__124084.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2320__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__124087 = pv.cnt;
  if(cnt__124087 < 32) {
    return 0
  }else {
    return cnt__124087 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__124093 = level;
  var ret__124094 = node;
  while(true) {
    if(ll__124093 === 0) {
      return ret__124094
    }else {
      var embed__124095 = ret__124094;
      var r__124096 = cljs.core.pv_fresh_node.call(null, edit);
      var ___124097 = cljs.core.pv_aset.call(null, r__124096, 0, embed__124095);
      var G__124098 = ll__124093 - 5;
      var G__124099 = r__124096;
      ll__124093 = G__124098;
      ret__124094 = G__124099;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__124105 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__124106 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__124105, subidx__124106, tailnode);
    return ret__124105
  }else {
    var child__124107 = cljs.core.pv_aget.call(null, parent, subidx__124106);
    if(!(child__124107 == null)) {
      var node_to_insert__124108 = push_tail.call(null, pv, level - 5, child__124107, tailnode);
      cljs.core.pv_aset.call(null, ret__124105, subidx__124106, node_to_insert__124108);
      return ret__124105
    }else {
      var node_to_insert__124109 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__124105, subidx__124106, node_to_insert__124109);
      return ret__124105
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____124113 = 0 <= i;
    if(and__3822__auto____124113) {
      return i < pv.cnt
    }else {
      return and__3822__auto____124113
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__124114 = pv.root;
      var level__124115 = pv.shift;
      while(true) {
        if(level__124115 > 0) {
          var G__124116 = cljs.core.pv_aget.call(null, node__124114, i >>> level__124115 & 31);
          var G__124117 = level__124115 - 5;
          node__124114 = G__124116;
          level__124115 = G__124117;
          continue
        }else {
          return node__124114.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__124120 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__124120, i & 31, val);
    return ret__124120
  }else {
    var subidx__124121 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__124120, subidx__124121, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__124121), i, val));
    return ret__124120
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__124127 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__124128 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__124127));
    if(function() {
      var and__3822__auto____124129 = new_child__124128 == null;
      if(and__3822__auto____124129) {
        return subidx__124127 === 0
      }else {
        return and__3822__auto____124129
      }
    }()) {
      return null
    }else {
      var ret__124130 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__124130, subidx__124127, new_child__124128);
      return ret__124130
    }
  }else {
    if(subidx__124127 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__124131 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__124131, subidx__124127, null);
        return ret__124131
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__124134 = this;
  return new cljs.core.TransientVector(this__124134.cnt, this__124134.shift, cljs.core.tv_editable_root.call(null, this__124134.root), cljs.core.tv_editable_tail.call(null, this__124134.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124135 = this;
  var h__2202__auto____124136 = this__124135.__hash;
  if(!(h__2202__auto____124136 == null)) {
    return h__2202__auto____124136
  }else {
    var h__2202__auto____124137 = cljs.core.hash_coll.call(null, coll);
    this__124135.__hash = h__2202__auto____124137;
    return h__2202__auto____124137
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124138 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124139 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__124140 = this;
  if(function() {
    var and__3822__auto____124141 = 0 <= k;
    if(and__3822__auto____124141) {
      return k < this__124140.cnt
    }else {
      return and__3822__auto____124141
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__124142 = this__124140.tail.slice();
      new_tail__124142[k & 31] = v;
      return new cljs.core.PersistentVector(this__124140.meta, this__124140.cnt, this__124140.shift, this__124140.root, new_tail__124142, null)
    }else {
      return new cljs.core.PersistentVector(this__124140.meta, this__124140.cnt, this__124140.shift, cljs.core.do_assoc.call(null, coll, this__124140.shift, this__124140.root, k, v), this__124140.tail, null)
    }
  }else {
    if(k === this__124140.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__124140.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__124190 = null;
  var G__124190__2 = function(this_sym124143, k) {
    var this__124145 = this;
    var this_sym124143__124146 = this;
    var coll__124147 = this_sym124143__124146;
    return coll__124147.cljs$core$ILookup$_lookup$arity$2(coll__124147, k)
  };
  var G__124190__3 = function(this_sym124144, k, not_found) {
    var this__124145 = this;
    var this_sym124144__124148 = this;
    var coll__124149 = this_sym124144__124148;
    return coll__124149.cljs$core$ILookup$_lookup$arity$3(coll__124149, k, not_found)
  };
  G__124190 = function(this_sym124144, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124190__2.call(this, this_sym124144, k);
      case 3:
        return G__124190__3.call(this, this_sym124144, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124190
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym124132, args124133) {
  var this__124150 = this;
  return this_sym124132.call.apply(this_sym124132, [this_sym124132].concat(args124133.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__124151 = this;
  var step_init__124152 = [0, init];
  var i__124153 = 0;
  while(true) {
    if(i__124153 < this__124151.cnt) {
      var arr__124154 = cljs.core.array_for.call(null, v, i__124153);
      var len__124155 = arr__124154.length;
      var init__124159 = function() {
        var j__124156 = 0;
        var init__124157 = step_init__124152[1];
        while(true) {
          if(j__124156 < len__124155) {
            var init__124158 = f.call(null, init__124157, j__124156 + i__124153, arr__124154[j__124156]);
            if(cljs.core.reduced_QMARK_.call(null, init__124158)) {
              return init__124158
            }else {
              var G__124191 = j__124156 + 1;
              var G__124192 = init__124158;
              j__124156 = G__124191;
              init__124157 = G__124192;
              continue
            }
          }else {
            step_init__124152[0] = len__124155;
            step_init__124152[1] = init__124157;
            return init__124157
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__124159)) {
        return cljs.core.deref.call(null, init__124159)
      }else {
        var G__124193 = i__124153 + step_init__124152[0];
        i__124153 = G__124193;
        continue
      }
    }else {
      return step_init__124152[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124160 = this;
  if(this__124160.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__124161 = this__124160.tail.slice();
    new_tail__124161.push(o);
    return new cljs.core.PersistentVector(this__124160.meta, this__124160.cnt + 1, this__124160.shift, this__124160.root, new_tail__124161, null)
  }else {
    var root_overflow_QMARK___124162 = this__124160.cnt >>> 5 > 1 << this__124160.shift;
    var new_shift__124163 = root_overflow_QMARK___124162 ? this__124160.shift + 5 : this__124160.shift;
    var new_root__124165 = root_overflow_QMARK___124162 ? function() {
      var n_r__124164 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__124164, 0, this__124160.root);
      cljs.core.pv_aset.call(null, n_r__124164, 1, cljs.core.new_path.call(null, null, this__124160.shift, new cljs.core.VectorNode(null, this__124160.tail)));
      return n_r__124164
    }() : cljs.core.push_tail.call(null, coll, this__124160.shift, this__124160.root, new cljs.core.VectorNode(null, this__124160.tail));
    return new cljs.core.PersistentVector(this__124160.meta, this__124160.cnt + 1, new_shift__124163, new_root__124165, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__124166 = this;
  if(this__124166.cnt > 0) {
    return new cljs.core.RSeq(coll, this__124166.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__124167 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__124168 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__124169 = this;
  var this__124170 = this;
  return cljs.core.pr_str.call(null, this__124170)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__124171 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__124172 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124173 = this;
  if(this__124173.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124174 = this;
  return this__124174.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__124175 = this;
  if(this__124175.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__124175.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__124176 = this;
  if(this__124176.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__124176.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__124176.meta)
    }else {
      if(1 < this__124176.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__124176.meta, this__124176.cnt - 1, this__124176.shift, this__124176.root, this__124176.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__124177 = cljs.core.array_for.call(null, coll, this__124176.cnt - 2);
          var nr__124178 = cljs.core.pop_tail.call(null, coll, this__124176.shift, this__124176.root);
          var new_root__124179 = nr__124178 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__124178;
          var cnt_1__124180 = this__124176.cnt - 1;
          if(function() {
            var and__3822__auto____124181 = 5 < this__124176.shift;
            if(and__3822__auto____124181) {
              return cljs.core.pv_aget.call(null, new_root__124179, 1) == null
            }else {
              return and__3822__auto____124181
            }
          }()) {
            return new cljs.core.PersistentVector(this__124176.meta, cnt_1__124180, this__124176.shift - 5, cljs.core.pv_aget.call(null, new_root__124179, 0), new_tail__124177, null)
          }else {
            return new cljs.core.PersistentVector(this__124176.meta, cnt_1__124180, this__124176.shift, new_root__124179, new_tail__124177, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__124182 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124183 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124184 = this;
  return new cljs.core.PersistentVector(meta, this__124184.cnt, this__124184.shift, this__124184.root, this__124184.tail, this__124184.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124185 = this;
  return this__124185.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__124186 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__124187 = this;
  if(function() {
    var and__3822__auto____124188 = 0 <= n;
    if(and__3822__auto____124188) {
      return n < this__124187.cnt
    }else {
      return and__3822__auto____124188
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124189 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__124189.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__124194 = xs.length;
  var xs__124195 = no_clone === true ? xs : xs.slice();
  if(l__124194 < 32) {
    return new cljs.core.PersistentVector(null, l__124194, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__124195, null)
  }else {
    var node__124196 = xs__124195.slice(0, 32);
    var v__124197 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__124196, null);
    var i__124198 = 32;
    var out__124199 = cljs.core._as_transient.call(null, v__124197);
    while(true) {
      if(i__124198 < l__124194) {
        var G__124200 = i__124198 + 1;
        var G__124201 = cljs.core.conj_BANG_.call(null, out__124199, xs__124195[i__124198]);
        i__124198 = G__124200;
        out__124199 = G__124201;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__124199)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__124202) {
    var args = cljs.core.seq(arglist__124202);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31719660
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124203 = this;
  var h__2202__auto____124204 = this__124203.__hash;
  if(!(h__2202__auto____124204 == null)) {
    return h__2202__auto____124204
  }else {
    var h__2202__auto____124205 = cljs.core.hash_coll.call(null, coll);
    this__124203.__hash = h__2202__auto____124205;
    return h__2202__auto____124205
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__124206 = this;
  if(this__124206.off + 1 < this__124206.node.length) {
    var s__124207 = cljs.core.chunked_seq.call(null, this__124206.vec, this__124206.node, this__124206.i, this__124206.off + 1);
    if(s__124207 == null) {
      return null
    }else {
      return s__124207
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124208 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124209 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__124210 = this;
  return this__124210.node[this__124210.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__124211 = this;
  if(this__124211.off + 1 < this__124211.node.length) {
    var s__124212 = cljs.core.chunked_seq.call(null, this__124211.vec, this__124211.node, this__124211.i, this__124211.off + 1);
    if(s__124212 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__124212
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__124213 = this;
  var l__124214 = this__124213.node.length;
  var s__124215 = this__124213.i + l__124214 < cljs.core._count.call(null, this__124213.vec) ? cljs.core.chunked_seq.call(null, this__124213.vec, this__124213.i + l__124214, 0) : null;
  if(s__124215 == null) {
    return null
  }else {
    return s__124215
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124216 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__124217 = this;
  return cljs.core.chunked_seq.call(null, this__124217.vec, this__124217.node, this__124217.i, this__124217.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__124218 = this;
  return this__124218.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124219 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__124219.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__124220 = this;
  return cljs.core.array_chunk.call(null, this__124220.node, this__124220.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__124221 = this;
  var l__124222 = this__124221.node.length;
  var s__124223 = this__124221.i + l__124222 < cljs.core._count.call(null, this__124221.vec) ? cljs.core.chunked_seq.call(null, this__124221.vec, this__124221.i + l__124222, 0) : null;
  if(s__124223 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__124223
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
void 0;
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124226 = this;
  var h__2202__auto____124227 = this__124226.__hash;
  if(!(h__2202__auto____124227 == null)) {
    return h__2202__auto____124227
  }else {
    var h__2202__auto____124228 = cljs.core.hash_coll.call(null, coll);
    this__124226.__hash = h__2202__auto____124228;
    return h__2202__auto____124228
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124229 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124230 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__124231 = this;
  var v_pos__124232 = this__124231.start + key;
  return cljs.core.build_subvec.call(null, this__124231.meta, cljs.core._assoc.call(null, this__124231.v, v_pos__124232, val), this__124231.start, this__124231.end > v_pos__124232 + 1 ? this__124231.end : v_pos__124232 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__124258 = null;
  var G__124258__2 = function(this_sym124233, k) {
    var this__124235 = this;
    var this_sym124233__124236 = this;
    var coll__124237 = this_sym124233__124236;
    return coll__124237.cljs$core$ILookup$_lookup$arity$2(coll__124237, k)
  };
  var G__124258__3 = function(this_sym124234, k, not_found) {
    var this__124235 = this;
    var this_sym124234__124238 = this;
    var coll__124239 = this_sym124234__124238;
    return coll__124239.cljs$core$ILookup$_lookup$arity$3(coll__124239, k, not_found)
  };
  G__124258 = function(this_sym124234, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124258__2.call(this, this_sym124234, k);
      case 3:
        return G__124258__3.call(this, this_sym124234, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124258
}();
cljs.core.Subvec.prototype.apply = function(this_sym124224, args124225) {
  var this__124240 = this;
  return this_sym124224.call.apply(this_sym124224, [this_sym124224].concat(args124225.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124241 = this;
  return cljs.core.build_subvec.call(null, this__124241.meta, cljs.core._assoc_n.call(null, this__124241.v, this__124241.end, o), this__124241.start, this__124241.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__124242 = this;
  var this__124243 = this;
  return cljs.core.pr_str.call(null, this__124243)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__124244 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__124245 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124246 = this;
  var subvec_seq__124247 = function subvec_seq(i) {
    if(i === this__124246.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__124246.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__124247.call(null, this__124246.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124248 = this;
  return this__124248.end - this__124248.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__124249 = this;
  return cljs.core._nth.call(null, this__124249.v, this__124249.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__124250 = this;
  if(this__124250.start === this__124250.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, this__124250.meta, this__124250.v, this__124250.start, this__124250.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__124251 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124252 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124253 = this;
  return cljs.core.build_subvec.call(null, meta, this__124253.v, this__124253.start, this__124253.end, this__124253.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124254 = this;
  return this__124254.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__124255 = this;
  return cljs.core._nth.call(null, this__124255.v, this__124255.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__124256 = this;
  return cljs.core._nth.call(null, this__124256.v, this__124256.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124257 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__124257.meta)
};
cljs.core.Subvec;
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  var c__124263 = cljs.core.count.call(null, v);
  if(function() {
    var or__3824__auto____124264 = start < 0;
    if(or__3824__auto____124264) {
      return or__3824__auto____124264
    }else {
      var or__3824__auto____124265 = end < 0;
      if(or__3824__auto____124265) {
        return or__3824__auto____124265
      }else {
        var or__3824__auto____124266 = start > c__124263;
        if(or__3824__auto____124266) {
          return or__3824__auto____124266
        }else {
          return end > c__124263
        }
      }
    }
  }()) {
    throw new Error("Index out of bounds");
  }else {
  }
  return new cljs.core.Subvec(meta, v, start, end, __hash)
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__124268 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__124268, 0, tl.length);
  return ret__124268
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__124272 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__124273 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__124272, subidx__124273, level === 5 ? tail_node : function() {
    var child__124274 = cljs.core.pv_aget.call(null, ret__124272, subidx__124273);
    if(!(child__124274 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__124274, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__124272
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__124279 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__124280 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__124281 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__124279, subidx__124280));
    if(function() {
      var and__3822__auto____124282 = new_child__124281 == null;
      if(and__3822__auto____124282) {
        return subidx__124280 === 0
      }else {
        return and__3822__auto____124282
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__124279, subidx__124280, new_child__124281);
      return node__124279
    }
  }else {
    if(subidx__124280 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__124279, subidx__124280, null);
        return node__124279
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____124287 = 0 <= i;
    if(and__3822__auto____124287) {
      return i < tv.cnt
    }else {
      return and__3822__auto____124287
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__124288 = tv.root;
      var node__124289 = root__124288;
      var level__124290 = tv.shift;
      while(true) {
        if(level__124290 > 0) {
          var G__124291 = cljs.core.tv_ensure_editable.call(null, root__124288.edit, cljs.core.pv_aget.call(null, node__124289, i >>> level__124290 & 31));
          var G__124292 = level__124290 - 5;
          node__124289 = G__124291;
          level__124290 = G__124292;
          continue
        }else {
          return node__124289.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__124332 = null;
  var G__124332__2 = function(this_sym124295, k) {
    var this__124297 = this;
    var this_sym124295__124298 = this;
    var coll__124299 = this_sym124295__124298;
    return coll__124299.cljs$core$ILookup$_lookup$arity$2(coll__124299, k)
  };
  var G__124332__3 = function(this_sym124296, k, not_found) {
    var this__124297 = this;
    var this_sym124296__124300 = this;
    var coll__124301 = this_sym124296__124300;
    return coll__124301.cljs$core$ILookup$_lookup$arity$3(coll__124301, k, not_found)
  };
  G__124332 = function(this_sym124296, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124332__2.call(this, this_sym124296, k);
      case 3:
        return G__124332__3.call(this, this_sym124296, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124332
}();
cljs.core.TransientVector.prototype.apply = function(this_sym124293, args124294) {
  var this__124302 = this;
  return this_sym124293.call.apply(this_sym124293, [this_sym124293].concat(args124294.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124303 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124304 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__124305 = this;
  if(this__124305.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__124306 = this;
  if(function() {
    var and__3822__auto____124307 = 0 <= n;
    if(and__3822__auto____124307) {
      return n < this__124306.cnt
    }else {
      return and__3822__auto____124307
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124308 = this;
  if(this__124308.root.edit) {
    return this__124308.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__124309 = this;
  if(this__124309.root.edit) {
    if(function() {
      var and__3822__auto____124310 = 0 <= n;
      if(and__3822__auto____124310) {
        return n < this__124309.cnt
      }else {
        return and__3822__auto____124310
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__124309.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__124315 = function go(level, node) {
          var node__124313 = cljs.core.tv_ensure_editable.call(null, this__124309.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__124313, n & 31, val);
            return node__124313
          }else {
            var subidx__124314 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__124313, subidx__124314, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__124313, subidx__124314)));
            return node__124313
          }
        }.call(null, this__124309.shift, this__124309.root);
        this__124309.root = new_root__124315;
        return tcoll
      }
    }else {
      if(n === this__124309.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__124309.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__124316 = this;
  if(this__124316.root.edit) {
    if(this__124316.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__124316.cnt) {
        this__124316.cnt = 0;
        return tcoll
      }else {
        if((this__124316.cnt - 1 & 31) > 0) {
          this__124316.cnt = this__124316.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__124317 = cljs.core.editable_array_for.call(null, tcoll, this__124316.cnt - 2);
            var new_root__124319 = function() {
              var nr__124318 = cljs.core.tv_pop_tail.call(null, tcoll, this__124316.shift, this__124316.root);
              if(!(nr__124318 == null)) {
                return nr__124318
              }else {
                return new cljs.core.VectorNode(this__124316.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____124320 = 5 < this__124316.shift;
              if(and__3822__auto____124320) {
                return cljs.core.pv_aget.call(null, new_root__124319, 1) == null
              }else {
                return and__3822__auto____124320
              }
            }()) {
              var new_root__124321 = cljs.core.tv_ensure_editable.call(null, this__124316.root.edit, cljs.core.pv_aget.call(null, new_root__124319, 0));
              this__124316.root = new_root__124321;
              this__124316.shift = this__124316.shift - 5;
              this__124316.cnt = this__124316.cnt - 1;
              this__124316.tail = new_tail__124317;
              return tcoll
            }else {
              this__124316.root = new_root__124319;
              this__124316.cnt = this__124316.cnt - 1;
              this__124316.tail = new_tail__124317;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__124322 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__124323 = this;
  if(this__124323.root.edit) {
    if(this__124323.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__124323.tail[this__124323.cnt & 31] = o;
      this__124323.cnt = this__124323.cnt + 1;
      return tcoll
    }else {
      var tail_node__124324 = new cljs.core.VectorNode(this__124323.root.edit, this__124323.tail);
      var new_tail__124325 = cljs.core.make_array.call(null, 32);
      new_tail__124325[0] = o;
      this__124323.tail = new_tail__124325;
      if(this__124323.cnt >>> 5 > 1 << this__124323.shift) {
        var new_root_array__124326 = cljs.core.make_array.call(null, 32);
        var new_shift__124327 = this__124323.shift + 5;
        new_root_array__124326[0] = this__124323.root;
        new_root_array__124326[1] = cljs.core.new_path.call(null, this__124323.root.edit, this__124323.shift, tail_node__124324);
        this__124323.root = new cljs.core.VectorNode(this__124323.root.edit, new_root_array__124326);
        this__124323.shift = new_shift__124327;
        this__124323.cnt = this__124323.cnt + 1;
        return tcoll
      }else {
        var new_root__124328 = cljs.core.tv_push_tail.call(null, tcoll, this__124323.shift, this__124323.root, tail_node__124324);
        this__124323.root = new_root__124328;
        this__124323.cnt = this__124323.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__124329 = this;
  if(this__124329.root.edit) {
    this__124329.root.edit = null;
    var len__124330 = this__124329.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__124331 = cljs.core.make_array.call(null, len__124330);
    cljs.core.array_copy.call(null, this__124329.tail, 0, trimmed_tail__124331, 0, len__124330);
    return new cljs.core.PersistentVector(null, this__124329.cnt, this__124329.shift, this__124329.root, trimmed_tail__124331, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124333 = this;
  var h__2202__auto____124334 = this__124333.__hash;
  if(!(h__2202__auto____124334 == null)) {
    return h__2202__auto____124334
  }else {
    var h__2202__auto____124335 = cljs.core.hash_coll.call(null, coll);
    this__124333.__hash = h__2202__auto____124335;
    return h__2202__auto____124335
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124336 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__124337 = this;
  var this__124338 = this;
  return cljs.core.pr_str.call(null, this__124338)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124339 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__124340 = this;
  return cljs.core._first.call(null, this__124340.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__124341 = this;
  var temp__3971__auto____124342 = cljs.core.next.call(null, this__124341.front);
  if(temp__3971__auto____124342) {
    var f1__124343 = temp__3971__auto____124342;
    return new cljs.core.PersistentQueueSeq(this__124341.meta, f1__124343, this__124341.rear, null)
  }else {
    if(this__124341.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__124341.meta, this__124341.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124344 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124345 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__124345.front, this__124345.rear, this__124345.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124346 = this;
  return this__124346.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124347 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__124347.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124348 = this;
  var h__2202__auto____124349 = this__124348.__hash;
  if(!(h__2202__auto____124349 == null)) {
    return h__2202__auto____124349
  }else {
    var h__2202__auto____124350 = cljs.core.hash_coll.call(null, coll);
    this__124348.__hash = h__2202__auto____124350;
    return h__2202__auto____124350
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124351 = this;
  if(cljs.core.truth_(this__124351.front)) {
    return new cljs.core.PersistentQueue(this__124351.meta, this__124351.count + 1, this__124351.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____124352 = this__124351.rear;
      if(cljs.core.truth_(or__3824__auto____124352)) {
        return or__3824__auto____124352
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__124351.meta, this__124351.count + 1, cljs.core.conj.call(null, this__124351.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__124353 = this;
  var this__124354 = this;
  return cljs.core.pr_str.call(null, this__124354)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124355 = this;
  var rear__124356 = cljs.core.seq.call(null, this__124355.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____124357 = this__124355.front;
    if(cljs.core.truth_(or__3824__auto____124357)) {
      return or__3824__auto____124357
    }else {
      return rear__124356
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__124355.front, cljs.core.seq.call(null, rear__124356), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124358 = this;
  return this__124358.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__124359 = this;
  return cljs.core._first.call(null, this__124359.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__124360 = this;
  if(cljs.core.truth_(this__124360.front)) {
    var temp__3971__auto____124361 = cljs.core.next.call(null, this__124360.front);
    if(temp__3971__auto____124361) {
      var f1__124362 = temp__3971__auto____124361;
      return new cljs.core.PersistentQueue(this__124360.meta, this__124360.count - 1, f1__124362, this__124360.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__124360.meta, this__124360.count - 1, cljs.core.seq.call(null, this__124360.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__124363 = this;
  return cljs.core.first.call(null, this__124363.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__124364 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124365 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124366 = this;
  return new cljs.core.PersistentQueue(meta, this__124366.count, this__124366.front, this__124366.rear, this__124366.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124367 = this;
  return this__124367.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124368 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__124369 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__124372 = array.length;
  var i__124373 = 0;
  while(true) {
    if(i__124373 < len__124372) {
      if(k === array[i__124373]) {
        return i__124373
      }else {
        var G__124374 = i__124373 + incr;
        i__124373 = G__124374;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__124377 = cljs.core.hash.call(null, a);
  var b__124378 = cljs.core.hash.call(null, b);
  if(a__124377 < b__124378) {
    return-1
  }else {
    if(a__124377 > b__124378) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__124386 = m.keys;
  var len__124387 = ks__124386.length;
  var so__124388 = m.strobj;
  var mm__124389 = cljs.core.meta.call(null, m);
  var i__124390 = 0;
  var out__124391 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__124390 < len__124387) {
      var k__124392 = ks__124386[i__124390];
      var G__124393 = i__124390 + 1;
      var G__124394 = cljs.core.assoc_BANG_.call(null, out__124391, k__124392, so__124388[k__124392]);
      i__124390 = G__124393;
      out__124391 = G__124394;
      continue
    }else {
      return cljs.core.with_meta.call(null, cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__124391, k, v)), mm__124389)
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__124400 = {};
  var l__124401 = ks.length;
  var i__124402 = 0;
  while(true) {
    if(i__124402 < l__124401) {
      var k__124403 = ks[i__124402];
      new_obj__124400[k__124403] = obj[k__124403];
      var G__124404 = i__124402 + 1;
      i__124402 = G__124404;
      continue
    }else {
    }
    break
  }
  return new_obj__124400
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__124407 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124408 = this;
  var h__2202__auto____124409 = this__124408.__hash;
  if(!(h__2202__auto____124409 == null)) {
    return h__2202__auto____124409
  }else {
    var h__2202__auto____124410 = cljs.core.hash_imap.call(null, coll);
    this__124408.__hash = h__2202__auto____124410;
    return h__2202__auto____124410
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124411 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124412 = this;
  if(function() {
    var and__3822__auto____124413 = goog.isString(k);
    if(and__3822__auto____124413) {
      return!(cljs.core.scan_array.call(null, 1, k, this__124412.keys) == null)
    }else {
      return and__3822__auto____124413
    }
  }()) {
    return this__124412.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__124414 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto____124415 = this__124414.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto____124415) {
        return or__3824__auto____124415
      }else {
        return this__124414.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__124414.keys) == null)) {
        var new_strobj__124416 = cljs.core.obj_clone.call(null, this__124414.strobj, this__124414.keys);
        new_strobj__124416[k] = v;
        return new cljs.core.ObjMap(this__124414.meta, this__124414.keys, new_strobj__124416, this__124414.update_count + 1, null)
      }else {
        var new_strobj__124417 = cljs.core.obj_clone.call(null, this__124414.strobj, this__124414.keys);
        var new_keys__124418 = this__124414.keys.slice();
        new_strobj__124417[k] = v;
        new_keys__124418.push(k);
        return new cljs.core.ObjMap(this__124414.meta, new_keys__124418, new_strobj__124417, this__124414.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__124419 = this;
  if(function() {
    var and__3822__auto____124420 = goog.isString(k);
    if(and__3822__auto____124420) {
      return!(cljs.core.scan_array.call(null, 1, k, this__124419.keys) == null)
    }else {
      return and__3822__auto____124420
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__124448 = null;
  var G__124448__2 = function(this_sym124421, k) {
    var this__124423 = this;
    var this_sym124421__124424 = this;
    var coll__124425 = this_sym124421__124424;
    return coll__124425.cljs$core$ILookup$_lookup$arity$2(coll__124425, k)
  };
  var G__124448__3 = function(this_sym124422, k, not_found) {
    var this__124423 = this;
    var this_sym124422__124426 = this;
    var coll__124427 = this_sym124422__124426;
    return coll__124427.cljs$core$ILookup$_lookup$arity$3(coll__124427, k, not_found)
  };
  G__124448 = function(this_sym124422, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124448__2.call(this, this_sym124422, k);
      case 3:
        return G__124448__3.call(this, this_sym124422, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124448
}();
cljs.core.ObjMap.prototype.apply = function(this_sym124405, args124406) {
  var this__124428 = this;
  return this_sym124405.call.apply(this_sym124405, [this_sym124405].concat(args124406.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__124429 = this;
  var len__124430 = this__124429.keys.length;
  var keys__124431 = this__124429.keys.sort(cljs.core.obj_map_compare_keys);
  var init__124432 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__124431)) {
      var k__124433 = cljs.core.first.call(null, keys__124431);
      var init__124434 = f.call(null, init__124432, k__124433, this__124429.strobj[k__124433]);
      if(cljs.core.reduced_QMARK_.call(null, init__124434)) {
        return cljs.core.deref.call(null, init__124434)
      }else {
        var G__124449 = cljs.core.rest.call(null, keys__124431);
        var G__124450 = init__124434;
        keys__124431 = G__124449;
        init__124432 = G__124450;
        continue
      }
    }else {
      return init__124432
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__124435 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__124436 = this;
  var this__124437 = this;
  return cljs.core.pr_str.call(null, this__124437)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124438 = this;
  if(this__124438.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__124395_SHARP_) {
      return cljs.core.vector.call(null, p1__124395_SHARP_, this__124438.strobj[p1__124395_SHARP_])
    }, this__124438.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124439 = this;
  return this__124439.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124440 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124441 = this;
  return new cljs.core.ObjMap(meta, this__124441.keys, this__124441.strobj, this__124441.update_count, this__124441.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124442 = this;
  return this__124442.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124443 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__124443.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__124444 = this;
  if(function() {
    var and__3822__auto____124445 = goog.isString(k);
    if(and__3822__auto____124445) {
      return!(cljs.core.scan_array.call(null, 1, k, this__124444.keys) == null)
    }else {
      return and__3822__auto____124445
    }
  }()) {
    var new_keys__124446 = this__124444.keys.slice();
    var new_strobj__124447 = cljs.core.obj_clone.call(null, this__124444.strobj, this__124444.keys);
    new_keys__124446.splice(cljs.core.scan_array.call(null, 1, k, new_keys__124446), 1);
    cljs.core.js_delete.call(null, new_strobj__124447, k);
    return new cljs.core.ObjMap(this__124444.meta, new_keys__124446, new_strobj__124447, this__124444.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124454 = this;
  var h__2202__auto____124455 = this__124454.__hash;
  if(!(h__2202__auto____124455 == null)) {
    return h__2202__auto____124455
  }else {
    var h__2202__auto____124456 = cljs.core.hash_imap.call(null, coll);
    this__124454.__hash = h__2202__auto____124456;
    return h__2202__auto____124456
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124457 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124458 = this;
  var bucket__124459 = this__124458.hashobj[cljs.core.hash.call(null, k)];
  var i__124460 = cljs.core.truth_(bucket__124459) ? cljs.core.scan_array.call(null, 2, k, bucket__124459) : null;
  if(cljs.core.truth_(i__124460)) {
    return bucket__124459[i__124460 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__124461 = this;
  var h__124462 = cljs.core.hash.call(null, k);
  var bucket__124463 = this__124461.hashobj[h__124462];
  if(cljs.core.truth_(bucket__124463)) {
    var new_bucket__124464 = bucket__124463.slice();
    var new_hashobj__124465 = goog.object.clone(this__124461.hashobj);
    new_hashobj__124465[h__124462] = new_bucket__124464;
    var temp__3971__auto____124466 = cljs.core.scan_array.call(null, 2, k, new_bucket__124464);
    if(cljs.core.truth_(temp__3971__auto____124466)) {
      var i__124467 = temp__3971__auto____124466;
      new_bucket__124464[i__124467 + 1] = v;
      return new cljs.core.HashMap(this__124461.meta, this__124461.count, new_hashobj__124465, null)
    }else {
      new_bucket__124464.push(k, v);
      return new cljs.core.HashMap(this__124461.meta, this__124461.count + 1, new_hashobj__124465, null)
    }
  }else {
    var new_hashobj__124468 = goog.object.clone(this__124461.hashobj);
    new_hashobj__124468[h__124462] = [k, v];
    return new cljs.core.HashMap(this__124461.meta, this__124461.count + 1, new_hashobj__124468, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__124469 = this;
  var bucket__124470 = this__124469.hashobj[cljs.core.hash.call(null, k)];
  var i__124471 = cljs.core.truth_(bucket__124470) ? cljs.core.scan_array.call(null, 2, k, bucket__124470) : null;
  if(cljs.core.truth_(i__124471)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__124496 = null;
  var G__124496__2 = function(this_sym124472, k) {
    var this__124474 = this;
    var this_sym124472__124475 = this;
    var coll__124476 = this_sym124472__124475;
    return coll__124476.cljs$core$ILookup$_lookup$arity$2(coll__124476, k)
  };
  var G__124496__3 = function(this_sym124473, k, not_found) {
    var this__124474 = this;
    var this_sym124473__124477 = this;
    var coll__124478 = this_sym124473__124477;
    return coll__124478.cljs$core$ILookup$_lookup$arity$3(coll__124478, k, not_found)
  };
  G__124496 = function(this_sym124473, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124496__2.call(this, this_sym124473, k);
      case 3:
        return G__124496__3.call(this, this_sym124473, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124496
}();
cljs.core.HashMap.prototype.apply = function(this_sym124452, args124453) {
  var this__124479 = this;
  return this_sym124452.call.apply(this_sym124452, [this_sym124452].concat(args124453.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__124480 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__124481 = this;
  var this__124482 = this;
  return cljs.core.pr_str.call(null, this__124482)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124483 = this;
  if(this__124483.count > 0) {
    var hashes__124484 = cljs.core.js_keys.call(null, this__124483.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__124451_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__124483.hashobj[p1__124451_SHARP_]))
    }, hashes__124484)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124485 = this;
  return this__124485.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124486 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124487 = this;
  return new cljs.core.HashMap(meta, this__124487.count, this__124487.hashobj, this__124487.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124488 = this;
  return this__124488.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124489 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__124489.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__124490 = this;
  var h__124491 = cljs.core.hash.call(null, k);
  var bucket__124492 = this__124490.hashobj[h__124491];
  var i__124493 = cljs.core.truth_(bucket__124492) ? cljs.core.scan_array.call(null, 2, k, bucket__124492) : null;
  if(cljs.core.not.call(null, i__124493)) {
    return coll
  }else {
    var new_hashobj__124494 = goog.object.clone(this__124490.hashobj);
    if(3 > bucket__124492.length) {
      cljs.core.js_delete.call(null, new_hashobj__124494, h__124491)
    }else {
      var new_bucket__124495 = bucket__124492.slice();
      new_bucket__124495.splice(i__124493, 2);
      new_hashobj__124494[h__124491] = new_bucket__124495
    }
    return new cljs.core.HashMap(this__124490.meta, this__124490.count - 1, new_hashobj__124494, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__124497 = ks.length;
  var i__124498 = 0;
  var out__124499 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__124498 < len__124497) {
      var G__124500 = i__124498 + 1;
      var G__124501 = cljs.core.assoc.call(null, out__124499, ks[i__124498], vs[i__124498]);
      i__124498 = G__124500;
      out__124499 = G__124501;
      continue
    }else {
      return out__124499
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__124505 = m.arr;
  var len__124506 = arr__124505.length;
  var i__124507 = 0;
  while(true) {
    if(len__124506 <= i__124507) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__124505[i__124507], k)) {
        return i__124507
      }else {
        if("\ufdd0'else") {
          var G__124508 = i__124507 + 2;
          i__124507 = G__124508;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__124511 = this;
  return new cljs.core.TransientArrayMap({}, this__124511.arr.length, this__124511.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124512 = this;
  var h__2202__auto____124513 = this__124512.__hash;
  if(!(h__2202__auto____124513 == null)) {
    return h__2202__auto____124513
  }else {
    var h__2202__auto____124514 = cljs.core.hash_imap.call(null, coll);
    this__124512.__hash = h__2202__auto____124514;
    return h__2202__auto____124514
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124515 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124516 = this;
  var idx__124517 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__124517 === -1) {
    return not_found
  }else {
    return this__124516.arr[idx__124517 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__124518 = this;
  var idx__124519 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__124519 === -1) {
    if(this__124518.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__124518.meta, this__124518.cnt + 1, function() {
        var G__124520__124521 = this__124518.arr.slice();
        G__124520__124521.push(k);
        G__124520__124521.push(v);
        return G__124520__124521
      }(), null)
    }else {
      return cljs.core.with_meta.call(null, cljs.core.assoc.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll), k, v), this__124518.meta)
    }
  }else {
    if(v === this__124518.arr[idx__124519 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__124518.meta, this__124518.cnt, function() {
          var G__124522__124523 = this__124518.arr.slice();
          G__124522__124523[idx__124519 + 1] = v;
          return G__124522__124523
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__124524 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__124556 = null;
  var G__124556__2 = function(this_sym124525, k) {
    var this__124527 = this;
    var this_sym124525__124528 = this;
    var coll__124529 = this_sym124525__124528;
    return coll__124529.cljs$core$ILookup$_lookup$arity$2(coll__124529, k)
  };
  var G__124556__3 = function(this_sym124526, k, not_found) {
    var this__124527 = this;
    var this_sym124526__124530 = this;
    var coll__124531 = this_sym124526__124530;
    return coll__124531.cljs$core$ILookup$_lookup$arity$3(coll__124531, k, not_found)
  };
  G__124556 = function(this_sym124526, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124556__2.call(this, this_sym124526, k);
      case 3:
        return G__124556__3.call(this, this_sym124526, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124556
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym124509, args124510) {
  var this__124532 = this;
  return this_sym124509.call.apply(this_sym124509, [this_sym124509].concat(args124510.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__124533 = this;
  var len__124534 = this__124533.arr.length;
  var i__124535 = 0;
  var init__124536 = init;
  while(true) {
    if(i__124535 < len__124534) {
      var init__124537 = f.call(null, init__124536, this__124533.arr[i__124535], this__124533.arr[i__124535 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__124537)) {
        return cljs.core.deref.call(null, init__124537)
      }else {
        var G__124557 = i__124535 + 2;
        var G__124558 = init__124537;
        i__124535 = G__124557;
        init__124536 = G__124558;
        continue
      }
    }else {
      return init__124536
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__124538 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__124539 = this;
  var this__124540 = this;
  return cljs.core.pr_str.call(null, this__124540)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124541 = this;
  if(this__124541.cnt > 0) {
    var len__124542 = this__124541.arr.length;
    var array_map_seq__124543 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__124542) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__124541.arr[i], this__124541.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__124543.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124544 = this;
  return this__124544.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124545 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124546 = this;
  return new cljs.core.PersistentArrayMap(meta, this__124546.cnt, this__124546.arr, this__124546.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124547 = this;
  return this__124547.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124548 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__124548.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__124549 = this;
  var idx__124550 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__124550 >= 0) {
    var len__124551 = this__124549.arr.length;
    var new_len__124552 = len__124551 - 2;
    if(new_len__124552 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__124553 = cljs.core.make_array.call(null, new_len__124552);
      var s__124554 = 0;
      var d__124555 = 0;
      while(true) {
        if(s__124554 >= len__124551) {
          return new cljs.core.PersistentArrayMap(this__124549.meta, this__124549.cnt - 1, new_arr__124553, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__124549.arr[s__124554])) {
            var G__124559 = s__124554 + 2;
            var G__124560 = d__124555;
            s__124554 = G__124559;
            d__124555 = G__124560;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__124553[d__124555] = this__124549.arr[s__124554];
              new_arr__124553[d__124555 + 1] = this__124549.arr[s__124554 + 1];
              var G__124561 = s__124554 + 2;
              var G__124562 = d__124555 + 2;
              s__124554 = G__124561;
              d__124555 = G__124562;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__124563 = cljs.core.count.call(null, ks);
  var i__124564 = 0;
  var out__124565 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__124564 < len__124563) {
      var G__124566 = i__124564 + 1;
      var G__124567 = cljs.core.assoc_BANG_.call(null, out__124565, ks[i__124564], vs[i__124564]);
      i__124564 = G__124566;
      out__124565 = G__124567;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__124565)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__124568 = this;
  if(cljs.core.truth_(this__124568.editable_QMARK_)) {
    var idx__124569 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__124569 >= 0) {
      this__124568.arr[idx__124569] = this__124568.arr[this__124568.len - 2];
      this__124568.arr[idx__124569 + 1] = this__124568.arr[this__124568.len - 1];
      var G__124570__124571 = this__124568.arr;
      G__124570__124571.pop();
      G__124570__124571.pop();
      G__124570__124571;
      this__124568.len = this__124568.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__124572 = this;
  if(cljs.core.truth_(this__124572.editable_QMARK_)) {
    var idx__124573 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__124573 === -1) {
      if(this__124572.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__124572.len = this__124572.len + 2;
        this__124572.arr.push(key);
        this__124572.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__124572.len, this__124572.arr), key, val)
      }
    }else {
      if(val === this__124572.arr[idx__124573 + 1]) {
        return tcoll
      }else {
        this__124572.arr[idx__124573 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__124574 = this;
  if(cljs.core.truth_(this__124574.editable_QMARK_)) {
    if(function() {
      var G__124575__124576 = o;
      if(G__124575__124576) {
        if(function() {
          var or__3824__auto____124577 = G__124575__124576.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____124577) {
            return or__3824__auto____124577
          }else {
            return G__124575__124576.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__124575__124576.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__124575__124576)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__124575__124576)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__124578 = cljs.core.seq.call(null, o);
      var tcoll__124579 = tcoll;
      while(true) {
        var temp__3971__auto____124580 = cljs.core.first.call(null, es__124578);
        if(cljs.core.truth_(temp__3971__auto____124580)) {
          var e__124581 = temp__3971__auto____124580;
          var G__124587 = cljs.core.next.call(null, es__124578);
          var G__124588 = tcoll__124579.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__124579, cljs.core.key.call(null, e__124581), cljs.core.val.call(null, e__124581));
          es__124578 = G__124587;
          tcoll__124579 = G__124588;
          continue
        }else {
          return tcoll__124579
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__124582 = this;
  if(cljs.core.truth_(this__124582.editable_QMARK_)) {
    this__124582.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__124582.len, 2), this__124582.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__124583 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__124584 = this;
  if(cljs.core.truth_(this__124584.editable_QMARK_)) {
    var idx__124585 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__124585 === -1) {
      return not_found
    }else {
      return this__124584.arr[idx__124585 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__124586 = this;
  if(cljs.core.truth_(this__124586.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__124586.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__124591 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__124592 = 0;
  while(true) {
    if(i__124592 < len) {
      var G__124593 = cljs.core.assoc_BANG_.call(null, out__124591, arr[i__124592], arr[i__124592 + 1]);
      var G__124594 = i__124592 + 2;
      out__124591 = G__124593;
      i__124592 = G__124594;
      continue
    }else {
      return out__124591
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2320__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__124599__124600 = arr.slice();
    G__124599__124600[i] = a;
    return G__124599__124600
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__124601__124602 = arr.slice();
    G__124601__124602[i] = a;
    G__124601__124602[j] = b;
    return G__124601__124602
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__124604 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__124604, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__124604, 2 * i, new_arr__124604.length - 2 * i);
  return new_arr__124604
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__124607 = inode.ensure_editable(edit);
    editable__124607.arr[i] = a;
    return editable__124607
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__124608 = inode.ensure_editable(edit);
    editable__124608.arr[i] = a;
    editable__124608.arr[j] = b;
    return editable__124608
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__124615 = arr.length;
  var i__124616 = 0;
  var init__124617 = init;
  while(true) {
    if(i__124616 < len__124615) {
      var init__124620 = function() {
        var k__124618 = arr[i__124616];
        if(!(k__124618 == null)) {
          return f.call(null, init__124617, k__124618, arr[i__124616 + 1])
        }else {
          var node__124619 = arr[i__124616 + 1];
          if(!(node__124619 == null)) {
            return node__124619.kv_reduce(f, init__124617)
          }else {
            return init__124617
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__124620)) {
        return cljs.core.deref.call(null, init__124620)
      }else {
        var G__124621 = i__124616 + 2;
        var G__124622 = init__124620;
        i__124616 = G__124621;
        init__124617 = G__124622;
        continue
      }
    }else {
      return init__124617
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__124623 = this;
  var inode__124624 = this;
  if(this__124623.bitmap === bit) {
    return null
  }else {
    var editable__124625 = inode__124624.ensure_editable(e);
    var earr__124626 = editable__124625.arr;
    var len__124627 = earr__124626.length;
    editable__124625.bitmap = bit ^ editable__124625.bitmap;
    cljs.core.array_copy.call(null, earr__124626, 2 * (i + 1), earr__124626, 2 * i, len__124627 - 2 * (i + 1));
    earr__124626[len__124627 - 2] = null;
    earr__124626[len__124627 - 1] = null;
    return editable__124625
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__124628 = this;
  var inode__124629 = this;
  var bit__124630 = 1 << (hash >>> shift & 31);
  var idx__124631 = cljs.core.bitmap_indexed_node_index.call(null, this__124628.bitmap, bit__124630);
  if((this__124628.bitmap & bit__124630) === 0) {
    var n__124632 = cljs.core.bit_count.call(null, this__124628.bitmap);
    if(2 * n__124632 < this__124628.arr.length) {
      var editable__124633 = inode__124629.ensure_editable(edit);
      var earr__124634 = editable__124633.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__124634, 2 * idx__124631, earr__124634, 2 * (idx__124631 + 1), 2 * (n__124632 - idx__124631));
      earr__124634[2 * idx__124631] = key;
      earr__124634[2 * idx__124631 + 1] = val;
      editable__124633.bitmap = editable__124633.bitmap | bit__124630;
      return editable__124633
    }else {
      if(n__124632 >= 16) {
        var nodes__124635 = cljs.core.make_array.call(null, 32);
        var jdx__124636 = hash >>> shift & 31;
        nodes__124635[jdx__124636] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__124637 = 0;
        var j__124638 = 0;
        while(true) {
          if(i__124637 < 32) {
            if((this__124628.bitmap >>> i__124637 & 1) === 0) {
              var G__124691 = i__124637 + 1;
              var G__124692 = j__124638;
              i__124637 = G__124691;
              j__124638 = G__124692;
              continue
            }else {
              nodes__124635[i__124637] = !(this__124628.arr[j__124638] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__124628.arr[j__124638]), this__124628.arr[j__124638], this__124628.arr[j__124638 + 1], added_leaf_QMARK_) : this__124628.arr[j__124638 + 1];
              var G__124693 = i__124637 + 1;
              var G__124694 = j__124638 + 2;
              i__124637 = G__124693;
              j__124638 = G__124694;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__124632 + 1, nodes__124635)
      }else {
        if("\ufdd0'else") {
          var new_arr__124639 = cljs.core.make_array.call(null, 2 * (n__124632 + 4));
          cljs.core.array_copy.call(null, this__124628.arr, 0, new_arr__124639, 0, 2 * idx__124631);
          new_arr__124639[2 * idx__124631] = key;
          new_arr__124639[2 * idx__124631 + 1] = val;
          cljs.core.array_copy.call(null, this__124628.arr, 2 * idx__124631, new_arr__124639, 2 * (idx__124631 + 1), 2 * (n__124632 - idx__124631));
          added_leaf_QMARK_.val = true;
          var editable__124640 = inode__124629.ensure_editable(edit);
          editable__124640.arr = new_arr__124639;
          editable__124640.bitmap = editable__124640.bitmap | bit__124630;
          return editable__124640
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__124641 = this__124628.arr[2 * idx__124631];
    var val_or_node__124642 = this__124628.arr[2 * idx__124631 + 1];
    if(key_or_nil__124641 == null) {
      var n__124643 = val_or_node__124642.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__124643 === val_or_node__124642) {
        return inode__124629
      }else {
        return cljs.core.edit_and_set.call(null, inode__124629, edit, 2 * idx__124631 + 1, n__124643)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__124641)) {
        if(val === val_or_node__124642) {
          return inode__124629
        }else {
          return cljs.core.edit_and_set.call(null, inode__124629, edit, 2 * idx__124631 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__124629, edit, 2 * idx__124631, null, 2 * idx__124631 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__124641, val_or_node__124642, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__124644 = this;
  var inode__124645 = this;
  return cljs.core.create_inode_seq.call(null, this__124644.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__124646 = this;
  var inode__124647 = this;
  var bit__124648 = 1 << (hash >>> shift & 31);
  if((this__124646.bitmap & bit__124648) === 0) {
    return inode__124647
  }else {
    var idx__124649 = cljs.core.bitmap_indexed_node_index.call(null, this__124646.bitmap, bit__124648);
    var key_or_nil__124650 = this__124646.arr[2 * idx__124649];
    var val_or_node__124651 = this__124646.arr[2 * idx__124649 + 1];
    if(key_or_nil__124650 == null) {
      var n__124652 = val_or_node__124651.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__124652 === val_or_node__124651) {
        return inode__124647
      }else {
        if(!(n__124652 == null)) {
          return cljs.core.edit_and_set.call(null, inode__124647, edit, 2 * idx__124649 + 1, n__124652)
        }else {
          if(this__124646.bitmap === bit__124648) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__124647.edit_and_remove_pair(edit, bit__124648, idx__124649)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__124650)) {
        removed_leaf_QMARK_[0] = true;
        return inode__124647.edit_and_remove_pair(edit, bit__124648, idx__124649)
      }else {
        if("\ufdd0'else") {
          return inode__124647
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__124653 = this;
  var inode__124654 = this;
  if(e === this__124653.edit) {
    return inode__124654
  }else {
    var n__124655 = cljs.core.bit_count.call(null, this__124653.bitmap);
    var new_arr__124656 = cljs.core.make_array.call(null, n__124655 < 0 ? 4 : 2 * (n__124655 + 1));
    cljs.core.array_copy.call(null, this__124653.arr, 0, new_arr__124656, 0, 2 * n__124655);
    return new cljs.core.BitmapIndexedNode(e, this__124653.bitmap, new_arr__124656)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__124657 = this;
  var inode__124658 = this;
  return cljs.core.inode_kv_reduce.call(null, this__124657.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__124659 = this;
  var inode__124660 = this;
  var bit__124661 = 1 << (hash >>> shift & 31);
  if((this__124659.bitmap & bit__124661) === 0) {
    return not_found
  }else {
    var idx__124662 = cljs.core.bitmap_indexed_node_index.call(null, this__124659.bitmap, bit__124661);
    var key_or_nil__124663 = this__124659.arr[2 * idx__124662];
    var val_or_node__124664 = this__124659.arr[2 * idx__124662 + 1];
    if(key_or_nil__124663 == null) {
      return val_or_node__124664.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__124663)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__124663, val_or_node__124664], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__124665 = this;
  var inode__124666 = this;
  var bit__124667 = 1 << (hash >>> shift & 31);
  if((this__124665.bitmap & bit__124667) === 0) {
    return inode__124666
  }else {
    var idx__124668 = cljs.core.bitmap_indexed_node_index.call(null, this__124665.bitmap, bit__124667);
    var key_or_nil__124669 = this__124665.arr[2 * idx__124668];
    var val_or_node__124670 = this__124665.arr[2 * idx__124668 + 1];
    if(key_or_nil__124669 == null) {
      var n__124671 = val_or_node__124670.inode_without(shift + 5, hash, key);
      if(n__124671 === val_or_node__124670) {
        return inode__124666
      }else {
        if(!(n__124671 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__124665.bitmap, cljs.core.clone_and_set.call(null, this__124665.arr, 2 * idx__124668 + 1, n__124671))
        }else {
          if(this__124665.bitmap === bit__124667) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__124665.bitmap ^ bit__124667, cljs.core.remove_pair.call(null, this__124665.arr, idx__124668))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__124669)) {
        return new cljs.core.BitmapIndexedNode(null, this__124665.bitmap ^ bit__124667, cljs.core.remove_pair.call(null, this__124665.arr, idx__124668))
      }else {
        if("\ufdd0'else") {
          return inode__124666
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__124672 = this;
  var inode__124673 = this;
  var bit__124674 = 1 << (hash >>> shift & 31);
  var idx__124675 = cljs.core.bitmap_indexed_node_index.call(null, this__124672.bitmap, bit__124674);
  if((this__124672.bitmap & bit__124674) === 0) {
    var n__124676 = cljs.core.bit_count.call(null, this__124672.bitmap);
    if(n__124676 >= 16) {
      var nodes__124677 = cljs.core.make_array.call(null, 32);
      var jdx__124678 = hash >>> shift & 31;
      nodes__124677[jdx__124678] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__124679 = 0;
      var j__124680 = 0;
      while(true) {
        if(i__124679 < 32) {
          if((this__124672.bitmap >>> i__124679 & 1) === 0) {
            var G__124695 = i__124679 + 1;
            var G__124696 = j__124680;
            i__124679 = G__124695;
            j__124680 = G__124696;
            continue
          }else {
            nodes__124677[i__124679] = !(this__124672.arr[j__124680] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__124672.arr[j__124680]), this__124672.arr[j__124680], this__124672.arr[j__124680 + 1], added_leaf_QMARK_) : this__124672.arr[j__124680 + 1];
            var G__124697 = i__124679 + 1;
            var G__124698 = j__124680 + 2;
            i__124679 = G__124697;
            j__124680 = G__124698;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__124676 + 1, nodes__124677)
    }else {
      var new_arr__124681 = cljs.core.make_array.call(null, 2 * (n__124676 + 1));
      cljs.core.array_copy.call(null, this__124672.arr, 0, new_arr__124681, 0, 2 * idx__124675);
      new_arr__124681[2 * idx__124675] = key;
      new_arr__124681[2 * idx__124675 + 1] = val;
      cljs.core.array_copy.call(null, this__124672.arr, 2 * idx__124675, new_arr__124681, 2 * (idx__124675 + 1), 2 * (n__124676 - idx__124675));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__124672.bitmap | bit__124674, new_arr__124681)
    }
  }else {
    var key_or_nil__124682 = this__124672.arr[2 * idx__124675];
    var val_or_node__124683 = this__124672.arr[2 * idx__124675 + 1];
    if(key_or_nil__124682 == null) {
      var n__124684 = val_or_node__124683.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__124684 === val_or_node__124683) {
        return inode__124673
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__124672.bitmap, cljs.core.clone_and_set.call(null, this__124672.arr, 2 * idx__124675 + 1, n__124684))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__124682)) {
        if(val === val_or_node__124683) {
          return inode__124673
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__124672.bitmap, cljs.core.clone_and_set.call(null, this__124672.arr, 2 * idx__124675 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__124672.bitmap, cljs.core.clone_and_set.call(null, this__124672.arr, 2 * idx__124675, null, 2 * idx__124675 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__124682, val_or_node__124683, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__124685 = this;
  var inode__124686 = this;
  var bit__124687 = 1 << (hash >>> shift & 31);
  if((this__124685.bitmap & bit__124687) === 0) {
    return not_found
  }else {
    var idx__124688 = cljs.core.bitmap_indexed_node_index.call(null, this__124685.bitmap, bit__124687);
    var key_or_nil__124689 = this__124685.arr[2 * idx__124688];
    var val_or_node__124690 = this__124685.arr[2 * idx__124688 + 1];
    if(key_or_nil__124689 == null) {
      return val_or_node__124690.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__124689)) {
        return val_or_node__124690
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__124706 = array_node.arr;
  var len__124707 = 2 * (array_node.cnt - 1);
  var new_arr__124708 = cljs.core.make_array.call(null, len__124707);
  var i__124709 = 0;
  var j__124710 = 1;
  var bitmap__124711 = 0;
  while(true) {
    if(i__124709 < len__124707) {
      if(function() {
        var and__3822__auto____124712 = !(i__124709 === idx);
        if(and__3822__auto____124712) {
          return!(arr__124706[i__124709] == null)
        }else {
          return and__3822__auto____124712
        }
      }()) {
        new_arr__124708[j__124710] = arr__124706[i__124709];
        var G__124713 = i__124709 + 1;
        var G__124714 = j__124710 + 2;
        var G__124715 = bitmap__124711 | 1 << i__124709;
        i__124709 = G__124713;
        j__124710 = G__124714;
        bitmap__124711 = G__124715;
        continue
      }else {
        var G__124716 = i__124709 + 1;
        var G__124717 = j__124710;
        var G__124718 = bitmap__124711;
        i__124709 = G__124716;
        j__124710 = G__124717;
        bitmap__124711 = G__124718;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__124711, new_arr__124708)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__124719 = this;
  var inode__124720 = this;
  var idx__124721 = hash >>> shift & 31;
  var node__124722 = this__124719.arr[idx__124721];
  if(node__124722 == null) {
    var editable__124723 = cljs.core.edit_and_set.call(null, inode__124720, edit, idx__124721, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__124723.cnt = editable__124723.cnt + 1;
    return editable__124723
  }else {
    var n__124724 = node__124722.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__124724 === node__124722) {
      return inode__124720
    }else {
      return cljs.core.edit_and_set.call(null, inode__124720, edit, idx__124721, n__124724)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__124725 = this;
  var inode__124726 = this;
  return cljs.core.create_array_node_seq.call(null, this__124725.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__124727 = this;
  var inode__124728 = this;
  var idx__124729 = hash >>> shift & 31;
  var node__124730 = this__124727.arr[idx__124729];
  if(node__124730 == null) {
    return inode__124728
  }else {
    var n__124731 = node__124730.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__124731 === node__124730) {
      return inode__124728
    }else {
      if(n__124731 == null) {
        if(this__124727.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__124728, edit, idx__124729)
        }else {
          var editable__124732 = cljs.core.edit_and_set.call(null, inode__124728, edit, idx__124729, n__124731);
          editable__124732.cnt = editable__124732.cnt - 1;
          return editable__124732
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__124728, edit, idx__124729, n__124731)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__124733 = this;
  var inode__124734 = this;
  if(e === this__124733.edit) {
    return inode__124734
  }else {
    return new cljs.core.ArrayNode(e, this__124733.cnt, this__124733.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__124735 = this;
  var inode__124736 = this;
  var len__124737 = this__124735.arr.length;
  var i__124738 = 0;
  var init__124739 = init;
  while(true) {
    if(i__124738 < len__124737) {
      var node__124740 = this__124735.arr[i__124738];
      if(!(node__124740 == null)) {
        var init__124741 = node__124740.kv_reduce(f, init__124739);
        if(cljs.core.reduced_QMARK_.call(null, init__124741)) {
          return cljs.core.deref.call(null, init__124741)
        }else {
          var G__124760 = i__124738 + 1;
          var G__124761 = init__124741;
          i__124738 = G__124760;
          init__124739 = G__124761;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__124739
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__124742 = this;
  var inode__124743 = this;
  var idx__124744 = hash >>> shift & 31;
  var node__124745 = this__124742.arr[idx__124744];
  if(!(node__124745 == null)) {
    return node__124745.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__124746 = this;
  var inode__124747 = this;
  var idx__124748 = hash >>> shift & 31;
  var node__124749 = this__124746.arr[idx__124748];
  if(!(node__124749 == null)) {
    var n__124750 = node__124749.inode_without(shift + 5, hash, key);
    if(n__124750 === node__124749) {
      return inode__124747
    }else {
      if(n__124750 == null) {
        if(this__124746.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__124747, null, idx__124748)
        }else {
          return new cljs.core.ArrayNode(null, this__124746.cnt - 1, cljs.core.clone_and_set.call(null, this__124746.arr, idx__124748, n__124750))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__124746.cnt, cljs.core.clone_and_set.call(null, this__124746.arr, idx__124748, n__124750))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__124747
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__124751 = this;
  var inode__124752 = this;
  var idx__124753 = hash >>> shift & 31;
  var node__124754 = this__124751.arr[idx__124753];
  if(node__124754 == null) {
    return new cljs.core.ArrayNode(null, this__124751.cnt + 1, cljs.core.clone_and_set.call(null, this__124751.arr, idx__124753, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__124755 = node__124754.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__124755 === node__124754) {
      return inode__124752
    }else {
      return new cljs.core.ArrayNode(null, this__124751.cnt, cljs.core.clone_and_set.call(null, this__124751.arr, idx__124753, n__124755))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__124756 = this;
  var inode__124757 = this;
  var idx__124758 = hash >>> shift & 31;
  var node__124759 = this__124756.arr[idx__124758];
  if(!(node__124759 == null)) {
    return node__124759.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__124764 = 2 * cnt;
  var i__124765 = 0;
  while(true) {
    if(i__124765 < lim__124764) {
      if(cljs.core.key_test.call(null, key, arr[i__124765])) {
        return i__124765
      }else {
        var G__124766 = i__124765 + 2;
        i__124765 = G__124766;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__124767 = this;
  var inode__124768 = this;
  if(hash === this__124767.collision_hash) {
    var idx__124769 = cljs.core.hash_collision_node_find_index.call(null, this__124767.arr, this__124767.cnt, key);
    if(idx__124769 === -1) {
      if(this__124767.arr.length > 2 * this__124767.cnt) {
        var editable__124770 = cljs.core.edit_and_set.call(null, inode__124768, edit, 2 * this__124767.cnt, key, 2 * this__124767.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__124770.cnt = editable__124770.cnt + 1;
        return editable__124770
      }else {
        var len__124771 = this__124767.arr.length;
        var new_arr__124772 = cljs.core.make_array.call(null, len__124771 + 2);
        cljs.core.array_copy.call(null, this__124767.arr, 0, new_arr__124772, 0, len__124771);
        new_arr__124772[len__124771] = key;
        new_arr__124772[len__124771 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__124768.ensure_editable_array(edit, this__124767.cnt + 1, new_arr__124772)
      }
    }else {
      if(this__124767.arr[idx__124769 + 1] === val) {
        return inode__124768
      }else {
        return cljs.core.edit_and_set.call(null, inode__124768, edit, idx__124769 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__124767.collision_hash >>> shift & 31), [null, inode__124768, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__124773 = this;
  var inode__124774 = this;
  return cljs.core.create_inode_seq.call(null, this__124773.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__124775 = this;
  var inode__124776 = this;
  var idx__124777 = cljs.core.hash_collision_node_find_index.call(null, this__124775.arr, this__124775.cnt, key);
  if(idx__124777 === -1) {
    return inode__124776
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__124775.cnt === 1) {
      return null
    }else {
      var editable__124778 = inode__124776.ensure_editable(edit);
      var earr__124779 = editable__124778.arr;
      earr__124779[idx__124777] = earr__124779[2 * this__124775.cnt - 2];
      earr__124779[idx__124777 + 1] = earr__124779[2 * this__124775.cnt - 1];
      earr__124779[2 * this__124775.cnt - 1] = null;
      earr__124779[2 * this__124775.cnt - 2] = null;
      editable__124778.cnt = editable__124778.cnt - 1;
      return editable__124778
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__124780 = this;
  var inode__124781 = this;
  if(e === this__124780.edit) {
    return inode__124781
  }else {
    var new_arr__124782 = cljs.core.make_array.call(null, 2 * (this__124780.cnt + 1));
    cljs.core.array_copy.call(null, this__124780.arr, 0, new_arr__124782, 0, 2 * this__124780.cnt);
    return new cljs.core.HashCollisionNode(e, this__124780.collision_hash, this__124780.cnt, new_arr__124782)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__124783 = this;
  var inode__124784 = this;
  return cljs.core.inode_kv_reduce.call(null, this__124783.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__124785 = this;
  var inode__124786 = this;
  var idx__124787 = cljs.core.hash_collision_node_find_index.call(null, this__124785.arr, this__124785.cnt, key);
  if(idx__124787 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__124785.arr[idx__124787])) {
      return cljs.core.PersistentVector.fromArray([this__124785.arr[idx__124787], this__124785.arr[idx__124787 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__124788 = this;
  var inode__124789 = this;
  var idx__124790 = cljs.core.hash_collision_node_find_index.call(null, this__124788.arr, this__124788.cnt, key);
  if(idx__124790 === -1) {
    return inode__124789
  }else {
    if(this__124788.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__124788.collision_hash, this__124788.cnt - 1, cljs.core.remove_pair.call(null, this__124788.arr, cljs.core.quot.call(null, idx__124790, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__124791 = this;
  var inode__124792 = this;
  if(hash === this__124791.collision_hash) {
    var idx__124793 = cljs.core.hash_collision_node_find_index.call(null, this__124791.arr, this__124791.cnt, key);
    if(idx__124793 === -1) {
      var len__124794 = this__124791.arr.length;
      var new_arr__124795 = cljs.core.make_array.call(null, len__124794 + 2);
      cljs.core.array_copy.call(null, this__124791.arr, 0, new_arr__124795, 0, len__124794);
      new_arr__124795[len__124794] = key;
      new_arr__124795[len__124794 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__124791.collision_hash, this__124791.cnt + 1, new_arr__124795)
    }else {
      if(cljs.core._EQ_.call(null, this__124791.arr[idx__124793], val)) {
        return inode__124792
      }else {
        return new cljs.core.HashCollisionNode(null, this__124791.collision_hash, this__124791.cnt, cljs.core.clone_and_set.call(null, this__124791.arr, idx__124793 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__124791.collision_hash >>> shift & 31), [null, inode__124792])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__124796 = this;
  var inode__124797 = this;
  var idx__124798 = cljs.core.hash_collision_node_find_index.call(null, this__124796.arr, this__124796.cnt, key);
  if(idx__124798 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__124796.arr[idx__124798])) {
      return this__124796.arr[idx__124798 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__124799 = this;
  var inode__124800 = this;
  if(e === this__124799.edit) {
    this__124799.arr = array;
    this__124799.cnt = count;
    return inode__124800
  }else {
    return new cljs.core.HashCollisionNode(this__124799.edit, this__124799.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__124805 = cljs.core.hash.call(null, key1);
    if(key1hash__124805 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__124805, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___124806 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__124805, key1, val1, added_leaf_QMARK___124806).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___124806)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__124807 = cljs.core.hash.call(null, key1);
    if(key1hash__124807 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__124807, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___124808 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__124807, key1, val1, added_leaf_QMARK___124808).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___124808)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124809 = this;
  var h__2202__auto____124810 = this__124809.__hash;
  if(!(h__2202__auto____124810 == null)) {
    return h__2202__auto____124810
  }else {
    var h__2202__auto____124811 = cljs.core.hash_coll.call(null, coll);
    this__124809.__hash = h__2202__auto____124811;
    return h__2202__auto____124811
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124812 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__124813 = this;
  var this__124814 = this;
  return cljs.core.pr_str.call(null, this__124814)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__124815 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__124816 = this;
  if(this__124816.s == null) {
    return cljs.core.PersistentVector.fromArray([this__124816.nodes[this__124816.i], this__124816.nodes[this__124816.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__124816.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__124817 = this;
  if(this__124817.s == null) {
    return cljs.core.create_inode_seq.call(null, this__124817.nodes, this__124817.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__124817.nodes, this__124817.i, cljs.core.next.call(null, this__124817.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124818 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124819 = this;
  return new cljs.core.NodeSeq(meta, this__124819.nodes, this__124819.i, this__124819.s, this__124819.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124820 = this;
  return this__124820.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124821 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__124821.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__124828 = nodes.length;
      var j__124829 = i;
      while(true) {
        if(j__124829 < len__124828) {
          if(!(nodes[j__124829] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__124829, null, null)
          }else {
            var temp__3971__auto____124830 = nodes[j__124829 + 1];
            if(cljs.core.truth_(temp__3971__auto____124830)) {
              var node__124831 = temp__3971__auto____124830;
              var temp__3971__auto____124832 = node__124831.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____124832)) {
                var node_seq__124833 = temp__3971__auto____124832;
                return new cljs.core.NodeSeq(null, nodes, j__124829 + 2, node_seq__124833, null)
              }else {
                var G__124834 = j__124829 + 2;
                j__124829 = G__124834;
                continue
              }
            }else {
              var G__124835 = j__124829 + 2;
              j__124829 = G__124835;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124836 = this;
  var h__2202__auto____124837 = this__124836.__hash;
  if(!(h__2202__auto____124837 == null)) {
    return h__2202__auto____124837
  }else {
    var h__2202__auto____124838 = cljs.core.hash_coll.call(null, coll);
    this__124836.__hash = h__2202__auto____124838;
    return h__2202__auto____124838
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124839 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__124840 = this;
  var this__124841 = this;
  return cljs.core.pr_str.call(null, this__124841)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__124842 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__124843 = this;
  return cljs.core.first.call(null, this__124843.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__124844 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__124844.nodes, this__124844.i, cljs.core.next.call(null, this__124844.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124845 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124846 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__124846.nodes, this__124846.i, this__124846.s, this__124846.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124847 = this;
  return this__124847.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124848 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__124848.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__124855 = nodes.length;
      var j__124856 = i;
      while(true) {
        if(j__124856 < len__124855) {
          var temp__3971__auto____124857 = nodes[j__124856];
          if(cljs.core.truth_(temp__3971__auto____124857)) {
            var nj__124858 = temp__3971__auto____124857;
            var temp__3971__auto____124859 = nj__124858.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____124859)) {
              var ns__124860 = temp__3971__auto____124859;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__124856 + 1, ns__124860, null)
            }else {
              var G__124861 = j__124856 + 1;
              j__124856 = G__124861;
              continue
            }
          }else {
            var G__124862 = j__124856 + 1;
            j__124856 = G__124862;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__124865 = this;
  return new cljs.core.TransientHashMap({}, this__124865.root, this__124865.cnt, this__124865.has_nil_QMARK_, this__124865.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124866 = this;
  var h__2202__auto____124867 = this__124866.__hash;
  if(!(h__2202__auto____124867 == null)) {
    return h__2202__auto____124867
  }else {
    var h__2202__auto____124868 = cljs.core.hash_imap.call(null, coll);
    this__124866.__hash = h__2202__auto____124868;
    return h__2202__auto____124868
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__124869 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__124870 = this;
  if(k == null) {
    if(this__124870.has_nil_QMARK_) {
      return this__124870.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__124870.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__124870.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__124871 = this;
  if(k == null) {
    if(function() {
      var and__3822__auto____124872 = this__124871.has_nil_QMARK_;
      if(and__3822__auto____124872) {
        return v === this__124871.nil_val
      }else {
        return and__3822__auto____124872
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__124871.meta, this__124871.has_nil_QMARK_ ? this__124871.cnt : this__124871.cnt + 1, this__124871.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___124873 = new cljs.core.Box(false);
    var new_root__124874 = (this__124871.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__124871.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___124873);
    if(new_root__124874 === this__124871.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__124871.meta, added_leaf_QMARK___124873.val ? this__124871.cnt + 1 : this__124871.cnt, new_root__124874, this__124871.has_nil_QMARK_, this__124871.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__124875 = this;
  if(k == null) {
    return this__124875.has_nil_QMARK_
  }else {
    if(this__124875.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__124875.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__124898 = null;
  var G__124898__2 = function(this_sym124876, k) {
    var this__124878 = this;
    var this_sym124876__124879 = this;
    var coll__124880 = this_sym124876__124879;
    return coll__124880.cljs$core$ILookup$_lookup$arity$2(coll__124880, k)
  };
  var G__124898__3 = function(this_sym124877, k, not_found) {
    var this__124878 = this;
    var this_sym124877__124881 = this;
    var coll__124882 = this_sym124877__124881;
    return coll__124882.cljs$core$ILookup$_lookup$arity$3(coll__124882, k, not_found)
  };
  G__124898 = function(this_sym124877, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__124898__2.call(this, this_sym124877, k);
      case 3:
        return G__124898__3.call(this, this_sym124877, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__124898
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym124863, args124864) {
  var this__124883 = this;
  return this_sym124863.call.apply(this_sym124863, [this_sym124863].concat(args124864.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__124884 = this;
  var init__124885 = this__124884.has_nil_QMARK_ ? f.call(null, init, null, this__124884.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__124885)) {
    return cljs.core.deref.call(null, init__124885)
  }else {
    if(!(this__124884.root == null)) {
      return this__124884.root.kv_reduce(f, init__124885)
    }else {
      if("\ufdd0'else") {
        return init__124885
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__124886 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__124887 = this;
  var this__124888 = this;
  return cljs.core.pr_str.call(null, this__124888)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__124889 = this;
  if(this__124889.cnt > 0) {
    var s__124890 = !(this__124889.root == null) ? this__124889.root.inode_seq() : null;
    if(this__124889.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__124889.nil_val], true), s__124890)
    }else {
      return s__124890
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124891 = this;
  return this__124891.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124892 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124893 = this;
  return new cljs.core.PersistentHashMap(meta, this__124893.cnt, this__124893.root, this__124893.has_nil_QMARK_, this__124893.nil_val, this__124893.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124894 = this;
  return this__124894.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124895 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__124895.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__124896 = this;
  if(k == null) {
    if(this__124896.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__124896.meta, this__124896.cnt - 1, this__124896.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__124896.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__124897 = this__124896.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__124897 === this__124896.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__124896.meta, this__124896.cnt - 1, new_root__124897, this__124896.has_nil_QMARK_, this__124896.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__124899 = ks.length;
  var i__124900 = 0;
  var out__124901 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__124900 < len__124899) {
      var G__124902 = i__124900 + 1;
      var G__124903 = cljs.core.assoc_BANG_.call(null, out__124901, ks[i__124900], vs[i__124900]);
      i__124900 = G__124902;
      out__124901 = G__124903;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__124901)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__124904 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__124905 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__124906 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__124907 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__124908 = this;
  if(k == null) {
    if(this__124908.has_nil_QMARK_) {
      return this__124908.nil_val
    }else {
      return null
    }
  }else {
    if(this__124908.root == null) {
      return null
    }else {
      return this__124908.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__124909 = this;
  if(k == null) {
    if(this__124909.has_nil_QMARK_) {
      return this__124909.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__124909.root == null) {
      return not_found
    }else {
      return this__124909.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124910 = this;
  if(this__124910.edit) {
    return this__124910.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__124911 = this;
  var tcoll__124912 = this;
  if(this__124911.edit) {
    if(function() {
      var G__124913__124914 = o;
      if(G__124913__124914) {
        if(function() {
          var or__3824__auto____124915 = G__124913__124914.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto____124915) {
            return or__3824__auto____124915
          }else {
            return G__124913__124914.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__124913__124914.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__124913__124914)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__124913__124914)
      }
    }()) {
      return tcoll__124912.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__124916 = cljs.core.seq.call(null, o);
      var tcoll__124917 = tcoll__124912;
      while(true) {
        var temp__3971__auto____124918 = cljs.core.first.call(null, es__124916);
        if(cljs.core.truth_(temp__3971__auto____124918)) {
          var e__124919 = temp__3971__auto____124918;
          var G__124930 = cljs.core.next.call(null, es__124916);
          var G__124931 = tcoll__124917.assoc_BANG_(cljs.core.key.call(null, e__124919), cljs.core.val.call(null, e__124919));
          es__124916 = G__124930;
          tcoll__124917 = G__124931;
          continue
        }else {
          return tcoll__124917
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__124920 = this;
  var tcoll__124921 = this;
  if(this__124920.edit) {
    if(k == null) {
      if(this__124920.nil_val === v) {
      }else {
        this__124920.nil_val = v
      }
      if(this__124920.has_nil_QMARK_) {
      }else {
        this__124920.count = this__124920.count + 1;
        this__124920.has_nil_QMARK_ = true
      }
      return tcoll__124921
    }else {
      var added_leaf_QMARK___124922 = new cljs.core.Box(false);
      var node__124923 = (this__124920.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__124920.root).inode_assoc_BANG_(this__124920.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___124922);
      if(node__124923 === this__124920.root) {
      }else {
        this__124920.root = node__124923
      }
      if(added_leaf_QMARK___124922.val) {
        this__124920.count = this__124920.count + 1
      }else {
      }
      return tcoll__124921
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__124924 = this;
  var tcoll__124925 = this;
  if(this__124924.edit) {
    if(k == null) {
      if(this__124924.has_nil_QMARK_) {
        this__124924.has_nil_QMARK_ = false;
        this__124924.nil_val = null;
        this__124924.count = this__124924.count - 1;
        return tcoll__124925
      }else {
        return tcoll__124925
      }
    }else {
      if(this__124924.root == null) {
        return tcoll__124925
      }else {
        var removed_leaf_QMARK___124926 = new cljs.core.Box(false);
        var node__124927 = this__124924.root.inode_without_BANG_(this__124924.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___124926);
        if(node__124927 === this__124924.root) {
        }else {
          this__124924.root = node__124927
        }
        if(cljs.core.truth_(removed_leaf_QMARK___124926[0])) {
          this__124924.count = this__124924.count - 1
        }else {
        }
        return tcoll__124925
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__124928 = this;
  var tcoll__124929 = this;
  if(this__124928.edit) {
    this__124928.edit = null;
    return new cljs.core.PersistentHashMap(null, this__124928.count, this__124928.root, this__124928.has_nil_QMARK_, this__124928.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__124934 = node;
  var stack__124935 = stack;
  while(true) {
    if(!(t__124934 == null)) {
      var G__124936 = ascending_QMARK_ ? t__124934.left : t__124934.right;
      var G__124937 = cljs.core.conj.call(null, stack__124935, t__124934);
      t__124934 = G__124936;
      stack__124935 = G__124937;
      continue
    }else {
      return stack__124935
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124938 = this;
  var h__2202__auto____124939 = this__124938.__hash;
  if(!(h__2202__auto____124939 == null)) {
    return h__2202__auto____124939
  }else {
    var h__2202__auto____124940 = cljs.core.hash_coll.call(null, coll);
    this__124938.__hash = h__2202__auto____124940;
    return h__2202__auto____124940
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__124941 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__124942 = this;
  var this__124943 = this;
  return cljs.core.pr_str.call(null, this__124943)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__124944 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__124945 = this;
  if(this__124945.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__124945.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__124946 = this;
  return cljs.core.peek.call(null, this__124946.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__124947 = this;
  var t__124948 = cljs.core.first.call(null, this__124947.stack);
  var next_stack__124949 = cljs.core.tree_map_seq_push.call(null, this__124947.ascending_QMARK_ ? t__124948.right : t__124948.left, cljs.core.next.call(null, this__124947.stack), this__124947.ascending_QMARK_);
  if(!(next_stack__124949 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__124949, this__124947.ascending_QMARK_, this__124947.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__124950 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__124951 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__124951.stack, this__124951.ascending_QMARK_, this__124951.cnt, this__124951.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__124952 = this;
  return this__124952.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__124953 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__124953.meta)
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____124955 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____124955) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____124955
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____124957 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____124957) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____124957
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__124961 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__124961)) {
    return cljs.core.deref.call(null, init__124961)
  }else {
    var init__124962 = f.call(null, init__124961, node.key, node.val);
    if(cljs.core.reduced_QMARK_.call(null, init__124962)) {
      return cljs.core.deref.call(null, init__124962)
    }else {
      var init__124963 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__124962) : init__124962;
      if(cljs.core.reduced_QMARK_.call(null, init__124963)) {
        return cljs.core.deref.call(null, init__124963)
      }else {
        return init__124963
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__124966 = this;
  var h__2202__auto____124967 = this__124966.__hash;
  if(!(h__2202__auto____124967 == null)) {
    return h__2202__auto____124967
  }else {
    var h__2202__auto____124968 = cljs.core.hash_coll.call(null, coll);
    this__124966.__hash = h__2202__auto____124968;
    return h__2202__auto____124968
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__124969 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__124970 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__124971 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__124971.key, this__124971.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__125019 = null;
  var G__125019__2 = function(this_sym124972, k) {
    var this__124974 = this;
    var this_sym124972__124975 = this;
    var node__124976 = this_sym124972__124975;
    return node__124976.cljs$core$ILookup$_lookup$arity$2(node__124976, k)
  };
  var G__125019__3 = function(this_sym124973, k, not_found) {
    var this__124974 = this;
    var this_sym124973__124977 = this;
    var node__124978 = this_sym124973__124977;
    return node__124978.cljs$core$ILookup$_lookup$arity$3(node__124978, k, not_found)
  };
  G__125019 = function(this_sym124973, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__125019__2.call(this, this_sym124973, k);
      case 3:
        return G__125019__3.call(this, this_sym124973, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125019
}();
cljs.core.BlackNode.prototype.apply = function(this_sym124964, args124965) {
  var this__124979 = this;
  return this_sym124964.call.apply(this_sym124964, [this_sym124964].concat(args124965.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__124980 = this;
  return cljs.core.PersistentVector.fromArray([this__124980.key, this__124980.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__124981 = this;
  return this__124981.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__124982 = this;
  return this__124982.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__124983 = this;
  var node__124984 = this;
  return ins.balance_right(node__124984)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__124985 = this;
  var node__124986 = this;
  return new cljs.core.RedNode(this__124985.key, this__124985.val, this__124985.left, this__124985.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__124987 = this;
  var node__124988 = this;
  return cljs.core.balance_right_del.call(null, this__124987.key, this__124987.val, this__124987.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__124989 = this;
  var node__124990 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__124991 = this;
  var node__124992 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__124992, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__124993 = this;
  var node__124994 = this;
  return cljs.core.balance_left_del.call(null, this__124993.key, this__124993.val, del, this__124993.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__124995 = this;
  var node__124996 = this;
  return ins.balance_left(node__124996)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__124997 = this;
  var node__124998 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__124998, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__125020 = null;
  var G__125020__0 = function() {
    var this__124999 = this;
    var this__125001 = this;
    return cljs.core.pr_str.call(null, this__125001)
  };
  G__125020 = function() {
    switch(arguments.length) {
      case 0:
        return G__125020__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125020
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__125002 = this;
  var node__125003 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__125003, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__125004 = this;
  var node__125005 = this;
  return node__125005
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__125006 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__125007 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__125008 = this;
  return cljs.core.list.call(null, this__125008.key, this__125008.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__125009 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__125010 = this;
  return this__125010.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__125011 = this;
  return cljs.core.PersistentVector.fromArray([this__125011.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__125012 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__125012.key, this__125012.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__125013 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__125014 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__125014.key, this__125014.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__125015 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__125016 = this;
  if(n === 0) {
    return this__125016.key
  }else {
    if(n === 1) {
      return this__125016.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__125017 = this;
  if(n === 0) {
    return this__125017.key
  }else {
    if(n === 1) {
      return this__125017.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__125018 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__125023 = this;
  var h__2202__auto____125024 = this__125023.__hash;
  if(!(h__2202__auto____125024 == null)) {
    return h__2202__auto____125024
  }else {
    var h__2202__auto____125025 = cljs.core.hash_coll.call(null, coll);
    this__125023.__hash = h__2202__auto____125025;
    return h__2202__auto____125025
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__125026 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__125027 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__125028 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__125028.key, this__125028.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__125076 = null;
  var G__125076__2 = function(this_sym125029, k) {
    var this__125031 = this;
    var this_sym125029__125032 = this;
    var node__125033 = this_sym125029__125032;
    return node__125033.cljs$core$ILookup$_lookup$arity$2(node__125033, k)
  };
  var G__125076__3 = function(this_sym125030, k, not_found) {
    var this__125031 = this;
    var this_sym125030__125034 = this;
    var node__125035 = this_sym125030__125034;
    return node__125035.cljs$core$ILookup$_lookup$arity$3(node__125035, k, not_found)
  };
  G__125076 = function(this_sym125030, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__125076__2.call(this, this_sym125030, k);
      case 3:
        return G__125076__3.call(this, this_sym125030, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125076
}();
cljs.core.RedNode.prototype.apply = function(this_sym125021, args125022) {
  var this__125036 = this;
  return this_sym125021.call.apply(this_sym125021, [this_sym125021].concat(args125022.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__125037 = this;
  return cljs.core.PersistentVector.fromArray([this__125037.key, this__125037.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__125038 = this;
  return this__125038.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__125039 = this;
  return this__125039.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__125040 = this;
  var node__125041 = this;
  return new cljs.core.RedNode(this__125040.key, this__125040.val, this__125040.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__125042 = this;
  var node__125043 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__125044 = this;
  var node__125045 = this;
  return new cljs.core.RedNode(this__125044.key, this__125044.val, this__125044.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__125046 = this;
  var node__125047 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__125048 = this;
  var node__125049 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__125049, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__125050 = this;
  var node__125051 = this;
  return new cljs.core.RedNode(this__125050.key, this__125050.val, del, this__125050.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__125052 = this;
  var node__125053 = this;
  return new cljs.core.RedNode(this__125052.key, this__125052.val, ins, this__125052.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__125054 = this;
  var node__125055 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__125054.left)) {
    return new cljs.core.RedNode(this__125054.key, this__125054.val, this__125054.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__125054.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__125054.right)) {
      return new cljs.core.RedNode(this__125054.right.key, this__125054.right.val, new cljs.core.BlackNode(this__125054.key, this__125054.val, this__125054.left, this__125054.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__125054.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__125055, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__125077 = null;
  var G__125077__0 = function() {
    var this__125056 = this;
    var this__125058 = this;
    return cljs.core.pr_str.call(null, this__125058)
  };
  G__125077 = function() {
    switch(arguments.length) {
      case 0:
        return G__125077__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125077
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__125059 = this;
  var node__125060 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__125059.right)) {
    return new cljs.core.RedNode(this__125059.key, this__125059.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__125059.left, null), this__125059.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__125059.left)) {
      return new cljs.core.RedNode(this__125059.left.key, this__125059.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__125059.left.left, null), new cljs.core.BlackNode(this__125059.key, this__125059.val, this__125059.left.right, this__125059.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__125060, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__125061 = this;
  var node__125062 = this;
  return new cljs.core.BlackNode(this__125061.key, this__125061.val, this__125061.left, this__125061.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__125063 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__125064 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__125065 = this;
  return cljs.core.list.call(null, this__125065.key, this__125065.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__125066 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__125067 = this;
  return this__125067.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__125068 = this;
  return cljs.core.PersistentVector.fromArray([this__125068.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__125069 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__125069.key, this__125069.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__125070 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__125071 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__125071.key, this__125071.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__125072 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__125073 = this;
  if(n === 0) {
    return this__125073.key
  }else {
    if(n === 1) {
      return this__125073.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__125074 = this;
  if(n === 0) {
    return this__125074.key
  }else {
    if(n === 1) {
      return this__125074.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__125075 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__125081 = comp.call(null, k, tree.key);
    if(c__125081 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__125081 < 0) {
        var ins__125082 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__125082 == null)) {
          return tree.add_left(ins__125082)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__125083 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__125083 == null)) {
            return tree.add_right(ins__125083)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__125086 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__125086)) {
            return new cljs.core.RedNode(app__125086.key, app__125086.val, new cljs.core.RedNode(left.key, left.val, left.left, app__125086.left, null), new cljs.core.RedNode(right.key, right.val, app__125086.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__125086, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__125087 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__125087)) {
              return new cljs.core.RedNode(app__125087.key, app__125087.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__125087.left, null), new cljs.core.BlackNode(right.key, right.val, app__125087.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__125087, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__125093 = comp.call(null, k, tree.key);
    if(c__125093 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__125093 < 0) {
        var del__125094 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____125095 = !(del__125094 == null);
          if(or__3824__auto____125095) {
            return or__3824__auto____125095
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__125094, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__125094, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__125096 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____125097 = !(del__125096 == null);
            if(or__3824__auto____125097) {
              return or__3824__auto____125097
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__125096)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__125096, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__125100 = tree.key;
  var c__125101 = comp.call(null, k, tk__125100);
  if(c__125101 === 0) {
    return tree.replace(tk__125100, v, tree.left, tree.right)
  }else {
    if(c__125101 < 0) {
      return tree.replace(tk__125100, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__125100, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__125104 = this;
  var h__2202__auto____125105 = this__125104.__hash;
  if(!(h__2202__auto____125105 == null)) {
    return h__2202__auto____125105
  }else {
    var h__2202__auto____125106 = cljs.core.hash_imap.call(null, coll);
    this__125104.__hash = h__2202__auto____125106;
    return h__2202__auto____125106
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__125107 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__125108 = this;
  var n__125109 = coll.entry_at(k);
  if(!(n__125109 == null)) {
    return n__125109.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__125110 = this;
  var found__125111 = [null];
  var t__125112 = cljs.core.tree_map_add.call(null, this__125110.comp, this__125110.tree, k, v, found__125111);
  if(t__125112 == null) {
    var found_node__125113 = cljs.core.nth.call(null, found__125111, 0);
    if(cljs.core._EQ_.call(null, v, found_node__125113.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__125110.comp, cljs.core.tree_map_replace.call(null, this__125110.comp, this__125110.tree, k, v), this__125110.cnt, this__125110.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__125110.comp, t__125112.blacken(), this__125110.cnt + 1, this__125110.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__125114 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__125148 = null;
  var G__125148__2 = function(this_sym125115, k) {
    var this__125117 = this;
    var this_sym125115__125118 = this;
    var coll__125119 = this_sym125115__125118;
    return coll__125119.cljs$core$ILookup$_lookup$arity$2(coll__125119, k)
  };
  var G__125148__3 = function(this_sym125116, k, not_found) {
    var this__125117 = this;
    var this_sym125116__125120 = this;
    var coll__125121 = this_sym125116__125120;
    return coll__125121.cljs$core$ILookup$_lookup$arity$3(coll__125121, k, not_found)
  };
  G__125148 = function(this_sym125116, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__125148__2.call(this, this_sym125116, k);
      case 3:
        return G__125148__3.call(this, this_sym125116, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125148
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym125102, args125103) {
  var this__125122 = this;
  return this_sym125102.call.apply(this_sym125102, [this_sym125102].concat(args125103.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__125123 = this;
  if(!(this__125123.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__125123.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__125124 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__125125 = this;
  if(this__125125.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__125125.tree, false, this__125125.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__125126 = this;
  var this__125127 = this;
  return cljs.core.pr_str.call(null, this__125127)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__125128 = this;
  var coll__125129 = this;
  var t__125130 = this__125128.tree;
  while(true) {
    if(!(t__125130 == null)) {
      var c__125131 = this__125128.comp.call(null, k, t__125130.key);
      if(c__125131 === 0) {
        return t__125130
      }else {
        if(c__125131 < 0) {
          var G__125149 = t__125130.left;
          t__125130 = G__125149;
          continue
        }else {
          if("\ufdd0'else") {
            var G__125150 = t__125130.right;
            t__125130 = G__125150;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__125132 = this;
  if(this__125132.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__125132.tree, ascending_QMARK_, this__125132.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__125133 = this;
  if(this__125133.cnt > 0) {
    var stack__125134 = null;
    var t__125135 = this__125133.tree;
    while(true) {
      if(!(t__125135 == null)) {
        var c__125136 = this__125133.comp.call(null, k, t__125135.key);
        if(c__125136 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__125134, t__125135), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__125136 < 0) {
              var G__125151 = cljs.core.conj.call(null, stack__125134, t__125135);
              var G__125152 = t__125135.left;
              stack__125134 = G__125151;
              t__125135 = G__125152;
              continue
            }else {
              var G__125153 = stack__125134;
              var G__125154 = t__125135.right;
              stack__125134 = G__125153;
              t__125135 = G__125154;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__125136 > 0) {
                var G__125155 = cljs.core.conj.call(null, stack__125134, t__125135);
                var G__125156 = t__125135.right;
                stack__125134 = G__125155;
                t__125135 = G__125156;
                continue
              }else {
                var G__125157 = stack__125134;
                var G__125158 = t__125135.left;
                stack__125134 = G__125157;
                t__125135 = G__125158;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__125134 == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack__125134, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__125137 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__125138 = this;
  return this__125138.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__125139 = this;
  if(this__125139.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__125139.tree, true, this__125139.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__125140 = this;
  return this__125140.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__125141 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__125142 = this;
  return new cljs.core.PersistentTreeMap(this__125142.comp, this__125142.tree, this__125142.cnt, meta, this__125142.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__125143 = this;
  return this__125143.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__125144 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__125144.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__125145 = this;
  var found__125146 = [null];
  var t__125147 = cljs.core.tree_map_remove.call(null, this__125145.comp, this__125145.tree, k, found__125146);
  if(t__125147 == null) {
    if(cljs.core.nth.call(null, found__125146, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__125145.comp, null, 0, this__125145.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__125145.comp, t__125147.blacken(), this__125145.cnt - 1, this__125145.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__125161 = cljs.core.seq.call(null, keyvals);
    var out__125162 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__125161) {
        var G__125163 = cljs.core.nnext.call(null, in__125161);
        var G__125164 = cljs.core.assoc_BANG_.call(null, out__125162, cljs.core.first.call(null, in__125161), cljs.core.second.call(null, in__125161));
        in__125161 = G__125163;
        out__125162 = G__125164;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__125162)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__125165) {
    var keyvals = cljs.core.seq(arglist__125165);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__125166) {
    var keyvals = cljs.core.seq(arglist__125166);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__125170 = [];
    var obj__125171 = {};
    var kvs__125172 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__125172) {
        ks__125170.push(cljs.core.first.call(null, kvs__125172));
        obj__125171[cljs.core.first.call(null, kvs__125172)] = cljs.core.second.call(null, kvs__125172);
        var G__125173 = cljs.core.nnext.call(null, kvs__125172);
        kvs__125172 = G__125173;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__125170, obj__125171)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__125174) {
    var keyvals = cljs.core.seq(arglist__125174);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__125177 = cljs.core.seq.call(null, keyvals);
    var out__125178 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__125177) {
        var G__125179 = cljs.core.nnext.call(null, in__125177);
        var G__125180 = cljs.core.assoc.call(null, out__125178, cljs.core.first.call(null, in__125177), cljs.core.second.call(null, in__125177));
        in__125177 = G__125179;
        out__125178 = G__125180;
        continue
      }else {
        return out__125178
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__125181) {
    var keyvals = cljs.core.seq(arglist__125181);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__125184 = cljs.core.seq.call(null, keyvals);
    var out__125185 = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in__125184) {
        var G__125186 = cljs.core.nnext.call(null, in__125184);
        var G__125187 = cljs.core.assoc.call(null, out__125185, cljs.core.first.call(null, in__125184), cljs.core.second.call(null, in__125184));
        in__125184 = G__125186;
        out__125185 = G__125187;
        continue
      }else {
        return out__125185
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__125188) {
    var comparator = cljs.core.first(arglist__125188);
    var keyvals = cljs.core.rest(arglist__125188);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__125189_SHARP_, p2__125190_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____125192 = p1__125189_SHARP_;
          if(cljs.core.truth_(or__3824__auto____125192)) {
            return or__3824__auto____125192
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__125190_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__125193) {
    var maps = cljs.core.seq(arglist__125193);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__125201 = function(m, e) {
        var k__125199 = cljs.core.first.call(null, e);
        var v__125200 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__125199)) {
          return cljs.core.assoc.call(null, m, k__125199, f.call(null, cljs.core._lookup.call(null, m, k__125199, null), v__125200))
        }else {
          return cljs.core.assoc.call(null, m, k__125199, v__125200)
        }
      };
      var merge2__125203 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__125201, function() {
          var or__3824__auto____125202 = m1;
          if(cljs.core.truth_(or__3824__auto____125202)) {
            return or__3824__auto____125202
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__125203, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__125204) {
    var f = cljs.core.first(arglist__125204);
    var maps = cljs.core.rest(arglist__125204);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__125209 = cljs.core.ObjMap.EMPTY;
  var keys__125210 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__125210) {
      var key__125211 = cljs.core.first.call(null, keys__125210);
      var entry__125212 = cljs.core._lookup.call(null, map, key__125211, "\ufdd0'user/not-found");
      var G__125213 = cljs.core.not_EQ_.call(null, entry__125212, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__125209, key__125211, entry__125212) : ret__125209;
      var G__125214 = cljs.core.next.call(null, keys__125210);
      ret__125209 = G__125213;
      keys__125210 = G__125214;
      continue
    }else {
      return ret__125209
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__125218 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__125218.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__125219 = this;
  var h__2202__auto____125220 = this__125219.__hash;
  if(!(h__2202__auto____125220 == null)) {
    return h__2202__auto____125220
  }else {
    var h__2202__auto____125221 = cljs.core.hash_iset.call(null, coll);
    this__125219.__hash = h__2202__auto____125221;
    return h__2202__auto____125221
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__125222 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__125223 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__125223.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__125244 = null;
  var G__125244__2 = function(this_sym125224, k) {
    var this__125226 = this;
    var this_sym125224__125227 = this;
    var coll__125228 = this_sym125224__125227;
    return coll__125228.cljs$core$ILookup$_lookup$arity$2(coll__125228, k)
  };
  var G__125244__3 = function(this_sym125225, k, not_found) {
    var this__125226 = this;
    var this_sym125225__125229 = this;
    var coll__125230 = this_sym125225__125229;
    return coll__125230.cljs$core$ILookup$_lookup$arity$3(coll__125230, k, not_found)
  };
  G__125244 = function(this_sym125225, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__125244__2.call(this, this_sym125225, k);
      case 3:
        return G__125244__3.call(this, this_sym125225, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125244
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym125216, args125217) {
  var this__125231 = this;
  return this_sym125216.call.apply(this_sym125216, [this_sym125216].concat(args125217.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__125232 = this;
  return new cljs.core.PersistentHashSet(this__125232.meta, cljs.core.assoc.call(null, this__125232.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__125233 = this;
  var this__125234 = this;
  return cljs.core.pr_str.call(null, this__125234)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__125235 = this;
  return cljs.core.keys.call(null, this__125235.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__125236 = this;
  return new cljs.core.PersistentHashSet(this__125236.meta, cljs.core.dissoc.call(null, this__125236.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__125237 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__125238 = this;
  var and__3822__auto____125239 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____125239) {
    var and__3822__auto____125240 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____125240) {
      return cljs.core.every_QMARK_.call(null, function(p1__125215_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__125215_SHARP_)
      }, other)
    }else {
      return and__3822__auto____125240
    }
  }else {
    return and__3822__auto____125239
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__125241 = this;
  return new cljs.core.PersistentHashSet(meta, this__125241.hash_map, this__125241.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__125242 = this;
  return this__125242.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__125243 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__125243.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__125245 = cljs.core.count.call(null, items);
  var i__125246 = 0;
  var out__125247 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__125246 < len__125245) {
      var G__125248 = i__125246 + 1;
      var G__125249 = cljs.core.conj_BANG_.call(null, out__125247, items[i__125246]);
      i__125246 = G__125248;
      out__125247 = G__125249;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__125247)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__125267 = null;
  var G__125267__2 = function(this_sym125253, k) {
    var this__125255 = this;
    var this_sym125253__125256 = this;
    var tcoll__125257 = this_sym125253__125256;
    if(cljs.core._lookup.call(null, this__125255.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__125267__3 = function(this_sym125254, k, not_found) {
    var this__125255 = this;
    var this_sym125254__125258 = this;
    var tcoll__125259 = this_sym125254__125258;
    if(cljs.core._lookup.call(null, this__125255.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__125267 = function(this_sym125254, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__125267__2.call(this, this_sym125254, k);
      case 3:
        return G__125267__3.call(this, this_sym125254, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125267
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym125251, args125252) {
  var this__125260 = this;
  return this_sym125251.call.apply(this_sym125251, [this_sym125251].concat(args125252.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__125261 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__125262 = this;
  if(cljs.core._lookup.call(null, this__125262.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__125263 = this;
  return cljs.core.count.call(null, this__125263.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__125264 = this;
  this__125264.transient_map = cljs.core.dissoc_BANG_.call(null, this__125264.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__125265 = this;
  this__125265.transient_map = cljs.core.assoc_BANG_.call(null, this__125265.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__125266 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__125266.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__125270 = this;
  var h__2202__auto____125271 = this__125270.__hash;
  if(!(h__2202__auto____125271 == null)) {
    return h__2202__auto____125271
  }else {
    var h__2202__auto____125272 = cljs.core.hash_iset.call(null, coll);
    this__125270.__hash = h__2202__auto____125272;
    return h__2202__auto____125272
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__125273 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__125274 = this;
  var n__125275 = this__125274.tree_map.entry_at(v);
  if(!(n__125275 == null)) {
    return n__125275.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__125301 = null;
  var G__125301__2 = function(this_sym125276, k) {
    var this__125278 = this;
    var this_sym125276__125279 = this;
    var coll__125280 = this_sym125276__125279;
    return coll__125280.cljs$core$ILookup$_lookup$arity$2(coll__125280, k)
  };
  var G__125301__3 = function(this_sym125277, k, not_found) {
    var this__125278 = this;
    var this_sym125277__125281 = this;
    var coll__125282 = this_sym125277__125281;
    return coll__125282.cljs$core$ILookup$_lookup$arity$3(coll__125282, k, not_found)
  };
  G__125301 = function(this_sym125277, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__125301__2.call(this, this_sym125277, k);
      case 3:
        return G__125301__3.call(this, this_sym125277, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125301
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym125268, args125269) {
  var this__125283 = this;
  return this_sym125268.call.apply(this_sym125268, [this_sym125268].concat(args125269.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__125284 = this;
  return new cljs.core.PersistentTreeSet(this__125284.meta, cljs.core.assoc.call(null, this__125284.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__125285 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__125285.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__125286 = this;
  var this__125287 = this;
  return cljs.core.pr_str.call(null, this__125287)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__125288 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__125288.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__125289 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__125289.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__125290 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__125291 = this;
  return cljs.core._comparator.call(null, this__125291.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__125292 = this;
  return cljs.core.keys.call(null, this__125292.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__125293 = this;
  return new cljs.core.PersistentTreeSet(this__125293.meta, cljs.core.dissoc.call(null, this__125293.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__125294 = this;
  return cljs.core.count.call(null, this__125294.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__125295 = this;
  var and__3822__auto____125296 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____125296) {
    var and__3822__auto____125297 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____125297) {
      return cljs.core.every_QMARK_.call(null, function(p1__125250_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__125250_SHARP_)
      }, other)
    }else {
      return and__3822__auto____125297
    }
  }else {
    return and__3822__auto____125296
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__125298 = this;
  return new cljs.core.PersistentTreeSet(meta, this__125298.tree_map, this__125298.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__125299 = this;
  return this__125299.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__125300 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__125300.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__125306__delegate = function(keys) {
      var in__125304 = cljs.core.seq.call(null, keys);
      var out__125305 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__125304)) {
          var G__125307 = cljs.core.next.call(null, in__125304);
          var G__125308 = cljs.core.conj_BANG_.call(null, out__125305, cljs.core.first.call(null, in__125304));
          in__125304 = G__125307;
          out__125305 = G__125308;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__125305)
        }
        break
      }
    };
    var G__125306 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__125306__delegate.call(this, keys)
    };
    G__125306.cljs$lang$maxFixedArity = 0;
    G__125306.cljs$lang$applyTo = function(arglist__125309) {
      var keys = cljs.core.seq(arglist__125309);
      return G__125306__delegate(keys)
    };
    G__125306.cljs$lang$arity$variadic = G__125306__delegate;
    return G__125306
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__125310) {
    var keys = cljs.core.seq(arglist__125310);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__125312) {
    var comparator = cljs.core.first(arglist__125312);
    var keys = cljs.core.rest(arglist__125312);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__125318 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____125319 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____125319)) {
        var e__125320 = temp__3971__auto____125319;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__125320))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__125318, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__125311_SHARP_) {
      var temp__3971__auto____125321 = cljs.core.find.call(null, smap, p1__125311_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____125321)) {
        var e__125322 = temp__3971__auto____125321;
        return cljs.core.second.call(null, e__125322)
      }else {
        return p1__125311_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__125352 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__125345, seen) {
        while(true) {
          var vec__125346__125347 = p__125345;
          var f__125348 = cljs.core.nth.call(null, vec__125346__125347, 0, null);
          var xs__125349 = vec__125346__125347;
          var temp__3974__auto____125350 = cljs.core.seq.call(null, xs__125349);
          if(temp__3974__auto____125350) {
            var s__125351 = temp__3974__auto____125350;
            if(cljs.core.contains_QMARK_.call(null, seen, f__125348)) {
              var G__125353 = cljs.core.rest.call(null, s__125351);
              var G__125354 = seen;
              p__125345 = G__125353;
              seen = G__125354;
              continue
            }else {
              return cljs.core.cons.call(null, f__125348, step.call(null, cljs.core.rest.call(null, s__125351), cljs.core.conj.call(null, seen, f__125348)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__125352.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__125357 = cljs.core.PersistentVector.EMPTY;
  var s__125358 = s;
  while(true) {
    if(cljs.core.next.call(null, s__125358)) {
      var G__125359 = cljs.core.conj.call(null, ret__125357, cljs.core.first.call(null, s__125358));
      var G__125360 = cljs.core.next.call(null, s__125358);
      ret__125357 = G__125359;
      s__125358 = G__125360;
      continue
    }else {
      return cljs.core.seq.call(null, ret__125357)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____125363 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____125363) {
        return or__3824__auto____125363
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__125364 = x.lastIndexOf("/", x.length - 2);
      if(i__125364 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__125364 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____125367 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____125367) {
      return or__3824__auto____125367
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__125368 = x.lastIndexOf("/", x.length - 2);
    if(i__125368 > -1) {
      return cljs.core.subs.call(null, x, 2, i__125368)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__125375 = cljs.core.ObjMap.EMPTY;
  var ks__125376 = cljs.core.seq.call(null, keys);
  var vs__125377 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto____125378 = ks__125376;
      if(and__3822__auto____125378) {
        return vs__125377
      }else {
        return and__3822__auto____125378
      }
    }()) {
      var G__125379 = cljs.core.assoc.call(null, map__125375, cljs.core.first.call(null, ks__125376), cljs.core.first.call(null, vs__125377));
      var G__125380 = cljs.core.next.call(null, ks__125376);
      var G__125381 = cljs.core.next.call(null, vs__125377);
      map__125375 = G__125379;
      ks__125376 = G__125380;
      vs__125377 = G__125381;
      continue
    }else {
      return map__125375
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__125384__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__125369_SHARP_, p2__125370_SHARP_) {
        return max_key.call(null, k, p1__125369_SHARP_, p2__125370_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__125384 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__125384__delegate.call(this, k, x, y, more)
    };
    G__125384.cljs$lang$maxFixedArity = 3;
    G__125384.cljs$lang$applyTo = function(arglist__125385) {
      var k = cljs.core.first(arglist__125385);
      var x = cljs.core.first(cljs.core.next(arglist__125385));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125385)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125385)));
      return G__125384__delegate(k, x, y, more)
    };
    G__125384.cljs$lang$arity$variadic = G__125384__delegate;
    return G__125384
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__125386__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__125382_SHARP_, p2__125383_SHARP_) {
        return min_key.call(null, k, p1__125382_SHARP_, p2__125383_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__125386 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__125386__delegate.call(this, k, x, y, more)
    };
    G__125386.cljs$lang$maxFixedArity = 3;
    G__125386.cljs$lang$applyTo = function(arglist__125387) {
      var k = cljs.core.first(arglist__125387);
      var x = cljs.core.first(cljs.core.next(arglist__125387));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125387)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125387)));
      return G__125386__delegate(k, x, y, more)
    };
    G__125386.cljs$lang$arity$variadic = G__125386__delegate;
    return G__125386
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____125390 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____125390) {
        var s__125391 = temp__3974__auto____125390;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__125391), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__125391)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____125394 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____125394) {
      var s__125395 = temp__3974__auto____125394;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__125395)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__125395), take_while.call(null, pred, cljs.core.rest.call(null, s__125395)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__125397 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__125397.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__125409 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____125410 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____125410)) {
        var vec__125411__125412 = temp__3974__auto____125410;
        var e__125413 = cljs.core.nth.call(null, vec__125411__125412, 0, null);
        var s__125414 = vec__125411__125412;
        if(cljs.core.truth_(include__125409.call(null, e__125413))) {
          return s__125414
        }else {
          return cljs.core.next.call(null, s__125414)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__125409, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____125415 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____125415)) {
      var vec__125416__125417 = temp__3974__auto____125415;
      var e__125418 = cljs.core.nth.call(null, vec__125416__125417, 0, null);
      var s__125419 = vec__125416__125417;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__125418)) ? s__125419 : cljs.core.next.call(null, s__125419))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__125431 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____125432 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____125432)) {
        var vec__125433__125434 = temp__3974__auto____125432;
        var e__125435 = cljs.core.nth.call(null, vec__125433__125434, 0, null);
        var s__125436 = vec__125433__125434;
        if(cljs.core.truth_(include__125431.call(null, e__125435))) {
          return s__125436
        }else {
          return cljs.core.next.call(null, s__125436)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__125431, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____125437 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____125437)) {
      var vec__125438__125439 = temp__3974__auto____125437;
      var e__125440 = cljs.core.nth.call(null, vec__125438__125439, 0, null);
      var s__125441 = vec__125438__125439;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__125440)) ? s__125441 : cljs.core.next.call(null, s__125441))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__125442 = this;
  var h__2202__auto____125443 = this__125442.__hash;
  if(!(h__2202__auto____125443 == null)) {
    return h__2202__auto____125443
  }else {
    var h__2202__auto____125444 = cljs.core.hash_coll.call(null, rng);
    this__125442.__hash = h__2202__auto____125444;
    return h__2202__auto____125444
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__125445 = this;
  if(this__125445.step > 0) {
    if(this__125445.start + this__125445.step < this__125445.end) {
      return new cljs.core.Range(this__125445.meta, this__125445.start + this__125445.step, this__125445.end, this__125445.step, null)
    }else {
      return null
    }
  }else {
    if(this__125445.start + this__125445.step > this__125445.end) {
      return new cljs.core.Range(this__125445.meta, this__125445.start + this__125445.step, this__125445.end, this__125445.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__125446 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__125447 = this;
  var this__125448 = this;
  return cljs.core.pr_str.call(null, this__125448)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__125449 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__125450 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__125451 = this;
  if(this__125451.step > 0) {
    if(this__125451.start < this__125451.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__125451.start > this__125451.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__125452 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__125452.end - this__125452.start) / this__125452.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__125453 = this;
  return this__125453.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__125454 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__125454.meta, this__125454.start + this__125454.step, this__125454.end, this__125454.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__125455 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__125456 = this;
  return new cljs.core.Range(meta, this__125456.start, this__125456.end, this__125456.step, this__125456.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__125457 = this;
  return this__125457.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__125458 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__125458.start + n * this__125458.step
  }else {
    if(function() {
      var and__3822__auto____125459 = this__125458.start > this__125458.end;
      if(and__3822__auto____125459) {
        return this__125458.step === 0
      }else {
        return and__3822__auto____125459
      }
    }()) {
      return this__125458.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__125460 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__125460.start + n * this__125460.step
  }else {
    if(function() {
      var and__3822__auto____125461 = this__125460.start > this__125460.end;
      if(and__3822__auto____125461) {
        return this__125460.step === 0
      }else {
        return and__3822__auto____125461
      }
    }()) {
      return this__125460.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__125462 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__125462.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____125465 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____125465) {
      var s__125466 = temp__3974__auto____125465;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__125466), take_nth.call(null, n, cljs.core.drop.call(null, n, s__125466)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____125473 = cljs.core.seq.call(null, coll);
    if(temp__3974__auto____125473) {
      var s__125474 = temp__3974__auto____125473;
      var fst__125475 = cljs.core.first.call(null, s__125474);
      var fv__125476 = f.call(null, fst__125475);
      var run__125477 = cljs.core.cons.call(null, fst__125475, cljs.core.take_while.call(null, function(p1__125467_SHARP_) {
        return cljs.core._EQ_.call(null, fv__125476, f.call(null, p1__125467_SHARP_))
      }, cljs.core.next.call(null, s__125474)));
      return cljs.core.cons.call(null, run__125477, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__125477), s__125474))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____125492 = cljs.core.seq.call(null, coll);
      if(temp__3971__auto____125492) {
        var s__125493 = temp__3971__auto____125492;
        return reductions.call(null, f, cljs.core.first.call(null, s__125493), cljs.core.rest.call(null, s__125493))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____125494 = cljs.core.seq.call(null, coll);
      if(temp__3974__auto____125494) {
        var s__125495 = temp__3974__auto____125494;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__125495)), cljs.core.rest.call(null, s__125495))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__125498 = null;
      var G__125498__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__125498__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__125498__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__125498__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__125498__4 = function() {
        var G__125499__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__125499 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__125499__delegate.call(this, x, y, z, args)
        };
        G__125499.cljs$lang$maxFixedArity = 3;
        G__125499.cljs$lang$applyTo = function(arglist__125500) {
          var x = cljs.core.first(arglist__125500);
          var y = cljs.core.first(cljs.core.next(arglist__125500));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125500)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125500)));
          return G__125499__delegate(x, y, z, args)
        };
        G__125499.cljs$lang$arity$variadic = G__125499__delegate;
        return G__125499
      }();
      G__125498 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__125498__0.call(this);
          case 1:
            return G__125498__1.call(this, x);
          case 2:
            return G__125498__2.call(this, x, y);
          case 3:
            return G__125498__3.call(this, x, y, z);
          default:
            return G__125498__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__125498.cljs$lang$maxFixedArity = 3;
      G__125498.cljs$lang$applyTo = G__125498__4.cljs$lang$applyTo;
      return G__125498
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__125501 = null;
      var G__125501__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__125501__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__125501__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__125501__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__125501__4 = function() {
        var G__125502__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__125502 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__125502__delegate.call(this, x, y, z, args)
        };
        G__125502.cljs$lang$maxFixedArity = 3;
        G__125502.cljs$lang$applyTo = function(arglist__125503) {
          var x = cljs.core.first(arglist__125503);
          var y = cljs.core.first(cljs.core.next(arglist__125503));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125503)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125503)));
          return G__125502__delegate(x, y, z, args)
        };
        G__125502.cljs$lang$arity$variadic = G__125502__delegate;
        return G__125502
      }();
      G__125501 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__125501__0.call(this);
          case 1:
            return G__125501__1.call(this, x);
          case 2:
            return G__125501__2.call(this, x, y);
          case 3:
            return G__125501__3.call(this, x, y, z);
          default:
            return G__125501__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__125501.cljs$lang$maxFixedArity = 3;
      G__125501.cljs$lang$applyTo = G__125501__4.cljs$lang$applyTo;
      return G__125501
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__125504 = null;
      var G__125504__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__125504__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__125504__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__125504__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__125504__4 = function() {
        var G__125505__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__125505 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__125505__delegate.call(this, x, y, z, args)
        };
        G__125505.cljs$lang$maxFixedArity = 3;
        G__125505.cljs$lang$applyTo = function(arglist__125506) {
          var x = cljs.core.first(arglist__125506);
          var y = cljs.core.first(cljs.core.next(arglist__125506));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125506)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125506)));
          return G__125505__delegate(x, y, z, args)
        };
        G__125505.cljs$lang$arity$variadic = G__125505__delegate;
        return G__125505
      }();
      G__125504 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__125504__0.call(this);
          case 1:
            return G__125504__1.call(this, x);
          case 2:
            return G__125504__2.call(this, x, y);
          case 3:
            return G__125504__3.call(this, x, y, z);
          default:
            return G__125504__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__125504.cljs$lang$maxFixedArity = 3;
      G__125504.cljs$lang$applyTo = G__125504__4.cljs$lang$applyTo;
      return G__125504
    }()
  };
  var juxt__4 = function() {
    var G__125507__delegate = function(f, g, h, fs) {
      var fs__125497 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__125508 = null;
        var G__125508__0 = function() {
          return cljs.core.reduce.call(null, function(p1__125478_SHARP_, p2__125479_SHARP_) {
            return cljs.core.conj.call(null, p1__125478_SHARP_, p2__125479_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__125497)
        };
        var G__125508__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__125480_SHARP_, p2__125481_SHARP_) {
            return cljs.core.conj.call(null, p1__125480_SHARP_, p2__125481_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__125497)
        };
        var G__125508__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__125482_SHARP_, p2__125483_SHARP_) {
            return cljs.core.conj.call(null, p1__125482_SHARP_, p2__125483_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__125497)
        };
        var G__125508__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__125484_SHARP_, p2__125485_SHARP_) {
            return cljs.core.conj.call(null, p1__125484_SHARP_, p2__125485_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__125497)
        };
        var G__125508__4 = function() {
          var G__125509__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__125486_SHARP_, p2__125487_SHARP_) {
              return cljs.core.conj.call(null, p1__125486_SHARP_, cljs.core.apply.call(null, p2__125487_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__125497)
          };
          var G__125509 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__125509__delegate.call(this, x, y, z, args)
          };
          G__125509.cljs$lang$maxFixedArity = 3;
          G__125509.cljs$lang$applyTo = function(arglist__125510) {
            var x = cljs.core.first(arglist__125510);
            var y = cljs.core.first(cljs.core.next(arglist__125510));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125510)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125510)));
            return G__125509__delegate(x, y, z, args)
          };
          G__125509.cljs$lang$arity$variadic = G__125509__delegate;
          return G__125509
        }();
        G__125508 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__125508__0.call(this);
            case 1:
              return G__125508__1.call(this, x);
            case 2:
              return G__125508__2.call(this, x, y);
            case 3:
              return G__125508__3.call(this, x, y, z);
            default:
              return G__125508__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__125508.cljs$lang$maxFixedArity = 3;
        G__125508.cljs$lang$applyTo = G__125508__4.cljs$lang$applyTo;
        return G__125508
      }()
    };
    var G__125507 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__125507__delegate.call(this, f, g, h, fs)
    };
    G__125507.cljs$lang$maxFixedArity = 3;
    G__125507.cljs$lang$applyTo = function(arglist__125511) {
      var f = cljs.core.first(arglist__125511);
      var g = cljs.core.first(cljs.core.next(arglist__125511));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125511)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__125511)));
      return G__125507__delegate(f, g, h, fs)
    };
    G__125507.cljs$lang$arity$variadic = G__125507__delegate;
    return G__125507
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__125514 = cljs.core.next.call(null, coll);
        coll = G__125514;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____125513 = cljs.core.seq.call(null, coll);
        if(and__3822__auto____125513) {
          return n > 0
        }else {
          return and__3822__auto____125513
        }
      }())) {
        var G__125515 = n - 1;
        var G__125516 = cljs.core.next.call(null, coll);
        n = G__125515;
        coll = G__125516;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__125518 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__125518), s)) {
    if(cljs.core.count.call(null, matches__125518) === 1) {
      return cljs.core.first.call(null, matches__125518)
    }else {
      return cljs.core.vec.call(null, matches__125518)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__125520 = re.exec(s);
  if(matches__125520 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__125520) === 1) {
      return cljs.core.first.call(null, matches__125520)
    }else {
      return cljs.core.vec.call(null, matches__125520)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__125525 = cljs.core.re_find.call(null, re, s);
  var match_idx__125526 = s.search(re);
  var match_str__125527 = cljs.core.coll_QMARK_.call(null, match_data__125525) ? cljs.core.first.call(null, match_data__125525) : match_data__125525;
  var post_match__125528 = cljs.core.subs.call(null, s, match_idx__125526 + cljs.core.count.call(null, match_str__125527));
  if(cljs.core.truth_(match_data__125525)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__125525, re_seq.call(null, re, post_match__125528))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__125535__125536 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___125537 = cljs.core.nth.call(null, vec__125535__125536, 0, null);
  var flags__125538 = cljs.core.nth.call(null, vec__125535__125536, 1, null);
  var pattern__125539 = cljs.core.nth.call(null, vec__125535__125536, 2, null);
  return new RegExp(pattern__125539, flags__125538)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__125529_SHARP_) {
    return print_one.call(null, p1__125529_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var G__125546__125547 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  if(G__125546__125547) {
    var o__125548 = cljs.core.first.call(null, G__125546__125547);
    var G__125546__125549 = G__125546__125547;
    while(true) {
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o__125548, writer, opts);
      var temp__3974__auto____125550 = cljs.core.next.call(null, G__125546__125549);
      if(temp__3974__auto____125550) {
        var G__125546__125551 = temp__3974__auto____125550;
        var G__125552 = cljs.core.first.call(null, G__125546__125551);
        var G__125553 = G__125546__125551;
        o__125548 = G__125552;
        G__125546__125549 = G__125553;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var G__125560__125561 = cljs.core.seq.call(null, ss);
    if(G__125560__125561) {
      var s__125562 = cljs.core.first.call(null, G__125560__125561);
      var G__125560__125563 = G__125560__125561;
      while(true) {
        cljs.core._write.call(null, writer, s__125562);
        var temp__3974__auto____125564 = cljs.core.next.call(null, G__125560__125563);
        if(temp__3974__auto____125564) {
          var G__125560__125565 = temp__3974__auto____125564;
          var G__125566 = cljs.core.first.call(null, G__125560__125565);
          var G__125567 = G__125560__125565;
          s__125562 = G__125566;
          G__125560__125563 = G__125567;
          continue
        }else {
          return null
        }
        break
      }
    }else {
      return null
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(goog.isDef(var_args)) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__125568) {
    var writer = cljs.core.first(arglist__125568);
    var ss = cljs.core.rest(arglist__125568);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$lang$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$ = true;
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var this__125569 = this;
  return this__125569.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var this__125570 = this;
  return null
};
cljs.core.StringBufferWriter;
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____125580 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____125580)) {
            var and__3822__auto____125584 = function() {
              var G__125581__125582 = obj;
              if(G__125581__125582) {
                if(function() {
                  var or__3824__auto____125583 = G__125581__125582.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____125583) {
                    return or__3824__auto____125583
                  }else {
                    return G__125581__125582.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__125581__125582.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__125581__125582)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__125581__125582)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____125584)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____125584
            }
          }else {
            return and__3822__auto____125580
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto____125585 = !(obj == null);
          if(and__3822__auto____125585) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____125585
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__125586__125587 = obj;
          if(G__125586__125587) {
            if(function() {
              var or__3824__auto____125588 = G__125586__125587.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto____125588) {
                return or__3824__auto____125588
              }else {
                return G__125586__125587.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__125586__125587.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__125586__125587)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__125586__125587)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_(function() {
          var and__3822__auto____125601 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto____125601)) {
            var and__3822__auto____125605 = function() {
              var G__125602__125603 = obj;
              if(G__125602__125603) {
                if(function() {
                  var or__3824__auto____125604 = G__125602__125603.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto____125604) {
                    return or__3824__auto____125604
                  }else {
                    return G__125602__125603.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__125602__125603.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__125602__125603)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__125602__125603)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____125605)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____125605
            }
          }else {
            return and__3822__auto____125601
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(function() {
          var and__3822__auto____125606 = !(obj == null);
          if(and__3822__auto____125606) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____125606
          }
        }()) {
          return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
        }else {
          if(function() {
            var G__125607__125608 = obj;
            if(G__125607__125608) {
              if(cljs.core.truth_(function() {
                var or__3824__auto____125609 = null;
                if(cljs.core.truth_(or__3824__auto____125609)) {
                  return or__3824__auto____125609
                }else {
                  return G__125607__125608.cljs$core$IPrintWithWriter$
                }
              }())) {
                return true
              }else {
                if(!G__125607__125608.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__125607__125608)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__125607__125608)
            }
          }()) {
            return cljs.core._pr_writer.call(null, obj, writer, opts)
          }else {
            if(function() {
              var G__125610__125611 = obj;
              if(G__125610__125611) {
                if(function() {
                  var or__3824__auto____125612 = G__125610__125611.cljs$lang$protocol_mask$partition0$ & 536870912;
                  if(or__3824__auto____125612) {
                    return or__3824__auto____125612
                  }else {
                    return G__125610__125611.cljs$core$IPrintable$
                  }
                }()) {
                  return true
                }else {
                  if(!G__125610__125611.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__125610__125611)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__125610__125611)
              }
            }()) {
              return cljs.core.apply.call(null, cljs.core.write_all, writer, cljs.core._pr_seq.call(null, obj, opts))
            }else {
              if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
              }else {
                if("\ufdd0'else") {
                  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                }else {
                  return null
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var G__125619__125620 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__125619__125620) {
    var obj__125621 = cljs.core.first.call(null, G__125619__125620);
    var G__125619__125622 = G__125619__125620;
    while(true) {
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj__125621, writer, opts);
      var temp__3974__auto____125623 = cljs.core.next.call(null, G__125619__125622);
      if(temp__3974__auto____125623) {
        var G__125619__125624 = temp__3974__auto____125623;
        var G__125625 = cljs.core.first.call(null, G__125619__125624);
        var G__125626 = G__125619__125624;
        obj__125621 = G__125625;
        G__125619__125622 = G__125626;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb__125629 = new goog.string.StringBuffer;
  var writer__125630 = new cljs.core.StringBufferWriter(sb__125629);
  cljs.core.pr_seq_writer.call(null, objs, writer__125630, opts);
  cljs.core._flush.call(null, writer__125630);
  return sb__125629
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb__125632 = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb__125632.append("\n");
    return[cljs.core.str(sb__125632)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__125633) {
    var objs = cljs.core.seq(arglist__125633);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__125634) {
    var objs = cljs.core.seq(arglist__125634);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__125635) {
    var objs = cljs.core.seq(arglist__125635);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__125636) {
    var objs = cljs.core.seq(arglist__125636);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__125637) {
    var objs = cljs.core.seq(arglist__125637);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__125638) {
    var objs = cljs.core.seq(arglist__125638);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__125639) {
    var objs = cljs.core.seq(arglist__125639);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__125640) {
    var objs = cljs.core.seq(arglist__125640);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__125641) {
    var fmt = cljs.core.first(arglist__125641);
    var args = cljs.core.rest(arglist__125641);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.char_escapes = cljs.core.ObjMap.fromObject(['"', "\\", "\u0008", "\u000c", "\n", "\r", "\t"], {'"':'\\"', "\\":"\\\\", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"});
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\u0008\u000c\n\r\t]', "g"), function(match) {
    return cljs.core._lookup.call(null, cljs.core.char_escapes, match, null)
  })), cljs.core.str('"')].join("")
};
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__125642 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__125642, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__125643 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__125643, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__125644 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__125644, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____125645 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____125645)) {
        var nspc__125646 = temp__3974__auto____125645;
        return[cljs.core.str(nspc__125646), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____125647 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____125647)) {
          var nspc__125648 = temp__3974__auto____125647;
          return[cljs.core.str(nspc__125648), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? cljs.core.quote_string.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__125649 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__125649, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__125651 = function(n, len) {
    var ns__125650 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__125650) < len) {
        var G__125653 = [cljs.core.str("0"), cljs.core.str(ns__125650)].join("");
        ns__125650 = G__125653;
        continue
      }else {
        return ns__125650
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__125651.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__125651.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__125651.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__125651.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__125651.call(null, 
  d.getUTCSeconds(), 2)), cljs.core.str("."), cljs.core.str(normalize__125651.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__125652 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__125652, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__125654 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__125654, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["number"] = true;
cljs.core._pr_writer["number"] = function(n, writer, opts) {
  1 / 0;
  return cljs.core._write.call(null, writer, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__125655 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__125655, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__125656 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__125656, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["boolean"] = true;
cljs.core._pr_writer["boolean"] = function(bool, writer, opts) {
  return cljs.core._write.call(null, writer, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintWithWriter["string"] = true;
cljs.core._pr_writer["string"] = function(obj, writer, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    cljs.core._write.call(null, writer, ":");
    var temp__3974__auto____125657 = cljs.core.namespace.call(null, obj);
    if(cljs.core.truth_(temp__3974__auto____125657)) {
      var nspc__125658 = temp__3974__auto____125657;
      cljs.core.write_all.call(null, writer, [cljs.core.str(nspc__125658)].join(""), "/")
    }else {
    }
    return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      var temp__3974__auto____125659 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____125659)) {
        var nspc__125660 = temp__3974__auto____125659;
        cljs.core.write_all.call(null, writer, [cljs.core.str(nspc__125660)].join(""), "/")
      }else {
      }
      return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts))) {
          return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
        }else {
          return cljs.core._write.call(null, writer, obj)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__125661 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__125661, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.IPrintWithWriter["array"] = true;
cljs.core._pr_writer["array"] = function(a, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintWithWriter["function"] = true;
cljs.core._pr_writer["function"] = function(this$, writer, _) {
  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintWithWriter$ = true;
Date.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(d, writer, _) {
  var normalize__125663 = function(n, len) {
    var ns__125662 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__125662) < len) {
        var G__125665 = [cljs.core.str("0"), cljs.core.str(ns__125662)].join("");
        ns__125662 = G__125665;
        continue
      }else {
        return ns__125662
      }
      break
    }
  };
  return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(d.getUTCFullYear())].join(""), "-", normalize__125663.call(null, d.getUTCMonth() + 1, 2), "-", normalize__125663.call(null, d.getUTCDate(), 2), "T", normalize__125663.call(null, d.getUTCHours(), 2), ":", normalize__125663.call(null, d.getUTCMinutes(), 2), ":", normalize__125663.call(null, d.getUTCSeconds(), 2), ".", normalize__125663.call(null, d.getUTCMilliseconds(), 3), "-", '00:00"')
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair__125664 = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair__125664, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__125666 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__125667 = this;
  var G__125668__125669 = cljs.core.seq.call(null, this__125667.watches);
  if(G__125668__125669) {
    var G__125671__125673 = cljs.core.first.call(null, G__125668__125669);
    var vec__125672__125674 = G__125671__125673;
    var key__125675 = cljs.core.nth.call(null, vec__125672__125674, 0, null);
    var f__125676 = cljs.core.nth.call(null, vec__125672__125674, 1, null);
    var G__125668__125677 = G__125668__125669;
    var G__125671__125678 = G__125671__125673;
    var G__125668__125679 = G__125668__125677;
    while(true) {
      var vec__125680__125681 = G__125671__125678;
      var key__125682 = cljs.core.nth.call(null, vec__125680__125681, 0, null);
      var f__125683 = cljs.core.nth.call(null, vec__125680__125681, 1, null);
      var G__125668__125684 = G__125668__125679;
      f__125683.call(null, key__125682, this$, oldval, newval);
      var temp__3974__auto____125685 = cljs.core.next.call(null, G__125668__125684);
      if(temp__3974__auto____125685) {
        var G__125668__125686 = temp__3974__auto____125685;
        var G__125694 = cljs.core.first.call(null, G__125668__125686);
        var G__125695 = G__125668__125686;
        G__125671__125678 = G__125694;
        G__125668__125679 = G__125695;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__125687 = this;
  return this$.watches = cljs.core.assoc.call(null, this__125687.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__125688 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__125688.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var this__125689 = this;
  cljs.core._write.call(null, writer, "#<Atom: ");
  cljs.core._pr_writer.call(null, this__125689.state, writer, opts);
  return cljs.core._write.call(null, writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__125690 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__125690.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__125691 = this;
  return this__125691.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__125692 = this;
  return this__125692.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__125693 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__125707__delegate = function(x, p__125696) {
      var map__125702__125703 = p__125696;
      var map__125702__125704 = cljs.core.seq_QMARK_.call(null, map__125702__125703) ? cljs.core.apply.call(null, cljs.core.hash_map, map__125702__125703) : map__125702__125703;
      var validator__125705 = cljs.core._lookup.call(null, map__125702__125704, "\ufdd0'validator", null);
      var meta__125706 = cljs.core._lookup.call(null, map__125702__125704, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__125706, validator__125705, null)
    };
    var G__125707 = function(x, var_args) {
      var p__125696 = null;
      if(goog.isDef(var_args)) {
        p__125696 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__125707__delegate.call(this, x, p__125696)
    };
    G__125707.cljs$lang$maxFixedArity = 1;
    G__125707.cljs$lang$applyTo = function(arglist__125708) {
      var x = cljs.core.first(arglist__125708);
      var p__125696 = cljs.core.rest(arglist__125708);
      return G__125707__delegate(x, p__125696)
    };
    G__125707.cljs$lang$arity$variadic = G__125707__delegate;
    return G__125707
  }();
  atom = function(x, var_args) {
    var p__125696 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____125712 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____125712)) {
    var validate__125713 = temp__3974__auto____125712;
    if(cljs.core.truth_(validate__125713.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6752))))].join(""));
    }
  }else {
  }
  var old_value__125714 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__125714, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__125715__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__125715 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__125715__delegate.call(this, a, f, x, y, z, more)
    };
    G__125715.cljs$lang$maxFixedArity = 5;
    G__125715.cljs$lang$applyTo = function(arglist__125716) {
      var a = cljs.core.first(arglist__125716);
      var f = cljs.core.first(cljs.core.next(arglist__125716));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__125716)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__125716))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__125716)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__125716)))));
      return G__125715__delegate(a, f, x, y, z, more)
    };
    G__125715.cljs$lang$arity$variadic = G__125715__delegate;
    return G__125715
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__125717) {
    var iref = cljs.core.first(arglist__125717);
    var f = cljs.core.first(cljs.core.next(arglist__125717));
    var args = cljs.core.rest(cljs.core.next(arglist__125717));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__125718 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__125718.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__125719 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__125719.state, function(p__125720) {
    var curr_state__125721 = p__125720;
    var curr_state__125722 = cljs.core.seq_QMARK_.call(null, curr_state__125721) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__125721) : curr_state__125721;
    var done__125723 = cljs.core._lookup.call(null, curr_state__125722, "\ufdd0'done", null);
    if(cljs.core.truth_(done__125723)) {
      return curr_state__125722
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__125719.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
void 0;
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3822__auto____125727 = x;
    if(and__3822__auto____125727) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3822__auto____125727
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    return function() {
      var or__3824__auto____125728 = cljs.core._clj__GT_js[goog.typeOf(x)];
      if(or__3824__auto____125728) {
        return or__3824__auto____125728
      }else {
        var or__3824__auto____125729 = cljs.core._clj__GT_js["_"];
        if(or__3824__auto____125729) {
          return or__3824__auto____125729
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3822__auto____125733 = x;
    if(and__3822__auto____125733) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3822__auto____125733
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    return function() {
      var or__3824__auto____125734 = cljs.core._key__GT_js[goog.typeOf(x)];
      if(or__3824__auto____125734) {
        return or__3824__auto____125734
      }else {
        var or__3824__auto____125735 = cljs.core._key__GT_js["_"];
        if(or__3824__auto____125735) {
          return or__3824__auto____125735
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key->js", x);
        }
      }
    }().call(null, x)
  }
};
void 0;
cljs.core.IEncodeJS["null"] = true;
cljs.core._clj__GT_js["null"] = function(x) {
  return null
};
cljs.core.IEncodeJS["_"] = true;
cljs.core._key__GT_js["_"] = function(k) {
  if(function() {
    var or__3824__auto____125736 = cljs.core.string_QMARK_.call(null, k);
    if(or__3824__auto____125736) {
      return or__3824__auto____125736
    }else {
      var or__3824__auto____125737 = cljs.core.number_QMARK_.call(null, k);
      if(or__3824__auto____125737) {
        return or__3824__auto____125737
      }else {
        var or__3824__auto____125738 = cljs.core.keyword_QMARK_.call(null, k);
        if(or__3824__auto____125738) {
          return or__3824__auto____125738
        }else {
          return cljs.core.symbol_QMARK_.call(null, k)
        }
      }
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    return cljs.core.pr_str.call(null, k)
  }
};
cljs.core._clj__GT_js["_"] = function(x) {
  if(cljs.core.keyword_QMARK_.call(null, x)) {
    return cljs.core.name.call(null, x)
  }else {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return[cljs.core.str(x)].join("")
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var m__125739 = {};
        var G__125740__125741 = cljs.core.seq.call(null, x);
        if(G__125740__125741) {
          var G__125743__125745 = cljs.core.first.call(null, G__125740__125741);
          var vec__125744__125746 = G__125743__125745;
          var k__125747 = cljs.core.nth.call(null, vec__125744__125746, 0, null);
          var v__125748 = cljs.core.nth.call(null, vec__125744__125746, 1, null);
          var G__125740__125749 = G__125740__125741;
          var G__125743__125750 = G__125743__125745;
          var G__125740__125751 = G__125740__125749;
          while(true) {
            var vec__125752__125753 = G__125743__125750;
            var k__125754 = cljs.core.nth.call(null, vec__125752__125753, 0, null);
            var v__125755 = cljs.core.nth.call(null, vec__125752__125753, 1, null);
            var G__125740__125756 = G__125740__125751;
            m__125739[cljs.core._key__GT_js.call(null, k__125754)] = cljs.core._clj__GT_js.call(null, v__125755);
            var temp__3974__auto____125757 = cljs.core.next.call(null, G__125740__125756);
            if(temp__3974__auto____125757) {
              var G__125740__125758 = temp__3974__auto____125757;
              var G__125759 = cljs.core.first.call(null, G__125740__125758);
              var G__125760 = G__125740__125758;
              G__125743__125750 = G__125759;
              G__125740__125751 = G__125760;
              continue
            }else {
            }
            break
          }
        }else {
        }
        return m__125739
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, cljs.core._clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  return cljs.core._clj__GT_js.call(null, x)
};
void 0;
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function() {
  var _js__GT_clj = null;
  var _js__GT_clj__1 = function(x) {
    if(function() {
      var and__3822__auto____125767 = x;
      if(and__3822__auto____125767) {
        return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$1
      }else {
        return and__3822__auto____125767
      }
    }()) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$1(x)
    }else {
      return function() {
        var or__3824__auto____125768 = cljs.core._js__GT_clj[goog.typeOf(x)];
        if(or__3824__auto____125768) {
          return or__3824__auto____125768
        }else {
          var or__3824__auto____125769 = cljs.core._js__GT_clj["_"];
          if(or__3824__auto____125769) {
            return or__3824__auto____125769
          }else {
            throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
          }
        }
      }().call(null, x)
    }
  };
  var _js__GT_clj__2 = function(x, options) {
    if(function() {
      var and__3822__auto____125770 = x;
      if(and__3822__auto____125770) {
        return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
      }else {
        return and__3822__auto____125770
      }
    }()) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
    }else {
      return function() {
        var or__3824__auto____125771 = cljs.core._js__GT_clj[goog.typeOf(x)];
        if(or__3824__auto____125771) {
          return or__3824__auto____125771
        }else {
          var or__3824__auto____125772 = cljs.core._js__GT_clj["_"];
          if(or__3824__auto____125772) {
            return or__3824__auto____125772
          }else {
            throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
          }
        }
      }().call(null, x, options)
    }
  };
  _js__GT_clj = function(x, options) {
    switch(arguments.length) {
      case 1:
        return _js__GT_clj__1.call(this, x);
      case 2:
        return _js__GT_clj__2.call(this, x, options)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _js__GT_clj.cljs$lang$arity$1 = _js__GT_clj__1;
  _js__GT_clj.cljs$lang$arity$2 = _js__GT_clj__2;
  return _js__GT_clj
}();
void 0;
cljs.core.IEncodeClojure["_"] = true;
cljs.core._js__GT_clj["_"] = function() {
  var G__125793 = null;
  var G__125793__1 = function(x) {
    return cljs.core._js__GT_clj.call(null, x, cljs.core.ObjMap.fromObject(["\ufdd0'keywordize-keys"], {"\ufdd0'keywordize-keys":false}))
  };
  var G__125793__2 = function(x, options) {
    var map__125773__125774 = options;
    var map__125773__125775 = cljs.core.seq_QMARK_.call(null, map__125773__125774) ? cljs.core.apply.call(null, cljs.core.hash_map, map__125773__125774) : map__125773__125774;
    var keywordize_keys__125776 = cljs.core._lookup.call(null, map__125773__125775, "\ufdd0'keywordize-keys", null);
    var keyfn__125777 = cljs.core.truth_(keywordize_keys__125776) ? cljs.core.keyword : cljs.core.str;
    var f__125792 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2476__auto____125791 = function iter__125785(s__125786) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__125786__125789 = s__125786;
                    while(true) {
                      if(cljs.core.seq.call(null, s__125786__125789)) {
                        var k__125790 = cljs.core.first.call(null, s__125786__125789);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__125777.call(null, k__125790), thisfn.call(null, x[k__125790])], true), iter__125785.call(null, cljs.core.rest.call(null, s__125786__125789)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2476__auto____125791.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__125792.call(null, x)
  };
  G__125793 = function(x, options) {
    switch(arguments.length) {
      case 1:
        return G__125793__1.call(this, x);
      case 2:
        return G__125793__2.call(this, x, options)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__125793
}();
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, opts) {
    return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
  };
  var js__GT_clj = function(x, var_args) {
    var opts = null;
    if(goog.isDef(var_args)) {
      opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, opts)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__125794) {
    var x = cljs.core.first(arglist__125794);
    var opts = cljs.core.rest(arglist__125794);
    return js__GT_clj__delegate(x, opts)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__125799 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__125803__delegate = function(args) {
      var temp__3971__auto____125800 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__125799), args, null);
      if(cljs.core.truth_(temp__3971__auto____125800)) {
        var v__125801 = temp__3971__auto____125800;
        return v__125801
      }else {
        var ret__125802 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__125799, cljs.core.assoc, args, ret__125802);
        return ret__125802
      }
    };
    var G__125803 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__125803__delegate.call(this, args)
    };
    G__125803.cljs$lang$maxFixedArity = 0;
    G__125803.cljs$lang$applyTo = function(arglist__125804) {
      var args = cljs.core.seq(arglist__125804);
      return G__125803__delegate(args)
    };
    G__125803.cljs$lang$arity$variadic = G__125803__delegate;
    return G__125803
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__125806 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__125806)) {
        var G__125807 = ret__125806;
        f = G__125807;
        continue
      }else {
        return ret__125806
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__125808__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__125808 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__125808__delegate.call(this, f, args)
    };
    G__125808.cljs$lang$maxFixedArity = 1;
    G__125808.cljs$lang$applyTo = function(arglist__125809) {
      var f = cljs.core.first(arglist__125809);
      var args = cljs.core.rest(arglist__125809);
      return G__125808__delegate(f, args)
    };
    G__125808.cljs$lang$arity$variadic = G__125808__delegate;
    return G__125808
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__125811 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__125811, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__125811, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____125820 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____125820) {
      return or__3824__auto____125820
    }else {
      var or__3824__auto____125821 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____125821) {
        return or__3824__auto____125821
      }else {
        var and__3822__auto____125822 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____125822) {
          var and__3822__auto____125823 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____125823) {
            var and__3822__auto____125824 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____125824) {
              var ret__125825 = true;
              var i__125826 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____125827 = cljs.core.not.call(null, ret__125825);
                  if(or__3824__auto____125827) {
                    return or__3824__auto____125827
                  }else {
                    return i__125826 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__125825
                }else {
                  var G__125828 = isa_QMARK_.call(null, h, child.call(null, i__125826), parent.call(null, i__125826));
                  var G__125829 = i__125826 + 1;
                  ret__125825 = G__125828;
                  i__125826 = G__125829;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____125824
            }
          }else {
            return and__3822__auto____125823
          }
        }else {
          return and__3822__auto____125822
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 7082))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 7086))))].join(""));
    }
    var tp__125838 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__125839 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__125840 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__125841 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____125842 = cljs.core.contains_QMARK_.call(null, tp__125838.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__125840.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__125840.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__125838, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__125841.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__125839, parent, ta__125840), "\ufdd0'descendants":tf__125841.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__125840, tag, td__125839)})
    }();
    if(cljs.core.truth_(or__3824__auto____125842)) {
      return or__3824__auto____125842
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__125847 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__125848 = cljs.core.truth_(parentMap__125847.call(null, tag)) ? cljs.core.disj.call(null, parentMap__125847.call(null, tag), parent) : cljs.core.set([]);
    var newParents__125849 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__125848)) ? cljs.core.assoc.call(null, parentMap__125847, tag, childsParents__125848) : cljs.core.dissoc.call(null, parentMap__125847, tag);
    var deriv_seq__125850 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__125830_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__125830_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__125830_SHARP_), cljs.core.second.call(null, p1__125830_SHARP_)))
    }, cljs.core.seq.call(null, newParents__125849)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__125847.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__125831_SHARP_, p2__125832_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__125831_SHARP_, p2__125832_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__125850))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__125858 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____125860 = cljs.core.truth_(function() {
    var and__3822__auto____125859 = xprefs__125858;
    if(cljs.core.truth_(and__3822__auto____125859)) {
      return xprefs__125858.call(null, y)
    }else {
      return and__3822__auto____125859
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____125860)) {
    return or__3824__auto____125860
  }else {
    var or__3824__auto____125862 = function() {
      var ps__125861 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__125861) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__125861), prefer_table))) {
          }else {
          }
          var G__125865 = cljs.core.rest.call(null, ps__125861);
          ps__125861 = G__125865;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____125862)) {
      return or__3824__auto____125862
    }else {
      var or__3824__auto____125864 = function() {
        var ps__125863 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__125863) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__125863), y, prefer_table))) {
            }else {
            }
            var G__125866 = cljs.core.rest.call(null, ps__125863);
            ps__125863 = G__125866;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____125864)) {
        return or__3824__auto____125864
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____125868 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____125868)) {
    return or__3824__auto____125868
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__125886 = cljs.core.reduce.call(null, function(be, p__125878) {
    var vec__125879__125880 = p__125878;
    var k__125881 = cljs.core.nth.call(null, vec__125879__125880, 0, null);
    var ___125882 = cljs.core.nth.call(null, vec__125879__125880, 1, null);
    var e__125883 = vec__125879__125880;
    if(cljs.core.isa_QMARK_.call(null, cljs.core.deref.call(null, hierarchy), dispatch_val, k__125881)) {
      var be2__125885 = cljs.core.truth_(function() {
        var or__3824__auto____125884 = be == null;
        if(or__3824__auto____125884) {
          return or__3824__auto____125884
        }else {
          return cljs.core.dominates.call(null, k__125881, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__125883 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__125885), k__125881, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__125881), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__125885)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__125885
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__125886)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__125886));
      return cljs.core.second.call(null, best_entry__125886)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____125890 = mf;
    if(and__3822__auto____125890) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____125890
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____125891 = cljs.core._reset[goog.typeOf(mf)];
      if(or__3824__auto____125891) {
        return or__3824__auto____125891
      }else {
        var or__3824__auto____125892 = cljs.core._reset["_"];
        if(or__3824__auto____125892) {
          return or__3824__auto____125892
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____125896 = mf;
    if(and__3822__auto____125896) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____125896
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____125897 = cljs.core._add_method[goog.typeOf(mf)];
      if(or__3824__auto____125897) {
        return or__3824__auto____125897
      }else {
        var or__3824__auto____125898 = cljs.core._add_method["_"];
        if(or__3824__auto____125898) {
          return or__3824__auto____125898
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____125902 = mf;
    if(and__3822__auto____125902) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____125902
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____125903 = cljs.core._remove_method[goog.typeOf(mf)];
      if(or__3824__auto____125903) {
        return or__3824__auto____125903
      }else {
        var or__3824__auto____125904 = cljs.core._remove_method["_"];
        if(or__3824__auto____125904) {
          return or__3824__auto____125904
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____125908 = mf;
    if(and__3822__auto____125908) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____125908
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____125909 = cljs.core._prefer_method[goog.typeOf(mf)];
      if(or__3824__auto____125909) {
        return or__3824__auto____125909
      }else {
        var or__3824__auto____125910 = cljs.core._prefer_method["_"];
        if(or__3824__auto____125910) {
          return or__3824__auto____125910
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____125914 = mf;
    if(and__3822__auto____125914) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____125914
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____125915 = cljs.core._get_method[goog.typeOf(mf)];
      if(or__3824__auto____125915) {
        return or__3824__auto____125915
      }else {
        var or__3824__auto____125916 = cljs.core._get_method["_"];
        if(or__3824__auto____125916) {
          return or__3824__auto____125916
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____125920 = mf;
    if(and__3822__auto____125920) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____125920
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____125921 = cljs.core._methods[goog.typeOf(mf)];
      if(or__3824__auto____125921) {
        return or__3824__auto____125921
      }else {
        var or__3824__auto____125922 = cljs.core._methods["_"];
        if(or__3824__auto____125922) {
          return or__3824__auto____125922
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____125926 = mf;
    if(and__3822__auto____125926) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____125926
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____125927 = cljs.core._prefers[goog.typeOf(mf)];
      if(or__3824__auto____125927) {
        return or__3824__auto____125927
      }else {
        var or__3824__auto____125928 = cljs.core._prefers["_"];
        if(or__3824__auto____125928) {
          return or__3824__auto____125928
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____125932 = mf;
    if(and__3822__auto____125932) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____125932
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____125933 = cljs.core._dispatch[goog.typeOf(mf)];
      if(or__3824__auto____125933) {
        return or__3824__auto____125933
      }else {
        var or__3824__auto____125934 = cljs.core._dispatch["_"];
        if(or__3824__auto____125934) {
          return or__3824__auto____125934
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__125937 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__125938 = cljs.core._get_method.call(null, mf, dispatch_val__125937);
  if(cljs.core.truth_(target_fn__125938)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__125937)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__125938, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__125939 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__125940 = this;
  cljs.core.swap_BANG_.call(null, this__125940.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__125940.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__125940.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__125940.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__125941 = this;
  cljs.core.swap_BANG_.call(null, this__125941.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__125941.method_cache, this__125941.method_table, this__125941.cached_hierarchy, this__125941.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__125942 = this;
  cljs.core.swap_BANG_.call(null, this__125942.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__125942.method_cache, this__125942.method_table, this__125942.cached_hierarchy, this__125942.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__125943 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__125943.cached_hierarchy), cljs.core.deref.call(null, this__125943.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__125943.method_cache, this__125943.method_table, this__125943.cached_hierarchy, this__125943.hierarchy)
  }
  var temp__3971__auto____125944 = cljs.core.deref.call(null, this__125943.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____125944)) {
    var target_fn__125945 = temp__3971__auto____125944;
    return target_fn__125945
  }else {
    var temp__3971__auto____125946 = cljs.core.find_and_cache_best_method.call(null, this__125943.name, dispatch_val, this__125943.hierarchy, this__125943.method_table, this__125943.prefer_table, this__125943.method_cache, this__125943.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____125946)) {
      var target_fn__125947 = temp__3971__auto____125946;
      return target_fn__125947
    }else {
      return cljs.core.deref.call(null, this__125943.method_table).call(null, this__125943.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__125948 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__125948.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__125948.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__125948.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__125948.method_cache, this__125948.method_table, this__125948.cached_hierarchy, this__125948.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__125949 = this;
  return cljs.core.deref.call(null, this__125949.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__125950 = this;
  return cljs.core.deref.call(null, this__125950.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__125951 = this;
  return cljs.core.do_dispatch.call(null, mf, this__125951.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__125953__delegate = function(_, args) {
    var self__125952 = this;
    return cljs.core._dispatch.call(null, self__125952, args)
  };
  var G__125953 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__125953__delegate.call(this, _, args)
  };
  G__125953.cljs$lang$maxFixedArity = 1;
  G__125953.cljs$lang$applyTo = function(arglist__125954) {
    var _ = cljs.core.first(arglist__125954);
    var args = cljs.core.rest(arglist__125954);
    return G__125953__delegate(_, args)
  };
  G__125953.cljs$lang$arity$variadic = G__125953__delegate;
  return G__125953
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__125955 = this;
  return cljs.core._dispatch.call(null, self__125955, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2319__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__125956 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_125958, writer, _) {
  var this__125957 = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(this__125957.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_125960, _) {
  var this__125959 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__125959.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__125961 = this;
  var and__3822__auto____125962 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto____125962) {
    return this__125961.uuid === other.uuid
  }else {
    return and__3822__auto____125962
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__125963 = this;
  var this__125964 = this;
  return cljs.core.pr_str.call(null, this__125964)
};
cljs.core.UUID;
cljs.core.ExceptionInfo = function(message, data, cause) {
  this.message = message;
  this.data = data;
  this.cause = cause
};
cljs.core.ExceptionInfo.cljs$lang$type = true;
cljs.core.ExceptionInfo.cljs$lang$ctorPrSeq = function(this__2320__auto__) {
  return cljs.core.list.call(null, "cljs.core/ExceptionInfo")
};
cljs.core.ExceptionInfo;
cljs.core.ExceptionInfo.prototype = new Error;
cljs.core.ExceptionInfo.prototype.constructor = cljs.core.ExceptionInfo;
cljs.core.ex_info = function() {
  var ex_info = null;
  var ex_info__2 = function(msg, map) {
    return new cljs.core.ExceptionInfo(msg, map, null)
  };
  var ex_info__3 = function(msg, map, cause) {
    return new cljs.core.ExceptionInfo(msg, map, cause)
  };
  ex_info = function(msg, map, cause) {
    switch(arguments.length) {
      case 2:
        return ex_info__2.call(this, msg, map);
      case 3:
        return ex_info__3.call(this, msg, map, cause)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ex_info.cljs$lang$arity$2 = ex_info__2;
  ex_info.cljs$lang$arity$3 = ex_info__3;
  return ex_info
}();
cljs.core.ex_data = function ex_data(ex) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.ExceptionInfo, ex)) {
    return ex.data
  }else {
    return null
  }
};
cljs.core.ex_message = function ex_message(ex) {
  if(cljs.core.instance_QMARK_.call(null, Error, ex)) {
    return ex.message
  }else {
    return null
  }
};
cljs.core.ex_cause = function ex_cause(ex) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.ExceptionInfo, ex)) {
    return ex.cause
  }else {
    return null
  }
};
goog.provide("clang.util");
goog.require("cljs.core");
clang.util._BANG_ = function() {
  var _BANG_ = null;
  var _BANG___2 = function(target, name) {
    return cljs.core.js__GT_clj.call(null, target[name])
  };
  var _BANG___3 = function(target, name, value) {
    return target[name] = cljs.core.clj__GT_js.call(null, value)
  };
  _BANG_ = function(target, name, value) {
    switch(arguments.length) {
      case 2:
        return _BANG___2.call(this, target, name);
      case 3:
        return _BANG___3.call(this, target, name, value)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _BANG_.cljs$lang$arity$2 = _BANG___2;
  _BANG_.cljs$lang$arity$3 = _BANG___3;
  return _BANG_
}();
clang.util._QMARK_ = function() {
  var _QMARK_ = null;
  var _QMARK___1 = function(x) {
    console.log([cljs.core.str(x)].join(""));
    return x
  };
  var _QMARK___2 = function(x, y) {
    console.log([cljs.core.str(x)].join(""), [cljs.core.str(y)].join(""), y);
    return y
  };
  _QMARK_ = function(x, y) {
    switch(arguments.length) {
      case 1:
        return _QMARK___1.call(this, x);
      case 2:
        return _QMARK___2.call(this, x, y)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _QMARK_.cljs$lang$arity$1 = _QMARK___1;
  _QMARK_.cljs$lang$arity$2 = _QMARK___2;
  return _QMARK_
}();
goog.provide("clang.todo");
goog.require("cljs.core");
goog.require("clang.util");
clang.todo.m = window.angular.module("clang.todo", []);
clang.todo.m.controller("TodoCtrl", ["$scope", function($scope) {
  return clang.util._BANG_.call(null, $scope, "todos", cljs.core.PersistentVector.fromArray([cljs.core.ObjMap.fromObject(["\ufdd0'text", "\ufdd0'done"], {"\ufdd0'text":"learn angular", "\ufdd0'done":true}), cljs.core.ObjMap.fromObject(["\ufdd0'text", "\ufdd0'done"], {"\ufdd0'text":"build an app", "\ufdd0'done":false})], true))
}]);
goog.provide("clang.core");
goog.require("cljs.core");
goog.require("clang.todo");
clang.core.angular = window.angular;
clang.core.app = window.angular.module("app", ["clang.todo"]);
clang.core.app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider) {
  return $locationProvider.html5Mode(false)
}]);
clang.core.angular.element(document).ready(function() {
  return clang.core.angular.bootstrap(document, ["app"])
});
