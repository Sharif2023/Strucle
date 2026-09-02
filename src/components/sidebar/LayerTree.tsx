import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore, canAcceptChild } from '../../store/editorStore';
import type { LayoutNode } from '../../model/types';
import { ChevronRight, ChevronDown, Columns, Box, Type, Image, SquareSquare, Layout, GripVertical } from 'lucide-react';

const getIcon = (type: string) => {
  switch (type) {
    case 'container': return <Columns size={13} className="text-indigo-400" />;
    case 'box': return <Box size={13} className="text-zinc-400" />;
    case 'text': return <Type size={13} className="text-emerald-400" />;
    case 'image': return <Image size={13} className="text-purple-400" />;
    case 'button': return <SquareSquare size={13} className="text-orange-400" />;
    default: return <Layout size={13} />;
  }
};

interface FlattenedNode {
  node: LayoutNode;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  index: number;
}

export const LayerTree: React.FC = () => {
  const { 
    rootNode, selectedNodeIds, selectNode, moveNodes, renameNode,
    deleteNodes, copyNodes, cutNodes, pasteNodes, duplicateNodes,
    moveUp, moveDown, addNode
  } = useEditorStore();
  
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ root: true });
  const [dragState, setDragState] = useState<{ id: string, targetId: string, position: 'before' | 'after' | 'inside' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, nodeId: string } | null>(null);

  const toggleExpand = useCallback((id: string, force?: boolean) => {
    setExpanded(p => ({ ...p, [id]: force !== undefined ? force : !p[id] }));
  }, []);

  const flattened = useMemo(() => {
    const result: FlattenedNode[] = [];
    const traverse = (node: LayoutNode, level: number) => {
      const hasChildren = !!node.children && node.children.length > 0;
      const isExpanded = expanded[node.id] ?? true; 
      result.push({ node, level, hasChildren, isExpanded, index: result.length });
      if (hasChildren && isExpanded) {
        node.children!.forEach(child => traverse(child, level + 1));
      }
    };
    traverse(rootNode, 0);
    return result;
  }, [rootNode, expanded]);

  // Handle Drag Auto Expand
  const hoverTimer = useRef<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingId) {
        if (e.key === 'Enter') {
          renameNode(editingId, editValue);
          setEditingId(null);
        } else if (e.key === 'Escape') {
          setEditingId(null);
        }
        return; 
      }

      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'F2' && selectedNodeIds.length === 1) {
        e.preventDefault();
        const id = selectedNodeIds[0];
        const fNode = flattened.find(f => f.node.id === id);
        if (fNode) {
          setEditingId(id);
          setEditValue(fNode.node.name || fNode.node.type);
        }
        return;
      }

      if (!lastSelectedId && selectedNodeIds.length > 0) {
        setLastSelectedId(selectedNodeIds[0]);
      }
      const currentIndex = flattened.findIndex(f => f.node.id === (lastSelectedId || selectedNodeIds[0]));
      
      if (currentIndex !== -1) {
        const fNode = flattened[currentIndex];
        
        if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault();
          const prev = flattened[currentIndex - 1];
          selectNode(prev.node.id, e.shiftKey || e.ctrlKey || e.metaKey);
          setLastSelectedId(prev.node.id);
        }
        if (e.key === 'ArrowDown' && currentIndex < flattened.length - 1) {
          e.preventDefault();
          const next = flattened[currentIndex + 1];
          selectNode(next.node.id, e.shiftKey || e.ctrlKey || e.metaKey);
          setLastSelectedId(next.node.id);
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (fNode.hasChildren && !fNode.isExpanded) {
            toggleExpand(fNode.node.id, true);
          } else if (fNode.hasChildren && fNode.isExpanded && currentIndex < flattened.length - 1) {
            selectNode(flattened[currentIndex + 1].node.id);
            setLastSelectedId(flattened[currentIndex + 1].node.id);
          }
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (fNode.hasChildren && fNode.isExpanded) {
            toggleExpand(fNode.node.id, false);
          } else {
            for (let i = currentIndex - 1; i >= 0; i--) {
              if (flattened[i].level < fNode.level) {
                selectNode(flattened[i].node.id);
                setLastSelectedId(flattened[i].node.id);
                break;
              }
            }
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flattened, selectedNodeIds, lastSelectedId, editingId, editValue, renameNode, selectNode, toggleExpand]);

  // Click outside context menu
  useEffect(() => {
    const closeContext = () => setContextMenu(null);
    window.addEventListener('click', closeContext);
    return () => window.removeEventListener('click', closeContext);
  }, []);

  const handleClick = (e: React.MouseEvent, fNode: FlattenedNode) => {
    e.stopPropagation();
    if (e.type === 'contextmenu') {
      e.preventDefault();
      if (!selectedNodeIds.includes(fNode.node.id)) {
        selectNode(fNode.node.id);
      }
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId: fNode.node.id });
      return;
    }

    if (e.shiftKey && lastSelectedId) {
      const startIndex = flattened.findIndex(f => f.node.id === lastSelectedId);
      const endIndex = fNode.index;
      if (startIndex !== -1 && endIndex !== -1) {
        const min = Math.min(startIndex, endIndex);
        const max = Math.max(startIndex, endIndex);
        const ids = flattened.slice(min, max + 1).map(f => f.node.id);
        useEditorStore.setState({ selectedNodeIds: Array.from(new Set([...selectedNodeIds, ...ids])) });
      }
    } else {
      selectNode(fNode.node.id, e.ctrlKey || e.metaKey);
      setLastSelectedId(fNode.node.id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (id === 'root') {
      e.preventDefault();
      return;
    }
    // If we drag an unselected item, select it first
    if (!selectedNodeIds.includes(id)) {
      selectNode(id);
    }
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, fNode: FlattenedNode) => {
    e.preventDefault();
    const id = fNode.node.id;
    
    // Auto-expand logic
    if (fNode.hasChildren && !fNode.isExpanded) {
      if (!hoverTimer.current) {
        hoverTimer.current = window.setTimeout(() => {
          toggleExpand(id, true);
        }, 800);
      }
    } else {
      if (hoverTimer.current) {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = null;
      }
    }

    // Determine position based on mouse Y
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    let position: 'before' | 'after' | 'inside' = 'inside';
    
    if (id === 'root') {
      position = 'inside'; // Can only drop inside root
    } else {
      const h = rect.height;
      if (canAcceptChild(fNode.node.type)) {
        if (y < h * 0.25) position = 'before';
        else if (y > h * 0.75) position = 'after';
        else position = 'inside';
      } else {
        if (y < h * 0.5) position = 'before';
        else position = 'after';
      }
    }

    if (dragState?.targetId !== id || dragState?.position !== position) {
      setDragState({ id: selectedNodeIds[0], targetId: id, position });
    }
  };

  const handleDragEnd = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    setDragState(null);
  };

  const handleDragLeaveContainer = (e: React.DragEvent) => {
    // Only clear if leaving the actual container, not child elements
    if (e.currentTarget === e.target) {
      setDragState(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (dragState && selectedNodeIds.length > 0) {
      moveNodes(selectedNodeIds, dragState.targetId, dragState.position);
    }
    setDragState(null);
  };

  return (
    <div 
      className="flex-1 overflow-y-auto p-2 outline-none font-sans flex flex-col" 
      onClick={() => selectNode(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        selectNode('root');
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: 'root' });
      }}
      onDragLeave={handleDragLeaveContainer}
      onDrop={handleDrop}
    >
      {flattened.map((fNode) => {
        const isSelected = selectedNodeIds.includes(fNode.node.id);
        const isRoot = fNode.node.id === 'root';
        const isEditing = editingId === fNode.node.id;
        
        let borderClass = 'border border-transparent';
        if (dragState?.targetId === fNode.node.id) {
          if (dragState.position === 'before') borderClass = 'border-t-indigo-500';
          if (dragState.position === 'after') borderClass = 'border-b-indigo-500';
          if (dragState.position === 'inside') borderClass = 'ring-2 ring-indigo-500 bg-indigo-500/10';
        }

        return (
          <div 
            key={fNode.node.id}
            draggable={!isRoot && !isEditing}
            onDragStart={(e) => handleDragStart(e, fNode.node.id)}
            onDragOver={(e) => handleDragOver(e, fNode)}
            onDragEnd={handleDragEnd}
            onClick={(e) => handleClick(e, fNode)}
            onContextMenu={(e) => handleClick(e, fNode)}
            className={`flex items-center gap-1.5 py-1 px-2 rounded-md cursor-pointer select-none transition-all group ${borderClass} ${isSelected && !dragState ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-zinc-400'}`}
            style={{ paddingLeft: `${fNode.level * 16 + 8}px` }}
          >
            {!isRoot && (
              <div className="opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-500 -ml-3 shrink-0">
                <GripVertical size={12} />
              </div>
            )}
            
            <div 
              className={`w-4 h-4 flex items-center justify-center shrink-0 ${isRoot ? 'ml-0' : (fNode.hasChildren ? '' : 'ml-2')}`}
              onClick={(e) => {
                if (fNode.hasChildren) {
                  e.stopPropagation();
                  toggleExpand(fNode.node.id);
                }
              }}
            >
              {fNode.hasChildren ? (
                fNode.isExpanded ? <ChevronDown size={14} className="text-zinc-500 hover:text-white" /> : <ChevronRight size={14} className="text-zinc-500 hover:text-white" />
              ) : <div className="w-4 h-4" />}
            </div>
            
            {getIcon(fNode.node.type)}
            
            {isEditing ? (
              <input 
                autoFocus
                className="flex-1 bg-zinc-900 border border-indigo-500 text-white px-1 py-0.5 text-xs outline-none rounded"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onClick={e => e.stopPropagation()}
                onBlur={() => {
                  renameNode(fNode.node.id, editValue);
                  setEditingId(null);
                }}
              />
            ) : (
              <span className={`text-xs truncate ${isSelected ? 'font-medium text-indigo-100' : ''}`}>{fNode.node.name || fNode.node.type}</span>
            )}
          </div>
        );
      })}

      {/* Invisible Root Drop Zone to fill remaining space */}
      <div 
        className="flex-1 min-h-[100px]"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragState({ id: selectedNodeIds[0], targetId: 'root', position: 'inside' });
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          selectNode('root');
          setContextMenu({ x: e.clientX, y: e.clientY, nodeId: 'root' });
        }}
      />

      {contextMenu && createPortal(
        <div 
          className="fixed z-[9999] w-48 bg-zinc-900 border border-white/10 rounded-lg shadow-2xl py-1 text-xs font-medium text-zinc-300"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.nodeId === 'root' && (
            <>
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { addNode('root', 'container'); setContextMenu(null); }}>+ Add Container</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { addNode('root', 'box'); setContextMenu(null); }}>+ Add Box</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { addNode('root', 'text'); setContextMenu(null); }}>+ Add Text</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { addNode('root', 'button'); setContextMenu(null); }}>+ Add Button</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { addNode('root', 'image'); setContextMenu(null); }}>+ Add Image</button>
              <div className="h-px bg-white/10 my-1" />
            </>
          )}

          {contextMenu.nodeId !== 'root' && (
            <>
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { addNode(contextMenu.nodeId, 'box'); setContextMenu(null); }}>+ Add Child</button>
              <div className="h-px bg-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors" onClick={() => { setEditingId(contextMenu.nodeId); setEditValue(flattened.find(f => f.node.id === contextMenu.nodeId)?.node.name || ''); setContextMenu(null); }}>Rename (F2)</button>
              <div className="h-px bg-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors" onClick={() => { cutNodes(); setContextMenu(null); }}>Cut (Ctrl+X)</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors" onClick={() => { copyNodes(); setContextMenu(null); }}>Copy (Ctrl+C)</button>
            </>
          )}
          <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors" onClick={() => { pasteNodes(); setContextMenu(null); }}>Paste (Ctrl+V)</button>
          
          {contextMenu.nodeId !== 'root' && (
            <>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors" onClick={() => { duplicateNodes([contextMenu.nodeId]); setContextMenu(null); }}>Duplicate (Ctrl+D)</button>
              <div className="h-px bg-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors" onClick={() => { moveUp([contextMenu.nodeId]); setContextMenu(null); }}>Move Up</button>
              <button className="w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors" onClick={() => { moveDown([contextMenu.nodeId]); setContextMenu(null); }}>Move Down</button>
              <div className="h-px bg-white/10 my-1" />
              <button className="w-full text-left px-3 py-1.5 text-red-400 hover:bg-red-500/20 transition-colors" onClick={() => { deleteNodes([contextMenu.nodeId]); setContextMenu(null); }}>Delete (Del)</button>
            </>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};
