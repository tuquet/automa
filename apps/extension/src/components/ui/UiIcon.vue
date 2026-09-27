<template>
  <!-- Direct image URL (e.g. SVG or hosted block icon) -->
  <img
    v-if="isUrl"
    :src="name"
    :alt="title || 'icon'"
    :class="[
      'inline-block object-contain select-none pointer-events-none',
      props.class,
    ]"
    :style="iconStyle"
  />

  <!-- Lucide Icon Component -->
  <component
    :is="iconComponent"
    v-else-if="iconComponent"
    :size="numericSize"
    :stroke-width="strokeWidth"
    :class="['shrink-0 inline-block', props.class]"
    :style="rotateStyle"
  >
    <title v-if="title">{{ title }}</title>
  </component>

  <!-- Fallback if icon not found -->
  <span
    v-else
    :class="['inline-block shrink-0', props.class]"
    :style="iconStyle"
  />
</template>

<script setup>
import { computed } from 'vue';
import * as LucideIcons from 'lucide-vue-next';
import { resolveLucideIconName } from '@/utils/iconMap';

defineOptions({ name: 'UiIcon' });

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: {
    type: [Number, String],
    default: 16,
  },
  strokeWidth: {
    type: [Number, String],
    default: 2,
  },
  rotate: {
    type: [Number, String],
    default: 0,
  },
  title: {
    type: String,
    default: '',
  },
  class: {
    type: [String, Array, Object],
    default: '',
  },
});

const isUrl = computed(() => {
  if (!props.name) return false;
  return (
    props.name.startsWith('http://') ||
    props.name.startsWith('https://') ||
    props.name.startsWith('data:') ||
    props.name.endsWith('.svg') ||
    props.name.includes('/')
  );
});

const numericSize = computed(() => {
  if (typeof props.size === 'number') return props.size;
  const parsed = parseInt(props.size, 10);
  return Number.isNaN(parsed) ? 16 : parsed;
});

const iconStyle = computed(() => ({
  width: `${numericSize.value}px`,
  height: `${numericSize.value}px`,
  transform: props.rotate ? `rotate(${props.rotate}deg)` : undefined,
}));

const rotateStyle = computed(() =>
  props.rotate ? { transform: `rotate(${props.rotate}deg)` } : undefined
);

const iconComponent = computed(() => {
  if (isUrl.value || !props.name) return null;

  const resolved = resolveLucideIconName(props.name);
  if (LucideIcons[resolved]) return LucideIcons[resolved];

  // Try appending Icon (Lucide exports both Zap and ZapIcon)
  if (LucideIcons[`${resolved}Icon`]) return LucideIcons[`${resolved}Icon`];

  // Fallback to HelpCircle if unknown
  return LucideIcons.HelpCircle || null;
});
</script>
