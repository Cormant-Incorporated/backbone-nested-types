/* jshint node:true, expr:true */
/* global describe,beforeEach,it */

var _ = require('lodash');
var Backbone = require('backbone');
var expect = require('chai').expect;
var sinon = require('sinon');

var NestedTypeMixin = require('../backbone-nested-types');

describe('NestedTypeMixin', function () {
    var MixedModel;

    beforeEach(function () {
        MixedModel = Backbone.Model.extend(NestedTypeMixin);
    });

    it('should exist', function () {
        expect(MixedModel).to.not.be.null;
    });

    it('should instantiate', function () {
        // act
        var mixedModel = new MixedModel();

        expect(mixedModel).to.not.be.null;
    });

    it('should create nestedTypes object on instantiation', function () {
        // act
        var mixedModel = new MixedModel();

        expect(mixedModel.nestedTypes).to.not.be.null;
    });

    describe('toJSON()', function () {
        it('should serialize normally', function () {
            var mixedModel = new MixedModel({ foo: 'bar' });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ foo: 'bar' });
        });

        it('should call toJSON() on the parent once', function () {
            var timesCalled = 0;
            var MyModel = Backbone.Model.extend({
                toJSON: function () {
                    timesCalled = timesCalled + 1;
                }
            }).extend(NestedTypeMixin);

            var mixedModel = new MyModel();

            // act
            mixedModel.toJSON();

            expect(timesCalled).to.equal(1);
        });

        it('should pass the correct params to the parent toJSON()', function () {
            var argsPassed = {};
            var options = {};
            var MyModel = Backbone.Model.extend({
                toJSON: function (options) {
                    argsPassed.options = options;
                }
            }).extend(NestedTypeMixin);

            var mixedModel = new MyModel();

            // act
            mixedModel.toJSON(options);

            expect(argsPassed.options).to.equal(options);
        });

        it('should execute the parent toJSON() in the correct context', function () {
            var context;
            var MyModel = Backbone.Model.extend({
                toJSON: function () {
                    context = this;
                },
                contextProperty: true
            }).extend(NestedTypeMixin);

            var mixedModel = new MyModel();

            // act
            mixedModel.toJSON();

            expect(context).to.equal(mixedModel);
            expect(context.contextProperty).to.equal(true);
        });

        it('should serialize nested model', function () {
            var mixedModel = new MixedModel({
                nested: new Backbone.Model({ foo: 'bar' })
            });

            mixedModel.nestedTypes = {
                nested: Backbone.Model
            };

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: { foo: 'bar' } });
        });

        it('should serialize nested model when nestedTypes is a function', function() {
            var Model = Backbone.Model.extend({
                defaults: function() {
                    return {
                        nested: new Backbone.Model({
                            'foo': 'bar'
                        })
                    };
                },
                nestedTypes: function() {
                    return {
                        nested: Backbone.Model
                    };
                }
            });
            MixedModel = Model.extend(NestedTypeMixin);
            var mixedModel = new MixedModel();

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({
                nested: {
                    foo: 'bar'
                }
            });
        });

        it('should wait to call nestedTypes function until toJSON() is called', function () {
            var Model = Backbone.Model.extend({
                nestedTypes: sinon.spy()
            }).extend(NestedTypeMixin);

            var model = new Model();

            // sanity check: `nestedTypes()` shouldn't have been called yet.
            expect(model.nestedTypes).to.not.have.been.called;

            // act
            model.toJSON();

            expect(model.nestedTypes).to.have.been.calledOnce;
        });

        it('should "serialize" a custom attribute type without toJSON() the same way that Backbone does (by just referencing the object)', function () {
            var CustomType = function () {
                this.foo = 'bar';
            };
            var customObj = new CustomType();
            var mixedModel = new MixedModel({
                nested: customObj
            }, {
                nestedTypes: {
                    nested: CustomType
                }
            });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: customObj });
        });

        it('should "serialize" a primitive String by just referencing the object', function () {
            var customObj = new String('foobar');// jshint ignore:line
            var mixedModel = new MixedModel({
                nested: customObj
            }, {
                nestedTypes: {
                    nested: String
                }
            });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: customObj });
        });

        it('should "serialize" a primitive Number by just referencing the object', function () {
            var customObj = new Number(1);// jshint ignore:line
            var mixedModel = new MixedModel({
                nested: customObj
            }, {
                nestedTypes: {
                    nested: Number
                }
            });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: customObj });
        });

        it('should "serialize" a primitive Boolean by just referencing the object', function () {
            var customObj = new Boolean(true);// jshint ignore:line
            var mixedModel = new MixedModel({
                nested: customObj
            }, {
                nestedTypes: {
                    nested: Boolean
                }
            });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: customObj });
        });

        it('should "serialize" a primitive Array by just referencing the object', function () {
            var customObj = new Array();// jshint ignore:line
            var mixedModel = new MixedModel({
                nested: customObj
            }, {
                nestedTypes: {
                    nested: Array
                }
            });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: customObj });
        });

        it('should "serialize" a primitive Object by just referencing the object', function () {
            var customObj = new Object();// jshint ignore:line
            var mixedModel = new MixedModel({
                nested: customObj
            }, {
                nestedTypes: {
                    nested: Object
                }
            });

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({ nested: customObj });
        });

        it('should serialize multiple nested models', function () {
            var mixedModel = new MixedModel({
                nested1: new Backbone.Model({ foo1: 'bar1' }),
                nested2: new Backbone.Model({ foo2: 'bar2' })
            });
            mixedModel.nestedTypes = {
                nested1: Backbone.Model,
                nested2: Backbone.Model
            };

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({
                nested1: { foo1: 'bar1' },
                nested2: { foo2: 'bar2' }
            });
        });

        it('should serialize deeply nested models', function () {
            var MidLevelType = Backbone.Model.extend({
                nestedTypes: {
                    bottomLevel: Backbone.Model
                }
            }).extend(NestedTypeMixin);

            var TopLevelType = Backbone.Model.extend({
                nestedTypes: {
                    midLevel: MidLevelType
                }
            }).extend(NestedTypeMixin);

            var topLevel = new TopLevelType({
                midLevel: new MidLevelType({
                    bottomLevel: new Backbone.Model({ foo2: 'bar2' })
                })
            });

            // act
            var actual = topLevel.toJSON();

            expect(actual).to.eql({
                midLevel: {
                    bottomLevel: {
                        foo2: 'bar2'
                    }
                }
            });
        });

        it('should serialize nested collection', function () {
            var mixedModel = new MixedModel({
                myCollection: new Backbone.Collection([{ foo: 'bar' }, { bar: 'foo' }])
            });
            mixedModel.nestedTypes = {
                myCollection: Backbone.Collection
            };

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({
                myCollection: [{ foo: 'bar' }, { bar: 'foo' }]
            });
        });

        it('should serialize nested model within collection', function () {
            var mixedModel = new MixedModel({
                myCollection: new Backbone.Collection([ new Backbone.Model({ foo: 'bar' }) ])
            });
            mixedModel.nestedTypes = {
                myCollection: Backbone.Collection
            };

            // act
            var actual = mixedModel.toJSON();

            expect(actual).to.eql({
                myCollection: [{ foo: 'bar' }]
            });
        });
    });

    describe('parse()', function () {

        it('should convert specified attributes to their model types (if parse:true)', function () {
            var OtherModel = Backbone.Model.extend({ someAttribute: null });
            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    otherModel: OtherModel// specified attribute
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                otherModel: { someAttribute: true }
            }, { parse: true });

            expect(actual.get('otherModel')).to.be.an.instanceof(OtherModel);
            expect(actual.get('otherModel').get('someAttribute')).to.be.true;
        });

        it('should convert specified attributes to their model types (if parse:true) when nestedTypes is a function', function() {
            var OtherModel = Backbone.Model.extend({
                someAttribute: null
            });
            var MixedModel = Backbone.Model.extend({
                nestedTypes: function() {
                    return {
                        otherModel: OtherModel // specified attribute
                    };
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                otherModel: {
                    someAttribute: true
                }
            }, {
                parse: true
            });

            expect(actual.get('otherModel')).to.be.an.instanceof(OtherModel);
            expect(actual.get('otherModel').get('someAttribute')).to.be.true;
        });

        it('should convert deeply nested attributes to their model types (if parse:true)', function () {
            var OtherModel = Backbone.Model.extend({
                nestedTypes: {
                    deeplyNested: Backbone.Model
                }
            }).extend(NestedTypeMixin);

            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    otherModel: OtherModel
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                otherModel: { deeplyNested: { someAttribute: true } }
            }, { parse: true });

            expect(actual.get('otherModel')).to.be.an.instanceof(OtherModel);
            expect(actual.get('otherModel').get('deeplyNested')).to.be.an.instanceof(Backbone.Model);
            expect(actual.get('otherModel').get('deeplyNested').get('someAttribute')).to.be.true;
        });


        it('should not convert specified attributes to their model types if parse is undefined', function () {
            var OtherModel = Backbone.Model.extend({ someAttribute: null });
            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    otherModel: OtherModel// specified attribute
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                otherModel: { someAttribute: true }
            });

            expect(actual.get('otherModel')).to.eql({ someAttribute: true });
            expect(actual.get('otherModel').someAttribute).to.be.true;
        });

        it('should not convert specified attributes to their model types if attribute is null', function () {
            var OtherModel = Backbone.Model.extend({ someAttribute: null });
            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    otherModel: OtherModel// specified attribute
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                otherModel: null
            }, { parse: true });

            expect(actual.get('otherModel')).to.be.null;
        });

        it('should not convert specified attributes to their model types if attribute is undefined', function () {
            var OtherModel = Backbone.Model.extend({ someAttribute: null });
            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    otherModel: OtherModel// specified attribute
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({}, { parse: true });

            expect(actual.get('otherModel')).to.be.undefined;
        });

        it('should throw an error if types conflict in nestedTypes vs. attributes', function () {
            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    myModel: Backbone.Model
                }
            }).extend(NestedTypeMixin);

            // define a conflicting type for "myModel" in attributes than is specified in nestedTypes
            var attributes = { myModel: new Backbone.Collection() };

            expect(function () {
                // act
                new MixedModel(attributes, { parse: true });
            }).to.throw(TypeError);
        });

        it('should parse nested Backbone collection into an instance of the Collection', function () {
            var Collection = Backbone.Collection.extend({
                model: Backbone.Model.extend()
            });
            var MixedModel = Backbone.Model.extend({
                nestedTypes: {
                    myCollection: Collection// specified attribute
                }
            }).extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                myCollection: [{ foo: 'bar' }]
            }, { parse: true });

            expect(actual.get('myCollection')).to.be.instanceof(Collection);
            expect(actual.get('myCollection').toJSON()).to.eql([{ foo: 'bar' }]);
        });

        it('should not parse array-type attribute into new Array()', function () {
            var MixedModel = Backbone.Model.extend(NestedTypeMixin);

            // act
            var actual = new MixedModel({
                myArray: [{ foo: 'bar' }, { boo: 'far' }, { bar: 'foo' }]
            }, { parse: true });

            expect(actual.get('myArray')).to.be.instanceof(Array);
            expect(actual.get('myArray')).to.eql([{ foo: 'bar' }, { boo: 'far' }, { bar: 'foo' }]);
        });

        it('should not parse if attributes are null', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            // act
            var actual = model.parse(null);

            expect(actual).to.be.null;
        });

        it('should not parse if attributes are undefined', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            // act
            var actual = model.parse();

            expect(actual).to.be.undefined;
        });

        it('should parse attribute as null if it is null', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            // act
            var actual = model.parse({
                model: null
            });

            expect(actual).to.eql({ model: null });
        });

        it('should not parse attribute if it is undefined', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            // act
            var actual = model.parse({
                model: undefined
            });

            expect(actual).to.eql({ model: undefined });
        });

        it('should throw error if attribute is of primitive type', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            expect(function() {
                // act
                model.parse({
                    model: 1
                });
            }).to.throw(TypeError);
        });

        it('should throw error if attribute is of wrong type (expect Model)', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            expect(function() {
                // act
                model.parse({
                    model: []
                });
            }).to.throw(TypeError);
        });

        it('should throw error if attribute is of wrong type (expect Collection)', function () {
            var Mixee = Backbone.Model.extend({
                nestedTypes: {
                    collection: Backbone.Collection
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            var model = new MixedModel();

            expect(function() {
                // act
                model.parse({
                    collection: {}
                });
            }).to.throw(TypeError);
        });

        it('should call original parse method, then the mixin parse method', function () {
            var Mixee = Backbone.Model.extend({
                parse: function () {
                    return { model: { wasParsed: true } };
                },
                nestedTypes: {
                    model: Backbone.Model
                }
            });
            var MixedModel = Mixee.extend(NestedTypeMixin);

            // act
            var model = new MixedModel({}, { parse: true });

            expect(model.get('model')).to.be.instanceof(Backbone.Model);
            expect(model.get('model').get('wasParsed')).to.be.true;
        });
    });

    describe('validate()', function () {

        var ModelWithValidation, ModelWithoutValidation,
            CollectionWithValidation, CollectionWithoutValidation;

        beforeEach(function () {
            ModelWithValidation = Backbone.Model.extend({
                validate: sinon.stub()
            });

            ModelWithoutValidation = Backbone.Model.extend();

            CollectionWithValidation = Backbone.Collection.extend({
                model: ModelWithValidation
            });

            CollectionWithoutValidation = Backbone.Collection.extend({
                model: ModelWithoutValidation
            });
        });

        it('should still call the original validate method', function () {
            var originalValidate = sinon.spy(),
                Model = Backbone.Model.extend({
                    validate: originalValidate
                }).extend(NestedTypeMixin);

            var model = new Model();

            // act
            model.validate();

            expect(originalValidate.calledOnce).to.be.true;
        });

        it('should validate a nested model', function () {
            var mixedModel = new MixedModel({
                myModel: new ModelWithValidation()
            });
            mixedModel.nestedTypes = {
                myModel: ModelWithValidation
            };

            // act
            mixedModel.validate();

            expect(mixedModel.get('myModel').validate.calledOnce).to.be.true;
        });

        it('should not throw error when a nested model does not define validate', function () {
            var mixedModel = new MixedModel({
                myModel: new ModelWithoutValidation()
            });
            mixedModel.nestedTypes = {
                myModel: ModelWithoutValidation
            };

            expect(function () {
                // act
                mixedModel.validate();
            }).to.not.throw(Error);
        });

        it('should not throw error when a nested model inside collection does not define validate', function () {
            var mixedModel = new MixedModel({
                myCollection: new CollectionWithoutValidation([{}])
            });
            mixedModel.nestedTypes = {
                myCollection: CollectionWithoutValidation
            };

            expect(function () {
                // act
                mixedModel.validate();
            }).to.not.throw(Error);
        });

        it('should call validate on nested model with the correct scope', function () {
            var mixedModel = new MixedModel({
                myModel: new ModelWithValidation()
            });
            mixedModel.nestedTypes = {
                myModel: ModelWithValidation
            };

            // act
            mixedModel.validate();

            var myModel = mixedModel.get('myModel');
            expect(myModel.validate.thisValues[0]).to.equal(myModel);
        });

        it('should call validate on model inside nested collection with the correct scope', function () {
            var mixedModel = new MixedModel({
                myCollection: new CollectionWithValidation([{}])
            });
            mixedModel.nestedTypes = {
                myCollection: CollectionWithValidation
            };

            // act
            mixedModel.validate();

            var nestedModel = mixedModel.get('myCollection').first();
            expect(nestedModel.validate.thisValues[0]).to.equal(nestedModel);
        });


        it('should validate a nested model when nestedTypes is a function', function() {
            var Model = Backbone.Model.extend({
                defaults: function() {
                    return {
                        myModel: new ModelWithValidation()
                    };
                },
                nestedTypes: function() {
                    return {
                        myModel: ModelWithValidation
                    };
                }
            });

            MixedModel = Model.extend(NestedTypeMixin);
            var mixedModel = new MixedModel();

            // act
            mixedModel.validate();

            expect(mixedModel.get('myModel').validate.calledOnce).to.be.true;
        });

        it('should validate a model nested within a nested collection', function () {
            var nestedModel = new ModelWithValidation(),
                mixedModel = new MixedModel({
                    myCollection: new Backbone.Collection([nestedModel])
                });

            mixedModel.nestedTypes = {
                myCollection: Backbone.Collection
            };

            // act
            mixedModel.validate();

            expect(nestedModel.validate.calledOnce).to.be.true;
        });

        it('should return only the first nested validation error', function () {
            var FirstModel = Backbone.Model.extend({
                validate: function () {
                    return 'First validation message';
                }
            });
            var SecondModel = Backbone.Model.extend({
                validate: function () {
                    return 'Second validation message';
                }
            });

            var mixedModel = new MixedModel({
                myFirstModel: new FirstModel(),
                mySecondModel: new SecondModel()
            });
            mixedModel.nestedTypes = {
                myFirstModel: FirstModel,
                mySecondModel: SecondModel
            };

            // act
            var actual = mixedModel.validate();

            expect(actual).to.equal('First validation message');
        });

        it('should only validate types defined in attributes', function () {
            var ModelA = Backbone.Model.extend({
                validate: sinon.spy()
            });
            var ModelB = Backbone.Model.extend({
                validate: sinon.spy()
            });

            var mixedModel = new MixedModel({
                myModelA: new ModelA(),
                myModelB: new ModelB()
            });

            mixedModel.nestedTypes = {
                myModelA: ModelA,
                myModelB: ModelB
            };

            // act
            mixedModel.validate({
                myModelA: mixedModel.attributes.myModelA
            });

            expect(mixedModel.get('myModelA').validate.calledOnce).to.be.true;
            expect(mixedModel.get('myModelB').validate.called).to.be.false;
        });

        it('should pass options to nested validate method nested in Model', function () {
            var mixedModel = new MixedModel({
                myModel: new ModelWithValidation()
            });
            mixedModel.nestedTypes = {
                myModel: ModelWithValidation
            };

            var options = {
                foo: 'bar',
            };

            // act
            mixedModel.validate(null, options);

            expect(mixedModel.get('myModel').validate.calledWith(null, options)).to.be.true;
        });

        it('should pass options to validate method nested in Collection', function () {
            var mixedModel = new MixedModel({
                myCollection: new CollectionWithValidation([{}])
            });
            mixedModel.nestedTypes = {
                myCollection: CollectionWithValidation
            };

            var options = {
                foo: 'bar',
            };

            // act
            mixedModel.validate(null, options);

            var nestedModel = mixedModel.get('myCollection').first();
            expect(nestedModel.validate.calledWith(null, options)).to.be.true;
        });


        it('should respect validateNested:false', function () {
            var mixedModel = new MixedModel({
                myModel: new ModelWithValidation()
            });

            var options = {
                validateNested: false,
                nestedTypes: {
                    myModel: ModelWithValidation
                }
            };

            // act
            mixedModel.validate(null, options);

            expect(mixedModel.get('myModel').validate.called).to.be.false;
        });
    });
});