<template>
  <div
    id="workflow-edit-block"
    data-testid="workflow-edit-block"
    class="scroll h-full overflow-auto px-3 py-1 text-xs"
  >
    <div
      class="sticky top-0 z-20 mb-3 flex items-center gap-2 bg-card pb-2.5 pt-2 border-b border-border/70"
    >
      <ui-button
        variant="ghost"
        size="icon-xs"
        data-testid="btn.workflow.edit_block.back"
        :title="t('common.back', 'Back')"
        aria-label="Back"
        class="size-7 rounded-md"
        @click="handleClose"
      >
        <v-remixicon name="ArrowLeft" size="16" />
      </ui-button>

      <span
        class="inline-flex items-center justify-center size-7 rounded-md bg-muted/70 shrink-0 text-foreground border border-border/50"
      >
        <img
          v-if="getBlockIcon() && getBlockIcon().startsWith('http')"
          :src="getBlockIcon()"
          class="h-4 w-4 object-contain dark:invert"
          alt=""
        />
        <v-remixicon v-else :name="getBlockIcon() || 'Terminal'" size="16" />
      </span>

      <p
        data-testid="edit-block-title"
        class="truncate text-xs font-semibold capitalize text-foreground flex-1 leading-tight"
      >
        {{ getBlockName() }}
      </p>

      <a
        data-testid="btn.workflow.edit_block.docs"
        :title="t('common.docs', 'Documentation')"
        aria-label="Documentation"
        :href="`https://docs.extension.automa.site/blocks/${data.id}.html`"
        rel="noopener"
        target="_blank"
        class="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition shrink-0"
      >
        <v-remixicon name="Info" size="16" />
      </a>
    </div>
    <component
      :is="getEditComponent()"
      v-if="blockData"
      ref="componentRef"
      :key="data.itemId || data.blockId"
      v-model:data="blockData"
      :block-id="data.blockId"
      v-bind="{
        fullData: data.id === 'conditions' ? data : null,
        editor: data.id === 'conditions' ? editor : null,
        connections: data.id === 'wait-connections' ? data.connections : null,
      }"
    />
  </div>
</template>
<script setup>
import customEditComponents from '@business/blocks/editComponents';
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { tasks } from '@/utils/shared';

defineOptions({ name: 'WorkflowEditBlock' });

const editModules = import.meta.glob('./edit/Edit*.vue', { eager: true });
const components = Object.entries(editModules).reduce((acc, [path, module]) => {
  const name = path
    .split('/')
    .pop()
    .replace(/\.vue$/, '');
  acc[name] = module?.default ?? module ?? {};
  return acc;
}, {});

Object.assign(components, customEditComponents());

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
  autocomplete: {
    type: Object,
    default: () => ({}),
  },
  dataChanged: Boolean,
});
const emit = defineEmits(['close', 'update', 'update:autocomplete']);

const { t, te } = useI18n();
const toast = useToast();

const blockData = computed({
  get() {
    return props.data.data;
  },
  set(data) {
    emit('update', data);
  },
});

const componentRef = ref(null);

const blockValidators = {
  'google-sheets': (data) => {
    const { spreadsheetId, type, range } = data || {};
    const isNotCreateAction = !['create', 'add-sheet'].includes(type);
    if (!isNotCreateAction) return true;

    const errors = [];
    if (!spreadsheetId) {
      errors.push(
        t(
          'workflow.blocks.google-sheets.spreadsheetId.required',
          'Spreadsheet ID is required'
        )
      );
    }
    if (!range) {
      errors.push(
        t('workflow.blocks.google-sheets.range.required', 'Range is required')
      );
    }
    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return false;
    }
    return true;
  },
};

function validateBeforeClose() {
  if (
    componentRef.value?.validate &&
    typeof componentRef.value.validate === 'function'
  ) {
    return componentRef.value.validate();
  }
  const validator = blockValidators[props.data.id];
  if (validator) {
    return validator(blockData.value);
  }
  return true;
}

function handleClose() {
  if (validateBeforeClose()) {
    emit('close');
  }
}

function getEditComponent() {
  const editComp =
    props.data.editComponent ||
    (props.data.id
      ? `Edit${props.data.id
          .split('-')
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join('')}`
      : null);
  if (typeof editComp === 'object') return editComp;

  return components[editComp];
}
function getBlockName() {
  const key = `workflow.blocks.${props.data.id}.name`;

  return te(key) ? t(key) : props.data.name;
}
function getBlockIcon() {
  if (props.data?.icon) return props.data.icon;
  const task = tasks[props.data?.id];
  return task?.icon || 'riCommandLine';
}
</script>
<style scoped>
#workflow-edit-block :deep(hr) {
  margin-top: 1rem;
  margin-bottom: 1rem;
  border-color: var(--border);
}
</style>
