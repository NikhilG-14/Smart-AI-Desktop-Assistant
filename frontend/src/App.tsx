import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Reminders from './features/Reminders';
import Timers from './features/Timers';
import { Dashboard } from './features/Dashboard';
import { Settings } from './features/Settings';

export type Tab = 'dashboard' | 'chat' | 'timers' | 'reminders' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-[#080b12] font-sans">

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
     <main className="relative flex-1 flex min-w-0 h-full overflow-hidden">

        {/* Ambient depth blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full -z-0"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full -z-0"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        {/* Floor plane — subtle perspective grid */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-0" style={{
          backgroundImage: `linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 120%, black 0%, transparent 70%)'
        }} />

        {/* Content panel — CRITICAL layout classes preserved exactly */}
        <div className="flex min-h-0 w-full h-full overflow-hidden z-10">
          {activeTab === 'dashboard'  && <Dashboard />}
          {activeTab === 'chat'       && <ChatInterface />}
          {activeTab === 'reminders'  && <Reminders />}
          {activeTab === 'timers'     && <Timers />}
          {activeTab === 'settings'   && <Settings />}
        </div>
      </main>
    </div>
  );
}

export default App;