<script setup lang="ts">
import type { AutomaPackage, PackageIO, WorkflowNode } from '@automa/types';
import { Crosshair, Plus, Trash2 } from '@lucide/vue';
import { Badge, Button, Input, Switch, Textarea } from '@tuquet/vue-ui';
import { computed } from 'vue';
import { getBlockMeta } from '../../../utils/block-registry.js';
import { generateCanvasId } from '../../../utils/canvas-helpers.js';

const props = defineProps<{
  pkg: AutomaPackage;
}>();

const emit = defineEmits<{
  (e: 'update:pkg', pkg: AutomaPackage): void;
  (e: 'focus-block', blockId: string): void;
}>();

const internalNodes = computed<WorkflowNode[]>(
  () => (props.pkg.data?.nodes as WorkflowNode[]) || [],
);

function updateMeta(patch: Partial<AutomaPackage>) {
  emit('update:pkg', {
    ...props.pkg,
    ...patch,
    updatedAt: Date.now(),
  });
}

function toggleAsBlock(val: boolean) {
  updateMeta({
    settings: {
      ...props.pkg.settings,
      asBlock: val,
    },
  });
}

function addIO(type: 'inputs' | 'outputs') {
  const firstNode = internalNodes.value[0];
  const blockId = firstNode?.id || '';
  const suffix = type === 'inputs' ? 'input-1' : 'output-1';
  const list: PackageIO[] = structuredClone(props.pkg[type] || []);
  list.push({
    id: generateCanvasId(type === 'inputs' ? 'in' : 'out'),
    name: `${type === 'inputs' ? 'Input' : 'Output'} ${list.length + 1}`,
    blockId,
    handleId: blockId ? `${blockId}-${suffix}` : '',
  });
  updateMeta({ [type]: list });
}

function removeIO(type: 'inputs' | 'outputs', index: number) {
  const list: PackageIO[] = structuredClone(props.pkg[type] || []);
  list.splice(index, 1);
  updateMeta({ [type]: list });
}

function updateIOField(
  type: 'inputs' | 'outputs',
  index: number,
  field: keyof PackageIO,
  value: string,
) {
  const list: PackageIO[] = structuredClone(props.pkg[type] || []);
  const item = list[index];
  if (!item) return;
  item[field] = value;
  if (field === 'blockId') {
    const suffix = type === 'inputs' ? 'input-1' : 'output-1';
    item.handleId = `${value}-${suffix}`;
  }
  updateMeta({ [type]: list });
}
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-6 p-6">
    <!-- General Metadata & asBlock Switch -->
    <div class="rounded-xl border border-border bg-card p-5 space-y-4">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 class="text-base font-semibold text-foreground">
            Package Configuration
          </h3>
          <p class="text-xs text-muted-foreground">
            Configure package metadata and how it mounts into workflows (.automa-pkg).
          </p>
        </div>
        <Badge variant="outline" class="font-mono text-xs">
          {{ props.pkg.id }}
        </Badge>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Package Name</label>
          <Input
            class="h-9 text-sm"
            :model-value="props.pkg.name"
            @update:model-value="updateMeta({ name: String($event) })"
          />
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Author</label>
          <Input
            class="h-9 text-sm"
            placeholder="Team or Author"
            :model-value="props.pkg.author || ''"
            @update:model-value="updateMeta({ author: String($event) })"
          />
        </div>
      </div>

      <div class="space-y-1.5">
        <label class="text-xs font-medium text-foreground">Short Description</label>
        <Textarea
          class="min-h-16 text-sm"
          :model-value="props.pkg.description"
          @update:model-value="updateMeta({ description: String($event) })"
        />
      </div>

      <div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3.5">
        <div class="space-y-0.5">
          <div class="text-sm font-medium text-foreground">
            Use as Atomic Block (settings.asBlock)
          </div>
          <div class="text-xs text-muted-foreground">
            When enabled, dragging this package into a workflow creates an encapsulated
            <code class="font-mono text-foreground">block-package</code> node with the Inputs and Outputs below.
            When disabled, internal blocks unpack directly onto the workflow canvas.
          </div>
        </div>
        <Switch
          :checked="props.pkg.settings?.asBlock !== false"
          @update:checked="toggleAsBlock"
        />
      </div>
    </div>

    <!-- Package Inputs & Outputs Grid (Official Automa PackageSettings.vue + PackageSettingIOSelect.vue) -->
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <!-- Inputs Card -->
      <div class="rounded-xl border border-border bg-card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-semibold text-foreground">
              Package Inputs ({{ props.pkg.inputs?.length || 0 }})
            </h4>
            <p class="text-xs text-muted-foreground">
              Entry handles exposed on the left side of the package block
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-8 gap-1 text-xs"
            @click="addIO('inputs')"
          >
            <Plus class="size-3.5" />
            Add Input
          </Button>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="(input, idx) in props.pkg.inputs"
            :key="input.id"
            class="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <Input
                class="h-8 text-xs font-medium"
                placeholder="Input Label"
                :model-value="input.name"
                @update:model-value="updateIOField('inputs', idx, 'name', String($event))"
              />
              <Button
                v-if="input.blockId"
                variant="ghost"
                size="sm"
                class="h-8 w-8 shrink-0 p-0"
                title="Jump to internal block on canvas"
                @click="emit('focus-block', input.blockId)"
              >
                <Crosshair class="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 shrink-0 p-0 text-destructive"
                @click="removeIO('inputs', idx)"
              >
                <Trash2 class="size-3.5" />
              </Button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <select
                class="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                :value="input.blockId"
                @change="
                  updateIOField(
                    'inputs',
                    idx,
                    'blockId',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option value="">Select Entry Block...</option>
                <option
                  v-for="node in internalNodes"
                  :key="node.id"
                  :value="node.id"
                >
                  {{ getBlockMeta(node.label).name }} ({{ node.id }})
                </option>
              </select>
              <Input
                class="h-8 font-mono text-xs"
                placeholder="handleId"
                :model-value="input.handleId"
                @update:model-value="
                  updateIOField('inputs', idx, 'handleId', String($event))
                "
              />
            </div>
          </div>

          <div
            v-if="!props.pkg.inputs?.length"
            class="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground"
          >
            Right-click any block input handle on the Editor canvas and choose
            <span class="font-medium text-foreground">"Set as package input"</span>.
          </div>
        </div>
      </div>

      <!-- Outputs Card -->
      <div class="rounded-xl border border-border bg-card p-5 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-semibold text-foreground">
              Package Outputs ({{ props.pkg.outputs?.length || 0 }})
            </h4>
            <p class="text-xs text-muted-foreground">
              Exit handles exposed on the right side of the package block
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-8 gap-1 text-xs"
            @click="addIO('outputs')"
          >
            <Plus class="size-3.5" />
            Add Output
          </Button>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="(output, idx) in props.pkg.outputs"
            :key="output.id"
            class="space-y-2 rounded-lg border border-border bg-muted/20 p-3"
          >
            <div class="flex items-center justify-between gap-2">
              <Input
                class="h-8 text-xs font-medium"
                placeholder="Output Label"
                :model-value="output.name"
                @update:model-value="updateIOField('outputs', idx, 'name', String($event))"
              />
              <Button
                v-if="output.blockId"
                variant="ghost"
                size="sm"
                class="h-8 w-8 shrink-0 p-0"
                title="Jump to internal block on canvas"
                @click="emit('focus-block', output.blockId)"
              >
                <Crosshair class="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-8 w-8 shrink-0 p-0 text-destructive"
                @click="removeIO('outputs', idx)"
              >
                <Trash2 class="size-3.5" />
              </Button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <select
                class="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                :value="output.blockId"
                @change="
                  updateIOField(
                    'outputs',
                    idx,
                    'blockId',
                    ($event.target as HTMLSelectElement).value,
                  )
                "
              >
                <option value="">Select Exit Block...</option>
                <option
                  v-for="node in internalNodes"
                  :key="node.id"
                  :value="node.id"
                >
                  {{ getBlockMeta(node.label).name }} ({{ node.id }})
                </option>
              </select>
              <Input
                class="h-8 font-mono text-xs"
                placeholder="handleId (e.g. node-output-1 or node-output-fallback)"
                :model-value="output.handleId"
                @update:model-value="
                  updateIOField('outputs', idx, 'handleId', String($event))
                "
              />
            </div>
          </div>

          <div
            v-if="!props.pkg.outputs?.length"
            class="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground"
          >
            Right-click any block output handle on the Editor canvas and choose
            <span class="font-medium text-foreground">"Set as package output"</span>.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
