import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/analyze-machine', async (req, res) => {
  const { machine_id } = req.body;
  
  if (!machine_id) {
    return res.status(400).json({ error: 'machine_id is required in request body' });
  }

  try {
    // 1. Fetch latest temperature
    const { data: tempData, error: tempErr } = await supabase
      .from('sensor_readings')
      .select('value')
      .eq('machine_id', machine_id)
      .eq('sensor_type', 'temperature')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    // 2. Fetch latest pressure
    const { data: pressData, error: pressErr } = await supabase
      .from('sensor_readings')
      .select('value')
      .eq('machine_id', machine_id)
      .eq('sensor_type', 'pressure')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (tempErr && tempErr.code !== 'PGRST116') throw tempErr;
    if (pressErr && pressErr.code !== 'PGRST116') throw pressErr;

    const temp = tempData ? tempData.value : null;
    const press = pressData ? pressData.value : null;

    if (temp === null || press === null) {
      return res.status(404).json({ error: `Incomplete data for ${machine_id}. Missing temperature or pressure.` });
    }

    // 2.5 Fetch thresholds from machine_config
    const { data: configData, error: configErr } = await supabase
      .from('machine_config')
      .select('temp_threshold, pressure_threshold')
      .eq('machine_id', machine_id)
      .single();

    if (configErr) {
      if (configErr.code === 'PGRST116') {
         return res.status(404).json({ error: `No configuration found for ${machine_id} in machine_config table.` });
      }
      throw configErr;
    }

    // 3. Apply dynamic risk logic
    const tempHigh = temp > configData.temp_threshold;
    const pressHigh = press > configData.pressure_threshold;
    
    let severity = "Normal";
    if (tempHigh && pressHigh) {
      severity = "Critical - Combined Risk";
    } else if (tempHigh || pressHigh) {
      severity = "Warning - Single Parameter";
    }

    const payload = {
      machine_id,
      temperature: temp,
      pressure: press,
      severity
    };

    // 4. Insert into new risk_analysis table
    const { data: insertData, error: insertErr } = await supabase
      .from('risk_analysis')
      .insert([payload])
      .select()
      .single();

    if (insertErr) {
      // Return 500 but also pass the error message to help user debug (e.g., if table doesn't exist)
      return res.status(500).json({ 
        error: 'Failed to insert into risk_analysis table.',
        details: insertErr.message 
      });
    }

    // 5. Return result
    return res.json({
      message: 'Analysis complete',
      analysis: insertData
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Analysis Service running on port ${PORT}`);
  console.log(`Try: POST http://localhost:${PORT}/analyze-machine with {"machine_id": "MCH-01"}`);
});
