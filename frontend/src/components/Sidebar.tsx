import React from 'react';
import { MessageSquare, Clock, Bell, Settings, LayoutDashboard } from 'lucide-react';

type Tab = 'dashboard' | 'chat' | 'timers' | 'reminders' | 'settings';

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
    const navItems: { id: Tab; icon: React.FC<any>; label: string }[] = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'chat', icon: MessageSquare, label: 'Chat' },
        { id: 'reminders', icon: Bell, label: 'Reminders' },
        { id: 'timers', icon: Clock, label: 'Timers' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-20 flex-shrink-0 h-full flex flex-col items-center py-6 space-y-6 acrylic rounded-2xl z-50">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`p-3 rounded-xl transition-all duration-300 group relative ${activeTab === item.id
                        ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-200'
                        }`}
                >
                    <item.icon className={`w-6 h-6 transition-transform duration-300 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />

                    {/* Tooltip */}
                    <span className="absolute left-full ml-4 px-2 py-1 bg-gray-900 border border-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                        {item.label}
                    </span>

                    {/* Active Indicator */}
                    {activeTab === item.id && (
                        <div className="absolute -left-1 top-3 bottom-3 w-1 bg-cyan-400 rounded-full shadow-[0_0_10px_currentColor]" />
                    )}
                </button>
            ))}
        </div>
    );
};

export default Sidebar;
