import React, { useEffect, useState } from 'react';
import { Trash2, Plus, Bell } from 'lucide-react';

interface Reminder {
    id: number;
    message: string;
    due_time: string;
    is_completed: boolean;
}

const Reminders: React.FC = () => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [dueTime, setDueTime] = useState('');

    const fetchReminders = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/reminders');
            if (res.ok) {
                const data = await res.json();
                setReminders(data);
            }
        } catch (error) {
            console.error("Failed to fetch reminders", error);
        }
    };

    useEffect(() => {
        fetchReminders();
        const interval = setInterval(fetchReminders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const addReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage) return;

        // Use current time + 1 hour if not specified, or parsing inputs
        // For this simple UI, we'll just send the time.
        // If dueTime is empty, default to 15 mins later

        let targetTime = dueTime;
        if (!targetTime) {
            const now = new Date();
            now.setMinutes(now.getMinutes() + 15);
            targetTime = now.toISOString();
        } else {
            // Ensure ISO format
            targetTime = new Date(dueTime).toISOString();
        }

        try {
            await fetch('http://127.0.0.1:8000/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: newMessage, due_time: targetTime }),
            });
            setNewMessage('');
            setDueTime('');
            fetchReminders();
        } catch (error) {
            console.error("Failed to add reminder", error);
        }
    };

    const deleteReminder = async (id: number) => {
        try {
            await fetch(`http://127.0.0.1:8000/reminders/${id}`, { method: 'DELETE' });
            fetchReminders();
        } catch (error) {
            console.error("Failed to delete reminder", error);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6">
            <h2 className="text-3xl font-light mb-4 flex items-center gap-2">
                <Bell className="w-8 h-8 text-cyan-400" /> Reminders
            </h2>

            <form onSubmit={addReminder} className="acrylic p-4 rounded-xl flex gap-4 items-center">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="New task..."
                    className="bg-transparent border-b border-gray-600 flex-1 p-2 outline-none focus:border-cyan-400 transition-colors"
                />
                <input
                    type="datetime-local"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="bg-gray-800/50 border border-gray-600 rounded p-2 text-sm text-white focus:border-cyan-400 outline-none"
                />
                <button type="submit" className="p-2 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 rounded-full transition-colors">
                    <Plus size={24} />
                </button>
            </form>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {reminders.map((rem) => (
                    <div key={rem.id} className="acrylic p-4 rounded-xl flex items-center justify-between group hover:bg-white/5 transition-all">
                        <div>
                            <p className="text-lg">{rem.message}</p>
                            <p className="text-xs text-gray-400">Due: {new Date(rem.due_time).toLocaleString()}</p>
                        </div>
                        <button
                            onClick={() => deleteReminder(rem.id)}
                            className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
                {reminders.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">No active reminders.</p>
                )}
            </div>
        </div>
    );
};

export default Reminders;
