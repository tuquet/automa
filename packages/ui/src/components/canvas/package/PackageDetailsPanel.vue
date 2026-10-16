<script setup lang="ts">
import type { AutomaPackage } from '@automa/types';
import { Button, Textarea } from '@tuquet/vue-ui';
import { ref, watch } from 'vue';

const props = defineProps<{
  pkg: AutomaPackage;
}>();

const emit = defineEmits<{
  (e: 'update:pkg', pkg: AutomaPackage): void;
}>();

const jsonText = ref('');
const jsonErr = ref('');

watch(
  () => props.pkg,
  (val) => {
    jsonText.value = JSON.stringify(val, null, 2);
    jsonErr.value = '';
  },
  { immediate: true, deep: true },
);

function updateContent(val: string | number) {
  emit('update:pkg', {
    ...props.pkg,
    content: String(val),
    updatedAt: Date.now(),
  });
}

function applyFullJson() {
  try {
    const parsed = JSON.parse(jsonText.value) as AutomaPackage;
    jsonErr.value = '';
    emit('update:pkg', {
      ...parsed,
      updatedAt: Date.now(),
    });
  } catch (err) {
    jsonErr.value = err instanceof Error ? err.message : 'Invalid JSON';
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 md:grid-cols-2">
    <!-- Documentation / README -->
    <div class="rounded-xl border border-border bg-card p-5 space-y-3">
      <div>
        <h3 class="text-base font-semibold text-foreground">
          Package Documentation
        </h3>
        <p class="text-xs text-muted-foreground">
          Markdown / HTML notes describing inputs, outputs, and required variables.
        </p>
      </div>
      <Textarea
        class="min-h-80 text-sm"
        placeholder="# Package Usage Guide..."
        :model-value="props.pkg.content || ''"
        @update:model-value="updateContent"
      />
    </div>

    <!-- Full Official .automa-pkg JSON Inspector -->
    <div class="rounded-xl border border-border bg-card p-5 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-base font-semibold text-foreground">
            Official .automa-pkg JSON
          </h3>
          <p class="text-xs text-muted-foreground">
            100% compatible with AutomaApp/automa and AI Agent definePackage().
          </p>
        </div>
        <Button size="sm" class="h-8 text-xs" @click="applyFullJson">
          Apply JSON
        </Button>
      </div>

      <Textarea
        v-model="jsonText"
        class="min-h-80 font-mono text-xs"
      />
      <p v-if="jsonErr" class="text-xs text-destructive">
        {{ jsonErr }}
      </p>
    </div>
  </div>
</template>
