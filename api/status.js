const { getOrder, getReferenceByPublicId } = require("./_kv");
const { settleOrder } = require("./_payment");

// Au-delà de ce délai sans callback, on interroge OpenPay directement
// (filet de sécurité si le callback n'arrive jamais).
const DIRECT_CHECK_AFTER_MS = 15000;

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ status: "error" });
    return;
  }

  // "ref" est l'identifiant public renvoyé par /api/create-payment (pas la référence OpenPay).
  const publicId = String(req.query.ref || "");
  if (!/^[a-f0-9]{32}$/.test(publicId)) {
    res.status(400).json({ status: "error" });
    return;
  }

  try {
    const reference = await getReferenceByPublicId(publicId);
    let order = reference ? await getOrder(reference) : null;
    if (!order) {
      res.status(200).json({ status: "unknown" });
      return;
    }

    const age = Date.now() - new Date(order.createdAt).getTime();
    if (order.status === "pending" && age > DIRECT_CHECK_AFTER_MS) {
      try {
        order = await settleOrder(reference, order);
      } catch (err) {
        console.error("Vérification directe OpenPay impossible:", err.message);
      }
    }

    res.status(200).json({
      status: order.status === "suspect" ? "pending" : order.status,
      code: order.code || null,
      delivered: !!order.delivered,
      productLabel: order.productLabel,
      amount: order.amount,
    });
  } catch (err) {
    console.error("Erreur status:", err);
    res.status(200).json({ status: "unknown" });
  }
};
