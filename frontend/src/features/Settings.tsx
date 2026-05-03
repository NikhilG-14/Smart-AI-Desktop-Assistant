import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  color?: string;
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, color = '#a3b18a' }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative shrink-0 w-10 h-5 rounded-full transition-all duration-300"
      style={{
        background: checked ? `${color}40` : 'rgba(255,255,255,0.08)',
        border: `1px solid ${checked ? color + '60' : 'rgba(255,255,255,0.1)'}`,
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
        style={{
          left: checked ? 'calc(100% - 18px)' : '2px',
          background: checked ? color : 'rgba(255,255,255,0.3)',
          boxShadow: checked ? `0 0 8px ${color}80` : 'none',
        }}
      />
    </button>
  );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-white/04 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/75" style={{ fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        {description && (
          <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <p
        className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1 pb-3 border-b border-white/05"
        style={{ fontFamily: "'Space Mono', monospace" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Settings() {
  // AI
  const [aiModel, setAiModel]         = useState('vani-model');
  const [streamResponse, setStream]   = useState(true);
  const [maxTokens, setMaxTokens]     = useState('2048');

  // Notifications
  const [timerAlerts, setTimerAlerts] = useState(true);
  const [reminderAlerts, setReminderAlerts] = useState(true);
  const [systemAlerts, setSystemAlerts]     = useState(false);
  const [soundEnabled, setSoundEnabled]     = useState(true);

  // Appearance
  const [accentColor, setAccentColor] = useState('#67e8f9');
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations]   = useState(true);

  // Performance
  const [autoStart, setAutoStart]     = useState(true);
  const [startMinimized, setStartMin] = useState(false);
  const [telemetry, setTelemetry]     = useState(false);

  // Vani Modes
  const [modes, setModes] = useState<any[]>([]);

  const fetchModes = useCallback(async () => {
    try {
      const r = await fetch('http://127.0.0.1:8000/modes');
      const data = await r.json();
      setModes(data);
    } catch (e) { console.error("Fetch modes failed", e); }
  }, []);

  useEffect(() => {
    fetchModes();
  }, [fetchModes]);

  const ACCENT_COLORS = ['#a3b18a', '#94a3b8', '#84a59d', '#f2cc8f', '#e07a5f', '#81b29a', '#3d405b'];

  const [saved, setSaved] = useState(false);
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
      <div className="flex flex-col gap-5 p-6 max-w-2xl">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold text-white/85"
                style={{ fontFamily: "'Space Mono', monospace" }}>
              Settings
            </h1>
            <p className="text-xs text-white/30 mt-0.5">Configure your AI assistant</p>
          </div>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
            style={saved ? { borderColor: '#34d39950', color: '#34d399', background: 'rgba(52,211,153,0.12)' } : {}}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>

        {/* ── AI Model ──────────────────────────────────────────────────── */}
        <Section title="AI Configuration">
          <SettingRow label="Model" description="The Vani model powering your assistant">
            <select
              value={aiModel}
              onChange={e => setAiModel(e.target.value)}
              className="input-field w-44"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <option value="vani-model">Vani (vani-model)</option>
              <option value="llama-3.2">Llama 3.2</option>
              <option value="multi-agent">Vani Multi-Agent</option>
            </select>
          </SettingRow>

          <SettingRow label="Stream Responses" description="Display AI responses as they're generated">
            <Toggle checked={streamResponse} onChange={setStream} />
          </SettingRow>

          <SettingRow label="Max Response Tokens" description="Maximum length of AI responses">
            <select
              value={maxTokens}
              onChange={e => setMaxTokens(e.target.value)}
              className="input-field w-32"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <option value="1024">1,024</option>
              <option value="2048">2,048</option>
              <option value="4096">4,096</option>
              <option value="8192">8,192</option>
            </select>
          </SettingRow>
        </Section>

        {/* ── Notifications ─────────────────────────────────────────────── */}
        <Section title="Notifications">
          <SettingRow label="Timer Alerts" description="Notify when timers complete">
            <Toggle checked={timerAlerts} onChange={setTimerAlerts} color="#a3b18a" />
          </SettingRow>
          <SettingRow label="Reminder Alerts" description="Desktop notifications for reminders">
            <Toggle checked={reminderAlerts} onChange={setReminderAlerts} color="#94a3b8" />
          </SettingRow>
          <SettingRow label="System Alerts" description="CPU/memory threshold warnings">
            <Toggle checked={systemAlerts} onChange={setSystemAlerts} color="#f2cc8f" />
          </SettingRow>
          <SettingRow label="Sound Effects" description="Play audio for alerts and events">
            <Toggle checked={soundEnabled} onChange={setSoundEnabled} color="#81b29a" />
          </SettingRow>
        </Section>

        {/* ── Vani Modes ────────────────────────────────────────────────── */}
        <Section title="Vani Modes (Shortcuts)">
          {modes.map(mode => (
            <div key={mode.key} className="py-4 border-b border-white/05 last:border-0 group">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/05 flex items-center justify-center text-lg border border-white/05 group-hover:border-white/10 transition-colors">
                    {mode.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{mode.name}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">{mode.key.replace('_', ' ')}</p>
                  </div>
                </div>
                <button 
                  className="px-2.5 py-1 rounded-md bg-white/05 text-[10px] text-white/50 hover:bg-white/10 hover:text-white/80 transition-all border border-white/05"
                  onClick={() => alert("Detailed mode editing coming in next minor update! Currently read-only.")}
                >
                  Configure
                </button>
              </div>
              
              <div className="bg-black/20 rounded-xl p-3 border border-white/03">
                <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest mb-2">Automated Actions</p>
                <div className="space-y-1.5">
                  {mode.actions.map((action: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/40" />
                      <span className="font-medium text-white/60 capitalize">{action.agent}</span>
                      <span className="text-white/20">→</span>
                      <span className="truncate">{action.intent}</span>
                      <span className="text-white/20 ml-auto">{Object.values(action.slots)[0] || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </Section>

        {/* ── Appearance ────────────────────────────────────────────────── */}
        <Section title="Appearance">
          <SettingRow label="Accent Color" description="Primary highlight color throughout the UI">
            <div className="flex gap-1.5 items-center">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className="w-5 h-5 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c,
                    outline: accentColor === c ? `2px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    opacity: accentColor === c ? 1 : 0.4,
                  }}
                />
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Compact Mode" description="Reduce padding and spacing throughout">
            <Toggle checked={compactMode} onChange={setCompactMode} />
          </SettingRow>

          <SettingRow label="Animations" description="Enable motion effects and transitions">
            <Toggle checked={animations} onChange={setAnimations} />
          </SettingRow>
        </Section>

        {/* ── App Behavior ──────────────────────────────────────────────── */}
        <Section title="Application">
          <SettingRow label="Launch at Login" description="Start VANINI when your computer boots">
            <Toggle checked={autoStart} onChange={setAutoStart} />
          </SettingRow>
          <SettingRow label="Start Minimized" description="Launch in the system tray">
            <Toggle checked={startMinimized} onChange={setStartMin} />
          </SettingRow>
          <SettingRow label="Send Usage Data" description="Help improve VANINI with anonymous analytics">
            <Toggle checked={telemetry} onChange={setTelemetry} color="#f87171" />
          </SettingRow>
        </Section>

        {/* ── About ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div>
            <p className="text-sm font-semibold text-white/60" style={{ fontFamily: "'Space Mono', monospace" }}>
              VANINI Desktop
            </p>
            <p className="text-xs text-white/25 mt-0.5">
              Built with Electron · React · TypeScript · Tailwind
            </p>
          </div>
          <div className="flex gap-2">
            <span className="badge badge-cyan">Up to date</span>
          </div>
        </div>
      </div>
    </div>
  );
}