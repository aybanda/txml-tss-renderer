// Type validation tests

import { 
  validateString, 
  validateNumber, 
  validateBoolean, 
  validateObject, 
  validateArray, 
  validateFunction,
  validateEnum,
  validateNotNull,
  TypeValidationError,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction
} from '../type-validation.js';

describe('Type Validation', () => {
  describe('validateString', () => {
    it('should validate valid strings', () => {
      expect(validateString('hello', 'test')).toBe('hello');
      expect(validateString('  hello  ', 'test')).toBe('  hello  ');
    });

    it('should throw for non-strings', () => {
      expect(() => validateString(123, 'test')).toThrow(TypeValidationError);
      expect(() => validateString(null, 'test')).toThrow(TypeValidationError);
      expect(() => validateString(undefined, 'test')).toThrow(TypeValidationError);
      expect(() => validateString({}, 'test')).toThrow(TypeValidationError);
    });

    it('should throw for empty strings', () => {
      expect(() => validateString('', 'test')).toThrow(TypeValidationError);
      expect(() => validateString('   ', 'test')).toThrow(TypeValidationError);
    });
  });

  describe('validateNumber', () => {
    it('should validate valid numbers', () => {
      expect(validateNumber(123, 'test')).toBe(123);
      expect(validateNumber(0, 'test')).toBe(0);
      expect(validateNumber(-123, 'test')).toBe(-123);
    });

    it('should validate numbers within range', () => {
      expect(validateNumber(5, 'test', 0, 10)).toBe(5);
      expect(validateNumber(0, 'test', 0, 10)).toBe(0);
      expect(validateNumber(10, 'test', 0, 10)).toBe(10);
    });

    it('should throw for non-numbers', () => {
      expect(() => validateNumber('123', 'test')).toThrow(TypeValidationError);
      expect(() => validateNumber(null, 'test')).toThrow(TypeValidationError);
      expect(() => validateNumber(NaN, 'test')).toThrow(TypeValidationError);
    });

    it('should throw for numbers outside range', () => {
      expect(() => validateNumber(-1, 'test', 0, 10)).toThrow(TypeValidationError);
      expect(() => validateNumber(11, 'test', 0, 10)).toThrow(TypeValidationError);
    });
  });

  describe('validateBoolean', () => {
    it('should validate valid booleans', () => {
      expect(validateBoolean(true, 'test')).toBe(true);
      expect(validateBoolean(false, 'test')).toBe(false);
    });

    it('should throw for non-booleans', () => {
      expect(() => validateBoolean('true', 'test')).toThrow(TypeValidationError);
      expect(() => validateBoolean(1, 'test')).toThrow(TypeValidationError);
      expect(() => validateBoolean(null, 'test')).toThrow(TypeValidationError);
    });
  });

  describe('validateObject', () => {
    it('should validate valid objects', () => {
      expect(validateObject({}, 'test')).toEqual({});
      expect(validateObject({ a: 1 }, 'test')).toEqual({ a: 1 });
    });

    it('should throw for non-objects', () => {
      expect(() => validateObject(null, 'test')).toThrow(TypeValidationError);
      expect(() => validateObject(undefined, 'test')).toThrow(TypeValidationError);
      expect(() => validateObject([], 'test')).toThrow(TypeValidationError);
      expect(() => validateObject('string', 'test')).toThrow(TypeValidationError);
    });
  });

  describe('validateArray', () => {
    it('should validate valid arrays', () => {
      expect(validateArray([], 'test')).toEqual([]);
      expect(validateArray([1, 2, 3], 'test')).toEqual([1, 2, 3]);
    });

    it('should throw for non-arrays', () => {
      expect(() => validateArray({}, 'test')).toThrow(TypeValidationError);
      expect(() => validateArray('string', 'test')).toThrow(TypeValidationError);
      expect(() => validateArray(null, 'test')).toThrow(TypeValidationError);
    });
  });

  describe('validateFunction', () => {
    it('should validate valid functions', () => {
      const fn = () => {};
      expect(validateFunction(fn, 'test')).toBe(fn);
    });

    it('should throw for non-functions', () => {
      expect(() => validateFunction({}, 'test')).toThrow(TypeValidationError);
      expect(() => validateFunction('string', 'test')).toThrow(TypeValidationError);
      expect(() => validateFunction(null, 'test')).toThrow(TypeValidationError);
    });
  });

  describe('validateEnum', () => {
    it('should validate valid enum values', () => {
      expect(validateEnum('a', 'test', ['a', 'b', 'c'])).toBe('a');
      expect(validateEnum('b', 'test', ['a', 'b', 'c'])).toBe('b');
    });

    it('should throw for invalid enum values', () => {
      expect(() => validateEnum('d', 'test', ['a', 'b', 'c'])).toThrow(TypeValidationError);
      expect(() => validateEnum(1, 'test', ['a', 'b', 'c'])).toThrow(TypeValidationError);
    });
  });

  describe('validateNotNull', () => {
    it('should validate non-null values', () => {
      expect(validateNotNull('hello', 'test')).toBe('hello');
      expect(validateNotNull(0, 'test')).toBe(0);
      expect(validateNotNull(false, 'test')).toBe(false);
      expect(validateNotNull({}, 'test')).toEqual({});
    });

    it('should throw for null or undefined', () => {
      expect(() => validateNotNull(null, 'test')).toThrow(TypeValidationError);
      expect(() => validateNotNull(undefined, 'test')).toThrow(TypeValidationError);
    });
  });

  describe('Type guards', () => {
    describe('isString', () => {
      it('should return true for strings', () => {
        expect(isString('hello')).toBe(true);
        expect(isString('')).toBe(true);
      });

      it('should return false for non-strings', () => {
        expect(isString(123)).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString({})).toBe(false);
      });
    });

    describe('isNumber', () => {
      it('should return true for numbers', () => {
        expect(isNumber(123)).toBe(true);
        expect(isNumber(0)).toBe(true);
        expect(isNumber(-123)).toBe(true);
      });

      it('should return false for non-numbers', () => {
        expect(isNumber('123')).toBe(false);
        expect(isNumber(NaN)).toBe(false);
        expect(isNumber(null)).toBe(false);
      });
    });

    describe('isBoolean', () => {
      it('should return true for booleans', () => {
        expect(isBoolean(true)).toBe(true);
        expect(isBoolean(false)).toBe(true);
      });

      it('should return false for non-booleans', () => {
        expect(isBoolean('true')).toBe(false);
        expect(isBoolean(1)).toBe(false);
        expect(isBoolean(null)).toBe(false);
      });
    });

    describe('isObject', () => {
      it('should return true for objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ a: 1 })).toBe(true);
      });

      it('should return false for non-objects', () => {
        expect(isObject(null)).toBe(false);
        expect(isObject([])).toBe(false);
        expect(isObject('string')).toBe(false);
      });
    });

    describe('isArray', () => {
      it('should return true for arrays', () => {
        expect(isArray([])).toBe(true);
        expect(isArray([1, 2, 3])).toBe(true);
      });

      it('should return false for non-arrays', () => {
        expect(isArray({})).toBe(false);
        expect(isArray('string')).toBe(false);
        expect(isArray(null)).toBe(false);
      });
    });

    describe('isFunction', () => {
      it('should return true for functions', () => {
        expect(isFunction(() => {})).toBe(true);
        expect(isFunction(function() {})).toBe(true);
      });

      it('should return false for non-functions', () => {
        expect(isFunction({})).toBe(false);
        expect(isFunction('string')).toBe(false);
        expect(isFunction(null)).toBe(false);
      });
    });
  });
});
