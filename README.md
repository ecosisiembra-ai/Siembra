# 🌱 SIEMBRA — Sistema Integral de Educación Mexicana Basado en el Rendimiento Académico

Portal educativo NEM 2026 para escuelas de México. Multi-rol, PWA instalable, IA integrada con Anthropic Claude y pagos vía Conekta.

---

## Tabla de contenidos

- [Demo rápido](#demo-rápido)
- [Arquitectura](#arquitectura)
- [Portales y roles](#portales-y-roles)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Variables de entorno](#variables-de-entorno)
- [Setup local](#setup-local)
- [Deploy en Vercel](#deploy-en-vercel)
- [Edge Functions (Supabase)](#edge-functions-supabase)
- [Esquema de base de datos](#esquema-de-base-de-datos)
- [Ciclo escolar](#ciclo-escolar)
- [PWA](#pwa)
- [CI/CD](#cicd)

---

## Demo rápido

Abre `index.html` en un servidor local (o en Vercel) y usa el botón **"Explorar en modo demo"** para recorrer todos los portales sin necesidad de cuenta.

```bash
# Con cualquier servidor estático:
npx serve .
# o
python3 -m http.server 3000
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                  Vercel (static)                    │
│  index.html · alumno.html · padres.html · sa.html   │
│  facturacion.html · onboarding.html                 │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS / Supabase JS SDK
┌──────────────────▼──────────────────────────────────┐
│              Supabase (Backend)                     │
│  PostgreSQL · Auth · Realtime · Storage             │
│                                                     │
│  Edge Functions (Deno):                             │
│    ai-router          → Anthropic Claude API        │
│    invite-user        → Invitaciones por email      │
│    conekta-checkout   → Crear cobros Conekta        │
│    conekta-webhook    → Confirmar pagos             │
└─────────────────────────────────────────────────────┘
```

**Multi-tenant por CCT:** cada escuela tiene su propia CCT (Clave de Centro de Trabajo). Un mismo proyecto Supabase sirve a todas las escuelas; el aislamiento de datos se hace vía Row Level Security usando `escuela_cct` del perfil del usuario.

**IA server-side:** la API key de Anthropic vive únicamente en la Edge Function `ai-router`. El cliente nunca la ve; solo envía un JWT de Supabase para autenticarse.

---

## Portales y roles

| Rol | Portal | Archivo |
|---|---|---|
| `director` / `subdirector` | Dashboard directivo | `index.html` |
| `docente` / `tutor` | Portal docente | `index.html` |
| `coordinador` / `prefecto` | Panel de control escolar | `index.html` |
| `ts` | Trabajo social | `index.html` |
| `padre` | Portal familias | `padres.html` |
| `alumno` | Mi espacio | `alumno.html` |
| `admin` / `superadmin` | Super Admin | `sa.html` |
| — | Facturación | `facturacion.html` |
| — | Onboarding wizard | `onboarding.html` |

Todos los portales viven en el mismo origen. El login central está en `index.html`; el portal del alumno y el de padres son archivos independientes para mejor rendimiento en móvil.

---

## Estructura del repositorio

```
siembra/
├── index.html              # Hub principal (login + portales director/docente/coord/ts)
├── alumno.html             # Portal del alumno (PWA móvil)
├── padres.html             # Portal familias (PWA móvil)
├── sa.html                 # Super Admin
├── facturacion.html        # Panel de facturación y cobros Conekta
├── onboarding.html         # Wizard de alta de nueva escuela
├── siembra-services.js     # Capa de servicios compartida (auth, escuela, grupo, alumno…)
├── sw.js                   # Service Worker (caché offline + push notifications)
├── manifest.json           # Web App Manifest (PWA)
├── icon-192.png            # Ícono PWA 192×192
├── icon-512.png            # Ícono PWA 512×512
├── screenshot1.png         # Screenshot para instalación (390×844)
├── vercel.json             # Config de deploy (SPA rewrites)
└── .github/
    └── workflows/
        └── lint.yml        # CI: validación de sintaxis JS
```

**Edge Functions** (desplegar en `supabase/functions/`):

```
supabase/functions/
├── ai-router/index.ts          # Proxy Claude — requiere ANTHROPIC_API_KEY
├── invite-user/index.ts        # Invitaciones por email
├── conekta-checkout/index.ts   # Crear cobro — requiere CONEKTA_PRIVATE_KEY
└── conekta-webhook/index.ts    # Confirmar pagos de Conekta
```

---

## Variables de entorno

### En el código frontend (hardcoded — son claves públicas)

| Variable | Dónde | Descripción |
|---|---|---|
| `_KEY_HUB` | `index.html` línea 24 | Supabase anon key del proyecto hub |
| `SUPABASE_URL` | `index.html` línea 15 | URL del proyecto Supabase |

> Estas son claves **públicas** (`anon`/`publishable`). El aislamiento de datos lo garantiza Row Level Security en Supabase, no la ocultación de la clave.

### En Supabase Edge Functions → Secrets

| Secret | Edge Function | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | `ai-router` | Clave de Anthropic Claude |
| `CONEKTA_PRIVATE_KEY` | `conekta-checkout` | `sk_test_xxx` (sandbox) o `sk_live_xxx` (prod) |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas | Inyectado automáticamente por Supabase |
| `SUPABASE_URL` | Todas | Inyectado automáticamente por Supabase |

Para agregar secrets:
```bash
supabase secrets set CONEKTA_PRIVATE_KEY=sk_test_xxxxx
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Setup local

### Requisitos

- Navegador moderno (Chrome, Safari, Firefox)
- Cuenta en [Supabase](https://supabase.com) (plan Free es suficiente para desarrollo)
- Node.js 20+ (solo para linting y scripts de utilidad)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (para Edge Functions)

### Pasos

```bash
# 1. Clonar
git clone https://github.com/tu-org/siembra.git
cd siembra

# 2. Levantar servidor local
npx serve .
# → http://localhost:3000

# 3. El proyecto ya apunta al proyecto Supabase de demo
#    Para conectar tu propio proyecto, editar index.html líneas 15-24:
#    const _URL_HUB = 'https://TU_REF.supabase.co';
#    const _KEY_HUB = 'TU_ANON_KEY';
```

### Ejecutar el schema de billing

```sql
-- En Supabase Dashboard → SQL Editor → New Query
-- Pegar el contenido de siembra_billing_schema.sql y ejecutar
```

### Desplegar Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Vincular al proyecto
supabase link --project-ref TU_REF

# Desplegar funciones
supabase functions deploy ai-router
supabase functions deploy invite-user
supabase functions deploy conekta-checkout
supabase functions deploy conekta-webhook

# Agregar secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx
supabase secrets set CONEKTA_PRIVATE_KEY=sk_test_xxxxx
```

---

## Deploy en Vercel

El proyecto es HTML estático puro — el deploy es inmediato:

```bash
# Con Vercel CLI
npm i -g vercel
vercel

# O conectar el repo en vercel.com → Import Project
# Build Command: (vacío)
# Output Directory: .
# Framework: Other
```

`vercel.json` ya está configurado con los rewrites necesarios para que todas las rutas resuelvan a `index.html` (comportamiento SPA).

---

## Edge Functions (Supabase)

### `ai-router`

Proxy hacia Anthropic Claude. Recibe `{ feature, prompt, system, context, escuela_id }` y devuelve `{ text }`. Valida el JWT del usuario antes de llamar a Claude.

### `invite-user`

Genera tokens de invitación y los guarda en la tabla `invitaciones`. Usado por directores para invitar docentes, y por la app de padres para el flujo de vinculación.

### `conekta-checkout`

Recibe `{ escuela_id, plan_id, metodo }`, crea un Order en Conekta y registra el pago como `pendiente` en la tabla `pagos`. Devuelve:
- **Tarjeta:** `checkout_id` para el widget de Conekta.js
- **OXXO:** `referencia_oxxo` (18 dígitos)
- **SPEI:** `clabe_spei` (18 dígitos)

### `conekta-webhook`

Escucha eventos de Conekta (`order.paid`, `charge.failed`, `charge.refunded`) y actualiza el estado del pago y la suscripción de la escuela en Supabase.

Configurar en Conekta Dashboard → Webhooks:
```
URL: https://TU_REF.supabase.co/functions/v1/conekta-webhook
Eventos: order.paid, charge.failed, charge.refunded
```

---

## Esquema de base de datos

### Tablas principales

| Tabla | Descripción |
|---|---|
| `usuarios` | Todos los usuarios del sistema. `rol` determina el portal. `escuela_cct` vincula al centro. `auth_id` referencia a Supabase Auth. |
| `escuelas` | Una fila por CCT. Contiene `plan_suscripcion`, `estado_suscripcion`, `fecha_vencimiento`. |
| `grupos` | Grupos escolares. `grado`, `seccion`, `turno`, `ciclo`. |
| `alumnos_grupos` | Relación N:M alumno ↔ grupo por ciclo. |
| `docente_grupos` | Relación N:M docente ↔ grupo (también tutores). |
| `calificaciones` | Calificaciones NEM por `materia`, `trimestre`, `aspecto`, `alumno_id`. |
| `asistencia` | Un registro por alumno por día. `estado`: `presente`, `ausente`, `tardanza`. |
| `tareas_docente` | Tareas creadas por docentes. |
| `tareas_entregas` | Entregas de alumnos. |
| `padres_alumnos` | Relación padre ↔ alumno (activa). |
| `vinculos_padre` | Códigos de vinculación de un solo uso. |
| `invitaciones` | Tokens de invitación para nuevos usuarios. |
| `perfil_alumno` | XP, rachas y logros del alumno (gamificación). |
| `historial_xp` / `xp_eventos_alumno` | Log de eventos de XP. |
| `pagos` | Registro inmutable de cada cobro. Estado: `pendiente`, `pagado`, `fallido`, `reembolsado`. |
| `planes_config` | Precios y límites por plan (`basico`, `estandar`, `premium`). |

### Row Level Security

Todas las tablas tienen RLS habilitado. La política base es:

```sql
-- Ejemplo: un docente solo ve alumnos de su escuela
USING (escuela_id = (
  SELECT escuela_id FROM usuarios WHERE auth_id = auth.uid()
))
```

Las Edge Functions usan `service_role` key y bypasean RLS cuando necesitan acceso transversal (webhooks de pago, invitaciones).

---

## Ciclo escolar

El ciclo activo se configura en Supabase (tabla `configuracion`, clave `ciclo_activo`) y se sincroniza al cargar la app. El fallback es `'2025-2026'`.

Para cambiar el ciclo activo:
```sql
UPDATE configuracion SET valor = '2026-2027' WHERE clave = 'ciclo_activo';
```

---

## PWA

SIEMBRA es instalable como PWA en iOS y Android.

- **Manifest:** `manifest.json` — nombre, íconos, colores, orientación
- **Service Worker:** `sw.js` — caché offline de assets estáticos (versión `siembra-v2`) y dinámico para Supabase
- **Íconos:** `icon-192.png` e `icon-512.png` (maskable)
- **Screenshot:** `screenshot1.png` (390×844) — aparece en el diálogo de instalación en Android Chrome

---

## CI/CD

GitHub Actions (`.github/workflows/lint.yml`) valida la sintaxis de todos los bloques `<script>` en los HTML en cada push y PR.

Para correr el lint localmente:
```bash
node -e "
const fs = require('fs'), vm = require('vm');
['index.html','alumno.html','padres.html','sa.html'].forEach(file => {
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
  let m, i = 0;
  while ((m = re.exec(html))) {
    i++;
    try { new vm.Script(m[1]); }
    catch(e) { console.error(file + ' bloque #' + i + ': ' + e.message); }
  }
  console.log('✅ ' + file);
});
"
```

---

## Licencia

Propietario — © 2025 SIEMBRA. Todos los derechos reservados.
