import { useState } from 'react';
import { ChatInterface } from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Reminders from './features/Reminders';
import Timers from './features/Timers';
import { Dashboard } from './features/Dashboard';
import { Settings } from './features/Settings';

type Tab = 'dashboard' | 'chat' | 'timers' | 'reminders' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="w-full h-screen flex overflow-hidden p-4 gap-4 bg-black items-stretch">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 h-full relative z-0">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-700/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[100px] -z-10" />

        <div className="h-full w-full relative">
          {activeTab === 'dashboard' && (
            <div className="absolute inset-0">
              <Dashboard />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="absolute inset-0">
              <ChatInterface />
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="absolute inset-0">
              <Reminders />
            </div>
          )}

          {activeTab === 'timers' && (
            <div className="absolute inset-0">
              <Timers />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="absolute inset-0">
              <Settings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
