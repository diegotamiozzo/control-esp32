import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Sliders, Wrench, X, LogOut, Activity } from 'lucide-react';
import { useMachine } from '../context/MachineContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { disconnect } = useMachine();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/settings', label: 'Parâmetros', icon: Sliders },
    { path: '/test-mode', label: 'Modo de Teste', icon: Wrench },
  ];

  const handleLogout = () => {
    disconnect();
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Activity className="text-white" size={20} />
            </div>
            <span className="font-bold text-lg tracking-wide text-slate-100">SYS CONTROL</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8 px-4 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 border group
                ${isActive || (item.path === '/' && location.pathname === '/')
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/20' 
                  : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              {({ isActive }) => {
                const active = isActive || (item.path === '/' && location.pathname === '/');
                return (
                  <>
                    <item.icon size={20} className={active ? 'text-white' : 'group-hover:text-indigo-400'} />
                    <span className="font-medium">{item.label}</span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-rose-900/30 hover:text-rose-400 hover:border-rose-900/50 rounded-xl transition-colors duration-200"
          >
            <LogOut size={18} />
            <span>Desconectar</span>
          </button>
          <p className="mt-4 text-xs text-center text-slate-600">v1.0.0 Control Panel</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;