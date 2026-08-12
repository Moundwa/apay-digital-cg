// ===================== APION — Interface du chat =====================
document.addEventListener("DOMContentLoaded", () => {
  const widget = document.getElementById("apionWidget");
  if (!widget || typeof ApionBrain === "undefined") return;

  const floatBtn = document.getElementById("apionFloat");
  const panel = document.getElementById("apionPanel");
  const closeBtn = document.getElementById("apClose");
  const messagesEl = document.getElementById("apMessages");
  const quickEl = document.getElementById("apQuick");
  const form = document.getElementById("apForm");
  const input = document.getElementById("apInput");
  const waFallback = document.getElementById("apWaFallback");

  let lastContext = null;      // dernier contexte de page connu {category,id,name,page}
  let lastAnnouncedId = null;  // pour ne pas répéter la même suggestion

  // ---------------- Ouverture / fermeture ----------------
  function openPanel(){
    widget.classList.add("ap-open");
    floatBtn.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    if (!messagesEl.dataset.greeted) {
      greet();
      messagesEl.dataset.greeted = "1";
    }
    setTimeout(() => input && input.focus(), 250);
  }
  function closePanel(){
    widget.classList.remove("ap-open");
    floatBtn.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
  }
  function togglePanel(e){
    if (e && e.target.closest(".af-close")) return; // géré par le bouton fermer la bulle
    if (widget.classList.contains("ap-open")) closePanel();
    else openPanel();
  }
  floatBtn.addEventListener("click", togglePanel);
  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && widget.classList.contains("ap-open")) closePanel();
  });

  // ---------------- Rendu des messages ----------------
  function scrollToBottom(){
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addUserMessage(text){
    const row = document.createElement("div");
    row.className = "ap-msg ap-user";
    row.innerHTML = `<div class="ap-bubble"></div>`;
    row.querySelector(".ap-bubble").textContent = text;
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function addBotMessage(response){
    const row = document.createElement("div");
    row.className = "ap-msg ap-bot";
    const avatar = document.createElement("div");
    avatar.className = "ap-msg-avatar";
    avatar.innerHTML = `<img src="assets/img/apion-icon.png" alt="Apion">`;
    const bubbleWrap = document.createElement("div");
    bubbleWrap.style.display = "flex";
    bubbleWrap.style.flexDirection = "column";
    bubbleWrap.style.gap = "6px";

    const bubble = document.createElement("div");
    bubble.className = "ap-bubble";
    const prefix = response.emoji ? response.emoji + "\n" : "";
    bubble.textContent = (prefix + (response.text || "")).trim();
    bubbleWrap.appendChild(bubble);

    if (response.ticket) {
      const card = document.createElement("div");
      card.className = "ap-ticket-card";
      card.innerHTML = `
        <div class="ap-tc-name">${response.ticket.name}</div>
        <div class="ap-tc-price">${response.ticket.price}</div>
        <button type="button" class="ap-tc-buy">Commander</button>
      `;
      card.querySelector(".ap-tc-buy").addEventListener("click", () => {
        const isMobile = response.ticket.category === "mobile";
        if (isMobile && typeof openOrderModal === "function") {
          openOrderModal(response.ticket.name, response.ticket.price);
        } else if (typeof orderItem === "function") {
          orderItem(response.ticket.name, response.ticket.price);
        }
      });
      bubbleWrap.appendChild(card);
    }

    row.appendChild(avatar);
    row.appendChild(bubbleWrap);
    messagesEl.appendChild(row);

    // petit halo au moment où la réponse apparaît
    widget.classList.add("apion-flash");
    row.classList.add("ap-bubble-flash");
    setTimeout(() => {
      widget.classList.remove("apion-flash");
      row.classList.remove("ap-bubble-flash");
    }, 900);

    scrollToBottom();
    renderQuickReplies(response.quickReplies || []);

    if (response.forceWhatsapp) {
      const label = ApionBrain.getMemory().product || "un produit Apay";
      setTimeout(() => {
        const msg = `Salut Apay Digital CG ! ${label !== "un produit Apay" ? "Je m'intéresse à : " + label + "." : "J'ai besoin d'aide."}`;
        window.open(waLink(msg), "_blank", "noopener");
      }, 500);
    }
  }

  let typingRow = null;
  function showTyping(){
    widget.classList.add("ap-thinking");
    typingRow = document.createElement("div");
    typingRow.className = "ap-msg ap-bot";
    typingRow.innerHTML = `
      <div class="ap-msg-avatar"><img src="assets/img/apion-icon.png" alt="Apion"></div>
      <div class="ap-bubble ap-typing"><span></span><span></span><span></span></div>
    `;
    messagesEl.appendChild(typingRow);
    scrollToBottom();
  }
  function hideTyping(){
    widget.classList.remove("ap-thinking");
    if (typingRow) { typingRow.remove(); typingRow = null; }
  }

  function renderQuickReplies(list){
    quickEl.innerHTML = "";
    list.forEach((label) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "ap-chip";
      chip.textContent = label;
      chip.addEventListener("click", () => handleChip(label));
      quickEl.appendChild(chip);
    });
  }

  // ---------------- Pipeline d'envoi ----------------
  async function sendToBrain(text){
    addUserMessage(text);
    quickEl.innerHTML = "";
    showTyping();
    const delay = 480 + Math.random() * 420; // laisse "respirer" l'animation de réflexion
    const [response] = await Promise.all([
      ApionBrain.respond(text),
      new Promise((r) => setTimeout(r, delay))
    ]);
    hideTyping();
    addBotMessage(response);
  }

  function handleChip(label){
    if (label === "💬 Contacter WhatsApp" || label === "💬 Ouvrir WhatsApp") {
      const mem = ApionBrain.getMemory();
      const msg = mem.product
        ? `Salut Apay Digital CG ! Je m'intéresse à : ${mem.product}.`
        : "Salut Apay Digital CG ! Je veux commander un code ou une recharge.";
      window.open(waLink(msg), "_blank", "noopener");
      return;
    }
    if (label === "Autre montant") {
      addUserMessage(label);
      addBotMessage({ emoji: "🤔", text: "Quel montant souhaitez-vous ?", quickReplies: [] });
      input.focus();
      return;
    }
    if (label === "Oui, montre-moi" && lastContext) {
      sendToBrain(lastContext.name);
      return;
    }
    if (label === "Non merci") {
      addUserMessage(label);
      addBotMessage({ emoji: "🙂", text: "Pas de souci, je reste disponible si vous changez d'avis.", quickReplies: ["🎮 Recharger un jeu", "🎬 Streaming"] });
      return;
    }
    sendToBrain(label);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    sendToBrain(text);
  });

  // ---------------- Premier message ----------------
  function greet(){
    const already = sessionStorage.getItem("apion_greeted");
    if (!already) {
      const copy = window.ApionData ? ApionData.getCopy() : { greeting: "👋 Bonjour et bienvenue sur Apay." };
      addBotMessage({
        text: copy.greeting,
        quickReplies: ["🎮 Recharger un jeu", "💻 Acheter un logiciel", "🎬 Streaming", "🎁 Carte cadeau", "✈️ Services"]
      });
      sessionStorage.setItem("apion_greeted", "1");
      announceContextIfAny(600);
    } else {
      const mem = ApionBrain.getMemory();
      if (mem.product) {
        addBotMessage({
          emoji: "🤖",
          text: `Content de vous revoir ! On avait parlé de ${mem.product}. On continue sur ça ?`,
          quickReplies: ["Continuer", "🎮 Recharger un jeu", "🎬 Streaming", "✈️ Services"]
        });
      } else {
        addBotMessage({
          emoji: "🤖",
          text: "Toujours là si besoin ! Que puis-je faire pour vous ?",
          quickReplies: ["🎮 Recharger un jeu", "💻 Acheter un logiciel", "🎬 Streaming", "✈️ Services"]
        });
      }
      announceContextIfAny(600);
    }
  }

  // ---------------- Conscience de la page consultée ----------------
  function announceContextIfAny(delay){
    if (!lastContext || lastContext.id === lastAnnouncedId) return;
    setTimeout(() => {
      lastAnnouncedId = lastContext.id;
      addBotMessage({
        emoji: "💡",
        text: `Vous consultez actuellement ${lastContext.name}.\nSouhaitez-vous voir les montants disponibles ?`,
        quickReplies: ["Oui, montre-moi", "Non merci"]
      });
    }, delay);
  }

  window.addEventListener("apion:page-context", (e) => {
    lastContext = e.detail;
    if (widget.classList.contains("ap-open") && messagesEl.dataset.greeted && lastContext.id !== lastAnnouncedId) {
      announceContextIfAny(300);
    }
  });
});
