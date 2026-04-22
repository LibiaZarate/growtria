# Auditoría del Repo: Growtria (Migración a Cloud-First)

Este documento es el reporte de auditoría generado a partir de las instrucciones maestras en `CLAUDE.md`, paso previo a la implementación de la migración de Cloud y la extensión del embudo de conversión.

## 1. Estructura Actual de Carpetas

La aplicación está consolidada en un solo repositorio donde el backend y el frontend coexisten.

```text
/ClinicsArquitectMedia/
├── src/                        # Código Frontend (React)
│   ├── App.tsx                 # Contiene gran parte del enrutamiento y estado global
│   ├── types.ts                # Definiciones de tipo globales (modelos)
│   └── components/
│       ├── AnimalitoChat.tsx   # Chatbot de cara al público (Jiro AI)
│       ├── CustomLogo.tsx      # Elementos estéticos de marca
│       ├── PublicProfile.tsx   # Hub Page público para el doctor
│       └── hub/                 
│           ├── HubEditor.tsx   # Panel de edición de los Hubs
│           └── PublicHub.tsx   # [AMBIGUO] Parece haber dos versiones del Hub (PublicProfile vs PublicHub).
├── public/                     # Assets estáticos y carpeta de /uploads de Multer
├── server.ts                   # Backend unificado: Inicializa Base de datos, API Express y middlewares Vite
├── database.sqlite             # Archivo local de base de datos actual (A migrar)
├── package.json
└── vite.config.ts
```

## 2. Rutas de Express Existentes

Todas centralizadas en `server.ts`. 

**Autenticación** (Serán interceptadas o delegadas a Clerk):
- `POST /api/auth/signup` -> Cae. Se mueve a Clerk.
- `POST /api/auth/login` -> Cae. Se mueve a Clerk.
- `GET /api/auth/facebook` -> **Activa**. Se preserva (integración con app de Meta).
- `GET /api/auth/facebook/callback` -> **Activa**. Se preserva.

**Endpoints de Frontend y Lógica**:
- `POST /api/public/lead` -> **Activa**. A migrar apuntando de SQLite a Supabase con `service_role_key`.
- `POST /api/public/metrics/click` -> **Activa**. Para telemetría básica.
- `POST /api/upload` -> **Activa**. *Nota: Al usar Multer para `public/uploads`, es preferible reemplazar esto por una subida a Supabase Storage.*
- `POST /api/analyze` -> **Activa**. Corazón de impacto y IA (Gemini/Anthropic). Se preserva.
- `GET /api/history` y `GET /api/runs/:id` -> **Activas**, se preservan.
- `GET/POST /api/settings` -> **Activas**. Lee/Guarda el Personal Brand OS y configuraciones.
- (Endpoints relacionados con Hub operations) -> **Activas**.

## 3. Esquema de Tablas SQLite (Mapeo a Postgres)

Actualmente en `better-sqlite3`. Requerirán transformación a Supabase/PostgreSQL habilitando RLS:

| Tabla Actual SQLite | Mapeo a Supabase (Postgres) |
| --- | --- |
| `users` | Se reemplaza lógicamente por Clerk Auth o se usa `doctors` con `clerk_user_id` único en Postgres. |
| `analysis_runs` | `id` UUID, `doctor_id` (FK a doctors), `instagram_url`, `status`, etc. |
| `scraped_posts` | Mismos campos, pero asociadas al `doctor_id` a través de RLS (basado en `analysis_run_id`). |
| `ai_insights` | Textos/JSONs preservados en atributos `JSONB`. |
| `user_settings` | Preferible hacer *merge* con la nueva tabla `doctors`, o ser su propia extensión filtrada por `doctor_id`. |
| `hub_pages` | `slug` UIK, `doctor_id`, etc. Requiere RLS mixto (lectura anónima desde vista pública). |
| `leads` | `doctor_id` (FK), `hub_page_id` (FK), datos de contacto. |
| `chat_messages` | Preservar. |
| `metrics_logs` | Preservar. |

## 4. Componentes React

1. **En uso:** `App.tsx` (Dashboard del Doctor y Editor Principal), `AnimalitoChat.tsx`, `HubEditor.tsx`.
2. **Duplicados/Ambigüedades [AMBIGUO]:** Existe `src/components/PublicProfile.tsx` y `src/components/hub/PublicHub.tsx`. Necesitamos definir cuál aloja el Flow para el Embudo del paciente antes de insertar Stripe Elements ahí.

## 5. Variables de Entorno

**Actual (`.env`):**
- `VITE_FB_APP_ID`, `VITE_FB_APP_SECRET`, `VITE_FB_REDIRECT_URI` (Se preservan).

**Variables a agregar para el nuevo stack:**
- `VITE_CLERK_PUBLISHABLE_KEY` y `CLERK_SECRET_KEY`
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Solo backend)
- `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## 6. Revisión de Dependencias (`package.json`)

**A Remover / Candidatos a salir:**
- `better-sqlite3` -> Eliminada para adoptar Supabase.
- `bcryptjs` y `@types/bcryptjs` -> Eliminadas (El hashing lo maneja Clerk).
- `jsonwebtoken` y `@types/jsonwebtoken` -> Eliminadas / Reemplazadas por `@clerk/express` para validar.

**Se mantienen:**
- `express` (Capa de lógica pesada de scraping)
- `apify-client`, `@google/genai`, `openai`, `@anthropic-ai/sdk` (Motores de contenido)
- `multer` (Considerar si migramos por completo a Supabase Storage)
- Framework `vite` / React / Tailwind

**Nuevas requeridas:**
- `@clerk/clerk-react`, `@clerk/express`
- `@supabase/supabase-js`
- `@stripe/stripe-js`, `@stripe/react-stripe-js` (Cliente de cobros)
- `stripe` (Node SDK para generar los payment y setup intents)

---
Libia, con esto termino mi fase de validación estática y guardado de "CLAUDE.md".

**Siguiente paso recomendado:** Confirmar cómo manejamos el [AMBIGUO] en los componentes del Hub (`PublicProfile.tsx` vs `PublicHub.tsx`), y si estás de acuerdo con el plan, comenzamos con la inicialización del proyecto Supabase y las migraciones de Base de Datos Postgres como primer bloque arquitectónico.
