<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id: string;
    nodeId: string;
    type: 'source' | 'target';
    position?: 'left' | 'right';
    variant?: 'default' | 'fallback' | 'io';
    title?: string;
  }>(),
  {
    position: 'right',
    variant: 'default',
    title: '',
  },
);

const emit = defineEmits<{
  (
    e: 'start-connect',
    payload: { nodeId: string; handleId: string; type: 'source' | 'target' },
  ): void;
  (
    e: 'end-connect',
    payload: { nodeId: string; handleId: string; type: 'source' | 'target' },
  ): void;
  (
    e: 'handle-contextmenu',
    payload: {
      event: MouseEvent;
      nodeId: string;
      handleId: string;
      type: 'source' | 'target';
    },
  ): void;
}>();

function onMouseDown(event: MouseEvent) {
  if (event.button !== 0) return;
  event.stopPropagation();
  emit('start-connect', {
    nodeId: props.nodeId,
    handleId: props.id,
    type: props.type,
  });
}

function onMouseUp(event: MouseEvent) {
  event.stopPropagation();
  emit('end-connect', {
    nodeId: props.nodeId,
    handleId: props.id,
    type: props.type,
  });
}

function onContextMenu(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
  emit('handle-contextmenu', {
    event,
    nodeId: props.nodeId,
    handleId: props.id,
    type: props.type,
  });
}
</script>

<template>
  <button
    type="button"
    :data-handleid="props.id"
    :data-nodeid="props.nodeId"
    :data-handletype="props.type"
    :title="props.title || props.id"
    class="vue-flow__handle group/handle relative inline-flex size-3.5 shrink-0 cursor-crosshair items-center justify-center rounded-full border-2 transition-transform hover:scale-125 focus:outline-none"
    :class="[
      props.type === 'target' ? 'target -ml-2' : 'source -mr-2',
      props.variant === 'fallback'
        ? 'border-destructive bg-destructive/20 hover:bg-destructive'
        : props.variant === 'io'
          ? 'border-primary bg-primary/20 hover:bg-primary'
          : 'border-primary bg-background hover:bg-primary',
    ]"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @contextmenu="onContextMenu"
  >
    <span class="sr-only">{{ props.title || props.id }}</span>
  </button>
</template>
