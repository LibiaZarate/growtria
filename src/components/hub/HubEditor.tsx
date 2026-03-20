import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Smartphone, Link as LinkIcon, Settings, Plus, Users, ArrowUpRight, BarChart3, Copy, Check } from 'lucide-react';
import PublicHub from './PublicHub';

export default function HubEditor() {
    const [activeTab, setActiveTab] = useState<'editor' | 'leads' | 'analytics'>('editor');
    const [copied, setCopied] = useState(false);

    const copyLink = () => {
        navigator.clipboard.writeText("clinicsarquitect.com/dra-gabriela");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="h-[calc(100vh-160px)] flex flex-col glass-card rounded-3xl overflow-hidden"
        >
            <div className="p-6 flex items-center justify-between glass-card border-b border-white/40">
                <div className="flex items-center gap-3">
                    <div className="bg-white text-gray-800 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 p-2 rounded-3xl">
                        <LinkIcon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Capa 2: Hub Educativo (Link-in-Bio)</h2>
                        <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Captación & Conversión</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex bg-white/50 rounded-2xl p-1 border border-white/60 shadow-sm">
                        <button
                            onClick={() => setActiveTab('editor')}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Diseño
                        </button>
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2 ${activeTab === 'leads' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Leads <span className="bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full">New</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Panel Izquierdo: Configuración */}
                <div className="w-1/2 flex flex-col border-r border-white/40 overflow-y-auto bg-white/30 backdrop-blur-sm">
                    {activeTab === 'editor' ? (
                        <div className="p-8 space-y-8">

                            <div className="bg-white p-6 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold flex items-center gap-2"><Smartphone className="w-4 h-4 text-indigo-500" /> Tu Link Público</h3>
                                    <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Activo</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                                    <span className="text-sm text-slate-500 flex-1 truncate">clinicsarquitect.com/dra-gabriela</span>
                                    <button onClick={copyLink} className="p-2 bg-white rounded-xl shadow-sm text-slate-600 hover:text-indigo-600 transition-colors">
                                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-slate-800">Lead Magnet (Captación)</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Texto del botón principal</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-2xl bg-white/60 border border-white/40 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none" defaultValue="Guía: Sueño Infantil" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Archivo a entregar (PDF)</label>
                                        <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl p-6 text-center cursor-pointer hover:bg-indigo-50 transition-colors">
                                            <Plus className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
                                            <span className="text-sm font-bold text-indigo-600">Subir guía PDF</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-6 border-t border-white/40">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">Conexión con Análisis (Capa 1)</h3>
                                <p className="text-sm text-slate-500">Los 2 posts con mejor "Impacto" según tu último análisis con IA se mostrarán automáticamente en el Hub.</p>

                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-4">
                                    <BarChart3 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-bold text-indigo-900 text-sm">Contenido Top Detectado</h4>
                                        <p className="text-xs text-indigo-700/80 mt-1">Actualmente sincronizando con el análisis de ayer. Reel de "Fiebre" tiene 92% de impacto.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-xl text-slate-800">Leads en WhatsApp</h3>
                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">12 leads este mes</span>
                            </div>

                            {[1, 2, 3].map((lead, i) => (
                                <div key={i} className="bg-white p-5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-white/60 flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-colors">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold text-lg">
                                            {['M', 'A', 'S'][i]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{['María Sánchez', 'Ana López', 'Sofía Ruiz'][i]}</h4>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                Descargó: Guía de Sueño
                                            </p>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-xl text-sm font-bold transition-colors">
                                        WhatsApp <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Preview del Móvil */}
                <div className="w-1/2 bg-slate-100/50 flex items-center justify-center p-8 border-l border-white/40">
                    <div className="w-[375px] h-[812px] shadow-2xl rounded-[40px] flex-shrink-0">
                        <PublicHub preview={true} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
