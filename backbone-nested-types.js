(function (factory) {
    'use strict';
    
    if (typeof define === 'function' && define.amd) {
        define(['backbone', 'lodash'], factory);
    }
    else if (typeof exports !== 'undefined') {
        module.exports = exports = factory(require('backbone'), require('lodash'));
    }
    else {
        factory(Backbone, _);
    }
})(function (Backbone, _) {
    'use strict';
    
    // Helper Methods
    // --------------

    // Returns `true` if `value` can be instantiated as `Type`.
    var canBeInstantiatedAs = function (value, Type) {
        var isCollectionType = isTypeOf(Type, Backbone.Collection);
        return isCollectionType ? _.isArray(value) : _.isPlainObject(value);
    };

    // Returns an object containing only the properties in `attrs` which are
    // instances of their associated type in `nestedTypes`.
    var pickInstances = function (attrs, nestedTypes) {
        return _.pick(attrs, function (value, name) {
            var Type = nestedTypes[name] || function () {};
            return value instanceof Type;
        });
    };

    // Throws an error if any of the given attributes cannot be instantiated.
    var throwIfInvalid = function (attrs, nestedTypes) {
        // Try to find an invalid attribute.
        var invalidAttr = _.find(attrs, function (value, name) {
            var Type = nestedTypes[name];
            return !canBeInstantiatedAs(value, Type);
        }, this);

        // Throw exception if any attributes-to-instantiate are invalid.
        if (invalidAttr) {
            throw(new TypeError('Invalid attribute: ' + JSON.stringify(invalidAttr)));
        }
    };
    
    // Recusively iterates over elements of `collection`, returning the first element `predicate` returns truthy for.
    // The predicate is bound to `thisArg` and invoked with three arguments: `(value, index|key, collection)`.
    var findDeepValue = function (collection, predicate, thisArg) {
        var result;

        _.each(collection, function (value) {
            if (_.isObject(value) && !_.isFunction(value)) {
                result = findDeepValue.call(this, value, predicate, thisArg);
            }
            else {
                var isMatch = predicate.apply(thisArg, arguments);
                result = isMatch ? value : undefined;
            }

            if (!_.isUndefined(result)) {
                return false;// break out of the loop early
            }
        }, this);

        return result;
    };
    
    // Returns `true` if `Type` inherits from `AncestorType` (or is the same type).
    var isTypeOf = function (Type, AncestorType) {
        return Type === AncestorType || Type.prototype instanceof AncestorType;
    };

    return {

        // Backbone Overrides
        // ------------------

        // Returns instances of attributes that are defined in `nestedTypes`.
        // Passes `options` to each nested type constructor.
        // Hint: Pass `parse:true` to recursively instantiate nested types.
        parse: function (attrs, options) {
            // Save a reference to the original constructor, then overwrite it with the 
            // super constructor so that other mixins can override `parse()` in the same way.
            var originalConstructor = this.constructor;
            this.constructor = this.constructor.__super__.constructor;

            // Call the mixee's `parse()` to support transformations, then fix the constructor reference.
            attrs = originalConstructor.__super__.parse.apply(this, arguments);
            this.constructor = originalConstructor;

            // Get the current nested types.
            var nestedTypes = _.result(this, 'nestedTypes') || {};

            // Get the model attributes defined in `nestedTypes`.
            var nestedAttrs = _.pick(attrs, function (value, name) {
                return _.has(nestedTypes, name);
            });

            // Throw helpful error if any attributes are invalid.
            throwIfInvalid(nestedAttrs, nestedTypes);

            // Get the attributes that should be instantiated.
            var attrsToInstantiate = _.pick(nestedAttrs, function (value, name) {
                return canBeInstantiatedAs(value, nestedTypes[name]);
            }, this);

            // Overwrite current model attributes with instantiated attributes.
            _.each(attrsToInstantiate, function (value, name) {
                var Type = nestedTypes[name];
                attrs[name] = new Type(value, options);
            });

            return attrs;
        },

        // Serializes attributes defined in `nestedTypes` by using their `toJSON()` method, if provided.
        // Passes `options` to each instance nested `toJSON()`.
        toJSON: function (options) {
            // Save a reference to the original constructor, then overwrite it with the 
            // super constructor so that other mixins can override `toJSON()` in the same way.
            var originalConstructor = this.constructor;
            this.constructor = this.constructor.__super__.constructor;

            // Call the mixee's `toJSON()` to support transformations, then fix the constructor reference.
            var json = originalConstructor.__super__.toJSON.apply(this, arguments);
            this.constructor = originalConstructor;

            // Get the current nested types.
            var nestedTypes = _.result(this, 'nestedTypes') || {};

            // Only the nested types that are instantiated will be serialized.
            var attrsToSerialize = pickInstances(json, nestedTypes);

            // Serialize nested-type attributes.
            _.each(attrsToSerialize, function (value, name) {
                json[name] = json[name].toJSON(options);
            });

            return json;
        },

        // Validates attributes defined in `nestedTypes` by calling their `validate()` method.
        // Passes `options` to each nested `validate()` call.
        // Pass the option `validateNested: false` to skip validation of nested models.
        validate: function (attrs, options) {
            // Save a reference to the original constructor, then overwrite it with the 
            // super constructor so that other mixins can override `validate()` in the same way.
            var originalConstructor = this.constructor;
            this.constructor = this.constructor.__super__.constructor;

            // Call the mixee's `parse()` to support recursive validation, then fix the constructor reference.
            var validate = originalConstructor.__super__.validate || _.noop;
            var validationError = validate.apply(this, arguments);
            this.constructor = originalConstructor;

            // Don't validate nested types if `validateNested: false`.
            if (options && options.validateNested === false) {
                return validationError;
            }

            // Get the current nested types.
            var nestedTypes = _.result(this, 'nestedTypes') || {};

            // Default the attributes-to-validate to this model's attributes.
            attrs = attrs || this.attributes;

            // Limit validation to attributes that have been instantiated.
            var attrsToValidate = pickInstances(attrs, nestedTypes);

            // Recursively validate nested attributes, getting a deep map of all validation errors (useful for debugging).
            var attrValidations = _.mapValues(attrsToValidate, function (attr) {
                var validate = attr.validate || _.noop;// `validate` is undefined by default in Backbone.Model
                return attr instanceof Backbone.Collection ?
                    attr.invoke('validate', null, options) :
                    validate.call(attr, null, options);
            });

            // Find the first validation error in the nested validation results.
            var firstNestedError = findDeepValue(attrValidations, function (message) {
                return message;
            });

            return validationError || firstNestedError;
        }
    };
});
