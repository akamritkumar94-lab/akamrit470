import mqtt from 'mqtt';

// Use WebSocket port for browser connection
const brokerUrl = 'ws://test.mosquitto.org:8080';

export const mqttClient = mqtt.connect(brokerUrl);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker via WebSocket!');
});

mqttClient.on('error', (err) => {
  console.error('MQTT Connection Error:', err);
});
