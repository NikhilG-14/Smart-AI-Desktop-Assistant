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
    // Root: w-screen h-screen is the single source of truth for sizing.
    // overflow-hidden prevents any child from ever escaping.
    <div className="w-screen h-screen flex overflow-hidden bg-[#080b12] font-sans">

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/*
       * <main> takes all remaining horizontal space (flex-1),
       * has an explicit height (h-full), and clips overflow.
       * position:relative creates the stacking context for the blobs.
       * NO nested flex wrappers — the content div sits directly inside.
       */}
      <main className="relative flex-1 min-h-0 min-w-0 flex">

        {/* Ambient depth blobs — position:absolute, pointer-events:none, z-0 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full"
          style={{
            zIndex: 0,
            background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full"
          style={{
            zIndex: 0,
            background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Perspective grid — position:absolute, z:0 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            zIndex: 0,
            backgroundImage: `
              linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 120%, black 0%, transparent 70%)',
          }}
        />

        {/*
         * Content panel — sits ABOVE the blobs (z:10), fills full height.
         * w-full h-full are reliable here because <main> has a concrete height.
         * overflow:hidden prevents any child page from blowing out the layout.
         */}
        <div
          className="flex-1 min-h-0 min-w-0"
          style={{ position: 'relative', zIndex: 10 }}
        >
          {activeTab === 'dashboard' && <Dashboard />}
          <div className={activeTab === 'chat' ? 'block h-full' : 'hidden'}>
            <ChatInterface />
          </div>
          {activeTab === 'reminders' && <Reminders />}
          {activeTab === 'timers' && <Timers />}
          {activeTab === 'settings' && <Settings />}
        </div>

      </main>
    </div>
  );
}

export default App;