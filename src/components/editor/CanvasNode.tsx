import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { LayoutNode } from '../../model/types';
import ResizeHandles from './ResizeHandles';

interface CanvasNodeProps {
  node: LayoutNode;
}

const CanvasNode: React.FC<CanvasNodeProps> = ({ node }) => {
  const { selectedNodeId, selectNode } = useEditorStore();
  const isSelected = selectedNodeId === node.id;
  const nodeRef = useRef<HTMLDivElement>(null);
  const layout = node.layout || { display: 'block' };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const isRoot = node.id === 'root';
  
  const getStyles = (): React.CSSProperties => {
    const s: React.CSSProperties = {
      position: 'relative',
      width: layout.width ? `${layout.width}px` : (layout.display === 'block' ? '100%' : 'auto'),
      height: layout.height ? `${layout.height}px` : 'auto',
      minHeight: node.type === 'container' && !layout.height ? '100px' : undefined,
    };
    
    if (layout.display === 'flex') {
      s.display = 'flex';
      s.flexDirection = layout.flexDirection || 'row';
      s.flexWrap = layout.flexWrap || 'nowrap';
      s.justifyContent = layout.justifyContent || 'flex-start';
      s.alignItems = layout.alignItems || 'stretch';
      s.gap = layout.gap ? `${layout.gap}px` : undefined;
    } else if (layout.display === 'grid') {
      s.display = 'grid';
      s.gridTemplateColumns = `repeat(${layout.gridColumns || 1}, 1fr)`;
      s.gap = layout.gap ? `${layout.gap}px` : undefined;
    }

    if (!isRoot) {
      if (node.type === 'container') {
        s.border = '1px dashed #cbd5e1';
      } else {
        s.border = '1px solid #cbd5e1';
        s.backgroundColor = '#f8fafc';
      }
    } else {
      s.backgroundColor = 'white';
      s.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
    }
    
    return s;
  };

  return (
    <div
      ref={nodeRef}
      style={getStyles()}
      onClick={handleSelect}
      className={`${isSelected ? 'ring-2 ring-blue-500 z-10' : ''}`}
    >
      {node.type !== 'container' && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium text-sm pointer-events-none">
          {node.name || node.type}
        </div>
      )}
      
      {node.children?.map(child => (
        <CanvasNode key={child.id} node={child} />
      ))}
      
      {isSelected && (
        <ResizeHandles node={node} nodeRef={nodeRef} />
      )}
      
      {isSelected && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-50">
          {nodeRef.current ? `${nodeRef.current.offsetWidth} × ${nodeRef.current.offsetHeight} px` : `${layout.width || 'auto'} × ${layout.height || 'auto'} px`}
        </div>
      )}
    </div>
  );
};

export default CanvasNode;
