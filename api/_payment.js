// Vérification d'un paiement directement auprès d'OpenPay.
// Le callback n'est pas signé par OpenPay : on ne le croit jamais sur parole,
// on redemande toujours le statut à l'API (GET /v1/transaction/status/:reference).
const { setOrder } = require("./_kv");
const { notifyTelegram, paidOrderMessage, escapeHtml } = require("./_telegram");
const { notifyCustomer } = require("./_whatsapp");

const OPENPAY_API_KEY = process.env.OPENPAY_API_KEY;
const STATUS_URL = "https://api.openpay-cg.com/v1/transaction/status/";

const SUCCESS_VALUES = ["success", "paid", "completed", "successful"];
const FAILURE_VALUES = ["failed", "error", "cancelled", "canceled", "declined"];

async function fetchOpenPayStatus(reference) {
  const res = await fetch(STATUS_URL + encodeURIComponent(reference), {
    method: "GET",
    headers: { "XO-API-KEY": OPENPAY_API_KEY, Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Statut OpenPay indisponible (HTTP " + res.status + ")");
  const data = await res.json();
  return {
    status: String(data.status || data.data?.status || "").toLowerCase(),
    amount: data.amount ?? data.data?.amount,
  };
}

// Met à jour la commande selon le statut RÉEL chez OpenPay et prévient sur Telegram
// une seule fois quand elle est payée. Renvoie la commande à jour.
async function settleOrder(reference, order) {
  if (order.status === "success") return order; // déjà payée : définitif

  const real = await fetchOpenPayStatus(reference);
  let status = order.status;

  if (SUCCESS_VALUES.includes(real.status)) {
    if (real.amount !== undefined && Number(real.amount) !== Number(order.amount)) {
      status = "suspect";
      if (!order.suspectNotified) {
        order.suspectNotified = true;
        await notifyTelegram(
          `⚠️ <b>Paiement suspect — NE PAS LIVRER</b>\nRéférence : ${escapeHtml(reference)}\n` +
            `Montant attendu : ${order.amount} FCFA\nMontant payé : ${escapeHtml(real.amount)} FCFA`
        );
      }
    } else {
      status = "success";
    }
  } else if (FAILURE_VALUES.includes(real.status)) {
    status = "failed";
  }

  const updated = { ...order, status, checkedAt: new Date().toISOString() };
  if (status === "success" && !order.notified) {
    updated.notified = true;
    await notifyTelegram(paidOrderMessage(updated, reference));
    updated.waPaid = await notifyCustomer("paid", updated); // message WhatsApp au client
  }
  if (status !== order.status || updated.notified !== order.notified || updated.suspectNotified !== order.suspectNotified) {
    await setOrder(reference, updated);
  }
  return updated;
}

module.exports = { settleOrder, fetchOpenPayStatus };
