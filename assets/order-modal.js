// ===================== Modale de commande — Jeux Mobile =====================
// Avant de rediriger vers WhatsApp, on demande l'ID en jeu (et le serveur si besoin)
// et on applique une taxe de 3,5% pour envoyer un prix TTC. Ne s'applique qu'à
// la section Jeux Mobile (voir mobile-games.html), pas aux autres catalogues.
(function () {
  const TAX_RATE = 0.035;
  let overlay, card, productEl, idInput, serverInput, errorEl, breakdownEl, confirmBtn, cancelBtn, closeBtn;
  let currentLabel = "";
  let currentBasePrice = 0;

  function parsePrice(str) {
    return parseInt(String(str).replace(/[^\d]/g, ""), 10) || 0;
  }

  function formatFCFA(n) {
    return n.toLocaleString("fr-FR").replace(/\u202F|\u00A0/g, " ") + " FCFA";
  }

  function buildModal() {
    overlay = document.createElement("div");
    overlay.className = "om-overlay";
    overlay.innerHTML = `
      <div class="om-card" role="dialog" aria-modal="true" aria-label="Finaliser la commande">
        <button type="button" class="om-close" aria-label="Fermer">×</button>
        <h3 class="om-title">Finaliser la commande</h3>
        <p class="om-product" id="omProduct"></p>
        <div class="om-field">
          <label for="omGameId">ID en jeu <span style="color:#FF7A7A">*</span></label>
          <input type="text" id="omGameId" placeholder="Ex : 123456789" autocomplete="off">
          <div class="om-hint">Nécessaire pour livrer directement sur votre compte.</div>
        </div>
        <div class="om-field">
          <label for="omServer">Serveur / Zone ID (si applicable)</label>
          <input type="text" id="omServer" placeholder="Ex : Asia, Zone 2001…" autocomplete="off">
        </div>
        <div class="om-error" id="omError">Merci d'indiquer votre ID en jeu avant de continuer.</div>
        <div class="om-breakdown" id="omBreakdown"></div>
        <div class="om-actions">
          <button type="button" class="om-cancel" id="omCancel">Annuler</button>
          <button type="button" class="om-confirm" id="omConfirm">Continuer sur WhatsApp →</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    card = overlay.querySelector(".om-card");
    productEl = overlay.querySelector("#omProduct");
    idInput = overlay.querySelector("#omGameId");
    serverInput = overlay.querySelector("#omServer");
    errorEl = overlay.querySelector("#omError");
    breakdownEl = overlay.querySelector("#omBreakdown");
    confirmBtn = overlay.querySelector("#omConfirm");
    cancelBtn = overlay.querySelector("#omCancel");
    closeBtn = overlay.querySelector(".om-close");

    cancelBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });
    idInput.addEventListener("input", () => errorEl.classList.remove("show"));
    idInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleConfirm(); });
    confirmBtn.addEventListener("click", handleConfirm);
  }

  function renderBreakdown() {
    const tax = Math.round(currentBasePrice * TAX_RATE);
    const total = currentBasePrice + tax;
    breakdownEl.innerHTML = `
      <div class="om-row"><span>Sous-total</span><span>${formatFCFA(currentBasePrice)}</span></div>
      <div class="om-row"><span>Taxe (3,5%)</span><span>${formatFCFA(tax)}</span></div>
      <div class="om-row total"><span>Total TTC</span><span>${formatFCFA(total)}</span></div>
    `;
  }

  function openModal(label, priceStr) {
    if (!overlay) buildModal();
    currentLabel = label;
    currentBasePrice = parsePrice(priceStr);
    productEl.textContent = label;
    idInput.value = "";
    serverInput.value = "";
    errorEl.classList.remove("show");
    renderBreakdown();
    overlay.classList.add("open");
    setTimeout(() => idInput.focus(), 200);
  }

  function closeModal() {
    if (overlay) overlay.classList.remove("open");
  }

  function handleConfirm() {
    const id = idInput.value.trim();
    if (!id) {
      errorEl.classList.add("show");
      idInput.focus();
      return;
    }
    const server = serverInput.value.trim();
    const tax = Math.round(currentBasePrice * TAX_RATE);
    const total = currentBasePrice + tax;

    let msg = `Salut Apay Digital CG ! Je veux commander : ${currentLabel} (${formatFCFA(total)} TTC).`;
    msg += `\nID en jeu : ${id}`;
    if (server) msg += `\nServeur / Zone : ${server}`;

    window.open(waLink(msg), "_blank", "noopener");
    closeModal();
  }

  window.openOrderModal = openModal;
})();
