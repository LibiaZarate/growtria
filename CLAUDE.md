# CLAUDE.md — Growtria

> Prompt maestro del proyecto. Claude Code lo lee automáticamente al iniciar cada sesión. Colocar en la raíz del repo.

---

## 1. Qué es Growtria

Growtria es un **Personal Brand OS para doctores** (enfoque principal: pediatras). Automatiza el análisis de contenido en Instagram, gestiona la estrategia de marca personal del médico y le entrega un **Hub Page público** con un asistente creativo — **Jiro IA**, que en el Hub aparece disfrazado de animalito (ardilla, etc.) vía `AnimalitoChat` — para generar confianza, precalificar pacientes y capturar leads.

La aplicación ya existe con módulos funcionales pero el stack va a migrar en esta fase. **Esta sesión de Claude Code es para evolucionar Growtria al stack nuevo y extenderla con el embudo de conversión de citas.**

## 2. Estado actual y migración de stack

Growtria fue construida en un stack local-first (SQLite + Express + JWT casero). Esta fase migra a un stack cloud-first:

| Componente | De | A |
|---|---|---|
| Base de datos | SQLite (`better-sqlite3`) | **Supabase (Postgres + RLS)** |
| Auth doctores | JWT casero | **Clerk** |
| Pagos | No existían | **Stripe Connect** (cada doctor cobra directo) |
| Repo | Local / parcial | **GitHub** (con CI/CD por GitHub Actions) |
| Frontend | Vite + React | **Vite + React** (se preserva) |
| Backend | Express (Node.js) | **Express** (se preserva, pero consume Supabase en vez de SQLite) |
| LLMs (Jiro) | Gemini / OpenAI / Claude intercambiables | **Se preserva tal cual** |

La migración no es "empezar de cero". Es tomar los módulos que ya existen (Personal Brand OS, Content Analyzer, Jiro AI, Hub Pages, CRM básico) y reconectarlos al nuevo stack, preservando su lógica y estética.

### 2.1 Estado del repo actual

El código está **parcialmente consolidado**: hay componentes sueltos, archivos sin conectar, posibles duplicados. Antes de escribir una sola línea de código nuevo, Claude Code debe:

1. **Auditar el árbol de archivos completo** y producir un reporte en `/docs/audit.md` con:
   - Estructura actual de carpetas (frontend y backend).
   - Rutas de Express existentes y su estado (activas, rotas, duplicadas).
   - Tablas SQLite existentes y su esquema (para mapearlas a Postgres).
   - Componentes React existentes y cuáles están en uso vs. huérfanos.
   - Variables de entorno actuales y cuáles cambiarán con el nuevo stack.
   - Dependencias en `package.json` que se usan, que no, y cuáles deben sumarse o quitarse con la migración.

2. **No eliminar nada todavía**. Solo reportar. La limpieza se decide con Libia después de ver el audit.

3. Confirmar el plan de migración con Libia **antes** de crear archivos nuevos o migrar tablas.

Si Claude Code encuentra ambigüedades durante la auditoría, las marca como `[AMBIGUO]` en el audit y pregunta.

## 3. Módulos existentes (a preservar y mejorar)

### 3.1 Personal Brand OS
Sistema de capas que alimenta a Jiro:
- **Identidad Nuclear** — visión, misión, arquetipo.
- **Deseos y Dolores** — nicho, gran promesa, problemas solucionables.
- **Narrativa Continua** — ángulo y distribución.

Estas capas son **input obligatorio** para todos los prompts que se envían a los LLMs. No inventar contenido si no hay capas definidas; en ese caso, pedirle al doctor que las complete.

### 3.2 Content Analyzer
Extrae Reels y Posts del perfil conectado y los ordena con la **fórmula impactScore**:

```
impactScore = (comentarios × 10) + (compartidos × 15) + (likes × 1) + (vistas × 0.01)
```

Esta fórmula es **propiedad del producto**. No modificarla sin decisión explícita de Libia. Saca el Top 5 histórico.

### 3.3 Jiro AI (mentor de estrategia)
Panel privado donde el doctor discute su contenido con Jiro. Jiro:
- Lee el Top 5 del Content Analyzer.
- Define el **avatar psicográfico** (temores y frustraciones reales de los padres).
- Devuelve **3 recomendaciones hiper-específicas** para la próxima semana de contenido.

Corre sobre **LLM intercambiable** desde `user_settings`. Los tres motores soportados actualmente son Gemini, OpenAI y Claude. **Mantener esa flexibilidad — no atar a un solo proveedor.**

### 3.4 Hub Pages (perfil público)
Generador de páginas públicas (`growtria.app/[slug]` o equivalente). Contiene:
- Avatar, color primario (estética rosa/suave por default), intro video.
- Listado de servicios.
- Formulario de captura de leads.
- Botones de WhatsApp.
- `AnimalitoChat`: Jiro disfrazado de animal, alimentado con `jiro_knowledge` que el doctor precarga.

**El Hub Page es el punto de entrada del embudo de conversión** (ver sección 4). Es público — no requiere auth del paciente.

### 3.5 Tracking, métricas y CRM básico
- `metrics_logs`: cada click, descarga o evento del Hub.
- `leads`: prospectos con estado (`contactado`, `appointment_booked`, etc.).

Estos registros migran a Supabase pero **sin cambios de esquema lógico**.

## 4. Extensión nueva — Embudo de Conversión de Citas

Esta es **la funcionalidad principal a agregar**. Viene de una conversación con Dr. Salvador Villalpando (pediatra, asesor del proyecto). El Hub Page ya es el paso 1 del embudo; hay que agregar los pasos 2, 3 y 4.

### 4.1 Tesis del embudo
El paciente siempre pregunta lo mismo: **dónde estás, cuánto cuestas, cómo reservo**. Si el Hub Page contesta lo primero y, **antes de dar el precio**, captura nombre + WhatsApp + tarjeta, la conversión de "like" a "cita pagada" sube porque el paciente ya hizo un compromiso previo.

### 4.2 Flujo completo

**Paso 1 — Hub Page (existe)**
El paciente llega desde Instagram/TikTok. `AnimalitoChat` responde FAQs. Ubicación visible. **Precio nunca visible aquí.** CTA "Agendar consulta".

**Paso 2 — Registro con tarjeta (nuevo)**
Pide nombre, WhatsApp, email, tarjeta. Usar **Stripe `setup_intent`** sobre la cuenta conectada del doctor (Stripe Connect). **No cobrar nada.** Mensaje explícito: "Sitio seguro. Aún no se realiza ningún cargo." Guardar `stripe_customer_id` y `payment_method_id` en la tabla `patients`.

**Paso 3 — Revelación de precio y elección (nuevo)**
Ya registrado, el paciente ve:
- Modalidades: presencial / en línea (precios distintos, definidos por el doctor).
- Opciones de pago:
  - Pagar completa ahora → Stripe `payment_intent` por monto total.
  - Apartar cita → Stripe `payment_intent` por monto de apartado (default `$1,000 MXN`, configurable). Acreditable al total y reembolsable si el doctor cancela.
- Calendario con **slots reales** (nuevo): no movibles salvo cancelación del doctor.
- Slot elegido queda **bloqueado 10 minutos** mientras se completa el pago; si expira, se libera.

**Paso 4 — Confirmación (nuevo)**
Cita con estado `confirmada`. Slot bloqueado permanentemente. Notificación por WhatsApp (ManyChat) y email. Generar `.ics` para el calendario del paciente.

### 4.3 Reglas duras del embudo (innegociables)
- Precio nunca aparece antes del paso 2.
- No existe checkout como invitado (aunque el paciente no se autentica, debe registrar tarjeta antes de ver precio).
- Slots son reales, no movibles por el paciente. Solo el doctor puede cancelarlos; en ese caso, el sistema reembolsa automáticamente vía Stripe.
- El `AnimalitoChat` puede dar ubicación y responder dudas, pero **no debe dar el precio**. Si el paciente pregunta precio, redirige al CTA del paso 2.

### 4.4 Nuevas tablas Postgres a agregar (Supabase)
- `patients` — `id` (uuid), `nombre`, `whatsapp`, `email`, `stripe_customer_id`, `payment_method_id`, `doctor_id` (fk), `created_at`. Sin auth Clerk; son registros anónimos del embudo.
- `slots` — `id`, `doctor_id`, `inicio`, `fin`, `estado` (enum: `disponible`/`bloqueado_temporal`/`reservado`), `bloqueado_hasta`.
- `appointments` — `id`, `doctor_id`, `patient_id`, `slot_id`, `modalidad`, `monto_total`, `monto_pagado`, `stripe_payment_intent_id`, `stripe_transfer_id`, `application_fee_amount`, `estado` (enum: `confirmada`/`cancelada`/`completada`), `created_at`.

Estas tablas coexisten con las migradas de SQLite (`leads`, `metrics_logs`, etc.). Una conversión de `lead` a `patient` debe quedar trazada.

**RLS obligatorio** en todas las tablas. Ver sección 5.2.

### 4.5 Nuevos campos en la tabla `doctors`
- `clerk_user_id` (único, indexado)
- `precio_presencial`, `precio_online`, `apartado_monto`
- `stripe_connect_account_id` (id de la cuenta conectada del doctor en Stripe)
- `stripe_connect_charges_enabled` (boolean)
- `stripe_connect_payouts_enabled` (boolean)

## 5. Stack tecnológico — detallado

### 5.1 Frontend
- **Vite + React** (preservar)
- **TailwindCSS** (preservar estética rosa/suave)
- **Framer Motion** (preservar micro-interacciones)
- **`@clerk/clerk-react`** para componentes de auth en el dashboard del doctor.
- **`@stripe/react-stripe-js`** y **`@stripe/stripe-js`** para Stripe Elements en las pantallas 2 y 3 del embudo.
- **`@supabase/supabase-js`** solo para operaciones públicas (lectura del Hub Page). Operaciones sensibles pasan por Express.

### 5.2 Backend y base de datos
- **Supabase Postgres** con RLS activo en todas las tablas.
- **Express** como capa de API intermedia (donde ya vive la lógica del Content Analyzer, Jiro y OAuth de Meta). Express consume Supabase con la `service_role_key` para operaciones privilegiadas y valida Clerk JWT en cada request protegida.
- Migraciones SQL versionadas en `/supabase/migrations/`. Usar Supabase CLI.
- **RLS policies**:
  - `doctors`: un doctor solo lee/escribe su propio registro (`auth.jwt() ->> 'sub' = clerk_user_id` vía custom claim).
  - `patients`, `slots`, `appointments`, `leads`, `metrics_logs`: filtradas siempre por `doctor_id`.
  - Hub Page público: lectura anónima solo de campos no sensibles del doctor (`nombre`, `especialidad`, `bio`, `foto_url`, `direccion`, `faqs`) vía una vista `doctors_public` con RLS permisiva.

### 5.3 Auth (Clerk)
- **Solo doctores** se autentican. Pacientes NO usan Clerk.
- Clerk maneja: signup, signin, OTP por email, recuperación de contraseña, multi-factor opcional.
- Integración Clerk ↔ Supabase: usar **Clerk JWT template** configurado para emitir un JWT firmado que Supabase acepte (custom claim `sub` = `clerk_user_id`). Esto permite que las RLS policies funcionen con `auth.jwt()`.
- En Express, validar el JWT de Clerk en cada request protegida con `@clerk/express`.

### 5.4 Stripe Connect
**Modelo**: Express Connected Accounts. Cada doctor onboardea su cuenta Stripe vía el flujo estándar de Stripe (AccountLink). Growtria actúa como plataforma, cobra comisión por cada transacción.

**Onboarding del doctor**:
1. Dashboard → botón "Conectar cuenta de pagos".
2. Express llama `stripe.accounts.create({ type: 'express', country: 'MX' })`.
3. Express llama `stripe.accountLinks.create()` y devuelve URL.
4. Doctor completa onboarding en Stripe (KYC, cuenta bancaria).
5. Webhook `account.updated` confirma `charges_enabled = true` y actualiza `doctors.stripe_connect_charges_enabled`.

**Cobro al paciente (paso 3 del embudo)**:
- `payment_intent` con `stripe_account` (cuenta del doctor) y `application_fee_amount` (comisión de Growtria, `[CONFIRMAR porcentaje con Libia]`).
- El dinero llega directo a la cuenta del doctor, menos la comisión que va a Growtria.
- **Growtria nunca custodia dinero del doctor.** Esto es crítico fiscalmente.

**Webhooks obligatorios** (endpoint `/api/stripe/webhook` en Express con verificación de firma):
- `payment_intent.succeeded` → crear/confirmar `appointment`.
- `payment_intent.payment_failed` → liberar slot bloqueado.
- `charge.refunded` → marcar `appointment` como cancelada.
- `account.updated` → sincronizar estado de la cuenta conectada del doctor.

### 5.5 GitHub
- Repo privado. Claude Code opera sobre una clonación local.
- Branches: `main` (producción), `dev` (staging), `feature/*` (trabajo).
- GitHub Actions:
  - Lint + type-check en cada PR.
  - Deploy automático a entorno de staging en merge a `dev`.
  - Deploy a producción solo desde `main` con aprobación manual.
- **`.gitignore` estricto**: nunca commitear `.env`, `.env.local`, `*.db`, `node_modules/`, archivos de Supabase local.
- Secrets de GitHub Actions: Supabase keys, Clerk keys, Stripe keys (test y live separados).

### 5.6 Integraciones que se preservan
- **Meta Graph API v19.0** (OAuth nativo para Instagram). Preservar scopes y flow actuales.
- **Apify** como respaldo cuando Graph API falla.
- **Gemini / OpenAI / Claude** intercambiables para Jiro.

### 5.7 Pendientes por confirmar
- **Email**: `[CONFIRMAR]` — Resend / SendGrid / SMTP propio. Recomendación: Resend (fácil de integrar con Supabase Edge Functions si se necesita).
- **Comisión de Stripe Connect**: `[CONFIRMAR porcentaje]` — típicamente 5–10% para plataformas SaaS médicas.
- **Dominio**: `[CONFIRMAR]` — ¿`growtria.app`, `growtria.com`, otro?

## 6. Principios de UI al extender

La estética de Growtria es **rosa, suave, amigable para mamás y familias**, con los animalitos como firma visual del producto. El embudo de pagos NO puede romper eso.

Al diseñar las pantallas nuevas (onboarding Stripe Connect del doctor, registro con tarjeta del paciente, precios, calendario de slots, confirmación):

- **Mantener** la paleta rosa corporativa y Framer Motion.
- **Evitar** templates de checkout fríos tipo Stripe Elements genérico. Usar Stripe Elements con `appearance` personalizada que empate con el resto del Hub.
- Los animalitos pueden aparecer en momentos emocionales: confirmación de cita ("la ardilla te confirma"), estado de carga del pago, etc. No abusar — debe sentirse deliberado, no infantil.
- Los componentes de Clerk (`<SignIn />`, `<UserButton />`) también deben personalizarse con la `appearance` prop para no verse genéricos.
- Mobile-first. 80% del tráfico viene de Instagram en móvil.
- Todos los textos en español de México. "Tú" por default.

Antes de escribir cualquier componente visual nuevo, Claude Code debe:
1. Revisar componentes existentes del Hub Page para heredar estilos y tokens.
2. Buscar en `/ui-references/` imágenes de referencia (si Libia las agrega).
3. Si no hay referencia clara, preguntar antes de inventar.

## 7. Restricciones críticas

Claude Code **no debe**:

1. Eliminar archivos, tablas o rutas sin aprobación explícita. Solo marcar como "candidato a eliminar" en el audit.
2. Modificar la fórmula `impactScore`.
3. Atar Jiro a un solo LLM. La selección intercambiable desde `user_settings` es parte del producto.
4. Automatizar creación de campañas de Meta Ads desde la API. Resulta en baneo de cuenta publicitaria.
5. Exponer claves del `.env` al cliente. Clerk `SECRET_KEY`, Supabase `service_role_key`, Stripe `SECRET_KEY`, API keys de LLMs, tokens de Meta: **todo** se usa solo en Express o en server-side. La única key pública permitida en el cliente es la `publishable_key` de Clerk, la `anon_key` de Supabase y la `publishable_key` de Stripe.
6. Implementar checkout de invitado ni mostrar precios antes del registro con tarjeta. Rompe el modelo del embudo.
7. Permitir que `AnimalitoChat` dé precios al paciente antes del paso 2.
8. Guardar números de tarjeta en Postgres. **Nunca.** Solo `stripe_customer_id` y `payment_method_id` (referencias tokenizadas).
9. Desactivar RLS en Supabase por conveniencia. Si una query no funciona con RLS, el problema es la policy, no RLS.
10. Procesar pagos sin Stripe Connect. El dinero **nunca** debe pasar por la cuenta principal de Growtria — siempre por la cuenta conectada del doctor con `application_fee_amount` para la comisión.
11. Generar contenido médico real (diagnósticos, recomendaciones clínicas). Todo contenido médico lo redacta el doctor.
12. Confiar en el cliente para datos críticos (precio, monto de apartado, doctor_id). Siempre validar server-side contra Supabase.
13. Mezclar identidades de doctores. Toda query a tablas con `doctor_id` debe filtrar por el doctor autenticado. Las RLS policies son la primera línea; los helpers de Express son la segunda.

## 8. Instrucciones operativas para Claude Code

### Al iniciar cada sesión
1. Leer este archivo completo.
2. Si existe `/docs/audit.md`, leerlo para no repetir la auditoría. Si no existe, hacerla antes que nada.
3. Revisar `/.claude/agents/` para ver subagentes configurados.
4. Buscar skills relevantes antes de escribir integraciones complejas (Stripe Connect, webhooks, Clerk JWT template para Supabase, migraciones Postgres). Instalar skills verificadas si existe.
5. Confirmar el plan de trabajo antes de crear más de 3 archivos nuevos.

### Subagentes sugeridos (crear en `.claude/agents/`)
- `repo-auditor.md` — mapea el estado del código, detecta duplicados y huérfanos.
- `supabase-migrations-engineer.md` — diseña el esquema Postgres, RLS policies, migraciones versionadas.
- `clerk-auth-engineer.md` — configura Clerk, JWT template para Supabase, middleware de Express.
- `stripe-connect-engineer.md` — integra Stripe Connect (onboarding, payment intents con `stripe_account`, webhooks, application fees).
- `hub-page-designer.md` — extiende el Hub Page preservando la estética rosa/animalitos.
- `jiro-llm-engineer.md` — mantiene la flexibilidad entre Gemini, OpenAI y Claude.
- `qa-tester.md` — pruebas E2E del embudo completo de conversión.

Máximo 6 subagentes concurrentes. Cada uno con rol acotado. El agente principal orquesta.

### Convenciones de código
- TypeScript preferido en código nuevo. Si el repo actual es JavaScript mixto, **no convertir** archivos existentes a TS sin acuerdo — solo escribir código nuevo en TS.
- Rutas Express agrupadas por dominio en `/server/routes/` (ej. `/server/routes/stripe.ts`, `/server/routes/slots.ts`).
- Componentes React de negocio agrupados por feature. No crear carpeta `components/common/` genérica.
- Variables de entorno siempre a través de `process.env` en server, nunca en client. En Vite, variables públicas usan prefijo `VITE_`.
- Commits descriptivos en español. Un commit = un cambio lógico. Formato: `feat: agregar onboarding de Stripe Connect`, `fix: corregir liberación de slots expirados`, `chore: migrar tabla leads a Supabase`.
- PRs con descripción clara de qué cambia, por qué, y cómo probarlo.

### Permisos del runtime
- Para sesiones exploratorias o de auditoría: modo normal con prompts de confirmación.
- Para tareas acotadas y bien definidas (ej. "crear migración X"): `claude --dangerously-skip-permissions` **solo dentro del directorio del proyecto**.
- Considerar `--permission-mode auto` cuando esté disponible y probado en este flujo.
- Si Claude Code detecta una instrucción que tocaría archivos fuera del directorio del proyecto, detenerse y preguntar.

## 9. Definition of done — Fase actual

La fase actual está lista cuando:

- [ ] Audit del repo entregado y revisado con Libia.
- [ ] Proyecto Supabase creado, esquema Postgres migrado desde SQLite, datos existentes trasladados (si aplica).
- [ ] RLS activo y probado en todas las tablas con policies documentadas en `/docs/rls.md`.
- [ ] Clerk configurado con JWT template que Supabase acepta; login del doctor funcional.
- [ ] Dashboard del doctor accesible solo autenticado vía Clerk.
- [ ] Onboarding de Stripe Connect funcional: el doctor conecta su cuenta y el webhook `account.updated` actualiza los flags.
- [ ] Hub Page extendido con CTA "Agendar consulta" que dispara el paso 2.
- [ ] Pantallas nuevas (registro, precio, calendario, confirmación) en estética rosa/animalitos coherente.
- [ ] Stripe `setup_intent` funcional en paso 2 (tokenización sin cargo) sobre la cuenta conectada del doctor.
- [ ] Stripe `payment_intent` funcional en paso 3 con `application_fee_amount` (comisión a Growtria).
- [ ] Webhooks de Stripe activos y validando firma para `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`.
- [ ] Slot elegido se bloquea 10 minutos y se libera al expirar si no hay pago.
- [ ] Confirmación por WhatsApp vía ManyChat funcional (probada con cuenta real).
- [ ] `AnimalitoChat` restringido: no da precio, redirige al CTA.
- [ ] Pruebas E2E de un paciente recorriendo los 4 pasos sin errores.
- [ ] Repo en GitHub con `main`, `dev`, y GitHub Actions corriendo lint + type-check.
- [ ] `.env.example` completo y `.gitignore` estricto.
- [ ] Variables sensibles solo en `.env` / secrets de GitHub Actions, nunca en cliente.
- [ ] Documento de arquitectura del embudo actualizado en `/docs/embudo.md`.

---

**Última actualización:** `[fecha de esta sesión]`
**Mantenedor:** Libia Zárate
**Asesor médico/producto:** Dr. Salvador Villalpando
**Versión:** v0.3 — migración a Supabase + Clerk + Stripe Connect, extensión del embudo
