const mqtt = require('mqtt');

// Connect to the public Mosquitto broker (assuming you are using this in n8n)
const client = mqtt.connect('mqtt://test.mosquitto.org');

client.on('connect', () => {
  console.log('Connected to MQTT Broker!');

  const topic = 'plant/01/line/L1/machine/M-101/sensor/TEMP/telemetry';
  
  // 110.5 is above the 95 critical threshold
  const payload = JSON.stringify({
    machine_id: 'M-101',
    value: 110.5 
  });

  console.log(`Sending abnormal temperature to ${topic}...`);
  console.log(`Payload: ${payload}`);

  client.publish(topic, payload, (err) => {
    if (err) {
      console.error('Failed to send MQTT message:', err);
    } else {
      console.log('🚨 Emergency Data Sent Successfully! Check your n8n and website.');
    }
    client.end(); // Close connection
  });
});
