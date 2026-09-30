const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAniListPage(page) {
  const query = `
    query ($page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
        }
        media(type: ANIME, sort: [POPULARITY_DESC]) {
          id
          idMal
          title {
            romaji
            english
          }
          coverImage {
            large
            extraLarge
          }
          seasonYear
          format
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { page } }),
    });

    if (!res.ok) {
      console.warn(`[AniList] Error en página ${page}: ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const media = data?.data?.Page?.media || [];

    return media
      .filter((m) => m && (m.title?.english || m.title?.romaji) && (m.coverImage?.large || m.coverImage?.extraLarge))
      .map((m) => {
        const title = m.title?.english || m.title?.romaji;
        const titleEn = m.title?.english || null;
        const imageUrl = m.coverImage?.large || m.coverImage?.extraLarge;
        const externalId = String(m.idMal || `al-${m.id}`);

        return {
          externalId,
          title: title.trim(),
          titleEn: titleEn ? titleEn.trim() : null,
          imageUrl: imageUrl.trim(),
          type: m.format ? String(m.format).toUpperCase() : "TV",
          year: m.seasonYear || null,
        };
      });
  } catch (err) {
    console.error(`[AniList] Excepción en página ${page}:`, err.message);
    return [];
  }
}

async function fetchKitsuPage(page) {
  const limit = 20;
  const offset = page * limit;
  const url = `https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=${limit}&page[offset]=${offset}`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    });

    if (!res.ok) return [];

    const json = await res.json();
    const data = json.data || [];

    return data.map((item) => {
      const attrs = item.attributes || {};
      const title = attrs.canonicalTitle || attrs.titles?.en_jp || attrs.titles?.en || "Sin título";
      const titleEn = attrs.titles?.en || attrs.titles?.en_us || null;
      const imageUrl = attrs.posterImage?.large || attrs.posterImage?.original || attrs.posterImage?.medium || "";
      const year = attrs.startDate ? new Date(attrs.startDate).getFullYear() : null;
      const type = attrs.subtype || attrs.showType || "TV";

      return {
        externalId: String(item.id),
        title: title.trim(),
        titleEn: titleEn ? titleEn.trim() : null,
        imageUrl: imageUrl.trim(),
        type: type ? String(type).toUpperCase() : "TV",
        year: year && !isNaN(year) ? year : null,
      };
    }).filter((a) => a.title && a.imageUrl);
  } catch (err) {
    return [];
  }
}

async function main() {
  console.log("🚀 Iniciando carga masiva de catálogo en PostgreSQL...");

  const allAnime = new Map();

  // 1. Cargar 40 páginas de AniList (50 animes por página = 2.000 animes)
  console.log("📥 Descargando Top 2.000 animes desde AniList...");
  for (let p = 1; p <= 40; p++) {
    const items = await fetchAniListPage(p);
    for (const item of items) {
      if (!allAnime.has(item.externalId)) {
        allAnime.set(item.externalId, item);
      }
    }
    process.stdout.write(` AniList Pág ${p}/40 (Total acumulado: ${allAnime.size})\r`);
    await sleep(220); // Respetar rate-limit de AniList
  }
  console.log(`\n✅ AniList procesado. Total recopilado: ${allAnime.size} animes.`);

  // 2. Complementar con 25 páginas de Kitsu (500 animes)
  console.log("📥 Complementando con Kitsu API...");
  for (let k = 0; k < 25; k++) {
    const items = await fetchKitsuPage(k);
    for (const item of items) {
      if (!allAnime.has(item.externalId)) {
        allAnime.set(item.externalId, item);
      }
    }
    process.stdout.write(` Kitsu Pág ${k + 1}/25 (Total acumulado: ${allAnime.size})\r`);
    await sleep(150);
  }
  console.log(`\n✅ Kitsu procesado. Total consolidado para insertar: ${allAnime.size} animes.`);

  // 3. Inserción masiva en Neon PostgreSQL en lotes de 100
  const animeArray = Array.from(allAnime.values());
  const batchSize = 100;
  let totalInserted = 0;

  console.log("💾 Guardando en Neon PostgreSQL...");
  for (let i = 0; i < animeArray.length; i += batchSize) {
    const batch = animeArray.slice(i, i + batchSize);
    try {
      const result = await prisma.animeCatalog.createMany({
        data: batch,
        skipDuplicates: true,
      });
      totalInserted += result.count;
      process.stdout.write(` Insertando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(animeArray.length / batchSize)}...\r`);
    } catch (e) {
      console.error("\nError en lote:", e.message);
    }
  }

  const finalTotal = await prisma.animeCatalog.count();
  console.log(`\n🎉 ¡Carga masiva completada exitosamente!`);
  console.log(`📊 Total de animes en la base de datos ahora: ${finalTotal}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
