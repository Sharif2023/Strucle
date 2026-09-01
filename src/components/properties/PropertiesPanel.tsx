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
      <aside className="w-64 border-l border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400 p-4 text-center shrink-0">
        <p className="text-sm">Select an element to view and edit its properties.</p>
      </aside>
    );
  }

  const selectedNode = findNode(rootNode, selectedNodeId);
  if (!selectedNode) return null;

  const { layout = { display: 'block' } } = selectedNode;

  return (
    <aside className="w-64 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h2 className="font-semibold text-slate-800 truncate">
          {selectedNode.name || selectedNode.type}
        </h2>
        <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-200 rounded uppercase">{selectedNode.type}</span>
      </div>

      <div className="p-4 border-b border-slate-100 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Dimensions</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Width (px)</label>
            <input 
              type="number" 
              className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={layout.width || ''}
              onChange={(e) => updateNodeLayout(selectedNodeId, { width: parseInt(e.target.value) || undefined })}
              placeholder="auto"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Height (px)</label>
            <input 
              type="number" 
              className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={layout.height || ''}
              onChange={(e) => updateNodeLayout(selectedNodeId, { height: parseInt(e.target.value) || undefined })}
              placeholder="auto"
            />
          </div>
        </div>
      </div>

      {selectedNode.type === 'container' && (
        <div className="p-4 border-b border-slate-100 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Layout</h3>
          
          <div>
            <label className="block text-xs text-slate-500 mb-1">Display</label>
            <select 
              className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
                <label className="block text-xs text-slate-500 mb-1">Direction</label>
                <select 
                  className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 outline-none"
                  value={layout.flexDirection || 'row'}
                  onChange={(e) => updateNodeLayout(selectedNodeId, { flexDirection: e.target.value as any })}
                >
                  <option value="row">Row</option>
                  <option value="column">Column</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-slate-500 mb-1">Justify Content</label>
                <select 
                  className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 outline-none"
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
                <label className="block text-xs text-slate-500 mb-1">Align Items</label>
                <select 
                  className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 outline-none"
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
                <label className="block text-xs text-slate-500 mb-1">Columns</label>
                <input 
                  type="number" min="1" max="12"
                  className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 outline-none"
                  value={layout.gridColumns || 1}
                  onChange={(e) => updateNodeLayout(selectedNodeId, { gridColumns: parseInt(e.target.value) || 1 })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-slate-500 mb-1">Gap (px)</label>
            <input 
              type="number" min="0" step="4"
              className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 outline-none"
              value={layout.gap ?? 0}
              onChange={(e) => updateNodeLayout(selectedNodeId, { gap: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      )}
      
      <div className="p-4 border-b border-slate-100">
        <label className="block text-xs text-slate-500 mb-1">Name / ID</label>
        <input 
          type="text" 
          className="w-full text-sm p-1.5 border border-slate-200 rounded focus:border-blue-500 outline-none"
          value={selectedNode.name || ''}
          onChange={(e) => updateNode(selectedNodeId, { name: e.target.value })}
        />
      </div>
    </aside>
  );
};

export default PropertiesPanel;
