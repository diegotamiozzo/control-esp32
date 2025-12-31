import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMachine } from '../context/MachineContext';
import { TriangleAlert, ToggleLeft, ToggleRight, ArrowLeft, Power, CircleX } from 'lucide-react';
import { SystemInputs, SystemOutputs } from '../types';

const TestMode: React.FC = () => {
  const { state, toggleOutputManual, setManualMode } = useMachine();
  const [isTestModeEnabled, setIsTestModeEnabled] = useState(false);
  const navigate = useNavigate();

  // Effect to handle Manual Mode
  useEffect(() => {
    if (isTestModeEnabled && !state.isManualMode) {
        setManualMode(true);
    } else if (!isTestModeEnabled && state.isManualMode) {
        setManualMode(false);
    }
  }, [isTestModeEnabled, state.isManualMode, setManualMode]);

  // Cleanup when unmounting
  useEffect(() => {
      return () => {
          setManualMode(false);
      };
  }, [setManualMode]);

  const handleExitToDashboard = () => {
      setManualMode(false);
      navigate('/');
  };

  const getInputLabel = (key: string): { main: string; sub: string } => {
    const labels: Record<string, { main: string; sub: string }> = {
      'i1_habilitacao': { main: 'I1', sub: 'Habilitação' },
      'i2_reset': { main: 'I2', sub: 'Reset' },
      'i3_energia': { main: 'I3', sub: 'Energia' },
      'i4_fim_curso_aberta': { main: 'I4', sub: 'FC Aberta' },
      'i5_fim_curso_fechada': { main: 'I5', sub: 'FC Fechada' }
    };
    return labels[key] || { main: key.split('_')[0], sub: key.split('_').slice(1).join(' ') };
  };

  const getOutputLabel = (key: string): { main: string; sub: string } => {
    const labels: Record<string, { main: string; sub: string }> = {
      'q1_rosca_principal': { main: 'Q1', sub: 'Rosca Principal' },
      'q2_rosca_secundaria': { main: 'Q2', sub: 'Rosca Secundária' },
      'q3_vibrador': { main: 'Q3', sub: 'Vibrador' },
      'q4_ventoinha': { main: 'Q4', sub: 'Ventoinha' },
      'q5_corta_fogo': { main: 'Q5', sub: 'Corta-Fogo' },
      'q6_damper': { main: 'Q6', sub: 'Damper' },
      'q7_alarme': { main: 'Q7', sub: 'Alarme' }
    };
    return labels[key] || { main: key.split('_')[0], sub: key.split('_').slice(1).join(' ') };
  };

  // Warning Overlay
  if (!isTestModeEnabled) {
    return (
      <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg text-center border-t-4 border-amber-500">
            <div className="bg-amber-50 p-4 rounded-full inline-block mb-4">
                <TriangleAlert size={48} className="text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Modo de Teste Manual</h2>
            <p className="text-slate-600 mb-6">
                Esta área permite o acionamento direto das saídas. 
                Isso irá <strong>pausar a lógica automática</strong> do sistema.
                <br /><br />
                <strong>Deseja continuar?</strong>
            </p>
            <div className="flex gap-4 justify-center">
                <button 
                    type="button"
                    onClick={() => navigate('/')}
                    className="px-6 py-3 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200"
                >
                    Cancelar
                </button>
                <button 
                    type="button"
                    onClick={() => setIsTestModeEnabled(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-amber-200 flex items-center gap-2"
                >
                    <Power size={20} />
                    Habilitar
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
        {/* Header Bar */}
        <div className="bg-amber-500 text-white p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center shadow-lg shadow-amber-200 gap-4">
             <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <TriangleAlert size={20} className="text-white" />
                </div>
                <div>
                    <h3 className="font-bold text-sm sm:text-base">Modo de Teste Ativo</h3>
                    <p className="text-xs text-amber-50">Lógica automática pausada. Controle manual habilitado.</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button 
                    type="button"
                    onClick={() => setIsTestModeEnabled(false)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 text-sm text-white bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 rounded-lg transition-colors"
                 >
                    <CircleX size={16} />
                    <span>Desabilitar</span>
                 </button>
                 <button 
                    type="button"
                    onClick={handleExitToDashboard}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 text-sm text-amber-600 bg-white hover:bg-slate-50 px-4 py-2 rounded-lg transition-colors shadow-sm font-medium"
                 >
                    <ArrowLeft size={16} />
                    <span>Sair para Dashboard</span>
                 </button>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Inputs Monitoring */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
                        <ToggleLeft className="mr-2 text-indigo-500" size={18} />
                        Entradas (Inputs)
                    </h3>
                    <div className="flex items-center text-[10px] text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                         <Power size={10} className="mr-1" /> Monitoramento
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.keys(state.inputs)
                        .filter(k => !k.includes('sensor'))
                        .map((key) => {
                            const inputKey = key as keyof SystemInputs;
                            const isActive = state.inputs[inputKey];
                            const labels = getInputLabel(key);
                            
                            return (
                            <div
                                key={key}
                                className={`relative group flex items-center p-3 rounded-lg border text-left transition-all ${
                                    isActive 
                                    ? 'bg-indigo-50 border-indigo-200' 
                                    : 'bg-white border-slate-100'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full mr-3 ${isActive ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-300'}`} />
                                <div className="flex-1 min-w-0">
                                    <span className={`block text-xs font-bold uppercase truncate ${isActive ? 'text-indigo-900' : 'text-slate-500'}`}>
                                        {labels.main}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate block">
                                        {labels.sub}
                                    </span>
                                </div>
                                <div className={`ml-2 text-[10px] font-bold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                                    {isActive ? 'ON' : 'OFF'}
                                </div>
                            </div>
                            );
                    })}
                </div>

                {/* Sensor Values */}
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Valores dos Sensores</h4>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-xs font-medium text-slate-600">Temperatura (I6)</span>
                            <span className="text-sm font-bold text-orange-600">{state.inputs.i6_temp_sensor.toFixed(1)}°C</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                            <span className="text-xs font-medium text-slate-600">Umidade (I7)</span>
                            <span className="text-sm font-bold text-blue-600">{state.inputs.umidade_sensor.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Outputs Control */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wide">
                        <ToggleRight className="mr-2 text-emerald-600" size={18} />
                        Saídas (Outputs)
                    </h3>
                     <div className="flex items-center text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                         Controle Manual
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {Object.keys(state.outputs).map((key) => {
                            const outputKey = key as keyof SystemOutputs;
                            const isActive = state.outputs[outputKey];
                            const labels = getOutputLabel(key);
                            
                            return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => toggleOutputManual(outputKey)}
                                className={`relative group flex items-center p-3 rounded-lg border text-left transition-all ${
                                    isActive 
                                    ? 'bg-emerald-50 border-emerald-500 shadow-sm' 
                                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                                }`}
                            >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                                    isActive ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'
                                }`}>
                                    {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <span className={`block text-xs font-bold uppercase truncate ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>
                                        {labels.main}
                                    </span>
                                    <span className={`text-[10px] truncate block ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                                        {labels.sub}
                                    </span>
                                </div>
                            </button>
                            );
                    })}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TestMode;