// Petit client Upstash Redis (REST) — pas de dépendance npm, juste fetch natif.
// Les variables KV_REST_API_URL / KV_REST_API_TOKEN sont injectées automatiquement
// par Vercel quand la base "apay-orders" est connectée au projet.

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function command(args) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error("KV non configuré (KV_REST_API_URL / KV_REST_API_TOKEN manquants).");
  }
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (data.error) throw new Error("KV error: " + data.error);
  return data.result;
}

const ORDER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 jours

async function setOrder(reference, order) {
  await command(["SET", `order:${reference}`, JSON.stringify(order), "EX", String(ORDER_TTL_SECONDS)]);
}

async function getOrder(reference) {
  const raw = await command(["GET", `order:${reference}`]);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = { setOrder, getOrder };
