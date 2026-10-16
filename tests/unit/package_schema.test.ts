import { describe, expect, it } from 'vitest';
import {
  definePackage,
  defineWorkflow,
  packageToBlockNode,
} from '../../packages/types/src/workflow.js';

describe('Official Automa Package Schema & Builders (@automa/types)', () => {
  it('creates an Official Automa compatible package and strips forbidden blocks (trigger, block-package, execute-workflow)', () => {
    const pkg = definePackage({
      id: 'pkg_login_turnstile',
      name: 'Login & Solve Turnstile',
      description: 'Reusable atomic login package',
      inputs: [
        {
          id: 'in_start',
          name: 'Start Login',
          blockId: 'node_open',
          handleId: 'node_open-input-1',
        },
      ],
      outputs: [
        {
          id: 'out_ok',
          name: 'Success',
          blockId: 'node_check',
          handleId: 'node_check-output-1',
        },
        {
          id: 'out_fail',
          name: 'Fallback',
          blockId: 'node_check',
          handleId: 'node_check-output-fallback',
        },
      ],
      nodes: [
        {
          id: 'node_forbidden_trigger',
          label: 'trigger',
          data: { type: 'manual' },
        },
        {
          id: 'node_open',
          label: 'new-tab',
          data: { url: 'https://example.com/login' },
        },
        {
          id: 'node_check',
          label: 'element-exists',
          data: { selector: '#dashboard', tryCount: 2 },
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'node_open',
          target: 'node_check',
          sourceHandle: 'node_open-output-1',
          targetHandle: 'node_check-input-1',
        },
      ],
    });

    expect(pkg.id).toBe('pkg_login_turnstile');
    expect(pkg.icon).toBe('mdiPackageVariantClosed');
    expect(pkg.settings.asBlock).toBe(true);
    expect(pkg.data.nodes).toHaveLength(2);
    expect(
      pkg.data.nodes.some((n) => n.label === 'trigger'),
    ).toBe(false);
    expect(pkg.inputs).toHaveLength(1);
    expect(pkg.outputs).toHaveLength(2);
  });

  it('converts an AutomaPackage into an encapsulated BlockPackageNode inside a workflow', () => {
    const pkg = definePackage({
      id: 'pkg_auth',
      name: 'Auth Block',
      nodes: [
        {
          id: 'n1',
          label: 'forms',
          data: { selector: '#email', value: 'user@example.com' },
        },
      ],
      inputs: [
        {
          id: 'in_1',
          name: 'Entry',
          blockId: 'n1',
          handleId: 'n1-input-1',
        },
      ],
      outputs: [
        {
          id: 'out_1',
          name: 'Done',
          blockId: 'n1',
          handleId: 'n1-output-1',
        },
      ],
    });

    const pkgNode = packageToBlockNode(pkg, {
      id: 'pkg_node_1',
      position: { x: 300, y: 180 },
    });

    const wf = defineWorkflow({
      name: 'Main Workflow using Package',
      nodes: [
        {
          id: 'trig_1',
          label: 'trigger',
          data: { type: 'manual' },
        },
        pkgNode,
      ],
      edges: [
        {
          id: 'e_trig_pkg',
          source: 'trig_1',
          target: 'pkg_node_1',
          sourceHandle: 'trig_1-output-1',
          targetHandle: 'pkg_node_1-input-in_1',
        },
      ],
    });

    expect(pkgNode.label).toBe('block-package');
    expect(pkgNode.type).toBe('BlockPackage');
    expect(pkgNode.data.packageId).toBe('pkg_auth');
    expect(pkgNode.data.inputs?.[0]?.id).toBe('in_1');
    expect(pkgNode.data.outputs?.[0]?.id).toBe('out_1');
    expect(wf.drawflow?.nodes).toHaveLength(2);
  });
});
