import { describe, it, expect } from 'vitest';
import { sanitizeWorkflowAST } from '../../src/studio/composables/useStudioWorkflow';

describe('sanitizeWorkflowAST', () => {
  it('returns default workflow when input is null or non-object', () => {
    const resultNull = sanitizeWorkflowAST(null);
    expect(resultNull.name).toBe('new-workflow');
    expect(resultNull.drawflow.nodes.length).toBe(1);

    const resultUndefined = sanitizeWorkflowAST(undefined);
    expect(resultUndefined.drawflow.nodes[0].id).toBe('trigger');
  });

  it('preserves valid upstream short 4-character node IDs (nanoid(4)) and IDs starting with n', () => {
    const raw = {
      name: 'Auto Late Request CMC',
      drawflow: {
        nodes: [
          { label: 'trigger', id: 'oc0r' },
          { label: 'active-tab', id: 'd848' },
          { label: 'new-tab', id: 'n123' },
          { label: 'javascript', id: 'r2q4hil' },
        ],
        edges: [
          {
            source: 'oc0r',
            target: 'd848',
            sourceHandle: 'oc0r-output-1',
            targetHandle: 'd848-input-1',
            id: 'vueflow__edge-oc0roc0r-output-1-d848d848-input-1',
          },
          {
            source: 'd848',
            target: 'n123',
            sourceHandle: 'd848-output-1',
            targetHandle: 'n123-input-1',
            id: 'vueflow__edge-d848d848-output-1-n123n123-input-1',
          },
          {
            source: 'n123',
            target: 'r2q4hil',
            sourceHandle: 'n123-output-1',
            targetHandle: 'r2q4hil-input-1',
            id: 'vueflow__edge-n123n123-output-1-r2q4hilr2q4hil-input-1',
          },
        ],
      },
    };

    const sanitized = sanitizeWorkflowAST(raw);

    // Verify 4-character IDs and n-prefixed IDs are strictly PRESERVED without mutation
    expect(sanitized.drawflow.nodes[0].id).toBe('oc0r');
    expect(sanitized.drawflow.nodes[1].id).toBe('d848');
    expect(sanitized.drawflow.nodes[2].id).toBe('n123');
    expect(sanitized.drawflow.nodes[3].id).toBe('r2q4hil');

    // Verify edges and handles remain 100% synchronized with node IDs
    expect(sanitized.drawflow.edges[0].source).toBe('oc0r');
    expect(sanitized.drawflow.edges[0].target).toBe('d848');
    expect(sanitized.drawflow.edges[0].sourceHandle).toBe('oc0r-output-1');
    expect(sanitized.drawflow.edges[0].targetHandle).toBe('d848-input-1');

    expect(sanitized.drawflow.edges[1].source).toBe('d848');
    expect(sanitized.drawflow.edges[1].target).toBe('n123');
    expect(sanitized.drawflow.edges[1].sourceHandle).toBe('d848-output-1');
    expect(sanitized.drawflow.edges[1].targetHandle).toBe('n123-input-1');

    expect(sanitized.drawflow.edges[2].source).toBe('n123');
    expect(sanitized.drawflow.edges[2].target).toBe('r2q4hil');
    expect(sanitized.drawflow.edges[2].sourceHandle).toBe('n123-output-1');
    expect(sanitized.drawflow.edges[2].targetHandle).toBe('r2q4hil-input-1');
  });

  it('converts missing/empty node IDs to valid nanoids and synchronizes edge handles', () => {
    const raw = {
      name: 'Workflow with Missing IDs',
      drawflow: {
        nodes: [
          { label: 'trigger', id: '' },
          { label: 'click-element', id: null },
          { label: 'javascript', id: 'valid_id' },
        ],
        edges: [
          {
            source: '',
            target: null,
            sourceHandle: '-output-1',
            targetHandle: 'null-input-1',
            id: 'edge-1',
          },
          {
            source: null,
            target: 'valid_id',
            sourceHandle: 'null-output-1',
            targetHandle: 'valid_id-input-1',
            id: 'edge-2',
          },
        ],
      },
    };

    const sanitized = sanitizeWorkflowAST(raw);
    expect(sanitized.drawflow.nodes[0].id).toBe('trigger');
    const newClickId = sanitized.drawflow.nodes[1].id;
    expect(newClickId).toBeTruthy();
    expect(typeof newClickId).toBe('string');
    expect(sanitized.drawflow.nodes[2].id).toBe('valid_id');

    // Verify edges and handles are updated to match new IDs
    expect(sanitized.drawflow.edges[0].source).toBe('trigger');
    expect(sanitized.drawflow.edges[0].target).toBe(newClickId);
    expect(sanitized.drawflow.edges[1].source).toBe(newClickId);
    expect(sanitized.drawflow.edges[1].target).toBe('valid_id');
  });

  it('filters out dangling edges pointing to non-existent nodes', () => {
    const raw = {
      drawflow: {
        nodes: [{ id: 'trigger', label: 'trigger' }],
        edges: [
          { source: 'trigger', target: 'ghost_node_404' },
          { source: 'missing_source_node', target: 'trigger' },
        ],
      },
    };

    const sanitized = sanitizeWorkflowAST(raw);
    expect(sanitized.drawflow.edges.length).toBe(0);
  });

  it('unwraps nested workflow data when provided inside VS Code preview payload wrapper', () => {
    const wrappedPayload = {
      data: {
        name: 'Wrapped Flow',
        drawflow: {
          nodes: [{ id: 'trigger', label: 'trigger' }],
          edges: [],
        },
      },
      triggerParams: [],
      isPackage: false,
      daemonPort: 8765,
    };

    const sanitized = sanitizeWorkflowAST(wrappedPayload);
    expect(sanitized.name).toBe('Wrapped Flow');
    expect(sanitized.drawflow.nodes.length).toBe(1);
    expect(sanitized.drawflow.nodes[0].id).toBe('trigger');
  });
});

