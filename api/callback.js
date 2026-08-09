const { getOrder, setOrder } = require("./_kv");
const { notifyTelegram } = require("./_telegram");

const SUCCESS_VALUES = ["success", "paid", "completed", "successful"];
const FAILURE_VALUES = ["failed", "error", "cancelled", "canceled", "declined"];

function escapeHtml(str) {
  return String(str).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

module.exports = async (req, res) => {
  // OpenPay exige impérativement un code HTTP 200, même en cas de souci de notre côté.
  if (req.method !== "POST") {
    res.status(200).json({ ok: true });
    return;
  }

  try {
    const body = req.body || {};
    const reference = body.reference || body.data?.reference;
    const externalId = body.external_id || body.externalId || body.external_customer_id;
    const rawStatus = (body.status || body.data?.status || "").toString().toLowerCase();

    if (!reference && !externalId) {
      console.error("Callback OpenPay sans référence ni identifiant externe:", body);
      res.status(200).json({ ok: true });
      return;
    }

    let order = reference ? await getOrder(reference) : null;
    if (!order && externalId) order = await getOrder(`ext:${externalId}`);
    const lookupKey = reference || `ext:${externalId}`;

    if (!order) {
      console.error("Callback pour une référence inconnue:", reference, externalId);
      res.status(200).json({ ok: true });
      return;
    }

    const isSuccess = SUCCESS_VALUES.includes(rawStatus);
    const isFailure = FAILURE_VALUES.includes(rawStatus);
    const normalizedStatus = isSuccess ? "success" : isFailure ? "failed" : rawStatus || order.status;

    const updatedOrder = { ...order, status: normalizedStatus, callbackAt: new Date().toISOString() };

    if (isSuccess && !order.notified) {
      updatedOrder.notified = true;
      const lines = [
        "💰 <b>Nouvelle commande payée</b>",
        `Produit : ${escapeHtml(order.productLabel)}`,
        `Montant : ${order.amount.toLocaleString("fr-FR")} FCFA`,
        `Opérateur : ${escapeHtml(order.provider)}`,
        `Tél. paiement : ${escapeHtml(order.phone)}`,
        `Contact livraison : ${escapeHtml(order.contact)}`,
      ];
      if (order.gameId) lines.push(`ID en jeu : ${escapeHtml(order.gameId)}`);
      if (order.server) lines.push(`Serveur/Zone : ${escapeHtml(order.server)}`);
      lines.push(`Référence : ${escapeHtml(order.reference)}`);
      await notifyTelegram(lines.join("\n"));
    }

    await setOrder(order.reference, updatedOrder);
    if (order.externalId) await setOrder(`ext:${order.externalId}`, updatedOrder);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erreur callback:", err);
    // On répond quand même 200 pour éviter des retentatives infinies côté OpenPay.
    res.status(200).json({ ok: true });
  }
};
