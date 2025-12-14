export interface SystemInputs {
  i1_habilitacao: boolean;      // Botão Liga/Ciclo Automático
  i2_reset: boolean;            // Botão Reset de Falhas
  i3_energia: boolean;          // Falta de Energia (True = Energia OK, False = Falta Fase)
  i4_fim_curso_aberta: boolean; // Sensor Abertura Corta Fogo
  i5_fim_curso_fechada: boolean;// Sensor Fechamento Corta Fogo
  i6_temp_sensor: number;       // Sensor Temperatura (Analógico simulado)
  umidade_sensor: number;       // Sensor Umidade (Analógico simulado) - I7
}

export interface SystemOutputs {
  q1_rosca_principal: boolean;  // Alimenta o sistema
  q2_rosca_secundaria: boolean; // Alimentação auxiliar
  q3_vibrador: boolean;         // Descer material (Cíclico)
  q4_ventoinha: boolean;        // Sistema aquecimento
  q5_corta_fogo: boolean;       // Atuador passagem (True = Abrir/Energizado)
  q6_damper: boolean;           // Controle Umidade
  q7_alarme: boolean;           // Alarme Geral
}

export interface Parameters {
  // Temperatura
  sp_temp: number;
  hist_temp: number;
  temp_unit: 'C' | 'F';

  // Umidade
  sp_umid: number;
  hist_umid: number;
  
  // Tempos Cíclicos (Segundos)
  time_vibrador_on: number;
  time_vibrador_off: number;
  
  time_rosca_sec_on: number;
  time_rosca_sec_off: number;
  
  // Alarme (Minutos)
  time_alarme_on: number;
  time_alarme_off: number;
  alarme_enabled: boolean;

  // Chama Piloto
  time_chama_atv: number; // Segundos
  time_chama_wait: number; // Minutos
}

export enum MachineState {
  ST_OFF_IDLE = 0,          // Sistema Parado / Aguardando
  ST_START_SEQ_1 = 1,       // Partida: Ventoinha + Q2 + Abre Q5
  ST_START_WAIT_OPEN = 2,   // Partida: Aguarda sensor Q5 abrir
  ST_RUNNING = 3,           // Operação Normal (Alimentação)
  ST_STOP_CASCADE_1 = 4,    // Parada: Desliga Alimentação
  ST_STOP_WAIT_CLOSE = 5,   // Parada: Aguarda Q5 fechar
  ST_ALARM_CRITICAL = 6,    // Falha Crítica (Falta fase ou Falha Corta-Fogo)
  ST_PILOT_MODE = 7         // Modo Chama Piloto
}

export interface AppState {
  macAddress: string | null;
  isConnected: boolean;
  mqttConnected: boolean;
  inputs: SystemInputs;
  outputs: SystemOutputs;
  params: Parameters;
  isManualMode: boolean;
  machineState: MachineState;
  alarmMessage: string;
  // Internal simulation state
  simState: {
    sequenceStep: 'STOPPED' | 'STARTING_FAN' | 'STARTING_AUGER2' | 'OPENING_VALVE' | 'WAITING_OPEN' | 'RUNNING' | 'STOPPING';
    timerVibrador: number;
    timerRoscaSec: number;
    timerAlarme: number;
    alarmActive: boolean;
    alarmReseted: boolean;
    prevI2Reset: boolean;
    chamaPilotoTimer: number;
    chamaPilotoWaitTimer: number;
    chamaPilotoActive: boolean;
    tempInHysteresisTimer: number;
  }
}