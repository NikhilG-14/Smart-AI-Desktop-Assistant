import React, { useEffect, useState } from 'react';
import { Activity, Cpu, HardDrive } from 'lucide-react';

interface SystemStats {
    cpu: number;
    ram: {
        percent: number;
        used: number;
        total: number;
    };
}

const ProgressBar = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
    <div className="w-full space-y-1">
        <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono">
            <span>{label}</span>
            <span>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
                className={`h-full bg-${color}-500 shadow-[0_0_10px_currentColor] transition-all duration-500`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    </div>
);

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
    <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg flex items-center gap-3">
        <div className={`p-2 rounded-md bg-${color}-500/10`}>
            <Icon size={16} className={`text-${color}-400`} />
        </div>
        <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
            <div className={`text-lg font-mono font-bold text-${color}-400`}>{value}</div>
        </div>
    </div>
);

export const SystemMonitor: React.FC = () => {
    const [stats, setStats] = useState<SystemStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('http://127.0.0.1:8000/system/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Stats fetch error", e);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="p-4 text-gray-500 text-xs">Initializing System Monitor...</div>;

    return (
        <div className="flex-1 acrylic rounded-xl p-4 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                <Activity size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-gray-400 tracking-widest">SYSTEM STATUS</span>
            </div>

            <div className="space-y-4">
                <ProgressBar label="CPU Load" percentage={stats.cpu} color="cyan" />
                <ProgressBar label="Memory Usage" percentage={stats.ram.percent} color="purple" />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-auto">
                <StatCard
                    label="RAM Used"
                    value={`${stats.ram.used} GB`}
                    icon={HardDrive}
                    color="purple"
                />
                <StatCard
                    label="CPU Temp"
                    value="42°C"
                    icon={Cpu}
                    color="cyan"
                />
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-mono">SYSTEM OPTIMAL</span>
            </div>
        </div>
    );
};
