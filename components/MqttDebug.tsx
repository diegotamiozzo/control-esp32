import React, { useState } from 'react';
import { Bug, ChevronDown } from 'lucide-react';
import { useMachine } from '../context/MachineContext';

const MqttDebug: React.FC = () => {
  const { state } = useMachine();
  const [isOpen, setIsOpen] = useState(false);

  const getEnv = (key: string) => {
    try {
      return import.meta.env ? import.meta.env[key] : undefined;
    } catch {
      return undefined;
    }
  };

  const MQTT_USER = getEnv('VITE_MQTT_USERNAME') || 'não configurado';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 transition-all"
        title="Debug MQTT"
      >
        <Bug size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 flex items-center space-x-2">
              <Bug size={18} />
              <span>Debug MQTT</span>
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <p className="font-semibold text-slate-600 mb-1">Status:</p>
              <span
                className={`px-2 py-1 rounded ${
                  state.mqttConnected
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {state.mqttConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>

            <div>
              <p className="font-semibold text-slate-600 mb-1">Usuário:</p>
              <p className="font-mono bg-slate-50 p-2 rounded">
                {MQTT_USER}
              </p>
            </div>

            <div>
              <p className="font-semibold text-slate-600 mb-1">MAC Address:</p>
              <p className="font-mono bg-slate-50 p-2 rounded">
                {state.macAddress || 'não definido'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MqttDebug;
