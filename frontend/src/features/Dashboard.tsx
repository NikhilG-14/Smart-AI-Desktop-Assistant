import { useState, useEffect } from 'react';
import { SystemMonitor } from '../components/SystemMonitor';

// ─── Quick Stat ───────────────────────────────────────────────────────────────

function QuickStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="card flex-1 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-2"
         style={{ fontFamily: "'Space Mono', monospace" }}>
        {label}
      </p>
      <p className="text-2xl font-bold mb-0.5" style={{ color: accent, fontFamily: "'Space Mono', monospace" }}>
        {value}
      </p>
      <p className="text-[11px] text-white/35">{sub}</p>
    </div>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({ icon, text, time, type }: { icon: string; text: string; time: string; type: 'info' | 'success' | 'warning' }) {
  const colors: Record<string, string> = {
    info: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  };

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-white/04 last:border-0">
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm border ${colors[type]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/70 leading-relaxed">{text}</p>
      </div>
      <span
        className="shrink-0 text-[10px] text-white/25 mt-0.5"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {time}
      </span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  const activities = [
    { icon: '🤖', text: 'AI model loaded successfully', time: 'now',    type: 'success' as const },
    { icon: '⏱', text: 'Pomodoro timer completed — great focus session!', time: '12m',  type: 'info' as const },
    { icon: '🔔', text: 'Reminder: Team standup in 30 minutes',          time: '18m',  type: 'warning' as const },
    { icon: '💾', text: 'Auto-save completed — all data backed up',      time: '1h',   type: 'success' as const },
    { icon: '📊', text: 'CPU usage spiked to 89% — peak resolved',       time: '2h',   type: 'warning' as const },
  ];

  return (
    /**
     * Same pattern as all features:
     * flex-1 min-w-0 min-h-0 → fills space, allows shrinking
     * overflow-y-auto → this panel can scroll if content overflows
     */
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-5 p-6">

        {/* ── Hero Clock ──────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(103,232,249,0.07) 0%, rgba(167,139,250,0.07) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* bg accent */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />

          <p className="text-[11px] text-white/30 uppercase tracking-widest mb-1"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            {dateStr}
          </p>
          <p
            className="text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "'Space Mono', monospace",
              background: 'linear-gradient(135deg, #67e8f9, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {timeStr}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="badge badge-green">System Online</span>
            <span className="badge badge-cyan">AI Ready</span>
          </div>
        </div>

        {/* ── Quick Stats ──────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <QuickStat label="Active Timers"    value="2"     sub="Pomodoro running"    accent="#67e8f9" />
          <QuickStat label="Reminders Today"  value="4"     sub="1 upcoming soon"     accent="#a78bfa" />
          <QuickStat label="Chat Messages"    value="127"   sub="This session"        accent="#34d399" />
        </div>

        {/* ── Bottom Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-5">

          {/* System Monitor */}
          <div className="card">
            <SystemMonitor />
          </div>

          {/* Activity Feed */}
          <div className="card flex flex-col">
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-3 shrink-0"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Recent Activity
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {activities.map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}