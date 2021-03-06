'use strict';

var isPlainObject = require('is-plain-object');

exports.isModifier = function(modifier) {
	var keys = Object.keys(modifier);
	return keys.length && (/^\$/).test(keys[0]);
};

exports.indexBy = function(items, key) {
	var hash = {};
	items.forEach(function(item) {
		hash[item[key]] = item;
	});
	return hash;
};

exports.capitalize = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.createDateFormatter = function(format) {
	if (format === 'timestamp') {
		return function(date) {
			return date.getTime();
		};
	} else if (format === 'string') {
		return function(date) {
			return date.toString();
		};
	} else if (format === 'ISODate') {
		return function(date) {
			return date;
		};
	} else if (format === 'ISOString') {
		return function(date) {
			return date.toISOString();
		};
	} else if (typeof format === 'function') {
		return function(date) {
			return format(date);
		};
	} else {
		throw new Error('Unknown date format "' + format + '"');
	}
};

var deepKeyAssign = function(target, key, val) {
	var src = target[key]; // source value

	// recursion prevention
	if (val === target) {
		return;

	/**
	 * if new value isn't object then just overwrite by new value
	 * instead of extending.
	 */
	} else if (typeof val !== 'object' || val === null || !isPlainObject(val)) {
		target[key] = val;
		return;

	// just clone arrays (and recursive clone objects inside)
	} else if (Array.isArray(val)) {
		target[key] = deepCloneArray(val);
		return;

	// overwrite by new value if source isn't object or array
	} else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
		target[key] = deepExtend({}, val);
		return;

	// source value and new value is objects both, extending...
	} else {
		target[key] = deepExtend(src, val);
		return;
	}
};

var deepCloneArray = function(arr) {
	var clone = [];
	arr.forEach(function(item, index) {
		deepKeyAssign(clone, index, item);
	});
	return clone;
};

var deepExtend = exports.deepExtend = function() {
	if (arguments.length < 1 || typeof arguments[0] !== 'object') {
		return false;
	}

	if (arguments.length < 2) {
		return arguments[0];
	}

	var target = arguments[0];
	var objects = Array.prototype.slice.call(arguments, 1);

	objects.forEach(function(object) {
		Object.keys(object).forEach(function(key) {
			var val = object[key]; // new value
			deepKeyAssign(target, key, val);
		});
	});

	return target;
};

exports.deepClone = function(obj) {
	if (Array.isArray(obj)) {
		return deepCloneArray(obj);
	} else {
		return deepExtend({}, obj);
	}
};

exports.withPromise = function(func) {
	return function() {
		var args = Array.prototype.slice.call(arguments, 0);
		var self = this;

		if (typeof args[args.length - 1] === 'function') {
			func.apply(this, args);
		} else {
			return new Promise(function(resolve, reject) {
				func.apply(self, args.concat([function(err, result) {
					if (err) {
						reject(err);
					} else {
						resolve(result);
					}
				}]));
			});
		}
	};
};
