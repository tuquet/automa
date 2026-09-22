import { computed } from 'vue';

export function useWorkflowAutocomplete(workflowRef) {
  const autocompleteList = computed(() => {
    const wf = workflowRef.value || {};
    const tableCols = (wf.table || [])
      .map((col) => (typeof col === 'object' ? col.name || '' : col))
      .filter(Boolean);
    const vars = { ...(wf.variables || {}) };
    return {
      table: tableCols,
      variables: vars,
      globalData: wf.globalData || '{}',
    };
  });

  return {
    autocompleteList,
  };
}
