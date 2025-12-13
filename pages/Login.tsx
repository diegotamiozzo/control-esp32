import React, { useState } from 'react';
import { Cpu, ArrowRight, Building2 } from 'lucide-react';
import { useMachine } from '../context/MachineContext';

const Login: React.FC = () => {
  const { setMacAddress } = useMachine();
  const [inputMac, setInputMac] = useState('');
  const [error, setError] = useState('');

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMac = inputMac.trim().toUpperCase().replace(/[:-]/g, '');

    if (inputMac.toLowerCase() === 'demo') {
      setMacAddress('demo');
    } else if (/^[0-9A-F]{12}$/.test(cleanMac)) {
      setMacAddress(cleanMac);
    } else {
      setError('Formato inválido. Use 12 caracteres hexadecimais (ex: 48E72999971C ou 48:E7:29:99:97:1C)');
    }
  };

  const quickConnect = (mac: string) => {
    setInputMac(mac);
    setMacAddress(mac);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col px-4 py-8 sm:px-6 lg:px-8">
      {/* Content Container - Grows to push footer down */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        
        <div className="mb-8 text-center animate-fade-in-down w-full max-w-md">
          {/* Área reservada para o logo da empresa */}
          <div className="w-full h-40 bg-white rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center mb-8 shadow-sm group hover:border-indigo-400 transition-colors">
              <div className="bg-slate-100 p-4 rounded-full mb-3 group-hover:bg-indigo-50 transition-colors">
                  <Building2 size={40} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </div>
              <span className="text-slate-400 font-bold text-sm tracking-widest group-hover:text-indigo-400">LOGO DA EMPRESA</span>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Industrial Controller</h1>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Acesso Seguro ao Sistema</p>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 border border-slate-100">
          <form onSubmit={handleConnect} className="space-y-6">
            <div>
              <label htmlFor="mac" className="block text-sm font-medium text-slate-700 mb-2">
                Identificação do Dispositivo (MAC)
              </label>
              <div className="relative">
                <input
                    id="mac"
                    type="text"
                    value={inputMac}
                    onChange={(e) => {
                        setInputMac(e.target.value);
                        setError('');
                    }}
                    placeholder="Ex: 24:6F:28:A1:B2:C3"
                    className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono uppercase text-slate-800 bg-slate-50 text-base"
                />
                <div className="absolute left-3 top-3.5 text-slate-400">
                    <Cpu size={20} />
                </div>
              </div>
              {error && <p className="mt-2 text-sm text-rose-600 font-medium bg-rose-50 p-2 rounded">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 group shadow-lg shadow-indigo-200 active:scale-95"
            >
              <span>Conectar</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 space-y-3">
              <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white text-slate-400">Acesso Rápido</span>
                  </div>
              </div>

              <button
                  type="button"
                  onClick={() => quickConnect('48E72999971C')}
                  className="w-full py-2.5 px-4 rounded-lg border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center justify-between group"
              >
                  <span className="flex items-center space-x-2">
                      <Cpu size={16} className="text-slate-400 group-hover:text-indigo-500" />
                      <span>Meu ESP32</span>
                  </span>
                  <span className="font-mono text-xs text-slate-400 group-hover:text-indigo-400">48E72999971C</span>
              </button>

              <p className="text-xs text-slate-400 text-center pt-2">
                  Insira o endereço MAC do controlador ESP32 (com ou sem dois pontos).
              </p>
          </div>
        </div>
      </div>

      {/* Footer - Relative positioning to avoid keyboard overlap on mobile */}
      <footer className="w-full py-4 text-center mt-8">
        <p className="text-slate-400 text-xs">Simulador Industrial v1.0 • React + Tailwind</p>
      </footer>
    </div>
  );
};

export default Login;