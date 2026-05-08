import { type Tab } from '../App';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconDashboard = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconChat = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const IconTimer = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconReminder = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconSettings = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ─── Nav Items Config ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; label: string; icon: React.FC }[] = [
  { id: 'dashboard', label: 'Dashboard',  icon: IconDashboard },
  { id: 'chat',      label: 'AI Chat',    icon: IconChat      },
  { id: 'timers',    label: 'Timers',     icon: IconTimer     },
  { id: 'reminders', label: 'Reminders',  icon: IconReminder  },
  { id: 'settings',  label: 'Settings',   icon: IconSettings  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    /**
     * shrink-0   → sidebar NEVER shrinks, always stays at w-[220px]
     * h-full     → full window height
     * flex flex-col → stacks logo, nav, footer vertically
     */
    <aside
      className="shrink-0 w-[220px] h-full flex flex-col"
      style={{
        background: '#1a1d23',
        borderRight: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-5 py-5 border-b border-white/05">
        {/* Animated orb */}
        <div className="relative w-8 h-8 shrink-0">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#a3b18a] to-[#94a3b8] opacity-60 animate-pulse-ring" />
          <div className="absolute inset-[3px] rounded-full bg-[#1a1d23]" />
          <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-[#a3b18a] to-[#94a3b8]" />
        </div>
        <div>
          <p
            className="text-[13px] font-bold tracking-tight"
            style={{
              fontFamily: "'Space Mono', monospace",
              background: 'linear-gradient(135deg, #a3b18a, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            V.A.N.I
          </p>
          <p className="text-[10px] text-white/20 tracking-widest uppercase" style={{ fontFamily: "'Space Mono', monospace" }}>
            Assistant
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase text-white/10"
           style={{ fontFamily: "'Inter', sans-serif" }}>
          Navigation
        </p>

        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`nav-item w-full text-left ${activeTab === id ? 'active' : ''}`}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="shrink-0"><Icon /></span>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Footer / Status ───────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-4 border-t border-white/05">
        {/* AI Status */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 glass rounded-xl">
          <div className="relative w-2 h-2 shrink-0">
            <div className="absolute inset-0 rounded-full bg-[#a3b18a] opacity-40 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-[#a3b18a]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white/50 truncate">Vani Active</p>
            <p className="text-[10px] text-white/20 truncate" style={{ fontFamily: "'Space Mono', monospace" }}>
              vani-model
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}