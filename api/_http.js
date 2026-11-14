const crypto = require("crypto");

// IP du visiteur telle que vue par Vercel (premier élément de X-Forwarded-For).
function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "");
  return (fwd.split(",")[0] || req.headers["x-real-ip"] || "inconnue").trim();
}

// Comparaison à temps constant (évite de deviner un secret caractère par caractère).
function sameSecret(given, expected) {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(String(expected || ""));
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { clientIp, sameSecret };
