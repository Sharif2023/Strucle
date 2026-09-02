import React from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { LayoutNode } from '../../model/types';

const findNode = (node: LayoutNode, id: string): LayoutNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
};

const PropertiesPanel: React.FC = () => {
  const { selectedNodeIds, rootNode, updateNodeLayout, updateNode } = useEditorStore();
  
  if (selectedNodeIds.length === 0) {
    return (
      <aside className="w-64 border-l border-white/5 bg-zinc-950/80 flex flex-col items-center justify-center text-zinc-500 p-4 text-center shrink-0 z-40">
        <p className="text-sm">Select an element to view and edit its properties.</p>
      </aside>
    );
  }

  if (selectedNodeIds.length > 1) {
    return (
      <aside className="w-64 border-l border-white/5 bg-zinc-950/80 flex flex-col shrink-0 overflow-y-auto z-40">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <h2 className="font-semibold text-zinc-200 truncate">
            Multiple Selection
          </h2>
          <span className="text-[10px] font-bold text-zinc-500 px-2 py-0.5 bg-white/5 rounded-md uppercase tracking-wider">{selectedNodeIds.length} ITEMS</span>
        </div>

        <div className="p-4 border-b border-white/5 space-y-4">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Group Options</h3>
          <p className="text-xs text-zinc-400 mb-2">Combine selected elements into a single movable, resizable container.</p>
          <button 
            onClick={() => useEditorStore.getState().groupNodes(selectedNodeIds)}
            className="w-full py-1.5 bg-indigo-600 border border-indigo-500 rounded-lg text-xs font-medium text-white hover:bg-indigo-500 transition-all"
          >
            Group Selection
          </button>
        </div>
      </aside>
    );
  }

  const selectedNodeId = selectedNodeIds[0];

  const selectedNode = findNode(rootNode, selectedNodeId);
  if (!selectedNode) return null;

  const { layout = { display: 'block' } } = selectedNode;

  return (
    <aside className="w-64 border-l border-white/5 bg-zinc-950/80 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto z-40">
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <h2 className="font-semibold text-zinc-200 truncate">
          {selectedNode.name || selectedNode.type}
        </h2>
        <span className="text-[10px] font-bold text-zinc-500 px-2 py-0.5 bg-white/5 rounded-md uppercase tracking-wider">{selectedNode.type}</span>
      </div>

      <div className="p-4 border-b border-white/5 space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Dimensions</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Width (px)</label>
            <input 
              type="number" 
              className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-zinc-200 transition-all placeholder:text-zinc-600"
              value={layout.width || ''}
              onChange={(e) => updateNodeLayout(selectedNodeId, { width: parseInt(e.target.value) || undefined })}
              placeholder="auto"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Height (px)</label>
            <input 
              type="number" 
              className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none text-zinc-200 transition-all placeholder:text-zinc-600"
              value={layout.height || ''}
              onChange={(e) => updateNodeLayout(selectedNodeId, { height: parseInt(e.target.value) || undefined })}
              placeholder="auto"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-white/5 space-y-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Layer Order</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => useEditorStore.getState().moveUp([selectedNodeId])}
            className="flex-1 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            Bring Forward
          </button>
          <button 
            onClick={() => useEditorStore.getState().moveDown([selectedNodeId])}
            className="flex-1 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            Send Backward
          </button>
        </div>
      </div>

      {/* Layout section hidden as requested by user since elements are freely movable. */}
      
      <div className="p-4 border-b border-white/5">
        <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Name / ID</label>
        <input 
          type="text" 
          className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
          value={selectedNode.name || ''}
          onChange={(e) => updateNode(selectedNodeId, { name: e.target.value })}
        />
      </div>

      {selectedNode.id !== 'root' && (
        <div className="p-4 mt-auto">
          <button 
            onClick={() => useEditorStore.getState().deleteNodes([selectedNodeId])}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold hover:bg-red-500/20 transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
            Delete Element
          </button>
        </div>
      )}
    </aside>
  );
};

export default PropertiesPanel;
