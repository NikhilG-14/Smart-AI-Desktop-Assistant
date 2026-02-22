import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, Mic, MicOff, Power, Activity, Cpu, Wifi, Video, VideoOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    speechSynthesis: SpeechSynthesis;
    electron?: {
        receive: (channel: string, func: (...args: any[]) => void) => void;
    };
}
declare let window: IWindow;

interface Message {
    id: string;
    type: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

// --- Helper Components ---
const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
    <div className="bg-gray-900/40 border border-gray-800/60 p-3 rounded-xl flex items-center gap-3 backdrop-blur-md">
        <div className={`p-2 rounded-lg bg-${color}-500/10`}>
            <Icon size={16} className={`text-${color}-400`} />
        </div>
        <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">{label}</div>
            <div className={`text-base font-mono font-bold text-${color}-300`}>{value}</div>
        </div>
    </div>
);

const ProgressBar = ({ label, percentage, color }: { label: string, percentage: number, color: string }) => (
    <div className="w-full space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-400 uppercase font-mono tracking-wide">
            <span>{label}</span>
            <span className={`text-${color}-400`}>{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800/80 rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className={`h-full bg-${color}-500 shadow-[0_0_12px_currentColor]`}
            />
        </div>
    </div>
);

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', type: 'bot', text: "Vanilla Artificial Neural Intelligence Network Initialized. How may I assist you today?", timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [cameraActive, setCameraActive] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const shouldListenRef = useRef(false);

    // --- Speech Recognition ---
    const {
        transcript,
        finalTranscript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) setInputValue(transcript);
    }, [transcript]);

    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) {
            alert("Voice input not supported in this browser.");
            return;
        }
        if (listening) {
            shouldListenRef.current = false;
            SpeechRecognition.stopListening();
        } else {
            shouldListenRef.current = true;
            SpeechRecognition.startListening({ continuous: true, language: 'en-IN' }); // en-IN often accepts mixed Hindi/English better than en-US, though true bilingual requires user-toggling or a specific engine. We'll use en-IN for better local accent/mix support.
        }
    };

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const speakMessage = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop any current speech
            const utterance = new SpeechSynthesisUtterance(text);

            // Try to find a good female English voice, or Hindi if text contains Devanagari
            const voices = window.speechSynthesis.getVoices();
            const isHindi = /[\u0900-\u097F]/.test(text); // Check for Devanagari Unicode range

            let preferredVoice;

            if (isHindi) {
                preferredVoice = voices.find(v =>
                    v.lang.includes('hi-IN') ||
                    v.name.includes('Hindi') ||
                    v.name.includes('Lekha') // Mac Hindi Voice
                );
            }

            if (!preferredVoice) {
                preferredVoice = voices.find(v =>
                    v.name.includes('Female') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Victoria') ||
                    v.name.includes('Karen') ||
                    v.name.includes('Moira') ||
                    v.name.includes('Tessa') ||
                    v.name.includes('Zira') ||
                    v.name.includes('Google UK English Female') ||
                    v.name.includes('Google US English') // usually female by default
                );
            }

            // Fallback to any en-US or en-GB voice if a specific female one isn't found
            if (!preferredVoice) {
                preferredVoice = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
            }

            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, type: 'user', text, timestamp: new Date() }]);
        setInputValue('');
        setIsThinking(true);

        try {
            const res = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });
            const data = await res.json();

            // If the backend ignored the message (e.g., wake word missing), silently drop it
            if (data.ignored) {
                setMessages(prev => prev.filter(m => m.id !== userMsgId));
                setIsThinking(false);
                return;
            }

            const botText = data.response || "No response received.";
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'bot', text: botText, timestamp: new Date() }]);
            speakMessage(botText);
        } catch (e) {
            const errorText = "ERR: Connection to V.A.N.I.N.I. backend failed.";
            setMessages(prev => [...prev, { id: Date.now().toString(), type: 'bot', text: errorText, timestamp: new Date() }]);
            speakMessage("Connection to backend failed.");
        } finally {
            setIsThinking(false);
        }
    };

    const handleInputSend = () => sendMessage(inputValue);

    // Voice triggers
    useEffect(() => {
        if (!listening || !transcript) return;
        const currentText = transcript.toLowerCase();
        const keywords = ['pause', 'unpause', 'resume', 'stop', 'play', 'next song', 'previous song'];
        const foundKeyword = keywords.find(k => currentText.includes(k));
        if (foundKeyword) {
            sendMessage(foundKeyword);
            resetTranscript();
        }
    }, [transcript, listening]);

    useEffect(() => {
        if (finalTranscript !== '') {
            sendMessage(finalTranscript.trim().toLowerCase());
            resetTranscript();
        }
    }, [finalTranscript]);

    useEffect(() => {
        if (!listening && shouldListenRef.current) {
            const restartTimer = setTimeout(() => {
                SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
            }, 100);
            return () => clearTimeout(restartTimer);
        }
    }, [listening]);

    useEffect(() => {
        if (window.electron) {
            window.electron.receive("activate-mic", () => {
                if (!shouldListenRef.current) {
                    shouldListenRef.current = true;
                    if (!listening) SpeechRecognition.startListening({ continuous: false, language: 'en-IN' });
                }
            });
        }
    }, []);

    return (
        <div className="flex h-full w-full bg-transparent text-white font-sans overflow-hidden gap-4 p-0">

            {/* --- LEFT SIDEBAR: STATUS & METRICS --- */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-5 h-full">
                {/* Header Profile / Core Indicator */}
                <div className="acrylic rounded-2xl p-6 relative overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-indigo-900/20" />
                    <h1 className="text-3xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 uppercase z-10 mb-6 drop-shadow-sm">V.A.N.I.N.I.</h1>

                    {/* The Animated Core (Scaled Down) */}
                    <div className="relative w-24 h-24 flex items-center justify-center z-10">
                        <div className={`absolute inset-0 rounded-full animate-[spin_8s_linear_infinite] border-2 transition-colors duration-1000 ${isThinking ? 'border-indigo-500/30 border-t-indigo-400 mt-1 ml-1' : 'border-cyan-500/20 border-t-cyan-400'}`} />
                        <motion.div
                            animate={{ scale: isThinking ? [1, 1.15, 1] : [1, 1.05, 1] }}
                            transition={{ duration: isThinking ? 0.8 : 3, repeat: Infinity, ease: "easeInOut" }}
                            className={`w-16 h-16 rounded-full bg-gradient-to-b backdrop-blur-xl border shadow-[0_0_30px_currentColor] flex items-center justify-center relative transition-colors duration-1000
                                ${isThinking ? 'from-indigo-500/30 to-purple-600/30 border-indigo-400/50 text-indigo-300' : 'from-cyan-500/20 to-blue-600/20 border-cyan-400/40 text-cyan-300'}`}
                        >
                            <Activity className={`w-6 h-6 animate-pulse ${isThinking ? 'text-indigo-300' : 'text-cyan-300'}`} />
                        </motion.div>
                    </div>

                    <div className={`mt-4 text-[10px] font-mono tracking-widest uppercase font-semibold px-3 py-1 rounded-full border ${isThinking ? 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10' : listening ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'}`}>
                        {isThinking ? 'Processing' : listening ? 'Listening' : 'Online'}
                    </div>
                </div>

                {/* Cam Feed */}
                <div className="h-48 acrylic rounded-2xl relative overflow-hidden group shadow-lg">
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-10 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_5px_#f43f5e]" />
                        <span className="text-[9px] uppercase font-mono tracking-widest text-rose-400">Cam</span>
                    </div>
                    {cameraActive ? (
                        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover opacity-60 mix-blend-screen" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700 bg-gray-900/50">
                            <VideoOff size={24} className="opacity-50" />
                        </div>
                    )}
                    <button
                        onClick={() => setCameraActive(!cameraActive)}
                        className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md text-gray-300 rounded-lg hover:bg-white/20 hover:text-white transition-all shadow-md"
                    >
                        {cameraActive ? <Video size={16} /> : <VideoOff size={16} />}
                    </button>
                </div>

                {/* System Metrics */}
                <div className="flex-1 acrylic rounded-2xl p-5 flex flex-col gap-5 shadow-lg overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 border-b border-gray-800/60 pb-3">
                        <Cpu size={16} className="text-cyan-400" />
                        <span className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">System Diagnostics</span>
                    </div>
                    <div className="space-y-5">
                        <ProgressBar label="CPU Core 0" percentage={42} color="cyan" />
                        <ProgressBar label="CPU Core 1" percentage={38} color="indigo" />
                        <ProgressBar label="Neural Engine" percentage={89} color="cyan" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <StatCard label="Network" value="2.4 G" icon={Wifi} color="cyan" />
                        <StatCard label="Temp" value="42°C" icon={Activity} color="rose" />
                    </div>
                </div>
            </div>

            {/* --- MAIN CENTER PANEL: CONVERSATION --- */}
            <div className="flex-1 min-w-0 flex flex-col acrylic rounded-3xl relative overflow-hidden h-full shadow-2xl border border-gray-800/50">
                {/* Header */}
                <div className="w-full py-4 px-6 border-b border-gray-800/50 bg-gray-900/30 backdrop-blur-sm flex justify-between items-center z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <MessageSquare className="text-cyan-400 w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-gray-200 tracking-wide">Secure Communication Channel</h2>
                            <div className="text-[10px] text-gray-500 font-mono mt-0.5 tracking-wider">ENCRYPTED // TYPE-R</div>
                        </div>
                    </div>
                    <button className="px-3 py-1.5 flex items-center gap-2 text-rose-400/70 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-[10px] font-bold tracking-widest border border-transparent hover:border-rose-500/30">
                        <Power size={12} />
                        TERMINATE
                    </button>
                </div>

                {/* Transcript Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className="flex items-end gap-2 max-w-[85%] w-fit">
                                    {msg.type === 'bot' && (
                                        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mb-1">
                                            <span className="text-[10px] font-bold text-cyan-300">V</span>
                                        </div>
                                    )}
                                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.type === 'user'
                                        ? 'bg-gradient-to-br from-cyan-600/20 to-indigo-600/20 border border-cyan-500/30 text-cyan-50 rounded-br-sm'
                                        : 'bg-gray-800/60 border border-gray-700/50 text-gray-200 rounded-bl-sm backdrop-blur-md'
                                        }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                    {msg.type === 'user' && (
                                        <div className="w-6 h-6 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 mb-1">
                                            <span className="text-[10px] font-bold text-gray-400">U</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] text-gray-500 mt-1.5 font-mono ${msg.type === 'user' ? 'mr-10 text-right' : 'ml-10 text-left'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isThinking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 max-w-[85%]">
                            <div className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 mb-1">
                                <span className="text-[10px] font-bold text-indigo-300">V</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-gray-800/40 border border-indigo-500/20 rounded-bl-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input Bar */}
                <div className="w-full bg-gradient-to-t from-black/60 to-transparent z-10 pb-6 px-6 pt-10 shrink-0">
                    <div className="flex items-center gap-3 bg-gray-900/90 border border-gray-700/80 rounded-[20px] p-2 pl-4 shadow-xl backdrop-blur-xl relative overflow-hidden group focus-within:border-cyan-500/50 transition-colors">
                        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transform scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left duration-500" />

                        <button
                            onClick={toggleListening}
                            className={`p-3 rounded-xl transition-all flex items-center justify-center ${listening
                                ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                                : 'bg-gray-800 text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-400'
                                }`}
                        >
                            {listening ? <Mic size={20} /> : <MicOff size={20} />}
                        </button>

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInputSend()}
                            placeholder={listening ? "Listening for command..." : "Type a message to V.A.N.I.N.I..."}
                            className={`flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-600 font-sans text-[15px] h-full px-2 ${listening ? 'italic text-cyan-100' : ''}`}
                        />

                        <button
                            onClick={handleInputSend}
                            disabled={!inputValue.trim()}
                            className={`p-3 rounded-xl transition-all flex items-center justify-center ${inputValue.trim()
                                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 hover:scale-105'
                                : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                                }`}
                        >
                            <Send size={18} className={inputValue.trim() ? 'ml-0.5' : ''} />
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
