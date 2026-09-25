import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envFile = fs.readFileSync(join(__dirname, '.env'), 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    envVars[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbWdseWlnY2pheXp4bG9hZmFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTg1MjM2MywiZXhwIjoyMTA1NDI4MzYzfQ.TxnpcEwiz8lf5UhYCE0Qoi3g-lyLbv6_hSkpqNnOq9Y";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const machines = ['MCH-01', 'MCH-02', 'MCH-03'];

async function insertData() {
  const machineId = machines[Math.floor(Math.random() * machines.length)];
  const tempValue = Math.floor(Math.random() * 400) + 1400;
  const pressValue = parseFloat((Math.random() * 5 + 4).toFixed(1)); // 4.0 to 9.0 bar
  const now = new Date().toISOString();
  
  // Insert Temp
  const { error: tempErr } = await supabase.from('sensor_readings').insert({
    sensor_id: `temp-${machineId.toLowerCase()}`,
    sensor_type: 'temperature',
    value: tempValue,
    unit: 'C',
    machine_id: machineId,
    recorded_at: now
  });

  if (tempErr) console.error("❌ Error inserting temp:", tempErr.message || tempErr);

  // Insert Pressure
  const { error: pressErr } = await supabase.from('sensor_readings').insert({
    sensor_id: `press-${machineId.toLowerCase()}`,
    sensor_type: 'pressure',
    value: pressValue,
    unit: 'bar',
    machine_id: machineId,
    recorded_at: now
  });

  if (pressErr) console.error("❌ Error inserting pressure:", pressErr.message || pressErr);
  else console.log(`✅ Data inserted: ${machineId} - ${tempValue}°C, ${pressValue} bar`);

  if (tempValue > 1750) {
    const { error: alertErr } = await supabase.from('sensor_alerts').insert({
      sensor_id: `temp-${machineId.toLowerCase()}`,
      machine_id: machineId,
      severity: 'Critical',
      probable_cause: `High temperature anomaly (${tempValue}°C) detected`,
      value: tempValue,
      alert_sent: false
    });
    if (alertErr) console.error("❌ Error inserting alert:", alertErr.message);
    else console.log(`🚨 Critical Alert Inserted for ${machineId}`);
  }
}

insertData();
setInterval(insertData, 3000);
