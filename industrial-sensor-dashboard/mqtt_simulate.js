import mqtt from 'mqtt';

const brokerUrl = 'mqtt://test.mosquitto.org';
const topic = 'akautoflow/sensors/data';

console.log(`Connecting to MQTT broker at ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

client.on('connect', () => {
  console.log('✅ Connected to MQTT Broker!');
  console.log(`📡 Publishing Temperature & Pressure data to topic: "${topic}" every 3 seconds...\n`);

  setInterval(() => {
    const machineId = `MCH-0${Math.floor(Math.random() * 3) + 1}`;
    const tempValue = Math.floor(Math.random() * 400) + 1400;
    const pressValue = parseFloat((Math.random() * 5 + 4).toFixed(1));
    const now = new Date().toISOString();
    
    // Temperature Payload
    const tempPayload = {
      sensor_id: `temp-${machineId.toLowerCase()}`,
      sensor_type: 'temperature',
      value: tempValue,
      unit: 'C',
      machine_id: machineId,
      timestamp: now
    };

    // Pressure Payload
    const pressPayload = {
      sensor_id: `press-${machineId.toLowerCase()}`,
      sensor_type: 'pressure',
      value: pressValue,
      unit: 'bar',
      machine_id: machineId,
      timestamp: now
    };

    client.publish(topic, JSON.stringify(tempPayload));
    client.publish(topic, JSON.stringify(pressPayload));
    
    console.log(`Published: ${machineId} -> Temp: ${tempValue}°C | Press: ${pressValue} bar`);

  }, 3000);
});

client.on('error', (err) => {
  console.error('Connection error:', err);
});
