import { describe, it, expect } from 'vitest';
import { renderString, keyParser } from '../src/utils/renderString.js';

describe('renderString util', () => {
  describe('keyParser', () => {
    it('parses basic key', () => {
      expect(keyParser('data@path', { data: { path: 1 } })).toEqual({ dataKey: 'data', path: 'path' });
      expect(keyParser('data', { data: {} })).toEqual({ dataKey: 'data', path: '' });
    });
    it('parses table key', () => {
      expect(keyParser('table.row', { table: [] })).toEqual({ dataKey: 'table', path: '0.row' });
      expect(keyParser('table.$last', { table: [] })).toEqual({ dataKey: 'table', path: '0' });
      expect(keyParser('table.$last.row', { table: [{}] })).toEqual({ dataKey: 'table', path: '0.row' });
      expect(keyParser('table.0.row', { table: [] })).toEqual({ dataKey: 'table', path: '0.row' });
    });
    it('parses loopData', () => {
      expect(keyParser('loopData.name', {})).toEqual({ dataKey: 'loopData', path: 'name.data' });
      expect(keyParser('loopData.$index', {})).toEqual({ dataKey: 'loopData', path: '$index.data' });
    });
  });

  describe('renderString func', () => {
    it('returns empty for non-string', async () => {
      expect(await renderString(null)).toEqual({ list: {}, value: '' });
    });
    it('returns original string if no mustache tag', async () => {
      expect(await renderString('hello')).toEqual({ list: {}, value: 'hello' });
    });
    it('replaces mustache tags with reference data', async () => {
      const data = { user: { name: 'Alice' } };
      expect(await renderString('Hello {{ user@name }}', data)).toEqual({
        list: { '{{ user@name }}': 'Alice' },
        value: 'Hello Alice'
      });
    });
    it('handles single tag result', async () => {
      const data = { user: { info: { age: 25 } } };
      expect(await renderString('{{ user@info }}', data)).toEqual({
        list: { '{{ user@info }}': '{"age":25}' },
        value: { age: 25 }
      });
    });
    it('handles built-in functions', async () => {
      const res = await renderString('{{ $randint(1, 10) }}');
      expect(typeof res.value).toBe('number');
      expect(res.value).toBeGreaterThanOrEqual(1);
      expect(res.value).toBeLessThanOrEqual(10);
      
      const resLen = await renderString("{{ $getLength('[1,2,3]') }}");
      expect(resLen.value).toBe(3);
    });
    it('handles date function', async () => {
      const resDate = await renderString('{{ $date() }}');
      expect(resDate.value).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD
    });
  });
});
