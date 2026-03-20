import React, { useState } from 'react';
import { Download, ArrowRight, Instagram, Play, CheckCircle2, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface PublicHubProps {
    preview?: boolean;
}

export default function PublicHub({ preview = false }: PublicHubProps) {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (preview) {
            alert(`[Vista Previa] Captura de lead: ${formData.name} - ${formData.phone}`);
        } else {
            alert(`Redirigiendo a WhatsApp con el número ${formData.phone}`);
        }
        setShowModal(false);
    };

    return (
        <div className={`bg-[#FDFCF8] text-slate-800 font-sans ${preview ? 'h-full overflow-y-auto rounded-3xl border-8 border-slate-900 shadow-2xl relative' : 'min-h-screen'}`}>
            {/* Hero Section */}
            <div className="max-w-md mx-auto px-6 pt-16 pb-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mb-6">
                    <img
                        src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
                        alt="Dr. Perfil"
                        className="w-full h-full object-cover"
                    />
                </div>

                <h1 className="text-2xl font-bold tracking-tight mb-2">Dra. Gabriela Zárate</h1>
                <p className="text-slate-500 font-medium mb-6">Pediatra ProFamilia | Especialista en Crecimiento</p>

                <p className="text-slate-600 leading-relaxed mb-8">
                    Acompañando a mamás en la aventura de criar niños sanos, fuertes y felices, sin culpa y con ciencia.
                </p>

                {/* Primary CTA (Lead Magnet) */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowModal(true)}
                    className="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-[0_12px_24px_rgba(79,70,229,0.2)] flex items-center justify-between mb-8 transition-shadow hover:shadow-[0_16px_32px_rgba(79,70,229,0.3)]"
                >
                    <div className="flex items-center gap-3">
                        <Download className="w-6 h-6" />
                        <span className="text-lg">Guía: Sueño Infantil</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-200" />
                </motion.button>

                {/* Secondary Links Base */}
                <div className="w-full space-y-4">
                    <a href="#" onClick={(e) => preview && e.preventDefault()} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-green-50 text-emerald-500 flex items-center justify-center mr-4">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-slate-800">Agendar Consulta</h3>
                            <p className="text-xs text-slate-500">Respondemos por WhatsApp</p>
                        </div>
                    </a>

                    <a href="#" onClick={(e) => preview && e.preventDefault()} className="flex items-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-rose-500 flex items-center justify-center mr-4">
                            <Instagram className="w-5 h-5" />
                        </div>
                        <div className="text-left flex-1">
                            <h3 className="font-bold text-slate-800">Mi Día a Día</h3>
                            <p className="text-xs text-slate-500">Únete a la comunidad</p>
                        </div>
                    </a>
                </div>
            </div>

            {/* Featured Content Area (From Hub) */}
            <div className="max-w-md mx-auto px-6 py-8">
                <h2 className="text-lg font-bold mb-4">Lo más popular (IA)</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer">
                        <div className="absolute inset-x-0 top-0 h-24 bg-slate-100">
                            <img src="https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Video cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white opacity-80" />
                            </div>
                        </div>
                        <div className="pt-26 mt-24">
                            <p className="text-sm font-semibold line-clamp-2">Por qué la fiebre no siempre es mala</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group cursor-pointer">
                        <div className="absolute inset-x-0 top-0 h-24 bg-slate-100">
                            <img src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover" alt="Video cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Play className="w-8 h-8 text-white opacity-80" />
                            </div>
                        </div>
                        <div className="pt-26 mt-24">
                            <p className="text-sm font-semibold line-clamp-2">3 Mitos de la lactancia materna</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center py-12 px-6">
                <p className="text-xs text-slate-400 font-medium pb-8 border-b border-slate-200">
                    Powered by Clinics Arquitect Media
                </p>
            </div>

            {/* Modal / Flow Lead Capture */}
            {showModal && (
                <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${preview ? 'absolute' : 'p-4'}`}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`w-full ${preview ? '' : 'max-w-sm rounded-3xl'} bg-white p-6 relative z-10 shadow-2xl ${preview ? 'rounded-t-3xl min-h-[50%]' : ''}`}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
                                <Download className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Descargar Guía Mínima</h3>
                                <p className="text-sm text-slate-500">A tu WhatsApp</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tu Nombre</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ej. María"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                                <input
                                    required
                                    type="tel"
                                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="+52 55..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 text-center bg-indigo-600 text-white font-bold rounded-2xl mt-2 hover:bg-indigo-700 transition"
                            >
                                Obtener y Enviar
                            </button>
                            <p className="text-xs text-center text-slate-400">100% Seguro. Cero Spam.</p>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
