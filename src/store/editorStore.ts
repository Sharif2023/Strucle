import { create } from 'zustand';
import type { LayoutNode } from '../model/types';
import { nanoid } from 'nanoid';

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  labelX?: number;
  labelY?: number;
}

interface EditorState {
  rootNode: LayoutNode;
  selectedNodeIds: string[];
  history: LayoutNode[];
  historyIndex: number;
  clipboardNodes: LayoutNode[];
  
  // Selection
  selectNode: (id: string | null, multi?: boolean) => void;
  selectAll: () => void;
  
  // Modification
  updateNode: (id: string, updates: Partial<LayoutNode>) => void;
  updateNodeLayout: (id: string, layoutUpdates: Partial<LayoutNode['layout']>) => void;
  addNode: (parentId: string, type: LayoutNode['type']) => void;
  deleteNodes: (ids: string[]) => void;
  renameNode: (id: string, name: string) => void;
  
  // Tree Operations
  moveNodes: (ids: string[], targetId: string, position: 'before' | 'after' | 'inside') => void;
  moveToParent: (ids: string[]) => void;
  moveUp: (ids: string[]) => void;
  moveDown: (ids: string[]) => void;
  groupNodes: (ids: string[]) => void;
  
  // Clipboard
  copyNodes: () => void;
  cutNodes: () => void;
  pasteNodes: () => void;
  duplicateNodes: (ids: string[]) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  
  // Viewport & Guides
  zoom: number;
  pan: { x: number, y: number };
  setViewport: (zoom: number, pan: { x: number, y: number }) => void;
  
  guides: SnapGuide[];
  setGuides: (guides: SnapGuide[]) => void;
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

// --- UTILITIES ---

export const canAcceptChild = (parentType: string, _childType?: string) => {
  return parentType === 'container';
};

export const findNodeAndParent = (
  node: LayoutNode, 
  id: string, 
  parent: LayoutNode | null = null,
  index: number = -1
): { node: LayoutNode | null, parent: LayoutNode | null, index: number } => {
  if (node.id === id) return { node, parent, index };
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const result = findNodeAndParent(node.children[i], id, node, i);
      if (result.node) return result;
    }
  }
  return { node: null, parent: null, index: -1 };
};

const isDescendant = (root: LayoutNode, ancestorId: string, descendantId: string): boolean => {
  const { node: ancestor } = findNodeAndParent(root, ancestorId);
  if (!ancestor) return false;
  return findNodeAndParent(ancestor, descendantId).node !== null;
};

const cloneNode = (node: LayoutNode): LayoutNode => JSON.parse(JSON.stringify(node));

const generateNewIds = (n: LayoutNode): LayoutNode => ({
  ...n,
  id: nanoid(6),
  children: n.children ? n.children.map(generateNewIds) : undefined,
  position: n.position ? { x: n.position.x + 20, y: n.position.y + 20 } : undefined
});

const updateNodeTree = (
  node: LayoutNode,
  id: string,
  updater: (node: LayoutNode) => LayoutNode
): LayoutNode => {
  if (node.id === id) return updater({ ...node });
  if (node.children) {
    return { ...node, children: node.children.map(child => updateNodeTree(child, id, updater)) };
  }
  return node;
};

const filterNodes = (node: LayoutNode, idsToRemove: Set<string>): LayoutNode => {
  if (!node.children) return node;
  const newChildren = node.children
    .filter(c => !idsToRemove.has(c.id))
    .map(c => filterNodes(c, idsToRemove));
  return { ...node, children: newChildren };
};

// --- STORE ---

export const useEditorStore = create<EditorState>((set, get) => {
  
  const saveHistory = (newRoot: LayoutNode, newSelection?: string[]) => {
    const { history, historyIndex, selectedNodeIds } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(cloneNode(newRoot));
    set({
      rootNode: newRoot,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      selectedNodeIds: newSelection !== undefined ? newSelection : selectedNodeIds
    });
  };

  return {
    rootNode: initialRoot,
    selectedNodeIds: [],
    history: [cloneNode(initialRoot)],
    historyIndex: 0,
    clipboardNodes: [],
    
    zoom: 1,
    pan: { x: 100, y: 100 },
    setViewport: (zoom, pan) => set({ zoom, pan }),
    
    guides: [],
    setGuides: (guides) => set({ guides }),

    selectNode: (id, multi = false) => {
      const { selectedNodeIds } = get();
      if (!id) {
        set({ selectedNodeIds: [] });
        return;
      }
      if (multi) {
        if (selectedNodeIds.includes(id)) {
          set({ selectedNodeIds: selectedNodeIds.filter(sid => sid !== id) });
        } else {
          set({ selectedNodeIds: [...selectedNodeIds, id] });
        }
      } else {
        set({ selectedNodeIds: [id] });
      }
    },
    
    selectAll: () => {
      const { rootNode } = get();
      const allIds: string[] = [];
      const traverse = (n: LayoutNode) => {
        if (n.id !== 'root') allIds.push(n.id);
        if (n.children) n.children.forEach(traverse);
      };
      traverse(rootNode);
      set({ selectedNodeIds: allIds });
    },
    
    updateNode: (id, updates) => {
      const newRoot = updateNodeTree(get().rootNode, id, (node) => ({ ...node, ...updates }));
      saveHistory(newRoot);
    },
    
    updateNodeLayout: (id, layoutUpdates) => {
      const newRoot = updateNodeTree(get().rootNode, id, (node) => ({
        ...node,
        layout: { ...(node.layout || { display: 'block' }), ...layoutUpdates }
      }));
      saveHistory(newRoot);
    },
    
    addNode: (parentId, type) => {
      let targetId = parentId;
      const { rootNode } = get();
      
      // If the intended parent cannot accept children, add to its parent instead
      const { node: targetNode, parent: grandParent } = findNodeAndParent(rootNode, parentId);
      
      if (targetNode && !canAcceptChild(targetNode.type, type)) {
         targetId = grandParent ? grandParent.id : 'root';
      }

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
      
      let added = false;
      const newRoot = updateNodeTree(rootNode, targetId, (node) => {
        if (!canAcceptChild(node.type, newNode.type)) return node;
        added = true;
        return { ...node, children: [...(node.children || []), newNode] };
      });
      
      if (added) {
        saveHistory(newRoot, [newNode.id]);
      }
    },
    
    deleteNodes: (ids) => {
      const idsSet = new Set(ids.filter(id => id !== 'root'));
      if (idsSet.size === 0) return;
      const newRoot = filterNodes(get().rootNode, idsSet);
      saveHistory(newRoot, []);
    },

    renameNode: (id, name) => {
      if (!name.trim()) return;
      const newRoot = updateNodeTree(get().rootNode, id, (node) => ({ ...node, name }));
      saveHistory(newRoot);
    },
    
    moveNodes: (ids, targetId, position) => {
      const { rootNode } = get();
      const idsToMove = ids.filter(id => id !== 'root');
      if (idsToMove.length === 0) return;
      
      // Validation: cannot move a node into itself or its descendant
      for (const id of idsToMove) {
        if (id === targetId || isDescendant(rootNode, id, targetId)) return;
      }

      // Collect nodes to move
      const nodesToMove: LayoutNode[] = [];
      for (const id of idsToMove) {
        const { node } = findNodeAndParent(rootNode, id);
        if (node) nodesToMove.push(cloneNode(node));
      }

      // Remove them from current positions
      let newRoot = filterNodes(rootNode, new Set(idsToMove));

      // Insert at target
      newRoot = updateNodeTree(newRoot, targetId, (targetNode) => {
        if (position === 'inside') {
          if (!canAcceptChild(targetNode.type)) return targetNode;
          return { ...targetNode, children: [...(targetNode.children || []), ...nodesToMove] };
        }
        return targetNode; // Handle before/after below
      });

      if (position !== 'inside') {
        const { parent } = findNodeAndParent(newRoot, targetId);
        if (parent) {
          newRoot = updateNodeTree(newRoot, parent.id, (parentNode) => {
            const children = [...(parentNode.children || [])];
            const idx = children.findIndex(c => c.id === targetId);
            if (idx !== -1) {
              if (position === 'before') children.splice(idx, 0, ...nodesToMove);
              if (position === 'after') children.splice(idx + 1, 0, ...nodesToMove);
            }
            return { ...parentNode, children };
          });
        }
      }

      saveHistory(newRoot, idsToMove);
    },

    moveToParent: (ids) => {
      // Moves node out of its current container into its grandparent
      // Skipping for brevity, will implement if requested explicitly in a custom action.
      // Or simple implementation:
      const { rootNode } = get();
      const firstId = ids[0];
      if (!firstId || firstId === 'root') return;
      
      const { parent } = findNodeAndParent(rootNode, firstId);
      if (!parent || parent.id === 'root') return;
      
      const { parent: grandParent } = findNodeAndParent(rootNode, parent.id);
      if (!grandParent) return;
      
      get().moveNodes(ids, grandParent.id, 'inside');
    },

    moveUp: (ids) => {
      const { rootNode } = get();
      const firstId = ids[0];
      if (!firstId || firstId === 'root') return;
      const { parent, index } = findNodeAndParent(rootNode, firstId);
      if (!parent || index <= 0) return;
      const sibling = parent.children![index - 1];
      get().moveNodes(ids, sibling.id, 'before');
    },

    moveDown: (ids) => {
      let newRoot = get().rootNode;
      let changed = false;
      const idsToMove = [...ids].reverse();
      for (const id of idsToMove) {
        if (id === 'root') continue;
        const { parent } = findNodeAndParent(newRoot, id);
        if (parent && parent.children) {
          const idx = parent.children.findIndex(c => c.id === id);
          if (idx !== -1 && idx < parent.children.length - 1) {
            newRoot = updateNodeTree(newRoot, parent.id, (p) => {
              const children = [...(p.children || [])];
              [children[idx], children[idx + 1]] = [children[idx + 1], children[idx]];
              return { ...p, children };
            });
            changed = true;
          }
        }
      }
      if (changed) {
        saveHistory(newRoot, ids);
      }
    },

    groupNodes: (ids) => {
      const { rootNode } = get();
      const validIds = ids.filter(id => id !== 'root');
      if (validIds.length === 0) return;

      const { parent } = findNodeAndParent(rootNode, validIds[0]);
      if (!parent) return;

      const nodesToGroup = validIds.map(id => findNodeAndParent(rootNode, id)?.node).filter(Boolean) as LayoutNode[];

      const groupId = nanoid();
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodesToGroup.forEach(n => {
         const x = n.position?.x || 0;
         const y = n.position?.y || 0;
         const w = n.layout?.width || 100;
         const h = n.layout?.height || 100;
         if (x < minX) minX = x;
         if (y < minY) minY = y;
         if (x + w > maxX) maxX = x + w;
         if (y + h > maxY) maxY = y + h;
      });
      
      const adjustedChildren = nodesToGroup.map(n => ({
         ...n,
         position: { x: (n.position?.x || 0) - minX, y: (n.position?.y || 0) - minY }
      }));

      const groupNode: LayoutNode = {
        id: groupId,
        type: 'container',
        name: 'Grouped Container',
        position: { x: minX, y: minY },
        layout: { 
          display: 'block', 
          width: maxX - minX, 
          height: maxY - minY 
        },
        children: adjustedChildren
      };

      let newRoot = filterNodes(rootNode, new Set(validIds));

      newRoot = updateNodeTree(newRoot, parent.id, (p) => {
        return { ...p, children: [...(p.children || []), groupNode] };
      });

      saveHistory(newRoot, [groupId]);
    },
    
    copyNodes: () => {
      const { rootNode, selectedNodeIds } = get();
      const toCopy: LayoutNode[] = [];
      for (const id of selectedNodeIds) {
        if (id === 'root') continue;
        const { node } = findNodeAndParent(rootNode, id);
        if (node) toCopy.push(cloneNode(node));
      }
      set({ clipboardNodes: toCopy });
    },
    
    cutNodes: () => {
      get().copyNodes();
      get().deleteNodes(get().selectedNodeIds);
    },
    
    pasteNodes: () => {
      const { clipboardNodes, selectedNodeIds, rootNode } = get();
      if (clipboardNodes.length === 0) return;

      const pastedNodes = clipboardNodes.map(generateNewIds);
      let targetId = 'root';
      let position: 'inside' | 'after' = 'inside';

      if (selectedNodeIds.length > 0) {
        targetId = selectedNodeIds[selectedNodeIds.length - 1];
        const { node } = findNodeAndParent(rootNode, targetId);
        if (node && node.type !== 'container') {
          position = 'after';
        }
      }

      // Add temporarily to root, then move them appropriately
      let newRoot = { ...rootNode, children: [...(rootNode.children || []), ...pastedNodes] };
      set({ rootNode: newRoot }); // Temp set
      get().moveNodes(pastedNodes.map(n => n.id), targetId, position);
    },
    
    duplicateNodes: (_ids) => {
      get().copyNodes();
      get().pasteNodes();
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
    }
  };
});
