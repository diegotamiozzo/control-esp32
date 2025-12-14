# Guia de Configuração MQTT - Sistema Industrial ESP32

## Problema Resolvido

Este projeto estava configurado para conectar ao broker público HiveMQ, mas o ESP32 estava conectando ao HiveMQ Cloud (versão privada). Agora ambos estão sincronizados.

## Configuração Atual

### HiveMQ Cloud
- **Broker**: `72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud`
- **Porta ESP32 (TLS)**: 8883
- **Porta WebSocket (Frontend)**: 8884
- **Usuário**: `esp32_cliente02`
- **Senha**: `Corcel@73`

## Como Usar

### 1. Frontend (React)

As credenciais já estão configuradas no arquivo `.env`:

```env
VITE_MQTT_BROKER=wss://72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud:8884/mqtt
VITE_MQTT_USERNAME=esp32_cliente02
VITE_MQTT_PASSWORD=Corcel@73
```

**IMPORTANTE**: Se você fizer deploy no Netlify, adicione estas variáveis de ambiente no painel de configuração do Netlify.

### 2. ESP32 (Firmware)

Existem dois arquivos de firmware:

#### `esp32_main.ino` (Original - COM PROBLEMAS)
- Usa pinos strapping (2, 12, 15) que podem causar problemas
- DHT11 no pino 32

#### `esp32_main_CORRIGIDO.ino` (Recomendado)
- **USE ESTE ARQUIVO!**
- Pinagem corrigida evitando strapping pins
- DHT11 no pino 23 (mais estável)
- Logs melhorados no Serial Monitor

### 3. Carregar Firmware no ESP32

1. Abra a Arduino IDE
2. Instale as bibliotecas necessárias:
   - WiFiManager by tzapu
   - PubSubClient by Nick O'Leary
   - DHT sensor library by Adafruit
   - ArduinoJson by Benoit Blanchon

3. Configure a placa:
   - **Placa**: ESP32 Dev Module
   - **Upload Speed**: 115200
   - **Flash Frequency**: 80MHz
   - **Flash Mode**: QIO
   - **Flash Size**: 4MB
   - **Partition Scheme**: Default 4MB

4. Carregue o arquivo `esp32_main_CORRIGIDO.ino`

5. Abra o Serial Monitor (115200 baud)

### 4. Primeira Conexão WiFi

Na primeira inicialização:

1. O ESP32 criará um Access Point chamado **"ESP32_INDUSTRIAL"**
2. Senha: **"senha123"**
3. Conecte seu celular/computador a esta rede
4. Um portal de configuração abrirá automaticamente
5. Selecione sua rede WiFi e insira a senha
6. O ESP32 reiniciará e conectará automaticamente

### 5. Obter o MAC do ESP32

No Serial Monitor, você verá:

```
📱 MAC: 48E72999971C
📡 Tópico telemetria: dispositivo/48E72999971C/telemetria
📡 Tópico comando: dispositivo/48E72999971C/comando
```

**Copie o MAC sem os dois pontos!** Exemplo: `48E72999971C`

### 6. Conectar no Frontend

1. Acesse a aplicação web
2. Na tela de login, insira o MAC do ESP32
3. O sistema salvará automaticamente na lista de dispositivos recentes
4. Para trocar entre dispositivos, basta clicar em um MAC salvo

## Verificar Conexão MQTT

### No Frontend

1. Clique no ícone de bug (🐛) no canto inferior direito
2. Verifique:
   - Status MQTT: deve estar "Conectado"
   - Broker: deve mostrar a URL correta
   - MAC: deve corresponder ao seu ESP32

3. Abra o Console do navegador (F12) e procure por:
```
✓ MQTT CONECTADO COM SUCESSO!
📨 Mensagem recebida: dispositivo/[MAC]/telemetria
```

### No ESP32

No Serial Monitor, procure por:

```
✓ MQTT CONECTADO!
📤 Publicado: {"i1_habilitacao":false,"i2_reset":false...}
```

## Estrutura dos Tópicos MQTT

### Telemetria (ESP32 → Frontend)
**Tópico**: `dispositivo/[MAC]/telemetria`

Publicado a cada 2 segundos com:
```json
{
  "i1_habilitacao": false,
  "i2_reset": false,
  "i3_energia": true,
  "i4_fim_curso_aberta": false,
  "i5_fim_curso_fechada": false,
  "i6_temp_sensor": 25.5,
  "umidade_sensor": 60.2,
  "q1_rosca_principal": false,
  "q2_rosca_secundaria": false,
  "q3_vibrador": false,
  "q4_ventoinha": true,
  "q5_corta_fogo": false,
  "q6_damper": true,
  "q7_alarme": false,
  "sp_temp": 25.0,
  "sp_umid": 60.0,
  "hist_temp": 2.0,
  "hist_umid": 5.0,
  "temp_unit": "C"
}
```

### Comandos (Frontend → ESP32)
**Tópico**: `dispositivo/[MAC]/comando`

Exemplos:

#### Alterar Setpoints
```json
{
  "sp_temp": 28.0,
  "sp_umid": 65.0,
  "hist_temp": 3.0
}
```

#### Modo Manual
```json
{
  "manual_mode": true,
  "q1_rosca_principal": true,
  "q4_ventoinha": true
}
```

#### Desativar Modo Manual
```json
{
  "manual_mode": false
}
```

## Troubleshooting

### Frontend não conecta ao MQTT

1. Verifique se o `.env` está correto
2. Abra o console (F12) e veja os erros
3. Verifique se o firewall não está bloqueando a porta 8884
4. Teste a conexão usando um cliente MQTT (MQTT Explorer ou MQTTX)

### ESP32 não conecta ao MQTT

1. Verifique no Serial Monitor:
   - WiFi está conectado?
   - Qual é o código de erro? (`rc=X`)

2. Códigos de erro comuns:
   - `rc=-2`: Falha de rede
   - `rc=-4`: Timeout de conexão
   - `rc=2`: Protocolo inválido
   - `rc=4`: Credenciais inválidas
   - `rc=5`: Não autorizado

3. Soluções:
   - Verifique se as credenciais estão corretas
   - Teste a conexão com outro cliente MQTT
   - Verifique se o certificado CA está correto
   - Reinicie o ESP32

### Entradas não respondem

1. Verifique a pinagem no guia `PINOUT_GUIDE.md`
2. Lembre-se: lógica INPUT_PULLUP
   - **Sem GND**: entrada = false
   - **Com GND**: entrada = true
3. Teste com um jumper conectando o pino ao GND
4. No Serial Monitor, veja: `INPUTS -> I1(Hab):1 | I3(Energia):1`

### Saídas não acionam

1. **NUNCA conecte cargas direto no ESP32!**
2. Use módulos relé ou drivers
3. Corrente máxima por pino: 12mA
4. Verifique se o modo manual está ativo
5. Teste individualmente no Modo de Teste da aplicação

## Deploy no Netlify

1. Faça o build:
```bash
npm run build
```

2. No Netlify:
   - Arraste a pasta `dist` para fazer deploy
   - OU conecte o repositório Git

3. **IMPORTANTE**: Adicione as variáveis de ambiente:
   - `VITE_MQTT_BROKER`
   - `VITE_MQTT_USERNAME`
   - `VITE_MQTT_PASSWORD`

4. Como o projeto usa HashRouter, não precisa de configuração especial de redirects.

## Segurança

⚠️ **ATENÇÃO**: As credenciais MQTT estão expostas no código para fins de desenvolvimento. Para produção:

1. Use variáveis de ambiente também no ESP32
2. Crie usuários MQTT separados por dispositivo
3. Use ACLs (Access Control Lists) no HiveMQ Cloud
4. Considere usar autenticação por certificado

## Suporte

Se continuar com problemas:

1. Verifique os logs no Serial Monitor (ESP32)
2. Verifique o console do navegador (F12)
3. Use o botão de debug MQTT (🐛) na aplicação
4. Teste a conexão com MQTT Explorer: https://mqtt-explorer.com/
