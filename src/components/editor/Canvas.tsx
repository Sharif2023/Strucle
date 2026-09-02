import React, { useState, useRef, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import CanvasNode from './CanvasNode';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const Canvas: React.FC = () => {
  const { rootNode, selectNode, zoom, pan, setViewport, guides } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPanning, setIsPanning] = useState(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        const zoomSensitivity = 0.002;
        const delta = -e.deltaY * zoomSensitivity;
        
        const newZoom = Math.min(Math.max(0.1, zoom * Math.exp(delta)), 5);
        
        // Adjust pan to zoom towards mouse
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        setViewport(newZoom, {
          x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
          y: mouseY - (mouseY - pan.y) * (newZoom / zoom)
        });
      } else {
        // Pan
        setViewport(zoom, {
          x: pan.x - e.deltaX,
          y: pan.y - e.deltaY
        });
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, pan, setViewport]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      lastPointer.current = { x: e.clientX, y: e.clientY };
      containerRef.current?.setPointerCapture(e.pointerId);
    } else if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-bg')) {
      selectNode(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      setViewport(zoom, { x: pan.x + dx, y: pan.y + dy });
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      containerRef.current?.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex-1 overflow-hidden relative outline-none select-none ${isPanning ? 'cursor-grabbing' : 'cursor-auto'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Background Layer with infinite grid */}
      <div 
        className="absolute inset-0 canvas-bg pointer-events-none"
        style={{
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`
        }}
      />
      
      {/* Transform Container Layer */}
      <div 
        id="canvas-container"
        className="absolute origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          width: 0, 
          height: 0
        }}
      >
        <CanvasNode node={rootNode} />
        
        {/* Render Active Guides */}
        {guides?.map((guide, i) => (
          <React.Fragment key={i}>
            <div
              className="absolute bg-fuchsia-500 z-[100]"
              style={{
                ...(guide.type === 'vertical' ? {
                  left: `${guide.position}px`,
                  top: -10000,
                  bottom: -10000,
                  height: 20000,
                  width: '1px',
                } : {
                  top: `${guide.position}px`,
                  left: -10000,
                  right: -10000,
                  width: 20000,
                  height: '1px',
                })
              }}
            />
            {guide.labelX !== undefined && guide.labelY !== undefined && (
              <div 
                className="absolute bg-fuchsia-500 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-[101] font-mono pointer-events-none"
                style={{
                  left: guide.type === 'vertical' ? guide.labelX + 4 : guide.labelX,
                  top: guide.type === 'horizontal' ? guide.labelY + 4 : guide.labelY,
                  transform: guide.type === 'vertical' ? 'translateY(-50%)' : 'translateX(-50%)'
                }}
              >
                {Math.round(guide.position)}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Figma-style zoom controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-lg p-1.5 shadow-xl z-50">
        <button 
          onClick={() => setViewport(Math.max(0.1, zoom - 0.2), pan)} 
          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-xs font-medium text-zinc-300 w-12 text-center select-none">
          {Math.round(zoom * 100)}%
        </span>
        <button 
          onClick={() => setViewport(Math.min(5, zoom + 0.2), pan)} 
          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn size={16} />
        </button>
        <div className="w-px h-4 bg-white/10 mx-1" />
        <button 
          onClick={() => setViewport(1, { x: 100, y: 100 })} 
          className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white transition-colors"
          title="Zoom to 100%"
        >
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
};

export default Canvas;
