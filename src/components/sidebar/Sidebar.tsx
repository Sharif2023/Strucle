import React from 'react';
import { Box, Columns, Type, Image, SquareSquare } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

const Sidebar: React.FC = () => {
  const { addNode, selectedNodeId, rootNode } = useEditorStore();
  
  // Use root node as default parent if nothing is selected
  const parentId = selectedNodeId || rootNode.id;

  const elements = [
    { type: 'container', icon: Columns, label: 'Container', desc: 'Flex/Grid structural box' },
    { type: 'box', icon: Box, label: 'Box', desc: 'Basic block element' },
    { type: 'text', icon: Type, label: 'Text', desc: 'Text placeholder' },
    { type: 'image', icon: Image, label: 'Image', desc: 'Image placeholder' },
    { type: 'button', icon: SquareSquare, label: 'Button', desc: 'Button placeholder' },
  ] as const;

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Add Elements</h2>
        <div className="flex flex-col gap-2">
          {elements.map((el) => (
            <button
              key={el.type}
              onClick={() => addNode(parentId, el.type)}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
            >
              <div className="p-2 bg-slate-100 rounded group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <el.icon size={18} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">{el.label}</div>
                <div className="text-xs text-slate-500">{el.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
