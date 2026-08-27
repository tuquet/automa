import { describe, it, expect } from 'vitest';
import { SELECT_CATALOG, getSelectSchema, type SelectId } from '@automa/types';

describe('Unit: Select & Dropdown Business Logic Schema Contracts', () => {
  it('1. Verifies all 11 canonical Select components exist and have unique IDs', () => {
    expect(SELECT_CATALOG.length).toBe(11);

    const ids = SELECT_CATALOG.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(SELECT_CATALOG.length);

    for (const select of SELECT_CATALOG) {
      expect(select.id).toMatch(/^select\.[a-z0-9_]+(\.[a-z0-9_]+)+$/);
      expect(select.presentation.dataTestId).toMatch(/^select-[a-z0-9-]+$/);
    }
  });

  it('2. Verifies Virtualization configuration on high-cardinality collection selects', () => {
    const virtualizedSelects = SELECT_CATALOG.filter((s) => s.virtualization.enabled);

    expect(virtualizedSelects.length).toBeGreaterThanOrEqual(6);

    for (const select of virtualizedSelects) {
      expect(select.virtualization.itemHeightPx).toBeGreaterThan(20);
      expect(select.virtualization.maxVisibleItems).toBeGreaterThanOrEqual(4);
      expect(select.virtualization.overscanCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('3. Verifies Remote Data-Source contracts and response mappers', () => {
    for (const select of SELECT_CATALOG) {
      expect(select.remote.endpoint).toMatch(/^\/api\/v1\//);
      expect(['GET', 'POST']).toContain(select.remote.method);
      expect(typeof select.remote.mapResponseToOptions).toBe('function');
      expect(select.remote.cacheTtlMs).toBeGreaterThan(0);
    }
  });

  it('4. Verifies Search and Debounce configurations', () => {
    for (const select of SELECT_CATALOG) {
      if (select.search.searchable) {
        expect(['client', 'remote', 'hybrid']).toContain(select.search.searchMode);
        expect(select.search.debounceMs).toBeGreaterThanOrEqual(100);
        expect(select.search.placeholder.length).toBeGreaterThan(0);
      }
    }
  });

  it('5. Verifies schema lookup helper function', () => {
    const profileSchema = getSelectSchema('select.browser.profile');
    expect(profileSchema).toBeDefined();
    expect(profileSchema?.id).toBe('select.browser.profile');
    expect(profileSchema?.remote.endpoint).toBe('/api/v1/browsers');

    const workflowSchema = getSelectSchema('select.storage.workflow');
    expect(workflowSchema).toBeDefined();
    expect(workflowSchema?.id).toBe('select.storage.workflow');
    expect(workflowSchema?.remote.endpoint).toBe('/api/v1/storage/workflows');

    const nonExistent = getSelectSchema('select.non_existent' as SelectId);
    expect(nonExistent).toBeUndefined();
  });
});
