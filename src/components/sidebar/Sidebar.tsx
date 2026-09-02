import React, { useState } from 'react';
import { Box, Columns, Type, Image, SquareSquare } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { LayerTree } from './LayerTree';

const Sidebar: React.FC = () => {
  const { addNode, selectedNodeIds, rootNode } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'elements' | 'structure'>('elements');
  
  // Use root node as default parent if nothing is selected
  const parentId = selectedNodeIds.length > 0 ? selectedNodeIds[selectedNodeIds.length - 1] : rootNode.id;

  const elements = [
    { type: 'container', icon: Columns, label: 'Container', desc: 'Flex/Grid structural box' },
    { type: 'box', icon: Box, label: 'Box', desc: 'Basic block element' },
    { type: 'text', icon: Type, label: 'Text', desc: 'Text placeholder' },
    { type: 'image', icon: Image, label: 'Image', desc: 'Image placeholder' },
    { type: 'button', icon: SquareSquare, label: 'Button', desc: 'Button placeholder' },
  ] as const;

  return (
    <aside className="w-64 border-r border-white/5 bg-zinc-950/80 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden z-40">
      <div className="flex border-b border-white/5 shrink-0 p-2 gap-1 bg-black/20">
        <button 
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'elements' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          onClick={() => setActiveTab('elements')}
        >
          Elements
        </button>
        <button 
          className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'structure' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
          onClick={() => setActiveTab('structure')}
        >
          Layers
        </button>
      </div>

      {activeTab === 'elements' ? (
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-2">
            {elements.map((el) => (
              <button
                key={el.type}
                onClick={() => addNode(parentId, el.type)}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all text-left group"
              >
                <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-indigo-500/20 group-hover:text-indigo-400 text-zinc-400 transition-all border border-white/5">
                  <el.icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-200">{el.label}</div>
                  <div className="text-[10px] text-zinc-500 leading-tight mt-0.5">{el.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <LayerTree />
      )}
    </aside>
  );
};

export default Sidebar;
