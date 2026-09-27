import { reactive, onMounted } from 'vue';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';

export function useEditorBlock(label) {
  const blocks = getBlocks();
  const block = reactive({
    details: {},
    category: { color: 'bg-accent', name: 'General' },
  });

  onMounted(() => {
    if (!label) return;

    const details = blocks[label];
    if (details) {
      block.details = { id: label, ...details };
      block.category = categories[details.category] || {
        color: 'bg-accent',
        name: details.category || 'General',
      };
    }
  });

  return block;
}
