const crypto = require("crypto");
const { getOrder } = require("./_kv");
const { settleOrder } = require("./_payment");

// URL de callback à déclarer dans le tableau de bord OpenPay :
//   https://www.apay-digital-cg.store/api/callback?secret=<OPENPAY_CALLBACK_SECRET>
// OpenPay ne signe pas ses callbacks : on vérifie ce secret, puis on redemande
// TOUJOURS le vrai statut à l'API OpenPay avant de valider une commande.
const CALLBACK_SECRET = process.env.OPENPAY_CALLBACK_SECRET;

function sameSecret(given, expected) {
  const a = Buffer.from(String(given || ""));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = async (req, res) => {
  // OpenPay exige un HTTP 200, sinon il relance (4 tentatives).
  if (req.method !== "POST") {
    res.status(200).json({ success: true });
    return;
  }

  if (!CALLBACK_SECRET || !sameSecret(req.query?.secret, CALLBACK_SECRET)) {
    console.error(CALLBACK_SECRET ? "Callback refusé : secret absent ou invalide." : "OPENPAY_CALLBACK_SECRET manquante : callback ignoré.");
    res.status(200).json({ success: true });
    return;
  }

  try {
    const body = req.body || {};
    // Les retraits programmés arrivent sur la même URL : on ne traite que les paiements.
    if (body.type && body.type !== "payment") {
      res.status(200).json({ success: true });
      return;
    }

    const reference = body.reference || body.data?.reference;
    if (!reference) {
      console.error("Callback OpenPay sans référence:", body);
      res.status(200).json({ success: true });
      return;
    }

    const order = await getOrder(reference);
    if (!order) {
      console.error("Callback pour une référence inconnue:", reference);
      res.status(200).json({ success: true });
      return;
    }

    // Le contenu du callback sert seulement de signal : le statut vient de l'API OpenPay.
    await settleOrder(reference, order);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erreur callback:", err);
    // Un code non-200 fait relancer OpenPay : utile si l'API de statut était momentanément indisponible.
    res.status(500).json({ success: false });
  }
};
