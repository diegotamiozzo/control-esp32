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
  const [isModified, setIsModified] = useState(false);

  // Sync if params change externally
  useEffect(() => {
    if (!isModified) {
      setFormData(state.params);
    }
  }, [state.params, isModified]);

const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }

    // Se mudou a unidade de temperatura, converte o setpoint
    if (name === 'temp_unit' && value !== formData.temp_unit) {
      const currentTemp = parseFloat(String(formData.sp_temp));
      let convertedTemp = currentTemp;
      
      if (value === 'F') {
        // Celsius para Fahrenheit
        convertedTemp = (currentTemp * 9/5) + 32;
      } else {
        // Fahrenheit para Celsius
        convertedTemp = (currentTemp - 32) * 5/9;
      }
      
      setFormData(prev => ({ 
        ...prev, 
        [name]: newValue,
        sp_temp: Math.round(convertedTemp * 10) / 10 // Arredonda para 1 casa decimal
      } as Parameters));
    } else {
      setFormData(prev => ({ ...prev, [name]: newValue } as Parameters));
    }
    
    setIsSaved(false);
    setIsModified(true);
  };

  const handleCheckboxChange =
    (name: keyof Parameters) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [name]: e.target.checked }));
      setIsSaved(false);
      setIsModified(true);
    };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Função auxiliar para converter string em número de forma segura
    const getNumericValue = (val: any, defaultVal: number) => {
      const num = parseFloat(String(val));
      return isNaN(num) ? defaultVal : num;
    };

    // Converte todos os campos numéricos antes de validar
    const numericData = {
      sp_temp: getNumericValue(formData.sp_temp, 0),
      hist_temp: getNumericValue(formData.hist_temp, 1),
      sp_umid: getNumericValue(formData.sp_umid, 20),
      hist_umid: getNumericValue(formData.hist_umid, 1),
      time_vibrador_on: getNumericValue(formData.time_vibrador_on, 0),
      time_vibrador_off: getNumericValue(formData.time_vibrador_off, 0),
      time_rosca_sec_on: getNumericValue(formData.time_rosca_sec_on, 0),
      time_rosca_sec_off: getNumericValue(formData.time_rosca_sec_off, 0),
      time_alarme_on: getNumericValue(formData.time_alarme_on, 0),
      time_alarme_off: getNumericValue(formData.time_alarme_off, 0),
      time_chama_atv: getNumericValue(formData.time_chama_atv, 0),
      time_chama_wait: getNumericValue(formData.time_chama_wait, 0),
    };

    const maxTemp = formData.temp_unit === 'C' ? 165 : 329;

    const sanitizedData: Parameters = {
      ...formData,
      ...numericData,
      sp_temp: Math.min(Math.max(0, numericData.sp_temp), maxTemp),
      hist_temp: Math.max(1, numericData.hist_temp),
      sp_umid: Math.min(Math.max(20, numericData.sp_umid), 100),
      hist_umid: Math.max(1, numericData.hist_umid),
    };

    updateParams(sanitizedData);
    setFormData(sanitizedData);

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">
            Configurações
          </h2>
          <p className="text-sm text-slate-500">
            Ajuste os Setpoints de Temperatura e Umidade
          </p>
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

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Setpoints Section */}
        <section className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center">
            <RefreshCw size={18} className="mr-2 text-orange-500" />
            Setpoints dos Sensores
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Temperatura */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Temperatura
              </h4>

              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Setpoint
                  </label>
                  <span className="text-xs text-slate-400">
                    Max: {formData.temp_unit === 'C' ? '165°C' : '329°F'}
                  </span>
                </div>
                <div className="flex">
                  <input
                    type="number"
                    name="sp_temp"
                    value={formData.sp_temp}
                    onChange={handleChange}
                    min="0"
                    max={formData.temp_unit === 'C' ? 165 : 329}
                    step="1"
                    className="w-full px-3 py-2.5 border rounded-l-lg border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-base"
                  />
                  <select
                    name="temp_unit"
                    value={formData.temp_unit}
                    onChange={handleChange}
                    className="bg-slate-50 border border-slate-200 border-l-0 rounded-r-lg px-2 text-sm text-slate-600 outline-none focus:border-orange-500"
                  >
                    <option value="C">°C</option>
                    <option value="F">°F</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Histerese (Min: 1)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="hist_temp"
                    value={formData.hist_temp}
                    onChange={handleChange}
                    min="1"
                    max="10"
                    step="1"
                    className="w-full pr-10 px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-base"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    °{formData.temp_unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Umidade */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Umidade
              </h4>

              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Setpoint
                  </label>
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
                    className="w-full pr-10 px-3 py-2.5 border rounded-lg border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    %
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Histerese (Min: 1)
                </label>
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

        {/* Temporizadores Section */}
        <section className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            Temporizadores (Ciclos)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vibrador */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-medium text-slate-700 mb-3">Vibrador (Q3)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tempo ON (s)
                  </label>
                  <input
                    type="number"
                    name="time_vibrador_on"
                    value={formData.time_vibrador_on}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tempo OFF (s)
                  </label>
                  <input
                    type="number"
                    name="time_vibrador_off"
                    value={formData.time_vibrador_off}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Rosca Secundária */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-medium text-slate-700 mb-3">Rosca Secundária (Q2)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tempo ON (s)
                  </label>
                  <input
                    type="number"
                    name="time_rosca_sec_on"
                    value={formData.time_rosca_sec_on}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tempo OFF (s)
                  </label>
                  <input
                    type="number"
                    name="time_rosca_sec_off"
                    value={formData.time_rosca_sec_off}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Alarme */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-slate-700">Alarme (Q7)</h4>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.alarme_enabled}
                    onChange={handleCheckboxChange('alarme_enabled')}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 accent-orange-600"
                  />
                  <span className="text-xs text-slate-500">Habilitado</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tempo ON (min)
                  </label>
                  <input
                    type="number"
                    name="time_alarme_on"
                    value={formData.time_alarme_on}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Tempo OFF (min)
                  </label>
                  <input
                    type="number"
                    name="time_alarme_off"
                    value={formData.time_alarme_off}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Chama Piloto */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="font-medium text-slate-700 mb-3">Chama Piloto</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Ativação (s)
                  </label>
                  <input
                    type="number"
                    name="time_chama_atv"
                    value={formData.time_chama_atv}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">
                    Espera (min)
                  </label>
                  <input
                    type="number"
                    name="time_chama_wait"
                    value={formData.time_chama_wait}
                    onChange={handleChange}
                    min="0"
                    className="w-full mt-1 px-3 py-2.5 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-center pt-4">
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
