const { setOrder } = require("./_kv");

const OPENPAY_API_KEY = process.env.OPENPAY_API_KEY;
const OPENPAY_URL = "https://api.openpay-cg.com/v1/transaction/payment";

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

  const { productLabel, amount, phone, provider, contact, gameId, server } = req.body || {};

  // Validation basique côté serveur (ne jamais faire confiance au client)
  if (!productLabel || !amount || !phone || !provider || !contact) {
    res.status(400).json({ ok: false, error: "Champs manquants." });
    return;
  }
  if (!["MTN", "AIRTEL"].includes(String(provider).toUpperCase())) {
    res.status(400).json({ ok: false, error: "Opérateur invalide." });
    return;
  }
  const cleanPhone = String(phone).replace(/\D/g, "");
  if (cleanPhone.length < 9) {
    res.status(400).json({ ok: false, error: "Numéro de téléphone invalide." });
    return;
  }
  const numericAmount = parseInt(amount, 10);
  if (!numericAmount || numericAmount <= 0) {
    res.status(400).json({ ok: false, error: "Montant invalide." });
    return;
  }

  try {
    const openpayRes = await fetch(OPENPAY_URL, {
      method: "POST",
      headers: {
        "XO-API-KEY": OPENPAY_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: String(numericAmount),
        payment_phone_number: cleanPhone,
        provider: String(provider).toUpperCase(),
      }),
    });

    const openpayData = await openpayRes.json().catch(() => ({}));

    if (!openpayRes.ok) {
      console.error("Erreur OpenPay:", openpayRes.status, openpayData);
      res.status(502).json({ ok: false, error: openpayData.message || "Le paiement n'a pas pu être lancé." });
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

    await setOrder(reference, {
      reference,
      productLabel,
      amount: numericAmount,
      phone: cleanPhone,
      provider: String(provider).toUpperCase(),
      contact,
      gameId: gameId || "",
      server: server || "",
      status: initialStatus,
      createdAt: new Date().toISOString(),
      notified: false,
    });

    res.status(200).json({ ok: true, reference, status: initialStatus });
  } catch (err) {
    console.error("Erreur create-payment:", err);
    res.status(500).json({ ok: false, error: "Erreur serveur, réessaie dans un instant." });
  }
};
