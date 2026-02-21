import React, { useEffect, useState } from 'react';
import { Trash2, Play, Plus, Clock } from 'lucide-react';

interface Timer {
    id: number;
    label: string;
    duration_seconds: number;
    start_time: string;
    is_active: boolean;
}

const Timers: React.FC = () => {
    const [timers, setTimers] = useState<Timer[]>([]);
    const [duration, setDuration] = useState('');
    const [label, setLabel] = useState('Timer');

    const fetchTimers = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/timers');
            if (res.ok) {
                const data = await res.json();
                setTimers(data);
            }
        } catch (error) {
            console.error("Failed to fetch timers", error);
        }
    };

    useEffect(() => {
        fetchTimers();
        const interval = setInterval(fetchTimers, 2000); // Poll frequently for timers
        return () => clearInterval(interval);
    }, []);

    const addTimer = async (e: React.FormEvent) => {
        e.preventDefault();
        const secs = parseInt(duration);
        if (!secs) return;

        try {
            await fetch('http://127.0.0.1:8000/timers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label, duration_seconds: secs }),
            });
            setDuration('');
            fetchTimers();
        } catch (error) {
            console.error("Failed to add timer", error);
        }
    };

    const deleteTimer = async (id: number) => {
        try {
            await fetch(`http://127.0.0.1:8000/timers/${id}`, { method: 'DELETE' });
            fetchTimers();
        } catch (error) {
            console.error("Failed to delete timer", error);
        }
    };

    // Helper to calculate progress
    const getProgress = (timer: Timer) => {
        const start = new Date(timer.start_time).getTime();
        const now = new Date().getTime();
        const end = start + timer.duration_seconds * 1000;
        const left = end - now;

        if (left <= 0) return 0; // Done
        return (left / (timer.duration_seconds * 1000)) * 100;
    };

    const DisplayTime = ({ timer }: { timer: Timer }) => {
        const [_tick, setTick] = useState(0);
        useEffect(() => {
            const t = setInterval(() => setTick(n => n + 1), 1000);
            return () => clearInterval(t);
        }, []);

        const start = new Date(timer.start_time).getTime();
        const now = new Date().getTime();
        const end = start + timer.duration_seconds * 1000;
        let left = Math.floor((end - now) / 1000);
        if (left < 0) left = 0;

        const m = Math.floor(left / 60);
        const s = left % 60;

        return <span className="text-4xl font-mono">{m}:{s.toString().padStart(2, '0')}</span>
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <h2 className="text-3xl font-light mb-4 flex items-center gap-2">
                <Clock className="w-8 h-8 text-cyan-400" /> Timers
            </h2>

            <form onSubmit={addTimer} className="acrylic p-4 rounded-xl flex gap-4 items-center">
                <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Seconds..."
                    className="bg-transparent border-b border-gray-600 w-32 p-2 outline-none focus:border-cyan-400 transition-colors text-center"
                />
                <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="bg-transparent border-b border-gray-600 flex-1 p-2 outline-none focus:border-cyan-400"
                />
                <button type="submit" className="p-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-full transition-colors">
                    <Plus size={24} />
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2">
                {timers.map((timer) => (
                    <div key={timer.id} className="acrylic p-6 rounded-xl flex flex-col items-center justify-center relative group">
                        <h3 className="text-gray-400 mb-2">{timer.label}</h3>
                        <DisplayTime timer={timer} />
                        <button
                            onClick={() => deleteTimer(timer.id)}
                            className="absolute top-2 right-2 p-2 text-gray-600 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                        {/* Progress bar */}
                        <div className="absolute bottom-0 left-0 h-1 bg-cyan-400/30 w-full rounded-b-xl overflow-hidden">
                            <div
                                className="h-full bg-cyan-400 transition-all duration-1000 linear"
                                style={{ width: `${getProgress(timer)}%` }}
                            />
                        </div>
                    </div>
                ))}
                {timers.length === 0 && (
                    <p className="col-span-1 md:col-span-2 text-center text-gray-500 mt-10">No active timers.</p>
                )}
            </div>
        </div>
    );
};

export default Timers;
