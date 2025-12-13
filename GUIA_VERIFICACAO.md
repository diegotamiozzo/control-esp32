# Guia de Verificação - ESP32 + Dashboard Web

## Problemas Corrigidos

### 1. Configuração do Broker MQTT
- ✅ Arquivo `.env` atualizado com as credenciais corretas do HiveMQ Cloud
- ✅ Broker: `wss://72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud:8884/mqtt`
- ✅ Usuário: `esp32_cliente02`
- ✅ Senha: `Corcel@73`

### 2. Normalização do MAC Address
- ✅ Frontend agora remove os dois pontos do MAC automaticamente
- ✅ Formato normalizado: `48E72999971C` (igual ao ESP32)
- ✅ Aceita entrada com ou sem dois pontos: `48:E7:29:99:97:1C` ou `48E72999971C`

### 3. Página de Login Melhorada
- ✅ Botão de acesso rápido ao seu ESP32
- ✅ Validação melhorada do formato MAC
- ✅ Mensagens de erro mais claras

### 4. Logs de Debug
- ✅ Logs detalhados de conexão MQTT
- ✅ Visualização de mensagens recebidas
- ✅ Status de inscrição nos tópicos

---

## Como Verificar a Conexão

### Passo 1: Verificar o ESP32
1. Abra o Serial Monitor no Arduino IDE (115200 baud)
2. Verifique se o ESP32 está conectado ao WiFi
3. Verifique se o ESP32 conectou ao MQTT:
   ```
   MQTT Conectado!
   ```
4. Anote o MAC Address exibido no Serial Monitor

### Passo 2: Verificar os Tópicos MQTT
O ESP32 publica em:
- **Telemetria**: `dispositivo/48E72999971C/telemetria`
- **Comando**: `dispositivo/48E72999971C/comando`
- **Status**: `dispositivo/48E72999971C/conexao`

### Passo 3: Acessar o Dashboard
1. Execute `npm run dev` (já está executando automaticamente)
2. Abra o navegador em `http://localhost:5173`
3. Clique no botão **"Meu ESP32"** para conexão rápida
4. Aguarde a mensagem "Conectado" aparecer no canto superior direito

### Passo 4: Verificar Logs no Console do Navegador
Abra o Console do Navegador (F12) e procure por:

```
=== INICIANDO CONEXÃO MQTT ===
Broker: wss://72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud:8884/mqtt
Usuário: esp32_cliente02
MAC Address: 48E72999971C
Tópico: dispositivo/48E72999971C/telemetria
✓ MQTT CONECTADO COM SUCESSO!
✓ Inscrito em: dispositivo/48E72999971C/telemetria
✓ Inscrição confirmada
```

Quando o ESP32 publicar dados, você verá:
```
📨 Mensagem recebida: dispositivo/48E72999971C/telemetria
📦 Payload: { i1_habilitacao: false, i2_reset: false, ... }
```

---

## Possíveis Problemas e Soluções

### ❌ Não conecta ao MQTT

**Possível causa**: Porta WebSocket incorreta

**Solução**: Verifique no console do HiveMQ Cloud qual é a porta WebSocket Secure. Normalmente é:
- Porta `8883`: MQTT com TLS (usado pelo ESP32)
- Porta `8884`: WebSocket Secure (usado pelo navegador)

Se necessário, altere no arquivo `.env`:
```
VITE_MQTT_BROKER=wss://72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud:8884/mqtt
```

### ❌ Conecta mas não recebe dados

**Possível causa**: MAC Address diferente

**Solução**: Verifique se o MAC no dashboard é exatamente o mesmo que aparece no Serial Monitor do ESP32 (sem os dois pontos).

### ❌ ESP32 desconecta frequentemente

**Possível causa**: Sinal WiFi fraco ou timeout do broker

**Solução**:
1. Aproxime o ESP32 do roteador
2. Verifique a configuração `keepalive` no código
3. Verifique os limites de conexão no HiveMQ Cloud

---

## Estrutura dos Dados MQTT

### Telemetria (ESP32 → Dashboard)
```json
{
  "i1_habilitacao": false,
  "i2_reset": false,
  "i3_energia": true,
  "i4_fim_curso_aberta": false,
  "i5_fim_curso_fechada": true,
  "i6_temp_sensor": 25.5,
  "umidade_sensor": 60.2,
  "q1_rosca_principal": false,
  "q2_rosca_secundaria": false,
  "q3_vibrador": false,
  "q4_ventoinha": true,
  "q5_corta_fogo": false,
  "q6_damper": false,
  "q7_alarme": false,
  "sp_temp": 25.0,
  "sp_umid": 60.0,
  "hist_temp": 2.0,
  "hist_umid": 5.0,
  "temp_unit": "C"
}
```

### Comandos (Dashboard → ESP32)
```json
{
  "sp_temp": 30.0,
  "sp_umid": 65.0,
  "hist_temp": 3.0,
  "hist_umid": 10.0,
  "temp_unit": "C"
}
```

---

## Modo de Teste Manual

### O que foi corrigido?

**Problema 1**: Modo de teste não funcionava com ESP32 real
- ✅ CORRIGIDO: Agora o firmware aceita comandos de controle manual via MQTT

**Problema 2**: Lógica invertida das entradas (INPUT_PULLUP)
- ✅ CORRIGIDO: Entradas agora funcionam corretamente com GND = HIGH (ativo)

### Como funciona INPUT_PULLUP?

As entradas digitais do ESP32 usam `INPUT_PULLUP`, que significa:
- **Sem conexão (pino flutuante)**: Lê HIGH (1) → Invertido para **false (inativo)**
- **Conectado ao GND**: Lê LOW (0) → Invertido para **true (ativo)**

Portanto:
- Para **ativar** uma entrada: Conecte o pino ao **GND**
- Para **desativar** uma entrada: Desconecte o pino (deixe flutuante)

### Como usar o Modo de Teste?

1. Acesse a página **Test Mode** no menu lateral
2. Clique em **"Habilitar"** para ativar o modo de teste
3. O firmware ESP32 receberá o comando `manual_mode: true`
4. A lógica automática será **pausada**
5. Você poderá clicar nas saídas (Q1-Q7) para ligá-las/desligá-las
6. Cada clique envia um comando MQTT para o ESP32

### Comandos MQTT do Modo de Teste

Quando você ativa o modo de teste:
```json
{ "manual_mode": true }
```

Quando você clica em uma saída (exemplo Q1):
```json
{
  "manual_mode": true,
  "q1_rosca_principal": true
}
```

Para sair do modo de teste:
```json
{ "manual_mode": false }
```

### Verificação no Serial Monitor

Ao ativar o modo de teste, você verá no Serial Monitor:
```
Modo Manual: ATIVADO
```

Ao desativar:
```
Modo Manual: DESATIVADO
```

---

## Próximos Passos

1. ✅ Verificar conexão WiFi do ESP32
2. ✅ Verificar conexão MQTT do ESP32
3. ✅ Conectar o dashboard usando o botão "Meu ESP32"
4. ✅ Verificar os logs no console do navegador
5. ✅ Verificar se os dados estão sendo recebidos no dashboard
6. ✅ Testar o modo de teste manual (Test Mode)
7. ✅ Testar acionamento das entradas conectando pinos ao GND
8. Ajustar parâmetros na página Settings e verificar se o ESP32 recebe os comandos
