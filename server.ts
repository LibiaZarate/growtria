import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { ApifyClient } from "apify-client";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'))
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
});
const upload = multer({ storage: storage });

const db = new Database("database.sqlite");
const JWT_SECRET = process.env.JWT_SECRET || "clinics-arquitect-media-secret-key-2026";

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS analysis_runs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    instagram_url TEXT,
    provider TEXT,
    status TEXT,
    thumbnail_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS scraped_posts (
    id TEXT PRIMARY KEY,
    analysis_run_id TEXT,
    post_url TEXT,
    caption TEXT,
    content_type TEXT,
    published_at TEXT,
    likes_count INTEGER,
    comments_count INTEGER,
    views_count INTEGER,
    plays_count INTEGER,
    thumbnail_url TEXT,
    raw_json TEXT,
    impact_score REAL,
    FOREIGN KEY(analysis_run_id) REFERENCES analysis_runs(id)
  );

  CREATE TABLE IF NOT EXISTS ai_insights (
    id TEXT PRIMARY KEY,
    analysis_run_id TEXT,
    summary TEXT,
    top_posts_json TEXT,
    patterns_json TEXT,
    recommendations_json TEXT,
    avatar_analysis_json TEXT,
    predictions_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(analysis_run_id) REFERENCES analysis_runs(id)
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id TEXT PRIMARY KEY,
    instagram_url TEXT,
    ai_provider TEXT DEFAULT 'gemini',
    ai_api_key TEXT,
    apify_token TEXT,
    brand_values TEXT,
    brand_personality TEXT,
    brand_vision TEXT,
    product_service TEXT,
    big_promise TEXT,
    problems_solved TEXT,
    unique_mechanism TEXT,
    jiro_prompt TEXT,
    jiro_knowledge TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS hub_pages (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE,
    slug TEXT UNIQUE,
    title TEXT,
    bio_text TEXT,
    avatar_url TEXT,
    primary_cta_text TEXT,
    primary_cta_url TEXT,
    theme_color TEXT DEFAULT 'indigo',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  // Add new columns if they don't exist
  try { db.prepare("ALTER TABLE hub_pages ADD COLUMN specialty TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE hub_pages ADD COLUMN intro_video_url TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE hub_pages ADD COLUMN products_json TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE hub_pages ADD COLUMN certifications_json TEXT").run(); } catch (e) {}
  try { db.prepare("ALTER TABLE hub_pages ADD COLUMN whatsapp_number TEXT").run(); } catch (e) {}

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    hub_page_id TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    source TEXT,
    resource_requested TEXT,
    status TEXT DEFAULT 'new', -- new, contacted, appointment_booked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(hub_page_id) REFERENCES hub_pages(id)
  );
  
  CREATE TABLE IF NOT EXISTS metrics_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    hub_page_id TEXT,
    event_type TEXT,
    resource_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(hub_page_id) REFERENCES hub_pages(id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    role TEXT, -- 'user' or 'assistant'
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Migration: Add columns to ai_insights if they don't exist
const aiInsightsColumns = [
  "summary", "top_posts_json", "patterns_json", "recommendations_json",
  "avatar_analysis_json", "predictions_json"
];

aiInsightsColumns.forEach(col => {
  try {
    db.prepare(`SELECT ${col} FROM ai_insights LIMIT 1`).get();
  } catch (e) {
    console.log(`Adding ${col} column to ai_insights...`);
    db.exec(`ALTER TABLE ai_insights ADD COLUMN ${col} TEXT`);
  }
});

// Migration: Add columns to user_settings if they don't exist
const userSettingsColumns = [
  "brand_values", "brand_personality", "brand_vision",
  "product_service", "big_promise", "problems_solved", "unique_mechanism",
  "core_identity", "core_problem", "initial_niche", "brand_archetype", "brand_narrative", "content_distribution"
];

userSettingsColumns.forEach(col => {
  try {
    db.prepare(`SELECT ${col} FROM user_settings LIMIT 1`).get();
  } catch (e) {
    console.log(`Adding ${col} column to user_settings...`);
    db.exec(`ALTER TABLE user_settings ADD COLUMN ${col} TEXT`);
  }
});

// Migration: Add columns to hub_pages if they don't exist
const hubPagesColumns = [
  "specialty", "intro_video_url", "products_json", "certifications_json", "whatsapp_number"
];

hubPagesColumns.forEach(col => {
  try {
    db.prepare(`SELECT ${col} FROM hub_pages LIMIT 1`).get();
  } catch (e) {
    console.log(`Adding ${col} column to hub_pages...`);
    db.exec(`ALTER TABLE hub_pages ADD COLUMN ${col} TEXT`);
  }
});

// Middleware to verify JWT and user existence
const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ error: "Sesión inválida o expirada" });

    // Verificar que el usuario aún existe en la base de datos (importante si se reseteó la DB)
    const user = db.prepare("SELECT id FROM users WHERE id = ?").get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado. Por favor, inicia sesión de nuevo." });
    }

    req.user = decoded;
    next();
  });
};

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = Math.random().toString(36).substring(7);
      db.prepare("INSERT INTO users (id, email, password) VALUES (?, ?, ?)").run(userId, email, hashedPassword);

      const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: userId, email } });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  });

  // Facebook OAuth logic
  app.get("/api/auth/facebook", authenticateToken, (req: any, res) => {
    const appId = process.env.VITE_FB_APP_ID;
    const redirectUri = process.env.VITE_FB_REDIRECT_URI || "http://localhost:3000/api/auth/facebook/callback";
    const state = req.user.id; // Passing user ID as state to link account in callback
    
    if (!appId) {
      return res.status(500).json({ error: "Falta configurar VITE_FB_APP_ID en el servidor." });
    }

    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement`;
    res.json({ url });
  });

  app.get("/api/auth/facebook/callback", async (req, res) => {
    const { code, state } = req.query;
    
    // State contains the user_id that started the flow
    if (!code || !state) {
      return res.status(400).send("Faltan parámetros de Facebook.");
    }
    
    const appId = process.env.VITE_FB_APP_ID;
    const appSecret = process.env.VITE_FB_APP_SECRET;
    const redirectUri = process.env.VITE_FB_REDIRECT_URI || "http://localhost:3000/api/auth/facebook/callback";

    try {
      // 1. Exchange code for short-lived access token
      const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
      const tokenData = await tokenRes.json();
      
      if (tokenData.error) throw new Error(tokenData.error.message);
      
      const shortLivedToken = tokenData.access_token;
      
      // 2. Exchange short-lived token for long-lived token
      const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
      const longData = await longRes.json();
      
      if (longData.error) throw new Error(longData.error.message);
      
      const longToken = longData.access_token;
      
      // Calculate expiration for long token (approx 60 days)
      const expiresIn = longData.expires_in || 5184000; // default 60 days
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
      
      // 3. Save correctly to user_settings table
      const existing = db.prepare("SELECT user_id FROM user_settings WHERE user_id = ?").get(state as string);
      
      if (existing) {
        db.prepare("UPDATE user_settings SET facebook_access_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?").run(longToken, expiresAt, state);
      } else {
        db.prepare("INSERT INTO user_settings (user_id, facebook_access_token, token_expires_at) VALUES (?, ?, ?)").run(state, longToken, expiresAt);
      }
      
      // Finally redirect to frontend settings page to show success
      res.redirect("/?view=settings&fb_success=true");
    } catch (err: any) {
      console.error("Error en FB Auth:", err);
      res.redirect("/?view=settings&fb_error=true");
    }
  });

  app.post("/api/public/lead", async (req, res) => {
    const { slug, name, email, resource_requested } = req.body;
    if (!slug || !name || !email) return res.status(400).json({ error: "Missing required fields" });

    try {
      const hubPage = db.prepare("SELECT * FROM hub_pages WHERE slug = ?").get(slug) as any;
      if (!hubPage) return res.status(404).json({ error: "Page not found" });

      const leadId = Math.random().toString(36).substring(7);
      db.prepare(`
        INSERT INTO leads (id, user_id, hub_page_id, name, email, resource_requested)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(leadId, hubPage.user_id, hubPage.id, name, email, resource_requested);

      res.json({ success: true, leadId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/public/metrics/click", async (req, res) => {
    const { slug, event_type, resource_id } = req.body;
    if (!slug || !event_type) return res.status(400).json({ error: "Missing required fields" });

    try {
      const hubPage = db.prepare("SELECT * FROM hub_pages WHERE slug = ?").get(slug) as any;
      if (!hubPage) return res.status(404).json({ error: "Page not found" });

      const logId = Math.random().toString(36).substring(7);
      db.prepare(`
        INSERT INTO metrics_logs (id, user_id, hub_page_id, event_type, resource_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(logId, hubPage.user_id, hubPage.id, event_type, resource_id || null);

      res.json({ success: true, logId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Protected API Routes
  app.post("/api/upload", authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
  app.post("/api/analyze", authenticateToken, async (req: any, res) => {
    const { instagramUrl, provider, contentType, apiKey, apifyToken } = req.body;
    const userId = req.user.id;

    if (!instagramUrl || !provider || !apiKey || !apifyToken) {
      return res.status(400).json({ error: "Faltan campos obligatorios (URL, Proveedor, API Key o Token de Apify)" });
    }

    const cleanApiKey = apiKey.trim();
    const cleanApifyToken = apifyToken.trim();
    const cleanUrl = instagramUrl.trim();

    const runId = Math.random().toString(36).substring(7);

    try {
      // 0. Fetch User Settings and History for Context
      const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
      const hubPage = db.prepare("SELECT title FROM hub_pages WHERE user_id = ?").get(userId) as any;
      const docName = hubPage?.title || "Pediatric OS";
      const brandContext = settings ? `
        === SISTEMA OPERATIVO DE MARCA PERSONAL (${docName}) ===
        
        1. IDENTIDAD NUCLEAR (Misión, Visión, Tipo de mente):
        ${settings.core_identity || "No especificado"}
        
        2. EL PROBLEMA DEL MUNDO QUE RESUELVE:
        ${settings.core_problem || settings.problems_solved || "No especificado"}
        
        3. EL NICHO INICIAL (Campo de batalla):
        ${settings.initial_niche || "No especificado"}
        
        4. SISTEMA DE VALORES (Protocolos Operativos):
        ${settings.brand_values || "No especificado"}
        
        5. ARQUETIPO DE MARCA (Personalidad y Tono):
        ${settings.brand_archetype || settings.brand_personality || "No especificado"}
        
        6. MECANISMO ÚNICO (Sistemas, no sólo servicios):
        ${settings.unique_mechanism || "No especificado"}
        
        7. LA GRAN PROMESA:
        ${settings.big_promise || "No especificado"}
        
        8. LA NARRATIVA DE MARCA (Historia continua y de futuro):
        ${settings.brand_narrative || "No especificado"}
        
        9. DISTRIBUCIÓN DE CONTENIDO (Foco y Mezcla de Atracción, Autoridad, Conversión):
        ${settings.content_distribution || "No especificado"}
        
        PRODUCTO / SERVICIO ACTUAL:
        ${settings.product_service || "No especificado"}
      ` : "";

      // Fetch last 3 successful runs for historical context
      const previousRuns = db.prepare(`
        SELECT i.* FROM ai_insights i 
        JOIN analysis_runs r ON i.analysis_run_id = r.id 
        WHERE r.user_id = ? AND r.status = 'completed' 
        ORDER BY r.created_at DESC LIMIT 3
      `).all(userId) as any[];

      const historyContext = previousRuns.length > 0 ? `
        HISTORIAL DE EVOLUCIÓN (Contexto para entrenamiento):
        Has realizado ${previousRuns.length} análisis previos recientemente.
        Resúmenes anteriores: ${previousRuns.map(h => h.summary).join(' | ')}
        Usa esta información para detectar si el usuario está mejorando, si los patrones cambian o si hay una trayectoria clara.
      ` : "Este es el primer análisis exitoso o no hay historial previo. Establece la línea base.";

      // 1. Create Run Record
      db.prepare("INSERT INTO analysis_runs (id, user_id, instagram_url, provider, status) VALUES (?, ?, ?, ?, ?)").run(
        runId, userId, cleanUrl, provider, "scraping"
      );

      // 2. Data Extraction: Meta Graph API (Official) OR Apify (Fallback)
      let items: any[] = [];

      if (settings.facebook_access_token) {
        // --- META GRAPH API FLOW ---
        const fbToken = settings.facebook_access_token;
        
        // A) Get user's Facebook Pages
        const pagesRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${fbToken}`);
        const pagesData = await pagesRes.json();
        
        if (!pagesData.data || pagesData.data.length === 0) {
          throw new Error("No se encontraron páginas de Facebook vinculadas a tu cuenta. Asegúrate de tener una Página de FB conectada a tu Instagram.");
        }

        let igAccountId = null;
        
        // B) Find the Instagram Business Account ID attached to one of the Pages
        for (const page of pagesData.data) {
          const igRes = await fetch(`https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${fbToken}`);
          const igData = await igRes.json();
          if (igData.instagram_business_account) {
            igAccountId = igData.instagram_business_account.id;
            break;
          }
        }

        if (!igAccountId) {
          throw new Error("No se encontró ninguna cuenta de Instagram Business/Creator vinculada a tus páginas de Facebook.");
        }

        // C) Fetch Media (Posts & Reels)
        const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count&limit=30&access_token=${fbToken}`);
        const mediaData = await mediaRes.json();

        if (!mediaData.data) {
          throw new Error("Error al obtener las publicaciones de Instagram Graph API. Posible token expirado.");
        }

        // D) Fetch deeper insights for each media & transform to expected schema
        for (const m of mediaData.data) {
          let sharesCount = 0;
          let playsCount = 0;
          let viewsCount = 0;

          try {
            const metricIds = m.media_type === 'VIDEO' ? 'plays,reach,saved,total_interactions' : 'impressions,reach,saved';
            const insightsRes = await fetch(`https://graph.facebook.com/v19.0/${m.id}/insights?metric=${metricIds}&access_token=${fbToken}`);
            const insightsData = await insightsRes.json();
            
            if (insightsData.data) {
              const getVal = (name: string) => insightsData.data.find((i: any) => i.name === name)?.values[0]?.value || 0;
              
              if (m.media_type === 'VIDEO') {
                playsCount = getVal('plays');
                viewsCount = getVal('reach');
                // Estimating shares if absolute value isn't directly exposed
                sharesCount = getVal('total_interactions') - (m.like_count || 0) - (m.comments_count || 0) - getVal('saved');
              } else {
                viewsCount = getVal('impressions');
              }
            }
          } catch(e) { console.error("Error fetching insights for media", m.id); }

          items.push({
            id: m.id,
            url: m.permalink,
            caption: m.caption,
            type: m.media_type === 'VIDEO' ? 'Video' : (m.media_type === 'CAROUSEL_ALBUM' ? 'Sidecar' : 'Image'),
            timestamp: m.timestamp,
            likesCount: m.like_count || 0,
            commentsCount: m.comments_count || 0,
            videoPlayCount: playsCount,
            videoViewCount: viewsCount,
            sharesCount: Math.max(0, sharesCount),
            displayUrl: m.thumbnail_url || m.media_url
          });
        }
      } else {
        // --- FALLBACK TO APIFY ---
        if (!cleanApifyToken) {
           throw new Error("Falta configurar la conexión oficial de Meta o tu Apify Token personal.");
        }

        const client = new ApifyClient({ token: cleanApifyToken });
        const isHashtag = cleanUrl.includes("/explore/tags/");

        const input = {
          "directUrls": [cleanUrl],
          "resultsLimit": 20,
          "resultsType": "posts",
          "searchType": isHashtag ? "hashtag" : "user",
          "searchLimit": 1,
          "proxyConfiguration": {
            "useApifyProxy": true
          },
          "extendOutputFunction": "($) => { return { scrapedAt: new Date().toISOString() }; }",
          "addParentData": true
        };

        const apiRun = await client.actor("apify/instagram-scraper").call(input);
        const dataset = await client.dataset(apiRun.defaultDatasetId).listItems();
        items = dataset.items;
      }

      // Filter by content type if requested
      if (contentType === "posts") {
        items = items.filter((item: any) => item.type === "Image" || item.type === "Sidecar");
      } else if (contentType === "reels") {
        items = items.filter((item: any) => item.type === "Video");
      }

      if (!items || items.length === 0) {
        throw new Error(`No se pudieron obtener ${contentType === 'reels' ? 'reels' : contentType === 'posts' ? 'posts' : 'datos'} de Instagram. Verifica que la cuenta sea pública.`);
      }

      // 3. Process & Store Posts
      const insertPost = db.prepare(`
        INSERT INTO scraped_posts (id, analysis_run_id, post_url, caption, content_type, published_at, likes_count, comments_count, views_count, plays_count, thumbnail_url, raw_json, impact_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const processedItems = items.map((item: any) => {
        const likes = item.likesCount || 0;
        const comments = item.commentsCount || 0;
        const shares = item.sharesCount || 0;
        const plays = item.videoPlayCount || item.videoViewCount || 0;
        const views = item.videoViewCount || 0;

        // Nueva Fórmula de Impacto: Prioridad a Comentarios y Compartidos
        // Comentarios (x10), Compartidos (x15), Likes (x1), Vistas (x0.01)
        const impactScore = (likes * 1) + (comments * 10) + (shares * 15) + (plays * 0.01);

        const postId = Math.random().toString(36).substring(7);
        insertPost.run(
          postId,
          runId,
          item.url,
          item.caption || "",
          item.type || "post",
          item.timestamp,
          likes,
          comments,
          views,
          plays,
          item.displayUrl,
          JSON.stringify(item),
          impactScore
        );
        return { ...item, impactScore, sharesCount: shares };
      });

      // Update status
      db.prepare("UPDATE analysis_runs SET status = ? WHERE id = ?").run("analyzing", runId);

      // 4. AI Analysis
      const topPosts = processedItems
        .sort((a: any, b: any) => b.impactScore - a.impactScore)
        .slice(0, 5);

      const prompt = `
        Analiza detalladamente los siguientes ${contentType === 'reels' ? 'Reels' : contentType === 'posts' ? 'Posts' : 'contenidos'} de Instagram de la cuenta ${instagramUrl}.
        Tu objetivo es identificar qué genera el mayor IMPACTO real, con un enfoque especial en la MARCA PERSONAL y cómo se alinea con la identidad del negocio.
        
        ${brandContext}
        ${historyContext}

        CRITERIOS DE ANÁLISIS DE MARCA PERSONAL:
        - Prioriza ${contentType === 'reels' ? 'reels' : 'posts'} donde aparezca la cara del creador (documentando su vida/gustos).
        - Evalúa la conexión emocional y la autenticidad.
        - Identifica si el contenido humaniza la marca o es puramente estético/genérico.
        
        ANÁLISIS DEL AVATAR PSICOGRÁFICO:
        Basándote en el contenido que mejor funciona y el contexto de marca/producto, define el Avatar Ideal:
        - Deseos profundos: ¿Qué quiere lograr realmente la audiencia?
        - Miedos y Frustraciones: ¿Qué les quita el sueño?
        - Ángulos Clave: ¿Cómo debe el contenido abordar estos puntos para conectar con el producto/servicio?
        
        IMPORTANTE: El impacto se define principalmente por Comentarios y Compartidos, luego Likes. Las vistas son secundarias pero deben mencionarse.
        
        Analiza CADA DATO de los Top 5 ${contentType === 'reels' ? 'Reels' : contentType === 'posts' ? 'Posts' : 'Contenidos'} sin saltarte nada:
        ${JSON.stringify(topPosts.map(p => ({
        caption: p.caption,
        type: p.type,
        likes: p.likesCount,
        comments: p.commentsCount,
        shares: p.sharesCount,
        plays: p.videoPlayCount,
        timestamp: p.timestamp,
        impactScore: p.impactScore
      })), null, 2)}

        Resumen de todos los ${contentType === 'reels' ? 'reels' : contentType === 'posts' ? 'posts' : 'contenidos'} analizados:
        Total de ${contentType === 'reels' ? 'reels' : contentType === 'posts' ? 'posts' : 'contenidos'}: ${processedItems.length}
        Promedio de Likes: ${processedItems.reduce((acc: number, curr: any) => acc + (curr.likesCount || 0), 0) / processedItems.length}
        Promedio de Comentarios: ${processedItems.reduce((acc: number, curr: any) => acc + (curr.commentsCount || 0), 0) / processedItems.length}
        
        Por favor, responde en ESPAÑOL y proporciona:
        1. Un resumen ejecutivo del rendimiento general enfocado en la marca personal, específicamente para ${contentType === 'reels' ? 'reels' : contentType === 'posts' ? 'posts' : 'el contenido en general'}.
        2. Un análisis detallado de por qué estos Top 5 ${contentType === 'reels' ? 'reels' : contentType === 'posts' ? 'posts' : 'contenidos'} funcionaron, analizando sus ganchos (hooks), temas, estilo de caption, presencia de la cara/personalidad y métricas específicas.
        3. Patrones detectados en el contenido que genera conversación (comentarios) y conexión personal.
        4. 3 recomendaciones accionables y específicas para fortalecer la marca personal y documentar mejor su día a día basándose en estos datos de ${contentType === 'reels' ? 'reels' : contentType === 'posts' ? 'posts' : 'contenido'}.
        5. Un análisis del Avatar Psicográfico (deseos, miedos, frustraciones y ángulos de venta).
        6. PREDICCIONES Y TENDENCIAS: Basándote en el historial y los datos actuales, predice qué pasará si sigue así, cuál es el "siguiente gran paso" y una proyección de crecimiento.
        
        Responde ÚNICAMENTE en formato JSON con las siguientes llaves:
        {
          "summary": "...",
          "top_posts_analysis": "...",
          "patterns": ["...", "..."],
          "recommendations": ["...", "..."],
          "avatar_analysis": {
            "desires": ["...", "..."],
            "fears": ["...", "..."],
            "frustrations": ["...", "..."],
            "key_angles": ["...", "..."]
          },
          "predictions": {
            "trend": "Tendencia futura detectada",
            "next_big_thing": "El siguiente gran contenido o estrategia a probar",
            "estimated_growth": "Proyección de crecimiento estimada"
          }
        }
      `;

      let aiResponseText = "";

      if (provider === "gemini") {
        const ai = new GoogleGenAI({ apiKey: cleanApiKey });
        const result = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt
        });
        aiResponseText = result.text || "";
      } else if (provider === "openai") {
        const openai = new OpenAI({ apiKey: cleanApiKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini",
          response_format: { type: "json_object" }
        });
        aiResponseText = completion.choices[0].message.content || "";
      } else if (provider === "anthropic" || provider === "claude") {
        const anthropic = new Anthropic({ apiKey: cleanApiKey });
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });
        // @ts-ignore
        aiResponseText = msg.content[0].text;
      }

      // Robust JSON parsing
      let aiData;
      try {
        const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : aiResponseText;
        aiData = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("AI Response parsing failed. Raw text:", aiResponseText);
        throw new Error("La IA devolvió un formato inválido. Por favor, intenta de nuevo.");
      }

      // 5. Store Insights
      // 5. Store Insights
      const insightsId = Math.random().toString(36).substring(7);
      const summaryStr = aiData.summary ? String(aiData.summary) : "";
      const topPostsStr = aiData.top_posts_analysis ? String(aiData.top_posts_analysis) : "";
      const patternsStr = aiData.patterns ? JSON.stringify(aiData.patterns) : null;
      const recsStr = aiData.recommendations ? JSON.stringify(aiData.recommendations) : null;
      const avatarStr = aiData.avatar_analysis ? JSON.stringify(aiData.avatar_analysis) : null;
      const predictionsStr = aiData.predictions ? JSON.stringify(aiData.predictions) : null;

      db.prepare(`
        INSERT INTO ai_insights (id, analysis_run_id, summary, top_posts_json, patterns_json, recommendations_json, avatar_analysis_json, predictions_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        insightsId,
        runId,
        summaryStr,
        topPostsStr,
        patternsStr,
        recsStr,
        avatarStr,
        predictionsStr
      );

      // Update status and thumbnail
      const topThumbnail = topPosts[0]?.displayUrl || "";
      db.prepare("UPDATE analysis_runs SET status = ?, thumbnail_url = ? WHERE id = ?").run("completed", topThumbnail, runId);

      res.json({
        runId,
        status: "completed",
        insights: aiData,
        topPosts: topPosts.map(p => ({
          url: p.url,
          thumbnail: p.displayUrl,
          impactScore: p.impactScore,
          likes: p.likesCount,
          comments: p.commentsCount,
          shares: p.sharesCount || 0,
          plays: p.videoPlayCount || 0
        }))
      });

    } catch (error: any) {
      console.error("Analysis failed:", error);
      db.prepare("UPDATE analysis_runs SET status = ? WHERE id = ?").run("failed", runId);

      let errorMessage = error.message;
      if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
        errorMessage = "La API Key de la IA no es válida. Por favor, verifica que sea correcta y tenga permisos.";
      } else if (error.message.includes("Unauthorized") || error.message.includes("401")) {
        errorMessage = "Error de autenticación con el proveedor de IA o Apify. Revisa tus tokens.";
      }

      res.status(500).json({ error: errorMessage });
    }
  });

  app.get("/api/history", authenticateToken, (req: any, res) => {
    const runs = db.prepare("SELECT * FROM analysis_runs WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(runs);
  });

  app.get("/api/runs/:id", authenticateToken, (req: any, res) => {
    const run = db.prepare("SELECT * FROM analysis_runs WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id) as any;
    if (!run) return res.status(404).json({ error: "Run not found" });

    const insights = db.prepare("SELECT * FROM ai_insights WHERE analysis_run_id = ?").get(req.params.id);
    const posts = db.prepare("SELECT * FROM scraped_posts WHERE analysis_run_id = ? ORDER BY impact_score DESC LIMIT 5").all(req.params.id);

    res.json({ run, insights, topPosts: posts });
  });

  // Settings Endpoints
  app.get("/api/settings", authenticateToken, (req: any, res) => {
    const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(req.user.id) as any;
    if (settings) {
      settings.has_facebook_token = !!settings.facebook_access_token;
      delete settings.facebook_access_token;
      settings.has_ai_api_key = !!settings.ai_api_key;
      delete settings.ai_api_key;
      settings.has_apify_token = !!settings.apify_token;
      delete settings.apify_token;
    }
    res.json(settings || {});
  });

  app.post("/api/settings", authenticateToken, (req: any, res) => {
    const {
      instagram_url, ai_provider, ai_api_key, apify_token,
      brand_values, brand_personality, brand_vision,
      product_service, big_promise, problems_solved, unique_mechanism,
      core_identity, core_problem, initial_niche,
      brand_archetype, brand_narrative, content_distribution,
      jiro_prompt, jiro_knowledge
    } = req.body;

    const existing = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(req.user.id) as any;

    const finalAiKey = (ai_api_key === '••••••••••••••••' || ai_api_key === '') && existing ? existing.ai_api_key : ai_api_key;
    const finalApifyToken = (apify_token === '••••••••••••••••' || apify_token === '') && existing ? existing.apify_token : apify_token;

    if (existing) {
      db.prepare(`
        UPDATE user_settings 
        SET instagram_url = ?, ai_provider = ?, ai_api_key = ?, apify_token = ?, 
            brand_values = ?, brand_personality = ?, brand_vision = ?,
            product_service = ?, big_promise = ?, problems_solved = ?, unique_mechanism = ?,
            core_identity = ?, core_problem = ?, initial_niche = ?,
            brand_archetype = ?, brand_narrative = ?, content_distribution = ?,
            jiro_prompt = ?, jiro_knowledge = ?,
            updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = ?
      `).run(
        instagram_url, ai_provider, finalAiKey, finalApifyToken,
        brand_values, brand_personality, brand_vision,
        product_service, big_promise, problems_solved, unique_mechanism,
        core_identity, core_problem, initial_niche,
        brand_archetype, brand_narrative, content_distribution,
        jiro_prompt, jiro_knowledge,
        req.user.id
      );
    } else {
      db.prepare(`
        INSERT INTO user_settings (
          user_id, instagram_url, ai_provider, ai_api_key, apify_token,
          brand_values, brand_personality, brand_vision,
          product_service, big_promise, problems_solved, unique_mechanism,
          core_identity, core_problem, initial_niche,
          brand_archetype, brand_narrative, content_distribution,
          jiro_prompt, jiro_knowledge
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        req.user.id, instagram_url, ai_provider, finalAiKey, finalApifyToken,
        brand_values, brand_personality, brand_vision,
        product_service, big_promise, problems_solved, unique_mechanism,
        core_identity, core_problem, initial_niche,
        brand_archetype, brand_narrative, content_distribution,
        jiro_prompt, jiro_knowledge
      );
    }

    res.json({ success: true });
  });

  // Hub Builder Endpoints
  app.get("/api/hub", authenticateToken, (req: any, res) => {
    try {
      let hub = db.prepare("SELECT * FROM hub_pages WHERE user_id = ?").get(req.user.id);
      if (!hub) {
        const defaultId = Math.random().toString(36).substring(7);
        const defaultSlug = "doc-" + Math.random().toString(36).substring(7);
        db.prepare(`
          INSERT INTO hub_pages (id, user_id, slug, title, bio_text, avatar_url, specialty, intro_video_url, products_json, certifications_json)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(defaultId, req.user.id, defaultSlug, "Dra. Pediatra", "Escribe tu biografía médica...", "", "Pediatra Certificada", "", "[]", "[]");
        hub = db.prepare("SELECT * FROM hub_pages WHERE user_id = ?").get(req.user.id);
      }
      res.json(hub);
    } catch (e: any) {
      console.error("[ERROR IN /api/hub GET]:", e.message);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/hub", authenticateToken, (req: any, res) => {
    const { title, bio_text, avatar_url, specialty, intro_video_url, products_json, certifications_json, whatsapp_number, slug } = req.body;
    db.prepare(`
      UPDATE hub_pages 
      SET title = ?, bio_text = ?, avatar_url = ?, specialty = ?, intro_video_url = ?, 
          products_json = ?, certifications_json = ?, whatsapp_number = ?, slug = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `).run(
      title || "", bio_text || "", avatar_url || "", specialty || "", intro_video_url || "",
      products_json || "[]", certifications_json || "[]", whatsapp_number || "", slug,
      req.user.id
    );
    res.json({ success: true });
  });

  // Public Hub Route (No Authentication)
  app.get("/api/public/hub/:slug", (req, res) => {
    const hub = db.prepare("SELECT * FROM hub_pages WHERE slug = ?").get(req.params.slug);
    if (!hub) return res.status(404).json({ error: "Página no encontrada" });
    res.json(hub);
  });

  app.get("/api/leads", authenticateToken, (req: any, res) => {
    try {
      const leads = db.prepare("SELECT * FROM leads WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/metrics", authenticateToken, (req: any, res) => {
    try {
      const metricsLogs = db.prepare("SELECT * FROM metrics_logs WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
      res.json(metricsLogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Summary Endpoint
  app.get("/api/summary", authenticateToken, (req: any, res) => {
    const userId = req.user.id;

    const totalRuns = db.prepare("SELECT COUNT(*) as count FROM analysis_runs WHERE user_id = ?").get(userId) as any;
    const completedRuns = db.prepare("SELECT COUNT(*) as count FROM analysis_runs WHERE user_id = ? AND status = 'completed'").get(userId) as any;

    const latestRun = db.prepare("SELECT id FROM analysis_runs WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1").get(userId) as any;

    let stats = {
      totalRuns: totalRuns.count,
      completedRuns: completedRuns.count,
      avgImpact: 0,
      totalPosts: 0,
      latestInsights: null
    };

    if (latestRun) {
      const postsCount = db.prepare("SELECT COUNT(*) as count FROM scraped_posts WHERE analysis_run_id = ?").get(latestRun.id) as any;
      const avgImpact = db.prepare("SELECT AVG(impact_score) as avg FROM scraped_posts WHERE analysis_run_id = ?").get(latestRun.id) as any;
      const insights = db.prepare("SELECT * FROM ai_insights WHERE analysis_run_id = ?").get(latestRun.id);

      stats.totalPosts = postsCount.count;
      stats.avgImpact = Math.round(avgImpact.avg || 0);
      stats.latestInsights = insights;
    }

    res.json(stats);
  });

  // Chat Endpoints
  app.get("/api/chat/messages", authenticateToken, (req: any, res) => {
    const messages = db.prepare("SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC").all(req.user.id);
    res.json(messages);
  });

  app.post("/api/chat/send", authenticateToken, async (req: any, res) => {
    const { message } = req.body;
    const userId = req.user.id;

    if (!message) return res.status(400).json({ error: "Mensaje requerido" });

    try {
      // 1. Get Context (Settings, History, Top Posts)
      const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
      const hubPage = db.prepare("SELECT title FROM hub_pages WHERE user_id = ?").get(userId) as any;
      const docName = hubPage?.title || "Pediatric OS";
      const latestRun = db.prepare("SELECT id FROM analysis_runs WHERE user_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1").get(userId) as any;

      let context = "Eres un Agente Experto en Estrategia de Contenido para Instagram y Marca Personal.\n";

      if (settings) {
        context += `
          === SISTEMA OPERATIVO DE MARCA PERSONAL (${docName}) ===
          
          1. IDENTIDAD NUCLEAR (Misión, Visión, Tipo de mente):
          ${settings.core_identity || "No especificado"}
          
          2. EL PROBLEMA DEL MUNDO QUE RESUELVE:
          ${settings.core_problem || settings.problems_solved || "No especificado"}
          
          3. EL NICHO INICIAL (Campo de batalla):
          ${settings.initial_niche || "No especificado"}
          
          4. SISTEMA DE VALORES (Protocolos Operativos):
          ${settings.brand_values || "No especificado"}
          
          5. ARQUETIPO DE MARCA (Personalidad y Tono):
          ${settings.brand_archetype || settings.brand_personality || "No especificado"}
          
          6. MECANISMO ÚNICO (Sistemas, no sólo servicios):
          ${settings.unique_mechanism || "No especificado"}
          
          7. LA GRAN PROMESA:
          ${settings.big_promise || "No especificado"}
          
          8. LA NARRATIVA DE MARCA (Historia continua y de futuro):
          ${settings.brand_narrative || "No especificado"}
          
          9. DISTRIBUCIÓN DE CONTENIDO (Foco y Mezcla de Atracción, Autoridad, Conversión):
          ${settings.content_distribution || "No especificado"}
          
          PRODUCTO / SERVICIO ACTUAL:
          ${settings.product_service || "No especificado"}
        `;
      }

      if (latestRun) {
        const topPosts = db.prepare("SELECT * FROM scraped_posts WHERE analysis_run_id = ? ORDER BY impact_score DESC LIMIT 5").all(latestRun.id) as any[];
        const insights = db.prepare("SELECT * FROM ai_insights WHERE analysis_run_id = ?").get(latestRun.id) as any;

        context += `
          DATOS DEL ÚLTIMO ANÁLISIS:
          - Resumen: ${insights?.summary || "No disponible"}
          - Top 5 Posts (Impacto): ${topPosts.map(p => p.caption.substring(0, 50) + "...").join(" | ")}
          - Recomendaciones: ${insights?.recommendations_json || "No disponible"}
        `;
      }

      // 2. Get Chat History (last 10 messages)
      const history = db.prepare("SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 10").all(userId) as any[];
      const formattedHistory = history.reverse().map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join("\n");

      // 3. Prepare AI Prompt
      const prompt = `
        ${context}
        
        HISTORIAL DE CHAT RECIENTE:
        ${formattedHistory}
        
        NUEVA PREGUNTA DEL USUARIO:
        ${message}
        
        Responde de forma estratégica, accionable y enfocada en mejorar el impacto en Instagram. Usa un tono profesional pero cercano.
      `;

      // 4. Call AI (Defaulting to Gemini for chat if not specified, or use user's preferred)
      const aiProvider = settings?.ai_provider || "gemini";
      const aiApiKey = settings?.ai_api_key || process.env.GEMINI_API_KEY;

      if (!aiApiKey) throw new Error("No hay API Key configurada para el chat.");

      let aiResponseText = "";
      if (aiProvider === "gemini") {
        const ai = new GoogleGenAI({ apiKey: aiApiKey });
        const result = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: prompt
        });
        aiResponseText = result.text || "";
      } else if (aiProvider === "openai") {
        const openai = new OpenAI({ apiKey: aiApiKey });
        const completion = await openai.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "gpt-4o-mini"
        });
        aiResponseText = completion.choices[0].message.content || "";
      } else if (aiProvider === "anthropic" || aiProvider === "claude") {
        const anthropic = new Anthropic({ apiKey: aiApiKey });
        const msg = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        });
        // @ts-ignore
        aiResponseText = msg.content[0].text;
      }

      // 5. Store Messages
      const userMsgId = Math.random().toString(36).substring(7);
      const assistantMsgId = Math.random().toString(36).substring(7);

      db.prepare("INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)").run(userMsgId, userId, 'user', message);
      db.prepare("INSERT INTO chat_messages (id, user_id, role, content) VALUES (?, ?, ?, ?)").run(assistantMsgId, userId, 'assistant', aiResponseText);

      res.json({ role: 'assistant', content: aiResponseText });
    } catch (error: any) {
      console.error("Chat failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/chat/messages", authenticateToken, (req: any, res) => {
    db.prepare("DELETE FROM chat_messages WHERE user_id = ?").run(req.user.id);
    res.json({ success: true });
  });

  // Public Patient Chat Endpoint
  app.post("/api/public/chat", async (req, res) => {
    const { slug, message, chatHistory } = req.body;
    if (!slug || !message) return res.status(400).json({ error: "Faltan parámetros" });

    try {
      const hub = db.prepare("SELECT user_id, title FROM hub_pages WHERE slug = ?").get(slug) as any;
      if (!hub) return res.status(404).json({ error: "No encontrado" });

      const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(hub.user_id) as any;

      const aiProvider = settings?.ai_provider || "gemini";
      const aiApiKey = settings?.ai_api_key || process.env.GEMINI_API_KEY;
      if (!aiApiKey) return res.status(500).json({ error: "El doctor no tiene IA configurada." });

      const systemPrompt = `
        ERES JIRO AI:
        ${settings?.jiro_prompt ? settings.jiro_prompt : `Eres el Asistente Virtual ("Jiro") de la Clínica/Consultorio de: ${hub.title}.
        Tu rol es atender a pacientes, madres y padres que visitan la página pública del doctor.`}
        
        CONTEXTO DEL DOCTOR Y LA CLÍNICA:
        - Valores: ${settings?.brand_values || 'Profesional y amable'}
        - Personalidad: ${settings?.brand_personality || 'Empático y seguro'}
        - Servicios: ${settings?.product_service || 'Atención pediátrica'}
        - Promesa: ${settings?.big_promise || 'Cuidado de tu familia'}
        - Conocimiento de la Clínica (FAQs, Horarios, Precios, etc):
          ${settings?.jiro_knowledge || 'No hay información extra proporcionada. Si no sabes algo, pide que contacte directo al doctor.'}
        
        REGLAS:
        - Responde corto, conciso, y siempre cálido (usa emojis limitados).
        - Si detectas emergencias médicas o problemas críticos, recomienda buscar ayuda médica inmediatamente.
        - No das diagnósticos médicos definitivos.
        - Dirige a la agenda o recursos si es adecuado.
        
        HISTORIAL DE CHAT:
        ${chatHistory || 'Sin historial aún.'}
        
        PACIENTE: ${message}
      `;

      let aiResponseText = "";
      if (aiProvider === "gemini") {
        const ai = new GoogleGenAI({ apiKey: aiApiKey });
        const result = await ai.models.generateContent({ model: "gemini-1.5-flash", contents: systemPrompt });
        aiResponseText = result.text || "";
      } else if (aiProvider === "openai") {
        const openai = new OpenAI({ apiKey: aiApiKey });
        const completion = await openai.chat.completions.create({ messages: [{ role: "user", content: systemPrompt }], model: "gpt-4o-mini" });
        aiResponseText = completion.choices[0].message.content || "";
      } else if (aiProvider === "anthropic" || aiProvider === "claude") {
        const anthropic = new Anthropic({ apiKey: aiApiKey });
        const msg = await anthropic.messages.create({ model: "claude-3-5-sonnet-20240620", max_tokens: 500, messages: [{ role: "user", content: systemPrompt }] });
        // @ts-ignore
        aiResponseText = msg.content[0].text;
      }

      res.json({ reply: aiResponseText });
    } catch (error: any) {
      console.error("Public Chat failed:", error);
      res.status(500).json({ error: "Error de conexión con la IA." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
