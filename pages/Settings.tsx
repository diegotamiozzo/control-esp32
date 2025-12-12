import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, RefreshCw, ArrowLeft } from 'lucide-react';
import { useMachine } from '../context/MachineContext';
import { Parameters } from '../types';

const Settings: React.FC = () => {
  const { state, updateParams } = useMachine();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Parameters>(state.params);
  const [isSaved, setIsSaved] = useState(false);

  // Sync if params change externally
  useEffect(() => {
    setFormData(state.params);
  }, [state.params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'number') {
      newValue = parseFloat(value);
      if (isNaN(newValue)) newValue = 0; // Prevent NaN
    } else if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    setIsSaved(false);
  };

  const handleCheckboxChange = (name: keyof Parameters) => (e: React.ChangeEvent<HTMLInputElement>) => {
     setFormData(prev => ({ ...prev, [name]: e.target.checked }));
     setIsSaved(false);
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDATION LOGIC ---
    
    // 1. Temperature Validation
    // Limit: Positive only. Max 165°C or 329°F.
    const maxTemp = formData.temp_unit === 'C' ? 165 : 329;
    const sanitizedTemp = Math.min(Math.max(0, formData.sp_temp), maxTemp);

    // 2. Hysteresis Validation
    // Limit: Must be >= 1
    const sanitizedHistTemp = Math.max(1, formData.hist_temp);
    const sanitizedHistUmid = Math.max(1, formData.hist_umid);

    // 3. Humidity Validation
    // Limit: Between 20% and 100%
    const sanitizedUmid = Math.min(Math.max(20, formData.sp_umid), 100);

    const sanitizedData: Parameters = {
        ...formData,
        sp_temp: sanitizedTemp,
        hist_temp: sanitizedHistTemp,
        sp_umid: sanitizedUmid,
        hist_umid: sanitizedHistUmid
    };

    updateParams(sanitizedData);
    setFormData(sanitizedData); // Update local form state with clamped values
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 md:pb-12">
        {/* Header Section with Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Parâmetros Ajustáveis</h2>
                <p className="text-sm text-slate-500">Configuração do processo e temporizadores</p>
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
                {isSaved && (
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium animate-fade-in whitespace-nowrap shadow-sm border border-emerald-200">
                        Configuração Salva!
                    </div>
                )}
                <button 
                    onClick={() => navigate('/')}
                    type="button"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors shadow-sm ml-auto sm:ml-0"
                >
                    <ArrowLeft size={18} />
                    <span>Voltar</span>
                </button>
            </div>
        </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Setpoints Section */}
        <section className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-50 flex items-center">
                <RefreshCw size={18} className="mr-2 text-indigo-500" />
                Controle de Processo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                
                {/* Temperature Column */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temperatura</h4>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Setpoint</label>
                            <span className="text-xs text-slate-400">Max: {formData.temp_unit === 'C' ? '165°C' : '329°F'}</span>
                        </div>
                        <div className="flex">
                            <input
                                type="number"
                                name="sp_temp"
                                value={formData.sp_temp}
                                onChange={handleChange}
                                min="0"
                                max={formData.temp_unit === 'C' ? 165 : 329}
                                className="w-full px-3 py-2.5 border rounded-l-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base"
                            />
                             <select 
                                name="temp_unit"
                                value={formData.temp_unit}
                                onChange={handleChange}
                                className="bg-slate-50 border border-slate-200 border-l-0 rounded-r-lg px-2 text-sm text-slate-600 outline-none focus:border-indigo-500"
                            >
                                <option value="C">°C</option>
                                <option value="F">°F</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Histerese (Min: 1)</label>
                        <input
                            type="number"
                            name="hist_temp"
                            value={formData.hist_temp}
                            onChange={handleChange}
                            min="1"
                            className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-base"
                        />
                    </div>
                </div>

                {/* Humidity Column */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umidade</h4>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Setpoint</label>
                            <span className="text-xs text-slate-400">20% - 100%</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                name="sp_umid"
                                value={formData.sp_umid}
                                onChange={handleChange}
                                min="20"
                                max="100"
                                className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-8 transition-all text-base"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Histerese (Min: 1)</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="hist_umid"
                                value={formData.hist_umid}
                                onChange={handleChange}
                                min="1"
                                className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-8 transition-all text-base"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">%</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        {/* Timers Section */}
        <section className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-50">
                Temporizadores (Ciclos)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Vibrador */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-medium text-slate-700 mb-3">Vibrador (Q3)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tempo ON (s)</label>
                            <input
                                type="number"
                                name="time_vibrador_on"
                                value={formData.time_vibrador_on}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tempo OFF (s)</label>
                            <input
                                type="number"
                                name="time_vibrador_off"
                                value={formData.time_vibrador_off}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                    </div>
                </div>

                {/* Rosca Sec */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-medium text-slate-700 mb-3">Rosca Secundária (Q2)</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tempo ON (s)</label>
                            <input
                                type="number"
                                name="time_rosca_sec_on"
                                value={formData.time_rosca_sec_on}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tempo OFF (s)</label>
                            <input
                                type="number"
                                name="time_rosca_sec_off"
                                value={formData.time_rosca_sec_off}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                    </div>
                </div>

                 {/* Alarme */}
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-slate-700">Alarme (Q7)</h4>
                        <label className="flex items-center space-x-2 cursor-pointer p-1">
                            <input 
                                type="checkbox" 
                                checked={formData.alarme_enabled}
                                onChange={handleCheckboxChange('alarme_enabled')}
                                className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 accent-indigo-600 border-gray-300"
                            />
                            <span className="text-xs text-slate-500">Habilitado</span>
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tempo ON (min)</label>
                            <input
                                type="number"
                                name="time_alarme_on"
                                value={formData.time_alarme_on}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Tempo OFF (min)</label>
                            <input
                                type="number"
                                name="time_alarme_off"
                                value={formData.time_alarme_off}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                    </div>
                </div>

                {/* Chama Piloto */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="font-medium text-slate-700 mb-3">Chama Piloto</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Ativação (s)</label>
                            <input
                                type="number"
                                name="time_chama_atv"
                                value={formData.time_chama_atv}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Espera (min)</label>
                            <input
                                type="number"
                                name="time_chama_wait"
                                value={formData.time_chama_wait}
                                onChange={handleChange}
                                min="0"
                                className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </section>

        {/* Action Bar - Fixed Bottom for Mobile */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t border-slate-200 md:static md:bg-transparent md:border-t-0 md:p-0 z-20 flex justify-end">
            <button
                type="submit"
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 md:py-3 px-8 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 transition-all duration-200 active:scale-95"
            >
                <Save size={20} />
                <span>Salvar Configurações</span>
            </button>
        </div>

      </form>
    </div>
  );
};

export default Settings;