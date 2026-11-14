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

// Le navigateur ne connaît qu'un identifiant public aléatoire ; la référence
// OpenPay (utilisée par le callback) ne lui est jamais transmise.
async function linkPublicId(publicId, reference) {
  await command(["SET", `pub:${publicId}`, reference, "EX", String(ORDER_TTL_SECONDS)]);
}

async function getReferenceByPublicId(publicId) {
  return command(["GET", `pub:${publicId}`]);
}

// Compteur à fenêtre fixe : renvoie le nombre d'appels dans la fenêtre en cours.
async function hit(key, windowSeconds) {
  const count = await command(["INCR", `rl:${key}`]);
  if (count === 1) await command(["EXPIRE", `rl:${key}`, String(windowSeconds)]);
  return count;
}

module.exports = { setOrder, getOrder, linkPublicId, getReferenceByPublicId, hit };
