import { describe, it, expect } from 'vitest';
import {
  parseJSON,
  isObject,
  objectHasKey,
  toCamelCase,
  sleep,
  waitTabLoaded,
  isXPath,
  convertData,
  convertArrObjTo2DArr,
  convert2DArrayToArrayObj,
} from '../src/utils/helpers.js';

describe('helpers', () => {
  describe('parseJSON', () => {
    it('returns data if not a string', () => {
      expect(parseJSON({ a: 1 }, null)).toEqual({ a: 1 });
    });
    it('returns parsed json if string', () => {
      expect(parseJSON('{"a":1}', null)).toEqual({ a: 1 });
    });
    it('returns default if invalid json', () => {
      expect(parseJSON('{a:1}', { b: 2 })).toEqual({ b: 2 });
    });
  });

  describe('isObject', () => {
    it('returns true for object', () => {
      expect(isObject({ a: 1 })).toBe(true);
    });
    it('returns false for array, null, and primitive', () => {
      expect(isObject([1])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject('string')).toBe(false);
    });
  });

  describe('objectHasKey', () => {
    it('returns true if key exists', () => {
      expect(objectHasKey({ a: 1 }, 'a')).toBe(true);
    });
    it('returns false if key does not exist or not object', () => {
      expect(objectHasKey({ a: 1 }, 'b')).toBe(false);
      expect(objectHasKey(null, 'a')).toBe(false);
    });
  });

  describe('toCamelCase', () => {
    it('converts to camel case', () => {
      expect(toCamelCase('hello-world')).toBe('helloWorld');
      expect(toCamelCase('hello world', true)).toBe('HelloWorld');
      expect(toCamelCase('')).toBe('');
    });
  });

  describe('sleep', () => {
    it('resolves after timeout', async () => {
      const start = Date.now();
      await sleep(50);
      expect(Date.now() - start).toBeGreaterThanOrEqual(49);
    });
  });

  describe('waitTabLoaded', () => {
    it('resolves after ms', async () => {
      const start = Date.now();
      await waitTabLoaded({ ms: 50 });
      expect(Date.now() - start).toBeGreaterThanOrEqual(49);
    });
  });

  describe('isXPath', () => {
    it('identifies xpath', () => {
      expect(isXPath('//div')).toBe(true);
      expect(isXPath('id("test")')).toBe(true);
      expect(isXPath('.class')).toBe(false);
      expect(isXPath('')).toBe(false);
    });
  });

  describe('convertData', () => {
    it('converts to integer', () => {
      expect(convertData('123', 'integer')).toBe(123);
      expect(convertData(123, 'integer')).toBe(123);
    });
    it('converts to boolean', () => {
      expect(convertData('true', 'boolean')).toBe(true);
      expect(convertData('', 'boolean')).toBe(false);
    });
    it('converts to array', () => {
      expect(convertData([1, 2], 'array')).toEqual([1, 2]);
    });
    it('converts to string', () => {
      expect(convertData(123, 'string')).toBe('123');
    });
    it('returns as is for any', () => {
      expect(convertData(123, 'any')).toBe(123);
    });
  });

  describe('convertArrObjTo2DArr', () => {
    it('converts array of objects to 2d array', () => {
      const data = [{ a: 1, b: 2 }, { a: 3, c: 4 }];
      expect(convertArrObjTo2DArr(data)).toEqual([
        ['a', 'b', 'c'],
        [1, 2],
        [3, undefined, 4],
      ]);
    });
    it('handles non-objects', () => {
      expect(convertArrObjTo2DArr([1, { a: 1 }])).toEqual([
        ['a'],
        [1]
      ]);
    });
  });

  describe('convert2DArrayToArrayObj', () => {
    it('converts 2d array to array of objects', () => {
      const data = [
        ['a', 'b'],
        [1, 2],
        [3, 4],
      ];
      expect(convert2DArrayToArrayObj(data)).toEqual([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]);
    });
    it('handles missing headers', () => {
      const data = [
        ['a'],
        [1, 2],
      ];
      expect(convert2DArrayToArrayObj(data)).toEqual([
        { a: 1, _row1: 2 },
      ]);
    });
    it('handles empty input', () => {
      expect(convert2DArrayToArrayObj([])).toEqual([]);
    });
  });
});
