<template>
  <WorkflowEditor v-bind="$attrs">
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </WorkflowEditor>
</template>

<script setup>
import WorkflowEditor from '@/components/workflow/WorkflowEditor.vue';

defineOptions({
  name: 'WorkflowEditorProxy',
  inheritAttrs: false,
});
</script>
