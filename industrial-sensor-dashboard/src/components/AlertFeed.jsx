import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle } from 'lucide-react';

export default function AlertFeed() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('sensor_alerts')
        .select('*')
        .eq('severity', 'Critical')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data) {
        setAlerts(data);
      }
    };

    fetchInitial();

    const channel = supabase
      .channel('alert-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_alerts', filter: "severity=eq.Critical" }, (payload) => {
        setAlerts((prev) => [payload.new, ...prev].slice(0, 10));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-industrial-800 p-6 rounded-lg border border-industrial-700 flex flex-col h-full min-h-[400px]">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-industrial-danger">
        <AlertTriangle className="w-5 h-5" /> Critical Alerts
      </h2>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id || alert.created_at} className="bg-industrial-900 border border-industrial-danger/50 p-3 rounded-md">
            <div className="flex justify-between items-start mb-1">
              <span className="font-bold text-gray-200">{alert.machine_id}</span>
              <span className="text-xs text-gray-400">
                {new Date(alert.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm text-industrial-danger font-medium mt-1">
              Cause: {alert.probable_cause || 'Unknown'}
            </p>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="text-gray-500 text-sm">No critical alerts recently.</div>
        )}
      </div>
    </div>
  );
}
