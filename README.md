#Knockout Mapper

An extensible and fast object mapping plugin for KnockoutJS.  

It is based on handlers (ignore, copy, object, array...) that converts knockout models toJS and fromJS in different ways.  

Every handler knows how to convert from JS and to JS.  

On **Knockout Mapper** you define the handler/options on each property:
```JS
var mapping = {
  'propertyA': 'ignore',
  'propertyB': 'ignore'
};
```
and you can also pass extra-options:
```JS
var mapping = {
  $default: 'ignore',
  'propertyC': 'auto'
};
```

It is **NOT** compatible with **Knockout Mapping** syntax.

**NEW!** Performance comparision:  
http://jsperf.com/ko-viewmodel-vs-ko-mapping-complex-viewmodel-creation/25

Fiddle with basic usage:  
http://jsfiddle.net/LucasLorentz/tC5rE/

Fiddle comparing it with Knockout Mapping:  
http://jsfiddle.net/LucasLorentz/h8hsx/

You can also read our tests to understand all behaviors of the library:  
https://github.com/LucasLorentz/knockout.mapper/blob/master/tests/tests.js

##Methods
###FromJS - Converts plain javascript objects to observable models
**Parameters:**
*  **value** - Data to be converted  
   * accepts: object
   * required
*  **options** - Mapping configuration
   * accepts: object, string
   * optional
*  **target** - Target model that should be updated
   * accepts: object, observable, observableArray, computed
   * optional
*  **wrap** - Forces to wrap or don't wrap on observables  
   * accepts: boolean
   * optional (each handler may have a different behavior when this parameter is not set)

###ToJS - Converts models to plain javascript objects
*  **value** - Model to be converted 
   * accepts: object, observable, observableArray, computed
   * required
*  **options** - Mapping configuration
   * accepts: object
   * optional

##Handlers
###auto - Resolves and executes the default handler for that object
When a handler is not specified, this handler is used by default.

###object - Converts objects and iterates through all properties 
**Options:**
*  **$type** - constructor function.
   *  Accepts: function():object
*  **$default** - default mapping options for properties.    
  
###array - Converts arrays and iterates through all elements
**Options:**  
*  **$key** - the name of the property used to compare elements, or a function returning the key
   *  Accepts: string or function(item):string  
*  **$merge** - indicates if it should replace or merge contents
   *  Accepts: true or false 
   *  Default: true
*  **$itemOptions** - mapping options to apply on each element
  
###value - Wrap/Unwrap value on an observable

###copy - Copy value without wrapping it on an observable  

###ignore - Ignore values on conversion from JS and to JS  

##Examples

###From JS
You can call fromJS passing only the data that will be transformed
```JS
var model = ko.mapper.fromJS(data);
```

Passing a mapping options:
```JS
var model = ko.mapper.fromJS(data, mapping);
```

You can also pass just the handler name:
```JS
var model = ko.mapper.fromJS(data, 'object');
```

Updating an existent model:
```JS
ko.mapper.fromJS(data, mapping, model);
```

###To JS
You can call toJS passing only the model that will be transformed
```JS
var data = ko.mapper.toJS(model);
```

Passing a mapping options:
```JS
var datal = ko.mapper.toJS(model, mapping);
```

You can also pass just the handler name:
```JS
var model = ko.mapper.toJS(data, 'object');
```

###Mapping

All examples below will consider the following data:
```JS
var data = {
  firstName: 'John',
  lastName: 'Doe',
  age: 25,
  children: [
    {
      firstName: 'Maria',
      lastName: 'Doe',
      age: 9
    },
    {
      firstName: 'William',
      lastName: 'Doe',
      age: 10
    }
  ]
};
```

Changing the handler of specific properties:
```JS
var mapping = {
  'lastName': 'copy',
  'age': 'ignore'
};
```

Specifying the root handler:
```JS
var mapping = {
  $handler: 'object',
  'lastName': 'copy',
  'age': 'ignore'
};
```

Changing the default configuration for all properties:
```JS
var mapping = {
  $default: 'ignore',
  'firstName': 'auto'
};
```

Array mapping options:
```JS
var mapping = {
  'children': {
    $key: 'firstName',
    $merge: true,
    $itemOptions: {
      'age': 'ignore'
    }
  }
};
```

$itemOptions can be a function:
```JS
var mapping = {
  'children': {
    $key: 'firstName',
    $merge: true,
    $itemOptions: function(){ return mapping; }
  }
};
```

Using a model type:
```JS
var Model = function(){
  var self = this;
  
  self.firstName = ko.observable();
  self.lastName = ko.observable();
  
  self.fullName = ko.computed(function(){
    return self.firstName() + self.lastName();
  });
};

var mapping = {
  $type: Model
};
```

Adding custom handlers:
```JS
ko.mapper.handlers.importOnce = {
    fromJS: function (value, options, target, wrap) {
        if (!target || !target.imported) {
            var result = ko.mapper.handlers.auto.fromJS(value, options, target, wrap);
            result.imported = true;
            return result;
        } else {
            return ko.mapper.ignore;
        }
    },
    toJS: function (observable, options) {
        return ko.mapper.handlers.auto.toJS(observable, options);
    }
};

var mapping = {
  'age': 'importOnce'
};
```

Dynamically ignore a member in toJS:
```JS
var mapping = {
  '$ignoreNode': function(value, parent, index) {
    // Ignore a member when it has a '_ignore_member' property
    return value === undefined || !value._ignore_member;
  }
}

##LICENSE
Licensed under the MIT License.  
http://opensource.org/licenses/mit-license.php
