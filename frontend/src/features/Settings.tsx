import React from 'react';
import { Bell, Moon, Volume2, Shield, User } from 'lucide-react';

export const Settings: React.FC = () => {
    return (
        <div className="w-full h-full overflow-y-auto">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Settings</h1>

            <div className="space-y-6 max-w-2xl">
                {/* Profile */}
                <div className="acrylic p-6 rounded-xl flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
                        U
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">User Profile</h2>
                        <p className="text-gray-400 text-sm">Manage your personal information</p>
                    </div>
                    <button className="ml-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm">Edit</button>
                </div>

                {/* Settings Groups */}
                <div className="grid grid-cols-1 gap-4">
                    <SettingItem icon={Volume2} title="Voice & Sound" desc="Output volume, input sensitivity" />
                    <SettingItem icon={Moon} title="Appearance" desc="Theme, acrylic effects, scaling" />
                    <SettingItem icon={Bell} title="Notifications" desc="Do not disturb, priority alerts" />
                    <SettingItem icon={Shield} title="Privacy & Security" desc="Data retention, model permissions" />
                </div>

                <div className="mt-8 pt-8 border-t border-gray-800 text-center">
                    <p className="text-xs text-gray-600">A.D.A Version 2.0.0 (Alpha)</p>
                    <p className="text-xs text-gray-700 mt-1">System ID: 8X-9920-DELTA</p>
                </div>
            </div>
        </div>
    );
};

const SettingItem = ({ icon: Icon, title, desc }: any) => (
    <div className="acrylic p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-white/5 transition">
        <div className="p-3 rounded-lg bg-gray-800 text-cyan-400">
            <Icon size={20} />
        </div>
        <div>
            <h3 className="font-bold">{title}</h3>
            <p className="text-gray-400 text-xs">{desc}</p>
        </div>
        <div className="ml-auto text-gray-600">
            →
        </div>
    </div>
);
