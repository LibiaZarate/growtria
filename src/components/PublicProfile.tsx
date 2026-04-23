import React, { useState } from 'react';
import {
    Calendar, ArrowRight, Instagram, Youtube, Facebook,
    Video as VideoIcon, Download, MapPin,
    MessageCircle, Play, X, Lock, ShieldCheck, Mail, Phone, User as UserIcon, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimalitoChat } from './AnimalitoChat';

export const PublicProfile = ({ hubData, onSwitchMode }: { hubData: any, onSwitchMode: () => void }) => {
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showFunnelModal, setShowFunnelModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [leadData, setLeadData] = useState({ name: '', email: '', phone: '' });
    const [funnelData, setFunnelData] = useState({ name: '', email: '', phone: '', card: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleDownload = (product: any) => {
        setSelectedProduct(product);
        setShowLeadModal(true);
        setSubmitted(false);
    };

    const trackEvent = (eventType: string, resourceId?: string) => {
        fetch("/api/public/metrics/click", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: hubData.slug, event_type: eventType, resource_id: resourceId })
        }).catch(e => console.error(e));
    };

    const submitDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/public/lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    slug: hubData.slug,
                    name: leadData.name,
                    email: leadData.email,
                    whatsapp: leadData.phone,
                    resource_requested: selectedProduct?.title || selectedProduct?.id || 'Recurso'
                })
            });
            if (res.ok) {
                setSubmitted(true);
                trackEvent('resource_click', selectedProduct?.title || selectedProduct?.id);
                if (selectedProduct?.link) {
                    window.open(selectedProduct.link, '_blank');
                }
                setTimeout(() => setShowLeadModal(false), 2000);
            }
        } catch (err) { }
    };

    // Color definitions based on the provided UI design
    const bgColor = "#FFF9FA"; // Very light pink/white background
    const textColor = "#4A3B40"; // Dark brownish-pink text
    const primaryPink = "#D85C83"; // The main pink CTA color
    const secondaryPink = "#F2D8E0"; // Light pink for secondary areas

    const parsedProducts = JSON.parse(hubData.products_json || "[]");
    
    // Categorize using common sense heuristics
    const resources = parsedProducts.filter((p: any) => 
        p.type?.toLowerCase().includes('pdf') || 
        p.type?.toLowerCase().includes('guía') || 
        p.type?.toLowerCase().includes('video') ||
        p.price === 0
    );
    const services = parsedProducts.filter((p: any) => !resources.includes(p));

    return (
        <div className="min-h-[100vh] font-sans relative pb-32 selection:bg-pink-100" style={{ backgroundColor: bgColor, color: textColor }}>
            {/* Top Admin Bar */}
            <div className="bg-[#1a365d] text-white text-[10px] px-4 py-3 flex justify-between items-center sticky top-0 z-[60]">
                <span className="font-bold flex items-center gap-2 uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Vista de Paciente
                </span>
                <button onClick={onSwitchMode} className="bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full font-bold transition-colors">
                    CERRAR ESTUDIO
                </button>
            </div>

            <main className="max-w-md mx-auto pt-10 px-6">
                
                {/* IDENTITY LAYER (Linktree Meta Profile) */}
                <header className="flex flex-col items-center text-center w-full mb-10">
                    <div className="w-28 h-28 rounded-full overflow-hidden mb-4 shadow-sm border-2 border-white relative bg-[#F4DCE3] flex items-center justify-center text-4xl font-black text-[#D85C83]">
                        {hubData.avatar_url ? (
                            <img src={hubData.avatar_url} alt={hubData.title} className="w-full h-full object-cover" />
                        ) : (
                            hubData.title.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || "DR"
                        )}
                    </div>
                    
                    <h1 className="text-2xl font-black mb-1 text-[#2d2824] leading-tight">{hubData.title}</h1>
                    <p className="text-sm font-semibold opacity-70 mb-4 tracking-wide">{hubData.specialty}</p>
                    
                    {hubData.bio_text && (
                        <p className="text-sm italic font-medium opacity-80 mb-6 text-[#5a484c] px-4">
                            "{hubData.bio_text}"
                        </p>
                    )}

                    <div className="flex gap-3 justify-center mb-10">
                        {['IG', 'TT', 'YT', 'FB'].map(social => (
                            <a key={social} href="#" className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#D85C83] bg-[#F7E6EB] hover:bg-[#F2D8E0] transition-colors shadow-sm">
                                {social}
                            </a>
                        ))}
                    </div>

                    <button 
                        onClick={() => { setShowFunnelModal(true); trackEvent('appointment_click'); }}
                        className="w-full text-white py-4 rounded-3xl font-black text-lg shadow-[0_8px_20px_rgba(216,92,131,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: primaryPink }}
                    >
                        Agendar consulta <ArrowRight size={20} strokeWidth={3} />
                    </button>
                </header>

                {/* WEBSITE LAYER (Content) */}
                <div className="space-y-10">
                    
                    {/* Intro Video Card */}
                    {hubData.intro_video_url && (
                        <div className="w-full bg-[#F7E6EB] rounded-[1.5rem] p-3 flex items-center gap-4 cursor-pointer hover:bg-[#F2D8E0] transition-colors border border-white/50 shadow-sm" onClick={() => window.open(hubData.intro_video_url, '_blank')}>
                            <div className="w-16 h-16 rounded-2xl bg-[#D85C83]/10 flex items-center justify-center shrink-0">
                                <Play className="text-[#D85C83] fill-[#D85C83]" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-[#2d2824] leading-tight">Conóceme en 30 segundos</h3>
                                <p className="text-xs font-medium text-[#D85C83] opacity-80">Video de presentación</p>
                            </div>
                        </div>
                    )}

                    {/* Resources */}
                    {resources.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#B38D9A] mb-4">Recursos Gratis</h3>
                            <div className="space-y-3">
                                {resources.map((res: any, idx: number) => (
                                    <div key={idx} onClick={() => handleDownload(res)} className="w-full bg-white rounded-2xl p-4 flex justify-between items-center cursor-pointer border border-[#F4E3E8] shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#D85C83]/30 transition-colors">
                                        <span className="font-bold text-[#4A3B40] text-sm">{res.title}</span>
                                        <div className="flex items-center gap-1 text-[#D85C83] text-[10px] font-black uppercase tracking-widest">
                                            {res.type?.toLowerCase().includes('video') ? (
                                                <>Video <Play size={12} className="fill-[#D85C83]" /></>
                                            ) : (
                                                <>PDF <Download size={12} strokeWidth={3} /></>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    {services.length > 0 && (
                        <div>
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#B38D9A] mb-4">Servicios</h3>
                            <div className="space-y-3">
                                {services.map((srv: any, idx: number) => (
                                    <div key={idx} className="w-full bg-white rounded-2xl p-4 border border-[#F4E3E8] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-[#2d2824] text-sm mb-1">{srv.title}</h4>
                                                <p className="text-xs font-medium opacity-60">{srv.tag || 'Modalidad de atención'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Location */}
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-[#B38D9A] mb-4">Ubicación</h3>
                        <div className="w-full bg-[#F7E6EB] rounded-[1.5rem] p-6 relative overflow-hidden text-center flex flex-col items-center justify-center min-h-[120px]">
                            {/* Dummy Map Visual Effect */}
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] mix-blend-multiply rounded-[1.5rem]"></div>
                            
                            <MapPin size={24} className="text-[#D85C83] mb-2 relative z-10" />
                            <p className="font-bold text-sm text-[#4A3B40] max-w-[200px] relative z-10 leading-tight">
                                Monterrey, N.L. México
                            </p>
                            <button className="absolute bottom-3 right-3 bg-white text-[#D85C83] text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm">
                                Ver mapa
                            </button>
                        </div>
                    </div>

                    {/* WhatsApp Escape */}
                    {hubData.whatsapp_number && (
                        <div className="pt-4">
                            <a href={`https://wa.me/${hubData.whatsapp_number}`} onClick={() => trackEvent('whatsapp_click')} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] text-white py-4 rounded-3xl font-black text-sm shadow-[0_8px_20px_rgba(37,211,102,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                <MessageCircle size={20} /> WhatsApp directo
                            </a>
                        </div>
                    )}
                </div>
            </main>

            {/* Squirrel Floating Action (Avellana) */}
            <AnimalitoChat animalito={{ type: "squirrel", name: "Avellana", color: "bg-[#D85C83]", textColor: "text-white", emoji: "🌰" }} doctorName={hubData.title} slug={hubData.slug} />

            {/* FUNNEL OVERLAY (Capa 3) */}
            <AnimatePresence>
                {showFunnelModal && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-[#322A2D]/80 backdrop-blur-md z-[100] flex justify-center items-end sm:items-center sm:p-4"
                    >
                        <motion.div 
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 400 }}
                            className="bg-white w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-12 relative flex flex-col max-h-[90vh] overflow-y-auto"
                        >
                            <button onClick={() => setShowFunnelModal(false)} className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-[#F7E6EB] text-[#D85C83] rounded-full hover:bg-red-100 transition-colors">
                                <X size={16} strokeWidth={3} />
                            </button>

                            {/* Progress Bar */}
                            <div className="mb-8 pr-12">
                                <span className="text-xs font-bold text-[#D85C83] block mb-2">Paso 2 de 4</span>
                                <div className="flex gap-1.5 h-1">
                                    <div className="flex-1 bg-[#D85C83] rounded-full"></div>
                                    <div className="flex-1 bg-[#D85C83] rounded-full"></div>
                                    <div className="flex-1 bg-[#F2D8E0] rounded-full"></div>
                                    <div className="flex-1 bg-[#F2D8E0] rounded-full"></div>
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-[#2d2824] mb-2 leading-tight">Aparta tu lugar</h2>
                            <p className="text-xs font-bold text-[#D85C83] opacity-80 mb-6">
                                Sitio seguro. No se realiza ningún cargo todavía.
                            </p>

                            <form className="space-y-4" onSubmit={e => { e.preventDefault(); }}>
                                
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D85C83]/50"><UserIcon size={18} /></div>
                                    <input required type="text" placeholder="Nombre completo" className="w-full bg-white border-2 border-[#F4E3E8] rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-[#D85C83] text-sm font-bold text-[#2d2824] transition-colors" />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D85C83]/50"><Phone size={18} /></div>
                                    <input required type="tel" placeholder="WhatsApp" className="w-full bg-white border-2 border-[#F4E3E8] rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-[#D85C83] text-sm font-bold text-[#2d2824] transition-colors" />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D85C83]/50"><Mail size={18} /></div>
                                    <input required type="email" placeholder="Email" className="w-full bg-white border-2 border-[#F4E3E8] rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-[#D85C83] text-sm font-bold text-[#2d2824] transition-colors" />
                                </div>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D85C83]/50"><CreditCard size={18} /></div>
                                    <input required type="text" placeholder="Tarjeta - 4242 4242 4242 4242" className="w-full bg-white border-2 border-[#F4E3E8] rounded-2xl py-3 pl-11 pr-4 outline-none focus:border-[#D85C83] text-sm font-bold text-[#2d2824] transition-colors" />
                                </div>

                                <div className="bg-[#F9F4F6] rounded-xl p-3 flex gap-3 items-center border border-[#F4E3E8] mt-2">
                                    <Lock size={16} className="text-[#a48a93] shrink-0" />
                                    <p className="text-[10px] font-bold text-[#a48a93] leading-tight">Procesado por Stripe. Sin cargo hasta confirmar.</p>
                                </div>

                                <button type="button" className="w-full text-white py-4 rounded-2xl font-black text-base shadow-[0_4px_15px_rgba(216,92,131,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all mt-6 flex justify-center items-center gap-2" style={{ backgroundColor: primaryPink }}>
                                    Continuar <ArrowRight size={18} strokeWidth={3} />
                                </button>
                            </form>

                            {/* Squirrel reassurance */}
                            <div className="mt-8 flex items-center justify-center gap-2 opacity-80">
                                <span className="text-xl">🐿️</span>
                                <p className="text-xs font-bold italic text-[#D85C83]">Estoy contigo en cada paso</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RESOURCE LEAD MODAL (Mini embudo) */}
            <AnimatePresence>
                {showLeadModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[#322A2D]/80 backdrop-blur-sm z-[100]"
                            onClick={() => setShowLeadModal(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white rounded-t-[2.5rem] z-[101] overflow-hidden sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[2.5rem] shadow-2xl"
                        >
                            {!submitted ? (
                                <div className="p-8">
                                    <button onClick={() => setShowLeadModal(false)} className="absolute top-4 right-4 text-[#D85C83]/50 hover:text-[#D85C83]">
                                        <X size={20} strokeWidth={3} />
                                    </button>
                                    <div className="text-center mb-6 pt-4">
                                        <div className="w-16 h-16 bg-[#F7E6EB] text-[#D85C83] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#F4E3E8]">
                                            <Download size={32} strokeWidth={2.5} />
                                        </div>
                                        <h3 className="font-black text-xl text-[#2d2824] leading-tight mb-2">{selectedProduct?.title}</h3>
                                        <p className="text-xs font-bold text-[#D85C83] opacity-80">Ingresa tus datos para acceder</p>
                                    </div>
                                    <form onSubmit={submitDownload} className="space-y-4">
                                        <div>
                                            <input required type="text" placeholder="Tu Nombre" className="w-full bg-[#F9F4F6] border border-transparent rounded-xl px-4 py-3 outline-none focus:border-[#D85C83] focus:bg-white transition-colors text-sm font-bold text-[#2d2824]" value={leadData.name} onChange={e => setLeadData({ ...leadData, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <input required type="email" placeholder="Email" className="w-full bg-[#F9F4F6] border border-transparent rounded-xl px-4 py-3 outline-none focus:border-[#D85C83] focus:bg-white transition-colors text-sm font-bold text-[#2d2824]" value={leadData.email} onChange={e => setLeadData({ ...leadData, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <input type="tel" placeholder="WhatsApp (Opcional)" className="w-full bg-[#F9F4F6] border border-transparent rounded-xl px-4 py-3 outline-none focus:border-[#D85C83] focus:bg-white transition-colors text-sm font-bold text-[#2d2824]" value={leadData.phone} onChange={e => setLeadData({ ...leadData, phone: e.target.value })} />
                                        </div>
                                        <button type="submit" className="w-full text-white rounded-xl py-3.5 font-black text-sm mt-2 hover:opacity-90 flex justify-center items-center gap-2" style={{ backgroundColor: primaryPink }}>
                                            Descargar Ahora
                                        </button>
                                        
                                        <div className="mt-4 flex items-center justify-center gap-2 opacity-80">
                                            <span className="text-sm">🐿️</span>
                                            <p className="text-[10px] font-bold italic text-[#D85C83]">¡Te enviaré el link por si lo pierdes!</p>
                                        </div>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-[#F7E6EB] text-[#D85C83] rounded-full flex items-center justify-center mb-6 border-4 border-white shadow-md">
                                        <ShieldCheck size={40} />
                                    </motion.div>
                                    <h3 className="text-2xl font-black text-[#2d2824] mb-2">¡Todo listo!</h3>
                                    <p className="text-[#D85C83] text-sm font-bold">
                                        Has desbloqueado el recurso.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};
