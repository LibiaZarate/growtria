# Growtria — Plan de Cambios para Alineación

> Documento operativo que lista todos los cambios necesarios para evolucionar Growtria desde su estado actual (descrito en el doc técnico-funcional) hacia el objetivo: convertir likes en citas pagadas, con el nuevo stack (Supabase + Clerk + Stripe Connect + GitHub).

**Última actualización:** abril 2026
**Mantenedor:** Libia Zárate
**Asesor médico:** Dr. Salvador Villalpando

---

## Resumen ejecutivo

Growtria hoy es un **Personal Brand OS de análisis y estrategia de contenido**. Tiene cinco módulos funcionales (Brand OS, Content Analyzer, Jiro AI, Hub Pages, CRM básico). Lo que NO tiene y necesita: el **embudo de monetización** completo, el cambio de stack y la disciplina de UX que separa "asistente que responde dudas" de "asistente que cobra una consulta".

Los cambios se agrupan en seis frentes:

1. **Migración de stack** (SQLite → Supabase, JWT casero → Clerk, agregar Stripe Connect, repo a GitHub).
2. **Nuevas funcionalidades** (embudo de citas, pagos, slots de agenda, confirmaciones por WhatsApp).
3. **Cambios de UI/UX** en módulos existentes para que el embudo se sienta natural.
4. **Restricciones nuevas** sobre módulos existentes (especialmente `AnimalitoChat`).
5. **Rediseño del dashboard** del doctor para priorizar dinero real, no métricas de redes.
6. **Higiene técnica** (RLS, .env, .gitignore, CI/CD).

---

## 1. Migración de stack

### 1.1 Base de datos: SQLite → Supabase Postgres

**Estado actual:** `better-sqlite3` corriendo local. Tablas existentes (según el doc): `metrics_logs`, `leads`, `user_settings`, `jiro_knowledge`, runs históricos de análisis, sesiones JWT.

**Cambios:**
- Crear proyecto Supabase nuevo.
- Mapear cada tabla SQLite a su equivalente Postgres respetando tipos (ej. `INTEGER` → `int4`, `TEXT` → `text`, timestamps a `timestamptz`).
- Añadir IDs `uuid` con `gen_random_uuid()` en lugar de autoincrementales donde aplique.
- Migrar datos existentes con script de exportación SQLite → CSV → import a Supabase (o vía pg_dump si hay puente directo).
- Reescribir todos los `db.prepare(...)` de `better-sqlite3` a llamadas con `@supabase/supabase-js` o `pg` directo desde Express.
- Versionar todas las migraciones en `/supabase/migrations/` usando Supabase CLI.

**Riesgo:** Romper queries existentes. **Mitigación:** Hacer la migración tabla por tabla, no big bang. Mantener SQLite operativo en paralelo durante la transición y desactivar solo cuando todas las queries estén verificadas.

### 1.2 Auth: JWT casero → Clerk

**Estado actual:** Persistencia de sesión por JWT propio (mencionado en el doc).

**Cambios:**
- Crear app en Clerk, configurar México como región principal, idioma español.
- Reemplazar todas las rutas de signup/login/recovery del backend por componentes de Clerk en el frontend (`<SignIn />`, `<SignUp />`, `<UserButton />`).
- Configurar **Clerk JWT template para Supabase** — esto es la pieza que conecta Clerk con las RLS de Supabase. Incluir custom claim `sub = clerk_user_id` y `role = 'authenticated'`.
- Reemplazar el middleware de Express que validaba el JWT propio por `@clerk/express` que valida tokens de Clerk.
- Migrar usuarios existentes a Clerk (si ya hay doctores registrados): exportar de SQLite, importar a Clerk vía API.
- Agregar campo `clerk_user_id` (único, indexado) a la tabla `doctors`.

**Riesgo:** Pérdida de sesiones activas durante el switch. **Mitigación:** Comunicar a los doctores existentes que harán login una vez en el cambio.

### 1.3 Pagos: agregar Stripe Connect (no existía)

**Estado actual:** No hay infraestructura de pagos en Growtria.

**Cambios:**
- Crear cuenta de plataforma en Stripe.
- Activar Stripe Connect en modo Express (Connected Accounts).
- Implementar flujo de onboarding del doctor:
  - Botón en dashboard "Conectar cuenta de pagos".
  - Express crea `stripe.accounts.create({ type: 'express', country: 'MX' })`.
  - Express genera `accountLink` y redirige al doctor a Stripe para KYC.
  - Webhook `account.updated` actualiza `doctors.stripe_connect_charges_enabled` y `doctors.stripe_connect_payouts_enabled`.
- Implementar cobro al paciente:
  - Paso 2 del embudo: `setup_intent` con `stripe_account` = cuenta del doctor.
  - Paso 3 del embudo: `payment_intent` con `stripe_account` y `application_fee_amount` (comisión Growtria).
- Endpoint de webhooks `/api/stripe/webhook` con verificación de firma para `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`.
- Definir y configurar el porcentaje de `STRIPE_PLATFORM_FEE_PERCENT` (sugerencia: 5–10%).

**Riesgo:** Crítico. Si se procesa un pago sin `stripe_account` (a la cuenta principal de Growtria), Libia se vuelve responsable fiscalmente del dinero. **Mitigación:** Helper obligatorio en Express que falla loud si `stripe_account` no está presente en cualquier `payment_intent`.

### 1.4 Repo: estructurado en GitHub

**Estado actual:** Código parcial, no claro si está en GitHub o local.

**Cambios:**
- Crear repo privado `growtria` en GitHub.
- Agregar `.gitignore` estricto (especialmente `.env`, `*.db`, `node_modules/`).
- Agregar `.env.example` como plantilla pública.
- Estructura de branches: `main` (producción), `dev` (staging), `feature/*` (trabajo).
- GitHub Actions:
  - Lint + type-check en cada PR.
  - Deploy a staging en merge a `dev`.
  - Deploy a producción solo desde `main` con aprobación manual.
- Secrets de GitHub Actions: copiar todas las variables sensibles del `.env` al panel de Secrets.
- Si hay código local sin versionar, crear el primer commit con etiqueta `v0.1-pre-migration` antes de tocar nada.

---

## 2. Nuevas funcionalidades (el embudo de Salvador)

### 2.1 Tablas nuevas en Supabase

**Crear tres tablas nuevas:**

- `patients` — pacientes anónimos del embudo. Campos: `id`, `nombre`, `whatsapp`, `email`, `stripe_customer_id`, `payment_method_id`, `doctor_id`, `created_at`. **Sin** `auth.uid` — los pacientes no se autentican con Clerk.
- `slots` — espacios de agenda del doctor. Campos: `id`, `doctor_id`, `inicio`, `fin`, `estado` (enum), `bloqueado_hasta`. Estado: `disponible` / `bloqueado_temporal` / `reservado`.
- `appointments` — citas confirmadas. Campos: `id`, `doctor_id`, `patient_id`, `slot_id`, `modalidad`, `monto_total`, `monto_pagado`, `stripe_payment_intent_id`, `stripe_transfer_id`, `application_fee_amount`, `estado`, `created_at`.

**Aplicar RLS** en todas:
- Doctor solo lee/escribe lo suyo (filtrado por `doctor_id` vs `auth.jwt() ->> 'sub'`).
- Pacientes anónimos pueden leer slots disponibles del doctor del Hub Page público (vía vista o policy permisiva).

### 2.2 Campos nuevos en `doctors`

Agregar a la tabla existente:
- `clerk_user_id` (texto, único, indexado).
- `precio_presencial` (numeric).
- `precio_online` (numeric).
- `apartado_monto` (numeric, default 1000).
- `stripe_connect_account_id` (texto).
- `stripe_connect_charges_enabled` (boolean, default false).
- `stripe_connect_payouts_enabled` (boolean, default false).

### 2.3 Endpoints Express nuevos

Crear en `/server/routes/`:

- `stripe.ts`:
  - `POST /api/stripe/connect/onboard` — crea cuenta y devuelve account link.
  - `POST /api/stripe/setup-intent` — paso 2 del embudo.
  - `POST /api/stripe/payment-intent` — paso 3 del embudo.
  - `POST /api/stripe/webhook` — recibe webhooks de Stripe.
- `slots.ts`:
  - `GET /api/slots/:doctorSlug` — lista slots disponibles del Hub público.
  - `POST /api/slots/:slotId/lock` — bloquea slot por 10 min.
  - `POST /api/slots/:slotId/release` — libera slot bloqueado.
  - `POST /api/slots/bulk` — doctor crea múltiples slots (recurrencias).
- `appointments.ts`:
  - `POST /api/appointments` — crea cita después de pago exitoso.
  - `GET /api/appointments` — doctor lista sus citas.
  - `POST /api/appointments/:id/cancel` — doctor cancela y dispara reembolso.
- `patients.ts`:
  - `POST /api/patients` — registro anónimo en paso 2.

### 2.4 Cron job para liberar slots expirados

Job que corre cada 1 minuto y libera slots con `bloqueado_hasta < now()` que sigan en `bloqueado_temporal`. Implementar con Supabase Edge Function programada o con `node-cron` en Express.

### 2.5 Integración ManyChat

- Webhook saliente al evento `appointment.confirmed`: POST a ManyChat con payload del paciente para disparar flujo de confirmación por WhatsApp.
- Reusar la infraestructura de ManyChat ya probada con la cuenta del Dr. Salvador en marzo.
- Crear Flow ID en ManyChat para el mensaje de confirmación; guardarlo en `MANYCHAT_FLOW_CONFIRMATION_ID`.

### 2.6 Generación de archivo .ics

Al confirmar cita, generar un `.ics` (formato calendario universal) y entregárselo al paciente como descarga + adjuntarlo al email de confirmación.

### 2.7 Email transaccional

Integrar Resend (o el provider que se confirme):
- Email al paciente al confirmar cita (con `.ics` adjunto).
- Email al doctor con notificación de nueva cita.
- Email al paciente si el doctor cancela (con info del reembolso).

---

## 3. Cambios en UI/UX de módulos existentes

### 3.1 Hub Page — agregar el embudo

**Estado actual:** Hub Page muestra perfil, servicios, intro video, formulario de leads, botones de WhatsApp y `AnimalitoChat`.

**Cambios visuales/funcionales:**

- **Reemplazar el formulario de captura de leads genérico** por el CTA principal "Agendar consulta" que dispara el embudo de pagos. El formulario de leads simple puede quedar como secundario ("¿prefieres que te contactemos?") pero NO debe competir con el CTA principal.
- **Agregar sección de "Cómo agendar"** debajo del intro video, con 3 íconos: 1) Conoce al doctor, 2) Reserva en línea, 3) Te confirmamos. Esto explica el embudo antes de que lo recorran.
- **Mostrar la dirección y mapa embebido** de forma prominente (uno de los datos que Salvador insistió que el paciente siempre busca primero).
- **Mostrar "Atiende en línea" o "Atiende presencial" o ambos** como badges visibles, sin precio.
- **NO mostrar precios en ningún lado del Hub Page.** Esta es la regla más importante.

### 3.2 Pantallas nuevas del embudo (paso 2, 3, 4)

Crear tres rutas/pantallas nuevas en el frontend, todas con la estética rosa/animalitos:

- `/[slug]/agendar/registro` — paso 2: formulario + Stripe Elements para tokenización.
- `/[slug]/agendar/cita` — paso 3: precio, modalidad, calendario de slots, opciones de pago.
- `/[slug]/agendar/confirmacion` — paso 4: confirmación con animación de la ardilla (confeti suave de Framer Motion), botón para `.ics`, botón para abrir WhatsApp.

**Stripe Elements debe llevar `appearance` personalizada** que empate con la paleta rosa de Growtria. NO dejar el look default de Stripe (gris corporativo).

### 3.3 AnimalitoChat — restricciones nuevas

**Estado actual:** Habla y pre-cualifica pacientes con el conocimiento `jiro_knowledge` precargado.

**Restricciones a agregar al system prompt del LLM:**

1. **No dar precios.** Si el paciente pregunta cuánto cuesta, responder: *"El Dr. tiene varias modalidades y opciones para apartar tu cita. Puedes ver todo y agendar dando tap aquí 👉 [Agendar consulta]"*. Y mostrar un botón embebido en el chat que lleva al CTA del embudo.
2. **No dar diagnósticos médicos.** Si el paciente pregunta algo clínico ("¿le doy paracetamol a mi bebé de 3 meses?"), responder: *"Esa pregunta es importante y el Dr. la responde mejor en consulta. ¿Quieres agendar?"*.
3. **No prometer disponibilidad** de slots específicos. Cuando hablen de horarios, redirigir al calendario real del paso 3.
4. **Sí dar:** ubicación, datos del doctor, modalidades disponibles, FAQs precargadas en `jiro_knowledge`, recursos descargables.

**Implementación:** modificar el macro-prompt del LLM para incluir estas reglas como restricciones duras al inicio del system message.

### 3.4 Hub Page — diseño emocional de los animalitos

Los animalitos ya existen como concepto. Aplicarlos consistentemente:
- Ardilla en el chat del Hub Page.
- Misma ardilla (más grande, animada) en la pantalla de confirmación.
- Animalito de "estoy contigo" en una esquina mientras el paciente registra tarjeta (paso 2) — reduce ansiedad de meter datos sensibles.
- Animalito de "cargando tu cita" durante el procesamiento de Stripe (paso 3) — convierte espera técnica en momento de marca.

---

## 4. Restricciones sobre módulos existentes

### 4.1 Content Analyzer — la fórmula es sagrada

`impactScore = (comentarios × 10) + (compartidos × 15) + (likes × 1) + (vistas × 0.01)` no se modifica sin decisión explícita de Libia. Es un activo del producto.

### 4.2 Jiro AI — mantener flexibilidad de LLM

Los tres motores (Gemini, OpenAI, Claude) se mantienen intercambiables desde `user_settings`. No atar a un solo proveedor por conveniencia. Si Claude Code propone simplificar a un solo LLM, rechazar.

**Cambio menor:** actualizar el modelo de Claude del actual `claude-3-5-sonnet-20240620` al más reciente disponible (Claude Sonnet 4.6 o 4.7). Verificar nombre exacto de la API key.

### 4.3 Personal Brand OS — input obligatorio para Jiro

Si un doctor entra a Jiro sin haber completado las tres capas del Brand OS, Jiro debe rechazar generar recomendaciones y redirigir a completar el onboarding. No improvisar contenido sin contexto.

### 4.4 Meta Graph API — preservar OAuth nativo

El flow OAuth con Meta v19.0 funciona y debe preservarse como método principal. Apify queda solo como respaldo (ya está así en el doc).
*NOTA DEL DESARROLLADOR:* Esto fue sobrescrito por instrucción en tiempo real. Meta Graph se ha eliminado por completo y ahora es 100% dependiente de Apify.

### 4.5 Meta Ads — NO automatizar

Si en algún momento se considera automatizar campañas de Meta Ads desde la API, **detenerse**. Resulta en baneo de cuenta publicitaria (advertencia de la mentoría del 11 de abril). Solo se puede usar Meta Ads para análisis de métricas y generación de copy.

---

## 5. Rediseño del dashboard del doctor

### 5.1 Cambio de jerarquía visual

**Estado actual (inferido del doc):** El dashboard probablemente prioriza métricas de redes sociales (vistas, alcance, impactScore).

**Cambio:** Priorizar **dinero y citas** arriba de todo. La pantalla home del doctor al iniciar sesión debe mostrar, en este orden:

1. **Tarjeta grande:** "Esta semana cobraste $X en Y citas confirmadas" (con desglose presencial/línea).
2. **Próximas citas** (lista de las 5 más cercanas, con botón para ver detalle del paciente).
3. **Slots disponibles esta semana** (visualización de calendario).
4. **Recomendaciones de Jiro** (las 3 sugerencias de contenido para esta semana).
5. **Métricas de Instagram** (Top 5, impactScore) — esto pasa a ser secundario, accesible desde un tab.

### 5.2 Sección nueva: "Pagos"

Crear nueva sección en el dashboard:
- Histórico de cobros (con link al Stripe Express dashboard del doctor).
- Estado de la cuenta Stripe Connect (verde si todo OK, rojo si hay acción pendiente).
- Reembolsos emitidos.
- Comisión Growtria cobrada (transparencia).

### 5.3 Sección nueva: "Agenda"

- Calendario visual con drag-and-drop para crear/mover slots.
- Configuración de horarios recurrentes (ej. "lunes a viernes, 9-13 y 16-19").
- Modo "vacaciones" (bloquea todos los slots de un rango).
- Vista de citas reservadas con detalle del paciente.

### 5.4 Sección nueva: "Pacientes"

- Lista de pacientes únicos (deduplicados por email/whatsapp).
- Historial de citas por paciente.
- Notas privadas del doctor sobre cada paciente.
- Conversaciones que tuvieron con `AnimalitoChat` antes de agendar (útil para preparar la consulta).

### 5.5 Onboarding conversacional

**Estado actual (inferido):** El onboarding es probablemente formularios para llenar las capas del Brand OS.

**Cambio:** Convertir el onboarding en una conversación con Jiro. Estilo chat (no formulario). Jiro pregunta una cosa a la vez, el doctor responde. Esto reduce abandono (formularios largos espantan).

---

## 6. Higiene técnica y de seguridad

### 6.1 RLS en todas las tablas Supabase

No negociable. Ninguna tabla puede quedar sin RLS activo. Documentar todas las policies en `/docs/rls.md`.

### 6.2 .env y .gitignore

- Crear `.env.example` (commitable, plantilla pública). Ya entregado.
- Crear `.gitignore` estricto. Ya entregado.
- Nunca commitear `.env` real.
- En producción, usar GitHub Actions Secrets o variables de entorno de la plataforma de hosting.

### 6.3 Validación de inputs

Toda ruta Express que reciba input del cliente debe validarlo con Zod (o equivalente). No confiar en el cliente para `doctor_id`, `precio`, `monto`, etc.

### 6.4 Helper obligatorio para queries multi-tenant

Crear helper en Express que **siempre** filtra por `doctor_id` del usuario autenticado. Ejemplo:

```ts
function withDoctor(doctorId: string) {
  return supabase.from('appointments').eq('doctor_id', doctorId);
}
```

Prohibir queries directas sin pasar por este helper.

### 6.5 Logs y monitoreo

- Sentry para errores (opcional pero recomendado).
- PostHog para analytics de producto (opcional, ayuda a medir conversión del embudo paso a paso).
- Logs de Express con timestamps y `request_id` para correlacionar.

### 6.6 Pruebas E2E del embudo

Mínimo: un test E2E que simule un paciente recorriendo los 4 pasos del embudo sin errores. Usar Playwright o similar. Correr en CI antes de cada merge a `main`.

---

## 7. Lo que NO cambia

Para que quede explícito y nadie (incluido Claude Code) refactorice por refactorizar:

- **Vite + React** se mantiene. No migrar a Next.js.
- **Express** se mantiene como capa de API. No migrar a serverless puro.
- **TailwindCSS + Framer Motion** se mantienen.
- **La fórmula `impactScore`** se mantiene tal cual.
- **Los tres motores de LLM intercambiables** se mantienen.
- **La estética rosa/suave/animalitos** se mantiene y se extiende a las pantallas nuevas.

---

## 8. Orden sugerido de ejecución

Si se ejecutan los cambios en este orden, el riesgo de romper algo funcional es menor:

**Fase 1 — Setup (1-2 días)**
1. Crear repo en GitHub con `.gitignore` y `.env.example`.
2. Crear proyectos en Supabase, Clerk, Stripe (test mode).
3. Llenar `.env` con todas las variables.
4. Audit del repo actual con Claude Code (`/docs/audit.md`).

**Fase 2 — Migración (1-2 semanas)**
5. Migrar tablas SQLite a Supabase (una por una).
6. Migrar auth a Clerk con JWT template para Supabase.
7. Reescribir queries de Express para usar Supabase.
8. Activar RLS en todas las tablas.

**Fase 3 — Stripe Connect (1 semana)**
9. Implementar onboarding del doctor (Stripe Express).
10. Implementar `setup_intent` para paso 2 del embudo.
11. Implementar `payment_intent` con `application_fee_amount`.
12. Configurar webhooks y verificación de firma.

**Fase 4 — Embudo de citas (2 semanas)**
13. Crear tablas `patients`, `slots`, `appointments`.
14. Construir las 3 pantallas nuevas (registro, precio/slot, confirmación).
15. Cron job para liberar slots expirados.
16. Integrar ManyChat para confirmación por WhatsApp.
17. Email transaccional con Resend.

**Fase 5 — Restricciones y refinamiento (1 semana)**
18. Actualizar system prompt de `AnimalitoChat` con las restricciones nuevas.
19. Rediseñar dashboard del doctor (priorizar dinero, agregar Pagos/Agenda/Pacientes).
20. Convertir onboarding a conversación con Jiro.
21. Pruebas E2E del embudo completo.

**Fase 6 — Producción (3-5 días)**
22. Cambiar Stripe a modo live.
23. Deploy a producción.
24. Onboarding del primer doctor real (Dr. Salvador).
25. Monitoreo activo de los primeros pagos.

**Total estimado:** 5-7 semanas con Claude Code asistiendo en paralelo (Agent Teams).

---

## 9. Decisiones pendientes que bloquean ejecución

Marcado como `[CONFIRMAR]` en otros documentos. Listadas aquí para no perderlas:

- **Comisión de Growtria** sobre cada pago (% para `STRIPE_PLATFORM_FEE_PERCENT`). Sugerencia: 5–10%.
- **Provider de email**: Resend (recomendado), SendGrid, o SMTP propio.
- **Dominio definitivo**: ¿`growtria.app`, `growtria.com`, otro?
- **Modelo de Claude por default** para Jiro (sugerencia: Claude Sonnet 4.6 o 4.7, verificar nombre exacto).
- **Stripe Connect**: confirmar tipo Express (recomendado para esta arquitectura) vs. Standard.

---

**Próximo paso recomendado:** ejecutar la Fase 1 esta semana. Con eso queda el setup completo y Claude Code puede arrancar la migración real.
