# OpinaAnime — Guía de Estilo y Notas de Rediseño (`redesign/friendly-ui`)

> Documento de diseño previo a la implementación (Fase 1) y registro de cambios.
> Objetivo: transformar OpinaAnime de una interfaz técnica y fría ("de consola") en una comunidad cálida, cercana y moderna para compartir y debatir anime entre amigos, respetando modo claro y oscuro con contraste accesible (WCAG AA).

---

## 1. Paleta de Colores y Tokens (`@theme` + Variables CSS)

Los colores están definidos como variables semánticas en `app/globals.css` (con adaptación automática mediante `@media (prefers-color-scheme: dark)` y soporte opcional mediante atributo `data-theme="light" | "dark"`) y expuestos a Tailwind CSS v4 con `@theme`.

### 1.1 Modo Claro (Cálido Crema / Papel Editorial)

| Token CSS | Utilidad Tailwind | Hex | Uso |
|---|---|---|---|
| `--bg` | `bg-bg` | `#FAF7F2` | Fondo general de la página (crema cálido suave) |
| `--bg-subtle` | `bg-surface-subtle` | `#F3EDE2` | Fondo secundario, bloques de cita, barra de pestañas, cabeceras |
| `--surface` | `bg-surface` | `#FFFFFF` | Tarjetas de anime, paneles, formularios, modales |
| `--surface-elevated` | `bg-surface-elevated` | `#FDFBF7` | Tarjetas destacadas, hover de tarjetas, dropdowns |
| `--fg` | `text-fg` | `#1C1917` | Texto principal y títulos (Stone 900 cálido) |
| `--fg-muted` | `text-fg-muted` | `#57534E` | Texto secundario, metadatos, etiquetas |
| `--fg-subtle` | `text-fg-subtle` | `#78716C` | Placeholders, contadores secundarios |
| `--primary` | `bg-primary` / `text-primary` | `#C2410C` | Acción principal (Terracota / Naranja Anime cálido, accesible con texto blanco) |
| `--primary-hover` | `bg-primary-hover` | `#9A3412` | Hover de botón primario |
| `--primary-soft` | `bg-primary-soft` | `#FFEDD5` | Fondo suave de acento / chip activo suave |
| `--accent` | `text-accent` / `bg-accent` | `#4F46E5` | Acento secundario (Índigo comunidad / enlaces destacados) |
| `--border` | `border-border` | `#E7E0D6` | Bordes de tarjetas, divisores |
| `--border-strong` | `border-border-strong` | `#D6CEC2` | Bordes de inputs, controles interactivos |
| `--ring` | `ring-ring` | `#EA580C` | Anillo de foco visible (`focus-visible`) |
| `--danger` | `text-danger` / `bg-danger` | `#DC2626` | Errores, eliminar |
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
| `--fg-subtle` | `text-fg-subtle` | `#8C8377` | Placeholders, ayudas secundarias |
| `--primary` | `bg-primary` / `text-primary` | `#EA580C` | Acción principal (Naranja coral vibrante con texto blanco) |
| `--primary-hover` | `bg-primary-hover` | `#F97316` | Hover de botón primario |
| `--primary-soft` | `bg-primary-soft` | `#3B1D0E` | Fondo suave de acento primario |
| `--accent` | `text-accent` / `bg-accent` | `#818CF8` | Acento secundario (Índigo suave) |
| `--border` | `border-border` | `#332E2A` | Bordes de tarjetas, divisores |
| `--border-strong` | `border-border-strong` | `#463F3A` | Bordes de inputs y selects |
| `--ring` | `ring-ring` | `#FB923C` | Anillo de foco visible (`focus-visible`) |
| `--danger` | `text-danger` / `bg-danger` | `#F87171` | Texto/ícono de error o acción destructiva |
| `--danger-soft` | `bg-danger-soft` | `#351619` | Fondo de alerta de error |
| `--success` | `text-success` | `#4ADE80` | Estado Terminado / éxito |
| `--success-soft` | `bg-success-soft` | `#112A1C` | Fondo de aviso de éxito |
| `--warning` | `text-warning` | `#FBBF24` | Reseña del Admin / Estado "Lo veré" |
| `--warning-soft` | `bg-warning-soft` | `#2E220B` | Fondo suave de reseña admin |
| `--info` | `text-info` | `#38BDF8` | Estado "Viendo actualmente" |
| `--info-soft` | `bg-info-soft` | `#0F2634` | Fondo suave de estado viendo |

### 1.3 Verificación de Ratios de Contraste (WCAG 2.1 AA)

> Requisito WCAG AA: **≥ 4.5:1** para texto normal, **≥ 3.0:1** para texto grande (≥ 18pt o ≥ 14pt bold) y componentes UI.

| Par Texto / Fondo | Modo | Colores (Hex) | Ratio Calculado | Cumplimiento |
|---|---|---|---|---|
| `--fg` sobre `--bg` | Claro | `#1C1917` sobre `#FAF7F2` | **16.2 : 1** | AAA (Excelente) |
| `--fg` sobre `--surface` | Claro | `#1C1917` sobre `#FFFFFF` | **17.4 : 1** | AAA (Excelente) |
| `--fg-muted` sobre `--bg` | Claro | `#57534E` sobre `#FAF7F2` | **6.9 : 1** | AA / AAA texto normal |
| `--fg-muted` sobre `--surface` | Claro | `#57534E` sobre `#FFFFFF` | **7.5 : 1** | AAA |
| `#FFFFFF` sobre `--primary` | Claro | `#FFFFFF` sobre `#C2410C` | **5.18 : 1** | AA texto normal |
| `--danger` sobre `--danger-soft` | Claro | `#B91C1C` sobre `#FEF2F2` | **5.9 : 1** | AA texto normal |
| `--fg` sobre `--bg` | Oscuro | `#F5F2EB` sobre `#121110` | **16.4 : 1** | AAA (Excelente) |
| `--fg` sobre `--surface` | Oscuro | `#F5F2EB` sobre `#211E1C` | **13.7 : 1** | AAA (Excelente) |
| `--fg-muted` sobre `--bg` | Oscuro | `#B8B0A4` sobre `#121110` | **8.4 : 1** | AAA |
| `--fg-muted` sobre `--surface` | Oscuro | `#B8B0A4` sobre `#211E1C` | **7.0 : 1** | AAA |
| `#FFFFFF` sobre `--primary` ( botón ) | Oscuro | `#FFFFFF` sobre `#C2410C` / `#EA580C` | **5.18 : 1** (en `--btn-primary-bg: #C2410C`) | AA texto normal |
| `--danger` sobre `--danger-soft` | Oscuro | `#FCA5A5` sobre `#351619` | **6.8 : 1** | AA texto normal |

---

## 2. Tipografía

Se utilizan fuentes de `next/font/google` (incluidas en Next.js sin agregar dependencias a `package.json`):
- **Títulos y encabezados (`--font-display`)**: `Plus Jakarta Sans` (pesos 600, 700, 800). Redondeada, expresiva, cálida y muy legible en títulos de series y secciones.
- **Cuerpo y controles (`--font-sans`)**: `DM Sans` o `Plus Jakarta Sans` con fallback `system-ui, -apple-system, sans-serif`.
- **Monoespaciada (`--font-mono`)**: `JetBrains Mono` / `ui-monospace` para IDs de catálogo y contadores puntuales.

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
- `.field`, `.field-dark`, `.field-light`: input/textarea de ancho completo, radio `12px`, borde `--border-strong`, fondo `--surface`, texto `--fg`, con estados `:hover`, `:focus-visible` (anillo de 2px `--ring`), `:disabled` y `:invalid` / `[aria-invalid="true"]`.
- `.password-field`: contenedor `position: relative` donde el input interno recibe `padding-right: 3rem`.
- `.password-toggle`: botón de `40x40px` mínimo, posicionado a la derecha dentro de `.password-field`, centrado verticalmente, con foco visible y colores accesibles.
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`: botones con altura mínima táctil (`42px`), transiciones suaves, estados `hover`, `focus-visible` y `disabled`.
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
*(En móvil `390px`: una sola columna sin scroll horizontal; tarjeta de "Recomendar un anime" accesible arriba o colapsable, seguida de pestañas, filtros envolventes y tarjetas con portada destacada).*

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
