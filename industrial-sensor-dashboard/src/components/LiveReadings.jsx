import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Activity } from 'lucide-react';

export default function LiveReadings() {
  const [readings, setReadings] = useState({});

  useEffect(() => {
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        const initialReadings = {};
        data.forEach((r) => {
          if (!initialReadings[r.machine_id]) {
            initialReadings[r.machine_id] = r;
          }
        });
        setReadings(initialReadings);
      }
    };
    
    fetchInitial();

    const channel = supabase
      .channel('live-readings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, (payload) => {
        setReadings((prev) => ({
          ...prev,
          [payload.new.machine_id]: payload.new
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusColor = (value) => {
    if (value > 1700) return 'bg-industrial-danger/20 border-industrial-danger text-industrial-danger';
    if (value > 1500) return 'bg-industrial-warning/20 border-industrial-warning text-industrial-warning';
    return 'bg-industrial-success/20 border-industrial-success text-industrial-success';
  };

  return (
    <div className="bg-industrial-800 p-6 rounded-lg border border-industrial-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100">
        <Activity className="w-5 h-5" /> Live Readings
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.values(readings).map((reading) => (
          <div 
            key={reading.machine_id} 
            className={`p-4 rounded-md border ${getStatusColor(reading.value)} flex flex-col`}
          >
            <span className="text-sm font-semibold uppercase tracking-wider opacity-80">{reading.machine_id}</span>
            <span className="text-2xl font-bold mt-1">{reading.value} {reading.unit}</span>
            <span className="text-xs mt-2 opacity-70">
              {new Date(reading.created_at || reading.timestamp || reading.recorded_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {Object.keys(readings).length === 0 && (
          <div className="text-gray-500 text-sm col-span-full">No readings available. Ensure your Supabase tables are created and Realtime is enabled.</div>
        )}
      </div>
    </div>
  );
}
