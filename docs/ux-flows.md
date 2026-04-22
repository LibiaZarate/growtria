# Flujos de Experiencia de Usuario (UX Flows) - Growtria

Este documento describe la experiencia completa antes de seguir construyendo. Se plantea desde dos perspectivas porque Growtria tiene **dos usuarios distintos** con experiencias completamente diferentes:

1. **El doctor** (quien paga la suscripción a Growtria)
2. **El paciente** (quien paga la consulta al doctor vía Growtria)

---

## Parte 1 — La experiencia del DOCTOR

El doctor llega a Growtria porque vio en Instagram que otra colega pediatra está llenando su agenda con likes que se vuelven citas. La promesa que debe sentir desde el segundo uno es: **"esto convierte mi presencia en redes en consultas pagadas, sin que yo tenga que contestar mensajes ni perseguir pacientes"**.

### Onboarding (los primeros 30 minutos)

El doctor entra a `growtria.app`, hace signup con Clerk (Google o email). Lo recibe Jiro presentándose: *"Soy tu copiloto para tu marca personal médica. Vamos a configurarte en tres pasos."* Esos tres pasos son las tres capas del Personal Brand OS que ya construiste — Identidad Nuclear, Deseos y Dolores, Narrativa Continua. La diferencia clave es que **no debe sentirse como un formulario de 30 campos**. Debe sentirse como una conversación con Jiro donde él pregunta y el doctor responde.

Después de las tres capas viene la conexión de Instagram (Meta Graph API) y el momento mágico: el Content Analyzer corre por primera vez y le entrega su Top 5 con la fórmula `impactScore`. *"Estos cinco contenidos son los que más conexión real generaron. No los más vistos — los que de verdad mueven a tus pacientes a actuar."* Eso es un *aha moment*.

Inmediatamente después, Jiro le pide configurar lo que viene del lado de Salvador: precios (presencial, en línea), monto de apartado, dirección de la clínica, FAQs frecuentes que `AnimalitoChat` va a responder por él. Y aquí viene el paso que ningún competidor hace bien: **conectar Stripe**. Con un solo botón "Cobra directo en tu cuenta" empieza el flujo de Stripe Connect Express. KYC, cuenta bancaria, listo. 15 minutos.

Al final del onboarding, el doctor tiene su Hub Page público en `growtria.app/dr-salvador-villalpando` y puede compartir el link en su bio de Instagram. Ya está vendiendo.

### El uso diario (lo que mantiene al doctor pagando la suscripción)

El doctor abre la app dos o tres veces por semana. Cada vez encuentra:

**Su dashboard principal** muestra primero lo que más le importa: cuántas citas se reservaron esta semana, cuánto facturó (vía Stripe Connect, números reales), y qué slots tiene libres. No métricas vanidosas — números que se traducen a su bolsillo.

**Jiro le sugiere contenido nuevo basado en lo que está funcionando.** Cada lunes, Jiro le dice: *"Tu reel del miércoles pasado sobre fiebre en bebés tuvo \`impactScore\` de 487. Esta semana documenta tres temas en esa misma línea: [tres recomendaciones específicas con guion sugerido]."* El doctor sale, graba, sube. Jiro evalúa los nuevos contenidos cuando se publican y ajusta sus recomendaciones.

**Ve quién está agendando.** Notificación: *"María Pérez acaba de apartar consulta en línea para el viernes 24. Pagó $1,000 de apartado. Quedan $2,000 a cobrar el día de la cita."* El doctor puede ver el perfil del paciente, leer la conversación que tuvo con `AnimalitoChat`, y prepararse mejor para la consulta.

**Gestiona su agenda.** Puede abrir o cerrar slots, definir horarios recurrentes, marcar vacaciones. Si necesita cancelar una cita, el sistema le avisa al paciente por WhatsApp y reembolsa automáticamente vía Stripe.

### La experiencia emocional del doctor

Lo que debe sentir el doctor en cada interacción es **alivio**. Ese alivio viene de dejar de hacer cosas que odia: contestar el mismo mensaje 40 veces ("¿cuánto cuesta?", "¿dónde estás?", "¿cómo agendo?"), cobrar consultas en efectivo, perseguir pacientes que se rajan, llevar agenda en cuaderno. Growtria es el asistente administrativo que no tiene.

Y la estética rosa/animalitos importa aquí: muchos productos para profesionales de salud son fríos y corporativos (Doctoralia, NubeMD). Growtria se siente cálido. Eso le habla al subset específico de Libia: pediatras, especialmente mujeres pediatras, que valoran la calidez visual.

---

## Parte 2 — La experiencia del PACIENTE

El paciente nunca entra a "Growtria" como marca. Para él, la experiencia es **el Hub Page del doctor**. Growtria es invisible, como Stripe es invisible cuando compras en Shopify.

### El descubrimiento

Una mamá ve un reel del Dr. Salvador en Instagram sobre cómo manejar la fiebre en bebés de 6 meses. Le sirve. Va al perfil, da tap en el link de la bio. Llega al Hub Page.

### Primera impresión (los primeros 5 segundos)

Lo que ve no parece una landing page de marketing. Parece **el espacio personal del doctor**. Foto del Dr. Salvador, su nombre, "Pediatra · Monterrey", su frase corta ("Acompaño a mamás primerizas en los primeros 1000 días"), un video de presentación de 30 segundos donde él habla directo a cámara. La estética rosa/suave la hace sentir en confianza, no en una clínica corporativa.

Debajo: tres botones grandes — *"Hablar con asistente"*, *"Ver consejos gratis"* (los recursos descargables), *"Agendar consulta"*. Y al fondo, una ardilla simpática esperando: `AnimalitoChat`.

### El asistente (donde se resuelven las dudas)

La mamá da tap en la ardilla. Se abre un chat. *"¡Hola! Soy la asistente del Dr. Salvador. Cuéntame, ¿en qué te puedo ayudar?"*

Ella escribe: *"¿el doctor atiende bebés de menos de un año?"*. La ardilla responde con la información que el doctor precargó en `jiro_knowledge`: *"Sí, el Dr. Salvador atiende desde recién nacidos. De hecho, su especialidad principal es acompañamiento en los primeros 1000 días."*

Ella pregunta *"¿dónde está la clínica?"* — la ardilla manda dirección + mapa embebido. Pregunta *"¿cuánto cuesta la consulta?"* — la ardilla **no da el precio**, redirige: *"El Dr. tiene varias modalidades (presencial y en línea) y opciones para apartar tu cita. Si quieres ver todo y agendar, da tap aquí 👉 [Agendar consulta]."*

Esta restricción es clave. El precio se reserva para el momento donde el paciente ya está comprometido emocionalmente. Salvador insistió en esto.

### La decisión (el embudo de Salvador)

La mamá ya está convencida. Da tap en "Agendar consulta".

**Pantalla 2 — Apartar tu lugar**: *"Para mostrarte horarios y opciones, necesitamos algunos datos básicos. Sitio seguro, no se realizará ningún cargo todavía."* Pide nombre, WhatsApp, email y tarjeta. El formulario debe sentirse cálido, no transaccional. La ardilla aparece en una esquina diciendo *"estoy contigo"*.

Ella llena. Stripe `setup_intent` tokeniza la tarjeta. Pasa.

**Pantalla 3 — Tu consulta**: aquí aparecen las opciones. *"Puedes pagar la consulta completa hoy o apartar tu cita con $1,000 (acreditable y reembolsable)."* Modalidad presencial $2,000 o en línea $3,000. Calendario con slots reales, los disponibles en color, los ocupados grises. Ella elige miércoles a las 10 am, modalidad presencial, apartar con $1,000.

El slot se bloquea 10 minutos. Stripe `payment_intent` por $1,000 a la cuenta conectada del doctor (con `application_fee_amount` para Growtria, invisible para ella). Procesa.

**Pantalla 4 — Confirmación**: la ardilla aparece más grande, con un confeti suave de Framer Motion. *"¡Listo! Tu cita con el Dr. Salvador queda confirmada para el miércoles 24 a las 10 am."* Botones para añadir al calendario (`.ics`), para abrir WhatsApp y empezar a chatear con el doctor, para descargar comprobante.

A los 30 segundos le llega un mensaje por WhatsApp (ManyChat): *"Hola María, soy el equipo del Dr. Salvador. Tu cita queda confirmada para el miércoles 24..."*. Eso le confirma que es real.

### La experiencia emocional de la paciente

Lo que debe sentir la mamá: **fui escuchada, no procesada**. La diferencia entre Growtria y Doctoralia es que Doctoralia es un buscador frío de doctores, donde tú eliges entre 50 nombres y precios. Growtria es **el espacio del doctor que ya elegiste**. La conversación con la ardilla, los animalitos, la estética rosa, todo construye intimidad.

Y lo importante: el embudo nunca se sintió como embudo. Se sintió como el camino natural de "tengo una duda → la resuelvo → me quedo tranquila → reservo".

---

## Parte 3 — Visualización del flujo completo

```text
DOCTOR (paga suscripción a Growtria)        PACIENTE (paga consulta al doctor)
─────────────────────────────────────       ──────────────────────────────────
1. Onboarding con Jiro                      1. Ve un reel en Instagram
   (capas Brand OS conversadas)                (da like, tap en bio)
              ↓                                          ↓
2. Conecta Instagram                        2. Llega al Hub Page
   (Top 5 con impactScore = aha)               (foto, video, ardilla, sin precio)
              ↓                                          ↓
3. Configura precios + Stripe Connect ★     3. Habla con AnimalitoChat
   (15 min de KYC, listo para cobrar)          (resuelve dudas, NO da precio)
              ↓                                          ↓
4. Comparte Hub Page en bio                 4. Registra tarjeta sin cargo ★
   (ya está vendiendo)                         (Stripe setup_intent)
              ↓                                          ↓
5. Uso semanal                              5. Ve precio + elige slot
   (Jiro recomienda, citas reservadas)         (pagar completa o apartar)
                                                         ↓
                                            6. Confirmación + WhatsApp
                                               (confeti, ManyChat, .ics)

DONDE LOS DOS VIAJES SE TOCAN:
- Hub Page: el doctor lo configura una vez; el paciente lo vive cada vez.
- Stripe Connect: paciente paga → dinero va directo al doctor → Growtria comisión.
- ManyChat/WhatsApp: paciente confirma por WA; doctor lo prepara.
```

Los pasos marcados con ★ son los momentos críticos del modelo de negocio: la conexión de Stripe del lado del doctor y el registro de tarjeta sin cargo del lado del paciente.

---

## Mis tres recomendaciones de UX/producto

**Una.** El onboarding del doctor es el momento de mayor abandono. Si lo haces con formularios largos, lo pierdes. Si lo haces como conversación con Jiro (un chat tipo ChatGPT donde Jiro pregunta y el doctor responde por turnos), retienes el 3x. Considéralo: el mismo Jiro que ya construiste para estrategia, ponlo a hacer onboarding.

**Dos.** El `AnimalitoChat` necesita una restricción dura sobre precios y otra restricción suave: **no debe contestar dudas médicas reales** ("¿le doy paracetamol a mi bebé de 3 meses?"). Si lo hace, expones al doctor a riesgo legal. La ardilla debe ser amable pero clara: *"Esa pregunta es importante y el Dr. Salvador la responde mejor en consulta. ¿Quieres agendar?"*. Convierte una limitación en otro empuje al embudo.

**Tres.** El dashboard del doctor debe priorizar el **dinero real**, no las métricas de redes. Doctoralia y NubeMD muestran "1,234 visitas a tu perfil". Eso no significa nada para el doctor. Growtria debe mostrar: *"Esta semana cobraste $24,000 en 12 citas confirmadas. Tienes 8 citas en agenda para la próxima."*. Las métricas de Instagram (impactScore, alcance) son **input** para Jiro, no el producto que se le muestra al doctor en su home.
