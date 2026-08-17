import { describe, it, expect } from 'vitest';
import defaultBlocksHandler from '../src/blocksHandler/index.js';

describe('blocksHandler index', () => {
  it('exports a default blocks handler dictionary', () => {
    expect(defaultBlocksHandler).toBeDefined();
    expect(typeof defaultBlocksHandler.trigger).toBe('function');
    expect(typeof defaultBlocksHandler.Trigger).toBe('function');
    expect(typeof defaultBlocksHandler.conditions).toBe('function');
    expect(typeof defaultBlocksHandler.Conditions).toBe('function');
    expect(typeof defaultBlocksHandler.insertData).toBe('function');
    expect(typeof defaultBlocksHandler.loopData).toBe('function');
    expect(typeof defaultBlocksHandler.loopBreakpoint).toBe('function');
  });
});
