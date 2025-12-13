#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// =================================================================
// SISTEMA DE CONTROLE INDUSTRIAL COMPLETO
// Entradas: I1-I7 | Saídas: Q1-Q7
// =================================================================

// --- CONFIGURAÇÕES DO MQTT (HIVEMQ CLOUD) ---
const char* mqtt_server = "72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "esp32_cliente02";
const char* mqtt_pass = "Corcel@73";

// --- CERTIFICADO ROOT CA (HIVEMQ) ---
const char* root_ca = \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw\n" \
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\n" \
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\n" \
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\n" \
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\n" \
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc\n" \
"h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+\n" \
"0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U\n" \
"A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW\n" \
"T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH\n" \
"B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC\n" \
"B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv\n" \
"KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn\n" \
"OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn\n" \
"jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw\n" \
"qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI\n" \
"rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV\n" \
"HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq\n" \
"hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL\n" \
"ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ\n" \
"3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK\n" \
"NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5\n" \
"ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur\n" \
"TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC\n" \
"jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb/ZAJzVc\n" \
"oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq\n" \
"4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA\n" \
"mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d\n" \
"emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=\n" \
"-----END CERTIFICATE-----\n";

// =================================================================
// PINAGEM - ENTRADAS E SAÍDAS (ATUALIZADO)
// =================================================================

// --- SENSOR DHT11 ---
#define DHT_PIN 32
#define DHT_TYPE DHT11

// --- ENTRADAS DIGITAIS (I1-I5) ---
#define PIN_I1_HABILITACAO 13        // I1 - Botão Liga (libera ciclo)
#define PIN_I2_RESET 12              // I2 - Botão Reset (CUIDADO: Strapping Pin)
#define PIN_I3_ENERGIA 14            // I3 - Falta de energia (relé falta fase)
#define PIN_I4_FIM_CURSO_ABERTA 27   // I4 - Fim de curso abertura corta fogo
#define PIN_I5_FIM_CURSO_FECHADA 26  // I5 - Fim de curso fechamento corta fogo

// --- SAÍDAS (Q1-Q7) ---
#define PIN_Q1_ROSCA_PRINCIPAL 15    // Q1 - Rosca Principal (CUIDADO: Strapping Pin)
#define PIN_Q2_ROSCA_SECUNDARIA 2    // Q2 - Rosca Secundária (CUIDADO: Strapping Pin / LED Onboard)
#define PIN_Q3_VIBRADOR 4            // Q3 - Vibrador
#define PIN_Q4_VENTOINHA 16          // Q4 - Ventoinha
#define PIN_Q5_CORTA_FOGO 17         // Q5 - Corta Fogo
#define PIN_Q6_DAMPER 5              // Q6 - Damper
#define PIN_Q7_ALARME 18             // Q7 - Alarme

// =================================================================
// VARIÁVEIS DE ESTADO
// =================================================================

// --- Parâmetros Ajustáveis ---
float sp_temp = 25.0;
float hist_temp = 2.0;
float sp_umid = 60.0;
float hist_umid = 5.0;
char temp_unit = 'C';

// Temporizadores (em segundos/minutos)
int time_vibrador_on = 5;
int time_vibrador_off = 10;
int time_rosca_sec_on = 8;
int time_rosca_sec_off = 15;
int time_alarme_on = 1;
int time_alarme_off = 2;
bool alarme_enabled = true;
int time_chama_atv = 30;
int time_chama_wait = 5;

// --- Entradas (Estado) ---
struct {
  bool i1_habilitacao;
  bool i2_reset;
  bool i3_energia;
  bool i4_fim_curso_aberta;
  bool i5_fim_curso_fechada;
  float i6_temp_sensor;
  float i7_umidade_sensor;
} inputs;

// --- Saídas (Estado) ---
struct {
  bool q1_rosca_principal;
  bool q2_rosca_secundaria;
  bool q3_vibrador;
  bool q4_ventoinha;
  bool q5_corta_fogo;
  bool q6_damper;
  bool q7_alarme;
} outputs;

// --- Tópicos MQTT ---
char client_id[32];
char topic_telemetry[64];
char topic_command[64];
char topic_lwt[64];

// =================================================================
// OBJETOS
// =================================================================

WiFiClientSecure espClient;
PubSubClient client(espClient);
WiFiManager wm;
DHT dht(DHT_PIN, DHT_TYPE);
Preferences preferences;

// =================================================================
// FUNÇÕES DE PERSISTÊNCIA
// =================================================================

void loadSettings() {
  preferences.begin("iot-config", true);

  sp_temp = preferences.getFloat("sp_temp", 25.0);
  hist_temp = preferences.getFloat("hist_temp", 2.0);
  sp_umid = preferences.getFloat("sp_umid", 60.0);
  hist_umid = preferences.getFloat("hist_umid", 5.0);
  temp_unit = preferences.getChar("temp_unit", 'C');

  preferences.end();

  Serial.println("=== Settings Loaded ===");
  Serial.printf("Temp SP: %.1f°%c | Hist: %.1f\n", sp_temp, temp_unit, hist_temp);
  Serial.printf("Umid SP: %.1f%% | Hist: %.1f\n", sp_umid, hist_umid);
  Serial.println("=======================");
}

void saveSettings() {
  preferences.begin("iot-config", false);

  preferences.putFloat("sp_temp", sp_temp);
  preferences.putFloat("hist_temp", hist_temp);
  preferences.putFloat("sp_umid", sp_umid);
  preferences.putFloat("hist_umid", hist_umid);
  preferences.putChar("temp_unit", temp_unit);

  preferences.end();
  Serial.println("Settings saved to NVS.");
}

// =================================================================
// FUNÇÕES DE CONTROLE DE I/O
// =================================================================

void readInputs() {
  inputs.i1_habilitacao = digitalRead(PIN_I1_HABILITACAO);
  inputs.i2_reset = digitalRead(PIN_I2_RESET);
  inputs.i3_energia = digitalRead(PIN_I3_ENERGIA);
  inputs.i4_fim_curso_aberta = digitalRead(PIN_I4_FIM_CURSO_ABERTA);
  inputs.i5_fim_curso_fechada = digitalRead(PIN_I5_FIM_CURSO_FECHADA);

  float h = dht.readHumidity();
  float t = dht.readTemperature(temp_unit == 'F');

  if (!isnan(h) && !isnan(t)) {
    inputs.i6_temp_sensor = t;
    inputs.i7_umidade_sensor = h;
  }
}

void applyOutputs() {
  digitalWrite(PIN_Q1_ROSCA_PRINCIPAL, outputs.q1_rosca_principal ? HIGH : LOW);
  digitalWrite(PIN_Q2_ROSCA_SECUNDARIA, outputs.q2_rosca_secundaria ? HIGH : LOW);
  digitalWrite(PIN_Q3_VIBRADOR, outputs.q3_vibrador ? HIGH : LOW);
  digitalWrite(PIN_Q4_VENTOINHA, outputs.q4_ventoinha ? HIGH : LOW);
  digitalWrite(PIN_Q5_CORTA_FOGO, outputs.q5_corta_fogo ? HIGH : LOW);
  digitalWrite(PIN_Q6_DAMPER, outputs.q6_damper ? HIGH : LOW);
  digitalWrite(PIN_Q7_ALARME, outputs.q7_alarme ? HIGH : LOW);
}

// =================================================================
// LÓGICA DE CONTROLE INDUSTRIAL
// =================================================================

void controlLogic() {
  // Falha de Energia (I3) - Desliga tudo
  if (!inputs.i3_energia) {
    outputs.q1_rosca_principal = false;
    outputs.q2_rosca_secundaria = false;
    outputs.q3_vibrador = false;
    outputs.q4_ventoinha = false;
    outputs.q5_corta_fogo = false;
    outputs.q6_damper = false;
    outputs.q7_alarme = true;
    applyOutputs();
    return;
  }

  // Sistema habilitado (I1)
  if (inputs.i1_habilitacao) {
    // Controle de Temperatura - Ventoinha (Q4)
    if (inputs.i6_temp_sensor < sp_temp) {
      outputs.q4_ventoinha = true;
    } else if (inputs.i6_temp_sensor >= (sp_temp + hist_temp)) {
      outputs.q4_ventoinha = false;
    }

    // Controle de Umidade - Damper (Q6)
    if (inputs.i7_umidade_sensor < (sp_umid - hist_umid)) {
      outputs.q6_damper = true;
    } else if (inputs.i7_umidade_sensor > (sp_umid + hist_umid)) {
      outputs.q6_damper = false;
    }

    // Alarme de desvio
    bool temp_out = (inputs.i6_temp_sensor < (sp_temp - hist_temp)) ||
                    (inputs.i6_temp_sensor > (sp_temp + hist_temp));
    bool umid_out = (inputs.i7_umidade_sensor < (sp_umid - hist_umid)) ||
                    (inputs.i7_umidade_sensor > (sp_umid + hist_umid));

    outputs.q7_alarme = alarme_enabled && (temp_out || umid_out);

  } else {
    // Sistema desligado - parada em cascata
    outputs.q1_rosca_principal = false;
    outputs.q3_vibrador = false;
    outputs.q2_rosca_secundaria = false;
    outputs.q4_ventoinha = false;
    outputs.q5_corta_fogo = false;
  }

  applyOutputs();
}

// =================================================================
// FUNÇÕES MQTT
// =================================================================

void publishTelemetry() {
  if (!client.connected()) return;

  StaticJsonDocument<512> doc;

  // Inputs
  doc["i1_habilitacao"] = inputs.i1_habilitacao;
  doc["i2_reset"] = inputs.i2_reset;
  doc["i3_energia"] = inputs.i3_energia;
  doc["i4_fim_curso_aberta"] = inputs.i4_fim_curso_aberta;
  doc["i5_fim_curso_fechada"] = inputs.i5_fim_curso_fechada;
  doc["i6_temp_sensor"] = inputs.i6_temp_sensor;
  doc["umidade_sensor"] = inputs.i7_umidade_sensor;

  // Outputs
  doc["q1_rosca_principal"] = outputs.q1_rosca_principal;
  doc["q2_rosca_secundaria"] = outputs.q2_rosca_secundaria;
  doc["q3_vibrador"] = outputs.q3_vibrador;
  doc["q4_ventoinha"] = outputs.q4_ventoinha;
  doc["q5_corta_fogo"] = outputs.q5_corta_fogo;
  doc["q6_damper"] = outputs.q6_damper;
  doc["q7_alarme"] = outputs.q7_alarme;

  // Parameters
  doc["sp_temp"] = sp_temp;
  doc["sp_umid"] = sp_umid;
  doc["hist_temp"] = hist_temp;
  doc["hist_umid"] = hist_umid;
  doc["temp_unit"] = String(temp_unit);

  char payload[512];
  serializeJson(doc, payload);

  client.publish(topic_telemetry, payload, false);
}

void callback(char* topic, byte* payload, unsigned int length) {
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.println("JSON parse error");
    return;
  }

  bool settings_changed = false;

  // Atualizar parâmetros
  if (doc.containsKey("sp_temp")) {
    sp_temp = doc["sp_temp"].as<float>();
    settings_changed = true;
  }
  if (doc.containsKey("sp_umid")) {
    sp_umid = doc["sp_umid"].as<float>();
    settings_changed = true;
  }
  if (doc.containsKey("hist_temp")) {
    hist_temp = doc["hist_temp"].as<float>();
    settings_changed = true;
  }
  if (doc.containsKey("hist_umid")) {
    hist_umid = doc["hist_umid"].as<float>();
    settings_changed = true;
  }
  if (doc.containsKey("temp_unit")) {
    temp_unit = doc["temp_unit"].as<String>()[0];
    settings_changed = true;
  }

  if (settings_changed) {
    saveSettings();
  }

  publishTelemetry();
}

// Função de reconexão NÃO BLOQUEANTE
void attemptMqttConnection() {
  if (client.connect(client_id, mqtt_user, mqtt_pass)) {
    Serial.println("MQTT Conectado!");
    client.publish(topic_lwt, "online", true);
    client.subscribe(topic_command);
  } else {
    Serial.print("Falha MQTT rc=");
    Serial.print(client.state());
    Serial.println(" (tentara novamente em breve)");
  }
}

// =================================================================
// SETUP E LOOP
// =================================================================

void setup() {
  Serial.begin(115200);
  dht.begin();

  // Carregar configurações
  loadSettings();

  // Configurar pinos de entrada
  pinMode(PIN_I1_HABILITACAO, INPUT_PULLUP);
  pinMode(PIN_I2_RESET, INPUT_PULLUP);
  pinMode(PIN_I3_ENERGIA, INPUT_PULLUP);
  pinMode(PIN_I4_FIM_CURSO_ABERTA, INPUT_PULLUP);
  pinMode(PIN_I5_FIM_CURSO_FECHADA, INPUT_PULLUP);

  // Configurar pinos de saída
  pinMode(PIN_Q1_ROSCA_PRINCIPAL, OUTPUT);
  pinMode(PIN_Q2_ROSCA_SECUNDARIA, OUTPUT);
  pinMode(PIN_Q3_VIBRADOR, OUTPUT);
  pinMode(PIN_Q4_VENTOINHA, OUTPUT);
  pinMode(PIN_Q5_CORTA_FOGO, OUTPUT);
  pinMode(PIN_Q6_DAMPER, OUTPUT);
  pinMode(PIN_Q7_ALARME, OUTPUT);

  // Inicializar saídas desligadas
  applyOutputs();

  // WiFi Manager
  wm.setAPCallback([](WiFiManager *myWiFiManager) {
    Serial.println("Modo AP - ESP32_IOT_SETUP");
  });
  
  // Define timeout de 3 minutos. Se não configurar, segue em modo offline.
  wm.setConfigPortalTimeout(180);

  if (!wm.autoConnect("ESP32_IOT_SETUP", "senha123")) {
    Serial.println("Falha WiFi. Iniciando em modo OFFLINE.");
  } else {
    Serial.println("WiFi conectado!");
  }

  // Gerar ID e tópicos
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  mac.toCharArray(client_id, 32);

  snprintf(topic_telemetry, 64, "dispositivo/%s/telemetria", client_id);
  snprintf(topic_command, 64, "dispositivo/%s/comando", client_id);
  snprintf(topic_lwt, 64, "dispositivo/%s/conexao", client_id);

  Serial.print("MAC: ");
  Serial.println(client_id);

  // Configurar MQTT
  espClient.setCACert(root_ca); // Configura certificado uma vez
  client.setBufferSize(768);    // Aumenta buffer para suportar JSON grande
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  // Lógica de reconexão não bloqueante
  if (!client.connected()) {
    static unsigned long lastReconnectAttempt = 0;
    unsigned long now = millis();
    // Tenta reconectar a cada 5 segundos, mas SEM parar o loop
    if (now - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = now;
      if (WiFi.status() == WL_CONNECTED) {
        attemptMqttConnection();
      }
    }
  } else {
    client.loop();
  }

  static unsigned long lastRead = 0;
  static unsigned long lastPublish = 0;
  const long READ_INTERVAL = 2000;
  const long PUBLISH_INTERVAL = 10000;

  if (millis() - lastRead > READ_INTERVAL) {
    readInputs();
    controlLogic();
    lastRead = millis();
  }

  if (millis() - lastPublish > PUBLISH_INTERVAL) {
    publishTelemetry();
    lastPublish = millis();
  }
}