var simpleObject = {
    FirstName: 'John',
    LastName: 'Doe'
};

var SimpleModel = function(){
    var self = this;
    self.FullName = ko.computed({
        read: function(){
            return self.FirstName() + " " + self.LastName();
        },
        deferEvaluation: true
    });
};

var simpleArray = [
    "Mary",
    "William"
];

var simpleArray2 = [
    "Mary",
    "Linda",
    "James"
];

var complexArray = [
    { FirstName: "Mary", Age: 20 },
    { FirstName: "William", Age: 21 }
]; 

var complexArray2 = [
    { FirstName: "Mary", Age: 22 },
    { FirstName: "Linda", Age: 23 },
    { FirstName: "James", Age: 24 }
]; 

describe("Auto handler", function(){
    it("should resolve to object handler", function(){
        checkHandler({}, "object");
    });

    it("should resolve to array handler", function(){
        checkHandler([], "array");
    });

    it("should resolve to value handler", function(){
        checkHandler("Mary", "value");
        checkHandler(21, "value");
        checkHandler(21.15, "value");
        checkHandler(true, "value");
        checkHandler(false, "value");
        checkHandler(new Date(), "value");
        checkHandler(/.*/, "value");
        checkHandler(null, "value");
        checkHandler(undefined, "value");
        checkHandler(Number.NaN, "value");
    });

    function checkHandler(value, expectedHandler){
        var handler = ko.mapper.resolveFromJSHandler(value);
        expect(handler).toEqual(expectedHandler);
    };
});

describe("Object handler", function(){
    it("should wrap all properties on observables", function(){
        var result = ko.mapper.fromJS(simpleObject);

        expect(ko.isObservable(result.FirstName)).toBeTruthy();
        expect(result.FirstName()).toBe(simpleObject.FirstName);
        expect(ko.isObservable(result.LastName)).toBeTruthy();
        expect(result.LastName()).toBe(simpleObject.LastName);
    });

    it("should create the model using a constructor function", function(){
        var mapping = { $type: SimpleModel };

        var result = ko.mapper.fromJS(simpleObject, mapping);

        expect(ko.isComputed(result.FullName)).toBeTruthy();
        expect(result.FullName()).toBe(simpleObject.FirstName + " " + simpleObject.LastName);
    });

    it("should wrap the object on an observable", function(){
        var result = ko.mapper.fromJS(simpleObject, null, null, true);
        
        expect(ko.isObservable(result)).toBeTruthy();
    });

    it("should set the object on target observable", function(){
        var observable = ko.observable();

        var result = ko.mapper.fromJS(simpleObject, null, observable, true);
        expect(result).toBe(observable);
        expect(result()).not.toBe(simpleObject);
    });

    it("should use a default handler on all properties", function(){
        var mapping = {
            $default: "ignore"
        };

        var result = ko.mapper.fromJS(simpleObject, mapping);
        expect(result).toEqual({});
    });

    it("should accept inner mappings", function(){
        var mapping = {
            "FirstName": {
                $handler: "copy"
            }
        };

        var result = ko.mapper.fromJS(simpleObject, mapping);
        expect(result.FirstName).toBe(simpleObject.FirstName);
    });

    it("should ignore when target is readOnly computed", function(){
        var value = {};
        var computed = ko.computed(function() { return value; });
        
        var result = ko.mapper.fromJS(value, null, computed, true);
        expect(result).toBe(ko.mapper.ignore);
    });
});

describe("Array handler", function(){
    it("should wrap array on observableArray", function(){
        var result = ko.mapper.fromJS(simpleArray, null, null, true);
        expect(ko.isObservable(result)).toBeTruthy();
        expect(result()).not.toBe(simpleArray);
        expect(result()).toEqual(simpleArray);
    });

    it("should replace observableArray contents", function(){
        var observableArray = ko.observableArray(simpleArray.slice());

        var result = ko.mapper.fromJS(simpleArray2, null, observableArray, true);
        expect(result).toBe(observableArray);
        expect(result()).toEqual(simpleArray2);
    });

    it("should merge arrays", function(){
        var observableArray = ko.observableArray(simpleArray.slice());

        var mapping = {
            $merge: true
        };

        var result = ko.mapper.fromJS(simpleArray2, mapping, observableArray, true);
        expect(result).toBe(observableArray);
        expect(result()).toEqual(simpleArray.concat(simpleArray2));
    });

    it("should merge complex arrays using key", function(){
        var observableArray = ko.observableArray(complexArray.slice());

        var mapping = {
            $key: 'FirstName',
            $merge: true,
            $itemOptions: {
                $default: "copy"
            }
        };

        var result = ko.mapper.fromJS(complexArray2, mapping, observableArray, true);
        expect(result).toBe(observableArray);
        expect(result()).toEqual([
            complexArray2[0],
            complexArray[1],
            complexArray2[1],
            complexArray2[2]
        ]);
    });

    it("should evaluate $itemOptions functions", function(){
        var mapping = {
            $itemOptions: function(){
                return {
                    "LastName": "ignore"
                };
            }
        };

        var result = ko.mapper.fromJS(complexArray, mapping);
        expect(result.length).toBe(complexArray.length);
        expect(result[0].FirstName()).toBe(complexArray[0].FirstName);
        expect(result[0].LastName).toBeUndefined();
    });

    it("should ignore when target is readOnly computed", function(){
        var value = [];
        var computed = ko.computed(function() { return value; });
        
        var result = ko.mapper.fromJS(value, null, computed, true);
        expect(result).toBe(ko.mapper.ignore);
    });
});

describe("Value handler", function() {

    it("should convert value to model without wrap", function() {
        var stringValue = "value";
        var result = ko.mapper.fromJS(stringValue)
        expect(result).toBe(stringValue);
    });

    it("should wrap value on observable", function() {
        var stringValue = "value";
        var result = ko.mapper.fromJS(stringValue, null, null, true)
    
        expect(ko.isObservable(result)).toBeTruthy();
        expect(result()).toBe(stringValue);
    });

    it("should wrap undefined value on observable", function(){
        var value = undefined;
        var result = ko.mapper.fromJS(value, null, null, true);
        expect(ko.isObservable(result)).toBeTruthy();
        expect(result()).toBe(value);
    });

    it("should set the value on target observable", function(){
        var value = "Mary";
        var observable = ko.observable();

        var result = ko.mapper.fromJS(value, null, observable, true);
        expect(result).toBe(observable);
        expect(result()).toBe(value);
    });

    it("should ignore when target is readOnly computed", function(){
        var value = "Mary";
        var computed = ko.computed(function() { return value; });
        
        var result = ko.mapper.fromJS(value, null, computed, true);
        expect(result).toBe(ko.mapper.ignore);
    });

    it("should unwrap value from observable", function(){
        var value = "Mary";
        var observable = ko.observable(value);
        
        var result = ko.mapper.toJS(observable);
        expect(result).toBe(value);
    });
});

describe("Copy handler", function(){

    it("should copy values without wrap", function(){
        var value = "Mary";
        var result = ko.mapper.fromJS(value, "copy", null, true);
        expect(result).toBe(value);
    });
    
    it("should ignore when target is readOnly computed", function(){
        var value = "Mary";
        var computed = ko.computed(function() { return value; });
        
        var result = ko.mapper.fromJS(value, "copy", computed, true);
        expect(result).toBe(ko.mapper.ignore);
    });

});