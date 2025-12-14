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

const MQTT_BROKER_URL = getEnv('VITE_MQTT_BROKER') || '';
const MQTT_USER = getEnv('VITE_MQTT_USERNAME') || '';
const MQTT_PASS = getEnv('VITE_MQTT_PASSWORD') || '';

const TOPIC_PREFIX = 'dispositivo';

const DEFAULT_PARAMS: Parameters = {
  sp_temp: 25,
  hist_temp: 2,
  sp_umid: 60,
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
  i1_habilitacao: false,  // INPUT_PULLUP: false = sem GND (inativo)
  i2_reset: false,        // INPUT_PULLUP: false = sem GND (inativo)
  i3_energia: false,      // INPUT_PULLUP: false = sem GND (sem energia)
  i4_fim_curso_aberta: false,   // INPUT_PULLUP: false = sem GND (não atingiu fim de curso)
  i5_fim_curso_fechada: false,  // INPUT_PULLUP: false = sem GND (não atingiu fim de curso)
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
        timerRoscaSec: 0,
        timerAlarme: 0,
        alarmActive: false,
        alarmReseted: false,
        prevI2Reset: false,
        chamaPilotoTimer: 0,
        chamaPilotoWaitTimer: 0,
        chamaPilotoActive: false,
        tempInHysteresisTimer: 0
      }
    };
  });

  const isDemoMode = state.macAddress?.toLowerCase() === 'demo';

  useEffect(() => { localStorage.setItem('machineParams', JSON.stringify(state.params)); }, [state.params]);
  useEffect(() => { if (state.macAddress) localStorage.setItem('esp32Mac', state.macAddress); }, [state.macAddress]);

  // --- MQTT LOGIC ---
  useEffect(() => {
    if (!state.macAddress || isDemoMode) return;

    if (!MQTT_BROKER_URL || !MQTT_USER || !MQTT_PASS) {
      console.error('❌ MQTT não configurado! Verifique o arquivo .env');
      console.error('VITE_MQTT_BROKER:', MQTT_BROKER_URL);
      console.error('VITE_MQTT_USERNAME:', MQTT_USER ? '***' : 'vazio');
      console.error('VITE_MQTT_PASSWORD:', MQTT_PASS ? '***' : 'vazio');
      return;
    }

    console.log('=== INICIANDO CONEXÃO MQTT ===');
    console.log('Broker:', MQTT_BROKER_URL);
    console.log('Usuário:', MQTT_USER);
    console.log('MAC Address:', state.macAddress);
    console.log('Tópico telemetria:', `${TOPIC_PREFIX}/${state.macAddress}/telemetria`);
    console.log('Tópico comando:', `${TOPIC_PREFIX}/${state.macAddress}/comando`);

    try {
        const client = mqtt.connect(MQTT_BROKER_URL, {
            keepalive: 60,
            clientId: `web_${Math.random().toString(16).substring(2, 10)}`,
            username: MQTT_USER,
            password: MQTT_PASS,
            protocolId: 'MQTT',
            protocolVersion: 4,
            clean: true,
            reconnectPeriod: 5000,
            connectTimeout: 10000,
        });

        clientRef.current = client;
        const topicTelemetry = `${TOPIC_PREFIX}/${state.macAddress}/telemetria`;
        
        client.on('connect', () => {
            console.log('✓ MQTT CONECTADO COM SUCESSO!');
            console.log('✓ Inscrito em:', topicTelemetry);
            setState(s => ({ ...s, isConnected: true, mqttConnected: true }));
            client.subscribe(topicTelemetry, (err) => {
                if (err) {
                    console.error('Erro ao inscrever no tópico:', err);
                } else {
                    console.log('✓ Inscrição confirmada');
                }
            });
        });

        client.on('message', (topic, message) => {
            console.log('📨 Mensagem recebida:', topic);
            if (topic === topicTelemetry) {
                try {
                    const payload = JSON.parse(message.toString());
                    console.log('📦 Payload:', payload);
                    setState(prev => {
                        const newInputs = { ...prev.inputs };
                        const newOutputs = { ...prev.outputs };
                        const newParams = { ...prev.params };

                        // Mapear entradas do ESP32 (I1-I7)
                        if (payload.i1_habilitacao !== undefined) newInputs.i1_habilitacao = !!payload.i1_habilitacao;
                        if (payload.i2_reset !== undefined) newInputs.i2_reset = !!payload.i2_reset;
                        if (payload.i3_energia !== undefined) newInputs.i3_energia = !!payload.i3_energia;
                        if (payload.i4_fim_curso_aberta !== undefined) newInputs.i4_fim_curso_aberta = !!payload.i4_fim_curso_aberta;
                        if (payload.i5_fim_curso_fechada !== undefined) newInputs.i5_fim_curso_fechada = !!payload.i5_fim_curso_fechada;
                        if (payload.i6_temp_sensor !== undefined) newInputs.i6_temp_sensor = Number(payload.i6_temp_sensor);
                        if (payload.umidade_sensor !== undefined) newInputs.umidade_sensor = Number(payload.umidade_sensor);

                        // Mapear saídas do ESP32 (Q1-Q7)
                        if (payload.q1_rosca_principal !== undefined) newOutputs.q1_rosca_principal = !!payload.q1_rosca_principal;
                        if (payload.q2_rosca_secundaria !== undefined) newOutputs.q2_rosca_secundaria = !!payload.q2_rosca_secundaria;
                        if (payload.q3_vibrador !== undefined) newOutputs.q3_vibrador = !!payload.q3_vibrador;
                        if (payload.q4_ventoinha !== undefined) newOutputs.q4_ventoinha = !!payload.q4_ventoinha;
                        if (payload.q5_corta_fogo !== undefined) newOutputs.q5_corta_fogo = !!payload.q5_corta_fogo;
                        if (payload.q6_damper !== undefined) newOutputs.q6_damper = !!payload.q6_damper;
                        if (payload.q7_alarme !== undefined) newOutputs.q7_alarme = !!payload.q7_alarme;

                        // Mapear parâmetros do ESP32
                        if (payload.sp_temp !== undefined) newParams.sp_temp = Number(payload.sp_temp);
                        if (payload.sp_umid !== undefined) newParams.sp_umid = Number(payload.sp_umid);
                        if (payload.hist_temp !== undefined) newParams.hist_temp = Number(payload.hist_temp);
                        if (payload.hist_umid !== undefined) newParams.hist_umid = Number(payload.hist_umid);
                        if (payload.temp_unit !== undefined) newParams.temp_unit = payload.temp_unit === 'F' ? 'F' : 'C';

                        return { ...prev, inputs: newInputs, outputs: newOutputs, params: newParams };
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

        // -------------------------------
        // DETECTAR PULSO DE RESET (I2)
        // -------------------------------
        const resetPulse = inputs.i2_reset && !simState.prevI2Reset;
        nextSimState.prevI2Reset = inputs.i2_reset;

        if (resetPulse) {
            nextSimState.alarmActive = false;
            nextSimState.alarmReseted = true;
            nextSimState.timerAlarme = 0;
            nextOutputs.q7_alarme = false;
        }

        // -------------------------------
        // 1. FALHA DE ENERGIA (I3)
        // -------------------------------
        if (!inputs.i3_energia) {
            nextOutputs = {
                q1_rosca_principal: false,
                q2_rosca_secundaria: false,
                q3_vibrador: false,
                q4_ventoinha: false,
                q5_corta_fogo: false,
                q6_damper: false,
                q7_alarme: true
            };
            nextSimState.sequenceStep = 'STOPPED';
            nextSimState.alarmActive = true;
            nextSimState.alarmReseted = false;
            return { ...curr, outputs: nextOutputs, simState: nextSimState };
        }

        // -------------------------------
        // 2. SEQUÊNCIA DE CONTROLE
        // -------------------------------
        const tempBelowSetpoint = inputs.i6_temp_sensor < params.sp_temp;
        const tempInHysteresis = Math.abs(inputs.i6_temp_sensor - params.sp_temp) <= params.hist_temp;

        // CONDIÇÃO DE PARTIDA: I1 ativo + Temperatura < Setpoint
        if (inputs.i1_habilitacao && tempBelowSetpoint) {

            // Liga Ventoinha (Q4)
            nextOutputs.q4_ventoinha = true;

            // Liga Rosca Secundária (Q2) em ciclo
            nextSimState.timerRoscaSec++;
            const cycleSec = params.time_rosca_sec_on + params.time_rosca_sec_off;
            const posSec = nextSimState.timerRoscaSec % cycleSec;
            nextOutputs.q2_rosca_secundaria = (posSec < params.time_rosca_sec_on);

            // Aciona Corta-Fogo (Q5) para abrir
            nextOutputs.q5_corta_fogo = true;

            // Simulação Movimento Válvula
            if (nextOutputs.q5_corta_fogo && !nextInputs.i4_fim_curso_aberta) {
                nextInputs.i5_fim_curso_fechada = false;
                if (Math.random() > 0.85) {
                    nextInputs.i4_fim_curso_aberta = true;
                }
            }

            // Quando detectar abertura total (I4), liga Rosca Principal (Q1) e Vibrador (Q3)
            if (inputs.i4_fim_curso_aberta) {
                nextOutputs.q1_rosca_principal = true;

                // Vibrador (Q3) - Cíclico, respeitando tempos ON/OFF
                nextSimState.timerVibrador++;
                const cycleVib = params.time_vibrador_on + params.time_vibrador_off;
                const posVib = nextSimState.timerVibrador % cycleVib;
                nextOutputs.q3_vibrador = (posVib < params.time_vibrador_on);

                nextSimState.sequenceStep = 'RUNNING';
            } else {
                nextOutputs.q1_rosca_principal = false;
                nextOutputs.q3_vibrador = false;
                nextSimState.timerVibrador = 0;
            }
        }
        // CONDIÇÃO DE PARADA: I1 desligado OU Temperatura >= Setpoint
        else if (!inputs.i1_habilitacao || !tempBelowSetpoint) {
            // Desliga Q1, Q3, Q2, Q4
            nextOutputs.q1_rosca_principal = false;
            nextOutputs.q3_vibrador = false;
            nextOutputs.q2_rosca_secundaria = false;
            nextOutputs.q4_ventoinha = false;

            // Desenergiza Q5 -> Fechamento
            nextOutputs.q5_corta_fogo = false;
            nextSimState.sequenceStep = 'STOPPED';
            nextSimState.timerVibrador = 0;
            nextSimState.timerRoscaSec = 0;

            // Simulação Fechamento Válvula
            if (!nextOutputs.q5_corta_fogo && !nextInputs.i5_fim_curso_fechada) {
                nextInputs.i4_fim_curso_aberta = false;
                if (Math.random() > 0.7) {
                    nextInputs.i5_fim_curso_fechada = true;
                }
            }
        }

        // -------------------------------
        // 3. CHAMA PILOTO
        // -------------------------------
        if (tempInHysteresis) {
            nextSimState.tempInHysteresisTimer++;
            const waitMinutes = params.time_chama_wait * 60; // Converter minutos para segundos

            if (nextSimState.tempInHysteresisTimer >= waitMinutes && !nextSimState.chamaPilotoActive) {
                nextSimState.chamaPilotoActive = true;
                nextSimState.chamaPilotoTimer = 0;
            }
        } else {
            nextSimState.tempInHysteresisTimer = 0;
            nextSimState.chamaPilotoActive = false;
            nextSimState.chamaPilotoTimer = 0;
        }

        // Executar Chama Piloto se ativo
        if (nextSimState.chamaPilotoActive) {
            nextSimState.chamaPilotoTimer++;
            if (nextSimState.chamaPilotoTimer <= params.time_chama_atv) {
                // Lógica da chama piloto aqui
                // Por exemplo, manter ventoinha ligada mesmo sem outras condições
            } else {
                nextSimState.chamaPilotoActive = false;
            }
        }

        // -------------------------------
        // 4. CONTROLE DE UMIDADE (Independente)
        // -------------------------------
        if (inputs.umidade_sensor < (params.sp_umid - params.hist_umid)) {
            nextOutputs.q6_damper = true;
        } else if (inputs.umidade_sensor > (params.sp_umid + params.hist_umid)) {
            nextOutputs.q6_damper = false;
        }

        // -------------------------------
        // 5. ALARME (Q7)
        // -------------------------------
        const umidadeForaFaixa =
            inputs.umidade_sensor < (params.sp_umid - params.hist_umid) ||
            inputs.umidade_sensor > (params.sp_umid + params.hist_umid);

        if (umidadeForaFaixa && !nextSimState.alarmReseted) {
            nextSimState.alarmActive = true;
        }

        // Alarme cíclico ON/OFF após reset
        if (nextSimState.alarmActive && nextSimState.alarmReseted && params.alarme_enabled) {
            nextSimState.timerAlarme++;
            const cycleAlarm = (params.time_alarme_on + params.time_alarme_off) * 60; // Converter para segundos
            const posAlarm = nextSimState.timerAlarme % cycleAlarm;
            nextOutputs.q7_alarme = (posAlarm < (params.time_alarme_on * 60));
        } else if (nextSimState.alarmActive && !nextSimState.alarmReseted) {
            nextOutputs.q7_alarme = true;
        } else {
            nextOutputs.q7_alarme = false;
            nextSimState.timerAlarme = 0;
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
            const payload: any = {};

            // Enviar todos os parâmetros
            if (newParams.sp_temp !== undefined) payload.sp_temp = updated.sp_temp;
            if (newParams.sp_umid !== undefined) payload.sp_umid = updated.sp_umid;
            if (newParams.hist_temp !== undefined) payload.hist_temp = updated.hist_temp;
            if (newParams.hist_umid !== undefined) payload.hist_umid = updated.hist_umid;
            if (newParams.temp_unit !== undefined) payload.temp_unit = updated.temp_unit;
            if (newParams.time_vibrador_on !== undefined) payload.time_vibrador_on = updated.time_vibrador_on;
            if (newParams.time_vibrador_off !== undefined) payload.time_vibrador_off = updated.time_vibrador_off;
            if (newParams.time_rosca_sec_on !== undefined) payload.time_rosca_sec_on = updated.time_rosca_sec_on;
            if (newParams.time_rosca_sec_off !== undefined) payload.time_rosca_sec_off = updated.time_rosca_sec_off;
            if (newParams.time_alarme_on !== undefined) payload.time_alarme_on = updated.time_alarme_on;
            if (newParams.time_alarme_off !== undefined) payload.time_alarme_off = updated.time_alarme_off;
            if (newParams.alarme_enabled !== undefined) payload.alarme_enabled = updated.alarme_enabled;
            if (newParams.time_chama_atv !== undefined) payload.time_chama_atv = updated.time_chama_atv;
            if (newParams.time_chama_wait !== undefined) payload.time_chama_wait = updated.time_chama_wait;

            if (Object.keys(payload).length > 0) {
                clientRef.current.publish(topicCmd, JSON.stringify(payload));
                console.log('⚙️ Parâmetros enviados:', payload);
            }
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
        const newOutputs = { ...s.outputs, [key]: !s.outputs[key] };

        // Se não for demo e estiver conectado ao MQTT, enviar comando
        if (!isDemoMode && clientRef.current?.connected) {
            const topicCmd = `${TOPIC_PREFIX}/${s.macAddress}/comando`;
            const payload = {
                manual_mode: true,
                [key]: newOutputs[key]
            };
            clientRef.current.publish(topicCmd, JSON.stringify(payload));
            console.log('🎛️ Comando manual enviado:', payload);
        }

        return { ...s, outputs: newOutputs };
    });
  }, [isDemoMode]);

  const setManualMode = useCallback((enabled: boolean) => {
    setState(s => {
        // Se não for demo e estiver conectado ao MQTT, enviar comando
        if (!isDemoMode && clientRef.current?.connected) {
            const topicCmd = `${TOPIC_PREFIX}/${s.macAddress}/comando`;
            const payload = { manual_mode: enabled };
            clientRef.current.publish(topicCmd, JSON.stringify(payload));
            console.log('🎛️ Modo manual:', enabled ? 'ATIVADO' : 'DESATIVADO');
        }

        return { ...s, isManualMode: enabled };
    });
  }, [isDemoMode]);

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
