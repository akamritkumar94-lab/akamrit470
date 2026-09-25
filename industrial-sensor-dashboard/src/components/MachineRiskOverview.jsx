import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ShieldAlert } from 'lucide-react';

export default function MachineRiskOverview() {
  const [machines, setMachines] = useState({});

  useEffect(() => {
    const fetchInitial = async () => {
      // Order by id descending to safely get newest records
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .in('sensor_type', ['temperature', 'pressure'])
        .order('id', { ascending: false })
        .limit(200);

      if (!error && data) {
        const initial = {};
        data.forEach((r) => {
          if (!initial[r.machine_id]) {
            initial[r.machine_id] = { temperature: null, pressure: null };
          }
          if (r.sensor_type === 'temperature' && initial[r.machine_id].temperature === null) {
            initial[r.machine_id].temperature = r.value;
          }
          if (r.sensor_type === 'pressure' && initial[r.machine_id].pressure === null) {
            initial[r.machine_id].pressure = r.value;
          }
        });
        setMachines(initial);
      }
    };
    
    fetchInitial();

    const channel = supabase
      .channel('machine-risk')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, (payload) => {
        const { machine_id, sensor_type, value } = payload.new;
        if (sensor_type === 'temperature' || sensor_type === 'pressure') {
          setMachines((prev) => ({
            ...prev,
            [machine_id]: {
              ...(prev[machine_id] || { temperature: null, pressure: null }),
              [sensor_type]: value
            }
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getRiskBadge = (temp, press) => {
    const tempHigh = temp > 1700;
    const pressHigh = press > 7.5;

    if (tempHigh && pressHigh) {
      return <span className="px-3 py-1 bg-industrial-danger/20 text-industrial-danger border border-industrial-danger rounded-full text-[10px] font-bold uppercase tracking-wider">Combined Risk</span>;
    } else if (tempHigh || pressHigh) {
      return <span className="px-3 py-1 bg-industrial-warning/20 text-industrial-warning border border-industrial-warning rounded-full text-[10px] font-bold uppercase tracking-wider">Single Parameter Warning</span>;
    } else {
      return <span className="px-3 py-1 bg-industrial-success/20 text-industrial-success border border-industrial-success rounded-full text-[10px] font-bold uppercase tracking-wider">Normal</span>;
    }
  };

  return (
    <div className="bg-industrial-800 p-6 rounded-lg border border-industrial-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100">
        <ShieldAlert className="w-5 h-5" /> Machine Risk Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(machines).map(([machineId, data]) => (
          <div key={machineId} className="p-4 bg-industrial-900 rounded-md border border-industrial-700 flex flex-col justify-between h-full gap-4">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg font-black text-gray-200">{machineId}</h3>
              <div className="text-right">
                {getRiskBadge(data.temperature, data.pressure)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Temperature</span>
                <span className={`text-xl font-bold ${data.temperature > 1700 ? 'text-industrial-danger' : 'text-gray-200'}`}>
                  {data.temperature !== null ? `${data.temperature}°C` : '--'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">Pressure</span>
                <span className={`text-xl font-bold ${data.pressure > 7.5 ? 'text-industrial-warning' : 'text-gray-200'}`}>
                  {data.pressure !== null ? `${data.pressure} bar` : '--'}
                </span>
              </div>
            </div>
          </div>
        ))}
        {Object.keys(machines).length === 0 && (
          <div className="text-gray-500 text-sm col-span-full">No machine risk data available.</div>
        )}
      </div>
    </div>
  );
}
