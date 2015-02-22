/**
 * This search service and some related methods have been extracted from the Angular source code to make it
 * available via service. Also simplifies debugging.
 */
angular.module('search').factory('AngularFilterService', function AngularFilterService() {
	var createPredicateFn = function(expression, comparator, matchAgainstAnyProp) {
		var shouldMatchPrimitives = isObject(expression) && ('$' in expression);
		var predicateFn;

		if (!isFunction(comparator)) {
			comparator = function(actual, expected) {
			  	if (isObject(actual) || isObject(expected)) {
			   		// Prevent an object to be considered equal to a string like `'[object'`
			    	return false;
			  	}

			  	actual = lowercase('' + actual);
			  	expected = lowercase('' + expected);
			  	return actual.indexOf(expected) !== -1;
			};
		}

		predicateFn = function(item) {
			if (shouldMatchPrimitives && !isObject(item)) {
		  		return deepCompare(item, expression.$, comparator, false);
			}
			return deepCompare(item, expression, comparator, matchAgainstAnyProp);
		};

		return predicateFn;
	};

	var deepCompare = function(actual, expected, comparator, matchAgainstAnyProp, dontMatchWholeObject) {
		var actualType = typeof actual;
		var expectedType = typeof expected;

		if ((expectedType === 'string') && (expected.charAt(0) === '!')) {
			return !deepCompare(actual, expected.substring(1), comparator, matchAgainstAnyProp);
		} else if (isArray(actual)) {
			// In case `actual` is an array, consider it a match
			// if ANY of it's items matches `expected`
			return actual.some(function(item) {
		  		return deepCompare(item, expected, comparator, matchAgainstAnyProp);
			});
		}

		switch (actualType) {
			case 'object':
		  	var key;
		  	if (matchAgainstAnyProp) {
		    	for (key in actual) {
		      		if ((key.charAt(0) !== '$') && deepCompare(actual[key], expected, comparator, true)) {
		        	return true;
		      	}
		    }
		    return dontMatchWholeObject ? false : deepCompare(actual, expected, comparator, false);
	  	} else if (expectedType === 'object') {
		    for (key in expected) {
	      		var expectedVal = expected[key];
		      	if (isFunction(expectedVal)) {
		        	continue;
		      	}

		      	var matchAnyProperty = key === '$';
		      	var actualVal = matchAnyProperty ? actual : actual[key];
		      	if (!deepCompare(actualVal, expectedVal, comparator, matchAnyProperty, matchAnyProperty)) {
		        	return false;
		      	}
		    }
		    return true;
	  	} else {
		    return comparator(actual, expected);
	  	}
	  	break;
		case 'function':
		  	return false;
		default:
		  	return comparator(actual, expected);
		}
	};

	var isString = function(value) {
		return typeof value === 'string';
	};

	var isObject = function(value) {
	  return value !== null && typeof value === 'object';
	};

	var isFunction = function(value) {
		return typeof value === 'function';
	};

	var isArray = Array.isArray;

	var lowercase = function(string) {
		return isString(string) ? string.toLowerCase() : string;
	};

	return {
		filterItems: function(items, expression, comparator) {
			if (!isArray(items)) return items;

		    var predicateFn;
		    var matchAgainstAnyProp;

		    switch (typeof expression) {
	      		case 'function':
		        	predicateFn = expression;
		        break;
		      	case 'boolean':
		      	case 'number':
		      	case 'string':
		        	matchAgainstAnyProp = true;
		      	case 'object':
		        	predicateFn = createPredicateFn(expression, comparator, matchAgainstAnyProp);
		        break;
		      	default:
		        	return items;
		    }

		    return items.filter(predicateFn);
		}
	};
});