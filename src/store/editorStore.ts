import { create } from 'zustand';
import type { LayoutNode } from '../model/types';
import { nanoid } from 'nanoid';

interface EditorState {
  rootNode: LayoutNode;
  selectedNodeId: string | null;
  history: LayoutNode[];
  historyIndex: number;
  clipboardNode: LayoutNode | null;
  
  // Actions
  selectNode: (id: string | null) => void;
  updateNode: (id: string, updates: Partial<LayoutNode>) => void;
  updateNodeLayout: (id: string, layoutUpdates: Partial<LayoutNode['layout']>) => void;
  addNode: (parentId: string, type: LayoutNode['type']) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, targetParentId: string, index?: number) => void;
  
  copyNode: () => void;
  cutNode: () => void;
  pasteNode: () => void;
  
  undo: () => void;
  redo: () => void;
}

const initialRoot: LayoutNode = {
  id: 'root',
  name: 'Page',
  type: 'container',
  children: [],
  layout: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    width: 800,
    height: 600,
  }
};

// Helper to find a node and its parent
const findNodeAndParent = (
  node: LayoutNode, 
  id: string, 
  parent: LayoutNode | null = null
): { node: LayoutNode | null, parent: LayoutNode | null } => {
  if (node.id === id) return { node, parent };
  
  if (node.children) {
    for (const child of node.children) {
      const result = findNodeAndParent(child, id, node);
      if (result.node) return result;
    }
  }
  
  return { node: null, parent: null };
};

// Helper to map and update a node tree
const updateNodeTree = (
  node: LayoutNode,
  id: string,
  updater: (node: LayoutNode) => LayoutNode
): LayoutNode => {
  if (node.id === id) {
    return updater({ ...node });
  }
  
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updateNodeTree(child, id, updater))
    };
  }
  
  return node;
};

// Deep clone helper to save history
const cloneNode = (node: LayoutNode): LayoutNode => JSON.parse(JSON.stringify(node));

export const useEditorStore = create<EditorState>((set, get) => ({
  rootNode: initialRoot,
  selectedNodeId: null,
  history: [cloneNode(initialRoot)],
  historyIndex: 0,
  
  selectNode: (id) => set({ selectedNodeId: id }),
  
  updateNode: (id, updates) => {
    const { rootNode, history, historyIndex } = get();
    const newRoot = updateNodeTree(rootNode, id, (node) => ({ ...node, ...updates }));
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));
    
    set({ 
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  
  updateNodeLayout: (id, layoutUpdates) => {
    const { rootNode, history, historyIndex } = get();
    const newRoot = updateNodeTree(rootNode, id, (node) => ({
      ...node,
      layout: { ...(node.layout || { display: 'block' }), ...layoutUpdates }
    }));
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));
    
    set({ 
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  
  addNode: (parentId, type) => {
    const { rootNode, history, historyIndex } = get();
    
    const newNode: LayoutNode = {
      id: nanoid(6),
      name: `New ${type}`,
      type,
      layout: type === 'container' 
        ? { display: 'flex', flexDirection: 'column', gap: 16, width: 400, height: 300 } 
        : { display: 'block', width: 200, height: 100 },
      position: { x: 50, y: 50 },
      children: type === 'container' ? [] : undefined
    };
    
    const newRoot = updateNodeTree(rootNode, parentId, (node) => {
      if (node.type !== 'container') return node;
      return {
        ...node,
        children: [...(node.children || []), newNode]
      };
    });
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));
    
    set({ 
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedNodeId: newNode.id
    });
  },
  
  deleteNode: (id) => {
    if (id === 'root') return; // Cannot delete root
    
    const { rootNode, history, historyIndex, selectedNodeId } = get();
    
    const { parent } = findNodeAndParent(rootNode, id);
    if (!parent) return;
    
    const newRoot = updateNodeTree(rootNode, parent.id, (node) => ({
      ...node,
      children: (node.children || []).filter(c => c.id !== id)
    }));
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));
    
    set({ 
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedNodeId: selectedNodeId === id ? null : selectedNodeId
    });
  },
  
  moveNode: (id, targetParentId, index) => {
    const { rootNode, history, historyIndex } = get();
    
    if (id === 'root' || id === targetParentId) return;
    
    const { node: nodeToMove, parent: oldParent } = findNodeAndParent(rootNode, id);
    if (!nodeToMove || !oldParent) return;
    
    // Check if moving to a child of itself
    const isChild = findNodeAndParent(nodeToMove, targetParentId).node !== null;
    if (isChild) return;
    
    // First remove from old parent
    let intermediateRoot = updateNodeTree(rootNode, oldParent.id, (node) => ({
      ...node,
      children: (node.children || []).filter(c => c.id !== id)
    }));
    
    // Then add to new parent
    const newRoot = updateNodeTree(intermediateRoot, targetParentId, (node) => {
      const children = [...(node.children || [])];
      if (index !== undefined) {
        children.splice(index, 0, nodeToMove);
      } else {
        children.push(nodeToMove);
      }
      return { ...node, children };
    });
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));
    
    set({ 
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },
  
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        rootNode: cloneNode(history[historyIndex - 1]),
        historyIndex: historyIndex - 1
      });
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        rootNode: cloneNode(history[historyIndex + 1]),
        historyIndex: historyIndex + 1
      });
    }
  },

  clipboardNode: null,

  copyNode: () => {
    const { rootNode, selectedNodeId } = get();
    if (!selectedNodeId || selectedNodeId === 'root') return;
    const { node } = findNodeAndParent(rootNode, selectedNodeId);
    if (node) {
      set({ clipboardNode: cloneNode(node) });
    }
  },

  cutNode: () => {
    const { rootNode, selectedNodeId, deleteNode } = get();
    if (!selectedNodeId || selectedNodeId === 'root') return;
    const { node } = findNodeAndParent(rootNode, selectedNodeId);
    if (node) {
      set({ clipboardNode: cloneNode(node) });
      deleteNode(selectedNodeId);
    }
  },

  pasteNode: () => {
    const { rootNode, selectedNodeId, clipboardNode, history, historyIndex } = get();
    if (!clipboardNode) return;

    // determine parent
    let parentId = selectedNodeId || 'root';
    const { node: selectedNode } = findNodeAndParent(rootNode, parentId);
    if (selectedNode && selectedNode.type !== 'container' && parentId !== 'root') {
      const { parent } = findNodeAndParent(rootNode, parentId);
      parentId = parent?.id || 'root';
    }

    const generateNewIds = (n: LayoutNode): LayoutNode => ({
      ...n,
      id: nanoid(6),
      children: n.children ? n.children.map(generateNewIds) : undefined,
      position: n.position ? { x: n.position.x + 20, y: n.position.y + 20 } : undefined
    });

    const pastedNode = generateNewIds(clipboardNode);

    const newRoot = updateNodeTree(rootNode, parentId, (node) => {
      if (node.type !== 'container') return node;
      return {
        ...node,
        children: [...(node.children || []), pastedNode]
      };
    });

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));

    set({
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedNodeId: pastedNode.id
    });
  }
}));
