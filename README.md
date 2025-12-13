# Sistema de Monitoramento DHT11 (React + ESP32)

Interface web para monitorar temperatura e umidade em tempo real usando sensor DHT11 e ESP32.

## Características

- Monitoramento em tempo real de temperatura (°C) e umidade (%)
- Conexão via MQTT (HiveMQ Cloud)
- Interface responsiva e moderna
- Configuração de setpoints e histerese
- Deploy otimizado para Netlify

## Estrutura do Projeto

```
├── /src                # Código React da aplicação web
├── /firmware           # Código Arduino para ESP32
├── netlify.toml        # Configuração para deploy Netlify
└── .env                # Variáveis de ambiente
```

## Tecnologias

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS
- MQTT.js
- Lucide React (ícones)

### Hardware
- ESP32 (qualquer modelo)
- DHT11 (sensor de temperatura e umidade)
- Relés opcionais para controle

## Como Rodar Localmente

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` (já configurado):

```env
VITE_MQTT_BROKER=
VITE_MQTT_USERNAME=
VITE_MQTT_PASSWORD=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 3. Iniciar Servidor de Desenvolvimento

```bash
npm run dev
```

### 4. Build para Produção

```bash
npm run build
```

## Deploy no Netlify

### Opção 1: Deploy Automático via Git

1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. O deploy será automático a cada push

### Opção 2: Deploy Manual

```bash
npm run build
npx netlify deploy --prod --dir=dist
```

## Configuração do ESP32

### Hardware Necessário

- ESP32 (qualquer modelo)
- DHT11
- 2-4 relés (opcionais, para controle)
- Cabos jumper

### Pinagem Padrão

```
DHT11:
- VCC  → 3.3V
- DATA → GPIO 4
- GND  → GND

Relés (opcionais):
- Relé 1 (Controle Temp)  → GPIO 25
- Relé 2 (Controle Umid)  → GPIO 26
- Relé 3 (Manual)         → GPIO 27
- Relé 4 (Manual)         → GPIO 14
```

### Bibliotecas Necessárias

Instale via Arduino IDE (Library Manager):

1. `WiFiManager` by tzapu
2. `PubSubClient` by Nick O'Leary
3. `ArduinoJson` by Benoit Blanchon
4. `DHT sensor library` by Adafruit
5. `Adafruit Unified Sensor`

### Upload do Código

1. Abra `/firmware/esp32_main.ino` no Arduino IDE
2. Selecione a placa ESP32 correta
3. Selecione a porta serial
4. Clique em Upload

### Configuração Wi-Fi

O ESP32 usa WiFiManager:

1. Na primeira inicialização, o ESP32 cria um ponto de acesso Wi-Fi chamado **"ESP32_IOT_SETUP"** (senha: senha123)
2. Conecte-se a esse Wi-Fi pelo celular/computador
3. Uma página de configuração abrirá automaticamente
4. Escolha sua rede Wi-Fi e insira a senha
5. O ESP32 salvará as credenciais e conectará automaticamente

### Obter o MAC Address

1. Abra o Monitor Serial (115200 baud)
2. Após conectar ao Wi-Fi, você verá o MAC Address no formato: `AABBCC112233`
3. Copie esse endereço

## Usando a Aplicação Web

1. Acesse a aplicação (local ou Netlify)
2. Na tela de login, insira o MAC Address do ESP32
3. O dashboard mostrará:
   - Temperatura atual (°C)
   - Umidade atual (%)
   - Status de conexão MQTT
   - Comparação com setpoints

### Configurações

Acesse a página "Configurações" para ajustar:

- **Setpoint de Temperatura**: 0-50°C (padrão: 25°C)
- **Histerese de Temperatura**: ±0.5-10°C (padrão: ±2°C)
- **Setpoint de Umidade**: 20-90% (padrão: 60%)
- **Histerese de Umidade**: ±1-20% (padrão: ±5%)

Os valores são salvos automaticamente no ESP32 via MQTT.

## Protocolo MQTT

### Tópicos

```
dispositivo/{MAC_ADDRESS}/telemetria  - ESP32 publica dados
dispositivo/{MAC_ADDRESS}/comando     - Web envia comandos
dispositivo/{MAC_ADDRESS}/conexao     - Status de conexão
```

### Payload de Telemetria (ESP32 → Web)

```json
{
  "temp": 25.5,
  "hum": 65.2,
  "sp_temp": 25.0,
  "sp_hum": 60.0,
  "rele1": 0,
  "rele2": 1,
  "rele3": 0,
  "rele4": 0
}
```

### Payload de Comando (Web → ESP32)

```json
{
  "sp_t": 26.0,
  "sp_h": 65.0,
  "r3": 1,
  "r4": 0
}
```

## Troubleshooting

### ESP32 não conecta ao Wi-Fi
- Verifique se o SSID e senha estão corretos
- Resete as configurações mantendo pressionado o botão de reset por 10s

### Dashboard não recebe dados
- Verifique se o MAC Address está correto
- Confirme que o ESP32 está conectado ao MQTT (Monitor Serial)
- Verifique as credenciais MQTT no arquivo `.env`

### Leituras do DHT11 incorretas
- Verifique as conexões do sensor
- O DHT11 tem margem de erro de ±2°C e ±5% umidade
- Aguarde 2 segundos entre leituras

## Licença

MIT

## Autor

Sistema desenvolvido para controle industrial com ESP32 e React.
