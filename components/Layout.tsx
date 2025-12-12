import React, { useState } from 'react';
import { Menu, Wifi, WifiOff, Server, ServerOff } from 'lucide-react';
import { useMachine } from '../context/MachineContext';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { state } = useMachine();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 h-16 px-4 md:px-8 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-3 md:space-x-4">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors active:bg-slate-200"
            aria-label="Abrir Menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight leading-tight">
              Painel <span className="hidden xs:inline">Industrial</span>
            </h1>
            <p className="text-[10px] md:text-xs text-slate-400 font-mono hidden xs:block">
              ID: {state.macAddress?.slice(-8) || '---'}
            </p>
          </div>
        </div>

        {/* Status Indicators - Simplified for very small screens */}
        <div className="flex items-center space-x-2 md:space-x-3">
            <div className={`flex items-center space-x-1.5 md:space-x-2 px-2 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold border transition-colors shadow-sm ${
                state.isConnected 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
                {state.isConnected ? <Wifi size={14} className="text-emerald-500" /> : <WifiOff size={14} />}
                <span className="hidden sm:inline">{state.isConnected ? 'Online' : 'Offline'}</span>
            </div>

            <div className={`flex items-center space-x-1.5 md:space-x-2 px-2 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold border transition-colors shadow-sm ${
                state.mqttConnected 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}>
                {state.mqttConnected ? <Server size={14} className="text-indigo-500" /> : <ServerOff size={14} />}
                <span className="hidden sm:inline">MQTT</span>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6 md:px-8 max-w-7xl">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-xs text-slate-400">
            <p>© 2024 Industrial Systems Co.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;