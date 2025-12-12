import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import mqtt from 'mqtt';
import { AppState, Parameters, SystemInputs, SystemOutputs } from '../types';

// --- CONFIGURAÇÃO MQTT VIA ENV (SAFE ACCESS) ---
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return import.meta.env ? import.meta.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

const MQTT_BROKER_URL = getEnv('VITE_MQTT_BROKER') || 'wss://broker.hivemq.com:8000/mqtt';
const MQTT_USER = getEnv('VITE_MQTT_USERNAME');
const MQTT_PASS = getEnv('VITE_MQTT_PASSWORD');

const TOPIC_PREFIX = 'dispositivo';

const DEFAULT_PARAMS: Parameters = {
  sp_temp: 120,
  hist_temp: 2,
  sp_umid: 40,
  hist_umid: 5,
  temp_unit: 'C',
  time_vibrador_on: 5,
  time_vibrador_off: 15,
  time_rosca_sec_on: 10,
  time_rosca_sec_off: 10,
  time_alarme_on: 1, 
  time_alarme_off: 1, 
  alarme_enabled: true,
  time_chama_atv: 30,
  time_chama_wait: 10,
};

const DEFAULT_INPUTS: SystemInputs = {
  i1_habilitacao: false, 
  i2_reset: false,
  i3_energia: true,
  i4_fim_curso_aberta: false,
  i5_fim_curso_fechada: true,
  i6_temp_sensor: 25,
  umidade_sensor: 50
};

const DEFAULT_OUTPUTS: SystemOutputs = {
  q1_rosca_principal: false,
  q2_rosca_secundaria: false,
  q3_vibrador: false,
  q4_ventoinha: false,
  q5_corta_fogo: false,
  q6_damper: false,
  q7_alarme: false,
};

interface MachineContextType {
  state: AppState;
  setMacAddress: (mac: string) => void;
  updateParams: (newParams: Partial<Parameters>) => void;
  toggleInput: (key: keyof SystemInputs) => void;
  updateSensor: (key: 'i6_temp_sensor' | 'umidade_sensor', value: number) => void;
  toggleOutputManual: (key: keyof SystemOutputs) => void; 
  setManualMode: (enabled: boolean) => void;
  disconnect: () => void;
}

const MachineContext = createContext<MachineContextType | undefined>(undefined);

export const MachineProvider = ({ children }: { children?: ReactNode }) => {
  const clientRef = useRef<mqtt.MqttClient | null>(null);

  const [state, setState] = useState<AppState>(() => {
    const savedParams = localStorage.getItem('machineParams');
    const savedMac = localStorage.getItem('esp32Mac');
    
    let parsedParams = DEFAULT_PARAMS;
    if (savedParams) {
        try {
          parsedParams = { ...DEFAULT_PARAMS, ...JSON.parse(savedParams) };
        } catch(e) {
          console.error("Erro ao carregar params", e);
        }
    }

    return {
      macAddress: savedMac || null,
      isConnected: false,
      mqttConnected: false,
      inputs: DEFAULT_INPUTS,
      outputs: DEFAULT_OUTPUTS,
      params: parsedParams,
      isManualMode: false,
      simState: {
        sequenceStep: 'STOPPED',
        timerVibrador: 0,
        timerRoscaSec: 0
      }
    };
  });

  const isDemoMode = state.macAddress?.toLowerCase() === 'demo';

  useEffect(() => { localStorage.setItem('machineParams', JSON.stringify(state.params)); }, [state.params]);
  useEffect(() => { if (state.macAddress) localStorage.setItem('esp32Mac', state.macAddress); }, [state.macAddress]);

  // --- MQTT LOGIC ---
  useEffect(() => {
    if (!state.macAddress || isDemoMode) return;

    console.log(`Conectando MQTT... Broker: ${MQTT_BROKER_URL}`);
    
    try {
        const client = mqtt.connect(MQTT_BROKER_URL, {
            keepalive: 60,
            clientId: `web_${Math.random().toString(16).substring(2, 10)}`,
            username: MQTT_USER,
            password: MQTT_PASS,
            protocolId: 'MQTT',
            protocolVersion: 4,
            clean: true,
            reconnectPeriod: 2000,
        });

        clientRef.current = client;
        const topicTelemetry = `${TOPIC_PREFIX}/${state.macAddress}/telemetria`;
        
        client.on('connect', () => {
            console.log('MQTT Conectado com sucesso!');
            setState(s => ({ ...s, isConnected: true, mqttConnected: true }));
            client.subscribe(topicTelemetry);
        });

        client.on('message', (topic, message) => {
            if (topic === topicTelemetry) {
                try {
                    const payload = JSON.parse(message.toString());
                    setState(prev => {
                        const newInputs = { ...prev.inputs };
                        const newOutputs = { ...prev.outputs };

                        if (payload.temp !== undefined) newInputs.i6_temp_sensor = payload.temp;
                        if (payload.hum !== undefined) newInputs.umidade_sensor = payload.hum;
                        
                        // Atualiza outras chaves se existirem no payload
                        if (payload.inputs) Object.assign(newInputs, payload.inputs);
                        if (payload.outputs) Object.assign(newOutputs, payload.outputs);

                        // Mapeamento de redundância para relés diretos do ESP32 code
                        if (payload.rele1 !== undefined) newOutputs.q4_ventoinha = !!payload.rele1; // Temp control -> Fan
                        if (payload.rele2 !== undefined) newOutputs.q6_damper = !!payload.rele2;    // Hum control -> Damper
                        
                        return { ...prev, inputs: newInputs, outputs: newOutputs };
                    });
                } catch (e) {
                    console.error("Erro parse MQTT", e);
                }
            }
        });

        client.on('offline', () => setState(s => ({ ...s, mqttConnected: false })));
        client.on('error', (err) => {
            console.error('MQTT Erro:', err);
            setState(s => ({ ...s, mqttConnected: false }));
        });
    } catch (err) {
        console.error("Critical MQTT Error:", err);
    }

    return () => {
        if (clientRef.current) {
             try { clientRef.current.end(); } catch(e) {}
             clientRef.current = null;
        }
    };
  }, [state.macAddress, isDemoMode]);

  // --- LÓGICA DE SIMULAÇÃO (MODO DEMO) ---
  useEffect(() => {
    if (state.macAddress && isDemoMode && !state.isConnected) {
         setTimeout(() => setState(s => ({ ...s, isConnected: true })), 500);
    }

    if (!isDemoMode || !state.isConnected || state.isManualMode) return;

    const interval = setInterval(() => {
      setState(curr => {
        const { inputs, params, outputs, simState } = curr;
        let nextOutputs = { ...outputs };
        let nextSimState = { ...simState };
        let nextInputs = { ...inputs };
        
        let alarmTriggered = false;

        // -------------------------------
        // 1. Falha de Energia (I3) - PDF 2.1
        // -------------------------------
        if (!inputs.i3_energia) {
            // Desliga tudo, liga alarme
            nextOutputs = {
                q1_rosca_principal: false, q2_rosca_secundaria: false, q3_vibrador: false,
                q4_ventoinha: false, q5_corta_fogo: false, q6_damper: false, q7_alarme: true
            };
            nextSimState.sequenceStep = 'STOPPED';
            return { ...curr, outputs: nextOutputs, simState: nextSimState };
        }

        // -------------------------------
        // 2. Parada em Cascata ou Habilitação Off (I1) - PDF 2.4
        // -------------------------------
        const tempHigh = inputs.i6_temp_sensor >= params.sp_temp;
        
        if (!inputs.i1_habilitacao || tempHigh) {
            // Etapa 1: Desliga Q1, Q3, Q2, Q4
            nextOutputs.q1_rosca_principal = false;
            nextOutputs.q3_vibrador = false;
            nextOutputs.q2_rosca_secundaria = false;
            nextOutputs.q4_ventoinha = false;
            
            // Etapa 2: Desenergiza Q5 -> Fechamento
            nextOutputs.q5_corta_fogo = false; 
            nextSimState.sequenceStep = 'STOPPED';

            // Monitora I5 (Fim de curso fechado). Se não fechar em 10s -> Alarme (Simulado aqui como imediato se "falhar")
            // Na simulação, fechamos a válvula após um tempo random
            if (!nextOutputs.q5_corta_fogo && !nextInputs.i5_fim_curso_fechada) {
                 if (Math.random() > 0.7) {
                    nextInputs.i5_fim_curso_fechada = true;
                    nextInputs.i4_fim_curso_aberta = false;
                 }
                 // Se passasse 10s real, ativaria alarme.
            }
        } 
        // -------------------------------
        // 3. Sequência de Partida (Start) - PDF 2.2
        // -------------------------------
        else if (inputs.i1_habilitacao && !tempHigh) {
            
            // 1. Acionamento Inicial
            nextOutputs.q4_ventoinha = true; // Liga Ventoinha
            
            // Liga Rosca Secundária (Q2) ENQUANTO Q4 ligado
            // + Lógica Cíclica da Q2 (PDF 1.3)
            nextSimState.timerRoscaSec++;
            const cycleSec = params.time_rosca_sec_on + params.time_rosca_sec_off;
            const posSec = nextSimState.timerRoscaSec % cycleSec;
            nextOutputs.q2_rosca_secundaria = (posSec < params.time_rosca_sec_on);

            nextOutputs.q5_corta_fogo = true; // Abre Corta Fogo

            // Simulação Movimento Válvula
            if (nextOutputs.q5_corta_fogo && !nextInputs.i4_fim_curso_aberta) {
                 nextInputs.i5_fim_curso_fechada = false;
                 if (Math.random() > 0.85) nextInputs.i4_fim_curso_aberta = true; 
            }

            // 2. Liberação da Carga Principal (Q1)
            // Ao detectar I4 (Aberta)
            if (inputs.i4_fim_curso_aberta) {
                nextOutputs.q1_rosca_principal = true;
                nextSimState.sequenceStep = 'RUNNING';
            } else {
                nextOutputs.q1_rosca_principal = false;
            }

            // 3. Vibrador (Q3) - Cíclico, só se Q1 ligado
            if (nextOutputs.q1_rosca_principal) {
                nextSimState.timerVibrador++;
                const cycleVib = params.time_vibrador_on + params.time_vibrador_off;
                const posVib = nextSimState.timerVibrador % cycleVib;
                nextOutputs.q3_vibrador = (posVib < params.time_vibrador_on);
            } else {
                nextOutputs.q3_vibrador = false;
                nextSimState.timerVibrador = 0;
            }
        }

        // -------------------------------
        // 4. Controle de Umidade (Independente) - PDF 2.6
        // -------------------------------
        // Damper Q6
        if (inputs.umidade_sensor < (params.sp_umid - params.hist_umid)) {
            nextOutputs.q6_damper = true; // Aberto (Muito seco?) - Logica padrão: precisa umidificar? Ou Damper abre pra secar?
            // Assumindo PDF: Umidade < SP -> Aberto.
        } else if (inputs.umidade_sensor > (params.sp_umid + params.hist_umid)) {
            nextOutputs.q6_damper = false; // Fechado
        }

        // Alarme de Umidade (Fora da faixa)
        if (inputs.umidade_sensor < (params.sp_umid - params.hist_umid) || 
            inputs.umidade_sensor > (params.sp_umid + params.hist_umid)) {
            alarmTriggered = true;
        }

        // -------------------------------
        // 5. Controle Geral do Alarme (Q7)
        // -------------------------------
        if (alarmTriggered && params.alarme_enabled) {
            // Modo Cíclico ON/OFF se for alarme de umidade (conforme PDF)
            // Usando timer global do sistema ou um novo contador
            // Simplificação: Pisca a cada segundo se habilitado
            nextOutputs.q7_alarme = !outputs.q7_alarme; 
        } else if (!alarmTriggered && !(!inputs.i3_energia)) {
             // Se não há trigger e não é falta de energia, desliga
             nextOutputs.q7_alarme = false;
        }

        // Reset manual de alarme
        if (inputs.i2_reset) {
            nextOutputs.q7_alarme = false;
        }

        return { 
            ...curr, 
            outputs: nextOutputs, 
            simState: nextSimState,
            inputs: nextInputs
        };
      });
    }, 1000); 

    return () => clearInterval(interval);
  }, [state.isConnected, state.isManualMode, isDemoMode, state.macAddress]);

  // --- ACTIONS ---
  const setMacAddress = useCallback((mac: string) => {
    setState(s => ({ ...s, macAddress: mac }));
  }, []);

  const updateParams = useCallback((newParams: Partial<Parameters>) => {
    setState(s => {
        const updated = { ...s.params, ...newParams };
        if (!isDemoMode && clientRef.current?.connected) {
            const topicCmd = `${TOPIC_PREFIX}/${s.macAddress}/comando`;
            const payload = {
                sp_t: updated.sp_temp,
                sp_h: updated.sp_umid
            };
            clientRef.current.publish(topicCmd, JSON.stringify(payload));
        }
        return { ...s, params: updated };
    });
  }, [isDemoMode]);

  const toggleInput = useCallback((key: keyof SystemInputs) => {
    if (!isDemoMode) return; 
    setState(s => ({ ...s, inputs: { ...s.inputs, [key]: !s.inputs[key] } }));
  }, [isDemoMode]);

  const updateSensor = useCallback((key: 'i6_temp_sensor' | 'umidade_sensor', value: number) => {
    if (!isDemoMode) return;
    setState(s => ({ ...s, inputs: { ...s.inputs, [key]: value } }));
  }, [isDemoMode]);

  const toggleOutputManual = useCallback((key: keyof SystemOutputs) => {
    setState(s => {
      const newVal = !s.outputs[key];
      if (!isDemoMode && clientRef.current?.connected) {
          const topicCmd = `${TOPIC_PREFIX}/${s.macAddress}/comando`;
          // Map to ESP32 specific manual override keys if needed
          const payload: any = {};
          // Exemplo: r3=Vibrador, r4=Ventoinha
          if (key === 'q3_vibrador') payload.r3 = newVal;
          if (key === 'q4_ventoinha') payload.r4 = newVal;
          payload[key] = newVal; 
          clientRef.current.publish(topicCmd, JSON.stringify(payload));
      }
      return { ...s, outputs: { ...s.outputs, [key]: newVal } };
    });
  }, [isDemoMode]);

  const setManualMode = useCallback((enabled: boolean) => {
    setState(s => ({ ...s, isManualMode: enabled }));
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
        try { clientRef.current.end(); } catch(e) {}
        clientRef.current = null;
    }
    setState(s => ({ ...s, isConnected: false, mqttConnected: false, macAddress: null }));
    localStorage.removeItem('esp32Mac');
  }, []);

  const value = useMemo(() => ({
      state, setMacAddress, updateParams, toggleInput, updateSensor, toggleOutputManual, setManualMode, disconnect 
  }), [state, setMacAddress, updateParams, toggleInput, updateSensor, toggleOutputManual, setManualMode, disconnect]);

  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
};

export const useMachine = () => {
  const context = useContext(MachineContext);
  if (!context) throw new Error("useMachine must be used within MachineProvider");
  return context;
};
