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
  const { selectedNodeId, rootNode, updateNodeLayout, updateNode } = useEditorStore();
  
  if (!selectedNodeId) {
    return (
      <aside className="w-64 border-l border-white/5 bg-zinc-950/80 flex flex-col items-center justify-center text-zinc-500 p-4 text-center shrink-0 z-40">
        <p className="text-sm">Select an element to view and edit its properties.</p>
      </aside>
    );
  }

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
            onClick={() => useEditorStore.getState().updateNode(selectedNodeId, { style: { ...selectedNode.style, zIndex: (selectedNode.style?.zIndex || 0) + 1 } })}
            className="flex-1 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            Bring Forward
          </button>
          <button 
            onClick={() => useEditorStore.getState().updateNode(selectedNodeId, { style: { ...selectedNode.style, zIndex: (selectedNode.style?.zIndex || 0) - 1 } })}
            className="flex-1 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all"
          >
            Send Backward
          </button>
        </div>
      </div>

      {selectedNode.type === 'container' && (
        <div className="p-4 border-b border-white/5 space-y-4">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Layout</h3>
          
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Display</label>
            <select 
              className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
              value={layout.display}
              onChange={(e) => updateNodeLayout(selectedNodeId, { display: e.target.value as any })}
            >
              <option value="flex">Flex</option>
              <option value="grid">Grid</option>
              <option value="block">Block</option>
            </select>
          </div>

          {layout.display === 'flex' && (
            <>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Direction</label>
                <select 
                  className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
                  value={layout.flexDirection || 'row'}
                  onChange={(e) => updateNodeLayout(selectedNodeId, { flexDirection: e.target.value as any })}
                >
                  <option value="row">Row</option>
                  <option value="column">Column</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Justify Content</label>
                <select 
                  className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
                  value={layout.justifyContent || 'start'}
                  onChange={(e) => updateNodeLayout(selectedNodeId, { justifyContent: e.target.value as any })}
                >
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                  <option value="space-between">Space Between</option>
                  <option value="space-around">Space Around</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Align Items</label>
                <select 
                  className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
                  value={layout.alignItems || 'stretch'}
                  onChange={(e) => updateNodeLayout(selectedNodeId, { alignItems: e.target.value as any })}
                >
                  <option value="stretch">Stretch</option>
                  <option value="start">Start</option>
                  <option value="center">Center</option>
                  <option value="end">End</option>
                </select>
              </div>
            </>
          )}

          {layout.display === 'grid' && (
            <>
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Columns</label>
                <input 
                  type="number" min="1" max="12"
                  className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
                  value={layout.gridColumns || 1}
                  onChange={(e) => updateNodeLayout(selectedNodeId, { gridColumns: parseInt(e.target.value) || 1 })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] text-zinc-400 mb-1 font-medium">Gap (px)</label>
            <input 
              type="number" min="0" step="4"
              className="w-full text-xs px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg focus:border-indigo-500 outline-none text-zinc-200"
              value={layout.gap ?? 0}
              onChange={(e) => updateNodeLayout(selectedNodeId, { gap: parseInt(e.target.value) || 0 })}
            />
          </div>

          <button 
            onClick={() => {
              if (selectedNode.children && selectedNode.children.length > 0) {
                // Determine row vs col based on average overlaps
                const isRow = selectedNode.children.every((c, i, arr) => {
                  if (i === 0) return true;
                  return Math.abs((c.position?.y || 0) - (arr[0].position?.y || 0)) < 40;
                });
                
                const sortedChildren = [...selectedNode.children].sort((a, b) => {
                  const ay = a.position?.y ?? 0;
                  const by = b.position?.y ?? 0;
                  const ax = a.position?.x ?? 0;
                  const bx = b.position?.x ?? 0;
                  return isRow ? ax - bx : (Math.abs(ay - by) > 20 ? ay - by : ax - bx);
                }).map(child => ({ ...child, position: undefined }));

                useEditorStore.getState().updateNode(selectedNodeId, { 
                  layout: { ...selectedNode.layout, display: 'flex', flexDirection: isRow ? 'row' : 'column', gap: 16 },
                  children: sortedChildren as LayoutNode[]
                });
              }
            }}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold hover:from-indigo-500/30 hover:to-purple-600/30 transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)] hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 4h16M8 8v12"/></svg>
            Auto Group Layout
          </button>
        </div>
      )}
      
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
            onClick={() => useEditorStore.getState().deleteNode(selectedNodeId)}
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
