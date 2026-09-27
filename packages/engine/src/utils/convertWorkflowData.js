import { parseJSON, findTriggerBlock } from './helper';

const getFlowData = (workflow) => {
  if (!workflow) return {};
  if (typeof workflow.drawflow === 'string') {
    return parseJSON(workflow.drawflow, {});
  }
  return workflow.drawflow || {};
};

export default function convertWorkflowData(workflow) {
  if (!workflow || typeof workflow !== 'object') return workflow;

  // Case 1: Flat root nodes & edges (no drawflow wrapper)
  if (Array.isArray(workflow.nodes) && !workflow.drawflow) {
    workflow.drawflow = {
      nodes: workflow.nodes,
      edges: Array.isArray(workflow.edges) ? workflow.edges : [],
      x: 0,
      y: 0,
      zoom: 0,
    };
    return workflow;
  }

  // Parse stringified drawflow if string
  let flowData = getFlowData(workflow);

  // If parsed flowData has nodes array (Modern Vue Flow stringified)
  if (Array.isArray(flowData?.nodes)) {
    workflow.drawflow = {
      nodes: flowData.nodes,
      edges: Array.isArray(flowData.edges) ? flowData.edges : [],
      x: flowData.x || 0,
      y: flowData.y || 0,
      zoom: flowData.zoom || 0,
    };
    return workflow;
  }

  // Check if it's Legacy Drawflow v1 (Home.data)
  // Format could be flowData.drawflow.Home.data or flowData.Home.data
  const legacyBlocks = flowData?.drawflow?.Home?.data || flowData?.Home?.data;

  if (legacyBlocks) {
    const triggerBlock = findTriggerBlock(flowData);
    const startTriggerId = triggerBlock
      ? triggerBlock.id
      : Object.values(legacyBlocks).find((b) => b.name === 'trigger')?.id;

    if (!startTriggerId) {
      workflow.drawflow = { nodes: [], edges: [], x: 0, y: 0, zoom: 0 };
      return workflow;
    }

    const tracedBlocks = new Set();
    const nodes = [];
    const edges = [];

    function extractBlock(blockId) {
      if (tracedBlocks.has(blockId)) return;
      const block = legacyBlocks[blockId];
      if (!block) return;

      nodes.push({
        id: block.id,
        type: block.html || 'BlockBasic',
        label: block.name,
        position: {
          x: block.pos_x || 0,
          y: block.pos_y || 0,
        },
        data: block.data || {},
      });

      const nextBlockIds = [];
      const outputs = Object.values(block.outputs || {});

      outputs.forEach(({ connections }, outputIndex) => {
        let outputName = outputIndex + 1;
        const isLastIndex = outputs.length - 1 === outputIndex;
        const isConditionsBlock = block.name === 'conditions';
        const isFallbackBlock = block.html === 'BlockBasicWithFallback';
        const isBlockFallback = block.html === 'BlockBasic' && outputName >= 2;
        if (
          (isConditionsBlock || isFallbackBlock || isBlockFallback) &&
          isLastIndex
        ) {
          outputName = 'fallback';
        }
        if (
          isConditionsBlock &&
          !isLastIndex &&
          block.data?.conditions?.[outputIndex]
        ) {
          outputName = block.data.conditions[outputIndex].id;
        }

        (connections || []).forEach(({ node: outputId, output }) => {
          const sourceHandle = `${block.id}-output-${outputName}`;
          const targetHandle = `${outputId}-${(output || 'input-1').replace('_', '-')}`;

          edges.push({
            sourceHandle,
            targetHandle,
            source: block.id,
            target: outputId,
            updatable: true,
            selectable: true,
            id: `vueflow__edge-${sourceHandle}-${targetHandle}`,
            class: `source-${sourceHandle} target-${targetHandle}`,
          });

          nextBlockIds.push(outputId);
        });
      });

      tracedBlocks.add(blockId);
      nextBlockIds.forEach((id) => extractBlock(id));
    }

    extractBlock(startTriggerId);
    workflow.drawflow = { edges, nodes, x: 0, y: 0, zoom: 0 };
    return workflow;
  }

  // If drawflow is already an object, ensure nodes and edges arrays exist
  if (typeof workflow.drawflow === 'object' && workflow.drawflow !== null) {
    if (!Array.isArray(workflow.drawflow.nodes)) {
      workflow.drawflow.nodes = Array.isArray(workflow.nodes)
        ? workflow.nodes
        : [];
    }
    if (!Array.isArray(workflow.drawflow.edges)) {
      workflow.drawflow.edges = Array.isArray(workflow.edges)
        ? workflow.edges
        : [];
    }
  } else {
    workflow.drawflow = {
      nodes: Array.isArray(workflow.nodes) ? workflow.nodes : [],
      edges: Array.isArray(workflow.edges) ? workflow.edges : [],
      x: 0,
      y: 0,
      zoom: 0,
    };
  }

  return workflow;
}
