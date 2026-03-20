import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AnimalitoChat = ({ animalito, doctorName, slug }: { animalito: any, doctorName: string, slug?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, role: 'assistant', text: `¡Hola! Soy Jiro, el asistente inteligente de la clínica. ¿En qué puedo ayudarte a cuidar a tu pequeño hoy?` }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !slug) return;

        const userMsg = input;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            const chatHistory = messages.map(m => `${m.role}: ${m.text}`).join('\n');
            const res = await fetch("/api/public/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug, message: userMsg, chatHistory })
            });
            const data = await res.json();

            if (res.ok && data.reply) {
                setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: data.reply }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: "Lo siento, tuve un problema conectándome. Por favor intenta agendar una cita directamente." }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: "Ocurrió un error. Por favor intenta más tarde." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end pointer-events-none">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-[90vw] max-w-[340px] mb-4 overflow-hidden flex flex-col h-[400px] pointer-events-auto"
                        >
                            <div className={`p-4 bg-[#dd8872] flex items-center justify-between`}>
                                <div className="flex items-center gap-2">
                                    <div className="bg-white w-10 h-10 flex items-center justify-center rounded-full shadow-sm overflow-hidden p-[2px]">
                                        <img src="/jiro.png" className="w-full h-full object-cover rounded-full" alt="Jiro Squirrel" />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-white leading-tight`}>Jiro AI</h3>
                                        <p className={`text-[10px] font-semibold text-white/80`}>Asistente de {doctorName}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className={`p-1.5 bg-white/30 rounded-full text-white`}>
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-3 pb-8">
                                <div className="text-center mb-4">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full inline-block">Hoy</span>
                                </div>
                                {messages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-6 h-6 mr-2 self-end mb-1 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-white p-[1px]">
                                                <img src="/jiro.png" className="w-full h-full object-cover rounded-full" alt="Jiro Squirrel" />
                                            </div>
                                        )}
                                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm ${msg.role === 'user'
                                            ? 'bg-[#1a365d] text-white rounded-br-sm'
                                            : 'bg-white shadow-sm border border-slate-100 text-slate-700 rounded-bl-sm'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="w-6 h-6 mr-2 self-end mb-1 rounded-full overflow-hidden shadow-sm flex-shrink-0 bg-white p-[1px]">
                                            <img src="/jiro.png" className="w-full h-full object-cover rounded-full" alt="Jiro Squirrel" />
                                        </div>
                                        <div className="p-3 bg-white shadow-sm border border-slate-100 rounded-2xl rounded-bl-sm flex items-center gap-1.5 h-10">
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-[#dd8872] rounded-full" />
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-[#dd8872] rounded-full" />
                                            <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-[#dd8872] rounded-full" />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-3 bg-white border-t border-slate-100">
                                <form onSubmit={handleSend} className="flex gap-2 relative">
                                    <input
                                        type="text"
                                        className="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm outline-none pr-10"
                                        placeholder={`Pregúntale a ${animalito.name}...`}
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <button type="submit" disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#1a365d] text-white rounded-full shadow-md disabled:opacity-50">
                                        <Send size={14} />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    id="animalito-chat-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-20 h-20 bg-white border-4 border-slate-100 rounded-full shadow-2xl flex items-center justify-center hover:-translate-y-2 transition-transform relative group pointer-events-auto p-0.5`}
                >
                    {isOpen ? <X size={32} className="text-slate-400" /> : (
                        <div className="w-full h-full rounded-full overflow-hidden">
                            <img src="/jiro.png" className="w-full h-full object-cover" alt="Jiro Squirrel" />
                        </div>
                    )}
                </button>
            </div>
        </>
    );
};
