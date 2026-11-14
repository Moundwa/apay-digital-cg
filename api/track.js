// Suivi de commande pour le client, à partir de son code (ex. AP-7K3Q9X).
// Ne renvoie que des informations non sensibles : pas de téléphone, pas de contact.
const { getOrder, getReferenceByCode, normalizeCode, hit } = require("./_kv");
const { settleOrder } = require("./_payment");
const { clientIp } = require("./_http");

const MAX_LOOKUPS_PER_IP = 30; // par tranche de 10 minutes

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false });
    return;
  }

  const code = normalizeCode(req.query.code);
  if (!code) {
    res.status(400).json({ ok: false, error: "Code invalide. Il ressemble à AP-7K3Q9X." });
    return;
  }

  try {
    if ((await hit(`track:${clientIp(req)}`, 600)) > MAX_LOOKUPS_PER_IP) {
      res.status(429).json({ ok: false, error: "Trop de recherches. Réessaie dans quelques minutes." });
      return;
    }

    const reference = await getReferenceByCode(code);
    let order = reference ? await getOrder(reference) : null;
    if (!order) {
      res.status(404).json({ ok: false, error: "Aucune commande trouvée avec ce code." });
      return;
    }

    if (order.status === "pending" && Date.now() - Date.parse(order.createdAt) > 15000) {
      try { order = await settleOrder(reference, order); } catch (err) { console.error("Suivi : vérification OpenPay impossible:", err.message); }
    }

    const status = order.status === "success" ? (order.delivered ? "delivered" : "paid")
      : order.status === "failed" ? "failed" : "pending";

    res.status(200).json({
      ok: true,
      code,
      status,
      productLabel: order.productLabel,
      amount: order.amount,
      createdAt: order.createdAt,
      deliveredAt: order.deliveredAt || null,
    });
  } catch (err) {
    console.error("Erreur track:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur, réessaie dans un instant." });
  }
};
