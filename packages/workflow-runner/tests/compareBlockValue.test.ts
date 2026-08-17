import { describe, it, expect } from 'vitest';
import compareBlockValue from '../src/utils/compareBlockValue.js';

describe('compareBlockValue', () => {
  it('should compare using ==', () => {
    expect(compareBlockValue('==', 5, 5)).toBe(true);
    expect(compareBlockValue('==', 5, '5')).toBe(false);
  });
  it('should compare using !=', () => {
    expect(compareBlockValue('!=', 5, 6)).toBe(true);
    expect(compareBlockValue('!=', 5, 5)).toBe(false);
  });
  it('should compare using >', () => {
    expect(compareBlockValue('>', 6, 5)).toBe(true);
    expect(compareBlockValue('>', 5, 5)).toBe(false);
  });
  it('should compare using >=', () => {
    expect(compareBlockValue('>=', 6, 5)).toBe(true);
    expect(compareBlockValue('>=', 5, 5)).toBe(true);
  });
  it('should compare using <', () => {
    expect(compareBlockValue('<', 5, 6)).toBe(true);
    expect(compareBlockValue('<', 5, 5)).toBe(false);
  });
  it('should compare using <=', () => {
    expect(compareBlockValue('<=', 5, 6)).toBe(true);
    expect(compareBlockValue('<=', 5, 5)).toBe(true);
  });
  it('should compare using ()', () => {
    expect(compareBlockValue('()', 'hello world', 'world')).toBe(true);
    expect(compareBlockValue('()', ['a', 'b', 'c'], 'b')).toBe(true);
    expect(compareBlockValue('()', 123, '123')).toBe(false);
  });
  it('should return false for unknown type', () => {
    expect(compareBlockValue('unknown', 1, 1)).toBe(false);
  });
});
