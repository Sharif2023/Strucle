import React from 'react';
import { Undo, Redo, Download } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

interface HeaderProps {
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  const { undo, redo, history, historyIndex } = useEditorStore();
  
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="h-14 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-1">
        <img 
          src="/strucle.ico" 
          alt="Strucle Logo" 
          className="w-8 h-8 rounded-xl animate-float object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
        />
        <span className="text-xl tracking-wider font-['Righteous'] animate-pulse-glow ml-1 select-none">STRUCLE</span>
      </div>
      
      <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
        <button 
          onClick={undo}
          disabled={!canUndo}
          className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={16} />
        </button>
        <button 
          onClick={redo}
          disabled={!canRedo}
          className="p-1.5 hover:bg-white/10 rounded-md text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo size={16} />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-1.5 bg-white text-zinc-950 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
        >
          <Download size={14} strokeWidth={2.5} />
          Export
        </button>
      </div>
    </header>
  );
};

export default Header;
