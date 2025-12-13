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

    const sanitizedTemp = Math.min(Math.max(0, formData.sp_temp), 50);
    const sanitizedHistTemp = Math.max(0.5, formData.hist_temp);
    const sanitizedHistUmid = Math.max(1, formData.hist_umid);
    const sanitizedUmid = Math.min(Math.max(20, formData.sp_umid), 90);

    const sanitizedData: Parameters = {
        ...formData,
        sp_temp: sanitizedTemp,
        hist_temp: sanitizedHistTemp,
        sp_umid: sanitizedUmid,
        hist_umid: sanitizedHistUmid
    };

    updateParams(sanitizedData);
    setFormData(sanitizedData);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-800">Configurações</h2>
                <p className="text-sm text-slate-500">Ajuste os setpoints de temperatura e umidade</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
                {isSaved && (
                    <div className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg text-sm font-medium animate-fade-in whitespace-nowrap shadow-sm border border-emerald-200">
                        Salvo!
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

        <section className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center">
                <RefreshCw size={18} className="mr-2 text-orange-500" />
                Setpoints do Sensor DHT11
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temperatura</h4>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Setpoint</label>
                            <span className="text-xs text-slate-400">0-50°C</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                name="sp_temp"
                                value={formData.sp_temp}
                                onChange={handleChange}
                                min="0"
                                max="50"
                                step="0.5"
                                className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-base"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">°C</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Histerese</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="hist_temp"
                                value={formData.hist_temp}
                                onChange={handleChange}
                                min="0.5"
                                max="10"
                                step="0.5"
                                className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-base"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">°C</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Umidade</h4>
                    <div>
                        <div className="flex justify-between">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Setpoint</label>
                            <span className="text-xs text-slate-400">20% - 90%</span>
                        </div>
                        <div className="relative">
                            <input
                                type="number"
                                name="sp_umid"
                                value={formData.sp_umid}
                                onChange={handleChange}
                                min="20"
                                max="90"
                                className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-8 transition-all text-base"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Histerese</label>
                        <div className="relative">
                            <input
                                type="number"
                                name="hist_umid"
                                value={formData.hist_umid}
                                onChange={handleChange}
                                min="1"
                                max="20"
                                className="w-full px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-8 transition-all text-base"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400">%</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>

        <div className="flex justify-end pt-4">
            <button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-8 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center space-x-2 transition-all duration-200 active:scale-95"
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