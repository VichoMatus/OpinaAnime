# OpinaAnime — Guía de Estilo y Notas de Rediseño (`redesign/friendly-ui`)

> Documento de diseño previo a la implementación (Fase 1) y registro de cambios.
> Objetivo: transformar OpinaAnime de una interfaz técnica y fría ("de consola") en una comunidad cálida, cercana y moderna para compartir y debatir anime entre amigos, respetando modo claro y oscuro con contraste accesible (WCAG AA).

---

## 1. Paleta de Colores y Tokens (`@theme` + Variables CSS)

Los colores están definidos como variables semánticas en `app/globals.css` (con adaptación automática mediante `@media (prefers-color-scheme: dark)` y soporte mediante atributo `data-theme="light" | "dark"`, reutilizando un único conjunto de variables `--dark-*` sin duplicar hexadecimales) y expuestos a Tailwind CSS v4 con `@theme`.

### 1.1 Modo Claro (Cálido Crema / Papel Editorial)

| Token CSS | Utilidad Tailwind | Hex | Uso |
|---|---|---|---|
| `--bg` | `bg-bg` | `#FAF7F2` | Fondo general de la página (crema cálido suave) |
| `--bg-subtle` | `bg-surface-subtle` | `#F3EDE2` | Fondo secundario, bloques de cita, barra de pestañas, cabeceras |
| `--surface` | `bg-surface` | `#FFFFFF` | Tarjetas de anime, paneles, formularios, modales |
| `--surface-elevated` | `bg-surface-elevated` | `#FDFBF7` | Tarjetas destacadas, hover de tarjetas, dropdowns |
| `--fg` | `text-fg` | `#1C1917` | Texto principal y títulos (Stone 900 cálido) |
| `--fg-muted` | `text-fg-muted` | `#57534E` | Texto secundario, metadatos, etiquetas |
| `--fg-subtle` | `text-fg-subtle` | `#68625B` | Placeholders, pie de página, contadores secundarios |
| `--primary` | `bg-primary` / `text-primary` | `#C2410C` | Acción principal (Terracota / Naranja Anime cálido) |
| `--primary-hover` | `bg-primary-hover` | `#9A3412` | Hover de botón primario |
| `--primary-soft` | `bg-primary-soft` | `#FFEDD5` | Fondo suave de acento / chip activo suave |
| `--primary-fg` | `text-primary-fg` | `#FFFFFF` | Texto sobre fondo `--primary` en modo claro |
| `--accent` | `text-accent` / `bg-accent` | `#4F46E5` | Acento secundario (Índigo comunidad / enlaces destacados) |
| `--border` | `border-border` | `#E7E0D6` | Bordes de tarjetas, divisores |
| `--border-strong` | `border-border-strong` | `#857C73` | Bordes de inputs, selects y controles interactivos (≥ 3:1 WCAG 1.4.11) |
| `--ring` | `ring-ring` | `#EA580C` | Anillo de foco visible (`focus-visible`) |
| `--danger` | `text-danger` / `bg-danger` | `#B91C1C` | Errores, eliminar |
| `--danger-hover` | `bg-danger-hover` | `#991B1B` | Hover de botón peligroso (`.btn-danger:hover`) |
| `--danger-fg` | `text-danger-fg` | `#FFFFFF` | Texto sobre botón peligroso en hover |
| `--danger-soft` | `bg-danger-soft` | `#FEF2F2` | Fondo de alerta de error |
| `--success` | `text-success` | `#15803D` | Avisos de éxito, estado Terminado |
| `--success-soft` | `bg-success-soft` | `#F0FDF4` | Fondo de aviso de éxito |
| `--warning` | `text-warning` | `#B45309` | Estado "Lo veré", reseña admin |
| `--warning-soft` | `bg-warning-soft` | `#FFFBEB` | Fondo suave de reseña admin / aviso |
| `--info` | `text-info` | `#0E7490` | Estado "Viendo actualmente" |
| `--info-soft` | `bg-info-soft` | `#ECFEFF` | Fondo suave de estado viendo |

### 1.2 Modo Oscuro (Noche Cálida de Cine / Salón de Comunidad)

| Token CSS | Utilidad Tailwind | Hex | Uso |
|---|---|---|---|
| `--bg` | `bg-bg` | `#121110` | Fondo general (carbón cálido, no negro puro `#0a0b0e`) |
| `--bg-subtle` | `bg-surface-subtle` | `#1A1816` | Fondo secundario, bloques internos, pestañas |
| `--surface` | `bg-surface` | `#211E1C` | Tarjetas de anime, paneles, formularios |
| `--surface-elevated` | `bg-surface-elevated` | `#2A2623` | Hover de tarjetas, elementos desplegables |
| `--fg` | `text-fg` | `#F5F2EB` | Texto principal (marfil cálido) |
| `--fg-muted` | `text-fg-muted` | `#B8B0A4` | Texto secundario, metadatos |
| `--fg-subtle` | `text-fg-subtle` | `#9E9488` | Placeholders, pie de página, ayudas secundarias |
| `--primary` | `bg-primary` / `text-primary` | `#F97316` | Acción principal (Naranja cálido luminoso accesible sobre `--primary-soft` y `--surface`) |
| `--primary-hover` | `bg-primary-hover` | `#FB923C` | Hover de botón primario |
| `--primary-soft` | `bg-primary-soft` | `#3B1D0E` | Fondo suave de acento primario |
| `--primary-fg` | `text-primary-fg` | `#1A0B03` | Texto expreso oscuro de alto contraste sobre `--primary` |
| `--accent` | `text-accent` / `bg-accent` | `#818CF8` | Acento secundario (Índigo suave) |
| `--border` | `border-border` | `#332E2A` | Bordes de tarjetas, divisores |
| `--border-strong` | `border-border-strong` | `#857B72` | Bordes de inputs y selects (≥ 3:1 WCAG 1.4.11) |
| `--ring` | `ring-ring` | `#FB923C` | Anillo de foco visible (`focus-visible`) |
| `--danger` | `text-danger` / `bg-danger` | `#FCA5A5` | Texto/ícono de error o acción destructiva |
| `--danger-hover` | `bg-danger-hover` | `#B91C1C` | Hover de botón peligroso (`.btn-danger:hover`) |
| `--danger-fg` | `text-danger-fg` | `#FFFFFF` | Texto sobre botón peligroso en hover |
| `--danger-soft` | `bg-danger-soft` | `#351619` | Fondo de alerta de error |
| `--success` | `text-success` | `#4ADE80` | Estado Terminado / éxito |
| `--success-soft` | `bg-success-soft` | `#112A1C` | Fondo de aviso de éxito |
| `--warning` | `text-warning` | `#FBBF24` | Reseña del Admin / Estado "Lo veré" |
| `--warning-soft` | `bg-warning-soft` | `#2E220B` | Fondo suave de reseña admin |
| `--info` | `text-info` | `#38BDF8` | Estado "Viendo actualmente" |
| `--info-soft` | `bg-info-soft` | `#0F2634` | Fondo suave de estado viendo |

### 1.3 Tokens de Badges de Tier List (S–E)

| Token CSS | Utilidad Tailwind | Hex | Ratio con `--tier-fg` (`#FFFFFF`) | Uso |
|---|---|---|---|---|
| `--tier-s` | `bg-tier-s` | `#B91C1C` | **6.47 : 1** | Tier S — Obra maestra |
| `--tier-a` | `bg-tier-a` | `#C2410C` | **5.18 : 1** | Tier A — Excelente |
| `--tier-b` | `bg-tier-b` | `#B45309` | **5.02 : 1** | Tier B — Muy bueno |
| `--tier-c` | `bg-tier-c` | `#92400E` | **7.09 : 1** | Tier C — Entretenido |
| `--tier-d` | `bg-tier-d` | `#15803D` | **5.02 : 1** | Tier D — Regular |
| `--tier-e` | `bg-tier-e` | `#0F766E` | **5.47 : 1** | Tier E — Flojo |
| `--tier-fg` | `text-tier-fg` | `#FFFFFF` | — | Texto sobre badges y overlays de Tier List |

### 1.4 Verificación de Ratios de Contraste Actualizada (WCAG 2.1 AA y 1.4.11)

> Requisito WCAG AA: **≥ 4.5:1** para texto normal y **≥ 3.0:1** para bordes de inputs y componentes UI (WCAG 1.4.11).

| Par Texto / Borde sobre Fondo | Modo | Colores (Hex) | Ratio Calculado | Cumplimiento |
|---|---|---|---|---|
| `--fg` sobre `--bg` | Claro | `#1C1917` sobre `#FAF7F2` | **16.37 : 1** | AAA (Excelente) |
| `--fg` sobre `--surface` | Claro | `#1C1917` sobre `#FFFFFF` | **17.49 : 1** | AAA (Excelente) |
| `--fg-muted` sobre `--bg` | Claro | `#57534E` sobre `#FAF7F2` | **7.14 : 1** | AAA |
| `--fg-muted` sobre `--surface` | Claro | `#57534E` sobre `#FFFFFF` | **7.63 : 1** | AAA |
| `--fg-subtle` sobre `--bg` | Claro | `#68625B` sobre `#FAF7F2` | **5.64 : 1** | AA texto normal |
| `--fg-subtle` sobre `--bg-subtle` | Claro | `#68625B` sobre `#F3EDE2` | **5.17 : 1** | AA texto normal |
| `--fg-subtle` sobre `--surface` | Claro | `#68625B` sobre `#FFFFFF` | **6.02 : 1** | AA texto normal |
| `--primary-fg` sobre `--primary` | Claro | `#FFFFFF` sobre `#C2410C` | **5.18 : 1** | AA texto normal |
| `--primary` sobre `--primary-soft` | Claro | `#C2410C` sobre `#FFEDD5` | **4.52 : 1** | AA texto normal |
| `--border-strong` sobre `--surface` | Claro | `#857C73` sobre `#FFFFFF` | **4.10 : 1** | AA UI ≥ 3:1 (WCAG 1.4.11) |
| `--border-strong` sobre `--bg` | Claro | `#857C73` sobre `#FAF7F2` | **3.83 : 1** | AA UI ≥ 3:1 (WCAG 1.4.11) |
| `--danger` sobre `--danger-soft` | Claro | `#B91C1C` sobre `#FEF2F2` | **5.91 : 1** | AA texto normal |
| `--fg` sobre `--bg` | Oscuro | `#F5F2EB` sobre `#121110` | **16.87 : 1** | AAA (Excelente) |
| `--fg` sobre `--surface` | Oscuro | `#F5F2EB` sobre `#211E1C` | **14.82 : 1** | AAA (Excelente) |
| `--fg-muted` sobre `--bg` | Oscuro | `#B8B0A4` sobre `#121110` | **8.79 : 1** | AAA |
| `--fg-muted` sobre `--surface` | Oscuro | `#B8B0A4` sobre `#211E1C` | **7.72 : 1** | AAA |
| `--fg-subtle` sobre `--surface` | Oscuro | `#9E9488` sobre `#211E1C` | **5.56 : 1** | AA texto normal |
| `--fg-subtle` sobre `--bg-subtle` | Oscuro | `#9E9488` sobre `#1A1816` | **5.94 : 1** | AA texto normal |
| `--fg-subtle` sobre `--bg` | Oscuro | `#9E9488` sobre `#121110` | **6.33 : 1** | AA texto normal |
| `--primary-fg` sobre `--primary` (logo OA, `.btn-primary`) | Oscuro | `#1A0B03` sobre `#F97316` | **6.85 : 1** | AA / AAA texto normal |
| `--primary-fg` sobre `--primary-hover` | Oscuro | `#1A0B03` sobre `#FB923C` | **8.49 : 1** | AAA |
| `--primary` sobre `--primary-soft` (badge ADMIN y chips) | Oscuro | `#F97316` sobre `#3B1D0E` | **5.48 : 1** | AA texto normal |
| `--primary` sobre `--surface` | Oscuro | `#F97316` sobre `#211E1C` | **5.91 : 1** | AA texto normal |
| `--border-strong` sobre `--surface` | Oscuro | `#857B72` sobre `#211E1C` | **4.00 : 1** | AA UI ≥ 3:1 (WCAG 1.4.11) |
| `--border-strong` sobre `--bg` | Oscuro | `#857B72` sobre `#121110` | **4.56 : 1** | AA UI ≥ 3:1 (WCAG 1.4.11) |
| `--danger` sobre `--danger-soft` | Oscuro | `#FCA5A5` sobre `#351619` | **8.64 : 1** | AAA |
| `--tier-fg` sobre `--tier-s` | Ambos | `#FFFFFF` sobre `#B91C1C` | **6.47 : 1** | AA texto normal |
| `--tier-fg` sobre `--tier-a` | Ambos | `#FFFFFF` sobre `#C2410C` | **5.18 : 1** | AA texto normal |
| `--tier-fg` sobre `--tier-b` | Ambos | `#FFFFFF` sobre `#B45309` | **5.02 : 1** | AA texto normal |
| `--tier-fg` sobre `--tier-c` | Ambos | `#FFFFFF` sobre `#92400E` | **7.09 : 1** | AAA |
| `--tier-fg` sobre `--tier-d` | Ambos | `#FFFFFF` sobre `#15803D` | **5.02 : 1** | AA texto normal |
| `--tier-fg` sobre `--tier-e` | Ambos | `#FFFFFF` sobre `#0F766E` | **5.47 : 1** | AA texto normal |

---

## 2. Tipografía

Se utilizan fuentes locales mediante `next/font/local` con archivos `.woff2` variables alojados en `app/fonts/` junto con su licencia `OFL.txt` oficial (determinismo total de build sin depender de peticiones de red a Google Fonts y sin agregar dependencias a `package.json`):
- **Títulos y encabezados (`--font-display`)**: `Plus Jakarta Sans` (`app/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2`, pesos `400 800`, licencia `app/fonts/plus-jakarta-sans/OFL.txt`). Redondeada, expresiva, cálida y muy legible en títulos de series y secciones.
- **Cuerpo y controles (`--font-sans`)**: `DM Sans` (`app/fonts/dm-sans/DMSans-VariableFont_wght.woff2`, pesos `400 700`, licencia `app/fonts/dm-sans/OFL.txt`) con fallback `system-ui, -apple-system, sans-serif`.
- **Monoespaciada (`--font-mono`)**: `ui-monospace` para IDs de catálogo y contadores puntuales.

### Escala Tipográfica
- **Display / Título de Anime en Detalle**: `1.875rem` (30px) mobile → `2.25rem` (36px) desktop, `font-extrabold`, `leading-tight`.
- **H1 / Encabezado de Página**: `1.5rem` (24px) → `1.875rem` (30px), `font-bold`.
- **H2 / Título de Sección o Tarjeta**: `1.125rem` (18px) → `1.25rem` (20px), `font-bold`.
- **Body Base (Reseñas, comentarios, inputs)**: `1rem` (16px) o `0.9375rem` (15px), `leading-relaxed` (1.625). Se elimina el abuso de `text-xs` en contenido de lectura.
- **Meta / Etiquetas / Badges**: `0.8125rem` (13px) a `0.875rem` (14px), `font-medium`. Sin `tracking-widest` agresivo de consola.

---

## 3. Radios, Sombras y Escala de Espaciado

### 3.1 Radios (`@theme`)
- `--radius-sm`: `0.5rem` (8px) — Badges, chips pequeños, portadas miniatura.
- `--radius-md`: `0.75rem` (12px) — Inputs (`.field`), botones (`.btn`), selectores (`.select`).
- `--radius-lg`: `1rem` (16px) — Tarjetas de anime, tarjetas de comentarios, contenedores de portadas.
- `--radius-xl`: `1.25rem` (20px) — Paneles principales, tarjeta de login/registro, ficha de detalle.
- `--radius-full`: `9999px` — Píldoras de filtro y contadores.

### 3.2 Sombras (`@theme`)
- `--shadow-sm`: `0 1px 3px 0 rgb(28 25 23 / 0.06), 0 1px 2px -1px rgb(28 25 23 / 0.04)`
- `--shadow-md`: `0 4px 12px -2px rgb(28 25 23 / 0.08), 0 2px 6px -2px rgb(28 25 23 / 0.04)`
- `--shadow-lg`: `0 12px 28px -6px rgb(28 25 23 / 0.12), 0 4px 10px -4px rgb(28 25 23 / 0.06)`
*(En modo oscuro las sombras aumentan sutilmente su opacidad y se complementan con un borde cálido `1px solid var(--border)`).*

### 3.3 Escala de Espaciado
Basada en múltiplos de **4 px**:
- `4px` (`0.25rem` / `1`): Separación mínima ícono-texto o badge interno.
- `8px` (`0.5rem` / `2`): Gap entre chips, botones secundarios y elementos compactos.
- `16px` (`1rem` / `4`): Padding de inputs/botones, separación entre campos (`form-stack`), gap interno en móvil.
- `24px` (`1.5rem` / `6`): Padding de tarjetas de anime y paneles laterales, gap entre tarjetas del feed.
- `32px` (`2rem` / `8`): Separación entre columnas del layout principal y bloques del detalle.
- `48px` (`3rem` / `12`): Margen vertical de secciones principales y pie de página.

---

## 4. Clases Semánticas de Formulario y Botones (Contrato con Auth)

Definidas en `app/globals.css` bajo `@layer components` para ser usadas tanto en `/login` y `/registro` como en el resto de la aplicación:
- `.form-stack`: `flex flex-col gap-4` (espaciado vertical consistente de 16px).
- `.form-field`: `flex flex-col gap-1.5` (contenedor de `<label>` + control).
- `.form-label`: etiqueta clara (`0.875rem`, `font-semibold`, color `--fg`).
- `.field`, `.field-dark`, `.field-light`: input/textarea de ancho completo, radio `12px`, borde `--border-strong` (contraste ≥ 3:1), fondo `--surface`, texto `--fg`, con estados `:hover`, `:focus-visible` (anillo de `--ring`), `:disabled` y `:invalid` / `[aria-invalid="true"]`.
- `.password-field`: contenedor `position: relative; display: flex; align-items: center; width: 100%` donde `.password-field .field` recibe `padding-right: 3rem`.
- `.password-toggle`: botón autónomo (sin requerir utilidades Tailwind de posicionamiento) con `position: absolute; right: 4px; top: 50%; transform: translateY(-50%)`, dimensiones `40px × 40px` (`width: 40px; height: 40px; min-width: 40px; min-height: 40px`), centrado con flex (`display: inline-flex; align-items: center; justify-content: center`), color `var(--fg-muted)`, y anillo en `:hover` y `:focus-visible`.
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`: botones con altura mínima táctil (`42px`), basados 100% en tokens (`var(--primary)`, `var(--primary-fg)`, `var(--primary-hover)`, `var(--danger-hover)`, `var(--danger-fg)`), transiciones suaves y estados `hover`, `focus-visible` y `disabled`.
- `.form-error`: caja de alerta accesible con borde e indicador visual en tonos `--danger` / `--danger-soft`.
- `.form-notice`: caja de aviso positivo/informativo en tonos `--success` / `--success-soft`.
- `.select`: selector estilizado coherente con `.field`.

---

## 5. Wireframes ASCII

### 5.1 Home (`/`) — Desktop y Mobile

```text
+-----------------------------------------------------------------------------------+
| [Logo] OpinaAnime       Comunidad de anime entre amigos   [☀/🌙] [Usuario ADMIN]  |
|                                                           [Sincronizar] [Salir]   |
+-----------------------------------------------------------------------------------+
| BIENVENIDA / CABECERA DEL FORO                                                    |
| Recomienda joyas, vota tus favoritos y debate cada episodio sin spoilers.         |
|                                                                                   |
| [ 💬 Foro de Debate (8) ]   [ 📺 Viendo Ahora (2) ]   [ 🏆 Tier List (5) ]        |
+---------------------------------------------------+-------------------------------+
| COLUMNA PRINCIPAL: FEED DE RECOMENDACIONES        | LATERAL: RECOMENDAR ANIME     |
|                                                   | +---------------------------+ |
| +-----------------------------------------------+ | | ✨ Recomendar un anime    | |
| | [🔍 Buscar por título o amigo...] [Ordenar v] | | | ¿Qué serie deberíamos ver | |
| | Estado: (Todos 8) (Terminados 4) (Viendo 2)   | | | sí o sí?                  | |
| |         (Lo veré 1) (Descartados 1)           | | |                           | |
| +-----------------------------------------------+ | | Buscar en el catálogo:    | |
|                                                   | | [🔍 Ej. Frieren, Naruto ] | |
| +-----------------------------------------------+ | |                           | |
| | +----------+  Sousou no Frieren               | | | (Al elegir un anime:)     | |
| | |          |  Por Tester E2E • 1/10/2026      | | | [Img] Título (#ID)        | |
| | | PORTADA  |  [Tier S] [Terminado] [★ Admin]  | | | [¿Por qué vale la pena? ] | |
| | |  3:4     |                                  | | | [ Publicar recomendación] | |
| | |          |  "Una fantasía tranquila sobre   | | +---------------------------+ |
| | +----------+   el paso del tiempo..."         | |                               |
| |               ------------------------------- | |                               |
| |               [👍 2 Me gusta] [💬 3 opiniones]| |                               |
| |                              [Ver debate →]   | |                               |
| +-----------------------------------------------+ |                               |
+---------------------------------------------------+-------------------------------+
| Footer: OpinaAnime • El rincón privado de recomendaciones y reseñas entre amigos  |
+-----------------------------------------------------------------------------------+
```
*(En móvil `390px`: una sola columna sin scroll horizontal; cada tarjeta del foro muestra el póster protagonista en columna izquierda de `100px × 144px` (`grid-cols-[100px_1fr]`, `h-36`) junto a la información del anime).*

### 5.2 Detalle de Anime (`/anime/[id]`)

```text
+-----------------------------------------------------------------------------------+
| [← Volver al foro]        [Logo] OpinaAnime        [☀/🌙] [Usuario] [Salir]       |
+-----------------------------------------------------------------------------------+
| +-------------------------------------------------------------------------------+ |
| | +------------------+  Sousou no Frieren                    [👍 2] [🗑 Borrar] | |
| | |                  |  Recomendado por Tester E2E • 1/10/2026                  | |
| | |     PORTADA      |  Badges / Controles Admin: [Tier S v] [Terminado v]      | |
| | |    DESTACADA     |  ------------------------------------------------------- | |
| | |                  |  ¿POR QUÉ DEBERÍAS VERLO?                                | |
| | |                  |  "Una fantasía tranquila sobre el paso del tiempo y lo   | |
| | +------------------+   que dejamos en los demás. Cada episodio es un cuento." | |
| | [Ver en MyAnimeList ↗]                                                        | |
| +-------------------------------------------------------------------------------+ |
| | ★ VEREDICTO DEL ADMINISTRADOR                               [Veredicto: Tier S]| |
| | "Dirección impecable y una banda sonora que acompaña sin robar protagonismo." | |
| +-------------------------------------------------------------------------------+ |
| | (Si es ADMIN) PANEL DE EDICIÓN DE VEREDICTO                                   | |
| | [Asignar Tier v]  [Estado v]  [Textarea Reseña Final]  [Guardar veredicto]    | |
| +-------------------------------------------------------------------------------+ |
|                                                                                   |
| OPINIONES DE LA COMUNIDAD (3)                                                     |
| +-------------------------------------------------------------------------------+ |
| | Tu opinión sobre este anime (sin spoilers)                                    | |
| | [ Escribe qué te pareció, tu personaje favorito o momento memorable...      ] | |
| |                                                       [ Publicar opinión ]    | |
| +-------------------------------------------------------------------------------+ |
| +-------------------------------------------------------------------------------+ |
| | 👤 Mika • 10/10/2026                                                     [🗑] | |
| | La escena de las flores en el capítulo 1 me hizo llorar.                      | |
| +-------------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

### 5.3 Login (`/login`) y Registro (`/registro`)

```text
+-----------------------------------------------------------------------------------+
|                                                          [☀/🌙 Cambiar tema]      |
|                     +---------------------------------------+                     |
|                     |   (Ilustración cálida / Marca SVG)    |                     |
|                     |   OPINAANIME • COMUNIDAD PRIVADA      |                     |
|                     |                                       |                     |
|                     |   ¡Hola de nuevo! / Únete al club     |                     |
|                     |   Comparte tus animes favoritos y     |                     |
|                     |   descubre qué están viendo tus       |                     |
|                     |   amigos.                             |                     |
|                     |                                       |                     |
|                     |   [Aviso .form-notice si ?registered] |                     |
|                     |   +-------------------------------+   |                     |
|                     |   | <LoginForm /> o               |   |                     |
|                     |   | <RegisterForm />              |   |                     |
|                     |   | (.form-stack, .field,         |   |                     |
|                     |   |  .password-field, .btn...)    |   |                     |
|                     |   +-------------------------------+   |                     |
|                     |                                       |                     |
|                     |   ¿Aún no tienes cuenta?              |                     |
|                     |   [ Crear una cuenta gratis → ]       |                     |
|                     +---------------------------------------+                     |
+-----------------------------------------------------------------------------------+
```

---

## 6. Lista de Cambios por Archivo

| Archivo | Cambios realizados |
|---|---|
| `app/globals.css` | Definición de variables CSS para modo claro y modo oscuro sin duplicación (`--dark-*`), tokens de tier (`--tier-s` a `--tier-e` y `--tier-fg`), contraste WCAG AA/1.4.11 verificado, y clases semánticas de contrato (`.form-stack`, `.form-field`, `.form-label`, `.field`, `.password-field`, `.password-toggle`, `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.form-error`, `.form-notice`, `.select`). |
| `app/layout.tsx` | Eliminación de `className="dark"` fijo y del color hex `#0b0f19`. Configuración determinista de las fuentes locales `Plus Jakarta Sans` (`--font-heading`) y `DM Sans` (`--font-body`) mediante `next/font/local` desde `app/fonts/`. Uso de `bg-bg text-fg`. |
| `app/fonts/**` | Archivos variables `.woff2` (`PlusJakartaSans-VariableFont_wght.woff2` y `DMSans-VariableFont_wght.woff2`) y sus respectivos textos de licencia `OFL.txt`. |
| `app/login/page.tsx` | Rediseño del contenedor y tarjeta de inicio de sesión con estética cálida, emblema de comunidad, jerarquía tipográfica clara y enlace de cambio a `/registro`, manteniendo `<LoginForm />` intacto como hijo. |
| `app/registro/page.tsx` | Rediseño del contenedor y tarjeta de registro con estética cálida, encabezado cercano y enlace a `/login`, manteniendo `<RegisterForm />` intacto como hijo. |
| `components/site-header.tsx` | **Nuevo componente compartido** extraído de `dashboard.tsx` y `anime-thread.tsx`. Incluye logo/enlace a `/`, botón opcional "Volver al foro" (`showBackToForum`), nombre/email del usuario, badge `ADMIN`, botón exclusivo de admin "Sincronizar catálogo" con mensaje de estado/error en contexto (`role="alert"` / `role="status"`) y botón "Cerrar sesión". |
| `components/site-footer.tsx` | **Nuevo componente compartido** de pie de página con marca, descripción de la comunidad y enlace rápido al foro. |
| `components/dashboard.tsx` | Sustitución de la navbar propia por `<SiteHeader />` y adición de `<SiteFooter />`. Eliminación de todos los colores hex hardcodeados. Banner de bienvenida, jerarquía clara entre "Recomendar un anime" y las pestañas, tarjetas con póster compacto en móvil (`100px × 144px`) y completo en desktop (`148px × 208px`), estados vacíos amables y alertas en contexto. |
| `components/anime-thread.tsx` | Sustitución de la navbar duplicada por `<SiteHeader showBackToForum />` y adición de `<SiteFooter />`. Rediseño de la ficha principal del anime, bloque de fundamento, reseña final del administrador, panel de moderación/veredicto admin y sección de comentarios. |
| `components/tier-list.tsx` | Adaptación de la cuadrícula de Tier List S–E y del "Banco de animes terminados sin clasificar" a los tokens `--tier-s`…`--tier-e`, `--tier-fg` y `text-warning-border`, manteniendo el drag & drop (`@hello-pangea/dnd`) para administradores y alerta en contexto (`role="alert"`). |
| `components/anime-search.tsx` | Rediseño del buscador con autocompletado usando `.form-field`, `.form-label`, `.field`, `.form-notice` y `.form-error`, soporte claro/oscuro y estado vacío amable. |
| `tests/unit/site-header.test.tsx` | Pruebas unitarias para verificar el renderizado de `SiteHeader` (usuario normal vs. `ADMIN`, botón de sincronizar catálogo, "Volver al foro") y `SiteFooter`. |
| `e2e/screenshots.spec.ts` | Generación de capturas en modo claro (`-light`) y oscuro (`-dark`) sin duplicados sin sufijo, limitando la altura de `mobile-home-*` a viewport + 1 scroll (`1688px` CSS) para mantener cada PNG muy por debajo de 1.5 MB y verificando ausencia de scroll horizontal. |

---

## 7. Checklist del Inventario (BRIEF §2)

- [x] **Ruta `/` (`app/page.tsx` → `components/dashboard.tsx`)**: Protegida con sesión, carga todas las recomendaciones y renderiza el foro principal.
- [x] **Ruta `/anime/[id]` (`app/anime/[id]/page.tsx` → `components/anime-thread.tsx`)**: Protegida con sesión, muestra detalle completo del anime, lee `?notice=already_exists` y muestra aviso amable.
- [x] **Ruta `/login` (`app/login/page.tsx` → `components/login-form.tsx`)**: Tarjeta rediseñada conservando `<LoginForm />` intacto y los atributos `name="email"` y `name="password"`.
- [x] **Ruta `/registro` (`app/registro/page.tsx` → `components/register-form.tsx`)**: Tarjeta rediseñada conservando `<RegisterForm />` intacto.
- [x] **Navbar compartida (`components/site-header.tsx`)**: Logo/link a `/`, botón "Volver al foro" en `/anime/[id]`, nombre o email del usuario, badge `ADMIN`, botón admin "Sincronizar catálogo" (`/api/admin/sync-catalog`) y botón "Cerrar sesión".
- [x] **Footer compartido (`components/site-footer.tsx`)**: Presente en el foro y en el detalle de anime.
- [x] **Panel "Recomendar un anime" (`components/dashboard.tsx` + `components/anime-search.tsx`)**: Buscador con autocompletado contra `/api/catalog/search`, verificación de duplicados con `/api/recommendations/check` (y redirección a `/anime/[id]?notice=already_exists`), selección de anime, textarea de fundamento y publicación vía `POST /api/recommendations`.
- [x] **Pestañas en Home (`components/dashboard.tsx`)**: `Foro de Debate`, `Viendo Actualmente` (con contador) y `Mi Tier List`.
- [x] **Foro — Búsqueda, Orden y Filtros (`components/dashboard.tsx`)**: Búsqueda en tiempo real por título o autor, selector de orden (`votados`, `recientes`, `vistos`, `viendo`, `comentados`, `tier`) y chips de filtro por estado (`ALL`, `COMPLETED`, `WATCHING`, `PENDING`, `DROPPED`) con contadores.
- [x] **Tarjetas de Anime en el Foro (`components/dashboard.tsx`)**: Portada con enlace al hilo, título, autor, fecha, votar/quitar voto (`POST /api/recommendations/[id]/vote`), contador de comentarios, enlace "Entrar al debate", eliminar recomendación con `window.confirm` (autor sin comentarios o admin) y selectores rápidos de `tier` y `status` para admin (`PATCH /api/recommendations/[id]`).
- [x] **Pestaña "Viendo Actualmente" (`components/dashboard.tsx`)**: Cuadrícula de series en estado `WATCHING` con enlace al debate y estado vacío amable.
- [x] **Pestaña "Mi Tier List" (`components/tier-list.tsx`)**: Tablero S–E estático para usuarios y con drag & drop (`@hello-pangea/dnd`) para admin, banco de series `COMPLETED` sin clasificar y persistencia en `/api/recommendations/reorder-tier`.
- [x] **Detalle de Anime (`components/anime-thread.tsx`)**: Portada destacada, botón externo "Ver en MyAnimeList", votar, eliminar con `window.confirm`, edición rápida admin de estado/tier, bloque de fundamento del autor, bloque de "Reseña Final del Administrador", panel de edición de veredicto admin (`tier`, `status`, `adminReview`), formulario de nuevo comentario y listado de comentarios con borrado (`DELETE /api/comments/[id]`).

---

## 8. Ronda 1 de correcciones

### 8.1 Resumen de correcciones aplicadas
1. **Fuentes locales deterministas (`next/font/local`)**:
   - Se reemplazó `next/font/google` en `app/layout.tsx` por `next/font/local` apuntando a los archivos variables `app/fonts/plus-jakarta-sans/PlusJakartaSans-VariableFont_wght.woff2` (`400 800`) y `app/fonts/dm-sans/DMSans-VariableFont_wght.woff2` (`400 700`), incluyendo sus licencias oficiales `OFL.txt`.
   - Se verificó con 3 ejecuciones consecutivas de `npm run build` (3/3 PASS).
2. **Posicionamiento autónomo de `.password-toggle` y `.password-field`**:
   - En `app/globals.css`, `.password-toggle` define `position: absolute`, `right: 4px`, `top: 50%`, `transform: translateY(-50%)`, `width: 40px`, `height: 40px`, `min-width: 40px`, `min-height: 40px`, `display: inline-flex`, `align-items: center`, `justify-content: center`, `color: var(--fg-muted)`, y estados `:hover` / `:focus-visible` con anillo `--ring`. `.password-field .field` mantiene `padding-right: 3rem` (`48px`).
   - Se verificó con una página y test de Playwright sobre el DOM `<div class="password-field"><input class="field" /><button type="button" class="password-toggle">...</button></div>` sin utilidades Tailwind, eliminando la página temporal antes de commitear.
3. **Contraste WCAG AA (≥ 4.5:1 texto, ≥ 3:1 bordes UI WCAG 1.4.11)**:
   - Oscuro `primary-fg` (`#1A0B03`) sobre `primary` (`#F97316`): **6.85 : 1** (antes 3.56).
   - Oscuro `primary` (`#F97316`) sobre `primary-soft` (`#3B1D0E`): **5.48 : 1** (antes 4.31).
   - Oscuro `fg-subtle` (`#9E9488`) sobre `surface` (`#211E1C`): **5.56 : 1** (antes 4.44).
   - Claro `fg-subtle` (`#68625B`) sobre `bg` (`#FAF7F2`): **5.64 : 1** (antes 4.49).
   - Bordes de inputs `border-strong` sobre `surface`: claro `#857C73` sobre `#FFFFFF` = **4.10 : 1**; oscuro `#857B72` sobre `#211E1C` = **4.00 : 1** (ambos ≥ 3.0:1).
   - Badges de Tier List con texto `--tier-fg` (`#FFFFFF`): Tier S (`#B91C1C`) **6.47:1**, Tier A (`#C2410C`) **5.18:1**, Tier B (`#B45309`) **5.02:1**, Tier C (`#92400E`) **7.09:1**, Tier D (`#15803D`) **5.02:1**, Tier E (`#0F766E`) **5.47:1**.
4. **Tokens y eliminación de duplicación**:
   - Los colores de `TIER_CONFIGS` en `components/tier-list.tsx` ahora usan `var(--tier-s)` … `var(--tier-e)` y `var(--tier-fg)`.
   - `text-amber-300` en `components/tier-list.tsx` fue reemplazado por el token `text-warning-border` (y `text-white` en overlays de tier por `text-tier-fg`).
   - `.btn-primary` ahora usa `var(--primary)`, `var(--primary-fg)` y `var(--primary-hover)`; `.btn-danger:hover` usa `var(--danger-hover)` y `var(--danger-fg)`.
   - El bloque de tokens oscuros en `app/globals.css` se definió en un único conjunto de custom properties `--dark-*` reutilizado por `:root[data-theme="dark"]` y `@media (prefers-color-scheme: dark)`.
5. **Capturas y tarjetas móviles compactas**:
   - En `components/dashboard.tsx`, las tarjetas del foro usan en móvil un layout compacto con miniatura protagonista a la izquierda (`grid-cols-[100px_1fr]`, `h-36` / `100×144px`), manteniendo `sm:grid-cols-[148px_1fr]` y `sm:h-52` en pantallas mayores.
   - Se eliminaron las capturas duplicadas sin sufijo (`desktop-home.png`, `mobile-home.png`, `desktop-login.png`, `mobile-login.png`) y se actualizó `e2e/screenshots.spec.ts` para recortar `mobile-home-*` a viewport + 1 scroll (`1688px` CSS = `3376px` físicos a `2x`), reduciendo `mobile-home-light.png` a **349 KB** y `mobile-home-dark.png` a **354 KB** (todos los PNG < 820 KB, muy por debajo del límite de 1.5 MB).

### 8.2 Resultados Reales de Verificación (Ronda 1)

| Comando | Resultado | Detalle |
|---|---|---|
| `npm run build` (corrida 1/3) | **PASS** (exit 0) | `prisma generate && next build` completado en 2.1s (11/11 páginas estáticas/dinámicas). |
| `npm run build` (corrida 2/3) | **PASS** (exit 0) | `prisma generate && next build` completado en 1085ms (11/11 páginas). |
| `npm run build` (corrida 3/3) | **PASS** (exit 0) | `prisma generate && next build` completado en 1021ms (11/11 páginas). |
| `npm run typecheck` | **PASS** (exit 0) | `tsc --noEmit` sin errores. |
| `npm run lint` | **PASS** (exit 0) | `0 errors, 3 warnings` (warnings preexistentes en `app/api/admin/sync-catalog/route.ts` y `scripts/populate-catalog.js`). |
| `npm test` | **PASS** (exit 0) | `2 passed (2)` archivos, `4 passed (4)` tests. |
| `E2E_PORT=3102 npx playwright test e2e/screenshots.spec.ts` | **PASS** (exit 0) | `6 passed` en `desktop` y `mobile`, generando las 12 capturas en `docs/opinaanime-redesign/screenshots/after/`. |
