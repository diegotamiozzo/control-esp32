# Correções Aplicadas - ESP32 + Dashboard

## Problema 1: Modo de Teste Não Funcionava

### Antes
- Modo de teste só funcionava no modo DEMO
- ESP32 não aceitava comandos de controle manual das saídas
- Frontend não enviava comandos MQTT para controlar as saídas

### Depois
**Firmware ESP32** (`firmware/esp32_main.ino`):
- ✅ Adicionada variável `manual_mode` (linha 101)
- ✅ Função `controlLogic()` verifica se está em modo manual (linhas 212-216)
- ✅ Callback MQTT aceita comando `manual_mode` (linhas 344-348)
- ✅ Callback MQTT aceita comandos diretos das saídas quando `manual_mode = true` (linhas 350-360)

**Frontend** (`context/MachineContext.tsx`):
- ✅ `setManualMode()` envia comando MQTT `{ manual_mode: true/false }` (linhas 410-422)
- ✅ `toggleOutputManual()` envia comando MQTT para cada saída (linhas 391-408)
- ✅ Logs de debug para verificar comandos enviados

### Como Testar
1. Faça upload do novo firmware para o ESP32
2. Acesse a página **Test Mode** no dashboard
3. Clique em **"Habilitar"**
4. Verifique no Serial Monitor: `Modo Manual: ATIVADO`
5. Clique nas saídas (Q1-Q7) para ligá-las/desligá-las
6. Verifique no Serial Monitor se as saídas estão mudando de estado

---

## Problema 2: Lógica Invertida das Entradas (INPUT_PULLUP)

### Antes
- Entradas digitais liam diretamente `digitalRead()`
- Com `INPUT_PULLUP`, pino flutuante = HIGH (1)
- Conectar GND = LOW (0)
- Lógica estava invertida: GND aparecia como "desativado"

### Depois
**Firmware ESP32** (`firmware/esp32_main.ino`):
- ✅ Função `readInputs()` inverte a lógica das entradas (linhas 180-186)
- ✅ Agora: `inputs.i1_habilitacao = !digitalRead(PIN_I1_HABILITACAO)`
- ✅ Resultado: GND = true (ativo), flutuante = false (inativo)

**Frontend** (`context/MachineContext.tsx`):
- ✅ Valores padrão das entradas ajustados para `false` (inativo)
- ✅ Comentários explicando a lógica INPUT_PULLUP (linhas 39-45)

### Como Funciona Agora

| Pino Físico | digitalRead() | Após Inversão | Estado no Dashboard |
|-------------|---------------|---------------|---------------------|
| Flutuante   | HIGH (1)      | false         | Inativo             |
| GND         | LOW (0)       | true          | Ativo               |

### Como Testar
1. **Sem conexão**: Todos os pinos devem aparecer como "inativos" no dashboard
2. **Conectar I1 ao GND**: I1_habilitacao deve mudar para "ativo" (verde)
3. **Desconectar I1**: I1_habilitacao deve voltar para "inativo"

---

## Resumo das Alterações

### Arquivos Modificados

1. **firmware/esp32_main.ino**
   - Adicionada variável `manual_mode`
   - Lógica de controle pausada quando em modo manual
   - Callback MQTT aceita comandos de modo manual e saídas
   - Lógica das entradas invertida para INPUT_PULLUP

2. **context/MachineContext.tsx**
   - `setManualMode()` envia comandos MQTT
   - `toggleOutputManual()` envia comandos MQTT
   - Valores padrão das entradas ajustados
   - Logs de debug adicionados

3. **.env**
   - Configurações do broker HiveMQ Cloud
   - Credenciais de acesso

4. **pages/Login.tsx**
   - Normalização do MAC Address (remove dois pontos)
   - Botão de acesso rápido

---

## O que Você Precisa Fazer

### 1. Fazer Upload do Firmware Atualizado
```bash
# No Arduino IDE:
# 1. Abra firmware/esp32_main.ino
# 2. Selecione a placa ESP32
# 3. Selecione a porta COM correta
# 4. Clique em Upload
```

### 2. Verificar a Conexão
```bash
# No Serial Monitor (115200 baud):
# - Verificar se conectou ao WiFi
# - Verificar se conectou ao MQTT
# - Anotar o MAC Address
```

### 3. Testar o Dashboard
```bash
# No navegador:
# 1. Acesse http://localhost:5173
# 2. Clique em "Meu ESP32"
# 3. Aguarde "Conectado" aparecer
# 4. Verifique se os dados estão sendo recebidos
```

### 4. Testar Modo Manual
```bash
# No dashboard:
# 1. Acesse "Test Mode" no menu lateral
# 2. Clique em "Habilitar"
# 3. Teste as saídas (Q1-Q7)
# 4. Verifique no Serial Monitor se as saídas estão mudando
```

### 5. Testar Entradas
```bash
# Com jumpers:
# 1. Conecte I1 ao GND
# 2. Verifique no dashboard se I1 ficou ativo (verde)
# 3. Desconecte I1
# 4. Verifique se I1 voltou para inativo
```

---

## Troubleshooting

### Modo de teste não envia comandos
**Causa**: ESP32 não está recebendo comandos MQTT
**Solução**:
1. Verifique no console do navegador se há logs: `🎛️ Comando manual enviado`
2. Verifique no Serial Monitor se há mensagens de MQTT
3. Verifique se o tópico está correto: `dispositivo/48E72999971C/comando`

### Entradas sempre aparecem ativas ou inativas
**Causa**: Firmware antigo sem inversão de lógica
**Solução**: Faça upload do firmware atualizado

### ESP32 desconecta do MQTT
**Causa**: Sinal WiFi fraco ou timeout
**Solução**:
1. Aproxime o ESP32 do roteador
2. Verifique os limites de conexão no HiveMQ Cloud
3. Verifique se as credenciais estão corretas
