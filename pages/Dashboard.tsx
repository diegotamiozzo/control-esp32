import React from 'react';
import { useMachine } from '../context/MachineContext';
import { Thermometer, Droplets, Power, Zap, ShieldAlert, Fan, Wind, CirclePlay, CircleStop, CircleCheck, TriangleAlert } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { state } = useMachine();
  const { inputs, outputs, params } = state;

  // Derived states for UI
  const isSystemOn = inputs.i1_habilitacao;
  const isPowerOn = inputs.i3_energia; // True = OK, False = Fail
  const isAlarmActive = outputs.q7_alarme;

  const tempPercentage = Math.min(100, Math.max(0, (inputs.i6_temp_sensor / 100) * 100));
  const humPercentage = Math.min(100, Math.max(0, inputs.umidade_sensor));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">Visão Geral</h2>
            <p className="text-sm text-slate-500">Monitoramento em tempo real</p>
        </div>
      </div>

      {/* Main Sensors Grid - Side by Side on MD and up */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Temperature Card - Indigo Theme */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 relative overflow-hidden transition-all hover:shadow-md group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 md:p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Thermometer size={24} />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800">Temperatura</h3>
                        <p className="text-xs md:text-sm text-slate-500">Sensor I6</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Setpoint</p>
                    <p className="text-lg md:text-xl font-bold text-indigo-600 leading-none">{params.sp_temp}°{params.temp_unit}</p>
                </div>
            </div>

            <div className="relative z-10 flex items-end justify-between mb-2">
                 <span className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                    {inputs.i6_temp_sensor.toFixed(1)}
                    <span className="text-xl md:text-2xl text-slate-400 ml-1">°{params.temp_unit}</span>
                 </span>
            </div>
            
            {/* Progress Bar - Indigo */}
            <div className="relative z-10 w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                <div 
                    className="bg-indigo-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${tempPercentage}%` }}
                ></div>
            </div>

            {/* Status Footer */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm text-slate-500">Ventoinha (Q4):</span>
                    <span className={`px-2 py-0.5 text-[10px] md:text-xs font-bold rounded ${
                        outputs.q4_ventoinha 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                        {outputs.q4_ventoinha ? 'LIGADO' : 'DESLIGADO'}
                    </span>
                </div>
                {outputs.q4_ventoinha ? <Fan size={20} className="text-emerald-500 animate-spin" /> : <Fan size={20} className="text-slate-200" />}
            </div>
        </div>

        {/* Humidity Card - Cyan/Sky Theme */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 relative overflow-hidden transition-all hover:shadow-md group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                    <div className="p-2.5 md:p-3 bg-cyan-50 text-cyan-600 rounded-xl">
                        <Droplets size={24} />
                    </div>
                    <div>
                        <h3 className="text-base md:text-lg font-bold text-slate-800">Umidade</h3>
                        <p className="text-xs md:text-sm text-slate-500">Sensor Local</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 font-medium">Setpoint</p>
                    <p className="text-lg md:text-xl font-bold text-cyan-600 leading-none">{params.sp_umid}%</p>
                </div>
            </div>

            <div className="relative z-10 flex items-end justify-between mb-2">
                 <span className="text-4xl md:text-5xl font-bold text-slate-800 tracking-tight">
                    {inputs.umidade_sensor.toFixed(1)}
                    <span className="text-xl md:text-2xl text-slate-400 ml-1">%</span>
                 </span>
            </div>
            
            {/* Progress Bar - Cyan */}
            <div className="relative z-10 w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden">
                <div 
                    className="bg-cyan-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${humPercentage}%` }}
                ></div>
            </div>

            {/* Status Footer */}
            <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm text-slate-500">Damper (Q6):</span>
                    <span className={`px-2 py-0.5 text-[10px] md:text-xs font-bold rounded ${
                        outputs.q6_damper 
                        ? 'bg-cyan-100 text-cyan-700' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                        {outputs.q6_damper ? 'ABERTO' : 'FECHADO'}
                    </span>
                </div>
                {outputs.q6_damper ? <Wind size={20} className="text-cyan-600" /> : <Wind size={20} className="text-slate-200" />}
            </div>
        </div>
      </div>

      {/* Estados Gerais do Sistema */}
      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Estados Gerais do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* 1. Sistema (I1) - Emerald for Active */}
          <div className={`p-5 md:p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
              isSystemOn 
              ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-200' 
              : 'bg-white border-slate-200'
          }`}>
              <div className="flex items-center space-x-4">
                  <div className={`p-2.5 md:p-3 rounded-full ${isSystemOn ? 'bg-emerald-600/30 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Power size={24} />
                  </div>
                  <div>
                      <p className={`text-xs md:text-sm font-medium ${isSystemOn ? 'text-emerald-50' : 'text-slate-500'}`}>Sistema (I1)</p>
                      <h4 className={`text-base md:text-lg font-bold ${isSystemOn ? 'text-white' : 'text-slate-700'}`}>
                          {isSystemOn ? 'LIGADO' : 'DESLIGADO'}
                      </h4>
                  </div>
              </div>
              <div className={isSystemOn ? 'text-white/80' : 'text-slate-200'}>
                  {isSystemOn ? <CirclePlay size={28} className="md:w-8 md:h-8" /> : <CircleStop size={28} className="md:w-8 md:h-8" />}
              </div>
          </div>

          {/* 2. Energia (I3) - Rose for Failure */}
          <div className={`p-5 md:p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
              isPowerOn 
              ? 'bg-white border-slate-200' 
              : 'bg-rose-500 border-rose-600 text-white shadow-rose-200' // Red for critical failure
          }`}>
              <div className="flex items-center space-x-4">
                  <div className={`p-2.5 md:p-3 rounded-full ${isPowerOn ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-700 text-white'}`}>
                      <Zap size={24} />
                  </div>
                  <div>
                      <p className={`text-xs md:text-sm font-medium ${isPowerOn ? 'text-slate-500' : 'text-rose-100'}`}>Energia (I3)</p>
                      <h4 className={`text-base md:text-lg font-bold ${isPowerOn ? 'text-emerald-700' : 'text-white'}`}>
                          {isPowerOn ? 'NORMAL' : 'FALHA CRÍTICA'}
                      </h4>
                  </div>
              </div>
              <div className={isPowerOn ? 'text-emerald-200' : 'text-white animate-pulse'}>
                  {isPowerOn ? <CircleCheck size={28} className="md:w-8 md:h-8" /> : <TriangleAlert size={28} className="md:w-8 md:h-8" />}
              </div>
          </div>

          {/* 3. Alarmes (Q7) - Rose for Active */}
          <div className={`p-5 md:p-6 rounded-2xl border shadow-sm flex items-center justify-between transition-all ${
              !isAlarmActive 
              ? 'bg-white border-slate-200' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
              <div className="flex items-center space-x-4">
                  <div className={`p-2.5 md:p-3 rounded-full ${!isAlarmActive ? 'bg-slate-100 text-slate-400' : 'bg-rose-100 text-rose-600'}`}>
                      <ShieldAlert size={24} />
                  </div>
                  <div>
                      <p className={`text-xs md:text-sm font-medium ${!isAlarmActive ? 'text-slate-500' : 'text-rose-500'}`}>Alarmes (Q7)</p>
                      <h4 className={`text-base md:text-lg font-bold ${!isAlarmActive ? 'text-slate-700' : 'text-rose-700'}`}>
                          {isAlarmActive ? 'ATIVO' : 'NORMAL'}
                      </h4>
                  </div>
              </div>
              <div className={!isAlarmActive ? 'text-slate-300' : 'text-rose-400 animate-pulse'}>
                  {!isAlarmActive ? <CircleCheck size={28} className="md:w-8 md:h-8" /> : <TriangleAlert size={28} className="md:w-8 md:h-8" />}
              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;