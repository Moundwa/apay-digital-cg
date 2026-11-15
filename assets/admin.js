// Tableau de bord des commandes Apay (page /admin.html).
// Tout le texte venant des clients est inséré avec textContent (jamais innerHTML).
(function () {
  const TOKEN_KEY = "apay_admin_token";
  const REFRESH_MS = 30000;
  const $ = (id) => document.getElementById(id);

  let token = "";
  let orders = [];
  let filter = "todo";
  let timer = null;

  try { token = localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { /* ignoré */ }

  // ---------- utilitaires ----------
  const fcfa = (n) => Number(n || 0).toLocaleString("fr-FR").replace(/ | /g, " ") + " FCFA";
  const dateFr = (iso) => { try { return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } };
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
  }
  function kind(o) {
    if (o.status === "success") return o.delivered ? "delivered" : "todo";
    if (o.status === "failed") return "failed";
    if (o.status === "suspect") return "suspect";
    return "pending";
  }
  const LABELS = { todo: "Payée — à livrer", delivered: "Livrée", pending: "En attente", failed: "Échouée", suspect: "⚠️ Suspecte" };

  async function api(method, body) {
    const res = await fetch("/api/admin", {
      method,
      headers: { "X-Admin-Token": token, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 || res.status === 429) { logout(data.error); throw new Error(data.error); }
    if (!res.ok || !data.ok) throw new Error(data.error || "Erreur " + res.status);
    return data;
  }

  // ---------- connexion ----------
  function showLogin(msg) {
    $("admLogin").hidden = false;
    $("admBoard").hidden = true;
    $("admRefresh").hidden = $("admLogout").hidden = true;
    $("admLoginError").hidden = !msg;
    $("admLoginError").textContent = msg || "";
  }
  function logout(msg) {
    token = "";
    clearTimeout(timer);
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignoré */ }
    showLogin(msg);
  }
  $("admLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    token = $("admToken").value.trim();
    $("admToken").value = "";
    try {
      await load();
      try { localStorage.setItem(TOKEN_KEY, token); } catch (err) { /* ignoré */ }
    } catch (err) { /* message déjà affiché */ }
  });
  $("admLogout").addEventListener("click", () => logout());
  $("admRefresh").addEventListener("click", () => load().catch(() => {}));

  // ---------- chargement ----------
  async function load() {
    clearTimeout(timer);
    const data = await api("GET");
    orders = data.orders || [];
    $("admLogin").hidden = true;
    $("admBoard").hidden = false;
    $("admRefresh").hidden = $("admLogout").hidden = false;
    $("admUpdated").textContent = "Mis à jour à " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    render();
    timer = setTimeout(() => load().catch(() => {}), REFRESH_MS);
  }

  // ---------- affichage ----------
  function stats() {
    const today = new Date().toDateString();
    const paid = orders.filter((o) => o.status === "success");
    $("statTodo").textContent = paid.filter((o) => !o.delivered).length;
    $("statPending").textContent = orders.filter((o) => kind(o) === "pending").length;
    $("statToday").textContent = fcfa(paid.filter((o) => new Date(o.createdAt).toDateString() === today).reduce((s, o) => s + o.amount, 0));
    $("statTotal").textContent = fcfa(paid.reduce((s, o) => s + o.amount, 0));
    const todo = paid.filter((o) => !o.delivered).length;
    document.title = (todo ? "(" + todo + ") " : "") + "Commandes | Apay Admin";
  }

  function waLink(contact, o) {
    const digits = String(contact).replace(/\D/g, "");
    if (contact.includes("@") || digits.length < 8) return null;
    const num = digits.startsWith("242") ? digits : "242" + digits.replace(/^0/, "0");
    const msg = `Bonjour ! Merci pour ta commande ${o.code || ""} (${o.productLabel}). Voici ton code : `;
    return "https://wa.me/" + num + "?text=" + encodeURIComponent(msg);
  }

  function waStatus(o) {
    const one = (label, w) => {
      if (!w) return null;
      if (w.sent) return label + " ✓";
      if (w.skipped === "contact-non-whatsapp") return label + " : contact email, pas de WhatsApp";
      if (w.skipped) return null; // WhatsApp pas encore configuré
      return label + " ✗ (" + (w.error || "échec") + ")";
    };
    return [one("Paiement reçu", o.waPaid), one("Livrée", o.waDelivered)].filter(Boolean).join(" · ");
  }

  function card(o) {
    const k = kind(o);
    const c = el("article", "adm-card " + k);

    const top = el("div", "adm-card-top");
    top.append(el("span", "adm-code", o.code || "—"), el("span", "adm-badge " + k, LABELS[k]), el("span", "adm-date", dateFr(o.createdAt)));
    c.append(top);

    c.append(el("p", "adm-product", o.productLabel), el("p", "adm-amount", fcfa(o.amount) + " · " + (o.provider || "") + " " + (o.phone || "")));

    const dl = el("dl", "adm-details");
    const row = (label, value) => { if (!value) return; dl.append(el("dt", "", label), el("dd", "", value)); };
    row("Livrer à", o.contact);
    row("ID en jeu", o.gameId);
    row("Serveur / Zone", o.server);
    row("Livrée le", o.deliveredAt ? dateFr(o.deliveredAt) : "");
    row("WhatsApp client", waStatus(o));
    row("Réf. OpenPay", o.reference);
    c.append(dl);

    const actions = el("div", "adm-actions");
    if (o.status === "success") {
      const wa = waLink(o.contact || "", o);
      if (wa) { const a = el("a", "adm-btn wa", "Ouvrir WhatsApp"); a.href = wa; a.target = "_blank"; a.rel = "noopener"; actions.append(a); }
      else if ((o.contact || "").includes("@")) { const a = el("a", "adm-btn wa", "Écrire un email"); a.href = "mailto:" + o.contact + "?subject=" + encodeURIComponent("Ta commande " + (o.code || "")); actions.append(a); }
      const b = el("button", "adm-btn " + (o.delivered ? "ghost" : "primary"), o.delivered ? "Annuler « livrée »" : "Marquer livrée ✓");
      b.type = "button";
      b.addEventListener("click", () => act(o, o.delivered ? "undelivered" : "delivered", b));
      actions.append(b);
    } else if (k === "pending" || k === "suspect") {
      const b = el("button", "adm-btn", "Revérifier chez OpenPay");
      b.type = "button";
      b.addEventListener("click", () => act(o, "recheck", b));
      actions.append(b);
    }
    if (k === "suspect") c.append(el("p", "adm-warn", "Montant payé différent de la commande : NE PAS LIVRER sans vérifier dans OpenPay."));
    c.append(actions);
    return c;
  }

  function render() {
    stats();
    const q = $("admSearch").value.trim().toLowerCase();
    const list = orders.filter((o) => {
      const k = kind(o);
      if (filter === "todo" && k !== "todo") return false;
      if (filter === "delivered" && k !== "delivered") return false;
      if (filter === "pending" && k !== "pending" && k !== "suspect") return false;
      if (filter === "failed" && k !== "failed") return false;
      if (!q) return true;
      return [o.code, o.productLabel, o.phone, o.contact, o.gameId, o.reference].join(" ").toLowerCase().includes(q);
    });
    $("admList").replaceChildren(...list.map(card));
    $("admEmpty").hidden = list.length > 0;
  }

  async function act(o, action, btn) {
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = "…";
    try {
      const data = await api("POST", { reference: o.reference, action });
      orders = orders.map((x) => (x.reference === o.reference ? data.order : x));
      render();
    } catch (err) {
      btn.disabled = false;
      btn.textContent = old;
      alert(err.message);
    }
  }

  document.querySelectorAll(".adm-filter").forEach((b) => {
    b.addEventListener("click", () => {
      filter = b.dataset.filter;
      document.querySelectorAll(".adm-filter").forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
  });
  $("admSearch").addEventListener("input", render);

  // ---------- démarrage ----------
  if (token) load().catch(() => {}); else showLogin();
})();
