import { useState, useCallback, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = 'low' | 'medium' | 'high';
type ReminderStatus = 'pending' | 'done';

interface Reminder {
  id: string;
  text: string;
  datetime: string;
  priority: Priority;
  status: ReminderStatus;
  createdAt: Date;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; badge: string }> = {
  low:    { label: 'Low',    color: '#a3b18a', badge: 'badge-green'  },
  medium: { label: 'Medium', color: '#94a3b8', badge: 'badge-cyan'   },
  high:   { label: 'High',   color: '#e07a5f', badge: 'badge-red'    },
};

// ─── Reminder Card ────────────────────────────────────────────────────────────

function ReminderCard({
  reminder,
  onToggle,
  onDelete,
}: {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const cfg  = PRIORITY_CONFIG[reminder.priority];
  const done = reminder.status === 'done';

  const fmtDate = (dt: string) => {
    if (!dt) return 'No date set';
    try {
      return new Date(dt).toLocaleString([], {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dt;
    }
  };

  return (
    <div
      className="card flex items-start gap-3 transition-all duration-200"
      style={{
        opacity: done ? 0.5 : 1,
        borderColor: done ? 'rgba(255,255,255,0.04)' : `${cfg.color}20`,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(reminder.id)}
        className="shrink-0 mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center
                   transition-all duration-200"
        style={{
          borderColor: done ? 'rgba(255,255,255,0.15)' : cfg.color,
          background: done ? cfg.color : 'transparent',
        }}
      >
        {done && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-relaxed ${done ? 'text-white/30 line-through' : 'text-white/80'}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {reminder.text}
        </p>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
          {reminder.datetime && (
            <span
              className="text-[10px] text-white/30"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              {fmtDate(reminder.datetime)}
            </span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(reminder.id)}
        className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center
                   text-white/15 hover:text-white/60 hover:bg-white/05 transition-all text-xs"
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newText,   setNewText]   = useState('');
  const [newDate,   setNewDate]   = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all');

  const fetchReminders = useCallback(async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/reminders');
      const data = await res.json();
      setReminders(data.map((r: any) => ({
        id: r.id.toString(),
        text: r.message,
        datetime: r.due_time || '',
        priority: 'medium', 
        status: r.is_completed ? 'done' : 'pending',
        createdAt: new Date(r.created_at)
      })));
    } catch (e) { console.error("Fetch reminders failed", e); }
  }, []);

  useEffect(() => {
    fetchReminders();
    const id = setInterval(fetchReminders, 10000);
    return () => clearInterval(id);
  }, [fetchReminders]);

  const add = useCallback(async () => {
    if (!newText.trim()) return;
    try {
      await fetch('http://127.0.0.1:8000/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newText.trim(),
          due_time: newDate || new Date(Date.now() + 5 * 60000).toISOString()
        })
      });
      setNewText('');
      setNewDate('');
      setNewPriority('medium');
      fetchReminders();
    } catch (e) { console.error("Add failed", e); }
  }, [newText, newDate, fetchReminders]);

  const toggle = useCallback(async (id: string) => {
    const r = reminders.find(item => item.id === id);
    if (!r) return;
    try {
      await fetch(`http://127.0.0.1:8000/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: r.status !== 'done' })
      });
      fetchReminders();
    } catch (e) { console.error("Toggle failed", e); }
  }, [reminders, fetchReminders]);

  const remove = useCallback(async (id: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/reminders/${id}`, { method: 'DELETE' });
      fetchReminders();
    } catch (e) { console.error("Delete failed", e); }
  }, [fetchReminders]);

  const clearDone = async () => {
    const doneOnes = reminders.filter(r => r.status === 'done');
    for (const r of doneOnes) {
      await remove(r.id);
    }
  };

  const filtered = reminders.filter(r => filter === 'all' || r.status === filter);
  const pendingCount = reminders.filter(r => r.status === 'pending').length;
  const doneCount    = reminders.filter(r => r.status === 'done').length;

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-5 p-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white/85"
                style={{ fontFamily: "'Space Mono', monospace" }}>
              Reminders
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              {pendingCount} pending · {doneCount} completed
            </p>
          </div>
          {doneCount > 0 && (
            <button onClick={clearDone} className="btn-ghost text-xs py-1.5 px-3">
              Clear Done
            </button>
          )}
        </div>

        {/* ── Add New ──────────────────────────────────────────────────── */}
        <div className="card flex flex-col gap-3">
          <p className="text-[10px] text-white/30 uppercase tracking-widest"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            New Reminder
          </p>

          <textarea
            placeholder="What do you need to remember?"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), add())}
            rows={2}
            className="input-field resize-none"
          />

          <div className="flex gap-2 flex-wrap items-center">
            <input
              type="datetime-local"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              className="input-field flex-1 min-w-[160px]"
            />

            {/* Priority selector */}
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as Priority[]).map(p => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className="text-xs px-3 py-1.5 rounded-lg border capitalize transition-all"
                  style={{
                    background: newPriority === p ? `${PRIORITY_CONFIG[p].color}18` : 'transparent',
                    border: `1px solid ${newPriority === p ? PRIORITY_CONFIG[p].color + '50' : 'rgba(255,255,255,0.08)'}`,
                    color: newPriority === p ? PRIORITY_CONFIG[p].color : 'rgba(255,255,255,0.4)',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            <button onClick={add} className="btn-primary whitespace-nowrap">
              + Add
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ──────────────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['all', 'pending', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition-all"
              style={{
                background: filter === f ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: filter === f ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {f} {f === 'pending' ? `(${pendingCount})` : f === 'done' ? `(${doneCount})` : `(${reminders.length})`}
            </button>
          ))}
        </div>

        {/* ── List ─────────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3 animate-float">🔔</div>
            <p className="text-sm text-white/40 mb-1">No reminders here</p>
            <p className="text-xs text-white/20">Add one above to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map(reminder => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                onToggle={toggle}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}