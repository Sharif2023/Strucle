import React, { useRef, useEffect, useState } from 'react';
import type { LayoutNode } from '../../model/types';
import { useEditorStore } from '../../store/editorStore';

interface ResizeHandlesProps {
  node: LayoutNode;
  nodeRef: React.RefObject<HTMLDivElement | null>;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ node, nodeRef }) => {
  const { updateNodeLayout, updateNode, zoom } = useEditorStore();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isDragging = useRef(false);
  const startDimensions = useRef({ width: 0, height: 0 });
  const startMouse = useRef({ x: 0, y: 0 });
  const startNodePos = useRef({ x: 0, y: 0 });
  const isRoot = node.id === 'root';

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
    startMouse.current = { x: e.clientX, y: e.clientY };
    startNodePos.current = { x: node.position?.x || 0, y: node.position?.y || 0 };
    
    if (nodeRef.current) {
      startDimensions.current = {
        width: nodeRef.current.offsetWidth,
        height: nodeRef.current.offsetHeight
      };
    }
    
    const handlePointerMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;
      
      const { zoom } = useEditorStore.getState();
      const dx = (ev.clientX - startMouse.current.x) / zoom;
      const dy = (ev.clientY - startMouse.current.y) / zoom;
      
      let newWidth = startDimensions.current.width;
      let newHeight = startDimensions.current.height;
      let newX = startNodePos.current.x;
      let newY = startNodePos.current.y;
      
      if (handleType.includes('right')) {
        newWidth = Math.max(20, startDimensions.current.width + dx);
      }
      
      if (handleType.includes('bottom')) {
        newHeight = Math.max(20, startDimensions.current.height + dy);
      }
      
      if (handleType.includes('left')) {
        newWidth = Math.max(20, startDimensions.current.width - dx);
        if (newWidth > 20 && !isRoot) {
          newX = startNodePos.current.x + dx;
        }
      }
      
      if (handleType.includes('top')) {
        newHeight = Math.max(20, startDimensions.current.height - dy);
        if (newHeight > 20 && !isRoot) {
          newY = startNodePos.current.y + dy;
        }
      }
      
      if (nodeRef.current) {
        nodeRef.current.style.width = `${newWidth}px`;
        nodeRef.current.style.height = `${newHeight}px`;
        if (!isRoot) {
          nodeRef.current.style.left = `${newX}px`;
          nodeRef.current.style.top = `${newY}px`;
        }
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
        
        if (!isRoot) {
          updateNode(node.id, {
            position: {
              x: parseFloat(nodeRef.current.style.left || '0'),
              y: parseFloat(nodeRef.current.style.top || '0')
            }
          });
        }
      }
    };
    
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const baseHandleStyle = "absolute bg-white border border-blue-500 w-2.5 h-2.5 z-20 pointer-events-auto rounded-[2px]";
  
  // To keep handles same visual size regardless of zoom, we can scale them inversely, but standard is fine for now
  // We apply inverse scaling so the handles don't get huge when zooming in or tiny when zooming out
  const handleScale = 1 / Math.max(0.2, zoom);
  const handleTransform = `scale(${handleScale})`;
  const offset = -5 * handleScale;

  return (
    <>
      {/* Edges */}
      <div className={`${baseHandleStyle} top-0 left-1/2 -translate-x-1/2 cursor-n-resize`} style={{ top: offset, transform: `translateX(-50%) ${handleTransform}` }} onPointerDown={(e) => handlePointerDown(e, 'top')} />
      <div className={`${baseHandleStyle} bottom-0 left-1/2 -translate-x-1/2 cursor-s-resize`} style={{ bottom: offset, transform: `translateX(-50%) ${handleTransform}` }} onPointerDown={(e) => handlePointerDown(e, 'bottom')} />
      <div className={`${baseHandleStyle} left-0 top-1/2 -translate-y-1/2 cursor-w-resize`} style={{ left: offset, transform: `translateY(-50%) ${handleTransform}` }} onPointerDown={(e) => handlePointerDown(e, 'left')} />
      <div className={`${baseHandleStyle} right-0 top-1/2 -translate-y-1/2 cursor-e-resize`} style={{ right: offset, transform: `translateY(-50%) ${handleTransform}` }} onPointerDown={(e) => handlePointerDown(e, 'right')} />
      
      {/* Corners */}
      <div className={`${baseHandleStyle} cursor-nw-resize`} style={{ top: offset, left: offset, transform: handleTransform }} onPointerDown={(e) => handlePointerDown(e, 'top-left')} />
      <div className={`${baseHandleStyle} cursor-ne-resize`} style={{ top: offset, right: offset, transform: handleTransform }} onPointerDown={(e) => handlePointerDown(e, 'top-right')} />
      <div className={`${baseHandleStyle} cursor-sw-resize`} style={{ bottom: offset, left: offset, transform: handleTransform }} onPointerDown={(e) => handlePointerDown(e, 'bottom-left')} />
      <div className={`${baseHandleStyle} cursor-se-resize`} style={{ bottom: offset, right: offset, transform: handleTransform }} onPointerDown={(e) => handlePointerDown(e, 'bottom-right')} />
      
      {isDragging.current && (
        <div className="fixed inset-x-0 bottom-10 flex justify-center pointer-events-none z-50">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg font-mono text-sm">
            w: {Math.round(dimensions.width)} • h: {Math.round(dimensions.height)}
          </div>
        </div>
      )}
    </>
  );
};

export default ResizeHandles;
