<script setup lang="ts">
import type { WorkflowNode } from '@automa/types';
import { Code2, Plus, Sliders, Trash2, X } from '@lucide/vue';
import {
  Badge,
  Button,
  Input,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@tuquet/vue-ui';
import { computed, ref, watch } from 'vue';
import { getBlockMeta } from '../../../utils/block-registry.js';
import { generateCanvasId } from '../../../utils/canvas-helpers.js';

const props = defineProps<{
  node: WorkflowNode | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:data', payload: { nodeId: string; data: Record<string, unknown> }): void;
}>();

const activeTab = ref<'form' | 'json'>('form');
const jsonDraft = ref('');
const jsonError = ref('');

const meta = computed(() =>
  props.node ? getBlockMeta(props.node.label) : null,
);

const data = computed<Record<string, unknown>>(
  () => props.node?.data ?? {},
);

watch(
  () => props.node,
  (node) => {
    if (node) {
      jsonDraft.value = JSON.stringify(node.data, null, 2);
      jsonError.value = '';
    }
  },
  { immediate: true, deep: true },
);

function setField(key: string, value: unknown) {
  if (!props.node) return;
  const nextData = {
    ...props.node.data,
    [key]: value,
  };
  emit('update:data', { nodeId: props.node.id, data: nextData });
}

function applyJsonDraft() {
  if (!props.node) return;
  try {
    const parsed = JSON.parse(jsonDraft.value) as Record<string, unknown>;
    jsonError.value = '';
    emit('update:data', { nodeId: props.node.id, data: parsed });
  } catch (err) {
    jsonError.value = err instanceof Error ? err.message : 'Invalid JSON';
  }
}

const showSelectorField = computed(() => {
  const l = props.node?.label || '';
  return [
    'event-click',
    'get-text',
    'attribute-value',
    'forms',
    'element-exists',
    'hover-element',
    'element-scroll',
    'loop-elements',
    'trigger-event',
    'link',
    'upload-file',
  ].includes(l);
});

const showUrlField = computed(() => {
  const l = props.node?.label || '';
  return ['new-tab', 'tab-url', 'link', 'webhook', 'switch-tab'].includes(l);
});

const showExtractionFields = computed(() => {
  const l = props.node?.label || '';
  return [
    'get-text',
    'attribute-value',
    'javascript-code',
    'tab-url',
    'cookie',
    'webhook',
    'take-screenshot',
  ].includes(l);
});

function addConditionBranch() {
  const list = Array.isArray(data.value.conditions)
    ? [...(data.value.conditions as Array<Record<string, unknown>>)]
    : [];
  list.push({
    id: generateCanvasId('cond'),
    name: `Branch ${list.length + 1}`,
    type: '==',
    value: '',
    compareValue: '',
  });
  setField('conditions', list);
}

function removeConditionBranch(idx: number) {
  const list = Array.isArray(data.value.conditions)
    ? [...(data.value.conditions as Array<Record<string, unknown>>)]
    : [];
  list.splice(idx, 1);
  setField('conditions', list);
}
</script>

<template>
  <aside
    v-if="props.node && meta"
    class="flex h-full w-80 shrink-0 flex-col border-l border-border bg-card"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-border px-3.5 py-3">
      <div class="min-w-0">
        <div class="truncate text-sm font-semibold text-foreground">
          {{ meta.name }}
        </div>
        <div class="flex items-center gap-1.5">
          <Badge variant="outline" class="font-mono text-xs">
            {{ props.node.label }}
          </Badge>
          <span class="truncate font-mono text-xs text-muted-foreground">
            #{{ props.node.id }}
          </span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="h-8 w-8 p-0"
        title="Close Inspector"
        @click="emit('close')"
      >
        <X class="size-4" />
      </Button>
    </div>

    <Tabs v-model="activeTab" class="flex min-h-0 flex-1 flex-col">
      <div class="border-b border-border px-3.5 py-2">
        <TabsList class="grid h-8 w-full grid-cols-2">
          <TabsTrigger value="form" class="gap-1.5 text-xs">
            <Sliders class="size-3.5" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="json" class="gap-1.5 text-xs">
            <Code2 class="size-3.5" />
            JSON / Code
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Tab 1: Form Controls -->
      <TabsContent value="form" class="mt-0 flex-1 space-y-4 overflow-y-auto p-3.5">
        <!-- Description -->
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Description / Note</label>
          <Input
            class="h-8 text-xs"
            placeholder="Step description..."
            :model-value="String(data.description ?? '')"
            @update:model-value="setField('description', String($event))"
          />
        </div>

        <!-- URL Field -->
        <div v-if="showUrlField" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Target URL</label>
          <Input
            class="h-8 font-mono text-xs"
            placeholder="https://example.com or {{variables.url}}"
            :model-value="String(data.url ?? '')"
            @update:model-value="setField('url', String($event))"
          />
        </div>

        <!-- Selector Field -->
        <div v-if="showSelectorField" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">
            CSS or XPath Selector
          </label>
          <Input
            class="h-8 font-mono text-xs"
            placeholder="button#submit or //button[@type='submit']"
            :model-value="String(data.selector ?? '')"
            @update:model-value="setField('selector', String($event))"
          />
        </div>

        <!-- Forms Value -->
        <div v-if="props.node.label === 'forms'" class="space-y-3">
          <div class="space-y-1.5">
            <label class="text-xs font-medium text-foreground">Input Value</label>
            <Input
              class="h-8 text-xs"
              placeholder="Text or {{variables.username}}"
              :model-value="String(data.value ?? '')"
              @update:model-value="setField('value', String($event))"
            />
          </div>
          <div class="flex items-center justify-between rounded-lg border border-border p-2.5">
            <span class="text-xs text-foreground">Clear existing input first</span>
            <Switch
              :checked="Boolean(data.clearValue ?? true)"
              @update:checked="setField('clearValue', $event)"
            />
          </div>
        </div>

        <!-- Attribute Value Name -->
        <div v-if="props.node.label === 'attribute-value'" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Attribute Name</label>
          <Input
            class="h-8 font-mono text-xs"
            placeholder="href, src, data-id..."
            :model-value="String(data.attributeName ?? 'href')"
            @update:model-value="setField('attributeName', String($event))"
          />
        </div>

        <!-- Press Key -->
        <div v-if="props.node.label === 'press-key'" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Key</label>
          <Input
            class="h-8 font-mono text-xs"
            placeholder="Enter, Tab, Escape, ArrowDown..."
            :model-value="String(data.Keys ?? data.key ?? 'Enter')"
            @update:model-value="setField('key', String($event))"
          />
        </div>

        <!-- JavaScript Code -->
        <div v-if="props.node.label === 'javascript-code'" class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">
            JavaScript (Isolated Stealth Context)
          </label>
          <Textarea
            class="min-h-32 font-mono text-xs"
            placeholder="return document.title;"
            :model-value="String(data.code ?? '')"
            @update:model-value="setField('code', String($event))"
          />
        </div>

        <!-- Loop ID -->
        <div
          v-if="['loop-data', 'loop-elements', 'loop-breakpoint'].includes(props.node.label)"
          class="space-y-1.5"
        >
          <label class="text-xs font-medium text-foreground">Loop ID</label>
          <Input
            class="h-8 font-mono text-xs"
            placeholder="loop_items"
            :model-value="String(data.loopId ?? '')"
            @update:model-value="setField('loopId', String($event))"
          />
        </div>

        <!-- Conditions Builder -->
        <div v-if="props.node.label === 'conditions'" class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-foreground">Condition Branches</label>
            <Button
              variant="outline"
              size="sm"
              class="h-7 px-2 text-xs"
              @click="addConditionBranch"
            >
              <Plus class="mr-1 size-3.5" />
              Add Branch
            </Button>
          </div>

          <div
            v-for="(cond, idx) in ((data.conditions as Array<Record<string, unknown>>) || [])"
            :key="String(cond.id || idx)"
            class="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5"
          >
            <div class="flex items-center justify-between gap-1.5">
              <Input
                class="h-7 text-xs"
                :model-value="String(cond.name ?? `Branch ${idx + 1}`)"
                @update:model-value="
                  cond.name = String($event);
                  setField('conditions', [...(data.conditions as unknown[])]);
                "
              />
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 shrink-0 p-0 text-destructive"
                @click="removeConditionBranch(idx)"
              >
                <Trash2 class="size-3.5" />
              </Button>
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              <Input
                class="h-7 font-mono text-xs"
                placeholder="Value A"
                :model-value="String(cond.value ?? '')"
                @update:model-value="
                  cond.value = String($event);
                  setField('conditions', [...(data.conditions as unknown[])]);
                "
              />
              <Input
                class="h-7 text-center font-mono text-xs"
                placeholder="=="
                :model-value="String(cond.type ?? '==')"
                @update:model-value="
                  cond.type = String($event);
                  setField('conditions', [...(data.conditions as unknown[])]);
                "
              />
              <Input
                class="h-7 font-mono text-xs"
                placeholder="Value B"
                :model-value="String(cond.compareValue ?? '')"
                @update:model-value="
                  cond.compareValue = String($event);
                  setField('conditions', [...(data.conditions as unknown[])]);
                "
              />
            </div>
          </div>
        </div>

        <!-- Output Variable & Table Assignment -->
        <div v-if="showExtractionFields" class="space-y-3 border-t border-border pt-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-foreground">Assign to Variable</span>
            <Switch
              :checked="Boolean(data.assignVariable)"
              @update:checked="setField('assignVariable', $event)"
            />
          </div>
          <Input
            v-if="data.assignVariable"
            class="h-8 font-mono text-xs"
            placeholder="variableName"
            :model-value="String(data.variableName ?? '')"
            @update:model-value="setField('variableName', String($event))"
          />

          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-foreground">Save to Table Column</span>
            <Switch
              :checked="Boolean(data.saveData)"
              @update:checked="setField('saveData', $event)"
            />
          </div>
          <Input
            v-if="data.saveData"
            class="h-8 font-mono text-xs"
            placeholder="columnName"
            :model-value="String(data.dataColumn ?? '')"
            @update:model-value="setField('dataColumn', String($event))"
          />
        </div>
      </TabsContent>

      <!-- Tab 2: Raw JSON / Agent Code Review -->
      <TabsContent value="json" class="mt-0 flex flex-1 flex-col gap-2 p-3.5">
        <p class="text-xs text-muted-foreground">
          Inspect or edit the block's raw AST data (100% synced with <code class="font-mono">@automa/types</code>).
        </p>
        <Textarea
          v-model="jsonDraft"
          class="min-h-64 flex-1 font-mono text-xs"
        />
        <p v-if="jsonError" class="text-xs text-destructive">
          {{ jsonError }}
        </p>
        <Button size="sm" class="h-8 w-full text-xs" @click="applyJsonDraft">
          Apply JSON Changes
        </Button>
      </TabsContent>
    </Tabs>
  </aside>
</template>
