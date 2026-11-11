# OpinaAnime — BRIEF de rediseño y mejoras de auth

> Fase 0 · Análisis sobre `main` @ `892f63b` · 2026-11-10

## 1. Stack

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 15.5** (App Router, Server Components + Client Components), React 19, TypeScript 5.9 |
| UI | Sin librería de componentes. JSX propio + íconos SVG propios (`components/icons.tsx`) |
| Estilos | **Tailwind CSS v4** (`@tailwindcss/postcss`) + `app/globals.css` con clases utilitarias propias (`.field`, `.field-dark`, `.field-light`, `.select`). **Sin tokens**: colores hex hardcodeados (`#0a0b0e`, `#121318`, `#22242a`…) repetidos en cada archivo |
| Datos | **Prisma 6** + PostgreSQL (`docker-compose.yml`). Modelos: `User`, `Recommendation`, `Comment`, `Vote`, `AnimeCatalog` |
| Auth | **NextAuth v4**, `CredentialsProvider` (email + contraseña con `bcrypt`), **sesión JWT** en cookie gestionada por NextAuth (`next-auth.session-token`, httpOnly, `sameSite=lax`, `secure` bajo HTTPS — valores por defecto de NextAuth). Roles `ADMIN`/`USER` en el token |
| Drag & drop | `@hello-pangea/dnd` (Tier List) |
| Tooling | `npm run build` ✅ · `npm run typecheck` ✅ · **`npm run lint` ❌ no configurado** (no hay ESLint instalado; `next lint` abre un asistente interactivo y está deprecado en 15.5) · **No hay tests ni test runner** |

## 2. Inventario de páginas y componentes

### Rutas
| Ruta | Archivo | Qué hace | Protegida |
|---|---|---|---|
| `/` | `app/page.tsx` → `components/dashboard.tsx` | Home = "foro". Carga todas las recomendaciones (orden por votos) y renderiza el Dashboard | Sí (`getServerSession`, si no → `/login`) |
| `/anime/[id]` | `app/anime/[id]/page.tsx` → `components/anime-thread.tsx` | Detalle de un anime: portada, rationale, reseña del admin, tier/estado, votos, hilo de comentarios. Lee `?notice=` | Sí |
| `/login` | `app/login/page.tsx` → `components/login-form.tsx` | Formulario de login. Muestra aviso si viene `?registered=1` | No |
| `/registro` | `app/registro/page.tsx` → `components/register-form.tsx` | Formulario de registro (nombre opcional, email, contraseña ≥ 8) | No |
| — | — | **No existe** página de perfil, listado/catálogo separado, footer, 404 personalizada ni `middleware.ts` | — |

### Componentes
| Componente | Líneas | Responsabilidades (todas deben conservarse) |
|---|---|---|
| `dashboard.tsx` | 933 | **Navbar** propia (logo, usuario, badge ADMIN, cerrar sesión, botón admin "sincronizar catálogo"). **Panel "Recomendar"**: buscador de anime + textarea de rationale + publicar. **Pestañas**: Foro / Viendo / Tier List. **Foro**: búsqueda por texto, select de orden (recientes, vistos, viendo, votados, comentados, tier), chips de filtro por estado con contadores, tarjetas de anime con votar (me gusta), contador de comentarios, link al hilo, eliminar (autor/admin), y para admin: cambiar estado y tier inline. **Viendo**: grilla de animes en `WATCHING`. **Tier List**: delega en `tier-list.tsx` |
| `anime-thread.tsx` | 710 | **Navbar** propia duplicada ("Volver al Foro", logo, usuario, ADMIN, cerrar sesión). Detalle del anime con link a MyAnimeList, votar, eliminar, edición admin (estado, tier, reseña del admin), formulario de comentario, lista de comentarios con borrar. Estado vacío: "Aún no hay comentarios en este debate. ¡Sé el primero en opinar!" |
| `tier-list.tsx` | 506 | Tablero S–E con drag & drop (solo admin reordena), "banco" de terminados sin clasificar, persistencia vía `/api/recommendations/reorder-tier` |
| `anime-search.tsx` | 226 | Autocompletado contra `/api/catalog/search` (+ `/api/anime/search`), verifica duplicados con `/api/recommendations/check` |
| `login-form.tsx` | 12 | Ver §3 |
| `register-form.tsx` | 19 | Ver §3 |
| `icons.tsx` | 90 | Íconos SVG inline |

### API
`/api/register` (POST) · `/api/auth/[...nextauth]` · `/api/recommendations` (POST) · `/api/recommendations/[id]` (PATCH, DELETE) · `/[id]/vote` (POST) · `/[id]/comments` (POST) · `/api/comments/[id]` (DELETE) · `/api/recommendations/check` · `/api/recommendations/reorder-tier` (POST, admin) · `/api/catalog/search` · `/api/anime/search` · `/api/admin/sync-catalog` (GET, admin).

## 3. Login y registro hoy

### Login (`components/login-form.tsx`)
1. Form → `signIn("credentials", { email, password, redirect: false })` de `next-auth/react` → `POST /api/auth/callback/credentials`.
2. `authorize()` en `auth.ts`: normaliza email, busca usuario, `bcrypt.compare`. Devuelve `{id, name, email, role}`.
3. NextAuth firma un **JWT** y lo deja en la cookie de sesión (httpOnly). `jwt`/`session` callbacks copian `role` e `id`.
4. Éxito → `router.push("/")` + `router.refresh()`. Error → "Correo o contraseña incorrectos.".
5. **No respeta `callbackUrl`**: siempre va a `/`.

### Registro (`components/register-form.tsx` + `app/api/register/route.ts`)
1. Form → `fetch POST /api/register` con `{name, email, password}`.
2. API valida (email con `@`, contraseña ≥ 8), 409 si el email existe, crea `User` con `bcrypt.hash(…, 12)`. Rol ADMIN si coincide con `ADMIN_EMAIL`. Responde `201 {id}`. **No crea sesión.**
3. Cliente → `router.push("/login?registered=1")`; el usuario debe volver a escribir sus credenciales.
4. **No hay verificación de email** (ni modelo, ni token, ni envío de correo). → El login automático no salta ninguna verificación.

### Implicancia para la mejora de login automático
Mecanismo a reutilizar: tras `201`, llamar a `signIn("credentials", { email, password, redirect: false })` con los valores del formulario en memoria local del handler (nunca storage/estado global) y luego `router.push("/")` + `router.refresh()`. Si `signIn` falla → `/login?registered=1` con el mensaje "Cuenta creada, inicia sesión".

## 4. Problemas detectados

### Diseño y usabilidad
1. **Estética fría y "de consola"**: casi negro (`#0a0b0e`), textos en mayúsculas con `tracking-widest`, sin imagen ni color de marca. Se siente técnico, no una comunidad de fans.
2. **Sin tokens de diseño**: decenas de hex hardcodeados distintos entre archivos (`#0a0b0e`, `#0b0f19`, `#0e0f14`, `#121318`, `zinc-*`, `slate-*`); `layout.tsx` usa `#0b0f19` y `globals.css` `#0a0b0e`.
3. **Solo modo oscuro forzado** (`<html className="dark">`); no hay modo claro ni respeto de `prefers-color-scheme`.
4. **Navbar duplicada** en `dashboard.tsx` y `anime-thread.tsx` con diferencias; no hay footer.
5. **Home sin jerarquía**: el panel de "Recomendar" compite con el foro; filtros, select de orden, chips y pestañas se apilan sin orden visual claro.
6. **Errores con `alert()`/`window.confirm()`** (≈15 usos) en lugar de mensajes en contexto.
7. **Formularios**: inputs sin `<label>` (solo placeholder), register usa `.field` y login `.field-dark`, errores sin `role="alert"`, botón de submit con estilo plano sin foco visible; mensaje `?registered=1` en gris poco visible.
8. **Accesibilidad**: foco con solo cambio de borde (`outline: none`), tamaño de texto `text-xs` muy usado, contraste `zinc-400` sobre `#121318` justo en el límite; pocos `aria-*`.
9. **Responsive**: navbar de `anime-thread` con tres bloques en fila (volver / logo / usuario+botones) que no se adapta bien a móvil; componentes de 700–900 líneas difíciles de mantener.
10. **Sin página 404 ni estados de carga** amables.

### Funcionales / seguridad (fuera del alcance visual, pero relevantes)
11. **Open redirect en `auth.ts` → `callbacks.redirect`**: acepta cualquier `url` que empiece con `/`, incluido `//evil.com` (URL protocol-relative), y cualquier host `*.vercel.app` (dominio de terceros). Debe restringirse a rutas internas (`/` sin `//`) y al `baseUrl`.
12. `/api/register`: `request.json()` sin try/catch (500 con body inválido) y condición de carrera en email duplicado (P2002 → 500 en vez de 409). Validación de email mínima.
13. `ADMIN_EMAILS` con correos personales hardcodeados en `auth.ts` (decisión existente; solo se señala).

## 5. Restricciones para la Fase 1
- **Tests y lint**: no existen. Para cumplir "corre build, lint y tests" hace falta **agregar dependencias de desarrollo** (ESLint + `eslint-config-next`; y un runner, p. ej. Vitest + Testing Library, y opcionalmente Playwright para E2E). **Requiere tu aprobación.**
- **E2E**: los flujos de punta a punta necesitan PostgreSQL local (`docker compose up -d` + `npm run db:push`); hoy el contenedor de OpinaAnime no está levantado.
- **Archivos compartidos entre agentes**: `components/login-form.tsx`, `components/register-form.tsx`, `app/login/page.tsx`, `app/registro/page.tsx`, `app/globals.css`. Propuesta de orden: Codex es dueño de los `*-form.tsx` (lógica + `PasswordInput`); Gemini es dueño de `app/login|registro/page.tsx` y `globals.css`, y en los forms solo toca `className` después de que Codex integre. El merge se hace en ese orden (auth primero, luego rediseño).
- Ninguna funcionalidad del inventario §2 puede desaparecer.
