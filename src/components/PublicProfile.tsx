import React, { useState } from 'react';
import {
    Calendar, BookOpen, CheckCircle2, Video,
    ShieldCheck, MessageCircle, Play, ArrowRight, Instagram, LayoutDashboard, Menu, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomLogo } from './CustomLogo';
import { AnimalitoChat } from './AnimalitoChat';
import { HubData } from '../types';

export const PublicProfile = ({ hubData, onSwitchMode }: { hubData: any, onSwitchMode: () => void }) => {
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [leadData, setLeadData] = useState({ name: '', email: '' });
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
                    resource_requested: selectedProduct?.title || selectedProduct?.id || 'Recurso Desconocido'
                })
            });
            if (res.ok) {
                setSubmitted(true);
                trackEvent('resource_click', selectedProduct?.title || selectedProduct?.id);
                if (selectedProduct?.link) {
                    window.open(selectedProduct.link, '_blank');
                }
                setTimeout(() => setShowLeadModal(false), 2000);
            } else {
                alert("Error al enviar solicitud.");
            }
        } catch (err) {
            alert("Error de conexión.");
        }
    };

    // UI Theme configuration matching the requested aesthetics + app brand
    const bgColor = "#FDFBF7"; // clean warm beige/cream from the image
    const textColor = "#2A363B"; // dark charcoal/slate
    const btnColor = "#7E8A7A"; // muted sage green from the image

    return (
        <div className="min-h-screen font-sans" style={{ backgroundColor: bgColor, color: textColor }}>
            {/* Top Admin Bar */}
            <div className="bg-slate-900 text-white text-xs px-4 py-2 flex justify-between items-center sticky top-0 z-[60]">
                <span className="font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Viendo Perfil Público
                </span>
                <button onClick={onSwitchMode} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
                    <LayoutDashboard size={14} /> Volver al Panel
                </button>
            </div>

            {/* Navbar */}
            <nav className="border-b border-black/5 bg-[#F9F6F0]/80 backdrop-blur-md sticky top-[32px] z-50">
                <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CustomLogo className="w-12 h-12 -ml-2 drop-shadow-sm mix-blend-multiply opacity-90" />
                        <span className="text-xl md:text-2xl font-black tracking-tight">{hubData.title}</span>
                    </div>
                    <div className="hidden md:flex gap-8 text-[11px] font-bold opacity-80 uppercase tracking-widest leading-none">
                        <a href="#inicio" className="hover:opacity-100 transition-opacity">Inicio</a>
                        <a href="#acerca" className="hover:opacity-100 transition-opacity">Acerca De</a>
                        <a href="#recursos" className="hover:opacity-100 transition-opacity">Recursos</a>
                        <a href="#contacto" className="hover:opacity-100 transition-opacity">Contacto</a>
                    </div>
                    <a href={`https://wa.me/${hubData.whatsapp_number}`} target="_blank" rel="noreferrer" onClick={() => trackEvent('appointment_click')} className="hidden md:block text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:scale-105 transition-transform" style={{ backgroundColor: btnColor }}>
                        Agendar Cita
                    </a>
                    <button className="md:hidden">
                        <Menu size={24} />
                    </button>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto pb-24">

                {/* Hero Section */}
                <section id="inicio" className="flex flex-col items-center justify-center pt-24 pb-16 px-6 text-center relative">
                    <h1 className="text-6xl md:text-[5.5rem] font-serif font-black mb-6 tracking-tight text-[#2A363B]">{hubData.title}</h1>
                    <p className="max-w-2xl text-lg md:text-xl opacity-80 leading-relaxed font-medium mb-10 text-balance text-[#2A363B]">
                        {hubData.specialty}. Bienvenidos a un enfoque moderno y compasivo de la pediatría, donde la tecnología se une al cuidado familiar.
                    </p>
                    <a href="#acerca" className="text-white px-10 py-4 rounded-full text-base font-bold shadow-lg hover:scale-105 transition-transform inline-block" style={{ backgroundColor: btnColor }}>
                        Saber Más
                    </a>
                </section>

                <div className="w-full h-px bg-[#1a365d]/10 my-8"></div>

                {/* About Section */}
                <section id="acerca" className="py-16 px-6 grid md:grid-cols-2 gap-12 items-center">
                    <div className="rounded-3xl overflow-hidden aspect-square border-4 border-white shadow-xl relative bg-white flex items-center justify-center container-query">
                        {hubData.avatar_url ? (
                            <img src={hubData.avatar_url} alt={hubData.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[150px] font-black text-slate-100">
                                {hubData.title.charAt(0) || "D"}
                            </div>
                        )}
                        <div className="absolute bottom-6 bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-white flex gap-2 w-10/12 text-center items-center justify-center">
                            <ShieldCheck size={20} className="text-green-600 shrink-0" />
                            <span className="font-bold text-sm leading-tight text-slate-700">Licencia Médica Activa y Verificada</span>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-serif font-black mb-6 text-[#2A363B]">Sobre Nosotros</h2>
                        <p className="text-lg opacity-80 leading-relaxed font-medium mb-8 whitespace-pre-wrap text-[#2A363B]">
                            {hubData.bio_text}
                        </p>

                        <h3 className="text-2xl font-serif font-bold mb-4 text-[#2A363B]">Nuestra Misión</h3>
                        <p className="opacity-80 leading-relaxed font-medium mb-8 text-[#2A363B]">
                            Proporcionar atención pediátrica de la más alta calidad, apoyando a los padres con conocimiento, empatía y dedicación utilizando los mejores recursos disponibles.
                        </p>
                    </div>
                </section>

                <div className="w-full h-px bg-[#1a365d]/10 my-8"></div>

                {/* Resources Section & Intro Video */}
                <section id="recursos" className="py-16 px-6">
                    <h2 className="text-4xl md:text-5xl font-serif font-black mb-12 text-center text-[#2A363B]">Recursos Gratuitos</h2>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {JSON.parse(hubData.products_json || "[]").length > 0 ? JSON.parse(hubData.products_json).map((product: any) => (
                            <div key={product.id} className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-[#1a365d]/5 flex gap-6 items-center shadow-sm hover:shadow-md transition-shadow group">
                                <div className="w-24 h-24 bg-white rounded-2xl shadow-inner flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden relative">
                                    {product.image ? (
                                        <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                    ) : (
                                        product.type?.toLowerCase().includes('video') ? <Video size={32} className="text-[#dd8872]" /> : <BookOpen size={32} className="text-[#dd8872]" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold mb-2 leading-tight">{product.title}</h3>
                                    <p className="text-sm opacity-70 line-clamp-2 mb-4 font-medium">{product.tag}</p>
                                    <button
                                        onClick={() => {
                                            if (product.link && !product.type?.toLowerCase().includes('pdf') && !product.type?.toLowerCase().includes('guía')) {
                                                window.open(product.link, '_blank');
                                            } else {
                                                handleDownload(product);
                                            }
                                        }}
                                        className="text-white px-5 py-2.5 rounded-full text-xs font-bold transition-transform hover:-translate-y-0.5"
                                        style={{ backgroundColor: btnColor }}>
                                        {product.type?.toLowerCase().includes('video') ? "Ver Video" : "Obtener Recurso"}
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="md:col-span-2 text-center p-8 bg-white/40 rounded-3xl border border-[#1a365d]/10 border-dashed">
                                <BookOpen size={32} className="mx-auto text-slate-400 mb-3" />
                                <p className="font-medium text-slate-500">Próximamente agregaremos recursos descargables.</p>
                            </div>
                        )}
                    </div>

                    {hubData.intro_video_url && (
                        <div className="bg-white/60 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-[#1a365d]/5 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                            <div className="w-full md:w-1/2 aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg">
                                {(() => {
                                    const url = hubData.intro_video_url || '';
                                    const isVideoFile = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('blob.core.windows.net') || url.includes('amazonaws.com');
                                    
                                    if (isVideoFile) {
                                        return <video src={url} controls playsInline className="w-full h-full absolute inset-0 object-cover" />;
                                    }

                                    let embedUrl = url;
                                    if (url.includes('youtube.com/watch?v=')) {
                                        embedUrl = url.replace('watch?v=', 'embed/');
                                    } else if (url.includes('youtu.be/')) {
                                        embedUrl = url.replace('youtu.be/', 'youtube.com/embed/');
                                    } else if (url.includes('loom.com/share/')) {
                                        embedUrl = url.replace('/share/', '/embed/');
                                    } else if (url.includes('instagram.com/reel/')) {
                                        embedUrl = url.endsWith('/') ? `${url}embed` : `${url}/embed`;
                                    }

                                    return (
                                        <iframe
                                            className="w-full h-full absolute inset-0 bg-white"
                                            src={embedUrl}
                                            title="Video Introducción"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    );
                                })()}
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-black mb-3 text-[#1a365d]">Conoce Nuestro Enfoque</h3>
                                <p className="opacity-80 font-medium mb-6 text-lg">
                                    Aprende más sobre cómo cuidamos la salud integral de tu familia de manera empática y profesional.
                                </p>
                                <a href={hubData.intro_video_url} target="_blank" rel="noreferrer" className="text-white px-6 py-3 rounded-full text-sm font-bold inline-flex items-center gap-2 hover:scale-105 transition-transform" style={{ backgroundColor: btnColor }}>
                                    <Play size={16} className="fill-white" /> Ver Video en Grande
                                </a>
                            </div>
                        </div>
                    )}
                </section>

                <div className="w-full h-px bg-[#1a365d]/10 my-8"></div>

                {/* AI Agent Section */}
                <section className="py-16 px-6">
                    <div className="bg-white rounded-[3rem] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden shadow-xl border border-[#1a365d]/10">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#dd8872]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                        <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 bg-[#F9F6F0] rounded-full border-[12px] border-[#F9F6F0] flex items-center justify-center shadow-inner relative z-10 overflow-hidden group">
                            <div className="w-full h-full rounded-full overflow-hidden p-2 group-hover:scale-110 transition-transform duration-500">
                                <img src="/jiro.png" className="w-full h-full object-cover rounded-full shadow-sm" alt="Jiro Squirrel" />
                            </div>
                            <div className="absolute bottom-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-[#1a365d]">Jiro AI</div>
                        </div>

                        <div className="flex-1 text-center md:text-left relative z-10 w-full">
                            <h2 className="text-4xl md:text-5xl font-serif font-black mb-4 text-[#2A363B]">Conoce a tu Pediatra de IA</h2>
                            <p className="text-slate-600 text-lg font-medium leading-relaxed mb-8">
                                Un agente de IA entrenado para resolver dudas generales de salud infantil, brindarte sugerencias iniciales y conectarte de forma rápida con el doctor en tiempo real.
                            </p>

                            <button onClick={() => {
                                document.getElementById('animalito-chat-toggle')?.click();
                                trackEvent('chat_click');
                            }} className="w-full text-white px-5 md:px-8 py-4 rounded-full font-bold shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2 whitespace-nowrap" style={{ backgroundColor: btnColor }}>
                                <MessageCircle size={20} /> Hablar con Jiro IA Ahora
                            </button>
                        </div>
                    </div>
                </section>

                <div className="w-full h-px bg-[#1a365d]/10 my-8"></div>

                {/* Testimonials */}
                <section className="py-16 px-6">
                    <h2 className="text-4xl md:text-5xl font-serif font-black mb-16 text-center text-[#2A363B]">Testimonios</h2>
                    <div className="grid md:grid-cols-3 gap-12 md:gap-8">
                        {[
                            { name: "Familia Gómez", quote: "Excelente atención y empatía. Resolvieron todas mis dudas de manera profesional.", emoji: "👨‍👩‍👦" },
                            { name: "Ana Martínez", quote: "El sistema de acompañamiento en línea con Jiro IA nos ha salvado de muchas madrugadas de estrés.", emoji: "👩‍👧" },
                            { name: "Carlos y Luis", quote: "La clínica pediátrica más bonita y avanzada en la que hemos estado. Los recursos gratuitos son un 10.", emoji: "👨‍👨‍👦" },
                        ].map((t, i) => (
                            <div key={i} className="bg-white/60 backdrop-blur-md p-8 rounded-[2rem] border border-[#1a365d]/5 text-center relative pt-16 shadow-sm">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-[#F9F6F0] border-[6px] border-white overflow-hidden shadow-lg flex items-center justify-center text-4xl">
                                    {t.emoji}
                                </div>
                                <p className="italic font-serif text-[17px] opacity-80 mb-6 font-medium text-slate-700 leading-relaxed">
                                    "{t.quote}"
                                </p>
                                <span className="font-bold uppercase tracking-widest text-[#1a365d] text-xs">
                                    {t.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-white py-14 px-6 mt-12 border-t border-[#1a365d]/10" id="contacto">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10 text-slate-600">
                    <div className="text-left font-medium text-sm">
                        <p className="font-black text-xl mb-2 text-[#1a365d]">{hubData.title}</p>
                        <p className="mb-2 opacity-80">{hubData.specialty}</p>
                        {hubData.whatsapp_number && <p className="font-bold mb-4">Wa: +{hubData.whatsapp_number}</p>}
                        <p className="mt-2 text-[10px] opacity-60 max-w-[300px] leading-relaxed">
                            Aviso: Consulta a tu médico. Todo contenido en este portal es estrictamente con fines educativos y no reemplaza diagnóstico clínico.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 font-bold text-sm text-[#1a365d]">
                        <span className="opacity-50 text-xs mb-2 uppercase tracking-widest">Atajos</span>
                        <a href="#inicio" className="hover:text-[#dd8872]">Inicio</a>
                        <a href="#acerca" className="hover:text-[#dd8872]">Acerca de nosotros</a>
                        <a href="#recursos" className="hover:text-[#dd8872]">Recursos</a>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-6 text-[#1a365d]">
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 bg-[#F9F6F0] rounded-full flex items-center justify-center hover:bg-[#dd8872] hover:text-white transition-colors"><Instagram size={20} /></a>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-sm bg-slate-50 px-4 py-2 rounded-xl">
                            <CustomLogo className="w-5 h-5" /> Powered by Growtria
                        </div>
                    </div>
                </div>
            </footer>

            {/* Fixed Elements */}
            {hubData.whatsapp_number && (
                <div className="fixed bottom-6 left-6 z-40 hidden md:block">
                    <a href={`https://wa.me/${hubData.whatsapp_number}`} onClick={() => trackEvent('whatsapp_click')} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white p-4 rounded-full shadow-xl shadow-[#25D366]/30 flex hover:scale-105 transition-transform group">
                        <MessageCircle size={28} />
                    </a>
                </div>
            )}
            {hubData.whatsapp_number && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 md:hidden pointer-events-none w-full max-w-[420px] px-6 flex justify-between items-end">
                    <a href={`https://wa.me/${hubData.whatsapp_number}`} onClick={() => trackEvent('whatsapp_click')} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white p-4 rounded-full shadow-xl shadow-[#25D366]/30 pointer-events-auto hover:scale-105 transition-transform relative group">
                        <MessageCircle size={28} />
                    </a>
                </div>
            )}

            <AnimalitoChat animalito={{ type: "squirrel", name: "Jiro", color: "bg-[#dd8872]", textColor: "text-white", emoji: "" }} doctorName={hubData.title} slug={hubData.slug} />

            {/* Lead Modal */}
            <AnimatePresence>
                {showLeadModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-[#1a365d]/80 backdrop-blur-sm z-[100]"
                            onClick={() => setShowLeadModal(false)}
                        />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] z-[101] overflow-hidden sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[2.5rem] shadow-2xl"
                        >
                            {!submitted ? (
                                <div className="p-8">
                                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden" />
                                    <div className="text-center mb-6">
                                        <span className="text-[10px] uppercase font-black text-[#5b6b55] bg-[#6d7f67]/10 px-3 py-1 rounded-full mb-3 inline-block">Descarga Libre</span>
                                        <h3 className="font-black text-xl text-[#1a365d] leading-tight">{selectedProduct?.title}</h3>
                                    </div>
                                    <form onSubmit={submitDownload} className="space-y-4">
                                        <div>
                                            <input required type="text" placeholder="Tu Nombre (Ej. Mariana)" className="w-full bg-[#F9F6F0] border border-black/5 rounded-2xl px-5 py-4 outline-none focus:border-[#dd8872] focus:bg-white transition-colors text-sm font-medium shadow-inner" value={leadData.name} onChange={e => setLeadData({ ...leadData, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <input required type="email" placeholder="Tu Correo Electrónico (Para enviar el PDF)" className="w-full bg-[#F9F6F0] border border-black/5 rounded-2xl px-5 py-4 outline-none focus:border-[#dd8872] focus:bg-white transition-colors text-sm font-medium shadow-inner" value={leadData.email} onChange={e => setLeadData({ ...leadData, email: e.target.value })} />
                                        </div>
                                        <button type="submit" className="w-full text-white rounded-2xl py-4 font-bold text-base shadow-lg shadow-[#6d7f67]/20 mt-4 flex justify-center items-center gap-2 hover:bg-[#5b6b55] transition-colors" style={{ backgroundColor: btnColor }}>
                                            Descargar PDF <ArrowRight size={18} />
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center px-4 pt-2 leading-relaxed">
                                            Tu privacidad es importante. Solo usamos estos datos para darte acceso al recurso.
                                        </p>
                                    </form>
                                </div>
                            ) : (
                                <div className="p-12 text-center flex flex-col items-center justify-center">
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-24 h-24 bg-[#6d7f67]/10 text-[#6d7f67] rounded-full flex items-center justify-center mb-6">
                                        <CheckCircle2 size={48} />
                                    </motion.div>
                                    <h3 className="text-2xl font-black text-[#1a365d] mb-2">¡Listo, {leadData.name.split(' ')[0]}!</h3>
                                    <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                        Tu descarga debería comenzar automáticamente.
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
