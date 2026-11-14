const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Le message est envoyé en mode HTML : tout texte venant d'un client doit passer par ici.
function escapeHtml(str) {
  return String(str).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

async function notifyTelegram(text) {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("Telegram non configuré (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID manquants).");
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (err) {
    console.error("Erreur envoi Telegram:", err);
  }
}

function paidOrderMessage(order, reference) {
  const lines = [
    "💰 <b>Nouvelle commande payée</b>" + (order.code ? ` — <code>${escapeHtml(order.code)}</code>` : ""),
    `Produit : ${escapeHtml(order.productLabel)}`,
    `Montant : ${Number(order.amount).toLocaleString("fr-FR")} FCFA`,
    `Opérateur : ${escapeHtml(order.provider)}`,
    `Tél. paiement : ${escapeHtml(order.phone)}`,
    `Contact livraison : ${escapeHtml(order.contact)}`,
  ];
  if (order.gameId) lines.push(`ID en jeu : ${escapeHtml(order.gameId)}`);
  if (order.server) lines.push(`Serveur/Zone : ${escapeHtml(order.server)}`);
  lines.push(`Référence : ${escapeHtml(reference)}`);
  return lines.join("\n");
}

module.exports = { notifyTelegram, escapeHtml, paidOrderMessage };
