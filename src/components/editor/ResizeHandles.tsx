import React, { useRef, useEffect, useState } from 'react';
import type { LayoutNode } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';

interface ResizeHandlesProps {
  node: LayoutNode;
  nodeRef: React.RefObject<HTMLDivElement>;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ node, nodeRef }) => {
  const { updateNodeLayout } = useEditorStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isDragging = useRef(false);
  const startDimensions = useRef({ width: 0, height: 0 });
  const startPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (nodeRef.current) {
      setDimensions({
        width: nodeRef.current.offsetWidth,
        height: nodeRef.current.offsetHeight
      });
    }
  }, [node.layout?.width, node.layout?.height, nodeRef]);

  const handlePointerDown = (e: React.PointerEvent, handleType: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    isDragging.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    
    if (nodeRef.current) {
      startDimensions.current = {
        width: nodeRef.current.offsetWidth,
        height: nodeRef.current.offsetHeight
      };
    }
    
    const handlePointerMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;
      
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      
      let newWidth = startDimensions.current.width;
      let newHeight = startDimensions.current.height;
      
      if (handleType.includes('right')) newWidth = Math.max(20, startDimensions.current.width + dx);
      if (handleType.includes('bottom')) newHeight = Math.max(20, startDimensions.current.height + dy);
      
      if (nodeRef.current) {
        nodeRef.current.style.width = `${newWidth}px`;
        nodeRef.current.style.height = `${newHeight}px`;
      }
      
      setDimensions({ width: newWidth, height: newHeight });
    };
    
    const handlePointerUp = () => {
      isDragging.current = false;
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      if (nodeRef.current) {
        updateNodeLayout(node.id, {
          width: nodeRef.current.offsetWidth,
          height: nodeRef.current.offsetHeight
        });
      }
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const baseHandleStyle = "absolute bg-white border border-blue-500 w-2.5 h-2.5 z-20 pointer-events-auto";

  return (
    <>
      <div className={`${baseHandleStyle} right-[-5px] top-1/2 -translate-y-1/2 cursor-e-resize`} onPointerDown={(e) => handlePointerDown(e, 'right')} />
      <div className={`${baseHandleStyle} bottom-[-5px] left-1/2 -translate-x-1/2 cursor-s-resize`} onPointerDown={(e) => handlePointerDown(e, 'bottom')} />
      <div className={`${baseHandleStyle} right-[-5px] bottom-[-5px] cursor-se-resize`} onPointerDown={(e) => handlePointerDown(e, 'bottom-right')} />
      
      {isDragging.current && (
        <div className="fixed inset-x-0 bottom-10 flex justify-center pointer-events-none z-50">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-sm">
            Width: {Math.round(dimensions.width)}px • Height: {Math.round(dimensions.height)}px
          </div>
        </div>
      )}
    </>
  );
};

export default ResizeHandles;
