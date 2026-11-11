# Notas de autenticación

## Cambios por archivo

- `components/password-input.tsx`: campo reutilizable con botón SVG para mostrar/ocultar la contraseña, etiquetas ARIA y foco visible.
- `components/icons.tsx`: añade el ícono de ojo y ojo tachado.
- `components/login-form.tsx`: etiquetas visibles, clases semánticas, campo reutilizable y aviso `registered=1` con `role="status"`.
- `components/register-form.tsx`: etiquetas visibles, conserva nombre y correo, limpia la contraseña cuando falla el registro y crea sesión usando `signIn("credentials", ...)` cuando el registro tiene éxito.
- `auth.ts` y `lib/safe-redirect.ts`: el callback usa una función pura que acepta rutas internas seguras y URLs del mismo origen; el resto vuelve a `baseUrl`.
- `app/api/register/route.ts`: JSON inválido devuelve 400 y la colisión Prisma `P2002` devuelve 409 con el mensaje existente.
- `tests/unit/password-input.test.tsx`, `tests/unit/auth-forms.test.tsx` y `tests/unit/safe-redirect.test.ts`: cubren interacción accesible, login/registro y redirecciones.
- `e2e/auth.spec.ts`: cubre alta, sesión, logout/login, mostrar contraseña y email duplicado en los proyectos desktop y mobile.

## Seguridad y verificación de correo

La contraseña del registro se obtiene del formulario en variables locales del handler. No se guarda en estado React ni en almacenamiento, URL o logs. La API solo persiste el hash bcrypt, igual que antes. El redireccionamiento rechaza `//...`, `/\\...` y orígenes externos, incluyendo hosts `*.vercel.app`.

El brief confirma que el proyecto no tiene verificación de email: no hay modelo, token ni envío de correo. Por eso el login automático no omite una verificación existente.

## Verificación ejecutada

- `npm ci`: completado; no se añadieron dependencias.
- `npm run build`: PASS; build de Next.js completado. Se mostraron los 12 warnings existentes de ESLint durante el build.
- `npm run typecheck`: PASS; `tsc --noEmit` sin errores.
- `npm run lint`: PASS; 0 errores y 12 warnings preexistentes.
- `npm test`: PASS; 4 archivos y 13 tests.
- `E2E_PORT=3101 npx playwright test e2e/auth.spec.ts`: PASS; 4 tests en total (desktop y mobile), sin regenerar capturas.
