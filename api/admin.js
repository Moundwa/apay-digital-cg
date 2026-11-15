// API du tableau de bord des commandes (page /admin.html).
// Protégée par le code ADMIN_TOKEN (variable d'environnement Vercel),
// envoyé dans l'en-tête "X-Admin-Token".
//
//   GET  /api/admin                       -> 200 dernières commandes
//   POST /api/admin {reference, action}   -> action : "delivered" | "undelivered" | "recheck"
const { getOrder, setOrder, listOrders, hit } = require("./_kv");
const { settleOrder } = require("./_payment");
const { clientIp, sameSecret } = require("./_http");
const { notifyCustomer } = require("./_whatsapp");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const MAX_FAILED_LOGINS = 10; // par IP et par tranche de 15 minutes

function publicView(o) {
  return {
    reference: o.reference,
    code: o.code || null,
    productLabel: o.productLabel,
    qty: o.qty || 1,
    amount: o.amount,
    provider: o.provider,
    phone: o.phone,
    contact: o.contact,
    gameId: o.gameId || "",
    server: o.server || "",
    status: o.status,
    delivered: !!o.delivered,
    deliveredAt: o.deliveredAt || null,
    createdAt: o.createdAt,
    waPaid: o.waPaid || null,
    waDelivered: o.waDelivered || null,
  };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!ADMIN_TOKEN) {
    res.status(503).json({ ok: false, error: "ADMIN_TOKEN n'est pas configuré dans Vercel." });
    return;
  }

  const ip = clientIp(req);
  try {
    if (!sameSecret(req.headers["x-admin-token"], ADMIN_TOKEN)) {
      const fails = await hit(`adminfail:${ip}`, 900);
      res.status(fails > MAX_FAILED_LOGINS ? 429 : 401).json({
        ok: false,
        error: fails > MAX_FAILED_LOGINS ? "Trop d'essais. Réessaie dans 15 minutes." : "Code administrateur incorrect.",
      });
      return;
    }

    if (req.method === "GET") {
      const orders = await listOrders(200);
      res.status(200).json({ ok: true, orders: orders.map(publicView) });
      return;
    }

    if (req.method === "POST") {
      const { reference, action } = req.body || {};
      const order = reference ? await getOrder(String(reference)) : null;
      if (!order) {
        res.status(404).json({ ok: false, error: "Commande introuvable." });
        return;
      }

      let updated = order;
      if (action === "delivered") {
        if (order.status !== "success") {
          res.status(409).json({ ok: false, error: "Cette commande n'est pas payée : impossible de la marquer livrée." });
          return;
        }
        updated = { ...order, delivered: true, deliveredAt: new Date().toISOString() };
        // Message WhatsApp « commande livrée » : une seule fois, même si on annule puis re-marque.
        if (!order.waDelivered || !order.waDelivered.sent) updated.waDelivered = await notifyCustomer("delivered", updated);
        await setOrder(order.reference, updated);
      } else if (action === "undelivered") {
        updated = { ...order, delivered: false, deliveredAt: null };
        await setOrder(order.reference, updated);
      } else if (action === "recheck") {
        updated = await settleOrder(order.reference, order);
      } else {
        res.status(400).json({ ok: false, error: "Action inconnue." });
        return;
      }
      res.status(200).json({ ok: true, order: publicView(updated) });
      return;
    }

    res.status(405).json({ ok: false, error: "Méthode non autorisée." });
  } catch (err) {
    console.error("Erreur admin:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur." });
  }
};
