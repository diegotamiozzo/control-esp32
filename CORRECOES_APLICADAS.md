# Correções Aplicadas - ESP32 + Dashboard

## ✅ Problema 1: Entradas Demoravam Muito (10 segundos)

### Antes
- Leitura de entradas: 2 segundos
- Publicação MQTT: 10 segundos
- Delay perceptível ao acionar entradas

### Depois
**Firmware ESP32** (`firmware/esp32_main.ino` linha 506-507):
- ✅ Leitura de entradas: **500ms** (0.5 segundos)
- ✅ Publicação MQTT: **2 segundos**
- Resposta praticamente instantânea

---

## ✅ Problema 2: Reset (I2) Deveria Ser um Pulso

### Antes
- I2 funcionava como entrada contínua (nivel)
- Precisava manter pressionado

### Depois
**Firmware ESP32** (`firmware/esp32_main.ino` linhas 104, 191-199):
- ✅ Implementada detecção de borda (edge detection)
- ✅ Variável `i2_reset_last` para armazenar estado anterior
- ✅ Reset ativa apenas na transição LOW → HIGH (pulso)
- ✅ Um toque rápido em I2 agora reseta o alarme

### Como Testar
1. Conecte I2 (GPIO 12) ao GND momentaneamente
2. Solte
3. O reset foi acionado

---

## ✅ Problema 3: Alarme Não Obedecia Tempos ON/OFF

### Antes
- Alarme ficava sempre ligado quando ativado
- Não implementava ciclo ON/OFF
- Checkbox `alarme_enabled` não tinha efeito

### Depois
**Firmware ESP32** (`firmware/esp32_main.ino` linhas 107-108, 269-284):
- ✅ Timer do alarme implementado com `alarme_timer`
- ✅ Ciclo ON/OFF baseado em `time_alarme_on` e `time_alarme_off`
- ✅ Checkbox `alarme_enabled` agora funciona corretamente
- ✅ Alarme desliga automaticamente quando não há desvio

### Como Funciona
```cpp
// Exemplo: time_alarme_on = 1 min, time_alarme_off = 2 min
// Ciclo completo = 3 minutos
// Alarme liga por 1 min, desliga por 2 min, repete
```

---

## ✅ Problema 4: Parâmetros Não Eram Modificados

### Antes
- Frontend enviava apenas setpoints básicos
- Temporizadores não eram enviados via MQTT
- Checkbox do alarme não era enviado

### Depois
**Frontend** (`context/MachineContext.tsx` linhas 372-380):
- ✅ Todos os temporizadores são enviados via MQTT
- ✅ Checkbox `alarme_enabled` é enviado
- ✅ Log de debug: `⚙️ Parâmetros enviados:`

**Firmware ESP32** (`firmware/esp32_main.ino` linhas 375-384):
- ✅ Firmware aceita todos os parâmetros
- ✅ Temporizadores do vibrador, rosca secundária, alarme e chama piloto

### Parâmetros Enviados
```json
{
  "sp_temp": 30.0,
  "sp_umid": 65.0,
  "hist_temp": 3.0,
  "hist_umid": 10.0,
  "temp_unit": "C",
  "time_vibrador_on": 5,
  "time_vibrador_off": 15,
  "time_rosca_sec_on": 10,
  "time_rosca_sec_off": 10,
  "time_alarme_on": 1,
  "time_alarme_off": 2,
  "alarme_enabled": true,
  "time_chama_atv": 30,
  "time_chama_wait": 10
}
```

---

## ✅ Problema 5: Login com Botão de Acesso Rápido

### Antes
- Campo vazio
- Botão de acesso rápido

### Depois
**Frontend** (`pages/Login.tsx` linha 7):
- ✅ Campo preenchido automaticamente com `48E72999971C`
- ✅ Botão de acesso rápido removido
- ✅ Interface mais limpa e direta

---

## ✅ Problema 6: Modo de Teste (Já Corrigido Anteriormente)

### Implementação
**Firmware ESP32** (`firmware/esp32_main.ino` linhas 101, 207-211, 387-398):
- ✅ Variável `manual_mode` para controlar operação
- ✅ Lógica automática pausada quando `manual_mode = true`
- ✅ Comandos MQTT para controle manual das saídas

**Frontend** (`context/MachineContext.tsx` linhas 391-408, 410-422):
- ✅ `setManualMode()` envia comando MQTT
- ✅ `toggleOutputManual()` controla cada saída individualmente
- ✅ Logs de debug

---

## ✅ Problema 7: Lógica Invertida (INPUT_PULLUP) - Já Corrigido

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

## Resumo das Alterações (Última Atualização)

### Arquivos Modificados

1. **firmware/esp32_main.ino**
   - ✅ Intervalos de leitura/publicação reduzidos (500ms/2s)
   - ✅ Detecção de borda para I2 (reset como pulso)
   - ✅ Timer do alarme com ciclo ON/OFF
   - ✅ Callback MQTT aceita todos os temporizadores
   - ✅ Variável `manual_mode` para modo de teste
   - ✅ Lógica das entradas invertida para INPUT_PULLUP

2. **context/MachineContext.tsx**
   - ✅ `updateParams()` envia todos os parâmetros via MQTT
   - ✅ `setManualMode()` envia comandos MQTT
   - ✅ `toggleOutputManual()` envia comandos MQTT
   - ✅ Valores padrão das entradas ajustados
   - ✅ Logs de debug: `⚙️ Parâmetros enviados:`, `🎛️ Modo manual:`

3. **pages/Login.tsx**
   - ✅ Campo preenchido automaticamente com `48E72999971C`
   - ✅ Botão de acesso rápido removido
   - ✅ Normalização do MAC Address (remove dois pontos)

4. **.env**
   - ✅ Configurações do broker HiveMQ Cloud
   - ✅ Credenciais de acesso

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
# 2. O campo MAC já estará preenchido com 48E72999971C
# 3. Clique em "Conectar"
# 4. Aguarde "Conectado" aparecer no canto superior direito
# 5. Verifique se os dados estão sendo recebidos (a cada 2 segundos)
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
# 1. Conecte I1 ao GND - Deve aparecer ativo em ~0.5s
# 2. Verifique no dashboard se I1 ficou ativo (verde)
# 3. Desconecte I1 - Deve voltar para inativo em ~0.5s
# 4. Teste I2 (Reset) com um pulso rápido ao GND
```

### 6. Testar Parâmetros
```bash
# Na página Settings:
# 1. Altere qualquer parâmetro (ex: Setpoint Temperatura)
# 2. Clique em "Salvar Configurações"
# 3. Verifique no console: "⚙️ Parâmetros enviados:"
# 4. Verifique no Serial Monitor se o ESP32 recebeu
```

### 7. Testar Alarme
```bash
# No dashboard:
# 1. Configure um setpoint baixo (ex: 10°C)
# 2. Aguarde a temperatura ambiente ficar fora da faixa
# 3. O alarme deve piscar de acordo com os tempos configurados
# 4. Desmarque "Alarme Habilitado" em Settings
# 5. O alarme deve desligar
```

---

## Troubleshooting

### Entradas demoram muito para aparecer
**Causa**: Firmware antigo com intervalo de 10 segundos
**Solução**: Faça upload do firmware atualizado (intervalo: 500ms leitura / 2s publicação)

### Reset (I2) não funciona
**Causa 1**: Firmware antigo sem detecção de borda
**Solução**: Faça upload do firmware atualizado

**Causa 2**: Pulso muito curto
**Solução**: Mantenha o GND por pelo menos 100ms

### Alarme não pisca (fica sempre ligado)
**Causa**: Firmware antigo sem timer de ciclo
**Solução**: Faça upload do firmware atualizado

### Alarme não desliga quando desmarco "Habilitado"
**Causa**: Parâmetros não estão sendo enviados
**Solução**:
1. Verifique no console: `⚙️ Parâmetros enviados:`
2. Se não aparecer, verifique a conexão MQTT
3. Faça upload do firmware atualizado

### Parâmetros não são alterados no ESP32
**Causa**: Frontend ou firmware antigo
**Solução**:
1. Abra o console e procure: `⚙️ Parâmetros enviados:`
2. Se aparecer, verifique o Serial Monitor
3. Se não aparecer no ESP32, faça upload do firmware atualizado

### Modo de teste não envia comandos
**Causa**: ESP32 não está recebendo comandos MQTT
**Solução**:
1. Verifique no console do navegador se há logs: `🎛️ Comando manual enviado`
2. Verifique no Serial Monitor: `Modo Manual: ATIVADO`
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
