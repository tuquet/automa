import { describe, it, expect } from 'vitest';
import convertWorkflowData from '../src/utils/convertWorkflowData.js';
import mustacheReplacer from '../src/templating/mustacheReplacer.js';

describe('@automa/engine: convertWorkflowData & Primitives', () => {
  describe('convertWorkflowData format normalization', () => {
    it('returns empty/null input safely without throwing', () => {
      expect(convertWorkflowData(null)).toBeNull();
      expect(convertWorkflowData(undefined)).toBeUndefined();
      expect(convertWorkflowData('invalid')).toBe('invalid');
      
      const emptyObj = {};
      const converted = convertWorkflowData(emptyObj);
      expect(converted.drawflow).toBeDefined();
      expect(Array.isArray(converted.drawflow.nodes)).toBe(true);
      expect(Array.isArray(converted.drawflow.edges)).toBe(true);
    });

    it('Format 1: Flat root nodes & edges without drawflow wrapper', () => {
      const input = {
        name: 'Flat Test',
        nodes: [
          { id: 'node-1', label: 'trigger', type: 'BlockBasic' },
          { id: 'node-2', label: 'log-data', type: 'BlockBasic' }
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2' }
        ]
      };

      const result = convertWorkflowData(input);
      expect(result.drawflow).toBeDefined();
      expect(result.drawflow.nodes).toEqual(input.nodes);
      expect(result.drawflow.edges).toEqual(input.edges);
      expect(result.drawflow.x).toBe(0);
      expect(result.drawflow.y).toBe(0);
      expect(result.drawflow.zoom).toBe(0);
    });

    it('Format 2: Stringified modern Vue Flow in workflow.drawflow', () => {
      const flowData = {
        nodes: [
          { id: 'trigger-1', label: 'trigger', position: { x: 50, y: 50 } },
          { id: 'tab-1', label: 'new-tab', position: { x: 200, y: 50 } }
        ],
        edges: [
          { id: 'e-trig-tab', source: 'trigger-1', target: 'tab-1' }
        ],
        x: 10,
        y: 20,
        zoom: 1.5
      };

      const input = {
        name: 'Stringified Vue Flow',
        drawflow: JSON.stringify(flowData)
      };

      const result = convertWorkflowData(input);
      expect(typeof result.drawflow).toBe('object');
      expect(result.drawflow.nodes.length).toBe(2);
      expect(result.drawflow.edges.length).toBe(1);
      expect(result.drawflow.x).toBe(10);
      expect(result.drawflow.y).toBe(20);
      expect(result.drawflow.zoom).toBe(1.5);
    });

    it('Format 3: Legacy Drawflow v1 (Home.data format) with trigger traversal', () => {
      const legacyWorkflow = {
        name: 'Legacy Automa v1 Flow',
        drawflow: {
          Home: {
            data: {
              '1': {
                id: '1',
                name: 'trigger',
                html: 'BlockBasic',
                pos_x: 100,
                pos_y: 150,
                data: { type: 'manual' },
                outputs: {
                  output_1: {
                    connections: [{ node: '2', output: 'input_1' }]
                  }
                }
              },
              '2': {
                id: '2',
                name: 'new-tab',
                html: 'BlockBasic',
                pos_x: 350,
                pos_y: 150,
                data: { url: 'https://example.com' },
                outputs: {
                  output_1: {
                    connections: [{ node: '3', output: 'input_1' }]
                  }
                }
              },
              '3': {
                id: '3',
                name: 'take-screenshot',
                html: 'BlockBasic',
                pos_x: 600,
                pos_y: 150,
                data: {},
                outputs: {}
              }
            }
          }
        }
      };

      const result = convertWorkflowData(legacyWorkflow);
      expect(result.drawflow).toBeDefined();
      expect(result.drawflow.nodes.length).toBe(3);
      expect(result.drawflow.edges.length).toBe(2);

      // Verify node attributes
      const triggerNode = result.drawflow.nodes.find(n => n.id === '1');
      expect(triggerNode).toBeDefined();
      expect(triggerNode.label).toBe('trigger');
      expect(triggerNode.type).toBe('BlockBasic');
      expect(triggerNode.position).toEqual({ x: 100, y: 150 });
      expect(triggerNode.data).toEqual({ type: 'manual' });

      // Verify edge attributes
      const firstEdge = result.drawflow.edges.find(e => e.source === '1');
      expect(firstEdge).toBeDefined();
      expect(firstEdge.target).toBe('2');
      expect(firstEdge.sourceHandle).toBe('1-output-1');
      expect(firstEdge.targetHandle).toBe('2-input-1');
    });

    it('Format 3b: Legacy Drawflow conditions and fallback branch mappings', () => {
      const conditionsWorkflow = {
        name: 'Legacy Conditions Flow',
        drawflow: {
          Home: {
            data: {
              '1': {
                id: '1',
                name: 'trigger',
                html: 'BlockBasic',
                outputs: {
                  output_1: { connections: [{ node: '2', output: 'input_1' }] }
                }
              },
              '2': {
                id: '2',
                name: 'conditions',
                html: 'BlockBasic',
                data: {
                  conditions: [
                    { id: 'cond-match-1', compareValue: 'foo' }
                  ]
                },
                outputs: {
                  output_1: { connections: [{ node: '3', output: 'input_1' }] },
                  output_2: { connections: [{ node: '4', output: 'input_1' }] }
                }
              },
              '3': { id: '3', name: 'log-match', html: 'BlockBasic', outputs: {} },
              '4': { id: '4', name: 'log-fallback', html: 'BlockBasic', outputs: {} }
            }
          }
        }
      };

      const result = convertWorkflowData(conditionsWorkflow);
      expect(result.drawflow.nodes.length).toBe(4);
      expect(result.drawflow.edges.length).toBe(3);

      const matchEdge = result.drawflow.edges.find(e => e.target === '3');
      expect(matchEdge.sourceHandle).toBe('2-output-cond-match-1');

      const fallbackEdge = result.drawflow.edges.find(e => e.target === '4');
      expect(fallbackEdge.sourceHandle).toBe('2-output-fallback');
    });

    it('Protects against cycles and infinite loops in legacy graphs', () => {
      const cyclicalWorkflow = {
        name: 'Cyclic Loop Flow',
        drawflow: {
          Home: {
            data: {
              '1': {
                id: '1',
                name: 'trigger',
                html: 'BlockBasic',
                outputs: {
                  output_1: { connections: [{ node: '2', output: 'input_1' }] }
                }
              },
              '2': {
                id: '2',
                name: 'step-a',
                html: 'BlockBasic',
                outputs: {
                  output_1: { connections: [{ node: '3', output: 'input_1' }] }
                }
              },
              '3': {
                id: '3',
                name: 'step-b',
                html: 'BlockBasic',
                outputs: {
                  output_1: { connections: [{ node: '2', output: 'input_1' }] } // cycle back to 2
                }
              }
            }
          }
        }
      };

      // Traversal terminates without stack overflow
      const result = convertWorkflowData(cyclicalWorkflow);
      expect(result.drawflow.nodes.length).toBe(3);
      expect(result.drawflow.edges.length).toBe(3);
    });

    it('Handles legacy workflow with no trigger block safely', () => {
      const noTriggerWorkflow = {
        name: 'Orphaned Flow',
        drawflow: {
          Home: {
            data: {
              '1': { id: '1', name: 'random-node', outputs: {} }
            }
          }
        }
      };

      const result = convertWorkflowData(noTriggerWorkflow);
      expect(result.drawflow).toEqual({ nodes: [], edges: [], x: 0, y: 0, zoom: 0 });
    });
  });

  describe('mustacheReplacer templating engine', () => {
    it('interpolates basic variable references {{variables.key}}', () => {
      const template = 'Hello {{variables.name}}, welcome to {{variables.platform}}!';
      const data = {
        variables: {
          name: 'Tuquet',
          platform: 'Automa'
        }
      };

      const res = mustacheReplacer(template, data);
      expect(res.value).toBe('Hello Tuquet, welcome to Automa!');
    });

    it('interpolates nested table cell references {{table.col}}', () => {
      const template = 'Row email: {{table.email}}';
      const data = {
        table: [
          { email: 'bot@tuquet.dev' }
        ]
      };

      const res = mustacheReplacer(template, data);
      expect(res.value).toBe('Row email: bot@tuquet.dev');
    });

    it('preserves non-existent variable placeholders as raw match', () => {
      const template = 'Value: {{variables.missing_val}}';
      const data = { variables: {} };

      const res = mustacheReplacer(template, data);
      expect(res.value).toBe('Value: {{variables.missing_val}}');
    });
  });
});
