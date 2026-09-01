import React from 'react';
import { Undo, Redo, Download, LayoutTemplate } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface HeaderProps {
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  const { undo, redo, history, historyIndex } = useEditorStore();
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <LayoutTemplate size={18} />
        </div>
        <span className="font-bold text-lg tracking-tight">structly</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={18} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className="p-2 hover:bg-slate-100 rounded text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={18} />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Download size={16} />
          Export
        </button>
      </div>
    </header>
  );
};

export default Header;
