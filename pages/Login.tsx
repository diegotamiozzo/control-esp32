import React, { useEffect, useState } from 'react';
import { Cpu, ArrowRight, Trash2, Clock, Phone } from 'lucide-react';

// ================================
// Utilidades
// ================================
const normalizeMac = (v: string) => v.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 12);
const formatMac = (v: string) => normalizeMac(v).replace(/(.{2})(?=.)/g, '$1:');
const isValidMac = (v: string) => /^[0-9A-F]{12}$/.test(normalizeMac(v));

// ================================
// Componente
// ================================
const Login: React.FC = () => {
  const [macAddress, setMacAddress] = useState('');
  const [inputMac, setInputMac] = useState('');
  const [error, setError] = useState('');
  const [savedMacs, setSavedMacs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('savedMacList');
    if (stored) {
      try {
        setSavedMacs(JSON.parse(stored));
      } catch {}
    }
  }, []);

  const saveMacToList = (mac: string) => {
    if (!savedMacs.includes(mac)) {
      const newList = [mac, ...savedMacs].slice(0, 5);
      setSavedMacs(newList);
      localStorage.setItem('savedMacList', JSON.stringify(newList));
    }
  };

  const removeMac = (mac: string) => {
    const newList = savedMacs.filter(m => m !== mac);
    setSavedMacs(newList);
    localStorage.setItem('savedMacList', JSON.stringify(newList));
  };

  const handleConnect = async () => {
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 300));

    const clean = normalizeMac(inputMac);
    if (isValidMac(clean)) {
      saveMacToList(clean);
      setMacAddress(clean);
    } else {
      setError('Use 12 caracteres hexadecimais (ex.: 48:E7:29:99:97:1C)');
    }
    setLoading(false);
  };

  const connectToSavedMac = (mac: string) => setMacAddress(mac);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="w-full h-32 flex items-center justify-center mb-6">
            <img
              src="/images/company-logo.png"
              alt="Logo da Empresa"
              className="max-h-24 max-w-[90%] object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Industrial Controller</h1>
          <p className="text-slate-500 mt-1 text-sm">Acesso seguro ao sistema</p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label htmlFor="mac" className="block text-sm font-medium text-slate-700 mb-2">
              Identificação do Dispositivo (MAC)
            </label>
            <div className="relative">
              <input
                id="mac"
                type="text"
                autoComplete="off"
                value={formatMac(inputMac)}
                onChange={(e) => {
                  setInputMac(normalizeMac(e.target.value));
                  setError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConnect();
                }}
                className="w-full px-4 py-3.5 pl-11 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono uppercase text-slate-800 bg-slate-50"
              />
              <div className="absolute left-3 top-3.5 text-slate-400">
                <Cpu size={20} />
              </div>
            </div>

            {error && (
              <p className="mt-2 text-sm text-rose-600 font-medium bg-rose-50 p-2 rounded">
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-indigo-600 disabled:opacity-70 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95"
          >
            {loading ? 'Conectando…' : 'Conectar'}
            <ArrowRight size={18} />
          </button>
        </div>

        {savedMacs.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-700">Dispositivos recentes</h3>
            </div>
            <div className="space-y-2">
              {savedMacs.map((mac) => (
                <div
                  key={mac}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition"
                >
                  <button
                    onClick={() => connectToSavedMac(mac)}
                    className="flex-1 text-left font-mono text-sm text-slate-700 hover:text-indigo-700 font-medium"
                  >
                    {mac}
                  </button>
                  <button
                    onClick={() => removeMac(mac)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    aria-label="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer dentro do card */}
        <div className="mt-6 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} METALGIUSTI EQUIPAMENTOS LTDA</p>
          <p className="mt-1">SC-285, KM 1 - Linha Seminário, Turvo - SC</p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <Phone size={14} />
            <a
              href="https://wa.me/554899361493"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800"
            >
              +55 48 9936-1493
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;