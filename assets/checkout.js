// ===================== Modale de paiement unifiée (OpenPay) =====================
// Remplace l'ancien flux WhatsApp. Collecte le moyen de paiement Mobile Money
// et le contact de livraison, déclenche le paiement OpenPay côté serveur,
// puis attend la confirmation (polling) avant d'afficher le résultat.
(function () {
  const TAX_RATE = 0.035; // uniquement appliquée aux produits "jeux mobile" (ID en jeu requis)
  const POLL_INTERVAL_MS = 3000;
  const POLL_TIMEOUT_MS = 120000; // 2 minutes

  let overlay, card;
  let els = {};
  let currentLabel = "";
  let currentBasePrice = 0;
  let requireGameId = false;
  let selectedProvider = "";
  let pollTimer = null;
  let pollDeadline = 0;

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

        <div class="om-state active" id="omStateForm">
          <h3 class="om-title">Finaliser la commande</h3>
          <p class="om-product" id="omProduct"></p>

          <div class="om-field" id="omGameIdField">
            <label for="omGameId">ID en jeu <span style="color:#FF7A7A">*</span></label>
            <input type="text" id="omGameId" placeholder="Ex : 123456789" autocomplete="off">
            <div class="om-hint">Nécessaire pour livrer directement sur votre compte.</div>
          </div>
          <div class="om-field" id="omServerField">
            <label for="omServer">Serveur / Zone ID (si applicable)</label>
            <input type="text" id="omServer" placeholder="Ex : Asia, Zone 2001…" autocomplete="off">
          </div>

          <div class="om-field">
            <label>Paiement Mobile Money <span style="color:#FF7A7A">*</span></label>
            <div class="om-provider-group">
              <button type="button" class="om-provider-btn" data-provider="MTN">MTN Money</button>
              <button type="button" class="om-provider-btn" data-provider="AIRTEL">Airtel Money</button>
            </div>
          </div>
          <div class="om-field">
            <label for="omPhone">Numéro Mobile Money <span style="color:#FF7A7A">*</span></label>
            <input type="tel" id="omPhone" placeholder="Ex : 06 123 45 67" autocomplete="off">
          </div>
          <div class="om-field">
            <label for="omContact">WhatsApp ou email pour recevoir le code <span style="color:#FF7A7A">*</span></label>
            <input type="text" id="omContact" placeholder="Ex : +242 06 123 45 67 ou toi@email.com" autocomplete="off">
          </div>

          <div class="om-error" id="omError">Merci de compléter les champs obligatoires.</div>
          <div class="om-breakdown" id="omBreakdown"></div>
          <div class="om-actions">
            <button type="button" class="om-cancel" id="omCancel">Annuler</button>
            <button type="button" class="om-confirm" id="omConfirm">Payer maintenant →</button>
          </div>
        </div>

        <div class="om-state" id="omStatePending">
          <div class="om-pending">
            <div class="om-spinner"></div>
            <h3 class="om-pending-title">Confirme le paiement sur ton téléphone</h3>
            <p class="om-pending-text">Une demande de paiement Mobile Money vient d'être envoyée. Compose ton code secret pour valider — cette fenêtre se met à jour automatiquement.</p>
          </div>
        </div>

        <div class="om-state" id="omStateSuccess">
          <div class="om-result success">
            <div class="om-result-icon">✓</div>
            <h3 class="om-result-title">Paiement reçu !</h3>
            <p class="om-result-text" id="omSuccessText">Ta commande est confirmée. Tu recevras ton code très vite sur le contact indiqué.</p>
            <div class="om-actions"><button type="button" class="om-confirm" id="omSuccessClose" style="flex:1">Fermer</button></div>
          </div>
        </div>

        <div class="om-state" id="omStateError">
          <div class="om-result error">
            <div class="om-result-icon">✕</div>
            <h3 class="om-result-title" id="omErrorTitle">Paiement non confirmé</h3>
            <p class="om-result-text" id="omErrorText">Le paiement n'a pas abouti ou a pris trop de temps. Réessaie, ou contacte-nous sur WhatsApp si le souci persiste.</p>
            <div class="om-actions">
              <button type="button" class="om-cancel" id="omErrorRetry">Réessayer</button>
              <a class="om-confirm" id="omErrorWhatsapp" style="text-decoration:none; display:flex; align-items:center; justify-content:center;" target="_blank" rel="noopener">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    card = overlay.querySelector(".om-card");
    els = {
      form: overlay.querySelector("#omStateForm"),
      pending: overlay.querySelector("#omStatePending"),
      success: overlay.querySelector("#omStateSuccess"),
      error: overlay.querySelector("#omStateError"),
      product: overlay.querySelector("#omProduct"),
      gameIdField: overlay.querySelector("#omGameIdField"),
      serverField: overlay.querySelector("#omServerField"),
      gameId: overlay.querySelector("#omGameId"),
      server: overlay.querySelector("#omServer"),
      phone: overlay.querySelector("#omPhone"),
      contact: overlay.querySelector("#omContact"),
      providerBtns: overlay.querySelectorAll(".om-provider-btn"),
      errorEl: overlay.querySelector("#omError"),
      breakdown: overlay.querySelector("#omBreakdown"),
      confirmBtn: overlay.querySelector("#omConfirm"),
      cancelBtn: overlay.querySelector("#omCancel"),
      closeBtn: overlay.querySelector(".om-close"),
      successText: overlay.querySelector("#omSuccessText"),
      successClose: overlay.querySelector("#omSuccessClose"),
      errorTitle: overlay.querySelector("#omErrorTitle"),
      errorText: overlay.querySelector("#omErrorText"),
      errorRetry: overlay.querySelector("#omErrorRetry"),
      errorWhatsapp: overlay.querySelector("#omErrorWhatsapp"),
    };

    els.cancelBtn.addEventListener("click", closeModal);
    els.closeBtn.addEventListener("click", closeModal);
    els.successClose.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });
    els.providerBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedProvider = btn.dataset.provider;
        els.providerBtns.forEach((b) => b.classList.toggle("active", b === btn));
        els.errorEl.classList.remove("show");
      });
    });
    [els.gameId, els.phone, els.contact].forEach((input) => {
      input.addEventListener("input", () => els.errorEl.classList.remove("show"));
    });
    els.confirmBtn.addEventListener("click", handleConfirm);
    els.errorRetry.addEventListener("click", () => showState("form"));
  }

  function showState(name) {
    ["form", "pending", "success", "error"].forEach((s) => {
      els[s].classList.toggle("active", s === name);
    });
  }

  function renderBreakdown() {
    if (requireGameId) {
      const tax = Math.round(currentBasePrice * TAX_RATE);
      const total = currentBasePrice + tax;
      els.breakdown.innerHTML = `
        <div class="om-row"><span>Sous-total</span><span>${formatFCFA(currentBasePrice)}</span></div>
        <div class="om-row"><span>Taxe (3,5%)</span><span>${formatFCFA(tax)}</span></div>
        <div class="om-row total"><span>Total TTC</span><span>${formatFCFA(total)}</span></div>
      `;
    } else {
      els.breakdown.innerHTML = `
        <div class="om-row total"><span>Total à payer</span><span>${formatFCFA(currentBasePrice)}</span></div>
      `;
    }
  }

  function totalToPay() {
    if (requireGameId) {
      const tax = Math.round(currentBasePrice * TAX_RATE);
      return currentBasePrice + tax;
    }
    return currentBasePrice;
  }

  function openModal(label, priceStr, opts) {
    opts = opts || {};
    requireGameId = !!opts.requireGameId;
    if (!overlay) buildModal();
    currentLabel = label;
    currentBasePrice = parsePrice(priceStr);
    selectedProvider = "";

    els.product.textContent = label;
    els.gameIdField.style.display = requireGameId ? "" : "none";
    els.serverField.style.display = requireGameId ? "" : "none";
    els.gameId.value = "";
    els.server.value = "";
    els.phone.value = "";
    els.contact.value = "";
    els.providerBtns.forEach((b) => b.classList.remove("active"));
    els.errorEl.classList.remove("show");
    els.confirmBtn.disabled = false;
    els.confirmBtn.textContent = "Payer maintenant →";
    renderBreakdown();
    showState("form");
    overlay.classList.add("open");
    setTimeout(() => (requireGameId ? els.gameId : els.phone).focus(), 200);
  }

  function closeModal() {
    if (overlay) overlay.classList.remove("open");
    stopPolling();
  }

  function showError(msg) {
    els.errorEl.textContent = msg;
    els.errorEl.classList.add("show");
  }

  async function handleConfirm() {
    if (requireGameId && !els.gameId.value.trim()) {
      showError("Merci d'indiquer votre ID en jeu avant de continuer.");
      els.gameId.focus();
      return;
    }
    if (!selectedProvider) {
      showError("Choisis ton opérateur Mobile Money (MTN ou Airtel).");
      return;
    }
    const phone = els.phone.value.trim();
    if (!phone || phone.replace(/\D/g, "").length < 9) {
      showError("Entre un numéro Mobile Money valide.");
      els.phone.focus();
      return;
    }
    const contact = els.contact.value.trim();
    if (!contact) {
      showError("Indique un contact (WhatsApp ou email) pour recevoir ton code.");
      els.contact.focus();
      return;
    }

    els.confirmBtn.disabled = true;
    els.confirmBtn.textContent = "Envoi en cours…";

    const payload = {
      productLabel: currentLabel,
      amount: totalToPay(),
      phone: phone.replace(/\D/g, ""),
      provider: selectedProvider,
      contact: contact,
      gameId: requireGameId ? els.gameId.value.trim() : "",
      server: requireGameId ? els.server.value.trim() : "",
    };

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.reference) {
        throw new Error(data.error || "Échec du lancement du paiement.");
      }
      showState("pending");
      startPolling(data.reference);
    } catch (err) {
      els.confirmBtn.disabled = false;
      els.confirmBtn.textContent = "Payer maintenant →";
      showError(err.message || "Impossible de lancer le paiement pour le moment. Réessaie dans un instant.");
      console.error("create-payment error:", err);
    }
  }

  function startPolling(reference) {
    pollDeadline = Date.now() + POLL_TIMEOUT_MS;
    poll(reference);
  }

  function stopPolling() {
    if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
  }

  async function poll(reference) {
    if (Date.now() > pollDeadline) {
      showFailure("Le paiement prend plus de temps que prévu. S'il a bien été validé sur ton téléphone, contacte-nous sur WhatsApp avec ta référence : " + reference);
      return;
    }
    try {
      const res = await fetch("/api/status?ref=" + encodeURIComponent(reference));
      const data = await res.json();
      if (data.status === "success" || data.status === "paid" || data.status === "completed") {
        els.successText.textContent = `Ta commande "${currentLabel}" est confirmée. Tu recevras ton code très vite sur ${els.contact.value.trim()}.`;
        showState("success");
        return;
      }
      if (data.status === "failed" || data.status === "error") {
        showFailure("Le paiement a été refusé ou annulé. Tu peux réessayer.");
        return;
      }
      pollTimer = setTimeout(() => poll(reference), POLL_INTERVAL_MS);
    } catch (err) {
      pollTimer = setTimeout(() => poll(reference), POLL_INTERVAL_MS);
    }
  }

  function showFailure(msg) {
    els.errorText.textContent = msg;
    const waMsg = `Salut Apay Digital CG ! J'ai un souci avec le paiement de : ${currentLabel} (${formatFCFA(totalToPay())}).`;
    els.errorWhatsapp.href = (window.waLink ? window.waLink(waMsg) : "https://wa.me/242069678759?text=" + encodeURIComponent(waMsg));
    showState("error");
  }

  // Exposées globalement — mêmes signatures que l'ancien flux WhatsApp,
  // donc aucun changement nécessaire dans les boutons "Commander" existants.
  window.orderItem = function (label, price) { openModal(label, price, { requireGameId: false }); };
  window.openOrderModal = function (label, price) { openModal(label, price, { requireGameId: true }); };
})();
