// Datos de prueba para E2E y capturas. Idempotente: se puede ejecutar varias veces.
// Uso: npm run db:seed:e2e   (lee .env.local si existe; solo acepta bases de datos locales)
import { existsSync } from "node:fs";
import bcrypt from "bcrypt";

// Las variables ya exportadas en el entorno tienen prioridad; .env.local completa lo que falte.
// Importante: @prisma/client carga .env (remoto) al importarse, por eso se importa dinámicamente
// DESPUÉS de cargar .env.local y validar que la BD sea local.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
for (const key of ["POSTGRES_PRISMA_URL", "POSTGRES_URL_NON_POOLING"]) {
  const value = process.env[key];
  if (!value) {
    console.error(`[seed-e2e] Falta ${key}. Crea .env.local apuntando al Postgres de docker-compose.`);
    process.exit(1);
  }
  const { hostname, port } = new URL(value);
  if (!LOCAL_HOSTS.has(hostname)) {
    console.error(`[seed-e2e] ${key} apunta a ${hostname}:${port}; el seed solo corre contra una BD local. Abortado.`);
    process.exit(1);
  }
}

const E2E_USER = { email: "e2e@opinaanime.test", password: "e2e-password-123", name: "Tester E2E" };
const FRIEND_USER = { email: "e2e-friend@opinaanime.test", password: "e2e-password-123", name: "Mika" };

const RECOMMENDATIONS = [
  {
    mal_id: 52991,
    title: "Sousou no Frieren",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1015/138006.jpg",
    rationale: "Una fantasía tranquila sobre el paso del tiempo y lo que dejamos en los demás. Cada episodio se siente como un cuento.",
    adminReview: "Dirección impecable y una banda sonora que acompaña sin robar protagonismo. Obra maestra moderna.",
    status: "COMPLETED",
    tier: "S",
    tierOrder: 0,
  },
  {
    mal_id: 5114,
    title: "Fullmetal Alchemist: Brotherhood",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1208/94745.jpg",
    rationale: "La historia de los hermanos Elric tiene acción, política, filosofía y un final redondo. Imprescindible.",
    adminReview: "Ritmo perfecto de principio a fin. Referente del shōnen.",
    status: "COMPLETED",
    tier: "S",
    tierOrder: 1,
  },
  {
    mal_id: 9253,
    title: "Steins;Gate",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1935/127974.jpg",
    rationale: "Empieza lento, pero cuando arranca el viaje en el tiempo no puedes parar. Okabe es inolvidable.",
    adminReview: null,
    status: "COMPLETED",
    tier: "A",
    tierOrder: 0,
  },
  {
    mal_id: 1,
    title: "Cowboy Bebop",
    imageUrl: "https://cdn.myanimelist.net/images/anime/4/19644.jpg",
    rationale: "Jazz, cazarrecompensas y melancolía espacial. Un clásico que no envejece.",
    adminReview: null,
    status: "COMPLETED",
    tier: null,
    tierOrder: 0,
  },
  {
    mal_id: 40748,
    title: "Jujutsu Kaisen",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1171/109222.jpg",
    rationale: "Peleas animadas por MAPPA a otro nivel y un sistema de poderes muy ingenioso.",
    adminReview: null,
    status: "WATCHING",
    tier: null,
    tierOrder: 0,
  },
  {
    mal_id: 50265,
    title: "Spy x Family",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1441/122795.jpg",
    rationale: "Comedia familiar con espías y una niña telépata. Ideal para ver en grupo.",
    adminReview: null,
    status: "WATCHING",
    tier: null,
    tierOrder: 0,
  },
  {
    mal_id: 16498,
    title: "Shingeki no Kyojin",
    imageUrl: "https://cdn.myanimelist.net/images/anime/10/47347.jpg",
    rationale: "Misterio, giros brutales y una de las mejores primeras temporadas que he visto.",
    adminReview: null,
    status: "PENDING",
    tier: null,
    tierOrder: 0,
  },
  {
    mal_id: 38000,
    title: "Kimetsu no Yaiba",
    imageUrl: "https://cdn.myanimelist.net/images/anime/1286/99889.jpg",
    rationale: "La animación de ufotable en el episodio 19 justifica toda la serie.",
    adminReview: "Visualmente espectacular, aunque la historia es bastante lineal.",
    status: "DROPPED",
    tier: "C",
    tierOrder: 0,
  },
];

// [mal_id, autor, texto]
const COMMENTS = [
  [52991, "friend", "La escena de las flores en el capítulo 1 me hizo llorar. Totalmente de acuerdo con el tier S."],
  [52991, "e2e", "Fern y Stark merecen su propio spin-off."],
  [52991, "friend", "La OST de Evan Call es preciosa."],
  [5114, "friend", "Mejor que la versión de 2003, aunque ambas valen la pena."],
  [9253, "e2e", "El capítulo 12 cambia todo. El Psy Kongroo."],
  [40748, "friend", "¿Alguien más esperando la siguiente temporada?"],
  [38000, "friend", "Lo dejé en el arco del tren, ¿vale la pena retomarlo?"],
];

// Votos: qué usuarios votan cada recomendación
const VOTES = {
  52991: ["e2e", "friend"],
  5114: ["e2e", "friend"],
  9253: ["friend"],
  1: ["e2e"],
  40748: ["friend"],
};

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

async function upsertUser({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { passwordHash, name, role: "USER" },
    create: { email, passwordHash, name, role: "USER" },
  });
}

async function main() {
  const users = { e2e: await upsertUser(E2E_USER), friend: await upsertUser(FRIEND_USER) };

  const recs = {};
  for (const [index, rec] of RECOMMENDATIONS.entries()) {
    const author = index % 3 === 2 ? users.friend : users.e2e;
    const data = { ...rec, authorId: author.id, createdAt: new Date(Date.UTC(2026, 9, 1 + index, 18)) };
    recs[rec.mal_id] = await prisma.recommendation.upsert({
      where: { mal_id: rec.mal_id },
      update: data,
      create: data,
    });
  }

  const recIds = Object.values(recs).map((r) => r.id);
  const userIds = Object.values(users).map((u) => u.id);
  await prisma.comment.deleteMany({ where: { recommendationId: { in: recIds }, authorId: { in: userIds } } });
  for (const [index, [malId, who, body]] of COMMENTS.entries()) {
    await prisma.comment.create({
      data: {
        body,
        authorId: users[who].id,
        recommendationId: recs[malId].id,
        createdAt: new Date(Date.UTC(2026, 9, 10, 12, index * 7)),
      },
    });
  }

  await prisma.vote.deleteMany({ where: { recommendationId: { in: recIds }, userId: { in: userIds } } });
  for (const [malId, voters] of Object.entries(VOTES)) {
    for (const who of voters) {
      await prisma.vote.create({ data: { userId: users[who].id, recommendationId: recs[malId].id } });
    }
  }

  console.log(
    `[seed-e2e] OK: ${Object.keys(users).length} usuarios, ${recIds.length} recomendaciones, ${COMMENTS.length} comentarios.`,
  );
  console.log(`[seed-e2e] Usuario de prueba: ${E2E_USER.email}`);
  console.log(`[seed-e2e] Detalle de ejemplo: /anime/${recs[52991].id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
