# Painel de Controle Industrial (React + ESP32)

Este projeto é uma Interface Homem-Máquina (IHM) web desenvolvida para monitorar e controlar um sistema industrial de aquecimento e controle de umidade.

## Estrutura do Projeto

*   `/`: Código fonte do Dashboard (React/Vite).
*   `/firmware`: Código C++ para o ESP32 físico.

## Credenciais e Ambiente (Web)

O projeto já inclui um arquivo `.env` configurado para conectar ao Broker MQTT HiveMQ.

**Variáveis Necessárias:**
```env
VITE_MQTT_BROKER=wss://72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud:8884/mqtt
VITE_MQTT_USERNAME=esp32_cliente02
VITE_MQTT_PASSWORD=Corcel@73
```

## Como Rodar o Dashboard (Web)

1.  Instale as dependências: `npm install`
2.  Inicie o servidor local: `npm run dev`
3.  Acesse o IP mostrado no terminal.
4.  Para simulação sem hardware, use o login `DEMO`.

---

## Como Gravar no ESP32 (Hardware)

O código fonte para o hardware está na pasta `/firmware/esp32_main.ino`.

### Requisitos
1.  **Arduino IDE** ou **PlatformIO** (VS Code).
2.  Bibliotecas necessárias (Instalar via Library Manager):
    *   `PubSubClient` (por Nick O'Leary)
    *   `ArduinoJson` (por Benoit Blanchon)

### Configuração
1.  Abra o arquivo `firmware/esp32_main.ino`.
2.  Edite as linhas iniciais com seu Wi-Fi:
    ```cpp
    const char* ssid = "SUA_REDE_WIFI";
    const char* password = "SUA_SENHA";
    ```
3.  As credenciais MQTT já estão configuradas para o servidor de teste.

### Pinagem (ESP32 DevKit V1)

**Entradas (Sensores/Botões):**
*   **I1 (Habilita):** GPIO 34
*   **I2 (Reset):** GPIO 35
*   **I3 (Energia):** GPIO 32
*   **I4 (FC Aberta):** GPIO 33
*   **I5 (FC Fechada):** GPIO 25
*   **I6 (Temp):** GPIO 36 (VP) - Analógico
*   **I7 (Umid):** GPIO 39 (VN) - Analógico

**Saídas (Relés):**
*   **Q1 (Rosca Princ):** GPIO 23
*   **Q2 (Rosca Sec):** GPIO 22
*   **Q3 (Vibrador):** GPIO 21
*   **Q4 (Ventoinha):** GPIO 19
*   **Q5 (Corta Fogo):** GPIO 18
*   **Q6 (Damper):** GPIO 5
*   **Q7 (Alarme):** GPIO 17

### Uso
1.  Carregue o código no ESP32.
2.  Abra o Monitor Serial (115200 baud) para ver o **MAC Address**.
3.  Copie o MAC Address.
4.  Abra o Dashboard Web e cole o MAC na tela de login.
