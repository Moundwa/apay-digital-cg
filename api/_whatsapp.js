// Notifications WhatsApp automatiques au client (WhatsApp Business Platform / Cloud API).
//
// Inactif tant que WHATSAPP_TOKEN et WHATSAPP_PHONE_NUMBER_ID ne sont pas définis
// dans Vercel : le site fonctionne alors exactement comme avant.
//
// Les messages partent du numéro dédié aux notifications (pas du WhatsApp habituel
// de la boutique). Ils utilisent deux modèles « Utilitaire » validés par Meta :
//   apay_paiement_recu    corps : {{1}} montant, {{2}} produit, {{3}} code de commande
//                         bouton URL : https://www.apay-digital-cg.store/suivi.html?code={{1}}
//   apay_commande_livree  corps : {{1}} code de commande, {{2}} produit
//                         bouton URL : https://www.apay-digital-cg.store/suivi.html?code={{1}}

const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const LANG = process.env.WHATSAPP_TEMPLATE_LANG || "fr";
const GRAPH_VERSION = "v25.0";

const TEMPLATES = {
  paid: process.env.WHATSAPP_TEMPLATE_PAID || "apay_paiement_recu",
  delivered: process.env.WHATSAPP_TEMPLATE_DELIVERED || "apay_commande_livree",
};

function isConfigured() {
  return Boolean(TOKEN && PHONE_NUMBER_ID);
}

// Transforme le contact saisi par le client en numéro international (chiffres seuls).
// Renvoie null si c'est un email ou un numéro inexploitable.
// Congo : 9 chiffres commençant par 0 (ex. 06 123 45 67) -> 242061234567.
function toWhatsAppNumber(contact) {
  const raw = String(contact || "").trim();
  if (!raw || raw.includes("@")) return null;
  let digits = raw.replace(/\D/g, "");
  if (raw.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 9 && digits.startsWith("0")) digits = "242" + digits;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

function formatAmount(n) {
  return Number(n).toLocaleString("fr-FR").replace(/ | /g, " ");
}

// Les paramètres de modèle WhatsApp n'acceptent ni retours à la ligne ni tabulations,
// ni plus de 4 espaces consécutifs.
function cleanParam(s) {
  return String(s).replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim().slice(0, 200);
}

async function sendTemplate(to, name, bodyParams, urlSuffix) {
  const components = [
    { type: "body", parameters: bodyParams.map((text) => ({ type: "text", text: cleanParam(text) })) },
  ];
  if (urlSuffix) {
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: urlSuffix }] });
  }
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: { name, language: { code: LANG }, components },
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data.messages?.[0]?.id || "ok";
}

// Envoie la notification « paiement reçu » ou « commande livrée ».
// Ne lève jamais d'erreur : renvoie { sent, skipped?, error? } pour l'enregistrer dans la commande.
async function notifyCustomer(kind, order) {
  if (!isConfigured()) return { sent: false, skipped: "whatsapp-non-configuré" };
  const to = toWhatsAppNumber(order.contact);
  if (!to) return { sent: false, skipped: "contact-non-whatsapp" };
  if (!order.code) return { sent: false, skipped: "sans-code" };
  try {
    const id = kind === "paid"
      ? await sendTemplate(to, TEMPLATES.paid, [formatAmount(order.amount), order.productLabel, order.code], order.code)
      : await sendTemplate(to, TEMPLATES.delivered, [order.code, order.productLabel], order.code);
    return { sent: true, id, at: new Date().toISOString() };
  } catch (err) {
    console.error(`WhatsApp (${kind}) non envoyé pour ${order.code}:`, err.message);
    return { sent: false, error: err.message, at: new Date().toISOString() };
  }
}

module.exports = { notifyCustomer, toWhatsAppNumber, isConfigured };
