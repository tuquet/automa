// Re-export Shadcn-Vue primitives
export * from './components/ui/index.js';
export { cn } from './lib/utils.js';

// Export the 2 Canonical Shadcn-Vue Canvas Screens (Workflow Canvas & Package Canvas)
export { default as AutomaWorkflowCanvas } from './components/canvas/AutomaWorkflowCanvas.vue';
export { default as AutomaPackageCanvas } from './components/canvas/AutomaPackageCanvas.vue';
export { default as WorkflowEditor } from './components/canvas/WorkflowEditor.vue';

// Export Custom Vue Flow Block Node Components
export { default as BlockBasic } from './components/canvas/blocks/BlockBasic.vue';
export { default as BlockBasicWithFallback } from './components/canvas/blocks/BlockBasicWithFallback.vue';
export { default as BlockConditions } from './components/canvas/blocks/BlockConditions.vue';
export { default as BlockDelay } from './components/canvas/blocks/BlockDelay.vue';
export { default as BlockElementExists } from './components/canvas/blocks/BlockElementExists.vue';
export { default as BlockGroup } from './components/canvas/blocks/BlockGroup.vue';
export { default as BlockLoopBreakpoint } from './components/canvas/blocks/BlockLoopBreakpoint.vue';
export { default as BlockNote } from './components/canvas/blocks/BlockNote.vue';
export { default as BlockPackage } from './components/canvas/blocks/BlockPackage.vue';
export { default as BlockRepeatTask } from './components/canvas/blocks/BlockRepeatTask.vue';

// Export Registry & Pure Graph/Package Utilities
export * from './utils/block-registry.js';
export * from './utils/canvas-helpers.js';
