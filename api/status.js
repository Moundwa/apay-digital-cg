const { getOrder } = require("./_kv");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ status: "error" });
    return;
  }

  const reference = req.query.ref;
  if (!reference) {
    res.status(400).json({ status: "error" });
    return;
  }

  try {
    const order = await getOrder(reference);
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
