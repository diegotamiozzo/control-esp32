# Guia de Pinagem ESP32 - Sistema Industrial

## Pinos Seguros para Uso (Evitam Strapping Pins)

### Entradas Digitais (INPUT_PULLUP)
- **I1 (Habilitação)**: GPIO 13
- **I2 (Reset)**: GPIO 14
- **I3 (Energia)**: GPIO 27
- **I4 (Fim Curso Aberta)**: GPIO 26
- **I5 (Fim Curso Fechada)**: GPIO 25

### Saídas Digitais (OUTPUT)
- **Q1 (Rosca Principal)**: GPIO 33
- **Q2 (Rosca Secundária)**: GPIO 32
- **Q3 (Vibrador)**: GPIO 15
- **Q4 (Ventoinha)**: GPIO 4
- **Q5 (Corta Fogo)**: GPIO 16
- **Q6 (Damper)**: GPIO 17
- **Q7 (Alarme)**: GPIO 5

### Sensor DHT11
- **DHT_PIN**: GPIO 23

## Pinos a EVITAR (Strapping Pins)

⚠️ **NUNCA USE ESTES PINOS PARA ENTRADAS/SAÍDAS:**
- GPIO 0: Boot mode selection
- GPIO 2: Boot mode selection (também LED onboard)
- GPIO 5: Boot mode selection (SD)
- GPIO 12: Flash voltage selection
- GPIO 15: Boot mode selection (SD)

## Conexão das Entradas (Lógica com Pull-up)

```
ESP32 GPIO (INPUT_PULLUP) ----+---- Botão/Sensor ---- GND
                              |
                             [10k Ω] Pull-up interno
                              |
                             +3.3V
```

- **Sem acionamento**: Pino = HIGH (3.3V) = `false` no código
- **Com acionamento (GND)**: Pino = LOW (0V) = `true` no código

## Conexão das Saídas

```
ESP32 GPIO (OUTPUT) ---- Relé/Driver ---- Carga
```

- **digitalWrite(HIGH)**: Saída ativa (3.3V)
- **digitalWrite(LOW)**: Saída inativa (0V)

## Esquema de Ligação DHT11

```
DHT11
  VCC ---- 3.3V
  DATA --- GPIO 23
  GND ---- GND
```

## Observações Importantes

1. **Corrente máxima por pino**: 12mA
2. **Sempre use drivers/relés** para cargas acima de 12mA
3. **Nunca conecte cargas AC diretamente** nos pinos do ESP32
4. **Use módulos relé com optoacopladores** para isolamento elétrico
5. **Alimentação**: 5V via USB ou Vin / 3.3V via pino 3V3
