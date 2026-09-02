import React, { useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { LayoutNode } from '../../model/types';
import ResizeHandles from './ResizeHandles';

interface CanvasNodeProps {
  node: LayoutNode;
}

const CanvasNode: React.FC<CanvasNodeProps> = ({ node }) => {
  const { selectedNodeIds, selectNode } = useEditorStore();
  const isSelected = selectedNodeIds.includes(node.id);
  const nodeRef = useRef<HTMLDivElement>(null);
  const layout = node.layout || { display: 'block' };
  
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id, e.ctrlKey || e.metaKey);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isRoot) return;
    
    // Ignore if clicking on a resize handle
    if ((e.target as HTMLElement).tagName === 'DIV' && (e.target as HTMLElement).className.includes('cursor-')) {
      return;
    }

    e.stopPropagation();
    if (!isSelected) {
      selectNode(node.id, e.ctrlKey || e.metaKey);
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const initialPosX = node.position?.x || 0;
    const initialPosY = node.position?.y || 0;

    const { zoom, setGuides } = useEditorStore.getState();
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer || !nodeRef.current) return;
    const canvasRect = canvasContainer.getBoundingClientRect();
    const nodeRect = nodeRef.current.getBoundingClientRect();
    const w = nodeRect.width / zoom;
    const h = nodeRect.height / zoom;

    const otherElements = Array.from(document.querySelectorAll('[data-node-id]'))
      .filter(el => el !== nodeRef.current && !nodeRef.current?.contains(el)) as HTMLElement[];

    const snapPoints = otherElements.map(el => {
       const rect = el.getBoundingClientRect();
       return {
         left: (rect.left - canvasRect.left) / zoom,
         right: (rect.right - canvasRect.left) / zoom,
         top: (rect.top - canvasRect.top) / zoom,
         bottom: (rect.bottom - canvasRect.top) / zoom,
         centerX: (rect.left + rect.width / 2 - canvasRect.left) / zoom,
         centerY: (rect.top + rect.height / 2 - canvasRect.top) / zoom,
       };
    });

    let moved = false;
    let finalX = initialPosX;
    let finalY = initialPosY;
    let currentDx = 0;
    let currentDy = 0;

    const isMultiDrag = selectedNodeIds.length > 1 && selectedNodeIds.includes(node.id);
    let initialPositions: Record<string, {x: number, y: number}> = {};
    
    if (isMultiDrag) {
      selectedNodeIds.forEach(id => {
         if (id === 'root') return;
         const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement;
         if (el) {
           initialPositions[id] = { 
             x: parseFloat(el.style.left) || 0, 
             y: parseFloat(el.style.top) || 0 
           };
         }
      });
    }

    const handlePointerMove = (ev: PointerEvent) => {
      moved = true;
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      currentDx = dx;
      currentDy = dy;
      
      finalX = initialPosX + dx;
      finalY = initialPosY + dy;

      if (isMultiDrag) {
        selectedNodeIds.forEach(id => {
          if (id === 'root' || !initialPositions[id]) return;
          const el = document.querySelector(`[data-node-id="${id}"]`) as HTMLElement;
          if (el) {
            el.style.left = `${initialPositions[id].x + dx}px`;
            el.style.top = `${initialPositions[id].y + dy}px`;
          }
        });
      } else {
        const SNAP_THRESHOLD = 5 / zoom; // Adjust threshold based on zoom
      const currentCenterX = finalX + w / 2;
      const currentCenterY = finalY + h / 2;
      const currentRight = finalX + w;
      const currentBottom = finalY + h;
      
      const newGuides: any[] = [];
      let snappedX = false;
      let snappedY = false;

      for (const sp of snapPoints) {
        if (!snappedX) {
           if (Math.abs(finalX - sp.left) < SNAP_THRESHOLD) { finalX = sp.left; newGuides.push({ type: 'vertical', position: sp.left, labelX: sp.left, labelY: currentCenterY }); snappedX = true; }
           else if (Math.abs(finalX - sp.right) < SNAP_THRESHOLD) { finalX = sp.right; newGuides.push({ type: 'vertical', position: sp.right, labelX: sp.right, labelY: currentCenterY }); snappedX = true; }
           else if (Math.abs(currentCenterX - sp.centerX) < SNAP_THRESHOLD) { finalX = sp.centerX - w/2; newGuides.push({ type: 'vertical', position: sp.centerX, labelX: sp.centerX, labelY: currentCenterY }); snappedX = true; }
           else if (Math.abs(currentRight - sp.left) < SNAP_THRESHOLD) { finalX = sp.left - w; newGuides.push({ type: 'vertical', position: sp.left, labelX: sp.left, labelY: currentCenterY }); snappedX = true; }
           else if (Math.abs(currentRight - sp.right) < SNAP_THRESHOLD) { finalX = sp.right - w; newGuides.push({ type: 'vertical', position: sp.right, labelX: sp.right, labelY: currentCenterY }); snappedX = true; }
        }
        
        if (!snappedY) {
           if (Math.abs(finalY - sp.top) < SNAP_THRESHOLD) { finalY = sp.top; newGuides.push({ type: 'horizontal', position: sp.top, labelX: currentCenterX, labelY: sp.top }); snappedY = true; }
           else if (Math.abs(finalY - sp.bottom) < SNAP_THRESHOLD) { finalY = sp.bottom; newGuides.push({ type: 'horizontal', position: sp.bottom, labelX: currentCenterX, labelY: sp.bottom }); snappedY = true; }
           else if (Math.abs(currentCenterY - sp.centerY) < SNAP_THRESHOLD) { finalY = sp.centerY - h/2; newGuides.push({ type: 'horizontal', position: sp.centerY, labelX: currentCenterX, labelY: sp.centerY }); snappedY = true; }
           else if (Math.abs(currentBottom - sp.top) < SNAP_THRESHOLD) { finalY = sp.top - h; newGuides.push({ type: 'horizontal', position: sp.top, labelX: currentCenterX, labelY: sp.top }); snappedY = true; }
           else if (Math.abs(currentBottom - sp.bottom) < SNAP_THRESHOLD) { finalY = sp.bottom - h; newGuides.push({ type: 'horizontal', position: sp.bottom, labelX: currentCenterX, labelY: sp.bottom }); snappedY = true; }
        }
      }
      
      if (!isMultiDrag) {
        setGuides(newGuides);
        if (nodeRef.current) {
          nodeRef.current.style.left = `${finalX}px`;
          nodeRef.current.style.top = `${finalY}px`;
        }
      }
      } // end else block
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      
      setGuides([]);

      if (moved) {
        if (isMultiDrag) {
          selectedNodeIds.forEach(id => {
            if (id === 'root' || !initialPositions[id]) return;
            useEditorStore.getState().updateNode(id, {
              position: { x: initialPositions[id].x + currentDx, y: initialPositions[id].y + currentDy }
            });
          });
        } else {
          useEditorStore.getState().updateNode(node.id, {
            position: { x: finalX, y: finalY }
          });
        }
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

    // Uniform border for all elements to show boundaries clearly
    s.border = '1px dashed rgba(255, 255, 255, 0.2)';

    if (node.type === 'container' || isRoot) {
      s.backgroundColor = 'rgba(255, 255, 255, 0.02)';
    } else {
      s.backgroundColor = 'rgba(24, 24, 27, 0.8)';
      s.backdropFilter = 'blur(8px)';
    }

    if (node.style?.zIndex !== undefined) {
      s.zIndex = node.style.zIndex;
    }
    
    return s;
  };

  return (
    <div
      ref={nodeRef}
      data-node-id={node.id}
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
      
      {isSelected && !isRoot && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 z-50 pointer-events-none">
          <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
            w: {nodeRef.current ? Math.round(nodeRef.current.offsetWidth) : (layout.width || 'auto')}
          </div>
          <div className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
            h: {nodeRef.current ? Math.round(nodeRef.current.offsetHeight) : (layout.height || 'auto')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasNode;
