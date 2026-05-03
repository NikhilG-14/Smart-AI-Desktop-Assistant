import { useState, useRef, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Send, Mic, MicOff, Power, Activity, Wifi, VideoOff } from 'lucide-react';
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

const C = {
    mahogany:  '#5C3D2E',
    cream:     '#FAF7F2',
    warmWhite: '#F5F1EA',
    parchment: '#EDE8DF',
    sand:      '#D4CAB8',
    taupe:     '#B8A99A',
    bronze:    '#8B6E52',
    charcoal:  'rgba(58,53,48,0.92)',
    gold:      '#C9933A',
    goldLight: '#E8C97A',
    sage:      '#7A9E8A',
    mutedRose: '#C4897A',
} as const;

const StatBar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: 'rgba(250,247,242,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                {label}
            </span>
            <span style={{ fontSize: 9, color, fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ height: '100%', background: color, borderRadius: 2 }}
            />
        </div>
    </div>
);

const InfoCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10,
        padding: '10px 12px',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            {icon}
            <span style={{ fontSize: 8, color: 'rgba(250,247,242,0.25)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                {label}
            </span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 500, color: C.cream }}>{value}</span>
    </div>
);

export function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '0', type: 'bot', text: 'Vanilla Artificial Neural Intelligence Network initialized. How may I assist you today?', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue]     = useState('');
    const [isThinking, setIsThinking]     = useState(false);
    const [cameraActive, setCameraActive] = useState(true);
    const [camSeconds, setCamSeconds]     = useState(0);

    const videoRef        = useRef<HTMLVideoElement>(null);
    const messagesEndRef  = useRef<HTMLDivElement>(null);

    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const shouldListenRef = useRef(false);


    const { transcript, finalTranscript, listening, resetTranscript, browserSupportsSpeechRecognition } =
        useSpeechRecognition();

    useEffect(() => { if (transcript) setInputValue(transcript); }, [transcript]);
    useEffect(() => { const el = messagesContainerRef.current;
                    if (!el) return;

                    el.scrollTo({
                        top: el.scrollHeight,
                        behavior: 'smooth',
                    }); }, [messages]);

    useEffect(() => {
        if (!cameraActive || !videoRef.current) return;
        navigator.mediaDevices
            ?.getUserMedia({ video: { facingMode: 'user' } })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(() => {});
    }, [cameraActive]);

    useEffect(() => {
        const id = setInterval(() => setCamSeconds(s => s + 1), 1000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!listening || !transcript) return;
        const kw = ['pause','unpause','resume','stop','play','next song','previous song']
            .find(k => transcript.toLowerCase().includes(k));
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
            if (!shouldListenRef.current) {
                shouldListenRef.current = true;
                if (!listening) SpeechRecognition.startListening({ continuous: false, language: 'en-IN' });
            }
        });
    }, []);

    const fmtTime = (d: Date) =>
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const fmtCam = () => {
        const m = String(Math.floor(camSeconds / 60)).padStart(2, '0');
        const s = String(camSeconds % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

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
        if (!v) v = voices.find(v =>
            ['Samantha','Victoria','Karen','Moira','Tessa','Zira','Google UK English Female','Google US English']
            .some(n => v.name.includes(n)));
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
            const res = await fetch('http://127.0.0.1:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            if (!res.ok) throw new Error('Network response was not ok');

            // The backend returns a text/plain stream
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let botText = '';
            
            // Create an empty bot message that we'll update in real-time
            const botMsgId = Date.now().toString();
            setMessages(p => [...p, { id: botMsgId, type: 'bot', text: '', timestamp: new Date() }]);

            while (reader) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                botText += chunk;
                
                // Update the last message with the new chunk
                setMessages(p => p.map(m => m.id === botMsgId ? { ...m, text: botText } : m));
            }

            if (botText) speakMessage(botText);
            else {
                // If we got nothing, maybe it was ignored (wake-word missing)
                setMessages(p => p.filter(m => m.id !== botMsgId && m.id !== uid));
            }

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(p => [...p, {
                id: Date.now().toString(), type: 'bot',
                text: 'Connection to V.A.N.I.N.I. backend failed. Please check the server.',
                timestamp: new Date(),
            }]);
        } finally { setIsThinking(false); }
    };

    const statusColor = isThinking ? C.gold : listening ? C.mutedRose : C.sage;
    const statusLabel = isThinking ? 'Processing' : listening ? 'Listening' : 'Ready';

    /*
     * LAYOUT STRATEGY — why this finally works:
     *
     * App.tsx renders each tab as:
     *   <div style={{ position:'absolute', inset:0, zIndex:10, display:'flex' }}>
     *     <ChatInterface />
     *   </div>
     *
     * That parent has position:absolute + inset:0, so it has EXACT pixel
     * dimensions equal to <main>. No flex chain involved at all.
     *
     * ChatInterface root uses width:100% + height:100%.
     * Because the parent has concrete pixel size (not "fit content"),
     * these resolve to exact pixels — guaranteed, every render, forever.
     *
     * box-sizing:border-box (set in index.css via * selector) means
     * padding:24px is SUBTRACTED from 100%, never added to it.
     * So the layout never overflows no matter how many messages appear.
     */
    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
            gap: '24px',
            padding: '24px',
            overscrollBehavior: 'contain', 
            fontFamily: "'DM Sans', sans-serif",
        }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
            `}</style>

            {/* ══ CHAT AREA ══════════════════════════════════════════════════ */}
            <div style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                background: C.warmWhite,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '16px',
                border: `1px solid ${C.parchment}`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            }}>
                {/* Crosshatch texture */}
                <div aria-hidden="true" style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%238B6E52' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
                }} />

                {/* ── Header ── */}
                <header style={{
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px 14px',
                    borderBottom: `1px solid ${C.parchment}`,
                    background: 'rgba(245,241,234,0.96)',
                    backdropFilter: 'blur(8px)',
                    position: 'relative',
                    zIndex: 2,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            border: `1.5px solid rgba(201,147,58,0.4)`,
                            background: C.mahogany,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <motion.div
                                animate={{ scale: isThinking ? [1, 1.25, 1] : [1, 1.07, 1] }}
                                transition={{ duration: isThinking ? 0.6 : 2.8, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    width: 14, height: 14, borderRadius: '50%',
                                    background: `radial-gradient(circle at 40% 35%, ${C.goldLight}, ${C.gold})`,
                                }}
                            />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 19, fontWeight: 500,
                                color: C.mahogany, letterSpacing: '0.02em', lineHeight: 1.2,
                            }}>
                                Secure Channel
                            </div>
                            <div style={{ fontSize: 10, color: C.taupe, letterSpacing: '0.08em', marginTop: 1 }}>
                                Encrypted · AES-256 · {messages.length} transmissions
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <motion.div
                                animate={{ opacity: [1, 0.3, 1] }}
                                transition={{ duration: 1.8, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }}
                            />
                            <span style={{ fontSize: 10, color: C.taupe, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                                {statusLabel}
                            </span>
                        </div>
                        <button style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '5px 12px', borderRadius: 20,
                            fontSize: 10, color: C.mutedRose,
                            border: `1px solid rgba(196,137,122,0.3)`,
                            background: 'transparent', cursor: 'pointer',
                            letterSpacing: '0.06em', textTransform: 'uppercase',
                            fontFamily: "'DM Sans', sans-serif",
                        }}>
                            <Power size={10} /> Terminate
                        </button>
                    </div>
                </header>

                {/* ── Messages ── */}
                <div
                    ref={messagesContainerRef}
                    className="v-scroll"
                    onWheel={(e) => e.stopPropagation()}
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: 'auto',
                        overscrollBehavior: 'contain',
                        padding: '24px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 20,
                        position: 'relative',
                        zIndex: 1,
                    }}
                >
                    <AnimatePresence initial={false}>
                        {messages.map(msg => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                style={{
                                    display: 'flex', gap: 10, alignItems: 'flex-end',
                                    flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                                }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: "'Cormorant Garamond', serif",
                                    fontSize: 13, fontWeight: 600,
                                    ...(msg.type === 'bot'
                                        ? { background: C.mahogany, color: C.goldLight, border: `1.5px solid rgba(201,147,58,0.3)` }
                                        : { background: C.parchment, color: C.bronze, border: `1.5px solid ${C.sand}` }
                                    ),
                                }}>
                                    {msg.type === 'bot' ? 'V' : 'U'}
                                </div>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: 4,
                                    alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start',
                                    maxWidth: '70%',
                                }}>
                                    <div style={{
                                        padding: '11px 16px', fontSize: 14, lineHeight: 1.65,
                                        ...(msg.type === 'bot'
                                            ? {
                                                background: '#FFFFFF',
                                                border: `1px solid ${C.parchment}`,
                                                color: C.charcoal,
                                                borderRadius: '16px 16px 16px 4px',
                                                boxShadow: '0 2px 12px rgba(28,20,16,0.06)',
                                            }
                                            : {
                                                background: C.mahogany,
                                                color: 'rgba(250,247,242,0.92)',
                                                borderRadius: '16px 16px 4px 16px',
                                                boxShadow: '0 2px 12px rgba(92,61,46,0.22)',
                                            }
                                        ),
                                    }}>
                                        {msg.text}
                                    </div>
                                    <span style={{ fontSize: 10, color: C.taupe, letterSpacing: '0.04em', paddingInline: 4 }}>
                                        {fmtTime(msg.timestamp)}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isThinking && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}
                            >
                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                    background: C.mahogany, color: C.goldLight,
                                    border: `1.5px solid rgba(201,147,58,0.3)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 600,
                                }}>V</div>
                                <div style={{
                                    background: '#FFFFFF', border: `1px solid ${C.parchment}`,
                                    borderRadius: '16px 16px 16px 4px', padding: '13px 18px',
                                    display: 'flex', gap: 5, alignItems: 'center',
                                    boxShadow: '0 2px 12px rgba(28,20,16,0.06)',
                                }}>
                                    {[0, 0.16, 0.32].map((delay, i) => (
                                        <motion.div key={i}
                                            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                                            transition={{ duration: 0.6, repeat: Infinity, delay }}
                                            style={{ width: 7, height: 7, borderRadius: '50%', background: C.bronze }}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* ── Input area ── */}
                <div style={{
                    flexShrink: 0,
                    padding: '12px 20px 16px',
                    borderTop: `1px solid ${C.parchment}`,
                    background: 'rgba(245,241,234,0.96)',
                    backdropFilter: 'blur(8px)',
                    position: 'relative',
                    zIndex: 2,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: '#FFFFFF',
                        border: `1px solid ${listening ? C.mutedRose : C.sand}`,
                        borderRadius: 14, padding: '8px 8px 8px 14px',
                        boxShadow: listening
                            ? `0 2px 16px rgba(196,137,122,0.18), 0 0 0 3px rgba(196,137,122,0.06)`
                            : '0 2px 14px rgba(28,20,16,0.07)',
                        transition: 'border-color 0.25s, box-shadow 0.25s',
                        position: 'relative', overflow: 'hidden',
                    }}>
                        <motion.div
                            animate={{ scaleX: listening ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
                                background: `linear-gradient(90deg, ${C.mutedRose}, ${C.bronze}, ${C.gold})`,
                                transformOrigin: 'left', pointerEvents: 'none',
                            }}
                        />
                        <button onClick={toggleListening} style={{
                            width: 34, height: 34, borderRadius: 10, border: 'none',
                            cursor: 'pointer', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            background: listening ? C.mutedRose : C.parchment,
                            color: listening ? '#FFFFFF' : C.bronze,
                        }}>
                            {listening ? <Mic size={14} /> : <MicOff size={14} />}
                        </button>
                        <input
                            className="v-input"
                            type="text"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage(inputValue)}
                            placeholder={listening ? 'Listening…' : 'Transmit to V.A.N.I.N.I…'}
                            style={{
                                flex: 1, border: 'none', outline: 'none',
                                background: 'transparent', fontSize: 14,
                                color: listening ? C.mutedRose : C.charcoal,
                                caretColor: C.bronze,
                            }}
                        />
                        <button onClick={() => sendMessage(inputValue)} disabled={!inputValue.trim()} style={{
                            width: 34, height: 34, borderRadius: 10, border: 'none',
                            cursor: inputValue.trim() ? 'pointer' : 'not-allowed', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            background: inputValue.trim() ? C.mahogany : C.parchment,
                            color: inputValue.trim() ? C.goldLight : C.taupe,
                            opacity: inputValue.trim() ? 1 : 0.5,
                        }}>
                            <Send size={13} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, paddingInline: 3 }}>
                        <span style={{ fontSize: 10, color: C.taupe, letterSpacing: '0.04em' }}>
                            Enter to send · Shift+Enter for new line
                        </span>
                        <span style={{ fontSize: 10, color: C.taupe, letterSpacing: '0.04em' }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* ══ VANINI RIGHT PANEL ══════════════════════════════════════════ */}
            <aside style={{
                width: 230,
                flexShrink: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                background: C.mahogany,
                overflow: 'hidden',
                position: 'relative',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
            }}>
                <div aria-hidden="true" style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    background: `
                        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201,147,58,0.14) 0%, transparent 60%),
                        radial-gradient(ellipse 60% 40% at 100% 100%, rgba(122,158,138,0.07) 0%, transparent 50%)
                    `,
                }} />

                {/* Brand */}
                <div style={{
                    padding: '20px 20px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    position: 'relative', zIndex: 1, flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            border: '1.5px solid rgba(201,147,58,0.45)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <motion.div
                                animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    width: 18, height: 18, borderRadius: '50%',
                                    background: `linear-gradient(135deg, ${C.gold} 0%, ${C.goldLight} 100%)`,
                                }}
                            />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: 18, fontWeight: 500,
                                color: C.cream, letterSpacing: '0.05em',
                            }}>V.A.N.I.N.I.</div>
                            <div style={{
                                fontSize: 8, color: 'rgba(250,247,242,0.28)',
                                letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 1,
                            }}>Neural Interface v2.1</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <motion.div
                            animate={{ opacity: [1, 0.35, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }}
                        />
                        <span style={{
                            fontSize: 9, color: 'rgba(250,247,242,0.38)',
                            letterSpacing: '0.15em', textTransform: 'uppercase',
                        }}>{statusLabel}</span>
                    </div>
                </div>

                {/* Camera */}
                <div style={{
                    margin: '14px 16px 10px',
                    borderRadius: 12, overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.09)',
                    position: 'relative', aspectRatio: '16/10',
                    background: 'rgba(0,0,0,0.4)', flexShrink: 0,
                }}>
                    {cameraActive
                        ? <video ref={videoRef} autoPlay muted style={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            opacity: 0.6, filter: 'sepia(0.3) brightness(0.8)',
                          }} />
                        : <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 5,
                          }}>
                            <VideoOff size={14} color="rgba(250,247,242,0.15)" />
                            <span style={{ fontSize: 8, color: 'rgba(250,247,242,0.15)', letterSpacing: '0.18em' }}>
                                FEED OFFLINE
                            </span>
                          </div>
                    }
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        padding: '8px 10px', pointerEvents: 'none',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                            background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '2px 7px',
                        }}>
                            <motion.div
                                animate={{ opacity: [1, 0.2, 1] }}
                                transition={{ duration: 1.3, repeat: Infinity }}
                                style={{ width: 4, height: 4, borderRadius: '50%', background: '#E06060' }}
                            />
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em' }}>REC</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.16)', fontFamily: 'monospace' }}>CAM · 01</span>
                            <button
                                onClick={() => setCameraActive(p => !p)}
                                style={{
                                    background: 'rgba(0,0,0,0.45)', border: 'none',
                                    color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                                    padding: '2px 6px', borderRadius: 5,
                                    fontSize: 8, letterSpacing: '0.08em',
                                    pointerEvents: 'all',
                                }}
                            >{cameraActive ? '■ OFF' : '▶ ON'}</button>
                            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.16)', fontFamily: 'monospace' }}>{fmtCam()}</span>
                        </div>
                    </div>
                </div>

                {/* Diagnostics */}
                <div style={{
                    padding: '4px 18px 0',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 1,
                }}>
                    <span style={{
                        fontSize: 8, color: 'rgba(250,247,242,0.2)',
                        letterSpacing: '0.28em', textTransform: 'uppercase',
                        marginBottom: 12, display: 'block', flexShrink: 0,
                    }}>System Diagnostics</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, flexShrink: 0 }}>
                        <StatBar label="Neural Eng." pct={89} color={C.gold} />
                        <StatBar label="CPU Core 0"  pct={42} color={C.sage} />
                        <StatBar label="CPU Core 1"  pct={38} color={C.sage} />
                    </div>
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: 7, marginTop: 16, paddingBottom: 18, flexShrink: 0,
                    }}>
                        <InfoCard icon={<Wifi     size={8} color={C.gold}      />} label="Network" value="2.4G" />
                        <InfoCard icon={<Activity size={8} color={C.mutedRose} />} label="Temp"    value="42°C" />
                    </div>
                </div>
            </aside>

        </div>
    );
}