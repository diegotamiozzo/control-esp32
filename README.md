# Sistema de Controle Industrial - DHT11 + ESP32

Sistema completo de controle e monitoramento industrial para gerenciamento de processos com temperatura, umidade e múltiplas entradas/saídas. **Implementa máquina de estados robusta com sequências de partida/parada controladas.**

## Características

### Interface Web
- Dashboard em tempo real com temperatura e umidade
- **Visualização do estado da máquina de estados**
- **Mensagens de alarme em tempo real**
- Visualização de falhas do sistema
- Configuração completa de parâmetros
- Modo Test Manual para controle direto
- Interface responsiva e moderna
- Conexão MQTT com HiveMQ Cloud

### Sistema de Controle
- **7 Entradas Digitais** (I1-I7: Habilitação, Reset, Energia, Fins de Curso)
- **7 Saídas** (Q1-Q7: Roscas, Vibrador, Ventoinha, Corta-Fogo, Damper, Alarme)
- **Máquina de estados com 8 estados** (Parado, Partida, Operação, Parada, Alarme, Piloto)
- Controle automático baseado em setpoints
- Temporizadores cíclicos configuráveis
- Função Chama Piloto
- Sistema de alarmes críticos com reset
- Proteção contra falhas de energia
- Verificação de sensores de fim de curso
- Sequências de segurança automáticas

## Estrutura do Projeto

```
├── /pages                          # Páginas React (Dashboard, Settings, TestMode)
├── /components                     # Componentes reutilizáveis
├── /context                        # Context API (MachineContext)
├── /firmware                       # Código Arduino ESP32
│   ├── esp32-main.ino              # Firmware
├── netlify.toml                    # Deploy Netlify
└── .env                            # Variáveis de ambiente
```

## Tecnologias

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS
- MQTT.js para comunicação real-time
- Lucide React (ícones)
- React Router DOM

### Hardware
- ESP32 (qualquer modelo)
- DHT11 (temperatura e umidade)
- 7 Relés para as saídas Q1-Q7
- 5 Botões/sensores para entradas I1-I5

## Instalação

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Arquivo `.env` já configurado:

```env
VITE_MQTT_BROKER=
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=

```

### 3. Iniciar Desenvolvimento

```bash
npm run dev
```

### 4. Build para Produção

```bash
npm run build
```

## Entradas e Saídas

### Entradas (Inputs)

| ID  | Nome                    | Descrição                          | Tipo     |
|-----|-------------------------|------------------------------------|----------|
| I1  | Botão Liga              | Libera o ciclo automático          | Digital  |
| I2  | Botão Reset             | Reset de falhas (Pulso)            | Digital  |
| I3  | Falta de Energia        | Sinal relé falta fase              | Digital  |
| I4  | Fim Curso Aberta        | Sensor abertura corta fogo         | Digital  |
| I5  | Fim Curso Fechada       | Sensor fechamento corta fogo       | Digital  |
| I6  | Temperatura             | Sensor DHT11 (0-165°C)             |     DHT11 |
| I7  | Umidade                 | Sensor DHT11 (20-100%)             | DHT11 |

### Saídas (Outputs)

| ID  | Nome                    | Descrição                          |
|-----|-------------------------|------------------------------------|
| Q1  | Rosca Principal         | Alimenta o sistema                 |
| Q2  | Rosca Secundária        | Alimentação auxiliar               |
| Q3  | Vibrador                | Para descer o material             |
| Q4  | Ventoinha               | Sistema aquecimento/queima         |
| Q5  | Corta Fogo              | Atuador abre passagem              |
| Q6  | Damper                  | Abertura umidade                   |
| Q7  | Alarme                  | Alarme desvio temp/umidade         |

## Parâmetros Ajustáveis

### 1. Temperatura
- **SP_Temp**: Setpoint de temperatura (0-165°C ou 0-329°F)
- **Histerese**: Faixa de controle térmico (1-10°)
- **Unidade**: °C ou °F

### 2. Umidade
- **SP_Umid**: Setpoint de umidade (20-100%)
- **Histerese**: Faixa de controle (1-20%)

### 3. Temporizadores Cíclicos
- **Vibrador (Q3)**: Tempo ON/OFF (segundos)
- **Rosca Secundária (Q2)**: Tempo ON/OFF (segundos)
- **Alarme (Q7)**: Tempo ON/OFF (minutos) + Habilitado/Desabilitado

### 4. Função Chama Piloto
- **Tempo de Ativação**: Duração em segundos
- **Tempo de Espera**: Permanência dentro da histerese (minutos)

## Lógica de Controle (Máquina de Estados)

### Estados da Máquina

O sistema implementa 8 estados principais:

| Estado | Código | Descrição |
|--------|--------|-----------|
| **ST_OFF_IDLE** | 0 | Sistema Parado / Aguardando |
| **ST_START_SEQ_1** | 1 | Partida: Ventoinha + Q2 + Abre Q5 |
| **ST_START_WAIT_OPEN** | 2 | Partida: Aguarda sensor Q5 abrir |
| **ST_RUNNING** | 3 | Operação Normal (Alimentação) |
| **ST_STOP_CASCADE_1** | 4 | Parada: Desliga Alimentação |
| **ST_STOP_WAIT_CLOSE** | 5 | Parada: Aguarda Q5 fechar |
| **ST_ALARM_CRITICAL** | 6 | Falha Crítica (Falta fase ou Falha Corta-Fogo) |
| **ST_PILOT_MODE** | 7 | Modo Chama Piloto |

### Condições de Segurança

**Habilitação Geral (I1)**
- Sistema só funciona se I1 estiver ativo
- Se I1 desligar → Parada em Cascata Controlada

**Falha de Energia (I3)**
- Se I3 desligar:
  - Transição imediata para **ST_ALARM_CRITICAL**
  - Desliga todas as saídas Q1-Q6
  - Liga Alarme Q7 (cíclico)
  - **Reset:** Energia + I1 + I2 (Botão Reset)

### Sequência de Partida (Controlada)

**Condições:** I1 ativo + I3 ativo + Temperatura < (SP - Histerese)

**Estado ST_START_SEQ_1:**
1. Liga Ventoinha (Q4)
2. Liga Rosca Secundária (Q2) em ciclo
3. Aciona Corta-Fogo (Q5) para abrir

**Estado ST_START_WAIT_OPEN:**
1. Mantém Q4, Q2, Q5 ativos
2. **Aguarda sensor I4** (fim de curso aberta)
3. Quando I4 ativo → Transição para **ST_RUNNING**

**Estado ST_RUNNING:**
1. Liga Rosca Principal (Q1)
2. Liga Vibrador (Q3) em ciclo
3. Mantém Q4, Q2, Q5 ativos
4. Q6 controlado independentemente (umidade)

### Regime de Trabalho

**Controle do Vibrador (Q3)**
- Opera em modo cíclico
- Só liga se Q1 estiver ligado
- Se Q1 desligar → Q3 desliga

**Controle de Umidade (Q6)**
- Independente do ciclo principal
- Umidade < SP - Histerese → Abre
- Umidade > SP + Histerese → Fecha

### Sequência de Parada (Controlada)

**Condições:** Temperatura ≥ Setpoint OU I1 desligado

**Estado ST_STOP_CASCADE_1:**
1. Desliga Q1 (Rosca Principal)
2. Desliga Q3 (Vibrador)
3. Desliga Q2 (Rosca Secundária)
4. Desliga Q4 (Ventoinha)
5. Desenergiza Q5 → Inicia fechamento
6. Transição para **ST_STOP_WAIT_CLOSE**

**Estado ST_STOP_WAIT_CLOSE:**
1. Mantém Q5 desenergizado
2. **Monitora sensor I5** (fim de curso fechada)
3. Se I5 ativo → Retorna para **ST_OFF_IDLE**
4. **Se não fechar em 10s** → **ST_ALARM_CRITICAL**

### Modo Chama Piloto

**Condições:** Temperatura na histerese (SP > T > SP-Hist)

1. Aguarda tempo configurável (time_chama_wait)
2. Liga Q4 (Ventoinha) por tempo configurável (time_chama_atv)
3. Desliga e aguarda novamente

## Configuração do ESP32

### Hardware Necessário

- ESP32 (qualquer modelo)
- DHT11
- 7 Relés para saídas Q1-Q7
- 5 Botões/sensores para entradas I1-I5

### Pinagem do Firmware (esp32_main_state_machine.ino)

```cpp
// Sensor DHT11
#define DHT_PIN 23
#define DHT_TYPE DHT11

// Entradas (INPUT_PULLUP - Ativo em GND)
#define PIN_I1_HABILITACAO 13
#define PIN_I2_RESET 14
#define PIN_I3_ENERGIA 27
#define PIN_I4_FIM_CURSO_ABERTA 26
#define PIN_I5_FIM_CURSO_FECHADA 25

// Saídas (Ativo em HIGH)
#define PIN_Q1_ROSCA_PRINCIPAL 33
#define PIN_Q2_ROSCA_SECUNDARIA 32
#define PIN_Q3_VIBRADOR 15
#define PIN_Q4_VENTOINHA 4
#define PIN_Q5_CORTA_FOGO 16
#define PIN_Q6_DAMPER 17
#define PIN_Q7_ALARME 5
```

**IMPORTANTE:** As entradas usam INPUT_PULLUP, então o acionamento é feito conectando o pino ao GND (lógica invertida).

### Bibliotecas Necessárias

Instale via Arduino IDE (Library Manager):

1. `WiFiManager` by tzapu
2. `PubSubClient` by Nick O'Leary
3. `ArduinoJson` by Benoit Blanchon
4. `DHT sensor library` by Adafruit
5. `Adafruit Unified Sensor`

### Upload do Código

1. Abra `/firmware\esp32-main.ino` no Arduino IDE
2. Selecione a placa: **ESP32 Dev Module**
3. Configure:
   - Upload Speed: 115200
   - Flash Size: 4MB
   - Partition Scheme: "Default 4MB with spiffs"
4. Selecione a porta serial correta
5. Clique em Upload (Ctrl+U)

### Primeira Configuração

1. O ESP32 cria uma rede Wi-Fi: **"ESP32_IOT_SETUP"** (senha: `senha123`)
2. Conecte-se a essa rede pelo celular/computador
3. Página de configuração abre automaticamente
4. Escolha sua rede Wi-Fi e insira a senha
5. O ESP32 salvará e conectará automaticamente

### Obter o MAC Address

1. Abra o Monitor Serial (115200 baud)
2. Após conectar ao Wi-Fi, você verá:
   ```
   WiFi conectado!
   MAC: AABBCC112233
   ```
3. Copie esse MAC Address

## Usando a Aplicação

### 1. Login
- Acesse a aplicação web
- Insira o MAC Address do ESP32
- Clique em "Conectar"

### 2. Dashboard
Visualize em tempo real:
- **Estado da Máquina** (8 estados possíveis)
- **Mensagem de Alarme** (OK / Falha Específica)
- Temperatura e Umidade com indicadores visuais
- Status do Sistema (I1 - Liga/Desliga)
- Status de Energia (I3 - Normal/Falha)
- Status de Alarmes (Q7 - Ativo/Normal)
- Conexão MQTT

### 3. Settings (Configurações)
Configure todos os parâmetros:
- Setpoints de temperatura e umidade
- Histereses
- Temporizadores cíclicos
- Função Chama Piloto
- Unidade de temperatura (°C/°F)

### 4. Test Mode (Modo Manual)
Controle direto de todas as saídas para testes e manutenção.

## Protocolo MQTT

### Tópicos

```
dispositivo/{MAC_ADDRESS}/telemetria  - ESP32 → Web (dados)
dispositivo/{MAC_ADDRESS}/comando     - Web → ESP32 (comandos)
dispositivo/{MAC_ADDRESS}/conexao     - Status conexão
```

### Payload Telemetria (ESP32 → Web)

**Firmware State Machine:**
```json
{
  "i1_hab": true,
  "i2_rst": false,
  "i3_pwr": true,
  "i4_fc_open": true,
  "i5_fc_close": false,
  "temp": 25.5,
  "umid": 65.2,
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

**Campos importantes:**
- `state`: Estado da máquina (0-7)
- `msg`: Mensagem de status ("OK" ou descrição da falha)

### Payload Comando (Web → ESP32)

```json
{
  "sp_temp": 26.0,
  "sp_umid": 65.0,
  "hist_temp": 3.0,
  "hist_umid": 6.0,
  "temp_unit": "F"
}
```

## Troubleshooting

### ESP32 não conecta ao Wi-Fi
- Verifique SSID e senha
- Mantenha botão reset pressionado 10s para resetar configurações
- Tente conectar novamente ao AP "ESP32_IOT_SETUP"

### Dashboard não recebe dados
- Confirme que o MAC Address está correto
- Verifique conexão MQTT no Monitor Serial
- Confirme credenciais MQTT no `.env`

### Leituras DHT11 incorretas
- Verifique conexões: VCC→3.3V, DATA→GPIO4, GND→GND
- DHT11 tem erro de ±2°C e ±5% umidade
- Aguarde 2s entre leituras

### Saídas não respondem
- Verifique alimentação dos relés
- Confirme pinagem no firmware
- Use Test Mode para testar saídas individualmente

## Deploy no Netlify

### Deploy Automático

1. Conecte repositório ao Netlify
2. Configure variáveis de ambiente
3. Deploy automático a cada push

### Deploy Manual

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

## Modo Demo

O sistema inclui um modo demo que simula o ESP32:
- Gera dados aleatórios de temperatura e umidade
- Simula lógica de controle
- Ideal para testes sem hardware

## Licença

MIT

## Autor

Sistema desenvolvido para controle industrial com ESP32 e React.
