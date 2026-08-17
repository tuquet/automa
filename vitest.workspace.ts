import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'automa-vscode',
  'automa-cli',
  'automa-ext',
  'packages/core',
  'packages/automa-sdk',
  'packages/automa-hub',
  'packages/workflow-runner'
]);
