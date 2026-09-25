const webhookUrl = 'https://atoflowak.app.n8n.cloud/webhook-test/ba3d01fa-fb91-472b-9c60-4f5f7ad9b160';

console.log(`Starting to send data to Webhook: ${webhookUrl}`);

async function sendData() {
  const machineId = `MCH-0${Math.floor(Math.random() * 3) + 1}`;
  const value = Math.floor(Math.random() * 400) + 1400;
  
  const payload = {
    sensor_id: `temp-${machineId.toLowerCase()}`,
    sensor_type: 'temperature',
    value: value,
    unit: 'C',
    machine_id: machineId,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`\n[POST] Data sent:`, payload);
    
    if (!response.ok) {
      console.error(`❌ Error from webhook: ${response.status} ${response.statusText}`);
    } else {
      const data = await response.text();
      console.log(`✅ Webhook response: ${data}`);
    }
  } catch (error) {
    console.error('❌ Failed to send data:', error.message);
  }
}

// Pehle turant ek data bhejo
sendData();

// Fir har 3 second mein bhejte raho
setInterval(sendData, 3000);
