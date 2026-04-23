import React, { useState, useEffect } from "react";
import {
  Instagram, Cpu, Key, Zap, Loader2, CheckCircle2, TrendingUp,
  MessageSquare, ExternalLink, BarChart3, Lightbulb, Eye, ArrowLeft,
  History, Lock, Settings, Sparkles, Save, User, User as UserIcon, LogOut,
  Trash2, AlertCircle, LayoutDashboard, Smartphone, BookOpen, Play, Video, Plus, Edit2, Clock, Users, Send, MapPin, Calendar, CheckCircle, Search, CalendarDays, ArrowRight, MessageCircle,
  Paperclip, Sliders, Mic, ArrowUp, LayoutGrid, Heart, PlaySquare, Target, Bot, Home, Link as LinkIcon, Download, RefreshCw, BarChart2, Hash, CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Provider, UserData, AnalysisResult, RunHistoryItem, ChatMessage, View, UserSettings, SummaryStats, HubData } from "./types";
import { MOCK_DOCTOR } from "./mockData";
import { CustomLogo } from "./components/CustomLogo";
import { PublicProfile } from "./components/PublicProfile";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const safeText = (val: any) => typeof val === 'object' && val !== null ? Object.values(val).join(' — ') : String(val || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const signOut = async () => supabase.auth.signOut();
  
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mode, setMode] = useState<'admin' | 'public'>('admin');
  const [view, setView] = useState<View>("dashboard");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsSignedIn(!!session);
      setToken(session?.access_token || null);
      setIsLoaded(true);
    }).catch(err => {
      console.error("Supabase auth error:", err);
      setIsLoaded(true);
    });

    // Failsafe: if supabase hangs, force load after 3 seconds
    setTimeout(() => setIsLoaded(true), 3000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsSignedIn(!!session);
      setToken(session?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [leads, setLeads] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // GLOBAL TOAST STATE
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // DATA STATE
  const [settings, setSettings] = useState<UserSettings>({
    instagram_url: "", ai_provider: "gemini", ai_api_key: "", apify_token: "",
    brand_values: "", brand_personality: "", brand_vision: "",
    product_service: "", big_promise: "", problems_solved: "", unique_mechanism: ""
  });
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [history, setHistory] = useState<RunHistoryItem[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [hub, setHub] = useState<HubData | null>(null);

  // ANALYZE STATE
  const [instagramUrl, setInstagramUrl] = useState("");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [contentType, setContentType] = useState<"all" | "posts" | "reels">("all");
  const [apiKey, setApiKey] = useState("");
  const [apifyToken, setApifyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState<"input" | "processing" | "result">("input");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // CHAT STATE
  const [currentChatMessage, setCurrentChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // LIFECYCLES
  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (token) {
      if (session?.user) {
        setUser({ 
           id: session.user.id, 
           email: session.user.email,
           username: session.user.email?.split('@')[0] || "Doctor"
        });
      }
      fetchHistory();
      fetchSettings();
      fetchSummary();
      fetchChatMessages();
      fetchHub();
      fetchLeads();
      fetchMetrics();
    }
  }, [token, session]);

  // BACKEND CALLS
  const fetchChatMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/chat/messages", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) { }
  };

  const sendChatMessage = async (e?: React.FormEvent, directMessage?: string) => {
    if (e) e.preventDefault();
    const userMsg = directMessage || currentChatMessage.trim();
    if (!token || !userMsg || chatLoading) return;

    setCurrentChatMessage("");
    setChatLoading(true);
    setChatMessages(prev => [...prev, { id: 'temp', role: "user", content: userMsg, created_at: new Date().toISOString() }]);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => prev.map(m => m.id === 'temp' ? { ...m, id: Date.now().toString() + "_user" } : m).concat({ id: Date.now().toString() + "_ai", role: data.role, content: data.content, created_at: new Date().toISOString() }));
      } else {
        const data = await res.json();
        setError(data.error);
        setChatMessages(prev => prev.filter(m => m.id !== 'temp'));
      }
    } catch (err: any) { setError(err.message); } finally { setChatLoading(false); setView('chat'); }
  };

  const discussAnalysis = () => {
    setView('chat');
    setTimeout(() => {
      const prompt = `Hola Jiro, acabo de terminar un análisis de mis últimos Reels. ¿Podrías darme ideas de contenido específicas basadas en mi identidad de marca (panel de ajustes) y las recomendaciones que encontró el analizador?`;
      sendChatMessage(undefined, prompt);
    }, 100);
  };

  const clearChat = async () => {
    if (!token || !window.confirm("¿Seguro de borrar historial?")) return;
    try {
      if ((await fetch("/api/chat/messages", { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } })).ok) setChatMessages([]);
    } catch (err) { }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/settings", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data.user_id) {
          setSettings({ ...data });
          setInstagramUrl(data.instagram_url || ""); setProvider(data.ai_provider || "gemini");
          setApiKey(data.ai_api_key || ""); setApifyToken(data.apify_token || "");
          setShowAdvanced(!(data.ai_api_key && data.apify_token));
        } else setShowAdvanced(true);
      }
    } catch (err) { setShowAdvanced(true); }
  };

  const fetchSummary = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/summary", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) setSummary(await res.json());
    } catch (err) { }
  };

  const fetchLeads = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/leads", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : []);
      }
    } catch (err) { }
  };

  const fetchMetrics = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/metrics", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMetrics(Array.isArray(data) ? data : []);
      }
    } catch (err) { }
  };

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const handleStripeConnect = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/stripe/connect/onboard", { 
        method: "POST", 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast("Error al conectar con Stripe", "error");
      }
    } catch (e) {
      showToast("Error de conexión con Stripe", "error");
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(settings) });
      if (res.ok) {
        setInstagramUrl(settings.instagram_url); setProvider(settings.ai_provider);
        setApiKey(settings.ai_api_key); setApifyToken(settings.apify_token);
        setSaveStatus("success"); setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (err) { setSaveStatus("idle"); }
  };


  const fetchHub = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/hub", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        setHub(await res.json());
        setError(null);
      } else {
        const err = await res.json();
        setError(err.error || "Error al cargar la página");
      }
    } catch (err: any) { 
      setError(err.message);
    }
  };

  const [hubSaveStatus, setHubSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const saveHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !hub) return;
    setHubSaveStatus("saving");
    try {
      const res = await fetch("/api/hub", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(hub) });
      if (res.ok) {
        setHubSaveStatus("success"); setTimeout(() => setHubSaveStatus("idle"), 3000);
      } else {
        setHubSaveStatus("idle");
      }
    } catch (err) { setHubSaveStatus("idle"); }
  };

  const handleLogout = () => signOut();

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/history", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        setHistory([]);
      }
    } catch (err) { setHistory([]); }
  };

  const loadRun = async (runId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/runs/${runId}`, { headers: { "Authorization": `Bearer ${token}` } });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setResult({
        runId: data.run.id, status: data.run.status,
        insights: {
          summary: data.insights.summary, top_posts_analysis: data.insights.top_posts_json,
          patterns: JSON.parse(data.insights.patterns_json), recommendations: JSON.parse(data.insights.recommendations_json),
          avatar_analysis: data.insights.avatar_analysis_json ? JSON.parse(data.insights.avatar_analysis_json) : undefined,
          predictions: data.insights.predictions_json ? JSON.parse(data.insights.predictions_json) : undefined
        },
        topPosts: data.topPosts.map((p: any) => ({
          url: p.post_url, thumbnail: p.thumbnail_url, impactScore: p.impact_score,
          likes: p.likes_count, comments: p.comments_count, shares: p.shares_count || 0, plays: p.plays_count || 0
        }))
      });
      setStep("result");
    } catch (err) { } finally { setLoading(false); }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault(); if (!token) return;
    setLoading(true); setError(null); setStep("processing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ instagramUrl: instagramUrl.trim(), provider, contentType, apiKey: apiKey.trim(), apifyToken: apifyToken.trim() }),
      });
      if (res.status === 401) { handleLogout(); throw new Error("Sesión expirada"); }
      if (!res.ok) throw new Error((await res.json()).error || "Fallo análisis");
      setResult(await res.json()); setStep("result"); fetchHistory(); fetchSummary();
    } catch (err: any) { setError(err.message); setStep("input"); } finally { setLoading(false); }
  };

  const [uploadingState, setUploadingState] = useState<{ [key: string]: boolean }>({});

  const handleFileUpload = async (index: number, field: 'image' | 'link', file: File) => {
    if (!token) return;
    const uploadKey = `${index}-${field}`;
    setUploadingState(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        handleProductChange(index, field, data.url);
      } else {
        showToast("Error al subir el archivo");
      }
    } catch (err) {
      showToast("Error de red al intentar subir el archivo");
    } finally {
      setUploadingState(prev => ({ ...prev, [uploadKey]: false }));
    }
  };

  const parsedProducts = React.useMemo(() => {
    try {
      const parsed = hub ? JSON.parse(hub.products_json || "[]") : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [hub?.products_json]);
  const handleProductChange = (index: number, field: string, value: string) => {
    const updated = [...parsedProducts];
    updated[index][field] = value;
    setHub({ ...hub, products_json: JSON.stringify(updated) } as any);
  };
  const handleAddProduct = (type: 'pdf' | 'video') => {
    const fresh = [...parsedProducts, {
      id: Date.now().toString(),
      type: type === 'pdf' ? 'Guía PDF' : 'Video',
      title: '',
      tag: '',
      image: '',
      link: '',
      price: 0
    }];
    setHub({ ...hub, products_json: JSON.stringify(fresh) } as any);
  };
  const handleRemoveProduct = (index: number) => {
    if (!window.confirm("¿Borrar este recurso?")) return;
    const updated = [...parsedProducts];
    updated.splice(index, 1);
    setHub({ ...hub, products_json: JSON.stringify(updated) } as any);
  };

  // ----- AUTH SCREEN -----
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) showToast(error.message, "error");
    setAuthLoading(false);
  };

  if (!isLoaded) {
    return <div className="w-full h-screen flex items-center justify-center bg-[#fdfbf7]"><Loader2 className="w-10 h-10 animate-spin text-[#7E8A7A]" /></div>;
  }
  if (!isSignedIn) {
    return (
      <div className="w-full min-h-[100vh] flex items-center justify-center bg-[#fdfbf7] p-4 lg:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-5xl bg-[#fffdfa] shadow-[0_20px_60px_rgba(200,180,160,0.15)] rounded-[3rem] overflow-hidden flex flex-col md:flex-row border border-[#faebd8]"
        >
          {/* IMAGE SIDE */}
          <div className="hidden md:flex md:w-1/2 bg-[#fdfbf7] items-center justify-center relative overflow-hidden">
             <div className="w-[85%] aspect-square rounded-full overflow-hidden flex items-center justify-center bg-[#fdfbf7] shadow-[inset_0_4px_30px_rgba(200,180,160,0.2)]">
                <img src="/logo.png" alt="Tree of Life" className="w-[110%] h-[110%] object-cover z-20 mix-blend-multiply opacity-95 hover:scale-110 transition-transform duration-1000 ease-out" />
             </div>
          </div>

          {/* FORM SIDE */}
          <div className="w-full md:w-1/2 p-10 lg:p-16 flex flex-col justify-center items-center space-y-8 bg-[#fffdfa]">
            <div className="text-center space-y-2 w-full">
              <div className="md:hidden flex items-center justify-center mx-auto mb-6">
                <img src="/logo.png" alt="Logo" className="w-32 h-32 rounded-full object-cover mix-blend-multiply drop-shadow-sm" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-[#2d2824]">Growtria</h1>
              <p className="text-[#867562] font-medium tracking-wide mb-8">Inicia sesión con tu cuenta segura</p>
            </div>
            
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#867562] mb-1">Email</label>
                <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} required className="w-full bg-white border border-[#ececeb] rounded-2xl px-4 py-3 text-[#2d2824] outline-none focus:border-[#7E8A7A]" placeholder="tu@email.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#867562] mb-1">Contraseña</label>
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} required className="w-full bg-white border border-[#ececeb] rounded-2xl px-4 py-3 text-[#2d2824] outline-none focus:border-[#7E8A7A]" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={authLoading} className="w-full bg-[#7E8A7A] hover:bg-[#6b7567] text-white font-bold py-3 px-4 rounded-2xl transition-colors mt-4 flex justify-center items-center">
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ingresar"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ----- PATIENT SCREEN -----
  if (mode === 'public' && hub) {
    return <PublicProfile hubData={hub} onSwitchMode={() => setMode('admin')} />;
  }

  // --- ADMIN PANEL CONTENT (SETO AESTHETIC) ---
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'editor', label: 'Studio Público', icon: Smartphone },
    { id: 'products', label: 'Infoproductos', icon: BookOpen },
    { id: 'videos', label: 'Librería Videos', icon: Play },
    { id: 'metrics', label: 'Métricas', icon: BarChart3 },
    { divider: true, id: 'd1' },
    { id: 'analyze', label: 'Analizar Reels', icon: Zap },
    { id: 'chat', label: 'IA Creativa (Jiro)', icon: Sparkles },
    { id: 'history', label: 'Historial', icon: History },
  ];

  return (
    <div className="flex h-[100vh] w-full p-2 sm:p-4 md:p-6 lg:p-8 box-border">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#2c2c2c] text-[#f5e3ce]'}`}>
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-1 overflow-hidden bg-[#fffdfa] rounded-[2.5rem] shadow-[0_8px_40px_rgb(0,0,0,0.06)] border border-white backdrop-blur-md relative font-sans text-slate-800">

        {/* LEFT SIDEBAR */}
        <aside className="w-[240px] xl:w-[260px] bg-transparent flex-shrink-0 flex-col hidden md:flex border-r border-[#ececeb] z-10 relative">
          <div className="px-8 pt-8 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900">
              <CustomLogo className="w-12 h-12 -ml-2 drop-shadow-sm mix-blend-multiply opacity-90" />
              <span className="font-bold text-xl tracking-tight leading-none text-slate-900">Growtria</span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 hide-scrollbar">
            {navItems.map((item, i) => {
              if (item.divider) return <div key={i} className="my-6" />;
              return (
                <button key={item.id} onClick={() => setView(item.id as View)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-[13px] font-bold transition-all ${view === item.id ? "bg-[#f5e3ce] text-[#4a3b32] shadow-sm" : "text-slate-500 hover:text-slate-900 hover:bg-[#faebd8]/50"}`}>
                  <item.icon size={16} className={view === item.id ? "text-[#4a3b32]" : "text-slate-400"} /> {item.label}
                </button>
              )
            })}
          </nav>

          <div className="p-4 mt-auto">
            <button onClick={() => setView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-xs font-semibold transition-all mb-4 ${view === 'settings' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
              <Settings size={16} /> Panel de Ajustes
            </button>
            <div className="bg-gradient-to-br from-[#f8eedc] to-[#fce4cd] border border-white p-4 rounded-[2rem] shadow-[0_4px_10px_rgba(200,150,100,0.1)] text-[#4a3b32] relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <img src={hub?.avatar_url || MOCK_DOCTOR.image} className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" alt="" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black truncate leading-tight">{hub?.title || user?.username || user?.email.split('@')[0]}</p>
                  <p className="text-[10px] text-[#7a6a5a] truncate font-bold uppercase tracking-wide">Plan Growth PRO</p>
                </div>
              </div>
              <button onClick={() => setMode('public')} className="w-full bg-white/80 hover:bg-white backdrop-blur-sm transition-colors text-[#4a3b32] text-[11px] font-bold py-2.5 rounded-full flex items-center justify-center gap-2 relative z-10 shadow-sm">
                Ver Link in Bio
              </button>
            </div>
            <button onClick={handleLogout} className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600">
              <LogOut size={14} /> Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* MAIN CENTER CONTENT */}
        <div className="flex-1 flex flex-col relative overflow-y-auto hide-scrollbar z-0 w-full">
          {view === 'dashboard' && (
            <div className="flex flex-col min-h-full pb-8 pt-16 animate-in fade-in duration-500">
              <div className="text-center px-4 max-w-2xl mx-auto w-full">
                <div className="w-32 h-32 mx-auto mb-4 relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#fbc2eb] to-[#e6d0a1] opacity-30 rounded-full blur-2xl animate-pulse" />
                  <svg width="120" height="120" viewBox="0 0 120 120" className="relative z-10 drop-shadow-sm">
                    <defs>
                      <linearGradient id="star-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f5aa96" />
                        <stop offset="100%" stopColor="#b4c7d6" />
                      </linearGradient>
                      <linearGradient id="star-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#c6aed6" />
                        <stop offset="100%" stopColor="#e6bca3" />
                      </linearGradient>
                    </defs>
                    <g transform="rotate(45 60 60)">
                      <path d="M 60 20 Q 60 60 100 60 Q 60 60 60 100 Q 60 60 20 60 Q 60 60 60 20 Z" fill="url(#star-grad-1)" opacity="0.6" />
                    </g>
                    <path d="M 60 0 Q 60 60 120 60 Q 60 60 60 120 Q 60 60 0 60 Q 60 60 60 0 Z" fill="url(#star-grad-2)" opacity="0.85" />
                    <circle cx="60" cy="60" r="15" fill="#fff" opacity="0.6" style={{ filter: 'blur(6px)' }} />
                  </svg>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 mb-3">Welcome, {user?.username || user?.email.split('@')[0]}!</h1>
                <p className="text-slate-500 font-medium tracking-wide">How can I help you today?</p>
              </div>

              <div className="mt-16 w-full max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-auto">
                <div onClick={() => setView('products')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#e5e0d8] hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">⭐</div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">Crear recursos</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">Crea PDFs o videos para captar pacientes desde redes.</p>
                </div>
                <div onClick={() => { setView('analyze'); setStep('input'); }} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#e5e0d8] hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">🪄</div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">Analizar Tendencia</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">Extrae insights automáticos de cualquier reel viral de Instagram.</p>
                </div>
                <div onClick={() => setView('chat')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-[#e5e0d8] hover:shadow-md transition-all cursor-pointer group">
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">🎨</div>
                  <h3 className="font-bold text-sm text-slate-900 mb-1.5">Estrategia Jiro</h3>
                  <p className="text-[13px] text-slate-500 leading-relaxed">Aplica guías visuales y estéticas curadas a tus ideas médicas.</p>
                </div>
              </div>

              <div className="mt-auto px-6 w-full max-w-4xl mx-auto">
                <div className="bg-white p-2.5 rounded-[2rem] shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-[#ececeb] flex flex-col gap-3 relative z-20">
                  <div className="px-4 pt-2 pb-1 flex items-center gap-3">
                    <Sparkles size={16} className="text-amber-500" />
                    <input
                      type="text"
                      placeholder="Initiate a query or send a command to the AI..."
                      className="w-full bg-transparent outline-none text-[13px] font-medium placeholder-slate-400 text-slate-800 focus:placeholder-slate-300"
                      value={currentChatMessage}
                      onChange={e => setCurrentChatMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { sendChatMessage(e); }
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center bg-slate-50/50 rounded-3xl p-1">
                    <div className="flex gap-1.5">
                      <button className="flex items-center gap-1.5 bg-white shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors"><Paperclip size={12} /> Attach</button>
                      <button onClick={() => setView('settings')} className="flex items-center gap-1.5 bg-white shadow-sm border border-slate-100 hover:bg-slate-50 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors hidden sm:flex"><Settings size={12} /> Settings</button>
                    </div>
                    <div className="flex gap-2 items-center mr-1">
                      <button className="text-slate-400 hover:text-slate-600 p-2 transition-colors"><Mic size={16} /></button>
                      <button onClick={sendChatMessage} className="bg-gradient-to-b from-[#e3a18a] to-[#d87b64] text-white w-9 h-9 rounded-full flex items-center justify-center hover:scale-[1.05] transition-transform shadow-md"><ArrowUp size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view !== 'dashboard' && (
            <div className="p-8 pb-32 max-w-3xl mx-auto w-full animate-in fade-in">

              {view === 'editor' && (
                <>
                  {!hub ? (
                    <div className="flex flex-col items-center justify-center p-20 bg-slate-50 rounded-3xl border border-slate-200">
                      <Loader2 size={32} className="animate-spin text-slate-400 mb-4" />
                      <h3 className="text-lg font-bold text-slate-600">Cargando tu Studio...</h3>
                      <p className="text-sm text-slate-400 text-center max-w-sm mt-2">Si esto tarda demasiado, recarga la página o verifica tu conexión.</p>
                      {error && <p className="text-sm font-bold text-red-500 mt-4 border border-red-200 bg-red-50 px-4 py-2 rounded-xl text-center">Error: {error}</p>}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-semibold tracking-tight">Studio Público</h2>
                        <button onClick={() => setMode('public')} className="flex items-center gap-2 bg-[#1a365d] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:scale-105 transition-transform">
                          <ExternalLink size={16} /> Ver Mi Página de Pacientes
                        </button>
                      </div>
                      <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <form onSubmit={saveHub} className="space-y-6">
                          <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><UserIcon size={20} className="text-[#dd8872]" /> Información Médica y Contacto</h3>
                          
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
                              {hub.avatar_url ? <img src={hub.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={24} className="text-slate-400" />}
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-500 block mb-2">Foto de Perfil del Profesional</label>
                              <label className="bg-slate-100 font-bold text-slate-600 px-4 py-2 text-xs rounded-xl cursor-pointer hover:bg-slate-200 transition-colors inline-block text-center shadow-sm">
                                 {uploadingState['profile-avatar'] ? <Loader2 size={14} className="animate-spin" /> : "Subir/Cambiar Foto"}
                                 <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                   if (e.target.files?.[0]) {
                                     setUploadingState(prev => ({...prev, 'profile-avatar': true}));
                                     const fd = new FormData(); fd.append("file", e.target.files[0]);
                                     fetch('/api/upload', { method: "POST", headers: {"Authorization": `Bearer ${token}`}, body: fd })
                                       .then(r => r.json()).then(data => setHub({...hub, avatar_url: data.url}))
                                       .finally(() => setUploadingState(prev => ({...prev, 'profile-avatar': false})));
                                   }
                                 }} />
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Nombre Público del Doctor/Clínica</label><input required value={hub.title} onChange={e => setHub({ ...hub, title: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-[#dd8872] transition-colors" /></div>
                            <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Tu Enlace (Slug)</label><div className="flex bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-[#dd8872] focus-within:bg-white transition-colors"><span className="pl-4 py-3 text-sm font-bold text-slate-400">growtria.com/</span><input required value={hub.slug} onChange={e => setHub({ ...hub, slug: e.target.value })} className="w-full bg-transparent px-2 py-3 text-sm outline-none font-medium text-slate-700" /></div></div>
                            <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Especialidad</label><input required value={hub.specialty} onChange={e => setHub({ ...hub, specialty: e.target.value })} placeholder="Ej. Pediatra Pro-lactancia" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-[#dd8872] transition-colors" /></div>
                            <div><label className="text-[11px] font-bold text-slate-500 block mb-1">WhatsApp para Pacientes</label><input value={hub.whatsapp_number || ""} onChange={e => setHub({ ...hub, whatsapp_number: e.target.value })} placeholder="521..." className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-[#dd8872] transition-colors" /></div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-500 block mb-1">Video de Introducción (Enlace a Reels/YouTube o Sube tu Video)</label>
                            <div className="flex gap-2">
                              <input value={hub.intro_video_url || ''} onChange={e => setHub({ ...hub, intro_video_url: e.target.value })} placeholder="https://..." className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-[#dd8872] transition-colors" />
                              <label className="flex-shrink-0 bg-slate-100 text-slate-600 px-4 py-3 flex items-center justify-center rounded-2xl hover:bg-slate-200 cursor-pointer text-xs font-bold gap-2">
                                {uploadingState['intro-video'] ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />} Subir
                                <input type="file" className="hidden" accept="video/*" onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    setUploadingState(prev => ({...prev, 'intro-video': true}));
                                    const fd = new FormData(); fd.append("file", e.target.files[0]);
                                    fetch('/api/upload', { method: "POST", headers: {"Authorization": `Bearer ${token}`}, body: fd })
                                      .then(r => r.json()).then(data => setHub({...hub, intro_video_url: data.url}))
                                      .finally(() => setUploadingState(prev => ({...prev, 'intro-video': false})));
                                  }
                                }} />
                              </label>
                            </div>
                          </div>

                          <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Bio Principal</label><textarea required value={hub.bio_text} onChange={e => setHub({ ...hub, bio_text: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[100px] focus:bg-white focus:border-[#dd8872] transition-colors" /></div>

                          <div className="pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} className="text-[#dd8872]" /> Infoproductos y Videos</h3>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => handleAddProduct('pdf')} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-200"><Plus size={14} /> PDF</button>
                                <button type="button" onClick={() => handleAddProduct('video')} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-slate-200"><Video size={14} /> Video</button>
                              </div>
                            </div>

                            <div className="space-y-4">
                              {parsedProducts.length === 0 ? (
                                <p className="text-xs text-slate-400 p-4 bg-slate-50 rounded-xl text-center border-dashed border border-slate-200">No hay recursos agregados. Añade PDFs o Links a Videos para pacientes.</p>
                              ) : parsedProducts.map((prod: any, idx: number) => (
                                <div key={prod.id || idx} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl relative group">
                                  <button type="button" onClick={() => handleRemoveProduct(idx)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div><label className="text-[10px] font-bold text-slate-400">Tipo / Formato</label><input value={prod.type} onChange={e => handleProductChange(idx, 'type', e.target.value)} placeholder="Ej. Guía PDF / YouTube" className="w-full bg-white border border-slate-100 px-3 py-2 text-xs rounded-lg outline-none" /></div>
                                    <div><label className="text-[10px] font-bold text-slate-400">Título</label><input value={prod.title} onChange={e => handleProductChange(idx, 'title', e.target.value)} placeholder="Ej. Guía de Fiebre" className="w-full bg-white border border-slate-100 px-3 py-2 text-xs rounded-lg outline-none" /></div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div><label className="text-[10px] font-bold text-slate-400">Etiqueta (Tema)</label><input value={prod.tag} onChange={e => handleProductChange(idx, 'tag', e.target.value)} placeholder="Ej. Nutrición / Emergencias" className="w-full bg-white border border-slate-100 px-3 py-2 text-xs rounded-lg outline-none" /></div>
                                    <div><label className="text-[10px] font-bold text-slate-400">URL Imagen Portada (Opcional)</label>
                                      <div className="flex gap-2">
                                        <input value={prod.image || ''} onChange={e => handleProductChange(idx, 'image', e.target.value)} placeholder="https://...jpg" className="w-full bg-white border border-slate-100 px-3 py-2 text-xs rounded-lg outline-none" />
                                        <label className="flex-shrink-0 bg-slate-100 text-slate-600 px-3 flex items-center justify-center rounded-lg hover:bg-slate-200 cursor-pointer">
                                          {uploadingState[`${idx}-image`] ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />}
                                          <input type="file" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(idx, 'image', e.target.files[0]); }} />
                                        </label>
                                      </div>
                                    </div>
                                  </div>

                                  <div><label className="text-[10px] font-bold text-slate-400">Enlace Externo o Archivo Local (Obligatorio)</label>
                                    <div className="flex gap-2">
                                      <input value={prod.link || ''} onChange={e => handleProductChange(idx, 'link', e.target.value)} placeholder="https://..." className="w-full bg-white border border-slate-100 px-3 py-2 text-xs rounded-lg outline-none" />
                                      <label className="flex-shrink-0 bg-slate-100 text-slate-600 px-3 py-2 flex items-center justify-center rounded-lg hover:bg-slate-200 cursor-pointer text-xs font-bold gap-1">
                                        {uploadingState[`${idx}-link`] ? <Loader2 size={14} className="animate-spin" /> : <Paperclip size={14} />} Subir
                                        <input type="file" className="hidden" accept="*" onChange={(e) => { if (e.target.files?.[0]) handleFileUpload(idx, 'link', e.target.files[0]); }} />
                                      </label>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end pt-4">
                            <button type="submit" disabled={hubSaveStatus === 'saving'} className="bg-[#dd8872] disabled:opacity-50 text-white text-sm font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all shadow-md flex items-center gap-2">
                              {hubSaveStatus === 'saving' ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                              {hubSaveStatus === 'success' ? 'Página Guardada y Pública' : 'Publicar Sitio del Paciente'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </>
              )}

              {view === 'chat' && (
                <div className="h-[75vh] flex flex-col bg-white rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col justify-center items-center text-center opacity-60">
                        <div className="mb-4 bg-white shadow-sm w-20 h-20 flex items-center justify-center rounded-full overflow-hidden p-[2px]">
                          <img src="/jiro.png" className="w-full h-full object-cover rounded-full" alt="Jiro Squirrel" />
                        </div>
                        <p className="font-bold text-lg text-slate-900 mb-1">Jiro AI</p>
                        <p className="text-sm font-medium">Asistente creativo y analizador.</p>
                      </div>
                    )}
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-5 py-3 text-[13px] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-[1.5rem] rounded-tr-sm shadow-sm' : 'bg-slate-50 border border-[#ececeb] text-slate-800 rounded-[1.5rem] rounded-tl-sm shadow-sm'}`}>{msg.content}</div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="px-5 py-4 bg-slate-50 border border-[#ececeb] rounded-[1.5rem] rounded-tl-sm shadow-sm flex items-center gap-1.5">
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        </div>
                      </div>
                    )}
                    {error && (
                      <div className="flex justify-center">
                        <div className="bg-red-50 text-red-500 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-red-100 shadow-sm"><AlertCircle size={14} /> {error}</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white border-t border-[#ececeb]">
                    <form onSubmit={sendChatMessage} className="flex gap-2">
                      <input type="text" value={currentChatMessage} onChange={e => setCurrentChatMessage(e.target.value)} placeholder="Escribe tu mensaje..." className="flex-1 bg-slate-50 text-[13px] font-medium px-5 py-3 rounded-full outline-none focus:bg-white focus:ring-1 focus:ring-slate-300 transition-all border border-slate-100" />
                      <button type="submit" className="bg-slate-900 text-white w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"><ArrowUp size={18} /></button>
                    </form>
                  </div>
                </div>
              )}

              {view === 'analyze' && (
                <div className="space-y-8">
                  {step === 'input' && (
                    <div className="space-y-6">
                      <h2 className="text-3xl font-semibold tracking-tight">Analítica de Reels</h2>
                      <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <form onSubmit={handleAnalyze} className="space-y-6">
                          <div>
                            <label className="text-[11px] font-bold text-slate-500 block mb-2">Ingresa URL de Instagram</label>
                            <input required type="url" value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/p/..." className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-slate-300" />
                          </div>

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <label className="text-[11px] font-bold text-slate-500 block mb-2">Tipo de Contenido</label>
                              <select value={contentType} onChange={e => setContentType(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-slate-300">
                                <option value="all">Todo</option>
                                <option value="posts">Posts</option>
                                <option value="reels">Reels</option>
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-[11px] font-bold text-slate-500 block mb-2">Motor de IA Quirúrgico</label>
                              <select value={provider} onChange={e => setProvider(e.target.value as typeof provider)} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium focus:bg-white focus:border-slate-300">
                                <option value="gemini">Google Gemini</option>
                                <option value="openai">OpenAI (ChatGPT)</option>
                                <option value="anthropic">Anthropic (Claude)</option>
                              </select>
                            </div>
                          </div>

                          {showAdvanced && (
                            <div className="space-y-4 p-5 bg-gradient-to-br from-[#fcfcfc] to-[#fefaf6] border border-[#f5e3ce] rounded-[1.5rem] shadow-sm">
                              <p className="text-xs font-bold text-[#b88c6e] mb-2 flex items-center gap-2"><Settings size={14} /> Credenciales Requeridas</p>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">API Key IA</label>
                                <input type="password" required value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-..." className="w-full bg-white border border-slate-200 px-4 py-2.5 text-sm rounded-xl outline-none focus:border-[#d6c9bc]" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Apify Token</label>
                                <input type="password" required value={apifyToken} onChange={e => setApifyToken(e.target.value)} placeholder="apify_api_..." className="w-full bg-white border border-slate-200 px-4 py-2.5 text-sm rounded-xl outline-none focus:border-[#d6c9bc]" />
                              </div>
                            </div>
                          )}

                          {error && (
                            <div className="bg-red-50 text-red-600 font-bold px-5 py-4 rounded-xl text-xs flex items-center gap-2 border border-red-100 shadow-sm">
                              <AlertCircle size={16} /> {error}
                            </div>
                          )}

                          <button disabled={loading} className="bg-slate-900 text-white text-sm font-bold px-6 py-4 rounded-full w-full hover:bg-black shadow-sm flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <BarChart3 size={18} />} Iniciar Scraping e IA
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                  {step === 'processing' && (
                    <div className="text-center py-20"><Loader2 size={40} className="mx-auto text-slate-400 animate-spin mb-4" /><p className="text-slate-600 font-medium">Buscando patrones de viralidad...</p></div>
                  )}
                  {step === 'result' && result && (
                    <div className="space-y-6">
                      <button onClick={() => setStep('input')} className="font-bold flex items-center gap-2 text-xs bg-white border border-slate-200 px-4 py-2 rounded-full"><ArrowLeft size={14} /> Volver</button>
                      <div className="space-y-6">
                        {/* Executive Summary */}
                        <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                          <h3 className="font-bold text-xl mb-4 flex items-center gap-2"><Sparkles size={20} className="text-[#dd8872]" /> Resumen IA</h3>
                          <p className="text-[15px] font-medium leading-relaxed text-slate-700">{safeText(result.insights.summary)}</p>
                        </div>

                        {/* Top Posts & Impact */}
                        {result.topPosts && result.topPosts.length > 0 && (
                          <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><BarChart3 size={20} className="text-[#dd8872]" /> Contenido de Mayor Impacto</h3>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                              {result.topPosts.map((post: any, idx: number) => (
                                <a href={post.url} target="_blank" rel="noreferrer" key={idx} className="block group rounded-2xl overflow-hidden border border-slate-100 hover:border-[#dd8872] transition-colors relative bg-slate-50">
                                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg z-10 flex items-center gap-1">
                                    #{idx + 1}
                                  </div>
                                  <div className="aspect-[4/5] bg-slate-200 overflow-hidden relative">
                                    {post.thumbnail ? (
                                      <img src={post.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Thumbnail" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-400"><PlaySquare size={24} /></div>
                                    )}
                                  </div>
                                  <div className="p-3">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                                      <span className="flex items-center gap-1"><Heart size={12} /> {post.likes}</span>
                                      <span className="flex items-center gap-1"><MessageCircle size={12} /> {post.comments}</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-[#b88c6e] mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                                      <span>Impacto:</span>
                                      <span>{Math.round(post.impactScore).toLocaleString()}</span>
                                    </div>
                                  </div>
                                </a>
                              ))}
                            </div>

                            <div className="bg-[#fefaf6] p-5 rounded-2xl border border-[#f5e3ce]">
                              <h4 className="font-bold text-sm text-[#a3795e] mb-2 flex items-center gap-2"><Lightbulb size={16} /> Análisis de Rendimiento</h4>
                              <p className="text-[13px] font-medium leading-relaxed text-[#867562]">{safeText(result.insights.top_posts_analysis)}</p>
                            </div>
                          </div>
                        )}

                        {/* Two Columns: Patterns & Avatar */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full flex flex-col">
                            <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-[#4a3b32]"><Target size={18} className="text-[#6b9a9f]" /> Patrones Detectados</h3>
                            <ul className="space-y-4 flex-1">
                              {result.insights.patterns?.length > 0 ? result.insights.patterns.map((p: any, i: number) => {
                                const patternText = typeof p === 'object' ? Object.values(p).join(' - ') : String(p);
                                return (
                                  <li key={i} className="text-[13px] text-slate-600 font-medium flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#6b9a9f] mt-1.5 shrink-0" />{patternText}</li>
                                )
                              }) : <p className="text-xs text-slate-400 italic">No se detectaron patrones específicos.</p>}
                            </ul>
                          </div>

                          <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-full flex flex-col">
                            <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-[#4a3b32]"><Users size={18} className="text-[#6b9a9f]" /> Avatar Psicográfico</h3>
                            <div className="space-y-4 flex-1">
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h5 className="text-[11px] font-bold text-[#b88c6e] mb-2 uppercase tracking-wider">Deseos</h5>
                                <ul className="space-y-2">
                                  {result.insights.avatar_analysis?.desires?.length > 0 ? result.insights.avatar_analysis.desires.map((d: any, i: number) => <li key={i} className="text-xs font-medium text-slate-600 flex gap-2"><CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> {safeText(d)}</li>) : <li className="text-xs text-slate-400">N/A</li>}
                                </ul>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <h5 className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Miedos / Frustraciones</h5>
                                <ul className="space-y-2">
                                  {result.insights.avatar_analysis?.fears?.concat(result.insights.avatar_analysis?.frustrations || [])?.map((f: any, i: number) => <li key={i} className="text-xs font-medium text-slate-600 flex gap-2"><AlertCircle size={14} className="text-[#dd8872] shrink-0" /> {safeText(f)}</li>) || <li className="text-xs text-slate-400">N/A</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actionable Recommendations & Predictions */}
                        <div className="bg-[#2D2824] text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-5 overflow-hidden"><Zap size={250} className="-mt-16 -mr-16" /></div>
                          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div>
                              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-[#f5e3ce]"><Zap size={20} /> Plan de Acción e Insights</h3>
                              <ul className="space-y-5">
                                {result.insights.recommendations?.length > 0 ? result.insights.recommendations.map((r: string, i: number) => (
                                  <li key={i} className="flex gap-4 items-start">
                                    <div className="w-6 h-6 rounded-full bg-[#f5e3ce]/20 text-[#f5e3ce] flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</div>
                                    <p className="text-[13px] font-medium leading-relaxed text-[#d6c9bc]">{safeText(r)}</p>
                                  </li>
                                )) : <p className="text-xs text-slate-400">Sin recomendaciones disponibles.</p>}
                              </ul>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm self-start">
                              <h3 className="font-bold text-sm text-[#f5e3ce] mb-5 uppercase tracking-wider flex items-center gap-2"><TrendingUp size={16} /> Predicciones del Algoritmo</h3>
                              <div className="space-y-5">
                                <div>
                                  <p className="text-[10px] text-[#b88c6e] font-bold mb-1 uppercase">Tendencia Actual</p>
                                  <p className="text-[13px] font-medium text-slate-200">{safeText(result.insights.predictions?.trend)}</p>
                                </div>
                                <div className="h-px w-full bg-white/10"></div>
                                <div>
                                  <p className="text-[10px] text-[#b88c6e] font-bold mb-1 uppercase">Proyección Estimada</p>
                                  <p className="text-[13px] font-medium text-slate-200">{safeText(result.insights.predictions?.estimated_growth)}</p>
                                </div>
                                <div className="mt-6 p-4 bg-[#dd8872]/10 rounded-xl border border-[#dd8872]/20">
                                  <p className="text-[10px] text-[#dd8872] font-bold mb-2 flex items-center gap-1 uppercase"><Lightbulb size={12} /> El Siguiente Gran Paso</p>
                                  <p className="text-[13px] font-bold text-white leading-relaxed">{safeText(result.insights.predictions?.next_big_thing)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hand-off to Jiro */}
                        <div className="pt-4 border-t border-slate-100">
                          <button onClick={discussAnalysis} className="w-full bg-[#faebd8] hover:bg-[#f5e3ce] text-[#4a3b32] font-bold border border-[#f5e3ce] transition-colors py-4 px-6 rounded-2xl flex items-center justify-center gap-3 group shadow-sm">
                            <MessageCircle size={18} className="text-[#dd8872] group-hover:scale-110 transition-transform" /> Discutir este Análisis con Jiro AI
                          </button>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

              {view === 'settings' && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-semibold tracking-tight">System Settings</h2>
                  
                  <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-bl-full -z-10 opacity-50"></div>
                    <h3 className="font-bold text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Target className="text-indigo-500" size={20} /> Finanzas y Pagos Automáticos
                    </h3>
                    <p className="text-sm text-slate-500">Conecta tu cuenta bancaria de manera segura a través de Stripe para empezar a cobrar citas y servicios directo desde tu Hub Público sin facturación manual.</p>
                    <button onClick={handleStripeConnect} className="bg-[#635BFF] hover:bg-[#5249DE] text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg active:-translate-y-0.5">
                      <CreditCard size={18} /> Conectar con Stripe Connect
                    </button>
                  </div>

                  <form onSubmit={saveSettings} className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-sm space-y-4">
                      <h3 className="font-bold text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                        <span className="flex items-center gap-2">Sistema Operativo de Marca ({hub?.title || 'Pediatric OS'}) <span className="px-2 py-0.5 bg-[#f5e3ce] text-[#867562] text-[10px] rounded-full">Core</span></span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">1. Identidad Nuclear (Misión / Visión)</label><textarea value={settings.core_identity || ''} onChange={e => setSettings({ ...settings, core_identity: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Arquitecta de liderazgo humano en la era de la IA" /></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">2. El Problema del Mundo a Resolver</label><textarea value={settings.core_problem || ''} onChange={e => setSettings({ ...settings, core_problem: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. La tecnología avanza más rápido que el liderazgo" /></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">3. Nicho Inicial (Campo de batalla)</label><textarea value={settings.initial_niche || ''} onChange={e => setSettings({ ...settings, initial_niche: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Clínicas pediátricas + infraestructura de IA" /></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">4. Sistema de Valores (Protocolos)</label><textarea value={settings.brand_values || ''} onChange={e => setSettings({ ...settings, brand_values: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Mejora continua estructural, Autonomía" /></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">5. Arquetipo de Marca y Tono</label><textarea value={settings.brand_archetype || ''} onChange={e => setSettings({ ...settings, brand_archetype: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Arquitecta, Estratega, Disruptora" /></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">6. Mecanismo Único (El Sistema)</label><textarea value={settings.unique_mechanism || ''} onChange={e => setSettings({ ...settings, unique_mechanism: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Arquitectura de Legado Clínico" /></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">7. La Gran Promesa</label><textarea value={settings.big_promise || ''} onChange={e => setSettings({ ...settings, big_promise: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Liberación operativa + soberanía digital" /></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">8. Narrativa de Marca (El Viaje)</label><textarea value={settings.brand_narrative || ''} onChange={e => setSettings({ ...settings, brand_narrative: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. El mundo entra a AI, yo formo líderes" /></div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">9. Distribución de Contenido (Mezcla)</label><textarea value={settings.content_distribution || ''} onChange={e => setSettings({ ...settings, content_distribution: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. 40% autoridad, 30% pensamiento, 20% historia" /></div>
                        <div><label className="text-[11px] font-bold text-slate-500 block mb-1">Producto / Oferta Actual</label><textarea value={settings.product_service || ''} onChange={e => setSettings({ ...settings, product_service: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[60px] focus:bg-white" placeholder="Ej. Consultoría High-Ticket, Software" /></div>
                      </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-sm space-y-4">
                      <h3 className="font-bold text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Bot size={16} className="text-[#dd8872]" /> Entrenamiento de Jiro AI (Tu Agente Creador)
                      </h3>
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">Prompt Específico del Doctor</label>
                        <p className="text-[10px] text-slate-400 font-medium mb-3">Instruye a Jiro sobre cómo quieres que se dirija a tus pacientes (Ej. "Eres Jiro, pediatra experto y amoroso...")</p>
                        <textarea value={settings.jiro_prompt || ''} onChange={e => setSettings({ ...settings, jiro_prompt: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[100px] focus:bg-white" placeholder="Ej. Eres el Asistente Virtual ('Jiro') de la Clínica..." />
                      </div>
                      <div className="mt-4">
                        <label className="text-[11px] font-bold text-slate-500 block mb-1">Cerebro de Jiro (Conocimiento Extra)</label>
                        <p className="text-[10px] text-slate-400 font-medium mb-3">Escribe o pega aquí la información clave de tu consultorio: horarios, precios, ubicación, vacunas disponibles y preguntas frecuentes (FAQs).</p>
                        <textarea value={settings.jiro_knowledge || ''} onChange={e => setSettings({ ...settings, jiro_knowledge: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium min-h-[120px] focus:bg-white" placeholder="Ej. Horarios: L-V de 9 a 18hrs. Costo consulta: $50 USD. Ubicación: Centro Médico XYZ..." />
                      </div>
                    </div>
                    


                    <div className="bg-white p-8 rounded-3xl border border-[#ececeb] shadow-sm space-y-4">
                      <h3 className="font-bold text-sm border-b border-slate-100 pb-2">Claves de API (Seguridad)</h3>
                      <div className="flex gap-4">
                        <div className="flex-1"><label className="text-[11px] font-bold text-slate-500 block mb-1">GPT-4 Key</label><input type="password" value={settings.ai_api_key !== undefined ? settings.ai_api_key : (settings.has_ai_api_key ? '••••••••••••••••' : '')} onChange={e => setSettings({ ...settings, ai_api_key: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium text-slate-600 focus:bg-white" placeholder={settings.has_ai_api_key ? "Oculta por seguridad (escribe para cambiar)" : "sk-..."} /></div>
                        <div className="flex-1"><label className="text-[11px] font-bold text-slate-500 block mb-1">Apify Token</label><input type="password" value={settings.apify_token !== undefined ? settings.apify_token : (settings.has_apify_token ? '••••••••••••••••' : '')} onChange={e => setSettings({ ...settings, apify_token: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 text-sm rounded-2xl outline-none font-medium text-slate-600 focus:bg-white" placeholder={settings.has_apify_token ? "Oculto por seguridad (escribe para cambiar)" : "apify_api_..."} /></div>
                      </div>
                    </div>
                    <button type="submit" className="bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-full hover:bg-black w-full shadow-sm">{saveStatus === 'saving' ? 'Guardando...' : 'Actualizar Preferencias'}</button>
                  </form>
                </div>
              )}

              {view === 'products' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-semibold tracking-tight">Tus Infoproductos y Leads</h2>
                    <button onClick={() => setView('editor')} className="flex items-center gap-2 bg-[#1a365d] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:scale-105 transition-transform">
                      <Plus size={16} /> Subir Nuevo PDF
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {parsedProducts.filter((p: any) => (p?.type || '').toLowerCase().includes('pdf') || (p?.type || '').toLowerCase().includes('guía')).map((p: any) => {
                      const productLeads = leads.filter(l => l.resource_requested === p.title || l.resource_requested === p.id);
                      return (
                        <div key={p.id} className="bg-white rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col relative group">
                          <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
                              {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <BookOpen size={24} className="text-[#dd8872]" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg leading-tight mb-1 text-slate-800">{p.title}</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.type} • {p.tag}</p>
                            </div>
                            <div className="text-right">
                              <div className="bg-[#dd8872]/10 text-[#dd8872] px-3 py-1 rounded-xl text-lg font-black">{productLeads.length}</div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">Leads</span>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50 flex-1 max-h-[200px] overflow-y-auto hide-scrollbar space-y-2">
                            {productLeads.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center font-medium my-4">Aún no hay descargas para este recurso.</p>
                            ) : productLeads.map((lead, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><User size={14} /></div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-700">{lead.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{new Date(lead.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                <a href={`https://wa.me/${(lead.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" className="w-8 h-8 rounded-full bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors"><MessageCircle size={14} /></a>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {parsedProducts.filter((p: any) => (p?.type || '').toLowerCase().includes('pdf') || (p?.type || '').toLowerCase().includes('guía')).length === 0 && (
                      <div className="col-span-1 sm:col-span-2 text-center p-12 bg-white/40 rounded-3xl border border-[#1a365d]/10 border-dashed">
                        <BookOpen size={32} className="mx-auto text-slate-400 mb-3" />
                        <p className="font-medium text-slate-500 mb-4">Aún no has agregado ningún PDF para tus pacientes.</p>
                        <button onClick={() => setView('editor')} className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2">Ir a configurarlos</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'videos' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-semibold tracking-tight">Librería de Videos</h2>
                    <button onClick={() => setView('editor')} className="flex items-center gap-2 bg-[#1a365d] text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-md hover:scale-105 transition-transform">
                      <Plus size={16} /> Subir Video
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {parsedProducts.filter((p: any) => (p?.type || '').toLowerCase().includes('video') || (p?.type || '').toLowerCase().includes('youtube') || (p?.type || '').toLowerCase().includes('vsl')).map((p: any) => {
                      const productLeads = leads.filter(l => l.resource_requested === p.title || l.resource_requested === p.id);
                      return (
                        <div key={p.id} className="bg-white rounded-3xl border border-[#ececeb] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col relative group">
                          <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-100 overflow-hidden">
                              {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <Video size={24} className="text-[#dd8872]" />}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-lg leading-tight mb-1 text-slate-800">{p.title}</h3>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{p.type} • {p.tag}</p>
                            </div>
                            <div className="text-right">
                              <div className="bg-[#dd8872]/10 text-[#dd8872] px-3 py-1 rounded-xl text-lg font-black">{productLeads.length}</div>
                              <span className="text-[10px] uppercase font-bold text-slate-400">Vistas/Leads</span>
                            </div>
                          </div>
                          <div className="p-4 bg-slate-50 flex-1 flex justify-center items-center">
                            <a href={p.link} target="_blank" className="bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-sm w-full text-center flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"><Play size={16} /> Abrir Enlace / Archivo</a>
                          </div>
                        </div>
                      );
                    })}
                    {parsedProducts.filter((p: any) => (p?.type || '').toLowerCase().includes('video') || (p?.type || '').toLowerCase().includes('youtube') || (p?.type || '').toLowerCase().includes('vsl')).length === 0 && (
                      <div className="col-span-1 sm:col-span-2 text-center p-12 bg-white/40 rounded-3xl border border-[#1a365d]/10 border-dashed">
                        <Video size={32} className="mx-auto text-slate-400 mb-3" />
                        <p className="font-medium text-slate-500 mb-4">Aún no has agregado videos a tu galería.</p>
                        <button onClick={() => setView('editor')} className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2">Ir a configurarlos</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {view === 'metrics' && (
                <div className="space-y-8">
                  <h2 className="text-3xl font-semibold tracking-tight">Panel de Métricas</h2>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-3xl border border-[#ececeb] shadow-sm flex flex-col items-center justify-center text-center">
                      <MessageCircle size={32} className="text-[#25D366] mb-2" />
                      <h4 className="text-3xl font-black mb-1 text-slate-800">{metrics.filter(m => m.event_type === 'whatsapp_click').length}</h4>
                      <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Clics WhatsApp</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-[#ececeb] shadow-sm flex flex-col items-center justify-center text-center">
                      <Calendar size={32} className="text-[#dd8872] mb-2" />
                      <h4 className="text-3xl font-black mb-1 text-slate-800">{metrics.filter(m => m.event_type === 'appointment_click').length}</h4>
                      <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Agendar Cita</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-[#ececeb] shadow-sm flex flex-col items-center justify-center text-center">
                      <Sparkles size={32} className="text-indigo-400 mb-2" />
                      <h4 className="text-3xl font-black mb-1 text-slate-800">{metrics.filter(m => m.event_type === 'chat_click').length}</h4>
                      <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Clics Jiro IA</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-[#ececeb] shadow-sm flex flex-col items-center justify-center text-center">
                      <Play size={32} className="text-slate-400 mb-2" />
                      <h4 className="text-3xl font-black mb-1 text-slate-800">{metrics.filter(m => m.event_type === 'video_view').length}</h4>
                      <p className="font-bold text-xs text-slate-500 uppercase tracking-widest">Vistas a Videos</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#ececeb] shadow-sm p-8">
                    <h3 className="font-bold text-lg mb-6 border-b border-slate-100 pb-2">Desglose por Recurso</h3>
                    <div className="space-y-4">
                      {parsedProducts.map((p: any) => {
                        const clicks = metrics.filter(m => m.resource_id === p.id || m.resource_id === p.title).length;
                        return (
                          <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">{p.type?.toLowerCase().includes('video') ? <Play size={16} className="text-slate-400" /> : <BookOpen size={16} className="text-[#dd8872]" />}</div>
                              <div>
                                <h4 className="font-bold text-sm text-slate-800">{p.title}</h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{p.type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black text-[#1a365d]">{clicks}</div>
                              <div className="text-[10px] uppercase font-bold text-slate-400">Clics / Vistas</div>
                            </div>
                          </div>
                        );
                      })}
                      {parsedProducts.length === 0 && <p className="text-xs text-slate-400 font-medium text-center">No hay recursos activos para medir.</p>}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Chat History Equivalent) */}
        <aside className="w-[300px] xl:w-[320px] bg-white flex-shrink-0 flex-col hidden lg:flex rounded-tr-[2.5rem] rounded-br-[2.5rem] p-6 relative z-10">
          <div className="flex justify-between items-center mb-6 px-2">
            <h3 className="font-black text-[16px] text-[#2c2c2c] tracking-tight">Chat history</h3>
            <button className="w-8 h-8 rounded-full bg-[#faedd9] flex items-center justify-center text-[#867562] hover:bg-[#f3d9b8] transition-colors"><LayoutGrid size={14} /></button>
          </div>

          <div className="relative mb-6 px-2">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search..." className="w-full bg-white border border-slate-200 rounded-full py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:border-slate-300" />
          </div>

          <div className="flex-1 overflow-y-auto px-2 space-y-2 hide-scrollbar">
            {history.slice(0, 5).map((h, i) => (
              <div key={h.id} className={`p-4 rounded-[1.2rem] transition-colors flex gap-3 cursor-pointer shadow-sm border border-white/50 hover:shadow-md mb-3 ${i % 2 === 0 ? 'bg-gradient-to-r from-[#e7f1eb] to-[#f4ebe1]' : 'bg-gradient-to-r from-[#f7e6d7] to-[#fadbd3]'}`} onClick={() => { setView('analyze'); loadRun(h.id); }}>
                <input type="checkbox" className="mt-1 rounded border-slate-300 text-slate-900 bg-white/50" />
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-[13px] font-black text-[#1f2937] mb-1 leading-tight">{i % 2 === 0 ? 'Visual exploration' : 'Analítica Content'}</h4>
                  <p className="text-[11px] text-[#6b7280] line-clamp-1 font-medium leading-relaxed mb-3">{h.instagram_url}</p>
                  <div className="flex items-center justify-between gap-12">
                    <div className="flex -space-x-2 items-center text-slate-400">
                      <History size={14} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold tracking-tight bg-slate-100 px-2 py-0.5 rounded-lg">
                      {new Date(h.created_at).toLocaleDateString()} • {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="text-center mt-10 opacity-50"><MessageCircle size={24} className="mx-auto mb-2" /><p className="text-xs font-medium">No history yet</p></div>
            )}
          </div>

          <button onClick={() => setView('chat')} className="w-full bg-gradient-to-r from-[#6b9a9f] to-[#dd8872] text-white font-bold text-[14px] py-4 rounded-full mt-4 hover:shadow-lg hover:scale-[1.02] transition-all shadow-md mt-auto">
            Create new chat
          </button>
        </aside>

      </div>
    </div>
  );
}
