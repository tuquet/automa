import { ref, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { customAlphabet } from 'nanoid';
import cloneDeep from 'lodash.clonedeep';
import DroppedNode from '@/utils/editor/DroppedNode';
import EditorCommands from '@/utils/editor/EditorCommands';
import { GraphLayoutService } from '@/service/graphLayout.service';
import { useStudioStore } from '../stores/useStudioStore';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

export function useStudioCanvas({ commandManager, setAnimateBlocks }) {
  const toast = useToast();
  const store = useStudioStore();
  const editorRef = ref(null);
  const editorInstance = ref(null);
  const autoFocusEnabled = ref(true);
  let editorCommands = null;

  function onEditorInit(editor) {
    editorInstance.value = editor;
    const initialNodes = {};
    (store.currentWorkflow?.drawflow?.nodes || []).forEach((n) => {
      initialNodes[n.id] = n;
    });
    const initialEdges = {};
    (store.currentWorkflow?.drawflow?.edges || []).forEach((e) => {
      initialEdges[e.id] = e;
    });
    editorCommands = new EditorCommands(editor, {
      nodes: initialNodes,
      edges: initialEdges,
    });
  }

  async function autoAlign() {
    const editor =
      editorInstance.value || editorRef.value?.editor || editorRef.value;
    if (!editor) return;

    try {
      setAnimateBlocks?.(true);

      const rawNodes =
        editor?.getNodes?.value ||
        (typeof editor?.getNodes === 'function' ? editor.getNodes() : null) ||
        store.currentWorkflow?.drawflow?.nodes ||
        [];
      const rawEdges =
        editor?.getEdges?.value ||
        (typeof editor?.getEdges === 'function' ? editor.getEdges() : null) ||
        store.currentWorkflow?.drawflow?.edges ||
        [];

      if (!rawNodes.length) {
        setAnimateBlocks?.(false);
        return;
      }

      const nodeChanges = GraphLayoutService.computeDagreLayout(
        rawNodes,
        rawEdges,
        {
          rankdir: 'LR',
          ranksep: 100,
          nodesep: 50,
        }
      );

      if (!nodeChanges || !nodeChanges.length) {
        setAnimateBlocks?.(false);
        return;
      }

      // 1. Apply node coordinate changes to VueFlow
      if (editor.applyNodeChanges) {
        editor.applyNodeChanges(nodeChanges);
      }

      // 2. Keep editorCommands state in sync
      if (editorCommands?.state?.nodes) {
        nodeChanges.forEach((change) => {
          if (editorCommands.state.nodes[change.id]) {
            editorCommands.state.nodes[change.id].position = {
              ...change.position,
            };
          }
        });
      }

      // 3. Update store.currentWorkflow nodes coordinates
      if (store.currentWorkflow?.drawflow?.nodes) {
        nodeChanges.forEach((change) => {
          const node = store.currentWorkflow.drawflow.nodes.find(
            (n) => n.id === change.id
          );
          if (node) {
            node.position = { ...change.position };
          }
        });
        store.markDirty();
      }

      await nextTick();
      if (editor.fitView) {
        editor.fitView({ padding: 0.2, duration: 400 });
      }

      setTimeout(() => {
        setAnimateBlocks?.(false);
      }, 500);
    } catch (err) {
      setAnimateBlocks?.(false);
      console.error('[StudioCanvas] Auto-align error:', err);
      toast.error('Auto-align failed');
    }
  }

  function onUpdateNode({ id, data }) {
    store.updateNodeData(id, data);
  }

  function onDeleteNode(id) {
    store.deleteNode(id);
  }

  function onDragoverEditor(event) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function onDropInEditor(event) {
    event.preventDefault();
    if (!editorInstance.value || !event.dataTransfer) return;

    try {
      const rawBlock =
        event.dataTransfer.getData('block') ||
        event.dataTransfer.getData('block-type');
      if (!rawBlock) return;

      let block;
      try {
        block = JSON.parse(rawBlock);
      } catch (_) {
        block = { id: rawBlock, component: 'BlockBasic', data: {} };
      }

      if (!block || block.fromBlockBasic) return;

      const { target } = event;
      const nodeEl = DroppedNode.isNode(target);
      if (nodeEl) {
        DroppedNode.replaceNode(editorInstance.value, {
          block,
          target: nodeEl,
        });
        store.markDirty();
        return;
      }

      const position = editorInstance.value.screenToFlowCoordinate({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeId = nanoid();
      const newNode = {
        position,
        label: block.id,
        data: cloneDeep(block.data || {}),
        type: block.component || 'BlockBasic',
        id: block.id === 'blocks-group-2' ? `group-${nodeId}` : nodeId,
      };

      if (editorInstance.value.addNodes) {
        editorInstance.value.addNodes([newNode]);
      }
      if (editorCommands && commandManager) {
        commandManager.add(editorCommands.nodeAdded([newNode]));
      }

      store.addNode(newNode);

      const edgeEl = DroppedNode.isEdge(target);
      const handleEl = DroppedNode.isHandle(target);

      if (handleEl) {
        DroppedNode.appendNode(editorInstance.value, {
          target: handleEl,
          nodeId: newNode.id,
        });
      } else if (edgeEl) {
        DroppedNode.insertBetweenNode(editorInstance.value, {
          target: edgeEl,
          nodeId: newNode.id,
          outputs: block.outputs,
        });
      }

      store.markDirty();
    } catch (_) {
      toast.error('Failed to place block on canvas');
    }
  }

  function goToBlock(blockId) {
    if (!editorInstance.value || !blockId) return;
    const node = store.getNode(blockId);
    if (node && editorInstance.value.setCenter) {
      editorInstance.value.setCenter(node.position.x, node.position.y, {
        zoom: 1.2,
        duration: 300,
      });
    }
  }

  return {
    editorRef,
    editorInstance,
    autoFocusEnabled,
    onEditorInit,
    autoAlign,
    onUpdateNode,
    onDeleteNode,
    onDragoverEditor,
    onDropInEditor,
    goToBlock,
  };
}
