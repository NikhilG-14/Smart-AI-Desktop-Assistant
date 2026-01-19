import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Power, Activity, Cpu, Wifi, Video, VideoOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Types ---
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

interface Message {
    id: string;
    type: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

// --- Helper Components ---
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

const ProgressBar = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
    <div className="w-full space-y-1">
        <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono">
            <span>{label}</span>
            <span>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className={`h-full bg-${color}-500 shadow-[0_0_10px_currentColor]`}
            />
        </div>
    </div>
);

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', type: 'bot', text: "Core Systems Initialized. Waiting for input.", timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [cameraActive, setCameraActive] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Speech Recognition ---
    useEffect(() => {
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const Recognition = SpeechRecognition || webkitSpeechRecognition;

        if (Recognition) {
            const recognition = new Recognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInputValue(transcript);
                handleSendMessage(transcript);
            };
            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListening = () => {
        if (recognitionRef.current) {
            isListening ? recognitionRef.current.stop() : recognitionRef.current.start();
        }
    };

    // --- Camera Access ---
    useEffect(() => {
        if (cameraActive && navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) videoRef.current.srcObject = stream;
                })
                .catch(err => console.error("Camera access denied:", err));
        } else if (videoRef.current) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    }, [cameraActive]);

    // --- Messaging ---
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (text: string = inputValue) => {
        if (!text.trim()) return;

        // Optimistic UI
        setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text, timestamp: new Date() }]);
        setInputValue('');

        try {
            const res = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'bot', text: data.response, timestamp: new Date() }]);
        } catch (e) {
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'bot', text: "ERR: Backend Offline", timestamp: new Date() }]);
        }
    };

    return (
        <div className="flex h-screen w-screen bg-black text-white font-sans overflow-hidden p-2 gap-2">

            {/* --- LEFT PANEL: STATUS & CAM --- */}
            <div className="w-1/4 flex flex-col gap-2">

                {/* Cam Feed */}
                <div className="h-1/3 bg-gray-900/40 border border-gray-800 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase font-mono tracking-widest text-red-500">Video Input</span>
                    </div>
                    {cameraActive ? (
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">
                            <VideoOff size={32} />
                        </div>
                    )}
                    <button
                        onClick={() => setCameraActive(!cameraActive)}
                        className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white rounded hover:bg-white/20 transition-colors"
                    >
                        {cameraActive ? <Video size={14} /> : <VideoOff size={14} />}
                    </button>
                </div>

                {/* System Metrics */}
                <div className="flex-1 bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex flex-col gap-6">
                    <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                        <Activity size={16} className="text-cyan-400" />
                        <span className="text-xs font-bold text-gray-400 tracking-widest">SYSTEM METRICS</span>
                    </div>

                    <div className="space-y-4">
                        <ProgressBar label="CPU Core 0" percentage={42} color="cyan" />
                        <ProgressBar label="CPU Core 1" percentage={38} color="cyan" />
                        <ProgressBar label="Memory Usage" percentage={65} color="purple" />
                        <ProgressBar label="Neural Engine" percentage={89} color="emerald" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <StatCard label="Network" value="2.4 Gbps" icon={Wifi} color="cyan" />
                        <StatCard label="Temp" value="42°C" icon={Cpu} color="red" />
                    </div>
                </div>
            </div>

            {/* --- CENTER PANEL: THE CORE --- */}
            <div className="flex-1 flex flex-col bg-gray-900/20 border border-gray-800/50 rounded-xl relative overflow-hidden">
                {/* Header */}
                <div className="absolute top-0 w-full p-4 flex justify-between items-start z-10">
                    <div>
                        <h1 className="text-2xl font-black tracking-[0.2em] text-cyan-500 uppercase">J.A.R.V.I.S.</h1>
                        <div className="text-[10px] text-gray-500 font-mono mt-1">ADVANCED SYSTEMS TYPE-R</div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-400">STATUS</span>
                            <span className="text-xs font-bold text-emerald-400">ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* The Animated Sphere */}
                <div className="flex-1 flex items-center justify-center relative">
                    {/* Outer Rings */}
                    <div className="absolute w-[500px] h-[500px] border border-cyan-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute w-[400px] h-[400px] border border-cyan-400/20 rounded-full animate-[spin_15s_linear_infinite_reverse] border-t-transparent border-l-transparent" />

                    {/* The Core */}
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-64 h-64 rounded-full bg-gradient-to-b from-cyan-500/20 to-blue-600/20 backdrop-blur-xl border border-cyan-400/30 shadow-[0_0_50px_rgba(34,211,238,0.2)] flex items-center justify-center relative"
                    >
                        <div className="w-48 h-48 rounded-full bg-black/80 flex items-center justify-center border border-cyan-500/30">
                            <div className="text-center space-y-1">
                                <Activity className="w-8 h-8 text-cyan-400 mx-auto animate-bounce" />
                                <div className="text-[10px] text-cyan-600 font-mono animate-pulse">LISTENING</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Bar: Input */}
                <div className="p-6 w-full max-w-2xl mx-auto mb-10 z-10">
                    <div className="flex items-center gap-3 bg-black/60 border border-gray-700/50 rounded-full p-2 px-4 shadow-xl backdrop-blur-md">
                        <button
                            onClick={toggleListening}
                            className={`p-2 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-cyan-500/10 text-cyan-400'}`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Initiate Command Protocol..."
                            className="flex-1 bg-transparent border-none outline-none text-cyan-100 placeholder-cyan-900/50 font-mono text-sm h-full"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            className="text-cyan-400 hover:text-cyan-200 transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- RIGHT PANEL: TRANSCRIPT --- */}
            <div className="w-1/4 bg-gray-900/40 border border-gray-800 rounded-xl flex flex-col overflow-hidden">
                <div className="p-3 border-b border-gray-800 bg-gray-900/50">
                    <h3 className="text-xs font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        Transcript
                    </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[90%] p-3 rounded-lg border ${msg.type === 'user'
                                    ? 'bg-cyan-950/30 border-cyan-800/50 text-cyan-100'
                                    : 'bg-gray-800/50 border-gray-700 text-gray-300'
                                }`}>
                                <p className="leading-relaxed">{msg.text}</p>
                            </div>
                            <span className="text-[10px] text-gray-600 mt-1">{msg.timestamp.toLocaleTimeString()}</span>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="p-2 border-t border-gray-800 bg-black/20">
                    <button className="w-full py-2 flex items-center justify-center gap-2 text-red-900/50 hover:text-red-500 hover:bg-red-950/10 rounded transition-colors text-xs font-bold tracking-widest border border-red-900/20 hover:border-red-500/50">
                        <Power size={14} />
                        TERMINATE
                    </button>
                </div>
            </div>

        </div>
    );
}
