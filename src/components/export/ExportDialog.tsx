import React, { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { generateNextPage } from '../../generators/tailwindGenerator';

const ExportDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { rootNode } = useEditorStore();
  const [framework, setFramework] = useState('react-tailwind');
  
  const getGeneratedCode = () => {
    if (framework === 'react-tailwind') {
      return generateNextPage(rootNode);
    }
    return '// Other generators coming soon...';
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getGeneratedCode());
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Export Code</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-md shadow-sm border border-slate-200">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-slate-200 p-4 bg-slate-50 flex flex-col gap-2 shrink-0 overflow-y-auto">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Framework</div>
            
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${framework === 'html-css' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="framework" className="hidden" checked={framework === 'html-css'} onChange={() => setFramework('html-css')} />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${framework === 'html-css' ? 'border-blue-500' : 'border-slate-300'}`}>
                {framework === 'html-css' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <span className="font-medium text-sm">HTML + CSS</span>
            </label>
            
            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${framework === 'react-tailwind' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <input type="radio" name="framework" className="hidden" checked={framework === 'react-tailwind'} onChange={() => setFramework('react-tailwind')} />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${framework === 'react-tailwind' ? 'border-blue-500' : 'border-slate-300'}`}>
                {framework === 'react-tailwind' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
              </div>
              <span className="font-medium text-sm">React + Tailwind</span>
            </label>
          </div>
          
          <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap break-words">
                <code>{getGeneratedCode()}</code>
              </pre>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg transition-colors">Close</button>
          <button onClick={copyCode} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;
