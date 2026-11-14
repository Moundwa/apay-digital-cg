// Petit client Upstash Redis (REST) — pas de dépendance npm, juste fetch natif.
// Les variables sont injectées automatiquement par Vercel quand la base est
// connectée au projet. Base actuelle : "apay-orders-2" (préfixe APAY_KV, créée
// le 14/11/2026). Les anciennes variables KV_* pointent vers "apay-orders",
// supprimée : elles ne servent plus que de repli.
const crypto = require("crypto");

const KV_URL = process.env.APAY_KV_KV_REST_API_URL || process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.APAY_KV_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN;

async function command(args) {
  if (!KV_URL || !KV_TOKEN) {
    throw new Error("KV non configuré (APAY_KV_KV_REST_API_URL / APAY_KV_KV_REST_API_TOKEN manquants).");
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

// Commandes non payées : effacées après 30 jours. Commandes payées : conservées.
const UNPAID_TTL_SECONDS = 60 * 60 * 24 * 30;
const INDEX_KEY = "orders:index"; // ensemble trié : score = date de création (ms)

async function setOrder(reference, order) {
  const key = `order:${reference}`;
  const value = JSON.stringify(order);
  if (order.status === "success") {
    await command(["SET", key, value]); // sans expiration
  } else {
    await command(["SET", key, value, "EX", String(UNPAID_TTL_SECONDS)]);
  }
  const score = Date.parse(order.createdAt) || Date.now();
  await command(["ZADD", INDEX_KEY, String(score), reference]);
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

// Dernières commandes, de la plus récente à la plus ancienne.
async function listOrders(limit) {
  const refs = (await command(["ZREVRANGE", INDEX_KEY, "0", String(limit - 1)])) || [];
  if (!refs.length) return [];
  const raws = await command(["MGET", ...refs.map((r) => `order:${r}`)]);
  const orders = [];
  const expired = [];
  refs.forEach((ref, i) => {
    if (!raws[i]) { expired.push(ref); return; }
    try { orders.push(JSON.parse(raws[i])); } catch { /* ignorée */ }
  });
  if (expired.length) await command(["ZREM", INDEX_KEY, ...expired]); // ménage
  return orders;
}

// Le navigateur ne connaît qu'un identifiant public aléatoire ; la référence
// OpenPay (utilisée par le callback) ne lui est jamais transmise.
async function linkPublicId(publicId, reference) {
  await command(["SET", `pub:${publicId}`, reference, "EX", String(UNPAID_TTL_SECONDS)]);
}

async function getReferenceByPublicId(publicId) {
  return command(["GET", `pub:${publicId}`]);
}

// ---- Code de commande lisible par le client (ex. AP-7K3Q9X) ----
// Sans 0/O, 1/I/L pour éviter les confusions quand on le recopie.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_TTL_SECONDS = 60 * 60 * 24 * 365;

function randomCode() {
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return "AP-" + s;
}

// Réserve un code unique (SET NX), avant même de connaître la référence OpenPay.
async function reserveOrderCode() {
  for (let i = 0; i < 5; i++) {
    const code = randomCode();
    const ok = await command(["SET", `code:${code}`, "pending", "NX", "EX", String(CODE_TTL_SECONDS)]);
    if (ok === "OK") return code;
  }
  throw new Error("Impossible de générer un code de commande unique.");
}

async function linkOrderCode(code, reference) {
  await command(["SET", `code:${code}`, reference, "EX", String(CODE_TTL_SECONDS)]);
}

async function getReferenceByCode(code) {
  const ref = await command(["GET", `code:${code}`]);
  return ref && ref !== "pending" ? ref : null;
}

function normalizeCode(input) {
  const s = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const body = s.startsWith("AP") ? s.slice(2) : s;
  if (body.length !== 6 || [...body].some((c) => !CODE_ALPHABET.includes(c))) return null;
  return "AP-" + body;
}

// Compteur à fenêtre fixe : renvoie le nombre d'appels dans la fenêtre en cours.
async function hit(key, windowSeconds) {
  const count = await command(["INCR", `rl:${key}`]);
  if (count === 1) await command(["EXPIRE", `rl:${key}`, String(windowSeconds)]);
  return count;
}

module.exports = {
  setOrder,
  getOrder,
  listOrders,
  linkPublicId,
  getReferenceByPublicId,
  reserveOrderCode,
  linkOrderCode,
  getReferenceByCode,
  normalizeCode,
  hit,
};
