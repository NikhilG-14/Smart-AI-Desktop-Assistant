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
    /*
     * Root div — matches #root which is position:relative, width:100%, height:100%
     * This div just carries the background color and is a flex row
     * Sidebar sits on the left, main takes the rest
     */
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: '#080b12',
    }}>

      {/* Sidebar — fixed 220px, never shrinks, full height */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/*
       * main — takes all remaining width after sidebar
       * position:relative is CRITICAL — it's the anchor for the
       * position:absolute tab panels inside
       */}
      <main style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#080b12',
        overscrollBehavior: 'none',
      }}>

        {/* ── Decorative blobs — purely visual, never affect layout ── */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          top: -160, left: -80,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute',
          bottom: -160, right: -80,
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129,140,248,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* ── Perspective grid — purely visual, never affects layout ── */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 120%, black 0%, transparent 70%)',
        }} />

        {/*
         * ── TAB PANELS ──────────────────────────────────────────────
         *
         * KEY ARCHITECTURE DECISION:
         * Every tab panel is position:absolute, inset:0, zIndex:10
         * This means each panel gets EXACT pixel dimensions from <main>
         * which is position:relative with a concrete height:100%.
         *
         * This completely bypasses the flex height chain that was
         * causing layout breaks on re-render. There is no flex chain
         * to break — each panel simply fills its positioned parent.
         *
         * display:flex when active, display:none when inactive.
         * display:none removes from paint but keeps component mounted
         * so state (messages, camera, etc) is preserved between tabs.
         */}

        {/* Dashboard */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: activeTab === 'dashboard' ? 'flex' : 'none',
        }}>
          <Dashboard />
        </div>

        {/* Chat */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: activeTab === 'chat' ? 'flex' : 'none',
        }}>
          <ChatInterface />
        </div>

        {/* Reminders */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: activeTab === 'reminders' ? 'flex' : 'none',
        }}>
          <Reminders />
        </div>

        {/* Timers */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: activeTab === 'timers' ? 'flex' : 'none',
        }}>
          <Timers />
        </div>

        {/* Settings */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          display: activeTab === 'settings' ? 'flex' : 'none',
        }}>
          <Settings />
        </div>

      </main>
    </div>
  );
}

export default App;