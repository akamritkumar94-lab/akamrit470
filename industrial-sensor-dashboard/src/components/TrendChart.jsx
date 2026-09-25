import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TrendChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data: readings, error } = await supabase
        .from('sensor_readings')
        .select('value, created_at')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && readings) {
        setData(readings.reverse().map(r => ({
          ...r,
          timeLabel: new Date(r.created_at || r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        })));
      }
    };

    fetchInitial();

    const channel = supabase
      .channel('trend-chart')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, (payload) => {
        setData((prev) => {
          const newData = [...prev, {
            ...payload.new,
            timeLabel: new Date(payload.new.created_at || payload.new.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }];
          return newData.slice(-20);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-industrial-800 p-6 rounded-lg border border-industrial-700 h-[400px] flex flex-col">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-100">
        <TrendingUp className="w-5 h-5" /> Temperature Trend (Last 20)
      </h2>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="timeLabel" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} domain={['dataMin - 100', 'dataMax + 100']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
              itemStyle={{ color: '#3B82F6' }}
              labelStyle={{ color: '#9CA3AF' }}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }} 
              activeDot={{ r: 6 }} 
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
