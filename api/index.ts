import express, { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { ApifyClient } from "apify-client";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// Cloud Services
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" as any });

const app = express();
app.use(express.json());

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid session" });
  (req as any).auth = { userId: user.id };
  next();
};

// Helper to get local doctor_id from Supabase userId
async function getDoctorId(authId: string) {
  let { data, error } = await supabase.from('doctors').select('id').eq('clerk_user_id', authId).single();
  if (error || !data) {
    const { data: newDoc, error: insertError } = await supabase.from('doctors').insert({ clerk_user_id: authId, name: 'Doctor' }).select().single();
    if (newDoc) return newDoc.id;
    throw new Error("No pudimos crear tu perfil de doctor en la base de datos. Error: " + JSON.stringify(insertError));
  }
  return data.id;
}


// 2. STRIPE CONNECT ONBOARDING
app.post("/api/stripe/connect/onboard", requireAuth, async (req: any, res) => {
  try {
    const clerkId = req.auth.userId;
    const docId = await getDoctorId(clerkId);
    
    let { data: doc } = await supabase.from('doctors').select('*').eq('id', docId).single();
    if (!doc) return res.status(404).json({ error: "Doctor not found" });

    let accountId = doc.stripe_connect_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'MX',
        email: doc.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await supabase.from('doctors').update({ stripe_connect_account_id: accountId }).eq('id', docId);
    }

    const origin = req.headers.origin || "http://localhost:5173";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/settings?stripe=refresh`,
      return_url: `${origin}/settings?stripe=return`,
      type: 'account_onboarding',
    });

    res.json({ url: accountLink.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. SETTINGS & HUB ENDPOINTS
app.get("/api/settings", requireAuth, async (req: any, res) => {
  try {
    const docId = await getDoctorId(req.auth.userId);
    const { data } = await supabase.from('user_settings').select('*').eq('doctor_id', docId).single();
    res.json(data || {});
  } catch(e) { res.status(500).json({ error: "Error" }); }
});
// 4. HUB ENDPOINTS
app.get("/api/hub", requireAuth, async (req: any, res) => {
  try {
    const docId = await getDoctorId(req.auth.userId);
    let { data: hub } = await supabase.from('hub_pages').select('*').eq('user_id', docId).single();
    if (!hub) {
      const defaultSlug = "doc-" + Math.random().toString(36).substring(7);
      const newHub = { 
        user_id: docId, slug: defaultSlug, title: "Dra. Pediatra", bio_text: "Biografía médica", 
        avatar_url: "", specialty: "Pediatra", intro_video_url: "", products_json: "[]", certifications_json: "[]"
      };
      await supabase.from('hub_pages').insert(newHub).select().single();
      const refetch = await supabase.from('hub_pages').select('*').eq('user_id', docId).single();
      hub = refetch.data;
    }
    res.json(hub);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.post("/api/hub", requireAuth, async (req: any, res) => {
  try {
    const docId = await getDoctorId(req.auth.userId);
    const { title, bio_text, avatar_url, specialty, intro_video_url, products_json, certifications_json, whatsapp_number, slug } = req.body;
    await supabase.from('hub_pages').update({ 
      title, bio_text, avatar_url, specialty, intro_video_url, products_json, certifications_json, whatsapp_number, slug 
    }).eq('user_id', docId);
    res.json({ success: true });
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

app.get("/api/public/hub/:slug", async (req, res) => {
  try {
    const { data: hub } = await supabase.from('hub_pages').select('*').eq('slug', req.params.slug).single();
    if (!hub) return res.status(404).json({ error: "Hub no encontrado" });
    res.json(hub);
  } catch(e: any) { res.status(500).json({ error: e.message }); }
});

export default app;

