<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="max-w-md p-5 gap-4">
      <DialogHeader>
        <DialogTitle class="text-sm font-semibold flex items-center gap-2">
          <Play class="size-4 text-primary" />
          <span>Run Workflow</span>
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-3 py-1 text-xs">
        <div class="space-y-1.5">
          <label class="block font-medium text-xs text-foreground">
            Browser
          </label>
          <RemoteVirtualSelect
            id="select.browser.profile"
            :model-value="runModalState.browserId"
            placeholder="Select browser..."
            @update:model-value="$emit('update:browserId', $event)"
          />
        </div>

        <!-- Workflow Parameters Section -->
        <div
          v-if="runModalState.parameters && runModalState.parameters.length > 0"
          class="border-t border-b border-border py-2.5 space-y-2"
        >
          <div class="flex items-center justify-between">
            <h4
              class="font-semibold text-xs text-foreground flex items-center gap-1.5"
            >
              <SlidersHorizontal class="size-3.5 text-primary" />
              <span>Parameters ({{ runModalState.parameters.length }})</span>
            </h4>
          </div>

          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(param, idx) in runModalState.parameters"
              :key="idx"
              class="p-2.5 rounded-lg bg-muted border border-border space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <label
                  class="font-medium text-xs text-foreground flex items-center"
                >
                  {{ param.name }}
                  <span
                    v-if="param.data?.required"
                    class="text-destructive font-bold ml-1"
                    title="Required parameter"
                    >*</span
                  >
                </label>
                <Badge
                  variant="outline"
                  class="text-xs uppercase font-mono px-1.5 py-0"
                >
                  {{ param.type || 'string' }}
                </Badge>
              </div>

              <p v-if="param.description" class="text-xs text-muted-foreground">
                {{ param.description }}
              </p>

              <!-- JSON input -->
              <div v-if="param.type === 'json'">
                <textarea
                  :value="param.value"
                  rows="3"
                  :data-testid="`input-param-${param.name || idx}`"
                  placeholder='{ "key": "value" }'
                  class="w-full px-2.5 py-1.5 text-xs font-mono rounded-md bg-background border border-input focus:outline-none focus:ring-1 focus:ring-ring text-foreground shadow-2xs"
                  @input="
                    $emit('update:param', {
                      index: idx,
                      value: $event.target.value,
                    })
                  "
                />
              </div>

              <!-- Number input -->
              <div v-else-if="param.type === 'number'">
                <Input
                  :model-value="param.value"
                  type="number"
                  :data-testid="`input-param-${param.name || idx}`"
                  :placeholder="param.placeholder || 'Enter number...'"
                  class="h-7 text-xs"
                  @update:model-value="
                    $emit('update:param', {
                      index: idx,
                      value: Number($event),
                    })
                  "
                />
              </div>

              <!-- Default string/text input -->
              <div v-else>
                <Input
                  :model-value="param.value"
                  type="text"
                  :data-testid="`input-param-${param.name || idx}`"
                  :placeholder="param.placeholder || 'Enter value...'"
                  class="h-7 text-xs"
                  @update:model-value="
                    $emit('update:param', { index: idx, value: $event })
                  "
                />
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-2 pt-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-foreground">Headless Mode</span>
            <Switch
              :checked="runModalState.headless"
              @update:checked="$emit('update:headless', $event)"
            />
          </div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-foreground">Auto-close Browser</span>
            <Switch
              :checked="runModalState.closeBrowserOnFinish"
              @update:checked="$emit('update:closeBrowserOnFinish', $event)"
            />
          </div>
        </div>
      </div>

      <DialogFooter class="flex justify-end gap-2 pt-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          data-testid="btn-cancel-run-workflow"
          @click="$emit('update:modelValue', false)"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          data-testid="btn-confirm-run-workflow"
          :disabled="!isParamsValid || runModalState.isSubmitting"
          @click="$emit('execute')"
        >
          <Play class="size-3.5 mr-1" />
          <span>{{ runModalState.isSubmitting ? 'Running...' : 'Run' }}</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  RemoteVirtualSelect,
  Switch,
} from '@automa/ui';
import { Play, SlidersHorizontal } from 'lucide-vue-next';

defineOptions({
  name: 'RunWorkflowModal',
});

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  automaCoreState: {
    type: Object,
    default: () => ({}),
  },
  runModalState: {
    type: Object,
    required: true,
  },
  isParamsValid: {
    type: Boolean,
    default: true,
  },
});

defineEmits([
  'update:modelValue',
  'update:browserId',
  'update:headless',
  'update:closeBrowserOnFinish',
  'update:param',
  'execute',
]);
</script>
