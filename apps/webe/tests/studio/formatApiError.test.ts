import { describe, it, expect } from 'vitest';
import { formatApiError } from '../../src/studio/services/storage.service';

describe('formatApiError', () => {
  it('returns default fallback when error is null or undefined', () => {
    expect(formatApiError(null)).toBe('Unknown error');
    expect(formatApiError(undefined)).toBe('Unknown error');
  });

  it('formats Error instances by returning message', () => {
    const err = new Error('Connection refused to 8765');
    expect(formatApiError(err)).toBe('Connection refused to 8765');
  });

  it('formats string errors', () => {
    expect(formatApiError('Browser process locked')).toBe('Browser process locked');
  });

  it('extracts message, error, or detail properties from error objects', () => {
    expect(formatApiError({ message: 'Validation failed' })).toBe('Validation failed');
    expect(formatApiError({ error: 'Unauthorized' })).toBe('Unauthorized');
    expect(formatApiError({ detail: 'Table not found' })).toBe('Table not found');
  });
});
