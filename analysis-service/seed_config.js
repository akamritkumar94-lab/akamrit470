import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedConfig() {
  console.log("Seeding machine_config table...");

  const configs = [
    { machine_id: 'MCH-01', temp_threshold: 1700, pressure_threshold: 7.5, client_id: 'client-A' },
    { machine_id: 'MCH-02', temp_threshold: 1700, pressure_threshold: 7.5, client_id: 'client-A' },
    { machine_id: 'MCH-03', temp_threshold: 1700, pressure_threshold: 7.5, client_id: 'client-A' }
  ];

  const { error } = await supabase
    .from('machine_config')
    .upsert(configs, { onConflict: 'machine_id' });

  if (error) {
    console.error("❌ Failed to seed config:", error);
  } else {
    console.log("✅ Successfully seeded machine_config table with default thresholds!");
  }
}

seedConfig();
