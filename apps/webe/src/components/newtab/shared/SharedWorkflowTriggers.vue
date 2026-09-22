<template>
  <div
    class="scroll overflow-auto"
    style="min-height: 250px; max-height: calc(100vh - 14rem)"
  >
    <!-- Empty State -->
    <div
      v-if="triggersList.length === 0"
      class="my-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center bg-muted/20"
    >
      <div
        class="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground mb-3"
      >
        <v-remixicon name="Zap" size="22" />
      </div>
      <h3 class="text-sm font-semibold text-foreground">
        No triggers configured
      </h3>
      <p class="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
        Triggers define when and how your workflow starts running automatically
        (e.g. interval, cron schedule, date, or context menu).
      </p>
    </div>

    <!-- Triggers List -->
    <ui-expand
      v-for="(trigger, index) in triggersList"
      :key="trigger.id || index"
      class="trigger-item mb-2.5 rounded-lg border border-border bg-card shadow-2xs overflow-hidden"
    >
      <template #header>
        <p class="flex-1 text-xs font-semibold text-foreground">
          {{ t(`workflow.blocks.trigger.items.${trigger.type}`) }}
        </p>
        <button
          type="button"
          data-testid="btn.trigger.delete"
          aria-label="Delete Trigger"
          class="delete-btn inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
          @click.stop="triggersList.splice(index, 1)"
        >
          <v-remixicon name="Trash2" size="16" />
        </button>
      </template>
      <div class="px-4 py-3 border-t border-border/50 bg-muted/10">
        <component
          :is="triggersData[trigger.type]?.component"
          :data="trigger.data"
          @update="updateTriggerData(index, $event)"
        />
      </div>
    </ui-expand>

    <div
      class="mt-4 flex items-center justify-between border-t border-border/60 pt-3"
    >
      <ui-popover>
        <template #trigger>
          <ui-button
            variant="secondary"
            size="sm"
            data-testid="btn.trigger.add"
          >
            <v-remixicon name="Plus" class="mr-1.5" size="16" />
            <span>Add trigger</span>
            <v-remixicon name="ChevronDown" class="ml-2 -mr-0.5" size="14" />
          </ui-button>
        </template>
        <ui-list
          class="space-y-1 p-1 bg-popover text-popover-foreground border border-border rounded-lg shadow-md min-w-44"
        >
          <ui-list-item
            v-for="triggerType in triggersTypes"
            :key="triggerType"
            v-close-popover
            class="cursor-pointer rounded-md text-xs hover:bg-accent hover:text-accent-foreground px-2.5 py-1.5 transition-colors"
            small
            @click="addTrigger(triggerType)"
          >
            {{ t(`workflow.blocks.trigger.items.${triggerType}`) }}
          </ui-list-item>
        </ui-list>
      </ui-popover>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { nanoid } from 'nanoid/non-secure';
import cloneDeep from 'lodash.clonedeep';
import TriggerDate from '../workflow/edit/Trigger/TriggerDate.vue';
import TriggerCronJob from '../workflow/edit/Trigger/TriggerCronJob.vue';
import TriggerInterval from '../workflow/edit/Trigger/TriggerInterval.vue';
import TriggerVisitWeb from '../workflow/edit/Trigger/TriggerVisitWeb.vue';
import TriggerContextMenu from '../workflow/edit/Trigger/TriggerContextMenu.vue';
import TriggerSpecificDay from '../workflow/edit/Trigger/TriggerSpecificDay.vue';
// import TriggerElementChange from '../workflow/edit/Trigger/TriggerElementChange.vue';
import TriggerKeyboardShortcut from '../workflow/edit/Trigger/TriggerKeyboardShortcut.vue';

defineOptions({ name: 'SharedWorkflowTriggers' });

const props = defineProps({
  triggers: {
    type: Array,
    default: () => [],
  },
  exclude: {
    type: Array,
    default: null,
  },
});
const emit = defineEmits(['update:triggers', 'update']);

const triggersData = {
  // 'element-change': TriggerElementChange,
  interval: {
    component: TriggerInterval,
    data: {
      interval: 60,
      delay: 5,
      fixedDelay: false,
    },
  },
  'cron-job': {
    component: TriggerCronJob,
    data: {
      expression: '',
    },
  },
  'context-menu': {
    onlyOne: true,
    component: TriggerContextMenu,
    data: {
      contextMenuName: '',
      contextTypes: [],
    },
  },
  date: {
    component: TriggerDate,
    data: {
      date: '',
    },
  },
  'specific-day': {
    component: TriggerSpecificDay,
    data: {
      days: [],
      time: '00:00',
    },
  },
  'on-startup': {
    onlyOne: true,
    component: null,
    data: null,
  },
  'visit-web': {
    component: TriggerVisitWeb,
    data: {
      url: '',
      isUrlRegex: false,
      supportSPA: false,
    },
  },
  'keyboard-shortcut': {
    component: TriggerKeyboardShortcut,
    data: {
      shortcut: '',
    },
  },
};

const triggersTypes = props.exclude
  ? Object.keys(triggersData).filter((type) => !props.exclude.includes(type))
  : Object.keys(triggersData);

const { t } = useI18n();
const triggersList = ref([...(props.triggers || [])]);

function addTrigger(type) {
  if (!triggersData[type]) return;
  if (triggersData[type].onlyOne) {
    const trigerExists = triggersList.value.some(
      (trigger) => trigger.type === type
    );
    if (trigerExists) return;
  }

  triggersList.value.push({
    id: nanoid(5),
    type,
    data: triggersData[type].data ? cloneDeep(triggersData[type].data) : {},
  });
}
function updateTriggerData(index, data) {
  Object.assign(triggersList.value[index].data, data);
}

watch(
  triggersList,
  (newData) => {
    emit('update', newData);
    emit('update:triggers', newData);
  },
  { deep: true }
);
</script>
