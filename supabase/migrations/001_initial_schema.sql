-- ==========================================
-- GROWTRIA SUPABASE MIGRATION SCHEMA v1.0
-- Migrating from SQLite to Cloud Native
-- ==========================================

-- Aseguramos tener UUIDs automáticos
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. DOCTORS (Antigua 'users')
-- ==========================================
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  
  -- Campos de Finanzas y Pagos (Stripe Connect)
  precio_presencial NUMERIC DEFAULT 0,
  precio_online NUMERIC DEFAULT 0,
  apartado_monto NUMERIC DEFAULT 1000,
  stripe_connect_account_id TEXT,
  stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. PATIENTS (Pacientes que agendan)
-- ==========================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  stripe_customer_id TEXT,
  payment_method_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. SLOTS (Agenda de turnos del doctor)
-- ==========================================
CREATE TABLE public.slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  inicio TIMESTAMPTZ NOT NULL,
  fin TIMESTAMPTZ NOT NULL,
  estado TEXT DEFAULT 'disponible', -- 'disponible', 'bloqueado_temporal', 'reservado'
  bloqueado_hasta TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. APPOINTMENTS (Citas confirmadas y pagadas)
-- ==========================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES public.slots(id) ON DELETE CASCADE,
  modalidad TEXT NOT NULL, -- 'presencial' o 'online'
  monto_total NUMERIC NOT NULL,
  monto_pagado NUMERIC NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  application_fee_amount NUMERIC,
  estado TEXT DEFAULT 'confirmada', -- 'confirmada', 'cancelada'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. CONFIGURACIÓN Y MÓDULOS NÚCLEO
-- ==========================================
CREATE TABLE public.user_settings (
  doctor_id UUID PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hub_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID UNIQUE REFERENCES public.doctors(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio_text TEXT,
  avatar_url TEXT,
  primary_cta_text TEXT,
  primary_cta_url TEXT,
  theme_color TEXT DEFAULT 'indigo',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  hub_page_id UUID REFERENCES public.hub_pages(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT,
  email TEXT,
  source TEXT,
  resource_requested TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.metrics_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  hub_page_id UUID REFERENCES public.hub_pages(id) ON DELETE CASCADE,
  event_type TEXT,
  resource_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  instagram_url TEXT,
  provider TEXT,
  status TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scraped_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  post_url TEXT,
  caption TEXT,
  content_type TEXT,
  published_at TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  plays_count INT DEFAULT 0,
  thumbnail_url TEXT,
  raw_json JSONB,
  impact_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID REFERENCES public.analysis_runs(id) ON DELETE CASCADE,
  summary TEXT,
  top_posts_json JSONB,
  patterns_json JSONB,
  recommendations_json JSONB,
  avatar_analysis_json JSONB,
  predictions_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Nota: Express usará la Service Role Key para crear registros clave 
-- (cobros/Stripe). Estas policies aplican peticiones que usan tokens de Clerk.

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hub_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraped_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Helper para obtener el UUID del doctor local mapeado al Clerk JWT (sub)
CREATE OR REPLACE FUNCTION requesting_doctor_id() RETURNS UUID AS $$
DECLARe 
  doc_id UUID;
BEGIN
  -- clerk_user_id viaja en el JWT bajo la propiedad 'sub'
  SELECT id INTO doc_id FROM public.doctors WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub';
  RETURN doc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas base:
CREATE POLICY "Doctor can view own profile" ON public.doctors FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
CREATE POLICY "Doctor can view own patients" ON public.patients FOR SELECT USING (doctor_id = requesting_doctor_id());
CREATE POLICY "Everyone can read slots" ON public.slots FOR SELECT USING (true);
CREATE POLICY "Doctor can manage slots" ON public.slots FOR ALL USING (doctor_id = requesting_doctor_id());
CREATE POLICY "Doctor can view own appointments" ON public.appointments FOR SELECT USING (doctor_id = requesting_doctor_id());
CREATE POLICY "Doctor manages own hub" ON public.hub_pages FOR ALL USING (doctor_id = requesting_doctor_id());
CREATE POLICY "Everyone can view active hubs" ON public.hub_pages FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Doctor manages own settings" ON public.user_settings FOR ALL USING (doctor_id = requesting_doctor_id());
CREATE POLICY "Doctor manages own leads" ON public.leads FOR ALL USING (doctor_id = requesting_doctor_id());
CREATE POLICY "Doctor manages own runs" ON public.analysis_runs FOR ALL USING (doctor_id = requesting_doctor_id());
