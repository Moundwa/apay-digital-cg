const { getOrder, getReferenceByPublicId } = require("./_kv");

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
    const order = reference ? await getOrder(reference) : null;
    if (!order) {
      res.status(200).json({ status: "unknown" });
      return;
    }
    res.status(200).json({
      status: order.status,
      productLabel: order.productLabel,
      amount: order.amount,
    });
  } catch (err) {
    console.error("Erreur status:", err);
    res.status(200).json({ status: "unknown" });
  }
};
