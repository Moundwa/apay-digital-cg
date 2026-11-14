// Page "Suivre ma commande" : interroge /api/track avec le code AP-XXXXXX.
(function () {
  const form = document.getElementById("trackForm");
  const input = document.getElementById("trackCode");
  const result = document.getElementById("trackResult");
  const recent = document.getElementById("trackRecent");
  const recentList = document.getElementById("trackRecentList");

  const STEPS = [
    { key: "created", label: "Commande créée" },
    { key: "paid", label: "Paiement reçu" },
    { key: "delivered", label: "Code livré" },
  ];

  function fcfa(n) {
    return Number(n).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA";
  }
  function dateFr(iso) {
    try { return new Date(iso).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" }); } catch (e) { return ""; }
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function showMessage(text, kind) {
    result.hidden = false;
    result.replaceChildren(el("p", "track-msg " + (kind || ""), text));
  }

  function showOrder(o) {
    result.hidden = false;
    const card = el("div", "track-card");
    const head = el("div", "track-head");
    head.append(el("span", "track-code", o.code), el("span", "track-date", dateFr(o.createdAt)));
    card.append(head, el("p", "track-product", o.productLabel), el("p", "track-amount", fcfa(o.amount)));

    if (o.status === "failed") {
      card.append(el("p", "track-msg error", "Le paiement n'a pas abouti ou a été annulé. Aucun montant n'a été débité pour cette commande. Tu peux recommander depuis la boutique."));
    } else {
      const reached = o.status === "delivered" ? 3 : o.status === "paid" ? 2 : 1; // nombre d'étapes terminées
      const ol = el("ol", "track-steps");
      STEPS.forEach((s, i) => {
        const li = el("li", i < reached ? "done" : i === reached ? "current" : "", s.label);
        ol.append(li);
      });
      card.append(ol);
      const help = {
        pending: "Valide la demande Mobile Money sur ton téléphone. Si tu l'as déjà fait, la page se mettra à jour d'ici quelques instants.",
        paid: "Paiement reçu ! On prépare ton code : tu le recevras sur le contact (WhatsApp ou email) indiqué lors de la commande.",
        delivered: "Ton code a été envoyé" + (o.deliveredAt ? " le " + dateFr(o.deliveredAt) : "") + ". Tu ne l'as pas reçu ? Écris-nous sur WhatsApp avec ce code.",
      }[o.status];
      card.append(el("p", "track-note", help));
    }
    result.replaceChildren(card);
  }

  let refreshTimer = null;
  async function lookup(code, silent) {
    clearTimeout(refreshTimer);
    if (!silent) showMessage("Recherche en cours…");
    try {
      const res = await fetch("/api/track?code=" + encodeURIComponent(code));
      const data = await res.json();
      if (!res.ok || !data.ok) { showMessage(data.error || "Commande introuvable.", "error"); return; }
      showOrder(data);
      history.replaceState(null, "", "?code=" + encodeURIComponent(data.code));
      // Actualisation automatique tant que la commande n'est pas terminée
      if (data.status === "pending" || data.status === "paid") {
        refreshTimer = setTimeout(() => lookup(code, true), data.status === "pending" ? 10000 : 60000);
      }
    } catch (e) {
      if (!silent) showMessage("Connexion impossible. Vérifie ton réseau et réessaie.", "error");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = input.value.trim();
    if (code) lookup(code);
  });

  // Commandes mémorisées dans ce navigateur par la fenêtre de paiement
  try {
    const list = JSON.parse(localStorage.getItem("apay_orders") || "[]");
    if (list.length) {
      recent.hidden = false;
      list.forEach((o) => {
        const li = el("li");
        const btn = el("button", "track-recent-item");
        btn.type = "button";
        btn.append(el("strong", "", o.code), el("span", "", " · " + o.label + " · " + dateFr(o.date)));
        btn.addEventListener("click", () => { input.value = o.code; lookup(o.code); });
        li.append(btn);
        recentList.append(li);
      });
    }
  } catch (e) { /* stockage indisponible */ }

  const fromUrl = new URLSearchParams(location.search).get("code");
  if (fromUrl) { input.value = fromUrl; lookup(fromUrl); }
})();
