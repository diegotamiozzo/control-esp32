# Changelog - Atualização para Máquina de Estados

## Versão 2.0 - Implementação Completa da Máquina de Estados

### Data: 2025-12-14

## Alterações Principais

### 🎯 Firmware ESP32

#### Novo Arquivo: `esp32_main_state_machine.ino`
- Implementação completa de máquina de estados com 8 estados
- Sequências de partida e parada totalmente controladas
- Verificação de sensores de fim de curso (I4, I5)
- Timeout de segurança (10s) para fechamento do corta-fogo
- Modo chama piloto com temporizadores independentes
- Sistema de alarmes críticos com reset manual obrigatório
- Controle de umidade independente do estado da máquina
- Persistência de todos os parâmetros na Flash (NVS)

#### Estados Implementados:
0. **ST_OFF_IDLE** - Sistema Parado / Aguardando
1. **ST_START_SEQ_1** - Partida: Ventoinha + Q2 + Abre Q5
2. **ST_START_WAIT_OPEN** - Partida: Aguarda sensor Q5 abrir
3. **ST_RUNNING** - Operação Normal (Alimentação)
4. **ST_STOP_CASCADE_1** - Parada: Desliga Alimentação
5. **ST_STOP_WAIT_CLOSE** - Parada: Aguarda Q5 fechar
6. **ST_ALARM_CRITICAL** - Falha Crítica
7. **ST_PILOT_MODE** - Modo Chama Piloto

#### Pinagem Atualizada:
```
DHT11: GPIO 23
I1: GPIO 13, I2: GPIO 14, I3: GPIO 27, I4: GPIO 26, I5: GPIO 25
Q1: GPIO 33, Q2: GPIO 32, Q3: GPIO 15, Q4: GPIO 4
Q5: GPIO 16, Q6: GPIO 17, Q7: GPIO 5
```

#### Protocolo MQTT Atualizado:
**Telemetria:**
- Campos de entrada renomeados: `i1_hab`, `i2_rst`, `i3_pwr`, etc.
- Campos de saída renomeados: `q1_main`, `q2_sec`, `q3_vib`, etc.
- Novos campos: `state` (0-7), `msg` (mensagem de status)

### 🖥️ Frontend React/TypeScript

#### Arquivo: `types.ts`
- Novo enum `MachineState` com 8 estados
- Interface `AppState` atualizada:
  - `machineState: MachineState` - Estado atual da máquina
  - `alarmMessage: string` - Mensagem de alarme/status

#### Arquivo: `context/MachineContext.tsx`
- Mapeamento atualizado dos campos MQTT para compatibilidade com novo firmware
- Processamento do estado da máquina e mensagem de alarme
- Inicialização com `MachineState.ST_OFF_IDLE` e `alarmMessage: 'OK'`

#### Arquivo: `pages/Dashboard.tsx`
- Nova seção "Estado da Máquina" com indicador visual colorido
- Exibição da mensagem de alarme/status
- Cores diferentes para cada estado:
  - Cinza: Parado
  - Âmbar: Partida
  - Verde: Operação Normal
  - Azul: Parada
  - Vermelho: Alarme Crítico
  - Laranja: Modo Piloto

### 📚 Documentação

#### Novo Arquivo: `FIRMWARE_GUIDE.md`
Guia completo com:
- Descrição detalhada de todos os estados
- Lógica de controle passo a passo
- Sequências de partida e parada
- Tabelas de pinagem
- Protocolo MQTT completo
- Parâmetros ajustáveis
- Troubleshooting
- Bibliotecas necessárias
- Instruções de upload

#### Arquivo: `README.md`
Atualizado com:
- Descrição da máquina de estados
- Tabela de estados
- Sequências controladas
- Pinagem atualizada
- Protocolo MQTT atualizado
- Referência ao FIRMWARE_GUIDE.md

#### Novo Arquivo: `CHANGELOG.md`
Documentação de todas as mudanças da versão 2.0

## Melhorias de Segurança

### Watchdog de Energia
- Detecção imediata de falta de energia (I3)
- Desligamento automático de todas as saídas
- Reset manual obrigatório após recuperação

### Verificação de Sensores
- Monitoramento de abertura do corta-fogo (I4)
- Monitoramento de fechamento do corta-fogo (I5)
- Timeout de 10s → Alarme crítico se não fechar

### Sequências Seguras
- Partida só completa após confirmação de I4
- Parada só finaliza após confirmação de I5
- Sem transições de estado sem verificações

## Funcionalidades Adicionadas

### Modo Chama Piloto
- Ativa quando temperatura está na histerese
- Temporizador de espera configurável (minutos)
- Pulso de ventoinha configurável (segundos)
- Independente do ciclo principal

### Temporizadores Cíclicos
- **Q2 (Rosca Secundária):** ON/OFF independente
- **Q3 (Vibrador):** ON/OFF sincronizado com Q1
- **Q7 (Alarme):** ON/OFF durante alarmes

### Persistência de Dados
- Todos os parâmetros salvos na Flash (NVS)
- Mantém configurações após reset
- Mantém configurações após power cycle

## Compatibilidade

### Versões Anteriores do Firmware
Os arquivos anteriores foram mantidos para referência:
- `esp32_main.ino` - Versão simples original
- `esp32_main_CORRIGIDO.ino` - Versão intermediária

### Frontend
- Compatibilidade retroativa mantida
- Novos campos são opcionais
- Frontend funciona com firmwares antigos (sem estado da máquina)

## Migração

### Para Usar o Novo Firmware:

1. **Backup das Configurações Atuais**
   - Anote seus setpoints e parâmetros

2. **Upload do Novo Firmware**
   - Abra `esp32_main_state_machine.ino`
   - Upload para o ESP32

3. **Reconectar no Frontend**
   - Firmware manterá o MAC Address
   - Reconecte normalmente

4. **Reconfigurar Parâmetros (se necessário)**
   - Verifique setpoints na página Settings
   - Ajuste temporizadores se necessário

### Atenção à Pinagem

**⚠️ A pinagem mudou!** Verifique o FIRMWARE_GUIDE.md para a pinagem correta:
- DHT11 agora no GPIO 23 (era 32)
- I3, I4, I5 em novos pinos
- Q1, Q2, Q7 em novos pinos

## Testes Recomendados

### Após Upload do Firmware:

1. **Teste de Partida:**
   - Ativar I1, I3
   - Verificar sequência: Q4 → Q2 → Q5 → aguardar I4 → Q1 + Q3

2. **Teste de Parada:**
   - Desativar I1 ou atingir SP
   - Verificar parada cascata: Q1/Q3/Q2/Q4 OFF → Q5 OFF → aguardar I5

3. **Teste de Alarme:**
   - Simular falta de energia (I3 OFF)
   - Verificar alarme crítico
   - Reset com I3 + I1 + I2

4. **Teste de Sensores:**
   - Verificar I4 durante partida
   - Verificar I5 durante parada
   - Verificar timeout (simular falha de I5)

## Próximos Passos

- [ ] Testar em bancada com hardware real
- [ ] Validar tempos dos temporizadores
- [ ] Ajustar timeouts conforme processo
- [ ] Documentar casos de uso específicos
- [ ] Criar guia de troubleshooting expandido

## Suporte

Para dúvidas ou problemas:
1. Consulte o FIRMWARE_GUIDE.md
2. Verifique o Monitor Serial (115200 baud)
3. Verifique as conexões físicas
4. Confirme a pinagem correta

---

**Desenvolvido para atender aos requisitos do documento de lógica de controle completo.**
