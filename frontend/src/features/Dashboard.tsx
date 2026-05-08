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
  const [stats, setStats] = useState({ timers: 0, reminders: 0, messages: 0 });
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tRes = await fetch('http://127.0.0.1:8000/timers/active');
        const timers = await tRes.json();
        
        const rRes = await fetch('http://127.0.0.1:8000/reminders');
        const reminders = await rRes.json();
        
        const mRes = await fetch('http://127.0.0.1:8000/memory/recent');
        const memory = await mRes.json();
        
        setStats({
          timers: timers.length,
          reminders: reminders.length,
          messages: memory.filter((m: any) => m.role === 'user').length
        });
        
        setActivity(memory.slice(-5).reverse().map((m: any) => ({
          icon: m.role === 'user' ? '💬' : '🤖',
          text: m.text,
          time: 'recently',
          type: m.role === 'user' ? 'info' : 'success'
        })));
      } catch (e) {}
    };
    fetchData();
    const id = setInterval(fetchData, 10000);
    return () => clearInterval(id);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-5 p-6">

        {/* ── Hero Clock ──────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(163,177,138,0.05) 0%, rgba(148,163,184,0.05) 100%)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-slate-500/05 blur-2xl pointer-events-none" />

          <p className="text-[11px] text-white/20 uppercase tracking-widest mb-1"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            {dateStr}
          </p>
          <p
            className="text-4xl font-bold tracking-tight"
            style={{
              fontFamily: "'Space Mono', monospace",
              background: 'linear-gradient(135deg, #a3b18a, #94a3b8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {timeStr}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <span className="badge badge-green">Vani Online</span>
            <span className="badge badge-cyan">Zen Mode</span>
          </div>
        </div>

        {/* ── Quick Stats ──────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <QuickStat label="Active Timers"    value={stats.timers.toString()}     sub="Running in background"    accent="#a3b18a" />
          <QuickStat label="Pending Tasks"   value={stats.reminders.toString()}  sub="Reminders scheduled"      accent="#94a3b8" />
          <QuickStat label="Total Queries"   value={stats.messages.toString()}   sub="In this session"           accent="#84a59d" />
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
              {activity.length === 0 ? (
                <p className="text-xs text-white/20 text-center py-10">No recent activity</p>
              ) : (
                activity.map((a, i) => (
                  <ActivityItem key={i} {...a} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}