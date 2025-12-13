import React from 'react';
import { useMachine } from '../context/MachineContext';
import { Thermometer, Droplets, Wifi, WifiOff } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { state } = useMachine();
  const { inputs, params, mqttConnected } = state;

  const tempPercentage = Math.min(100, Math.max(0, (inputs.i6_temp_sensor / 100) * 100));
  const humPercentage = Math.min(100, Math.max(0, inputs.umidade_sensor));

  const isTempOk = Math.abs(inputs.i6_temp_sensor - params.sp_temp) <= params.hist_temp;
  const isHumOk = Math.abs(inputs.umidade_sensor - params.sp_umid) <= params.hist_umid;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Monitoramento DHT11</h2>
          <p className="text-sm text-slate-500">Temperatura e umidade em tempo real</p>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          mqttConnected
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-500 border border-slate-200'
        }`}>
          {mqttConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{mqttConnected ? 'Conectado' : 'Desconectado'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 relative overflow-hidden transition-all hover:shadow-md group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 md:p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Thermometer size={24} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800">Temperatura</h3>
                <p className="text-xs md:text-sm text-slate-500">DHT11 Sensor</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Setpoint</p>
              <p className="text-lg md:text-xl font-bold text-orange-600 leading-none">{params.sp_temp}°C</p>
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between mb-2">
            <span className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
              {inputs.i6_temp_sensor.toFixed(1)}
              <span className="text-xl md:text-2xl text-slate-400 ml-1">°C</span>
            </span>
          </div>

          <div className="relative z-10 w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${tempPercentage}%` }}
            ></div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs md:text-sm text-slate-500">Status:</span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              isTempOk
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isTempOk ? 'NORMAL' : 'FORA DO RANGE'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 relative overflow-hidden transition-all hover:shadow-md group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

          <div className="relative z-10 flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 md:p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Droplets size={24} />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-slate-800">Umidade</h3>
                <p className="text-xs md:text-sm text-slate-500">DHT11 Sensor</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">Setpoint</p>
              <p className="text-lg md:text-xl font-bold text-blue-600 leading-none">{params.sp_umid}%</p>
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between mb-2">
            <span className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
              {inputs.umidade_sensor.toFixed(1)}
              <span className="text-xl md:text-2xl text-slate-400 ml-1">%</span>
            </span>
          </div>

          <div className="relative z-10 w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${humPercentage}%` }}
            ></div>
          </div>

          <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs md:text-sm text-slate-500">Status:</span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              isHumOk
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isHumOk ? 'NORMAL' : 'FORA DO RANGE'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl p-5 md:p-6 border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Informações do Sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Dispositivo</p>
            <p className="text-sm font-mono font-medium text-slate-800">{state.macAddress}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Histerese Temp</p>
            <p className="text-sm font-medium text-slate-800">±{params.hist_temp}°C</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Histerese Umid</p>
            <p className="text-sm font-medium text-slate-800">±{params.hist_umid}%</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">Última atualização</p>
            <p className="text-sm font-medium text-slate-800">{new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;