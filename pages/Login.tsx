import React, { useState, useEffect } from 'react';
import { Cpu, ArrowRight, Trash2, Clock, Loader2 } from 'lucide-react';
import { useMachine } from '../context/MachineContext';
import { Phone } from 'lucide-react';
import mqtt from 'mqtt';

const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env ? import.meta.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const Login: React.FC = () => {
  const { setMacAddress } = useMachine();
  const [inputMac, setInputMac] = useState('');
  const [error, setError] = useState('');
  const [savedMacs, setSavedMacs] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('savedMacList');
    if (stored) {
      try {
        setSavedMacs(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar MACs salvos', e);
      }
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

  const verifyAndConnect = (mac: string) => {
    if (mac.toLowerCase() === 'demo') {
      setMacAddress('demo');
      return;
    }

    setIsChecking(true);
    setError('');

    const broker = getEnv('VITE_MQTT_BROKER');
    const user = getEnv('VITE_MQTT_USERNAME');
    const pass = getEnv('VITE_MQTT_PASSWORD');

    if (!broker || !user || !pass) {
      setError('Erro de configuração: Credenciais MQTT não encontradas.');
      setIsChecking(false);
      return;
    }

    const client = mqtt.connect(broker, {
      username: user,
      password: pass,
      connectTimeout: 5000,
      clientId: `check_${Math.random().toString(16).substring(2, 10)}`
    });

    const topic = `dispositivo/${mac}/telemetria`;
    let received = false;

    client.on('connect', () => {
      client.subscribe(topic);
    });

    client.on('message', (t) => {
      if (t === topic) {
        received = true;
        client.end();
        saveMacToList(mac);
        setMacAddress(mac);
      }
    });

    client.on('error', () => {
      if (!received) {
        client.end();
        setError('Erro ao conectar ao servidor MQTT.');
        setIsChecking(false);
      }
    });

    setTimeout(() => {
      if (!received) {
        client.end();
        setError('Dispositivo não encontrado ou offline. Verifique se o controlador está ligado.');
        setIsChecking(false);
      }
    }, 4000);
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanMac = inputMac.trim().toUpperCase().replace(/[:-]/g, '');

    if (inputMac.toLowerCase() !== 'demo' && !/^[0-9A-F]{12}$/.test(cleanMac)) {
      setError('Formato inválido. Use 12 caracteres hexadecimais (ex: 48E72999971C ou 48:E7:29:99:97:1C)');
      return;
    }
    
    verifyAndConnect(cleanMac);
  };

  const connectToSavedMac = (mac: string) => {
    verifyAndConnect(mac);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col px-4 py-8 sm:px-6 lg:px-8">
      {/* Content Container - Grows to push footer down */}
      <div className="flex-grow flex flex-col items-center justify-center w-full">
        
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 border border-slate-100 animate-fade-in-down">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/images/company-logo.png" 
                alt="Logo da Empresa" 
                className="h-36 w-auto object-contain"
              />
            </div>

            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Industrial Controller</h1>
            <p className="text-slate-500 mt-2 text-sm">Acesso Seguro ao Sistema</p>
          </div>

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
                    placeholder="48F7299C27B8 "
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
              disabled={isChecking}
              className={`w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center space-x-2 group shadow-lg shadow-indigo-200 active:scale-95 ${isChecking ? 'opacity-75 cursor-wait' : ''}`}
            >
              {isChecking ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Conectar</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                  Insira o endereço MAC do controlador.
              </p>
          </div>

          {savedMacs.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center space-x-2 mb-3">
                <Clock size={16} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Dispositivos Recentes</h3>
              </div>
              <div className="space-y-2">
                {savedMacs.map((mac) => (
                  <div
                    key={mac}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                  >
                    <button
                      disabled={isChecking}
                      onClick={() => connectToSavedMac(mac)}
                      className="flex-1 text-left font-mono text-sm text-slate-700 group-hover:text-indigo-700 font-medium"
                    >
                      {mac}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMac(mac);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-relaxed">
              © {new Date().getFullYear()} METALGIUSTI EQUIPAMENTOS LTDA
              <br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>
              SC-285, KM 1 - Linha Seminário, Turvo - SC • 88930-000
            </p>
            <p className="mt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <Phone size={12} />
              <a
                href="https://wa.me/554899361493"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-indigo-600 transition-colors"
              >
                +55 48 9936-1493
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;