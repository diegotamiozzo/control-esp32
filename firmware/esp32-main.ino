#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include <Preferences.h>

// =================================================================
// SISTEMA DE CONTROLE INDUSTRIAL
// =================================================================

// --- CONFIGURAÇÕES DO MQTT (HIVEMQ CLOUD) ---
const char* mqtt_server = "72c037df4ced415995ef95169a5c7248.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "esp32_cliente02";
const char* mqtt_pass = "Corcel@73";

// --- CERTIFICADO ROOT CA ---
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
// DEFINIÇÕES DE HARDWARE
// =================================================================
#define DHT_PIN 23
#define DHT_TYPE DHT11

// Entradas
#define PIN_I1_HABILITACAO 13
#define PIN_I2_RESET 14
#define PIN_I3_ENERGIA 27
#define PIN_I4_FIM_CURSO_ABERTA 26
#define PIN_I5_FIM_CURSO_FECHADA 25

// Saídas
#define PIN_Q1_ROSCA_PRINCIPAL 33
#define PIN_Q2_ROSCA_SECUNDARIA 32
#define PIN_Q3_VIBRADOR 15
#define PIN_Q4_VENTOINHA 4
#define PIN_Q5_CORTA_FOGO 16
#define PIN_Q6_DAMPER 17
#define PIN_Q7_ALARME 5

// =================================================================
// ESTRUTURAS E VARIÁVEIS GLOBAIS
// =================================================================

// Estados do Sistema (Máquina de Estados)
enum SystemState {
  ST_OFF_IDLE,          // Sistema Parado / Aguardando
  ST_START_SEQ_1,       // Partida: Ventoinha + Q2 + Abre Q5
  ST_START_WAIT_OPEN,   // Partida: Aguarda sensor Q5 abrir
  ST_RUNNING,           // Operação Normal (Alimentação)
  ST_STOP_CASCADE_1,    // Parada: Desliga Alimentação
  ST_STOP_WAIT_CLOSE,   // Parada: Aguarda Q5 fechar
  ST_ALARM_CRITICAL,    // Falha Crítica (Falta fase ou Falha Corta-Fogo)
  ST_PILOT_MODE         // Modo Chama Piloto
};

SystemState currentState = ST_OFF_IDLE;
String alarmMessage = "OK";

// Parâmetros (Salvos na Flash)
float sp_temp = 25.0;
float hist_temp = 2.0;
float sp_umid = 60.0;
float hist_umid = 5.0;
char temp_unit = 'C';

// Temporizadores Cíclicos (Segundos/Minutos)
int time_vibrador_on = 5;
int time_vibrador_off = 10;
int time_rosca_sec_on = 8;
int time_rosca_sec_off = 15;
int time_alarme_on = 1;
int time_alarme_off = 2;
bool alarme_enabled = true;

int time_chama_atv = 30;
int time_chama_wait = 5;

bool manual_mode = false;
bool i2_reset_last = false;

// Timers de execução (millis)
unsigned long timer_q3_vibrador = 0;
unsigned long timer_q2_rosca = 0;
unsigned long timer_q7_alarme = 0;
unsigned long timer_stop_check = 0;
unsigned long timer_pilot_wait = 0;
unsigned long timer_pilot_run = 0;

struct {
  bool i1_habilitacao;
  bool i2_reset;
  bool i3_energia;
  bool i4_fim_curso_aberta;
  bool i5_fim_curso_fechada;
  float i6_temp_sensor;
  float i7_umidade_sensor;
} inputs;

struct {
  bool q1_rosca_principal;
  bool q2_rosca_secundaria;
  bool q3_vibrador;
  bool q4_ventoinha;
  bool q5_corta_fogo;
  bool q6_damper;
  bool q7_alarme;
} outputs;

char client_id[32];
char topic_telemetry[64];
char topic_command[64];
char topic_lwt[64];

WiFiClientSecure espClient;
PubSubClient client(espClient);
WiFiManager wm;
DHT dht(DHT_PIN, DHT_TYPE);
Preferences preferences;

// =================================================================
// FUNÇÕES AUXILIARES
// =================================================================

void loadSettings() {
  preferences.begin("iot-config", true);
  sp_temp = preferences.getFloat("sp_temp", 25.0);
  hist_temp = preferences.getFloat("hist_temp", 2.0);
  sp_umid = preferences.getFloat("sp_umid", 60.0);
  hist_umid = preferences.getFloat("hist_umid", 5.0);
  temp_unit = preferences.getChar("temp_unit", 'C');
  time_vibrador_on = preferences.getInt("time_vib_on", 5);
  time_vibrador_off = preferences.getInt("time_vib_off", 10);
  time_rosca_sec_on = preferences.getInt("time_ros_on", 8);
  time_rosca_sec_off = preferences.getInt("time_ros_off", 15);
  time_alarme_on = preferences.getInt("time_alm_on", 1);
  time_alarme_off = preferences.getInt("time_alm_off", 2);
  alarme_enabled = preferences.getBool("alm_enabled", true);
  time_chama_atv = preferences.getInt("time_chama_atv", 30);
  time_chama_wait = preferences.getInt("time_chama_wait", 5);
  preferences.end();
}

void saveSettings() {
  preferences.begin("iot-config", false);
  preferences.putFloat("sp_temp", sp_temp);
  preferences.putFloat("hist_temp", hist_temp);
  preferences.putFloat("sp_umid", sp_umid);
  preferences.putFloat("hist_umid", hist_umid);
  preferences.putChar("temp_unit", temp_unit);
  preferences.putInt("time_vib_on", time_vibrador_on);
  preferences.putInt("time_vib_off", time_vibrador_off);
  preferences.putInt("time_ros_on", time_rosca_sec_on);
  preferences.putInt("time_ros_off", time_rosca_sec_off);
  preferences.putInt("time_alm_on", time_alarme_on);
  preferences.putInt("time_alm_off", time_alarme_off);
  preferences.putBool("alm_enabled", alarme_enabled);
  preferences.putInt("time_chama_atv", time_chama_atv);
  preferences.putInt("time_chama_wait", time_chama_wait);
  preferences.end();
}

void readInputs() {
  inputs.i1_habilitacao = !digitalRead(PIN_I1_HABILITACAO);

  bool i2_current = !digitalRead(PIN_I2_RESET);
  if (i2_current && !i2_reset_last) inputs.i2_reset = true;
  else inputs.i2_reset = false;
  i2_reset_last = i2_current;

  inputs.i3_energia = !digitalRead(PIN_I3_ENERGIA);
  inputs.i4_fim_curso_aberta = !digitalRead(PIN_I4_FIM_CURSO_ABERTA);
  inputs.i5_fim_curso_fechada = !digitalRead(PIN_I5_FIM_CURSO_FECHADA);

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

void controlHumidity() {
  if (manual_mode || currentState == ST_ALARM_CRITICAL) return;

  if ((inputs.i7_umidade_sensor + hist_umid) < sp_umid) {
    outputs.q6_damper = true;
  } else if (inputs.i7_umidade_sensor > sp_umid) {
    outputs.q6_damper = false;
  }
}

// =================================================================
// LÓGICA DE CONTROLE (MÁQUINA DE ESTADOS)
// =================================================================
void runSystemLogic() {
  unsigned long now = millis();

  if (!inputs.i3_energia && currentState != ST_ALARM_CRITICAL) {
    currentState = ST_ALARM_CRITICAL;
    alarmMessage = "FALTA FASE (I3)";
    return;
  }

  switch (currentState) {

    case ST_ALARM_CRITICAL:
      outputs.q1_rosca_principal = false;
      outputs.q2_rosca_secundaria = false;
      outputs.q3_vibrador = false;
      outputs.q4_ventoinha = false;
      outputs.q5_corta_fogo = false;
      outputs.q6_damper = false;

      if (alarme_enabled) {
        unsigned long cycle = (time_alarme_on + time_alarme_off) * 1000;
        unsigned long pos = now % cycle;
        outputs.q7_alarme = (pos < (time_alarme_on * 1000));
      } else {
        outputs.q7_alarme = true;
      }

      if (inputs.i3_energia && inputs.i1_habilitacao && inputs.i2_reset) {
        currentState = ST_OFF_IDLE;
        outputs.q7_alarme = false;
        alarmMessage = "OK";
      }
      break;

    case ST_OFF_IDLE:
      outputs.q1_rosca_principal = false;
      outputs.q2_rosca_secundaria = false;
      outputs.q3_vibrador = false;
      outputs.q5_corta_fogo = false;
      outputs.q7_alarme = false;

      if (inputs.i6_temp_sensor < sp_temp && inputs.i6_temp_sensor > (sp_temp - hist_temp)) {
        unsigned long wait_ms = time_chama_wait * 60000;
        unsigned long run_ms = time_chama_atv * 1000;
        unsigned long cycle_pos = now - timer_pilot_wait;

        if (cycle_pos >= (wait_ms + run_ms)) {
          // Fim do ciclo (Espera + Ativação), reinicia contagem
          timer_pilot_wait = now;
          outputs.q4_ventoinha = false;
        } else if (cycle_pos >= wait_ms) {
          // Passou o tempo de espera, ativa a ventoinha
          outputs.q4_ventoinha = true;
        } else {
          // Ainda no tempo de espera
          outputs.q4_ventoinha = false;
        }
      } else {
        outputs.q4_ventoinha = false;
        timer_pilot_wait = now;
      }

      if (inputs.i1_habilitacao && inputs.i3_energia && inputs.i6_temp_sensor < (sp_temp - hist_temp)) {
        currentState = ST_START_SEQ_1;
      }
      break;

    case ST_START_SEQ_1:
      outputs.q4_ventoinha = true;

      {
        unsigned long cycleQ2 = (time_rosca_sec_on + time_rosca_sec_off) * 1000;
        unsigned long posQ2 = now % cycleQ2;
        outputs.q2_rosca_secundaria = (posQ2 < (time_rosca_sec_on * 1000));
      }

      outputs.q5_corta_fogo = true;

      currentState = ST_START_WAIT_OPEN;
      break;

    case ST_START_WAIT_OPEN:
      outputs.q4_ventoinha = true;
      outputs.q5_corta_fogo = true;

      {
        unsigned long cycleQ2 = (time_rosca_sec_on + time_rosca_sec_off) * 1000;
        outputs.q2_rosca_secundaria = ((now % cycleQ2) < (time_rosca_sec_on * 1000));
      }

      if (inputs.i4_fim_curso_aberta) {
        currentState = ST_RUNNING;
      }

      if (!inputs.i1_habilitacao) currentState = ST_STOP_CASCADE_1;
      break;

    case ST_RUNNING:
      outputs.q4_ventoinha = true;
      outputs.q5_corta_fogo = true;
      outputs.q1_rosca_principal = true;

      {
        unsigned long cycleQ3 = (time_vibrador_on + time_vibrador_off) * 1000;
        outputs.q3_vibrador = ((now % cycleQ3) < (time_vibrador_on * 1000));
      }

      {
        unsigned long cycleQ2 = (time_rosca_sec_on + time_rosca_sec_off) * 1000;
        outputs.q2_rosca_secundaria = ((now % cycleQ2) < (time_rosca_sec_on * 1000));
      }

      if (inputs.i6_temp_sensor >= sp_temp || !inputs.i1_habilitacao) {
        currentState = ST_STOP_CASCADE_1;
      }
      break;

    case ST_STOP_CASCADE_1:
      outputs.q1_rosca_principal = false;
      outputs.q3_vibrador = false;
      outputs.q2_rosca_secundaria = false;
      outputs.q4_ventoinha = false;

      outputs.q5_corta_fogo = false;

      timer_stop_check = now;
      currentState = ST_STOP_WAIT_CLOSE;
      break;

    case ST_STOP_WAIT_CLOSE:
      outputs.q5_corta_fogo = false;

      if (inputs.i5_fim_curso_fechada) {
        currentState = ST_OFF_IDLE;
        timer_pilot_wait = now;
      }
      else if (now - timer_stop_check > 10000) {
        alarmMessage = "FALHA CORTA FOGO (I5)";
        currentState = ST_ALARM_CRITICAL;
      }
      break;
  }
}

// =================================================================
// MQTT
// =================================================================

void publishTelemetry() {
  if (!client.connected()) return;
  StaticJsonDocument<768> doc;

  doc["i1_hab"] = inputs.i1_habilitacao;
  doc["i2_rst"] = inputs.i2_reset;
  doc["i3_pwr"] = inputs.i3_energia;
  doc["i4_fc_open"] = inputs.i4_fim_curso_aberta;
  doc["i5_fc_close"] = inputs.i5_fim_curso_fechada;
  doc["temp"] = inputs.i6_temp_sensor;
  doc["umid"] = inputs.i7_umidade_sensor;

  doc["q1_main"] = outputs.q1_rosca_principal;
  doc["q2_sec"] = outputs.q2_rosca_secundaria;
  doc["q3_vib"] = outputs.q3_vibrador;
  doc["q4_fan"] = outputs.q4_ventoinha;
  doc["q5_fire"] = outputs.q5_corta_fogo;
  doc["q6_damp"] = outputs.q6_damper;
  doc["q7_alarm"] = outputs.q7_alarme;

  doc["state"] = (int)currentState;
  doc["msg"] = alarmMessage;

  doc["sp_temp"] = sp_temp;
  doc["sp_umid"] = sp_umid;
  doc["hist_temp"] = hist_temp;
  doc["hist_umid"] = hist_umid;
  doc["temp_unit"] = String(temp_unit);

  char payload[768];
  serializeJson(doc, payload);
  client.publish(topic_telemetry, payload, false);
}

void callback(char* topic, byte* payload, unsigned int length) {
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';

  StaticJsonDocument<512> doc;
  deserializeJson(doc, message);

  bool settings_changed = false;

  if (doc.containsKey("sp_temp")) {
    sp_temp = doc["sp_temp"];
    settings_changed = true;
  }
  if (doc.containsKey("hist_temp")) {
    hist_temp = doc["hist_temp"];
    settings_changed = true;
  }
  if (doc.containsKey("sp_umid")) {
    sp_umid = doc["sp_umid"];
    settings_changed = true;
  }
  if (doc.containsKey("hist_umid")) {
    hist_umid = doc["hist_umid"];
    settings_changed = true;
  }
  if (doc.containsKey("temp_unit")) {
    temp_unit = doc["temp_unit"].as<String>()[0];
    settings_changed = true;
  }

  if (doc.containsKey("time_vibrador_on")) time_vibrador_on = doc["time_vibrador_on"];
  if (doc.containsKey("time_vibrador_off")) time_vibrador_off = doc["time_vibrador_off"];
  if (doc.containsKey("time_rosca_sec_on")) time_rosca_sec_on = doc["time_rosca_sec_on"];
  if (doc.containsKey("time_rosca_sec_off")) time_rosca_sec_off = doc["time_rosca_sec_off"];
  if (doc.containsKey("time_alarme_on")) time_alarme_on = doc["time_alarme_on"];
  if (doc.containsKey("time_alarme_off")) time_alarme_off = doc["time_alarme_off"];
  if (doc.containsKey("alarme_enabled")) alarme_enabled = doc["alarme_enabled"];
  if (doc.containsKey("time_chama_atv")) time_chama_atv = doc["time_chama_atv"];
  if (doc.containsKey("time_chama_wait")) time_chama_wait = doc["time_chama_wait"];

  if (doc.containsKey("manual_mode")) manual_mode = doc["manual_mode"];

  if (manual_mode) {
    if (doc.containsKey("q1")) outputs.q1_rosca_principal = doc["q1"];
    if (doc.containsKey("q2")) outputs.q2_rosca_secundaria = doc["q2"];
    if (doc.containsKey("q3")) outputs.q3_vibrador = doc["q3"];
    if (doc.containsKey("q4")) outputs.q4_ventoinha = doc["q4"];
    if (doc.containsKey("q5")) outputs.q5_corta_fogo = doc["q5"];
    if (doc.containsKey("q6")) outputs.q6_damper = doc["q6"];
    if (doc.containsKey("q7")) outputs.q7_alarme = doc["q7"];
    applyOutputs();
  }

  if (settings_changed) saveSettings();
}

void attemptMqttConnection() {
  Serial.print("⏳ Tentando MQTT... ");
  
  // Tenta conectar
  if (client.connect(client_id, mqtt_user, mqtt_pass, topic_lwt, 1, true, "offline")) {
    Serial.println("✅ CONECTADO!");
    client.publish(topic_lwt, "online", true);
    client.subscribe(topic_command);
    Serial.print("Inscrito em: ");
    Serial.println(topic_command);
  } else {
    Serial.print("❌ Falha. Estado = ");
    Serial.print(client.state());
    Serial.println(" (Tentando novamente em 5s)");
    
   }
}

void setup() {
  Serial.begin(115200);
  delay(1000); // Espera estabilizar

  dht.begin();
  loadSettings();

  pinMode(PIN_I1_HABILITACAO, INPUT_PULLUP);
  pinMode(PIN_I2_RESET, INPUT_PULLUP);
  pinMode(PIN_I3_ENERGIA, INPUT_PULLUP);
  pinMode(PIN_I4_FIM_CURSO_ABERTA, INPUT_PULLUP);
  pinMode(PIN_I5_FIM_CURSO_FECHADA, INPUT_PULLUP);

  pinMode(PIN_Q1_ROSCA_PRINCIPAL, OUTPUT);
  pinMode(PIN_Q2_ROSCA_SECUNDARIA, OUTPUT);
  pinMode(PIN_Q3_VIBRADOR, OUTPUT);
  pinMode(PIN_Q4_VENTOINHA, OUTPUT);
  pinMode(PIN_Q5_CORTA_FOGO, OUTPUT);
  pinMode(PIN_Q6_DAMPER, OUTPUT);
  pinMode(PIN_Q7_ALARME, OUTPUT);

  applyOutputs();


  wm.setConnectTimeout(20);
  wm.setConfigPortalTimeout(180);

  Serial.println("Tentando conectar ao WiFi...");
  if (!wm.autoConnect("ESP32_INDUSTRIAL", "senha123")) {
    Serial.println("Falha no WiFi ou Timeout. Reiniciando...");
    ESP.restart();
  }

  Serial.println("\n✓ WiFi conectado!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());

  // --- CONFIGURAÇÃO MQTT ---
  String mac = WiFi.macAddress();
  mac.replace(":", "");
  mac.toCharArray(client_id, 32);
  snprintf(topic_telemetry, 64, "dispositivo/%s/telemetria", client_id);
  snprintf(topic_command, 64, "dispositivo/%s/comando", client_id);
  snprintf(topic_lwt, 64, "dispositivo/%s/conexao", client_id);

  // --- CORREÇÃO CRÍTICA AQUI ---

  // 1. Aumenta o tamanho do pacote permitido (Seu JSON é grande!)
  client.setBufferSize(2048);

  // 2. Tenta conexão segura simplificada (Bypassa validação de certificado para teste)
  // Se funcionar assim, o problema era o certificado CA. Se não, é senha ou firewall.
  espClient.setInsecure();
  // espClient.setCACert(root_ca); // Descomente e use este se quiser validação estrita depois

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    static unsigned long lastAttempt = 0;
    if (millis() - lastAttempt > 5000) {
      lastAttempt = millis();
      if (WiFi.status() == WL_CONNECTED) attemptMqttConnection();
    }
  } else {
    client.loop();
  }

  static unsigned long lastLogic = 0;
  if (millis() - lastLogic > 100) {
    readInputs();

    if (!manual_mode) {
      controlHumidity();
      runSystemLogic();
    }

    applyOutputs();
    lastLogic = millis();
  }

  static unsigned long lastPub = 0;
  if (millis() - lastPub > 2000) {
    publishTelemetry();
    lastPub = millis();
  }
}