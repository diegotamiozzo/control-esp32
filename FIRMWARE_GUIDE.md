# Guia do Firmware ESP32 - Máquina de Estados

Este documento descreve o firmware completo com máquina de estados para o sistema de controle industrial.

## Arquivos de Firmware Disponíveis

### 1. `esp32_main_state_machine.ino` (RECOMENDADO)
Versão completa com máquina de estados robusta baseada no documento de lógica de controle.

**Características:**
- Sistema de máquina de estados completo com 8 estados
- Sequências de partida e parada controladas
- Verificação de sensores de fim de curso
- Modo chama piloto
- Alarmes críticos com reset
- Controle de umidade independente
- Temporizadores cíclicos para Q2, Q3 e Q7
- Persistência de configurações na Flash

**Estados da Máquina:**
- `ST_OFF_IDLE (0)` - Sistema Parado / Aguardando
- `ST_START_SEQ_1 (1)` - Partida: Ventoinha + Q2 + Abre Q5
- `ST_START_WAIT_OPEN (2)` - Partida: Aguarda sensor Q5 abrir
- `ST_RUNNING (3)` - Operação Normal (Alimentação)
- `ST_STOP_CASCADE_1 (4)` - Parada: Desliga Alimentação
- `ST_STOP_WAIT_CLOSE (5)` - Parada: Aguarda Q5 fechar
- `ST_ALARM_CRITICAL (6)` - Falha Crítica (Falta fase ou Falha Corta-Fogo)
- `ST_PILOT_MODE (7)` - Modo Chama Piloto

### 2. `esp32_main.ino`
Versão anterior mais simples, sem máquina de estados completa.

### 3. `esp32_main_CORRIGIDO.ino`
Versão intermediária com correções.

## Pinagem Física

### Entradas (INPUT_PULLUP - Ativo em GND)
```
PIN 13 -> I1 - Habilitação (Liga/Desliga Sistema)
PIN 14 -> I2 - Reset de Alarmes
PIN 27 -> I3 - Sensor de Energia (Falta de Fase)
PIN 26 -> I4 - Fim de Curso Aberta (Corta-Fogo)
PIN 25 -> I5 - Fim de Curso Fechada (Corta-Fogo)
PIN 23 -> DHT11 (Temperatura e Umidade)
```

### Saídas (Ativo em HIGH)
```
PIN 33 -> Q1 - Rosca Principal
PIN 32 -> Q2 - Rosca Secundária (Cíclica)
PIN 15 -> Q3 - Vibrador (Cíclico)
PIN 4  -> Q4 - Ventoinha
PIN 16 -> Q5 - Corta-Fogo (Atuador)
PIN 17 -> Q6 - Damper (Controle Umidade)
PIN 5  -> Q7 - Alarme Sonoro (Cíclico)
```

## Lógica de Controle

### Sequência de Partida
1. **Condições:** I1 ativo + I3 ativo + Temperatura < (SP - Histerese)
2. **ST_START_SEQ_1:** Liga Q4 (Ventoinha), Q2 (cíclico), Q5 (abre corta-fogo)
3. **ST_START_WAIT_OPEN:** Aguarda I4 (sensor abertura total)
4. **ST_RUNNING:** Liga Q1 (Rosca Principal) + Q3 (Vibrador cíclico)

### Operação Normal
- **Q1:** Ligado continuamente
- **Q2:** Ciclo ON/OFF (time_rosca_sec_on / time_rosca_sec_off)
- **Q3:** Ciclo ON/OFF (time_vibrador_on / time_vibrador_off)
- **Q4:** Ligado continuamente
- **Q5:** Energizado (mantém aberto)
- **Q6:** Controle independente de umidade
- **Q7:** Acionado em caso de alarmes

### Sequência de Parada
1. **Condições:** I1 desliga OU Temperatura >= SP
2. **ST_STOP_CASCADE_1:** Desliga Q1, Q3, Q2, Q4
3. Desenergiza Q5 (fecha corta-fogo)
4. **ST_STOP_WAIT_CLOSE:** Aguarda I5 (sensor fechamento)
5. Se não fechar em 10s → **ST_ALARM_CRITICAL**

### Alarme Crítico
**Gatilhos:**
- Falta de energia (I3 inativo)
- Falha no fechamento do corta-fogo (timeout I5)

**Comportamento:**
- Desliga todas as saídas (Q1-Q6)
- Q7 cicla ON/OFF (time_alarme_on / time_alarme_off)
- **Reset:** I3 ativo + I1 ativo + I2 pressionado

### Modo Chama Piloto
Quando temperatura está na histerese (SP > T > SP-Hist) por X minutos:
- Liga Q4 (Ventoinha) por Y segundos
- Aguarda tempo configurável antes de repetir

## Comunicação MQTT

### Tópicos
```
dispositivo/{MAC_ADDRESS}/telemetria  (Publicação)
dispositivo/{MAC_ADDRESS}/comando     (Subscrição)
dispositivo/{MAC_ADDRESS}/conexao     (LWT)
```

### Payload de Telemetria
```json
{
  "i1_hab": true,
  "i2_rst": false,
  "i3_pwr": true,
  "i4_fc_open": true,
  "i5_fc_close": false,
  "temp": 25.5,
  "umid": 60.2,
  "q1_main": true,
  "q2_sec": false,
  "q3_vib": true,
  "q4_fan": true,
  "q5_fire": true,
  "q6_damp": false,
  "q7_alarm": false,
  "state": 3,
  "msg": "OK",
  "sp_temp": 25.0,
  "sp_umid": 60.0,
  "hist_temp": 2.0,
  "hist_umid": 5.0,
  "temp_unit": "C"
}
```

### Comandos Aceitos
```json
{
  "sp_temp": 30.0,
  "hist_temp": 3.0,
  "sp_umid": 65.0,
  "hist_umid": 5.0,
  "temp_unit": "C",
  "time_vibrador_on": 5,
  "time_vibrador_off": 10,
  "time_rosca_sec_on": 8,
  "time_rosca_sec_off": 15,
  "time_alarme_on": 1,
  "time_alarme_off": 2,
  "alarme_enabled": true,
  "time_chama_atv": 30,
  "time_chama_wait": 5,
  "manual_mode": false
}
```

### Modo Manual
```json
{
  "manual_mode": true,
  "q1": true,
  "q2": false,
  "q3": true,
  "q4": true,
  "q5": false,
  "q6": true,
  "q7": false
}
```

## Parâmetros Ajustáveis

### Temperatura
- `sp_temp`: Setpoint (°C ou °F)
- `hist_temp`: Histerese
- `temp_unit`: 'C' ou 'F'

### Umidade
- `sp_umid`: Setpoint (%)
- `hist_umid`: Histerese (%)

### Temporizadores (segundos)
- `time_vibrador_on`: Tempo ligado Q3
- `time_vibrador_off`: Tempo desligado Q3
- `time_rosca_sec_on`: Tempo ligado Q2
- `time_rosca_sec_off`: Tempo desligado Q2
- `time_alarme_on`: Tempo ligado Q7
- `time_alarme_off`: Tempo desligado Q7

### Chama Piloto
- `time_chama_atv`: Segundos com Q4 ligado
- `time_chama_wait`: Minutos de espera na histerese

### Alarme
- `alarme_enabled`: Habilita ciclo do alarme

## Configuração WiFi

Na primeira inicialização:
1. ESP32 cria AP `ESP32_INDUSTRIAL` / senha: `senha123`
2. Conecte no WiFi do ESP32
3. Acesse http://192.168.4.1
4. Configure sua rede WiFi
5. ESP32 reinicia e conecta automaticamente

## Segurança

### Watchdog de Energia
- Qualquer falha em I3 → Alarme Crítico imediato
- Todas as saídas são desligadas
- Reset manual obrigatório

### Verificação de Sensores
- Timeout de 10s para fechamento do corta-fogo
- Se não fechar → Alarme Crítico

### Persistência
- Todos os parâmetros são salvos na Flash (NVS)
- Mantém configurações após reset/power cycle

## Bibliotecas Necessárias

```
- WiFi (ESP32 Core)
- WiFiClientSecure (ESP32 Core)
- PubSubClient (2.8.0)
- WiFiManager (2.0.16-rc.2)
- DHT sensor library (1.4.4)
- ArduinoJson (6.21.3)
- Preferences (ESP32 Core)
```

## Upload do Firmware

1. Abra o Arduino IDE
2. Configure:
   - Board: "ESP32 Dev Module"
   - Upload Speed: 115200
   - Flash Size: 4MB
   - Partition Scheme: "Default 4MB with spiffs"
3. Selecione a porta COM do ESP32
4. Abra `esp32_main_state_machine.ino`
5. Clique em Upload

## Monitoramento Serial

Baud Rate: 115200

Mensagens importantes:
```
=== Settings Loaded ===
INPUTS -> I1(Hab):1 | I3(Energia):1 | I4(Ab):0 | I5(Fech):1 | Temp:25.3
MQTT Conectado!
```

## Troubleshooting

### ESP32 não conecta WiFi
- Verificar configuração do WiFiManager
- Resetar configurações: manter GPIO 0 em GND durante boot

### MQTT não conecta
- Verificar credenciais (mqtt_user / mqtt_pass)
- Verificar certificado root_ca
- Verificar conectividade internet

### Leituras DHT11 inválidas
- Verificar conexão física (VCC, GND, Data)
- DHT11 precisa de pull-up 10K no pino de dados
- Aguardar 2s após power-on para estabilização

### Entradas não respondem
- Verificar INPUT_PULLUP
- Lógica invertida: GND = ativo
- Usar botões NA (Normalmente Aberto) para GND

## Integração com Frontend

O frontend em React/TypeScript já está configurado para:
- Mostrar estado atual da máquina
- Exibir mensagem de alarme
- Controlar parâmetros via MQTT
- Modo manual de controle
- Monitoramento em tempo real

Acesse o dashboard para visualizar:
- Estado da máquina de estados
- Temperatura e umidade
- Status de todas as entradas/saídas
- Mensagens de alarme
