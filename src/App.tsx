import React, { useState, useEffect } from "react";
import {
  Instagram,
  Cpu,
  Key,
  Zap,
  Loader2,
  CheckCircle2,
  TrendingUp,
  MessageSquare,
  Eye,
  ChevronRight,
  AlertCircle,
  ExternalLink,
  BarChart3,
  Lightbulb,
  LayoutGrid,
  Share2,
  LogOut,
  User,
  History,
  ArrowLeft,
  Lock,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Trash2,
  Send,
  Sparkles,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Provider = "gemini" | "openai" | "claude";

interface UserData {
  id: string;
  email: string;
}

interface AnalysisResult {
  runId: string;
  status: string;
  insights: {
    summary: string;
    top_posts_analysis: string;
    patterns: string[];
    recommendations: string[];
    avatar_analysis?: {
      desires: string[];
      fears: string[];
      frustrations: string[];
      key_angles: string[];
    };
    predictions?: {
      trend: string;
      next_big_thing: string;
      estimated_growth: string;
    };
  };
  topPosts: {
    url: string;
    thumbnail: string;
    impactScore: number;
    likes: number;
    comments: number;
    shares: number;
    plays: number;
  }[];
}

interface RunHistoryItem {
  id: string;
  instagram_url: string;
  provider: string;
  status: string;
  thumbnail_url: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

type View = "dashboard" | "analyze" | "history" | "settings" | "chat";

interface UserSettings {
  instagram_url: string;
  ai_provider: Provider;
  ai_api_key: string;
  apify_token: string;
  brand_values?: string;
  brand_personality?: string;
  brand_vision?: string;
  product_service?: string;
  big_promise?: string;
  problems_solved?: string;
  unique_mechanism?: string;
}

const CustomLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" className={className}>
    <g transform="translate(0, -5)">
      <path d="M50 5 L50 95" strokeWidth="3.5" />
      <path d="M38 30 L38 72" strokeWidth="2.5" />
      <path d="M62 30 L62 72" strokeWidth="2.5" />
      <path d="M26 45 L26 68" strokeWidth="2" />
      <path d="M74 45 L74 68" strokeWidth="2" />
      <path d="M40 70 L50 82 L60 70" strokeWidth="3" fill="none" />
      <path d="M38 56 L10 68" strokeWidth="2" />
      <path d="M62 56 L90 68" strokeWidth="2" />
      <path d="M26 50 L15 56" strokeWidth="1.5" />
      <path d="M74 50 L85 56" strokeWidth="1.5" />
    </g>
  </svg>
);

interface SummaryStats {
  totalRuns: number;
  completedRuns: number;
  avgImpact: number;
  totalPosts: number;
  latestInsights: {
    summary: string;
    patterns_json: string;
    recommendations_json: string;
  } | null;
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [view, setView] = useState<View>("dashboard");
  const [settings, setSettings] = useState<UserSettings>({
    instagram_url: "",
    ai_provider: "gemini",
    ai_api_key: "",
    apify_token: "",
    brand_values: "",
    brand_personality: "",
    brand_vision: "",
    product_service: "",
    big_promise: "",
    problems_solved: "",
    unique_mechanism: ""
  });
  const [summary, setSummary] = useState<SummaryStats | null>(null);

  const [instagramUrl, setInstagramUrl] = useState("");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [contentType, setContentType] = useState<"all" | "posts" | "reels">("all");
  const [apiKey, setApiKey] = useState("");
  const [apifyToken, setApifyToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState<"input" | "processing" | "result">("input");
  const [history, setHistory] = useState<RunHistoryItem[]>([]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentChatMessage, setCurrentChatMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const [showAllPosts, setShowAllPosts] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      fetchHistory();
      fetchSettings();
      fetchSummary();
      fetchChatMessages();
    }
  }, [token]);

  const fetchChatMessages = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/chat/messages", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setChatMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch chat messages", err);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentChatMessage.trim() || chatLoading) return;

    const userMsg = currentChatMessage.trim();
    setCurrentChatMessage("");
    setChatLoading(true);

    // Optimistic update
    const tempId = Math.random().toString(36).substring(7);
    setChatMessages(prev => [...prev, { id: tempId, role: "user", content: userMsg, created_at: new Date().toISOString() }]);

    try {
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatMessages(prev => [...prev, { id: Math.random().toString(36).substring(7), role: data.role, content: data.content, created_at: new Date().toISOString() }]);
      } else {
        const data = await response.json();
        setError(data.error || "Error al enviar mensaje");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const clearChat = async () => {
    if (!token || !window.confirm("¿Estás seguro de que quieres borrar el historial de chat?")) return;
    try {
      const response = await fetch("/api/chat/messages", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        setChatMessages([]);
      }
    } catch (err) {
      console.error("Failed to clear chat", err);
    }
  };

  const fetchSettings = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/settings", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user_id) {
          setSettings({
            instagram_url: data.instagram_url || "",
            ai_provider: data.ai_provider || "gemini",
            ai_api_key: data.ai_api_key || "",
            apify_token: data.apify_token || "",
            brand_values: data.brand_values || "",
            brand_personality: data.brand_personality || "",
            brand_vision: data.brand_vision || "",
            product_service: data.product_service || "",
            big_promise: data.big_promise || "",
            problems_solved: data.problems_solved || "",
            unique_mechanism: data.unique_mechanism || ""
          });
          // Pre-fill analyze form
          setInstagramUrl(data.instagram_url || "");
          setProvider(data.ai_provider || "gemini");
          setApiKey(data.ai_api_key || "");
          setApifyToken(data.apify_token || "");

          // If we have settings, we can default to simplified view
          if (data.ai_api_key && data.apify_token) {
            setShowAdvanced(false);
          } else {
            setShowAdvanced(true);
          }
        } else {
          setShowAdvanced(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setShowAdvanced(true);
    }
  };

  const fetchSummary = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/summary", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch summary", err);
    }
  };

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (response.ok) {
        // Update analyze form state too
        setInstagramUrl(settings.instagram_url);
        setProvider(settings.ai_provider);
        setApiKey(settings.ai_api_key);
        setApifyToken(settings.apify_token);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
      setSaveStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      const endpoint = authMode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const contentTypeText = response.headers.get("content-type");
      if (contentTypeText && contentTypeText.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "La autenticación falló");

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      } else {
        const text = await response.text();
        throw new Error("El servidor de API no está respondiendo (probablemente falta backend en el hosting). " + response.status);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setStep("input");
  };

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch("/api/history", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const loadRun = async (runId: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/runs/${runId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();

      // Transform DB data to match AnalysisResult interface
      const transformed: AnalysisResult = {
        runId: data.run.id,
        status: data.run.status,
        insights: {
          summary: data.insights.summary,
          top_posts_analysis: data.insights.top_posts_json,
          patterns: JSON.parse(data.insights.patterns_json),
          recommendations: JSON.parse(data.insights.recommendations_json),
          avatar_analysis: data.insights.avatar_analysis_json ? JSON.parse(data.insights.avatar_analysis_json) : undefined,
          predictions: data.insights.predictions_json ? JSON.parse(data.insights.predictions_json) : undefined
        },
        topPosts: data.topPosts.map((p: any) => ({
          url: p.post_url,
          thumbnail: p.thumbnail_url,
          impactScore: p.impact_score,
          likes: p.likes_count,
          comments: p.comments_count,
          shares: p.shares_count || 0,
          plays: p.plays_count || 0
        }))
      };

      setResult(transformed);
      setStep("result");
    } catch (err) {
      console.error("Failed to load run", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    setStep("processing");

    try {
      const trimmedApiKey = apiKey.trim();
      const trimmedApifyToken = apifyToken.trim();
      const trimmedUrl = instagramUrl.trim();

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          instagramUrl: trimmedUrl,
          provider,
          contentType,
          apiKey: trimmedApiKey,
          apifyToken: trimmedApifyToken
        }),
      });

      if (response.status === 401) {
        handleLogout();
        throw new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "El análisis falló");
      }

      const data = await response.json();
      setResult(data);
      setStep("result");
      fetchHistory(); // Refresh history sidebar
      fetchSummary(); // Refresh dashboard stats
    } catch (err: any) {
      setError(err.message);
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-transparent">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white shadow-soft rounded-[2rem] p-8 space-y-8 border border-gray-100"
        >
          <div className="text-center space-y-2">
            <div className="bg-gray-900 text-white shadow-md p-2 flex items-center justify-center mx-auto mb-4 rounded-xl w-14 h-14">
              <CustomLogo className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-800">Impact Analyzer</h1>
            <p className="text-gray-500 text-sm">Inicia sesión para analizar tu impacto</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-tight text-gray-500 uppercase tracking-wider">Email</label>
              <input
                required
                type="email"
                className="w-full px-4 py-3 rounded-[2rem] bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                placeholder="tu@email.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold tracking-tight text-gray-500 uppercase tracking-wider">Contraseña</label>
              <input
                required
                type="password"
                className="w-full px-4 py-3 rounded-[2rem] bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 focus:ring-2 focus:ring-gray-100 outline-none transition-all"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <button
              disabled={authLoading}
              className="w-full bg-gray-900 text-white shadow-md hover:bg-gray-800 font-semibold tracking-tight text-xl py-3 rounded-[2rem] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
              {authMode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
            </button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
              className="text-sm text-gray-900 font-medium hover:underline"
            >
              {authMode === "login" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      {/* Sidebar */}
      <aside className="w-72 bg-[#f0f2f0] flex-shrink-0 flex flex-col hidden lg:flex rounded-tr-3xl rounded-br-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6 ">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-gray-900 text-white shadow-md p-1.5 flex items-center justify-center rounded-lg">
              <CustomLogo className="w-6 h-6 text-white" />
            </div>
            <span className="font-semibold tracking-tight text-xl text-lg tracking-tight">Impact Analyzer</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setView("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-semibold tracking-tight text-xl transition-all ${view === "dashboard" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"}`}
            >
              <LayoutGrid className="w-4 h-4" /> Resumen General
            </button>
            <button
              onClick={() => setView("chat")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-semibold tracking-tight text-xl transition-all ${view === "chat" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"}`}
            >
              <Sparkles className="w-4 h-4" /> Chat con IA
            </button>
            <button
              onClick={() => {
                setView("analyze");
                setStep("input");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-semibold tracking-tight text-xl transition-all ${view === "analyze" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"}`}
            >
              <Zap className="w-4 h-4" /> Analizar Reel
            </button>
            <button
              onClick={() => setView("history")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-semibold tracking-tight text-xl transition-all ${view === "history" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"}`}
            >
              <History className="w-4 h-4" /> Historial
            </button>
            <button
              onClick={() => setView("settings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[2rem] text-sm font-semibold tracking-tight text-xl transition-all ${view === "settings" ? "bg-white text-gray-900 shadow-soft font-semibold" : "text-gray-500 hover:bg-gray-200/50"}`}
            >
              <Key className="w-4 h-4" /> Configuración
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-semibold tracking-tight text-xl text-gray-400 uppercase tracking-widest">Recientes</h3>
          </div>

          <div className="space-y-1">
            {history.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView("analyze");
                  loadRun(item.id);
                }}
                className={`w-full p-3 rounded-[2rem] text-left transition-all group flex items-center gap-3 ${result?.runId === item.id ? "bg-gray-900 text-white shadow-md  shadow-md" : "hover:bg-gray-50 text-gray-600"
                  }`}
              >
                <div className={`w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ${result?.runId === item.id ? "border-white/20" : ""}`}>
                  <img
                    src={item.thumbnail_url || `https://picsum.photos/seed/${item.id}/100/100`}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/100/100`;
                    }}
                  />
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-semibold tracking-tight text-xl truncate">{item.instagram_url.split('/').filter(Boolean).pop()}</p>
                  <p className={`text-[8px] ${result?.runId === item.id ? "text-gray-400" : "text-gray-400"}`}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 ">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-[2rem]">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white shadow-md flex items-center justify-center text-gray-900 font-semibold tracking-tight text-xl text-xs">
              {user?.email[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold tracking-tight text-xl text-gray-800 truncate">{user?.email}</p>
              <button onClick={handleLogout} className="text-[10px] text-gray-900 font-semibold tracking-tight text-xl hover:underline">Cerrar Sesión</button>
            </div>
          </div>
        </div>
        {/* User Profile & Logout */}
        <div className="p-4 ">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-gray-900 text-white shadow-md flex items-center justify-center text-gray-900 font-semibold tracking-tight text-xl">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold tracking-tight text-xl text-gray-800 truncate">{user?.username}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold tracking-tight text-xl text-gray-900 hover:bg-gray-100 rounded-[2rem] transition-all"
          >
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className=" bg-gray-100 /80 backdrop-blur-md sticky top-0 z-50 lg:hidden">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CustomLogo className="w-6 h-6 text-gray-900" />
              <span className="font-semibold tracking-tight text-xl text-lg">Impact Analyzer</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView("dashboard")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button onClick={() => setView("chat")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </button>
              <button onClick={() => setView("history")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <History className="w-5 h-5" />
              </button>
              <button onClick={() => setView("settings")} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
              <button onClick={handleLogout} className="p-2 text-gray-900 hover:bg-gray-100 rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-5xl mx-auto px-6 py-12">
            <AnimatePresence mode="wait">
              {view === "chat" && (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="h-[calc(100vh-160px)] flex flex-col bg-gray-100  rounded-[2rem]   overflow-hidden"
                >
                  <div className="p-6  flex items-center justify-between bg-gray-100 ">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-900 text-white shadow-md p-2 rounded-[2rem]">
                        <Sparkles className="w-5 h-5 text-gray-900" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold tracking-tight text-xl text-gray-800">Agente Estratégico IA</h2>
                        <p className="text-[10px] text-gray-500 font-medium tracking-tight text-xl uppercase tracking-wider">Entrenado con tus datos de marca y análisis</p>
                      </div>
                    </div>
                    <button
                      onClick={clearChat}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[2rem] transition-all"
                      title="Borrar historial"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="bg-gray-900 text-white shadow-md p-4 rounded-full">
                          <MessageSquare className="w-8 h-8 text-gray-900300" />
                        </div>
                        <div className="max-w-xs">
                          <p className="text-sm font-semibold tracking-tight text-xl text-gray-500">Inicia una conversación</p>
                          <p className="text-xs text-gray-400">Pregúntame sobre tus mejores posts, reels o cómo mejorar tu marca personal.</p>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-[2rem] text-sm whitespace-pre-wrap ${msg.role === 'user'
                            ? 'bg-gray-900 text-white shadow-md  shadow-md'
                            : 'bg-gray-100   text-gray-700 '
                            }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100   p-4 rounded-[2rem]  flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-gray-900 text-white shadow-md rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-gray-900 text-white shadow-md rounded-full animate-bounce [animation-delay:0.2s]" />
                            <div className="w-1.5 h-1.5 bg-gray-900 text-white shadow-md rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-gray-100  ">
                    <form onSubmit={sendChatMessage} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Pregunta algo sobre tu estrategia..."
                        className="flex-1 px-4 py-3 rounded-[2rem] bg-white border border-gray-200 text-gray-900 placeholder-gray-500 outline-none transition-all text-sm"
                        value={currentChatMessage}
                        onChange={(e) => setCurrentChatMessage(e.target.value)}
                        disabled={chatLoading}
                      />
                      <button
                        disabled={chatLoading || !currentChatMessage.trim()}
                        className="bg-gray-900 text-white shadow-md p-3 rounded-[2rem] hover:bg-gray-800 transition-all disabled:opacity-50  shadow-md"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {view === "dashboard" && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight text-xl text-gray-800">Resumen de Impacto</h1>
                      <p className="text-gray-500">Bienvenido de nuevo, {user?.email.split('@')[0]}</p>
                    </div>
                    <button
                      onClick={() => {
                        setView("analyze");
                        setStep("input");
                      }}
                      className="bg-gray-900 text-white shadow-md px-6 py-3 rounded-[2rem] font-semibold tracking-tight text-xl flex items-center gap-2  shadow-md hover:bg-gray-800 transition-all"
                    >
                      <Zap className="w-4 h-4" /> Nuevo Análisis
                    </button>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: "Análisis Totales", value: summary?.totalRuns || 0, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50" },
                      { label: "Completados", value: summary?.completedRuns || 0, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
                      { label: "Impacto Promedio", value: summary?.avgImpact || 0, icon: Zap, color: "text-gray-900", bg: "bg-gray-900 text-white shadow-md" },
                      { label: "Posts Analizados", value: summary?.totalPosts || 0, icon: Instagram, color: "text-pink-600", bg: "bg-pink-50" },
                    ].map((stat, i) => (
                      <div key={i} className="bg-gray-100  p-6 rounded-[2rem]  ">
                        <div className="flex items-center gap-4">
                          <div className={`${stat.bg} p-3 rounded-[2rem]`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold tracking-tight text-xl text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-semibold tracking-tight text-xl text-gray-800">{stat.value}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {summary?.latestInsights ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gray-100  rounded-[2rem] p-8   space-y-6">
                          <h3 className="text-xl font-semibold tracking-tight text-xl flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-900" /> Últimos Insights
                          </h3>
                          <p className="text-gray-600 leading-relaxed">{summary.latestInsights.summary}</p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold tracking-tight text-xl text-gray-800 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-gray-900400" /> Patrones Detectados
                              </h4>
                              <ul className="space-y-2">
                                {JSON.parse(summary.latestInsights.patterns_json).slice(0, 3).map((p: string, i: number) => (
                                  <li key={i} className="text-xs text-gray-500 flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-gray-900 text-white shadow-md mt-1.5 flex-shrink-0" />
                                    {p}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-4">
                              <h4 className="text-sm font-semibold tracking-tight text-xl text-gray-800 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-400" /> Recomendaciones
                              </h4>
                              <ul className="space-y-2">
                                {JSON.parse(summary.latestInsights.recommendations_json).slice(0, 3).map((r: string, i: number) => (
                                  <li key={i} className="text-xs text-gray-500 flex gap-2">
                                    <div className="w-1 h-1 rounded-full bg-amber-300 mt-1.5 flex-shrink-0" />
                                    {r}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity List */}
                        <div className="bg-gray-100  rounded-[2rem] p-8   space-y-6">
                          <h3 className="text-lg font-semibold tracking-tight text-xl flex items-center gap-2">
                            <History className="w-5 h-5 text-gray-400" /> Actividad Reciente
                          </h3>
                          <div className="space-y-3">
                            {history.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-[2rem] ">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-[2rem] overflow-hidden border-white  flex-shrink-0">
                                    <img
                                      src={item.thumbnail_url || `https://picsum.photos/seed/${item.id}/150/150`}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/150/150`;
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold tracking-tight text-xl text-gray-800">{item.instagram_url.split('/').filter(Boolean).pop()}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => { setView("analyze"); loadRun(item.id); }}
                                  className="text-xs font-semibold tracking-tight text-xl text-gray-900 hover:underline"
                                >
                                  Ver Resultados
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-900 text-white shadow-md rounded-[2rem] p-8 text-white  shadow-md">
                          <h3 className="text-xl font-semibold tracking-tight text-xl mb-4">Tu Marca Personal</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Sigue analizando tus reels para que la IA pueda darte consejos más precisos sobre cómo documentar tu día a día.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setView("analyze"); setStep("input"); }}
                              className="flex-1 bg-gray-100  text-gray-900 py-3 rounded-[2rem] font-semibold tracking-tight text-xl text-sm hover:bg-gray-800 transition-all border-gray-900"
                            >
                              Analizar Ahora
                            </button>
                            <button
                              onClick={() => setView("chat")}
                              className="flex-1 bg-gray-900 text-white shadow-md py-3 rounded-[2rem] font-semibold tracking-tight text-xl text-sm hover:bg-gray-800 transition-all shadow-md shadow-md"
                            >
                              Hablar con IA
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100  rounded-[2rem] p-20 border-dashed  text-center space-y-4">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <BarChart3 className="w-8 h-8 text-gray-300" />
                      </div>
                      <div className="max-w-xs mx-auto">
                        <h3 className="text-lg font-semibold tracking-tight text-xl text-gray-800">Sin datos aún</h3>
                        <p className="text-sm text-gray-400">Realiza tu primer análisis para ver el resumen de tu impacto aquí.</p>
                      </div>
                      <div className="flex gap-4 justify-center">
                        <button
                          onClick={() => { setView("analyze"); setStep("input"); }}
                          className="text-gray-900 font-semibold tracking-tight text-xl text-sm hover:underline"
                        >
                          Comenzar primer análisis →
                        </button>
                        <button
                          onClick={() => setView("chat")}
                          className="text-gray-900 font-semibold tracking-tight text-xl text-sm hover:underline"
                        >
                          Hablar con IA →
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {view === "analyze" && (
                <motion.div
                  key="analyze"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  {step === "input" && (
                    <div className="space-y-8">
                      <div className="text-center space-y-4">
                        <h1 className="text-3xl font-semibold tracking-tight text-xl text-gray-800">Nuevo Análisis de Impacto</h1>
                        <p className="text-gray-500 max-w-xl mx-auto">Analiza los últimos 20 posts de cualquier cuenta o hashtag para descubrir qué funciona.</p>
                      </div>

                      <form onSubmit={handleAnalyze} className="bg-gray-100  rounded-[2rem]  shadow-md/5  p-8 space-y-6 max-w-2xl mx-auto">
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" /> Tipo de Contenido
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {(["all", "posts", "reels"] as const).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => setContentType(type)}
                                  className={`py-2 px-4 rounded-[2rem] text-xs font-semibold tracking-tight text-xl transition-all ${contentType === type
                                    ? "bg-gray-900 text-white shadow-md border-gray-900 shadow-md shadow-md"
                                    : "bg-gray-100  text-gray-500  hover:border-gray-900"
                                    }`}
                                >
                                  {type === "all" ? "Todo" : type === "posts" ? "Posts" : "Reels"}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                              <Instagram className="w-4 h-4" /> URL de Instagram
                            </label>
                            <input
                              required
                              type="url"
                              placeholder="https://www.instagram.com/usuario/"
                              className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                              value={instagramUrl}
                              onChange={(e) => setInstagramUrl(e.target.value)}
                            />
                          </div>

                          {showAdvanced ? (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="space-y-6 overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                                    <Cpu className="w-4 h-4" /> Proveedor
                                  </label>
                                  <select
                                    className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none bg-gray-100 "
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value as Provider)}
                                  >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="openai">OpenAI (GPT-4o)</option>
                                    <option value="claude">Anthropic Claude</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                                    <Key className="w-4 h-4" /> API Key
                                  </label>
                                  <input
                                    required
                                    type="password"
                                    placeholder="Pega tu API key"
                                    className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                                  <Zap className="w-4 h-4" /> Apify Token
                                </label>
                                <input
                                  required
                                  type="password"
                                  placeholder="Tu token de Apify"
                                  className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                                  value={apifyToken}
                                  onChange={(e) => setApifyToken(e.target.value)}
                                />
                              </div>
                            </motion.div>
                          ) : (
                            <div className="text-center">
                              <button
                                type="button"
                                onClick={() => setShowAdvanced(true)}
                                className="text-xs font-semibold tracking-tight text-xl text-gray-400 hover:text-gray-900 transition-all flex items-center justify-center gap-1 mx-auto"
                              >
                                <Key className="w-3 h-3" /> Usando credenciales guardadas. <span className="underline">Cambiar</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {error && (
                          <div className="p-4 bg-red-50 border-red-100 rounded-[2rem] flex items-center gap-3 text-red-700 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                          </div>
                        )}

                        <button
                          disabled={loading}
                          type="submit"
                          className="w-full bg-gray-900 text-white shadow-md hover:bg-gray-800 font-semibold tracking-tight text-xl py-4 rounded-[2rem]  shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                          Iniciar Análisis Profundo
                        </button>
                      </form>
                    </div>
                  )}

                  {step === "processing" && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gray-900 text-white shadow-md blur-3xl opacity-20 animate-pulse" />
                        <Loader2 className="w-20 h-20 text-gray-900 animate-spin relative z-10" />
                      </div>
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-xl text-gray-800">Analizando Impacto...</h2>
                        <p className="text-gray-500">Estamos procesando los datos con IA para darte los mejores consejos.</p>
                      </div>
                    </div>
                  )}

                  {step === "result" && result && (
                    <div className="space-y-10">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold tracking-tight text-xl">Resultados del Análisis</h2>
                        <button
                          onClick={() => setStep("input")}
                          className="text-sm font-semibold tracking-tight text-xl text-gray-900 hover:underline"
                        >
                          Nuevo Análisis
                        </button>
                      </div>

                      {result.topPosts[0] && (
                        <div className="relative h-64 rounded-[2rem] overflow-hidden group shadow-2xl shadow-md/10">
                          <img
                            src={result.topPosts[0].thumbnail || `https://picsum.photos/seed/${result.runId}/800/400`}
                            alt="Featured Post"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${result.runId}/800/400`;
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-gray-900 text-white shadow-md text-[10px] font-semibold tracking-tight text-xl px-2 py-1 rounded-full uppercase tracking-wider">Top Impacto</span>
                              <span className="bg-gray-100 /20 backdrop-blur-md text-white text-[10px] font-semibold tracking-tight text-xl px-2 py-1 rounded-full uppercase tracking-wider">Score: {result.topPosts[0].impactScore.toFixed(1)}</span>
                            </div>
                            <h3 className="text-white font-semibold tracking-tight text-xl text-xl line-clamp-2 max-w-2xl">
                              {result.insights.summary.split('.')[0]}.
                            </h3>
                          </div>
                        </div>
                      )}

                      <div className="p-8 bg-gray-900 text-white shadow-md rounded-[2rem] border-gray-900">
                        <h3 className="text-gray-900900 font-semibold tracking-tight text-xl mb-4 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" /> Resumen Ejecutivo
                        </h3>
                        <p className="text-gray-900800 leading-relaxed">{result.insights.summary}</p>
                      </div>

                      {result.insights.avatar_analysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-gray-100  rounded-[2rem] p-8   space-y-6">
                            <h3 className="text-xl font-semibold tracking-tight text-xl flex items-center gap-2">
                              <User className="w-5 h-5 text-pink-500" /> Perfil del Avatar
                            </h3>
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-[10px] font-semibold tracking-tight text-xl text-gray-400 uppercase tracking-wider mb-3">Deseos y Aspiraciones</h4>
                                <ul className="space-y-3">
                                  {result.insights.avatar_analysis.desires.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-semibold tracking-tight text-xl text-gray-400 uppercase tracking-wider mb-3">Miedos y Frustraciones</h4>
                                <ul className="space-y-3">
                                  {[...result.insights.avatar_analysis.fears, ...result.insights.avatar_analysis.frustrations].map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 flex gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-900 text-white shadow-md rounded-[2rem] p-8 text-white  shadow-md space-y-6">
                            <h3 className="text-xl font-semibold tracking-tight text-xl flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-yellow-400" /> Ángulos de Venta
                            </h3>
                            <div className="space-y-4">
                              {result.insights.avatar_analysis.key_angles.map((angle, i) => (
                                <div key={i} className="bg-gray-100 /10 backdrop-blur-md p-4 rounded-[2rem] border-white/10">
                                  <p className="text-sm leading-relaxed opacity-90">{angle}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {result.insights.predictions && (
                        <div className="bg-gradient-to-br from-accent-900 to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Cpu className="w-32 h-32" />
                          </div>
                          <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-900 text-white shadow-md/20 p-2 rounded-lg backdrop-blur-sm">
                                <TrendingUp className="w-6 h-6 text-gray-900400" />
                              </div>
                              <h3 className="text-2xl font-semibold tracking-tight text-xl">Predicciones y Tendencias</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold tracking-tight text-xl text-gray-900300 uppercase tracking-wider">Tendencia Futura</h4>
                                <p className="text-sm leading-relaxed text-gray-90050/80">{result.insights.predictions.trend}</p>
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold tracking-tight text-xl text-gray-900300 uppercase tracking-wider">Siguiente Gran Paso</h4>
                                <p className="text-sm leading-relaxed text-gray-90050/80">{result.insights.predictions.next_big_thing}</p>
                              </div>
                              <div className="space-y-3">
                                <h4 className="text-[10px] font-semibold tracking-tight text-xl text-gray-900300 uppercase tracking-wider">Crecimiento Estimado</h4>
                                <div className="inline-flex items-center gap-2 bg-gray-900 text-white shadow-md/20 px-3 py-1 rounded-full border-gray-900/30">
                                  <Zap className="w-3 h-3 text-yellow-400" />
                                  <span className="text-xs font-semibold tracking-tight text-xl text-gray-400">{result.insights.predictions.estimated_growth}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-100  rounded-[2rem] p-8   space-y-6">
                          <h3 className="text-xl font-semibold tracking-tight text-xl flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-gray-900" /> Patrones
                          </h3>
                          <ul className="space-y-4">
                            {result.insights.patterns.map((p, i) => (
                              <li key={i} className="text-sm text-gray-600 flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-900 text-white shadow-md mt-1.5 flex-shrink-0" />
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-gray-100  rounded-[2rem] p-8   space-y-6">
                          <h3 className="text-xl font-semibold tracking-tight text-xl flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-gray-1000" /> Recomendaciones
                          </h3>
                          <ul className="space-y-4">
                            {result.insights.recommendations.map((r, i) => (
                              <li key={i} className="text-sm text-gray-600 flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-semibold tracking-tight text-xl">Piezas Analizadas</h3>
                          <button
                            onClick={() => setShowAllPosts(!showAllPosts)}
                            className="text-xs font-semibold tracking-tight text-xl text-gray-900 hover:underline"
                          >
                            {showAllPosts ? "Ver solo Top 5" : "Ver todos los posts"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {(showAllPosts ? result.topPosts : result.topPosts.slice(0, 5)).map((post, i) => (
                            <div key={i} className="bg-gray-100  rounded-[2rem] overflow-hidden  ">
                              <img
                                src={post.thumbnail || `https://picsum.photos/seed/${post.url}/400/400`}
                                alt=""
                                className="aspect-square object-cover w-full"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.url}/400/400`;
                                }}
                              />
                              <div className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold tracking-tight text-xl bg-gray-900 text-white shadow-md text-gray-900 px-2 py-1 rounded-md">Impacto: {post.impactScore.toFixed(1)}</span>
                                  <a href={post.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-600"><ExternalLink className="w-4 h-4" /></a>
                                </div>
                                <div className="flex gap-4 text-[10px] text-gray-400">
                                  <span>{post.likes} Likes</span>
                                  <span>{post.comments} Comms</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {view === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-semibold tracking-tight text-xl text-gray-800">Historial de Análisis</h1>
                    <span className="text-sm text-gray-400 font-semibold tracking-tight text-xl">{history.length} análisis realizados</span>
                  </div>

                  <div className="bg-gray-100  rounded-[2rem]   overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 ">
                        <tr>
                          <th className="px-6 py-4 text-xs font-semibold tracking-tight text-xl text-gray-600 uppercase tracking-wider">Instagram URL</th>
                          <th className="px-6 py-4 text-xs font-semibold tracking-tight text-xl text-gray-600 uppercase tracking-wider">Fecha</th>
                          <th className="px-6 py-4 text-xs font-semibold tracking-tight text-xl text-gray-600 uppercase tracking-wider">Estado</th>
                          <th className="px-6 py-4 text-xs font-semibold tracking-tight text-xl text-gray-600 uppercase tracking-wider text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {history.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden  flex-shrink-0">
                                  <img
                                    src={item.thumbnail_url || `https://picsum.photos/seed/${item.id}/100/100`}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/100/100`;
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-semibold tracking-tight text-xl text-gray-700 truncate max-w-[200px]">{item.instagram_url}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[10px] font-semibold tracking-tight text-xl px-2 py-1 rounded-full uppercase tracking-wider ${item.status === 'completed' ? 'bg-green-100 text-green-600' :
                                item.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => { setView("analyze"); loadRun(item.id); }}
                                className="text-gray-900 hover:text-gray-700 font-semibold tracking-tight text-xl text-sm"
                              >
                                Ver Detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                        {history.length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">No hay análisis registrados aún.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {view === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-4">
                    <h1 className="text-3xl font-semibold tracking-tight text-xl text-gray-800">Configuración</h1>
                    <p className="text-gray-500 max-w-xl mx-auto">Guarda tus credenciales para no tener que ingresarlas en cada análisis.</p>
                  </div>

                  <form onSubmit={saveSettings} className="bg-gray-100  rounded-[2rem]  shadow-md/5  p-8 space-y-6 max-w-2xl mx-auto">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                          <Instagram className="w-4 h-4" /> URL de Instagram Predeterminada
                        </label>
                        <input
                          type="url"
                          placeholder="https://www.instagram.com/tu_usuario/"
                          className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none transition-all"
                          value={settings.instagram_url}
                          onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                            <Cpu className="w-4 h-4" /> Proveedor de IA
                          </label>
                          <select
                            className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none bg-gray-100 "
                            value={settings.ai_provider}
                            onChange={(e) => setSettings({ ...settings, ai_provider: e.target.value as Provider })}
                          >
                            <option value="gemini">Google Gemini</option>
                            <option value="openai">OpenAI (GPT-4o)</option>
                            <option value="claude">Anthropic Claude</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                            <Key className="w-4 h-4" /> API Key de IA
                          </label>
                          <input
                            type="password"
                            placeholder="Pega tu API key"
                            className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                            value={settings.ai_api_key}
                            onChange={(e) => setSettings({ ...settings, ai_api_key: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold tracking-tight text-xl text-gray-700 flex items-center gap-2">
                          <Zap className="w-4 h-4" /> Token de API de Apify
                        </label>
                        <input
                          type="password"
                          placeholder="Tu token de Apify"
                          className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                          value={settings.apify_token}
                          onChange={(e) => setSettings({ ...settings, apify_token: e.target.value })}
                        />
                      </div>

                      <div className="pt-6 ">
                        <h3 className="text-lg font-semibold tracking-tight text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-gray-900" /> Identidad de Marca
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">Valores e Identidad</label>
                            <textarea
                              placeholder="¿Cuáles son los valores fundamentales de tu marca?"
                              className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none h-24 resize-none"
                              value={settings.brand_values}
                              onChange={(e) => setSettings({ ...settings, brand_values: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">Personalidad</label>
                              <input
                                placeholder="¿Quién eres como marca?"
                                className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                                value={settings.brand_personality}
                                onChange={(e) => setSettings({ ...settings, brand_personality: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">Visión al Mundo</label>
                              <input
                                placeholder="¿Cómo quieres ser percibido?"
                                className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                                value={settings.brand_vision}
                                onChange={(e) => setSettings({ ...settings, brand_vision: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 ">
                        <h3 className="text-lg font-semibold tracking-tight text-xl text-gray-800 mb-4 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-gray-900" /> Producto y Oferta
                        </h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">Producto o Servicio</label>
                            <input
                              placeholder="¿Qué vendes exactamente?"
                              className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                              value={settings.product_service}
                              onChange={(e) => setSettings({ ...settings, product_service: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">La Gran Promesa</label>
                            <input
                              placeholder="¿Cuál es el resultado principal que prometes?"
                              className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none"
                              value={settings.big_promise}
                              onChange={(e) => setSettings({ ...settings, big_promise: e.target.value })}
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">Problemas que Resuelves</label>
                              <textarea
                                placeholder="Dolores principales del cliente"
                                className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none h-20 resize-none"
                                value={settings.problems_solved}
                                onChange={(e) => setSettings({ ...settings, problems_solved: e.target.value })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-semibold tracking-tight text-xl text-gray-500 uppercase tracking-wider">Mecanismo Único</label>
                              <textarea
                                placeholder="¿Por qué tu método es diferente?"
                                className="w-full px-4 py-3 rounded-[2rem]  focus:ring-2 focus:ring-accent-500 outline-none h-20 resize-none"
                                value={settings.unique_mechanism}
                                onChange={(e) => setSettings({ ...settings, unique_mechanism: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={saveStatus === "saving"}
                      type="submit"
                      className={`w-full py-4 rounded-[2rem]  transition-all flex items-center justify-center gap-2 disabled:opacity-50 font-semibold tracking-tight text-xl ${saveStatus === "success"
                        ? "bg-green-500 text-white shadow-green-200"
                        : "bg-gray-900 text-white shadow-md shadow-md hover:bg-gray-800"
                        }`}
                    >
                      {saveStatus === "saving" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : saveStatus === "success" ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" /> ¡Guardado con éxito!
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" /> Guardar Configuración
                        </>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 py-8  mt-auto text-center text-[10px] text-gray-400 uppercase tracking-widest font-semibold tracking-tight text-xl">
          <p>© 2026 Creator Impact Analyzer • Marca Personal & Datos</p>
        </footer>
      </div>
    </div>
  );
}
