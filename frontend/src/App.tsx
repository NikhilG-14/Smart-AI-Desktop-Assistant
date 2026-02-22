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
    <div className="w-screen h-screen flex overflow-hidden p-4 gap-4 bg-black">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 relative flex flex-col min-w-0">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyan-700/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-700/20 rounded-full blur-[100px] -z-10" />

        <div className="flex-1 w-full relative flex flex-col">
          {activeTab === 'dashboard' && (
            <div className="flex-1 flex overflow-hidden">
              <Dashboard />
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex-1 flex overflow-hidden">
              <ChatInterface />
            </div>
          )}

          {activeTab === 'reminders' && (
            <div className="flex-1 flex overflow-hidden">
              <Reminders />
            </div>
          )}

          {activeTab === 'timers' && (
            <div className="flex-1 flex overflow-hidden">
              <Timers />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 flex overflow-hidden">
              <Settings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
