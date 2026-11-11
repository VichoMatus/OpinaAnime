# Tooling base (rama `chore/opinaanime-base`)

## Comandos
| Comando | Qué hace |
|---|---|
| `npm run lint` | `eslint .` (flat config `eslint.config.mjs`: `next/core-web-vitals` + `next/typescript`) |
| `npm test` | `vitest run` (jsdom, alias `@/`, excluye `e2e/`). Tests en `tests/unit/` |
| `npm run test:e2e` | `playwright test` (proyectos `desktop` 1440x900 y `mobile` 390x844; levanta `npm run dev`) |
| `npm run db:seed:e2e` | `scripts/seed-e2e.mjs`: usuario `e2e@opinaanime.test` / `e2e-password-123` + 8 recomendaciones (idempotente) |

## Base de datos local
`.env` apunta a una BD **remota** (Neon). Nunca ejecutes `db:push` con él.
`.env.local` (no versionado) apunta al Postgres de `docker-compose.yml` (`localhost:5432`, db `opinanime`).
Next.js da prioridad a `.env.local`; el CLI de Prisma no lo lee, así que hay que exportarlo:

```sh
docker compose up -d
set -a; . ./.env.local; set +a; npm run db:push
npm run db:seed:e2e          # carga .env.local solo y aborta si la BD no es local
```

## E2E y capturas
- Puerto: `E2E_PORT` (por defecto 3000). Si el 3000 está ocupado por otra app, usa p. ej. `E2E_PORT=3100`
  (con `reuseExistingServer` Playwright reutilizaría lo que haya escuchando en ese puerto).
- `e2e/screenshots.spec.ts` guarda `<proyecto>-{home,detalle,login,registro}.png` en `SHOT_DIR`
  (por defecto `docs/opinaanime-redesign/screenshots/after`). El detalle es siempre "Sousou no Frieren".
- Capturas base: `E2E_PORT=3100 SHOT_DIR=docs/opinaanime-redesign/screenshots/before npm run test:e2e`.
- El spec usa `input[name="email"]`/`input[name="password"]` + Enter: mantén esos `name` en el rediseño.

## Lint: ajustes al código existente
- `components/anime-thread.tsx`: comillas de la reseña admin → `&quot;` (render idéntico).
- `components/dashboard.tsx`: `as any` del select de orden → `as typeof sortBy` (solo tipos).
- `app/api/catalog/search/route.ts` (x2) y `components/anime-search.tsx`: `eslint-disable-next-line
  @typescript-eslint/no-explicit-any` en el parseo de JSON externo sin tipar.
- `scripts/**/*.js`: `@typescript-eslint/no-require-imports` desactivada (scripts Node CommonJS).
- Quedan 12 warnings (`no-img-element`, `no-unused-vars`) sin tocar: no rompen el lint.
