import { useState, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetricProps {
  label: string;
  value: number;
  unit: string;
  color: string;
  sublabel?: string;
}

// ─── Radial Progress ──────────────────────────────────────────────────────────

function RadialGauge({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="6"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, unit, color, sublabel }: MetricProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className="relative shrink-0">
        <RadialGauge value={value} color={color} />
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span
            className="text-sm font-bold text-white/90"
            style={{ fontFamily: "'Space Mono', monospace" }}
          >
            {value}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-0.5"
           style={{ fontFamily: "'Space Mono', monospace" }}>
          {label}
        </p>
        <p className="text-lg font-bold" style={{ color, fontFamily: "'Space Mono', monospace" }}>
          {value}
          <span className="text-xs font-normal text-white/40 ml-1">{unit}</span>
        </p>
        {sublabel && (
          <p className="text-[11px] text-white/30 mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const w = 120;
  const h = 36;
  const step = w / (data.length - 1);

  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(' ');

  const areaPoints = `0,${h} ${points} ${(data.length - 1) * step},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sg-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SystemMonitor() {
  const [cpu, setCpu]     = useState(34);
  const [mem, setMem]     = useState(61);
  const [disk, setDisk]   = useState(47);
  const [net, setNet]     = useState(12);

  const [cpuHist, setCpuHist]   = useState<number[]>([20, 30, 25, 40, 35, 34]);
  const [memHist, setMemHist]   = useState<number[]>([55, 58, 60, 59, 62, 61]);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (prev: number, range: number, base: number) =>
        Math.max(base, Math.min(base + range, prev + (Math.random() - 0.5) * 8));

      const nextCpu  = Math.round(next(cpu, 40, 10));
      const nextMem  = Math.round(next(mem, 20, 50));
      const nextDisk = Math.round(next(disk, 10, 40));
      const nextNet  = Math.round(next(net, 30, 5));

      setCpu(nextCpu);
      setMem(nextMem);
      setDisk(nextDisk);
      setNet(nextNet);

      setCpuHist(h => [...h.slice(-19), nextCpu]);
      setMemHist(h => [...h.slice(-19), nextMem]);
    }, 2000);

    return () => clearInterval(interval);
  }, [cpu, mem, disk, net]);

  const cpuColor  = cpu > 80 ? '#f87171' : cpu > 60 ? '#fb923c' : '#67e8f9';
  const memColor  = mem > 85 ? '#f87171' : mem > 70 ? '#fb923c' : '#a78bfa';

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between mb-1">
        <h3
          className="text-xs font-semibold text-white/40 uppercase tracking-widest"
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
          System Monitor
        </h3>
        <span className="badge badge-green flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Live
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="CPU"    value={cpu}  unit="%" color={cpuColor}  sublabel="8 cores · 3.4 GHz" />
        <MetricCard label="Memory" value={mem}  unit="%" color={memColor}  sublabel="16 GB DDR5" />
        <MetricCard label="Disk"   value={disk} unit="%" color="#34d399"   sublabel="512 GB NVMe" />
        <MetricCard label="Network" value={net} unit="%" color="#f59e0b"   sublabel="802.11ax Wi-Fi" />
      </div>

      {/* Sparklines */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="card">
          <p className="text-[10px] text-white/30 mb-2 uppercase tracking-widest"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            CPU History
          </p>
          <Sparkline data={cpuHist} color={cpuColor} />
        </div>
        <div className="card">
          <p className="text-[10px] text-white/30 mb-2 uppercase tracking-widest"
             style={{ fontFamily: "'Space Mono', monospace" }}>
            Memory History
          </p>
          <Sparkline data={memHist} color={memColor} />
        </div>
      </div>
    </div>
  );
}