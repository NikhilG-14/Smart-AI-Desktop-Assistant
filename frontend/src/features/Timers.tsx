import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

interface Timer {
  id: string;
  label: string;
  totalSeconds: number;
  remainingSeconds: number;
  status: TimerStatus;
  color: string;
}

// ─── Preset Templates ─────────────────────────────────────────────────────────

const PRESETS = [
  { label: 'Pomodoro',     minutes: 25, color: '#67e8f9' },
  { label: 'Short Break',  minutes: 5,  color: '#34d399' },
  { label: 'Long Break',   minutes: 15, color: '#a78bfa' },
  { label: 'Deep Focus',   minutes: 50, color: '#f59e0b' },
  { label: 'Quick Task',   minutes: 10, color: '#fb923c' },
  { label: 'Custom',       minutes: 0,  color: '#f87171' },
];

const COLORS = ['#67e8f9', '#a78bfa', '#34d399', '#f59e0b', '#fb923c', '#f87171'];

// ─── Format ───────────────────────────────────────────────────────────────────

function fmt(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularTimer({
  total,
  remaining,
  color,
  status,
}: {
  total: number;
  remaining: number;
  color: string;
  status: TimerStatus;
}) {
  const size = 100;
  const r    = 42;
  const circ = 2 * Math.PI * r;
  const progress = total > 0 ? remaining / total : 0;
  const offset   = circ * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear', opacity: status === 'done' ? 0.4 : 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span
          className="text-lg font-bold text-white/90"
          style={{ fontFamily: "'Space Mono', monospace", color }}
        >
          {fmt(remaining)}
        </span>
      </div>
    </div>
  );
}

// ─── Timer Card ───────────────────────────────────────────────────────────────

function TimerCard({
  timer,
  onToggle,
  onReset,
  onDelete,
}: {
  timer: Timer;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const progress = timer.totalSeconds > 0 ? timer.remainingSeconds / timer.totalSeconds : 0;

  return (
    <div
      className="card relative overflow-hidden flex flex-col gap-3"
      style={{ borderColor: timer.status === 'running' ? `${timer.color}30` : undefined }}
    >
      {/* Running pulse glow */}
      {timer.status === 'running' && (
        <div
          className="absolute inset-0 rounded-[14px] opacity-10 pointer-events-none"
          style={{ background: timer.color, animation: 'pulse-ring 2s ease-in-out infinite' }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-white/70">{timer.label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="badge text-[9px]"
              style={{
                background: `${timer.color}18`,
                border: `1px solid ${timer.color}35`,
                color: timer.color,
              }}
            >
              {timer.status.toUpperCase()}
            </span>
          </div>
        </div>

        <button
          onClick={() => onDelete(timer.id)}
          className="w-6 h-6 rounded-lg flex items-center justify-center
                     text-white/20 hover:text-white/60 hover:bg-white/05 transition-all"
        >
          ✕
        </button>
      </div>

      {/* Circular */}
      <div className="flex items-center justify-center py-1">
        <CircularTimer
          total={timer.totalSeconds}
          remaining={timer.remainingSeconds}
          color={timer.color}
          status={timer.status}
        />
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-white/05 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(1 - progress) * 100}%`, background: timer.color, opacity: 0.7 }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => onToggle(timer.id)}
          disabled={timer.status === 'done'}
          className="flex-1 btn-primary text-xs py-2 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            borderColor: `${timer.color}50`,
            color: timer.color,
            background: `${timer.color}15`,
          }}
        >
          {timer.status === 'running' ? '⏸ Pause' : timer.status === 'done' ? '✓ Done' : '▶ Start'}
        </button>
        <button onClick={() => onReset(timer.id)} className="btn-ghost text-xs py-2 px-3">
          ↺
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Timers() {
  const [timers, setTimers]         = useState<Timer[]>([]);
  const [customMins, setCustomMins] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const intervalRef = useRef<number | null>(null);

  // Tick all running timers every second
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      setTimers(prev => prev.map(t => {
        if (t.status !== 'running') return t;
        const next = t.remainingSeconds - 1;
        return next <= 0
          ? { ...t, remainingSeconds: 0, status: 'done' }
          : { ...t, remainingSeconds: next };
      }));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const addPreset = useCallback((preset: typeof PRESETS[0]) => {
    if (preset.minutes === 0) return; // custom — handled separately
    const secs = preset.minutes * 60;
    setTimers(prev => [...prev, {
      id: crypto.randomUUID(),
      label: preset.label,
      totalSeconds: secs,
      remainingSeconds: secs,
      status: 'idle',
      color: preset.color,
    }]);
  }, []);

  const addCustom = useCallback(() => {
    const mins = parseInt(customMins);
    if (!mins || mins <= 0) return;
    const secs = mins * 60;
    setTimers(prev => [...prev, {
      id: crypto.randomUUID(),
      label: customLabel.trim() || `${mins}m Timer`,
      totalSeconds: secs,
      remainingSeconds: secs,
      status: 'idle',
      color: selectedColor,
    }]);
    setCustomMins('');
    setCustomLabel('');
  }, [customMins, customLabel, selectedColor]);

  const toggle = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id !== id ? t : {
        ...t,
        status: t.status === 'running' ? 'paused' : 'running',
      }
    ));
  }, []);

  const reset = useCallback((id: string) => {
    setTimers(prev => prev.map(t =>
      t.id !== id ? t : { ...t, remainingSeconds: t.totalSeconds, status: 'idle' }
    ));
  }, []);

  const remove = useCallback((id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  }, []);

  const runningCount = timers.filter(t => t.status === 'running').length;

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-5 p-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white/85"
                style={{ fontFamily: "'Space Mono', monospace" }}>
              Timers
            </h1>
            <p className="text-xs text-white/30 mt-0.5">
              {runningCount > 0 ? `${runningCount} timer${runningCount > 1 ? 's' : ''} running` : 'No active timers'}
            </p>
          </div>
          {timers.length > 0 && (
            <span className="badge badge-cyan">{timers.length} total</span>
          )}
        </div>

        {/* ── Presets ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Quick Add
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter(p => p.minutes > 0).map(preset => (
              <button
                key={preset.label}
                onClick={() => addPreset(preset)}
                className="text-xs px-3 py-1.5 rounded-lg border transition-all duration-200
                           hover:scale-105 active:scale-95"
                style={{
                  background: `${preset.color}12`,
                  border: `1px solid ${preset.color}30`,
                  color: preset.color,
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500,
                }}
              >
                {preset.label} · {preset.minutes}m
              </button>
            ))}
          </div>
        </div>

        {/* ── Custom Timer ─────────────────────────────────────────────── */}
        <div className="card">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-3"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Custom Timer
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Label (optional)"
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              className="input-field flex-1 min-w-[120px]"
            />
            <input
              type="number"
              placeholder="Minutes"
              value={customMins}
              onChange={e => setCustomMins(e.target.value)}
              min="1"
              className="input-field w-28"
            />
            <div className="flex gap-1.5 items-center">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className="w-5 h-5 rounded-full transition-all"
                  style={{
                    background: c,
                    outline: selectedColor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    opacity: selectedColor === c ? 1 : 0.45,
                  }}
                />
              ))}
            </div>
            <button onClick={addCustom} className="btn-primary whitespace-nowrap">
              + Add Timer
            </button>
          </div>
        </div>

        {/* ── Timer Grid ───────────────────────────────────────────────── */}
        {timers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3 animate-float">⏱</div>
            <p className="text-sm text-white/40 mb-1">No timers yet</p>
            <p className="text-xs text-white/20">Add a preset or create a custom timer above</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {timers.map(timer => (
              <TimerCard
                key={timer.id}
                timer={timer}
                onToggle={toggle}
                onReset={reset}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}