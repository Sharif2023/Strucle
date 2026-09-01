import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
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

const LayerTreeNode: React.FC<{ node: LayoutNode, level: number }> = ({ node, level }) => {
  const { selectedNodeId, selectNode, moveNode } = useEditorStore();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedNodeId === node.id;
  const isRoot = node.id === 'root';
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (node.type === 'container' || isRoot) {
      e.dataTransfer.dropEffect = 'move';
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id && (node.type === 'container' || isRoot)) {
      moveNode(draggedId, node.id);
      setIsExpanded(true);
    }
  };
  
  return (
    <div className="flex flex-col font-sans">
      <div 
        draggable={!isRoot}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer select-none transition-all group ${isSelected ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/5 text-zinc-400'}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={(e) => {
          e.stopPropagation();
          selectNode(node.id);
        }}
      >
        {!isRoot && (
          <div className="opacity-0 group-hover:opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-500 -ml-2">
            <GripVertical size={12} />
          </div>
        )}
        <div 
          className="w-4 h-4 flex items-center justify-center shrink-0"
          onClick={(e) => {
            if (hasChildren) {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} className="text-zinc-500 hover:text-white" /> : <ChevronRight size={14} className="text-zinc-500 hover:text-white" />
          ) : <div className="w-4 h-4" />}
        </div>
        
        {getIcon(node.type)}
        <span className={`text-xs truncate ${isSelected ? 'font-medium text-indigo-100' : ''}`}>{node.name || node.type}</span>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="flex flex-col mt-0.5">
          {node.children!.map(child => (
            <LayerTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayerTree: React.FC = () => {
  const { rootNode, selectNode } = useEditorStore();
  
  return (
    <div className="flex-1 overflow-y-auto p-2" onClick={() => selectNode(null)}>
      <LayerTreeNode node={rootNode} level={0} />
    </div>
  );
};
