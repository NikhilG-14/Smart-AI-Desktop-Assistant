import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Sun, Calendar, Clock, CheckCircle, Bell } from 'lucide-react';
import { SystemMonitor } from '../components/SystemMonitor';

export const Dashboard: React.FC = () => {
    const [greeting, setGreeting] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hrs = now.getHours();

            if (hrs < 12) setGreeting('Good Morning');
            else if (hrs < 18) setGreeting('Good Afternoon');
            else setGreeting('Good Evening');

            setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
            setTime(now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-gray-400 text-lg mb-1">{greeting}, User</h2>
                    <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        {time}
                    </h1>
                    <p className="text-gray-500 mt-1 font-mono">{date}</p>
                </div>

                <div className="flex gap-4">
                    {/* Weather Bubble Placeholder */}
                    <div className="acrylic px-6 py-3 rounded-2xl flex items-center gap-3">
                        <Sun className="text-yellow-400" size={24} />
                        <div>
                            <div className="text-xl font-bold">72°F</div>
                            <div className="text-xs text-gray-400">Clear Sky</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1">
                {/* Left Column - Quick Stats & Planner */}
                <div className="col-span-8 flex flex-col gap-6">
                    {/* Quick Access Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <ActionButton icon={Calendar} label="Planner" sub="3 Events" color="cyan" />
                        <ActionButton icon={CheckCircle} label="Tasks" sub="5 Pending" color="purple" />
                        <ActionButton icon={Bell} label="Alerts" sub="No unread" color="emerald" />
                    </div>

                    {/* Integrated System Monitor */}
                    <div className="grid grid-cols-2 gap-6 h-64">
                        <SystemMonitor />

                        {/* Placeholder for Home Automation / Scenes */}
                        <div className="acrylic rounded-xl p-4 flex flex-col gap-4">
                            <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase">Home Scenes</h3>
                            <div className="space-y-3">
                                <SceneButton label="Focus Mode" active={false} />
                                <SceneButton label="Relax Mode" active={true} />
                                <SceneButton label="Movie Night" active={false} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Intelligence Feed */}
                <div className="col-span-4 acrylic rounded-xl p-4 flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-2">Intelligence Feed</h3>

                    <FeedItem
                        icon={Cloud}
                        title="Weather Update"
                        desc="Rain expected around 4 PM. Don't forget an umbrella."
                        time="10m ago"
                    />
                    <FeedItem
                        icon={Calendar}
                        title="Meeting Reminder"
                        desc="Project review at 2:00 PM with the team."
                        time="1h ago"
                    />
                    <FeedItem
                        icon={CheckCircle}
                        title="Daily Focus"
                        desc="You have 5 tasks pending for today."
                        time="Now"
                    />
                </div>
            </div>
        </div>
    );
};

// Helper Components
const ActionButton = ({ icon: Icon, label, sub, color }: any) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="acrylic p-4 rounded-xl flex flex-col gap-2 items-start text-left hover:bg-white/5 transition-colors"
    >
        <div className={`p-2 rounded-lg bg-${color}-500/20 text-${color}-400`}>
            <Icon size={20} />
        </div>
        <div>
            <div className="font-bold text-lg">{label}</div>
            <div className="text-xs text-gray-400">{sub}</div>
        </div>
    </motion.button>
);

const SceneButton = ({ label, active }: { label: string, active: boolean }) => (
    <button className={`w-full p-3 rounded-lg flex justify-between items-center transition-all ${active ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-100' : 'bg-black/20 hover:bg-black/40 text-gray-400'
        }`}>
        <span className="font-medium">{label}</span>
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-cyan-400 shadow-[0_0_8px_currentColor]' : 'bg-gray-700'}`} />
    </button>
);

const FeedItem = ({ icon: Icon, title, desc, time }: any) => (
    <div className="flex gap-3 p-3 rounded-lg bg-black/20 hover:bg-black/30 transition-colors cursor-pointer">
        <div className="mt-1 text-gray-400">
            <Icon size={16} />
        </div>
        <div>
            <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-gray-200">{title}</span>
                <span className="text-[10px] text-gray-500">{time}</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mt-1">{desc}</p>
        </div>
    </div>
);
