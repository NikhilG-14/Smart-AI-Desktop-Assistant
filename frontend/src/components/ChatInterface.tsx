import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, Mic, MicOff, Power, Activity, Cpu, Wifi, Video, VideoOff, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
    speechSynthesis: SpeechSynthesis;
    electron?: { receive: (channel: string, func: (...args: any[]) => void) => void; };
}
declare let window: IWindow;

interface Message {
    id: string;
    type: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

// ── Corner brackets ──────────────────────────────────────────────────────────
const Brackets = ({ c = '#22d3ee' }: { c?: string }) => (
    <>
        {[['top-0 left-0', 'M0 6 L0 0 L6 0'], ['top-0 right-0', 'M10 6 L10 0 L4 0'],
          ['bottom-0 left-0', 'M0 4 L0 10 L6 10'], ['bottom-0 right-0', 'M10 4 L10 10 L4 10']
        ].map(([pos, d]) => (
            <svg key={pos} className={`absolute ${pos} w-3 h-3 z-10`} viewBox="0 0 10 10" fill="none">
                <path d={d} stroke={c} strokeWidth="1.2" strokeOpacity="0.5" />
            </svg>
        ))}
    </>
);

// ── Thin progress bar ────────────────────────────────────────────────────────
const Bar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
    <div className="space-y-1">
        <div className="flex justify-between">
            <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: 9, color, fontFamily: 'monospace', fontWeight: 700 }}>{pct}%</span>
        </div>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: color, boxShadow: `0 0 6px ${color}`, borderRadius: 2 }} />
        </div>
    </div>
);

// ── Panel wrapper ────────────────────────────────────────────────────────────
const Panel = ({ children, className = '', style = {}, accent = '#22d3ee' }:
    { children: React.ReactNode; className?: string; style?: React.CSSProperties; accent?: string }) => (
    <div className={`relative overflow-hidden rounded-xl ${className}`} style={{
        background: 'linear-gradient(160deg,rgba(13,20,38,0.97),rgba(6,10,22,0.99))',
        border: `1px solid ${accent}18`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.02)`,
        ...style
    }}>
        <Brackets c={accent} />
        {children}
    </div>
);

// ════════════════════════════════════════════════════════════════════════════
export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', type: 'bot', text: 'Vanilla Artificial Neural Intelligence Network Initialized. How may I assist you today?', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [cameraActive, setCameraActive] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const shouldListenRef = useRef(false);

    const { transcript, finalTranscript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

    useEffect(() => { if (transcript) setInputValue(transcript); }, [transcript]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const toggleListening = () => {
        if (!browserSupportsSpeechRecognition) { alert('Voice input not supported.'); return; }
        if (listening) { shouldListenRef.current = false; SpeechRecognition.stopListening(); }
        else { shouldListenRef.current = true; SpeechRecognition.startListening({ continuous: true, language: 'en-IN' }); }
    };

    const speakMessage = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const isHindi = /[\u0900-\u097F]/.test(text);
        let v = isHindi ? voices.find(v => v.lang.includes('hi-IN') || v.name.includes('Hindi')) : undefined;
        if (!v) v = voices.find(v => ['Samantha','Victoria','Karen','Moira','Tessa','Zira','Google UK English Female','Google US English'].some(n => v.name.includes(n)));
        if (!v) v = voices.find(v => v.lang.includes('en-US') || v.lang.includes('en-GB'));
        if (v) u.voice = v;
        u.rate = 1; u.pitch = 1;
        window.speechSynthesis.speak(u);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim()) return;
        const uid = Date.now().toString();
        setMessages(p => [...p, { id: uid, type: 'user', text, timestamp: new Date() }]);
        setInputValue('');
        setIsThinking(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text }) });
            const data = await res.json();
            if (data.ignored) { setMessages(p => p.filter(m => m.id !== uid)); setIsThinking(false); return; }
            const botText = data.response || 'No response received.';
            setMessages(p => [...p, { id: Date.now().toString(), type: 'bot', text: botText, timestamp: new Date() }]);
            speakMessage(botText);
        } catch {
            setMessages(p => [...p, { id: Date.now().toString(), type: 'bot', text: 'ERR: Connection to V.A.N.I.N.I. backend failed.', timestamp: new Date() }]);
        } finally { setIsThinking(false); }
    };

    useEffect(() => {
        if (!listening || !transcript) return;
        const kw = ['pause','unpause','resume','stop','play','next song','previous song'].find(k => transcript.toLowerCase().includes(k));
        if (kw) { sendMessage(kw); resetTranscript(); }
    }, [transcript, listening]);

    useEffect(() => {
        if (finalTranscript) { sendMessage(finalTranscript.trim().toLowerCase()); resetTranscript(); }
    }, [finalTranscript]);

    useEffect(() => {
        if (!listening && shouldListenRef.current) {
            const t = setTimeout(() => SpeechRecognition.startListening({ continuous: true, language: 'en-IN' }), 100);
            return () => clearTimeout(t);
        }
    }, [listening]);

    useEffect(() => {
        window.electron?.receive('activate-mic', () => {
            if (!shouldListenRef.current) { shouldListenRef.current = true; if (!listening) SpeechRecognition.startListening({ continuous: false, language: 'en-IN' }); }
        });
    }, []);

    // Reactive accent color
    const accent = isThinking ? '#818cf8' : listening ? '#fb7185' : '#22d3ee';

    return (
        /*
         * KEY LAYOUT FIX:
         * - h-full + min-h-0 = fills parent without overflowing it
         * - overflow-hidden on root = nothing escapes the box
         * - sidebar uses flex-col with overflow-hidden, panels use fixed heights that add up correctly
         */
        <div className="h-full w-full flex gap-3 p-3 overflow-hidden" style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }}>

            {/* ══ SIDEBAR ═══════════════════════════════════════════════ */}
            {/*
             * CRITICAL: sidebar must NOT overflow.
             * We use flex-col with NO scroll — every child has a fixed/controlled size.
             * Heights: core=210px, cam=120px, diag=auto, gaps=3×12=36 → total ~366px + diag
             * This fits within typical screen heights (768px+).
             */}
            <div className="w-[240px] flex-shrink-0 flex flex-col gap-2.5 h-full overflow-hidden">

                {/* Core Identity — fixed height */}
                <Panel accent={accent} className="h-48 flex-shrink-0 p-4 flex flex-col items-center justify-between">
                    {/* Top label row */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 8, color: '#334155', letterSpacing: '0.3em', textTransform: 'uppercase' }}>SYS-CORE</span>
                        <span style={{ fontSize: 7, color: accent, background: `${accent}12`, border: `1px solid ${accent}25`, padding: '2px 6px', borderRadius: 3, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                            {isThinking ? 'PROC' : listening ? 'LISTEN' : 'READY'}
                        </span>
                    </div>

                    {/* Orb — compact 80px */}
                    <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Hex */}
                        <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }}>
                            <polygon points="50,4 93,27 93,73 50,96 7,73 7,27" fill="none" stroke={accent} strokeWidth="1" />
                        </svg>
                        {/* Spin ring */}
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
                            style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: `1px solid ${accent}18`, borderTopColor: `${accent}80` }} />
                        {/* Core */}
                        <motion.div
                            animate={{ scale: isThinking ? [1, 1.2, 1] : [1, 1.07, 1] }}
                            transition={{ duration: isThinking ? 0.65 : 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                                width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `radial-gradient(circle at 40% 35%, ${accent}28, transparent 70%)`,
                                border: `1px solid ${accent}45`,
                                boxShadow: `0 0 18px ${accent}22`,
                                zIndex: 2
                            }}>
                            <Activity size={14} color={accent} />
                        </motion.div>
                    </div>

                    {/* Wordmark */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase', color: accent, textShadow: `0 0 20px ${accent}50` }}>
                            V.A.N.I.N.I.
                        </div>
                        <div style={{ fontSize: 7, color: '#1e293b', letterSpacing: '0.2em', marginTop: 3 }}>NEURAL INTERFACE v2.1</div>
                    </div>
                </Panel>

                {/* Camera Feed — fixed height */}
                <Panel accent="#fb718840" className="h-32 flex-shrink-0 relative">
                    {/* REC badge */}
                    <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.3, repeat: Infinity }}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb7185', boxShadow: '0 0 5px #fb7185' }} />
                        <span style={{ fontSize: 7, color: '#fb718870', letterSpacing: '0.2em', textTransform: 'uppercase' }}>REC</span>
                    </div>
                    {/* Toggle button */}
                    <button onClick={() => setCameraActive(p => !p)}
                        style={{ position: 'absolute', top: 7, right: 8, zIndex: 10, background: 'rgba(0,0,0,0.45)', border: 'none', color: '#475569', cursor: 'pointer', borderRadius: 4, padding: 3, display: 'flex' }}>
                        {cameraActive ? <Video size={11} /> : <VideoOff size={11} />}
                    </button>
                    {/* Feed */}
                    {cameraActive
                        ? <video ref={videoRef} autoPlay muted style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65, filter: 'saturate(0.3) brightness(0.75)' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                            <VideoOff size={16} color="#1e293b" />
                            <span style={{ fontSize: 7, color: '#1e293b', letterSpacing: '0.2em' }}>FEED OFFLINE</span>
                          </div>
                    }
                    {/* HUD overlay */}
                    <div style={{ position: 'absolute', bottom: 6, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>
                        <span style={{ fontSize: 7, color: '#22d3ee28', fontFamily: 'monospace' }}>CAM-01</span>
                        <span style={{ fontSize: 7, color: '#22d3ee28', fontFamily: 'monospace' }}>LIVE</span>
                    </div>
                </Panel>

                {/* Diagnostics — flex-1 takes remaining space, never overflows */}
                <Panel accent="#22d3ee" className="flex-1 min-h-0 p-3 flex flex-col gap-2.5">
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Cpu size={10} color="#22d3ee" />
                            <span style={{ fontSize: 7, color: '#334155', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Diagnostics</span>
                        </div>
                        <span style={{ fontSize: 7, color: '#22d3ee', background: '#22d3ee10', border: '1px solid #22d3ee22', padding: '2px 6px', borderRadius: 3, letterSpacing: '0.25em' }}>LIVE</span>
                    </div>

                    {/* Bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                        <Bar label="CPU Core 0" pct={42} color="#22d3ee" />
                        <Bar label="CPU Core 1" pct={38} color="#818cf8" />
                        <Bar label="Neural Eng." pct={89} color="#22d3ee" />
                    </div>

                    {/* Stats grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgba(34,211,238,0.07)', flexShrink: 0 }}>
                        {[
                            { icon: <Wifi size={9} color="#22d3ee" />, label: 'Net', value: '2.4G', color: '#22d3ee' },
                            { icon: <Activity size={9} color="#fb7185" />, label: 'Temp', value: '42°C', color: '#fb7185' },
                        ].map(({ icon, label, value, color }) => (
                            <div key={label}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                                    {icon}
                                    <span style={{ fontSize: 7, color: '#334155', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</span>
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 700, color, textShadow: `0 0 10px ${color}45` }}>{value}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>

            {/* ══ CHAT PANEL ════════════════════════════════════════════ */}
            {/*
             * flex:1 + minHeight:0 = takes all remaining space.
             * flex-col inside with overflow-hidden — only the messages div scrolls.
             */}
            <Panel accent={accent} className="flex-1 min-w-0 min-h-0 flex flex-col">

                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg,transparent,${accent}30,transparent)`, pointerEvents: 'none' }} />

                {/* Header */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}0d`, border: `1px solid ${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MessageSquare size={13} color={accent} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.08em' }}>Secure Communication Channel</div>
                            <div style={{ fontSize: 7, color: '#1e293b', letterSpacing: '0.2em', marginTop: 2 }}>ENCRYPTED // TYPE-R // AES-256</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                                style={{ width: 5, height: 5, borderRadius: '50%', background: accent, boxShadow: `0 0 5px ${accent}` }} />
                            <span style={{ fontSize: 7, color: `${accent}70`, letterSpacing: '0.2em' }}>ONLINE</span>
                        </div>
                        <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 5, fontSize: 7, color: '#fb718860', border: '1px solid rgba(251,113,133,0.12)', background: 'transparent', cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                            <Power size={9} />TERMINATE
                        </button>
                    </div>
                </div>

                {/* Messages — THIS is the only scrolling element */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-3.5"
     style={{ scrollbarWidth: 'thin', scrollbarColor: `${accent}15 transparent` }}>
                    <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                            <motion.div key={msg.id}
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                style={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>

                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, maxWidth: '78%', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row' }}>
                                    {/* Avatar */}
                                    <div style={{ width: 22, height: 22, borderRadius: 5, background: msg.type === 'bot' ? `${accent}0d` : 'rgba(71,85,105,0.15)', border: `1px solid ${msg.type === 'bot' ? `${accent}25` : 'rgba(71,85,105,0.22)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 18 }}>
                                        <span style={{ fontSize: 8, fontWeight: 700, color: msg.type === 'bot' ? accent : '#475569' }}>{msg.type === 'bot' ? 'V' : 'U'}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            padding: '10px 14px', borderRadius: 10, fontSize: 13, lineHeight: 1.6,
                                            ...(msg.type === 'bot'
                                                ? { background: `${accent}07`, border: `1px solid ${accent}16`, color: '#94a3b8', borderTopLeftRadius: 3 }
                                                : { background: 'rgba(129,140,248,0.07)', border: '1px solid rgba(129,140,248,0.17)', color: '#cbd5e1', borderTopRightRadius: 3 })
                                        }}>
                                            {msg.text}
                                        </div>
                                        <span style={{ fontSize: 7, color: '#1e293b', fontFamily: 'monospace', letterSpacing: '0.1em', paddingInline: 2 }}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Thinking dots */}
                    {isThinking && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                <div style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 8, fontWeight: 700, color: '#818cf8' }}>V</span>
                                </div>
                                <div style={{ padding: '10px 14px', borderRadius: 10, borderTopLeftRadius: 3, background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.14)', display: 'flex', gap: 5, alignItems: 'center' }}>
                                    {[0, 0.15, 0.3].map((d, i) => (
                                        <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.55, repeat: Infinity, delay: d }}
                                            style={{ width: 5, height: 5, borderRadius: '50%', background: '#818cf8', boxShadow: '0 0 5px #818cf8' }} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input bar */}
                <div style={{ flexShrink: 0, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, position: 'relative', overflow: 'hidden',
                        background: 'rgba(6,10,22,0.85)',
                        border: `1px solid ${listening ? '#fb718840' : `${accent}18`}`,
                        boxShadow: listening ? '0 0 14px rgba(251,113,133,0.06)' : `0 0 14px ${accent}04`,
                        transition: 'border-color 0.3s, box-shadow 0.3s'
                    }}>
                        {/* Animated bottom line when listening */}
                        <motion.div animate={{ scaleX: listening ? 1 : 0 }} transition={{ duration: 0.3 }}
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,#fb7185,#818cf8,${accent})`, transformOrigin: 'left', pointerEvents: 'none' }} />

                        {/* Mic button */}
                        <button onClick={toggleListening} style={{
                            width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                            background: listening ? 'rgba(251,113,133,0.12)' : `${accent}08`,
                            color: listening ? '#fb7185' : '#334155',
                            boxShadow: listening ? '0 0 10px rgba(251,113,133,0.15)' : 'none',
                            outline: `1px solid ${listening ? 'rgba(251,113,133,0.28)' : `${accent}14`}`
                        }}>
                            {listening ? <Mic size={13} /> : <MicOff size={13} />}
                        </button>

                        {/* Text input */}
                        <input
                            type="text" value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
                            placeholder={listening ? 'Listening...' : 'Transmit to V.A.N.I.N.I...'}
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: listening ? '#fda4af' : '#64748b', caretColor: accent }}
                        />

                        {/* Send button */}
                        <button onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim()} style={{
                            width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: inputValue.trim() ? 'pointer' : 'not-allowed', border: 'none', transition: 'all 0.2s',
                            background: inputValue.trim() ? `${accent}12` : 'transparent',
                            color: inputValue.trim() ? accent : '#1e293b',
                            boxShadow: inputValue.trim() ? `0 0 8px ${accent}15` : 'none',
                            outline: `1px solid ${inputValue.trim() ? `${accent}28` : 'rgba(255,255,255,0.04)'}`
                        }}>
                            <Send size={12} />
                        </button>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, paddingInline: 2 }}>
                        <span style={{ fontSize: 7, color: '#0f172a', letterSpacing: '0.15em' }}>SYS // {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontSize: 7, color: '#0f172a', letterSpacing: '0.15em' }}>{messages.length} TRANSMISSIONS</span>
                    </div>
                </div>
            </Panel>
        </div>
    );
}