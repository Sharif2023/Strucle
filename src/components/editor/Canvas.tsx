import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import CanvasNode from './CanvasNode';

const Canvas: React.FC = () => {
  const { rootNode, selectNode } = useEditorStore();
  
  return (
    <div 
      className="flex-1 overflow-auto bg-slate-100 canvas-bg p-8"
      onClick={() => selectNode(null)}
    >
      <div className="flex justify-center min-h-full min-w-full">
        <CanvasNode node={rootNode} />
      </div>
    </div>
  );
};

export default Canvas;
