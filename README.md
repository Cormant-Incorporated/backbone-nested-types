# backbone-nested-types

Backbone Model mixin that provides `toJSON()`, `parse()`, and `validate()` implementations for models with nested types.

Setup:

1. Mix this object into a Backbone Model using `Backbone.Model.extend(NestedTypesMixin)`.
2. Define nested-type attributes in one of the following ways:
    
    A. Set `nestedTypes` in the Model definition.  
    B. Set `nestedTypes` on the model instance.
    
    Note: `nestedTypes` can either be an object or a function.
    

Sample Setup and Usage:

```
var MyModel = Backbone.Model.extend({
    nestedTypes: {
        subModel: Backbone.Model
    }
}).extend(NestedTypesMixin);

// `subModel` is converted to an instance of `Backbone.Model` because `{ parse: true }` is passed.
var model = new MyModel({ subModel: { foo: 'bar' } }, { parse: true });

model.get('subModel');// => returns the Backbone Model

// `subModel` is converted to a plain object using it's own `toJSON()` method
model.toJSON();// => { subModel: { foo: 'bar' } }
```
