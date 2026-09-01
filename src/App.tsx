import { useState } from 'react'
import Header from './components/editor/Header'
import Sidebar from './components/sidebar/Sidebar'
import PropertiesPanel from './components/properties/PropertiesPanel'
import Canvas from './components/editor/Canvas'
import ExportDialog from './components/export/ExportDialog'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const [exportOpen, setExportOpen] = useState(false);
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">
      <Header onExport={() => setExportOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-1 relative bg-black/40 canvas-bg overflow-hidden flex flex-col shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]">
          <Canvas />
        </main>
        
        <PropertiesPanel />
      </div>

      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  )
}

export default App
