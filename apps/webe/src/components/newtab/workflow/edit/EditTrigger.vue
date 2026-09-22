<template>
  <div class="trigger space-y-4">
    <div class="space-y-1.5">
      <label class="text-xs font-medium text-muted-foreground block">
        {{ t('common.description', 'Description') }}
      </label>
      <ui-textarea
        :model-value="data.description"
        autoresize
        :placeholder="
          t(
            'workflow.blocks.trigger.descriptionPlaceholder',
            'Describe what this workflow does...'
          )
        "
        class="w-full text-xs"
        @change="updateData({ description: $event })"
      />
    </div>

    <div class="space-y-2">
      <!-- Edit Triggers Card -->
      <button
        type="button"
        class="w-full flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/30 hover:bg-accent/60 hover:border-border hover:shadow-xs transition-all text-left cursor-pointer group"
        data-testid="btn.trigger.edit"
        @click="state.showTriggersModal = true"
      >
        <div class="flex items-center space-x-3 min-w-0">
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-md bg-background border border-border/70 text-foreground group-hover:text-primary transition-colors"
          >
            <v-remixicon name="Zap" size="16" />
          </div>
          <div class="min-w-0 flex-1">
            <div
              class="text-xs font-medium text-foreground group-hover:text-primary transition-colors"
            >
              {{ t('workflow.blocks.trigger.edit', 'Edit Triggers') }}
            </div>
            <div class="text-xs text-muted-foreground truncate">
              {{ state.triggers.length }}
              {{
                state.triggers.length === 1
                  ? 'event configured'
                  : 'events configured'
              }}
            </div>
          </div>
        </div>
        <v-remixicon
          name="ChevronRight"
          class="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
          size="16"
        />
      </button>

      <!-- Parameters Card -->
      <button
        type="button"
        class="w-full flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/30 hover:bg-accent/60 hover:border-border hover:shadow-xs transition-all text-left cursor-pointer group"
        data-testid="btn.trigger.parameters"
        @click="state.showParamModal = true"
      >
        <div class="flex items-center space-x-3 min-w-0">
          <div
            class="flex size-8 shrink-0 items-center justify-center rounded-md bg-background border border-border/70 text-foreground group-hover:text-primary transition-colors"
          >
            <v-remixicon name="Terminal" size="16" />
          </div>
          <div class="min-w-0 flex-1">
            <div
              class="text-xs font-medium text-foreground group-hover:text-primary transition-colors"
            >
              {{ t('workflow.blocks.trigger.parameters', 'Parameters') }}
            </div>
            <div class="text-xs text-muted-foreground truncate">
              {{ (data.parameters || []).length }}
              {{
                (data.parameters || []).length === 1
                  ? 'parameter'
                  : 'parameters'
              }}
            </div>
          </div>
        </div>
        <v-remixicon
          name="ChevronRight"
          class="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2"
          size="16"
        />
      </button>
    </div>

    <ui-modal
      v-model="state.showParamModal"
      title="Workflow Parameters"
      description="Configure input variables and runtime arguments passed into this workflow."
      content-class="max-w-4xl"
    >
      <edit-workflow-parameters
        :prefer-tab="data.preferParamsInTab"
        :data="data.parameters"
        @update="updateData({ parameters: $event })"
        @update:prefer-tab="updateData({ preferParamsInTab: $event })"
      />
    </ui-modal>

    <ui-modal
      v-model="state.showTriggersModal"
      title="Workflow Triggers"
      description="Configure execution triggers and schedules for this workflow."
      content-class="max-w-2xl"
    >
      <shared-workflow-triggers
        :triggers="state.triggers"
        @update="updateWorkflow"
      />
    </ui-modal>
  </div>
</template>
<script setup>
import { onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import SharedWorkflowTriggers from '@/components/newtab/shared/SharedWorkflowTriggers.vue';
import EditWorkflowParameters from './EditWorkflowParameters.vue';

defineOptions({ name: 'EditTrigger' });

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const state = reactive({
  showParamModal: false,
  showTriggersModal: false,
  triggers: [...(props.data?.triggers || [])],
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateWorkflow(triggers) {
  state.triggers = triggers;
  updateData({ triggers });
}

onMounted(() => {
  if (props.data.triggers) return;

  state.triggers = [
    { type: props.data.type, data: { ...props.data }, id: nanoid(5) },
  ];
});
</script>
<style>
.trigger-item > button {
  @apply focus:ring-0;
  text-align: left;
  .delete-btn {
    visibility: hidden;
  }
  &:hover .delete-btn {
    visibility: visible;
  }
}
</style>
