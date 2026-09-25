import React from 'react';
import LiveReadings from './components/LiveReadings';
import AlertFeed from './components/AlertFeed';
import TrendChart from './components/TrendChart';
import MachineRiskOverview from './components/MachineRiskOverview';

function App() {
  return (
    <div className="min-h-screen bg-industrial-900 text-gray-200 p-4 md:p-8">
      <header className="mb-8 border-b border-industrial-700 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-white">
          SCADA <span className="text-industrial-accent">DASHBOARD</span>
        </h1>
        <p className="text-gray-400 text-sm mt-1">Industrial Sensor Monitoring System</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <MachineRiskOverview />
          <LiveReadings />
          <TrendChart />
        </div>
        <div className="lg:col-span-1 h-full">
          <AlertFeed />
        </div>
      </div>
    </div>
  );
}

export default App;
