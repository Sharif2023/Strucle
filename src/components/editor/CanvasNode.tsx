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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRoot) return;
    
    // Ignore if clicking on a resize handle
    if ((e.target as HTMLElement).tagName === 'DIV' && (e.target as HTMLElement).className.includes('cursor-')) {
      return;
    }

    e.stopPropagation();
    selectNode(node.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPosX = node.position?.x || 0;
    const initialPosY = node.position?.y || 0;

    let moved = false;
    let finalX = initialPosX;
    let finalY = initialPosY;

    const handlePointerMove = (ev: PointerEvent) => {
      moved = true;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      finalX = initialPosX + dx;
      finalY = initialPosY + dy;

      if (nodeRef.current) {
        nodeRef.current.style.left = `${finalX}px`;
        nodeRef.current.style.top = `${finalY}px`;
      }
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      if (moved) {
        useEditorStore.getState().updateNode(node.id, {
          position: { x: finalX, y: finalY }
        });
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const isRoot = node.id === 'root';
  
  const getStyles = (): React.CSSProperties => {
    const s: React.CSSProperties = {
      position: (node.position && !isRoot) ? 'absolute' : 'relative',
      left: node.position && !isRoot ? `${node.position.x}px` : undefined,
      top: node.position && !isRoot ? `${node.position.y}px` : undefined,
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
        s.border = '1px dashed rgba(255, 255, 255, 0.2)';
        s.backgroundColor = 'rgba(255, 255, 255, 0.02)';
      } else {
        s.border = '1px solid rgba(255, 255, 255, 0.1)';
        s.backgroundColor = 'rgba(24, 24, 27, 0.8)';
        s.backdropFilter = 'blur(8px)';
      }
    } else {
      s.backgroundColor = 'transparent';
    }

    if (node.style?.zIndex !== undefined) {
      s.zIndex = node.style.zIndex;
    }
    
    return s;
  };

  return (
    <div
      ref={nodeRef}
      style={getStyles()}
      onClick={handleSelect}
      onPointerDown={handlePointerDown}
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
