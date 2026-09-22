<template>
  <div
    data-testid="workflow-quick-settings"
    class="space-y-2.5 text-xs text-foreground select-none"
  >
    <!-- Header (with Back button if in Drilldown mode) -->
    <div
      v-if="showBack"
      class="flex items-center justify-between pb-1.5 border-b border-border/60"
    >
      <button
        type="button"
        data-testid="btn-quick-settings-back"
        class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition cursor-pointer"
        @click="$emit('back')"
      >
        <ChevronLeft class="size-3.5" />
        <span>Back</span>
      </button>
      <span class="font-semibold text-foreground text-xs"
        >Workflow Settings</span
      >
    </div>
    <div
      v-else
      class="flex items-center justify-between pb-1.5 border-b border-border/60"
    >
      <div
        class="flex items-center gap-1.5 font-semibold text-foreground text-xs"
      >
        <Settings class="size-3.5 text-muted-foreground" />
        <span>Workflow Settings</span>
      </div>
    </div>

    <!-- Quick Settings Controls -->
    <div class="space-y-2.5 py-0.5">
      <!-- Notification on completion -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col min-w-0">
          <span class="font-medium text-xs">Notification</span>
          <span class="text-muted-foreground text-xs"
            >Notify when finished</span
          >
        </div>
        <Switch
          data-testid="switch-quick-notification"
          :model-value="workflowSettings.notification ?? true"
          size="sm"
          @update:model-value="updateSetting('notification', $event)"
        />
      </div>

      <!-- Autocomplete variables -->
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col min-w-0">
          <span class="font-medium text-xs">Autocomplete</span>
          <span class="text-muted-foreground text-xs"
            >Suggest variables in inputs</span
          >
        </div>
        <Switch
          data-testid="switch-quick-autocomplete"
          :model-value="workflowSettings.inputAutocomplete ?? true"
          size="sm"
          @update:model-value="updateSetting('inputAutocomplete', $event)"
        />
      </div>

      <!-- Error Handling Strategy -->
      <div class="flex flex-col gap-1.5 pt-1 border-t border-border/40">
        <div class="flex items-center justify-between">
          <span class="font-medium text-xs">On Error</span>
          <select
            data-testid="select-quick-on-error"
            :value="workflowSettings.onError || 'stop-workflow'"
            class="h-6 px-1.5 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            @change="updateSetting('onError', $event.target.value)"
          >
            <option value="stop-workflow">Stop Workflow</option>
            <option value="restart-workflow">Restart Workflow</option>
            <option value="continue">Continue</option>
          </select>
        </div>

        <!-- If restart-workflow, show retries input -->
        <div
          v-if="workflowSettings.onError === 'restart-workflow'"
          class="flex items-center justify-between pl-2 text-xs text-muted-foreground"
        >
          <span>Restart Retries</span>
          <input
            data-testid="input-quick-restart-times"
            type="number"
            min="1"
            max="10"
            :value="workflowSettings.restartTimes ?? 3"
            class="w-14 h-5 px-1 text-right text-xs rounded border border-input bg-background text-foreground"
            @change="
              updateSetting(
                'restartTimes',
                Math.max(1, +$event.target.value || 3)
              )
            "
          />
        </div>
      </div>

      <!-- Tab Load Timeout (seconds) -->
      <div
        class="flex items-center justify-between gap-2 pt-1 border-t border-border/40"
      >
        <div class="flex flex-col min-w-0">
          <span class="font-medium text-xs">Timeout</span>
          <span class="text-muted-foreground text-xs">Tab load limit</span>
        </div>
        <div class="flex items-center gap-1">
          <input
            data-testid="input-quick-timeout"
            type="number"
            min="5"
            max="300"
            :value="
              Math.round((workflowSettings.tabLoadTimeout ?? 30000) / 1000)
            "
            class="w-14 h-6 px-1.5 text-right text-xs rounded border border-input bg-background text-foreground"
            @change="
              updateSetting(
                'tabLoadTimeout',
                Math.max(5, +$event.target.value || 30) * 1000
              )
            "
          />
          <span class="text-muted-foreground text-xs">s</span>
        </div>
      </div>
    </div>

    <!-- Advanced Settings Modal Trigger -->
    <div class="pt-2 border-t border-border/60">
      <button
        type="button"
        data-testid="btn-open-advanced-settings"
        class="w-full py-1.5 px-2 rounded-md bg-muted/60 hover:bg-muted text-center text-xs text-primary font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
        @click="$emit('openFullSettings')"
      >
        <span>Advanced Settings...</span>
        <ExternalLink class="size-3" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { Switch } from '@automa/ui';
import { ChevronLeft, ExternalLink, Settings } from 'lucide-vue-next';

defineOptions({
  name: 'WorkflowQuickSettings',
});

defineProps({
  workflowSettings: {
    type: Object,
    default: () => ({}),
  },
  showBack: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updateSetting', 'openFullSettings', 'back']);

function updateSetting(key, value) {
  emit('updateSetting', { [key]: value });
}
</script>
