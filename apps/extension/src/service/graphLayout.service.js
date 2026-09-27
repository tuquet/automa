import dagre from 'dagre';

export class GraphLayoutService {
  static computeDagreLayout(nodes = [], edges = [], options = {}) {
    const rankdir = options.rankdir || options.direction || 'LR';
    const ranksep = options.ranksep ?? options.rankSpacing ?? 80;
    const nodesep = options.nodesep ?? options.nodeSpacing ?? 40;
    const ranker = options.ranker || 'tight-tree';
    const defaultWidth = options.defaultWidth || 180;
    const defaultHeight = options.defaultHeight || 80;

    const graph = new dagre.graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    graph.setGraph({
      rankdir,
      ranksep,
      nodesep,
      ranker,
    });
    graph.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      if (!node || !node.id) return;
      if (node.label === 'blocks-group-2' || node.parentNode) return;
      const width = node.dimensions?.width || defaultWidth;
      const height = node.dimensions?.height || defaultHeight;
      graph.setNode(node.id, {
        label: node.label || node.id,
        width,
        height,
      });
    });

    edges.forEach((edge) => {
      if (
        edge?.source &&
        edge?.target &&
        graph.hasNode(edge.source) &&
        graph.hasNode(edge.target)
      ) {
        graph.setEdge(edge.source, edge.target, {}, edge.id || undefined);
      }
    });

    dagre.layout(graph);

    return nodes
      .map((node) => {
        if (!node || !node.id) return null;
        if (node.label === 'blocks-group-2' || node.parentNode) return null;
        const nodeWithPosition = graph.node(node.id);
        if (!nodeWithPosition) return null;

        const width = node.dimensions?.width || defaultWidth;
        const height = node.dimensions?.height || defaultHeight;

        return {
          id: node.id,
          type: 'position',
          dragging: false,
          position: {
            x: Math.round(nodeWithPosition.x - width / 2),
            y: Math.round(nodeWithPosition.y - height / 2),
          },
        };
      })
      .filter(Boolean);
  }

  static layoutWorkflow(nodes = [], edges = [], options = {}) {
    const nodeChanges = this.computeDagreLayout(nodes, edges, options);
    const positionMap = new Map(
      nodeChanges.map((change) => [change.id, change.position])
    );

    const updatedNodes = nodes.map((node) => {
      const newPos = positionMap.get(node.id);
      if (!newPos) return node;
      return {
        ...node,
        position: { ...newPos },
      };
    });

    return {
      nodes: updatedNodes,
      edges,
      nodeChanges,
    };
  }
}
