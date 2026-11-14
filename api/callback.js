const crypto = require("crypto");
const { getOrder, setOrder } = require("./_kv");
const { notifyTelegram, paidOrderMessage, escapeHtml } = require("./_telegram");

// URL de callback à déclarer chez OpenPay :
//   https://www.apay-digital-cg.store/api/callback?secret=<OPENPAY_CALLBACK_SECRET>
// Sans ce secret, n'importe qui pourrait déclarer une commande "payée".
const CALLBACK_SECRET = process.env.OPENPAY_CALLBACK_SECRET;

const SUCCESS_VALUES = ["success", "paid", "completed", "successful"];
const FAILURE_VALUES = ["failed", "error", "cancelled", "canceled", "declined"];

function sameSecret(given, expected) {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  // OpenPay exige impérativement un code HTTP 200, même en cas de souci de notre côté.
  if (req.method !== "POST") {
    res.status(200).json({ ok: true });
    return;
  }

  if (!CALLBACK_SECRET) {
    console.error("OPENPAY_CALLBACK_SECRET manquante : callback ignoré par sécurité.");
    res.status(200).json({ ok: true });
    return;
  }
  if (!sameSecret(req.query?.secret, CALLBACK_SECRET)) {
    console.error("Callback refusé : secret absent ou invalide.");
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const body = req.body || {};
    const reference = body.reference || body.data?.reference;
    const rawStatus = (body.status || body.data?.status || "").toString().toLowerCase();

    if (!reference) {
      console.error("Callback OpenPay sans référence:", body);
      res.status(200).json({ ok: true });
      return;
    }

    const order = await getOrder(reference);
    if (!order) {
      console.error("Callback pour une référence inconnue:", reference);
      res.status(200).json({ ok: true });
      return;
    }

    let isSuccess = SUCCESS_VALUES.includes(rawStatus);
    const isFailure = FAILURE_VALUES.includes(rawStatus);

    // Si OpenPay indique le montant payé, il doit correspondre exactement à la commande.
    const paidAmount = body.amount ?? body.data?.amount;
    if (isSuccess && paidAmount !== undefined && Number(paidAmount) !== Number(order.amount)) {
      isSuccess = false;
      console.error("Montant payé différent de la commande:", paidAmount, order.amount, reference);
      await notifyTelegram(
        `⚠️ <b>Paiement suspect — NE PAS LIVRER</b>\nRéférence : ${escapeHtml(reference)}\n` +
          `Montant attendu : ${order.amount} FCFA\nMontant reçu : ${escapeHtml(paidAmount)} FCFA`
      );
    }

    // Une commande déjà payée ne repasse jamais à un autre statut.
    const normalizedStatus =
      order.status === "success" ? "success" : isSuccess ? "success" : isFailure ? "failed" : order.status;

    const updatedOrder = { ...order, status: normalizedStatus, callbackAt: new Date().toISOString() };

    if (normalizedStatus === "success" && !order.notified) {
      updatedOrder.notified = true;
      await notifyTelegram(paidOrderMessage(order, reference));
    }

    await setOrder(reference, updatedOrder);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erreur callback:", err);
    // On répond quand même 200 pour éviter des retentatives infinies côté OpenPay.
    res.status(200).json({ ok: true });
  }
};
