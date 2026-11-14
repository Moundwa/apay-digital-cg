const crypto = require("crypto");
const { setOrder, linkPublicId, hit } = require("./_kv");
const { notifyTelegram, paidOrderMessage } = require("./_telegram");
const CATALOG = require("./_catalog");

const OPENPAY_API_KEY = process.env.OPENPAY_API_KEY;
const OPENPAY_URL = "https://api.openpay-cg.com/v1/transaction/payment";

const MOBILE_TAX_RATE = 0.035; // jeux mobile uniquement — même règle que checkout.js
const MAX_QTY = 10;

// Limites anti-abus (fenêtre de 10 minutes)
const RATE_WINDOW_SECONDS = 600;
const MAX_PER_IP = 8;
const MAX_PER_PHONE = 4;

function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "");
  return (fwd.split(",")[0] || req.headers["x-real-ip"] || "inconnue").trim();
}

function cleanText(value, max) {
  return String(value || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Méthode non autorisée." });
    return;
  }

  if (!OPENPAY_API_KEY) {
    console.error("OPENPAY_API_KEY manquante dans les variables d'environnement.");
    res.status(500).json({ ok: false, error: "Paiement indisponible pour le moment." });
    return;
  }

  const body = req.body || {};

  // ---- Produit et prix : uniquement depuis le catalogue serveur ----
  const product = CATALOG[String(body.productId || "")];
  if (!product) {
    res.status(400).json({ ok: false, error: "Produit introuvable. Recharge la page et réessaie." });
    return;
  }
  const qty = body.qty === undefined ? 1 : Number(body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
    res.status(400).json({ ok: false, error: "Quantité invalide." });
    return;
  }
  const subtotal = product.price * qty;
  const amount = product.mobile ? subtotal + Math.round(subtotal * MOBILE_TAX_RATE) : subtotal;
  const productLabel = product.label + (qty > 1 ? ` x${qty}` : "");

  // ---- Coordonnées du client ----
  const provider = String(body.provider || "").toUpperCase();
  if (!["MTN", "AIRTEL"].includes(provider)) {
    res.status(400).json({ ok: false, error: "Opérateur invalide." });
    return;
  }
  const cleanPhone = String(body.phone || "").replace(/\D/g, "");
  if (cleanPhone.length < 9 || cleanPhone.length > 15) {
    res.status(400).json({ ok: false, error: "Numéro de téléphone invalide." });
    return;
  }
  const contact = cleanText(body.contact, 120);
  if (!contact) {
    res.status(400).json({ ok: false, error: "Indique un contact (WhatsApp ou email)." });
    return;
  }
  const gameId = product.mobile ? cleanText(body.gameId, 64) : "";
  const server = product.mobile ? cleanText(body.server, 64) : "";
  if (product.mobile && !gameId) {
    res.status(400).json({ ok: false, error: "Ton ID en jeu est obligatoire." });
    return;
  }

  try {
    // ---- Anti-abus : évite d'inonder un numéro de demandes Mobile Money ----
    const [ipCount, phoneCount] = await Promise.all([
      hit(`ip:${clientIp(req)}`, RATE_WINDOW_SECONDS),
      hit(`phone:${cleanPhone}`, RATE_WINDOW_SECONDS),
    ]);
    if (ipCount > MAX_PER_IP || phoneCount > MAX_PER_PHONE) {
      res.status(429).json({
        ok: false,
        error: "Trop de tentatives de paiement. Patiente quelques minutes ou contacte-nous sur WhatsApp.",
      });
      return;
    }

    const orderId = `apay_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const publicId = crypto.randomBytes(16).toString("hex");

    const openpayRes = await fetch(OPENPAY_URL, {
      method: "POST",
      headers: {
        "XO-API-KEY": OPENPAY_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount,
        payment_phone_number: cleanPhone,
        provider,
        customer_external_id: orderId,
        customer: { name: contact, phone: cleanPhone },
        metadata: { order_id: orderId, product: productLabel },
      }),
    });

    const openpayData = await openpayRes.json().catch(() => ({}));

    if (!openpayRes.ok) {
      console.error("Erreur OpenPay:", openpayRes.status, openpayData);
      res.status(502).json({
        ok: false,
        error: "Le paiement n'a pas pu être lancé pour le moment. Vérifie ton numéro et réessaie, ou contacte-nous sur WhatsApp si ça persiste.",
      });
      return;
    }

    // La forme exacte de la réponse OpenPay n'est pas garantie à 100% —
    // on essaie plusieurs noms de champs plausibles pour la référence et le statut.
    const reference =
      openpayData.reference ||
      openpayData.data?.reference ||
      openpayData.transaction_reference ||
      openpayData.id;

    if (!reference) {
      console.error("Réponse OpenPay sans référence exploitable:", openpayData);
      res.status(502).json({ ok: false, error: "Réponse de paiement inattendue." });
      return;
    }

    const initialStatus = (openpayData.status || openpayData.data?.status || "pending")
      .toString()
      .toLowerCase();

    const orderRecord = {
      reference,
      orderId,
      productId: String(body.productId),
      productLabel,
      qty,
      amount,
      phone: cleanPhone,
      provider,
      contact,
      gameId,
      server,
      status: initialStatus,
      createdAt: new Date().toISOString(),
      notified: false,
    };

    if (initialStatus === "success") {
      orderRecord.notified = true;
      await notifyTelegram(paidOrderMessage(orderRecord, reference));
    }

    await setOrder(reference, orderRecord);
    await linkPublicId(publicId, reference);

    // On ne renvoie PAS la référence OpenPay : seul le serveur la connaît.
    res.status(200).json({ ok: true, reference: publicId, status: initialStatus, amount, productLabel });
  } catch (err) {
    console.error("Erreur create-payment:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur, réessaie dans un instant." });
  }
};
