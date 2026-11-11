# Notas de autenticación

## Ronda 1 de correcciones

- `lib/safe-redirect.ts`: bloquea caracteres de control y espacios, y valida el origen de la URL ya resuelta antes de conservar una ruta interna o URL del mismo origen.
- `components/register-form.tsx`: después de una respuesta exitosa del registro, cualquier error o excepción de `signIn` lleva a `/login?registered=1`. Los errores de formulario identifican email y contraseña; nombre, email y contraseña respetan los máximos de 60 caracteres, 254 caracteres y 72 bytes.
- `components/password-input.tsx`: el CSS controla la posición del botón y su estado se comunica con un solo `aria-label`; pasa atributos de accesibilidad al input.
- `components/login-form.tsx`: errores enlazados a email y contraseña mediante `aria-invalid` y `aria-describedby`.
- `app/api/register/route.ts`: valida formato y longitud del email, bytes de contraseña compatibles con bcrypt y longitud del nombre, devolviendo mensajes en español con status 400.
- Tests unitarios amplían cobertura de redirecciones, registro tras excepción de `signIn`, accesibilidad y validación de la API con Prisma mockeado.
- `e2e/auth.spec.ts`: busca el control de logout por el nombre accesible `/cerrar sesión/i`, sin selector visual o dependiente de clases.

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

- `npm run build`: PASS; build de Next.js completado con warnings ESLint existentes.
- `npm run typecheck`: PASS; `tsc --noEmit` sin errores.
- `npm run lint`: PASS; 0 errores y 12 warnings.
- `npm test`: PASS; 5 archivos y 31 tests.
- `E2E_PORT=3101 npx playwright test e2e/auth.spec.ts`: 4 fallidos en desktop/mobile; los cuatro se detienen al buscar `/cerrar sesión/i` porque el header actual sigue exponiendo el nombre accesible “Salir”. No se cambió el header según la instrucción de integración.
