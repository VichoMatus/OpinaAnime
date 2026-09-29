# OpinaAnime

Aplicación privada para recomendar, debatir y ordenar animes entre amigos.

## Instalación

```bash
npm install
cp .env.example .env
# Cambia NEXTAUTH_SECRET y ADMIN_EMAIL en .env
docker compose up -d
npm run db:push
npm run dev
```

Abre `http://localhost:3000/registro`. El correo que coincida exactamente con `ADMIN_EMAIL` recibe el rol `ADMIN` al registrarse.

## Despliegue en Vercel

Configura `DATABASE_URL` apuntando a PostgreSQL administrado, `NEXTAUTH_URL` con el dominio de producción, `NEXTAUTH_SECRET` con un secreto seguro y `ADMIN_EMAIL`. Ejecuta `npm run db:push` contra la base remota antes del primer uso.
