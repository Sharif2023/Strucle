import { useState } from 'react'
import Header from './components/editor/Header'
import Sidebar from './components/sidebar/Sidebar'
import PropertiesPanel from './components/properties/PropertiesPanel'
import Canvas from './components/editor/Canvas'
import ExportDialog from './components/export/ExportDialog'

function App() {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900">
      <Header onExport={() => setExportOpen(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 relative bg-slate-100 overflow-hidden flex flex-col">
          <Canvas />
        </main>
        
        <PropertiesPanel />
      </div>

      {exportOpen && <ExportDialog onClose={() => setExportOpen(false)} />}
    </div>
  )
}

export default App
