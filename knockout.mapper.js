(function (factory) {
    if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
        // CommonJS or Node: hard-coded dependency on "knockout"
        factory(require("knockout"), exports);
    } else if (typeof define === "function" && define["amd"]) {
        // AMD anonymous module with hard-coded dependency on "knockout"
        define(["knockout", "exports"], factory);
    } else {
        // <script> tag: use the global `ko` object, attaching a `mapper` property
        factory(ko, ko.mapper = {});
    }
})(function (ko, exports) {
    var running = 0;

    exports.isRunning = function() {
        return running != 0;
    };

    // Set default options here that will be merged to
    // every fromJS or toJS call.
    exports.defaultOptions = {
    };

    exports.fromJSContext = function(parents, options) {
        this.parents = parents || [];
        this.options = options;
    };

    exports.fromJSContext.prototype.createChildContext = function(newParent) {
        return new exports.fromJSContext([newParent].concat(this.parents));
    };

    exports.fromJSContext.prototype.addOptions = function(options) {
        return new exports.fromJSContext(this.parents, options);
    };

    exports.fromJSContext.prototype.getParentObject = function(index) {
        return this.parents[index];
    };

    exports.fromJS = function (value, options, target, wrap, context) {
        if(!context)
            context = new exports.fromJSContext();

        running++;

        var handler = "auto";

        if (typeof options == 'function') options = options();

        if (options && options.$fromJS)
            options = options.$fromJS;

        if (options) {
            if (getType(options) == "string") {
                handler = options;
                options = exports.defaultOptions || {};
            } else {
                options = exports.mergeOptions(exports.defaultOptions, options);
                if (options.$handler) {
                    handler = options.$handler.fromJS || options.$handler;
                }
            }
        } else {
            options = exports.defaultOptions || {};
        }

        var result = null;

        if (typeof (handler) == 'function')
            result = handler(value, options, target, wrap, context);
        else
            result = exports.handlers[handler].fromJS(value, options, target, wrap, context);

        running--;

        return result;
    };

    exports.toJS = function (value, options) {
        running++;

        var handler = "auto";

        if (typeof options == 'function') options = options();

        if (options && options.$toJS)
            options = options.$toJS;

        if (options) {
            if (getType(options) == "string") {
                handler = options;
                options = exports.defaultOptions || {};
            } else {
                options = exports.mergeOptions(exports.defaultOptions, options);
                if (options.$handler) {
                    handler = options.$handler.toJS || options.$handler;
                }
            }
        } else {
            options = exports.defaultOptions || {};
        }

        var result = null;

        if (typeof (handler) == 'function')
            result = handler(value, options);
        else
            result = exports.handlers[handler].toJS(value, options);

        running--;

        return result;
    };

    exports.mergeOptions = function () {
        var options = {};

        for (var i = 0; i < arguments.length; i++) {
            var toMerge = arguments[i];
            for (var p in toMerge) {
                if (getType(toMerge[p]) == "object")
                    options[p] = exports.mergeOptions(options[p], toMerge[p]);
                else
                    options[p] = toMerge[p];
            }
        }

        return options;
    };

    exports.fromJSON = function (value, options, target, wrap, context) {
        return exports.fromJS(ko.utils.parseJson(value), options, target, wrap, context);
    };

    exports.toJSON = function (value, options) {
        return ko.utils.stringifyJson(exports.toJS(value, options));
    };

    exports.resolveFromJSHandler = function (value, options, target, wrap, context) {
        var type = getType(value);
        if (type == "array") return 'array';
        if (type == "object") return 'object';
        if (type == "function") return 'ignore';

        return 'value';
    };

    exports.resolveToJSHandler = function (observable, options) {
        var value = ko.utils.unwrapObservable(observable);

        var type = getType(value);
        if (type == "array") return 'array';
        if (type == "object") return 'object';
        if (type == "function") return 'ignore';

        return 'value';
    };

    exports.handlers = {};

    exports.handlers.auto = {
        fromJS: function (value, options, target, wrap, context) {
            var handler = exports.resolveFromJSHandler(value, options, target, wrap);
            return exports.handlers[handler].fromJS(value, options, target, wrap, context);
        },
        toJS: function (observable, options) {
            var handler = exports.resolveToJSHandler(observable, options);
            return exports.handlers[handler].toJS(observable, options);
        }
    };

    exports.ignore = {};

    exports.handlers.ignore = {
        fromJS: function (value, options, target, wrap, context) {
            return exports.ignore;
        },
        toJS: function (observable, options) {
            return exports.ignore;
        }
    };

    exports.handlers.copy = {
        fromJS: function (value, options, target, wrap, context) {
            return value;
        },
        toJS: function (value, options) {
            return value;
        }
    };

    exports.handlers.value = {
        fromJS: function (value, options, target, wrap, context) {
            if (ko.isObservable(target) && (wrap || wrap == undefined || wrap == null)) {
                target(value);
                return target;
            } else if (wrap) {
                return ko.observable(value);
            } else {
                return value;
            }
        },
        toJS: function (observable, options) {
            return ko.utils.unwrapObservable(observable);
        }
    };
    exports.handlers.array = {
        fromJS: function (value, options, target, wrap, context) {
            var targetArray = ko.utils.unwrapObservable(target);

            var modified = true;
            var array = [];
            if (options.$merge) {
                if (targetArray) {
                    array = targetArray;
                    modified = false;
                }
            }
            var findItems = options.$key && targetArray;
            var itemOptions = options.$itemOptions;

            if (options.$merge) {
                for (var i = 0; i < value.length; i++) {
                    var item = findItems ? find(targetArray, options.$key, value[i]) : null;

                    var val = exports.fromJS(value[i], itemOptions, item, null, context);
                    if (val !== exports.ignore && !item) {
                        modified = true;
                        array.push(val);
                    }
                }
            } else {
                for (var i = 0; i < value.length; i++) {
                    var item = findItems ? find(targetArray, options.$key, value[i]) : null;

                    var val = exports.fromJS(value[i], itemOptions, item, null, context);
                    if (val !== exports.ignore) {
                        modified = true;
                        array.push(val);
                    }
                }
            }

            if (wrap || wrap == undefined || wrap == null) {
                if (ko.isObservable(target)) {
                    if (modified) {
                        target(array);
                    }
                    return target;
                } else {
                    return ko.observableArray(array);
                }
            } else {
                return array;
            }
        },
        toJS: function (observable, options) {
            var value = ko.utils.unwrapObservable(observable);
            var arr = [];
            for (var i = 0; i < value.length; i++) {
                var itemOptions = options.$itemOptions;
                if (typeof itemOptions == 'function') itemOptions = itemOptions(observable, options);

                var val = exports.toJS(value[i], itemOptions);
                if (val !== exports.ignore) {
                    arr.push(val);
                }
            }
            return arr;
        }
    };
    exports.handlers.object = {
        fromJS: function (value, options, target, wrap, context) {
            var obj = ko.utils.unwrapObservable(target);
            var objectChanged = false;

            if (!obj) {
                objectChanged = true;

                if (options.$create) obj = options.$create(context.addOptions(options))
                else if (options.$type) obj = new options.$type;
                else obj = {};
            }

            var newContext = context.createChildContext(obj);

            for (var p in value) {
                var val = exports.fromJS(value[p], options[p] || options.$default, obj[p], true, newContext);
                if (val !== exports.ignore && obj[p] !== val) {
                    obj[p] = val;
                    objectChanged = true;
                }
            }

            if (ko.isObservable(target) && (wrap || wrap == undefined || wrap == null)) {
                if (objectChanged)
                    target(obj);

                return target;
            } else if (wrap && (options.$wrapObject === undefined || options.$wrapObject === true)) {
                return ko.observable(obj);
            } else {
                return obj;
            }
        },
        toJS: function (observable, options) {
            var value = ko.utils.unwrapObservable(observable);
            var obj = {};
            for (var p in value) {
                var val = exports.toJS(value[p], options[p] || options.$default);
                if (val !== exports.ignore) {
                    obj[p] = val;
                }
            }
            return obj;
        }
    };

    function find(array, key, data) {
        if (typeof key === 'function') {
            var value = key(data);
            for (var i = 0; i < array.length; i++) {
                var itemValue = key(array[i]);
                if (itemValue == value) {
                    return array[i];
                }
            }
        } else {
            var value = data[key];
            for (var i = 0; i < array.length; i++) {
                var itemValue = ko.utils.unwrapObservable(array[i][key]);
                if (itemValue == value) {
                    return array[i];
                }
            }
        }
        return null;
    }

    function getType(x) {
        if (x == null) return null;
        if (x instanceof Array) return "array";
        if (x instanceof Date) return "date";
        if (x instanceof RegExp) return "regex";
        return typeof x;
    }
});
