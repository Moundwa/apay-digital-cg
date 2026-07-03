// ===================== APION — Cerveau (NLU + mémoire) =====================
// Détection d'intentions par règles/synonymes + mémoire de session.
//
// POINT DE BASCULE VERS UNE VRAIE IA (v2) :
// La seule fonction que l'UI appelle est `ApionBrain.respond(text)`, et elle est
// déjà asynchrone (retourne une Promise). Pour brancher un vrai modèle plus tard,
// il suffira de remplacer le corps de `respond()` par un fetch() vers un backend
// (qui, lui, détiendra la clé API en sécurité) — sans rien changer dans apion-ui.js.

const ApionBrain = (() => {

  const MEMORY_KEY = "apion_session_memory";

  // ---------------- Mémoire de session ----------------
  function loadMemory(){
    try {
      const raw = sessionStorage.getItem(MEMORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }
  function saveMemory(mem){
    try { sessionStorage.setItem(MEMORY_KEY, JSON.stringify(mem)); } catch (e) {}
  }
  let memory = loadMemory();

  function resetMemory(){
    memory = {};
    saveMemory(memory);
  }

  // ---------------- Normalisation de texte ----------------
  function normalize(text){
    return (text || "")
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // retire les accents
      .replace(/[^\w\s+€]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // ---------------- Extraction du produit (via synonymes) ----------------
  function extractProduct(normText){
    const synonyms = ApionData.getSynonyms();
    // on teste les alias du plus long au plus court pour éviter les faux positifs
    const aliases = Object.keys(synonyms).sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
      const na = normalize(alias);
      if (na && new RegExp(`(^|\\s)${na.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`).test(normText)) {
        return synonyms[alias];
      }
    }
    return null;
  }

  // ---------------- Extraction d'un montant ----------------
  function extractAmount(normText){
    // ex: "1000 fcfa", "1 000", "1000f"
    const m = normText.match(/(\d[\d ]{0,7}\d|\d)\s*(fcfa|f|xaf)?/);
    if (!m) return null;
    const num = parseInt(m[1].replace(/\s/g, ""), 10);
    if (isNaN(num) || num < 50) return null; // évite de capturer un numéro de téléphone/mot isolé
    return num;
  }

  // ---------------- Extraction d'une quantité ("deux", "2x"...) ----------------
  function extractQuantity(normText){
    const qWords = ApionData.getQuantityWords();
    const words = normText.split(" ");
    for (const w of words) {
      if (qWords[w]) return qWords[w];
    }
    const m = normText.match(/x\s*(\d)|(\d)\s*x/);
    if (m) return parseInt(m[1] || m[2], 10);
    return null;
  }

  // ---------------- Intentions simples par mots-clés ----------------
  const INTENT_PATTERNS = {
    greeting: /^(bonjour|salut|bonsoir|hello|hi|coucou|cc)\b/,
    thanks: /\b(merci|thanks|thx)\b/,
    payment: /\b(paiement|payer|paye|mtn|airtel|momo|paypal|carte bancaire)\b/,
    delivery: /\b(livraison|delai|combien de temps|rapide|quand)\b/,
    human: /\b(agent|humain|conseiller|parler a quelqu|whatsapp)\b/,
    order_confirm: /^(oui|ok|d accord|je valide|je commande|je prends|vas y|banco|confirme)\b/,
    order_cancel: /^(non|annul\w*|laisse tomber|pas maintenant)\b/,
    help: /\b(aide|help|que peux tu faire|c est quoi apion|qui es tu)\b/,
    category_mobile: /\b(recharger un jeu|jeu mobile|jeux mobile|recharge jeu)\b/,
    category_giftcard: /\b(console|consoles|carte cadeau|cartes cadeau|cartes cadeaux|gift card)\b/,
    category_software: /\b(acheter un logiciel|logiciel|logiciels)\b/,
    category_streaming: /\b(streaming|abonnement)\b/
  };

  function findBestTicket(item, targetAmount){
    const sorted = [...item.tickets].sort((a, b) => a.price - b.price);
    if (targetAmount == null) return sorted[0];
    let best = sorted.find(t => t.price >= targetAmount);
    if (!best) best = sorted[sorted.length - 1];
    return best;
  }

  // ---------------- Construction des réponses ----------------
  function replyProductTickets(item, amount){
    memory.product = item.name;
    memory.category = item.category;
    memory.itemRef = item;

    if (amount) {
      const ticket = findBestTicket(item, amount);
      memory.chosenTicket = ticket;
      saveMemory(memory);
      return {
        emoji: item.icon,
        text: `Très bien, pour ${ApionData.formatPrice(amount)} sur ${item.name}, voici ce qui s'en rapproche le plus :`,
        ticket: { name: `${item.name} — ${ticket.label}`, price: ApionData.formatPrice(ticket.price), raw: ticket },
        quickReplies: ["Je valide cette commande", "Voir tous les montants", "Autre montant"],
        page: item.page, anchor: item.anchor
      };
    }

    // pas de montant précisé : on demande, en proposant les paliers en raccourci
    memory.chosenTicket = null;
    saveMemory(memory);
    const shortList = item.tickets.slice(0, 4).map(t => t.label);
    return {
      emoji: item.icon,
      text: `Très bien.\nQuel montant souhaitez-vous pour ${item.name} ? (monnaie : ${item.currency})`,
      quickReplies: [...shortList, "Voir tous les montants"],
      page: item.page, anchor: item.anchor
    };
  }

  function replyAllTickets(item){
    const lines = item.tickets.map(t => `• ${t.label} — ${ApionData.formatPrice(t.price)}`).join("\n");
    return {
      emoji: item.icon,
      text: `Voici tous les paliers ${item.name} (${item.currency}) :\n${lines}\n\nDites-moi un montant, ou le palier qui vous intéresse.`,
      quickReplies: ["Je valide cette commande", "💬 Contacter WhatsApp"],
      page: item.page, anchor: item.anchor
    };
  }

  function replyUnlisted(brand){
    return {
      emoji: "😕",
      text: `${brand.icon} ${brand.name} n'est pas encore listé sur notre boutique en ligne, mais nos agents peuvent probablement vous aider directement sur WhatsApp.`,
      quickReplies: ["💬 Contacter WhatsApp", "🎮 Recharger un jeu", "🎬 Streaming"]
    };
  }

  function replyPayment(){
    const methods = ApionData.getPaymentMethods().map(m => `• ${m.name}`).join("\n");
    return {
      emoji: "💳",
      text: `Nous acceptons :\n${methods}\n\nLe paiement se confirme directement avec l'agent sur WhatsApp au moment de la commande.`,
      quickReplies: ["🎮 Recharger un jeu", "💬 Contacter WhatsApp"]
    };
  }

  function replyDelivery(){
    return {
      emoji: "⚡",
      text: "La livraison est instantanée dans la grande majorité des cas : entre 5 et 10 minutes selon le produit, directement sur WhatsApp après confirmation du paiement.",
      quickReplies: ["🎮 Recharger un jeu", "💬 Contacter WhatsApp"]
    };
  }

  function replyHuman(){
    return {
      emoji: "💬",
      text: "Bien sûr ! Je vous transmets directement à un agent sur WhatsApp.",
      quickReplies: ["💬 Ouvrir WhatsApp"],
      forceWhatsapp: true
    };
  }

  function replyHelp(){
    return {
      emoji: "🤖",
      text: "Je suis APION, le Gardien Numérique d'Apay. Je connais tout notre catalogue (jeux, consoles, streaming), je me souviens de ce dont on parle, et je peux vous accompagner jusqu'à votre commande sur WhatsApp.",
      quickReplies: ["🎮 Recharger un jeu", "💻 Acheter un logiciel", "🎬 Streaming", "🎁 Carte cadeau", "💬 Contacter WhatsApp"]
    };
  }

  function replyGreeting(){
    return {
      emoji: "👋",
      text: ApionData.getCopy().greeting,
      quickReplies: ["🎮 Recharger un jeu", "💻 Acheter un logiciel", "🎬 Streaming", "🎁 Carte cadeau", "💬 Contacter WhatsApp"]
    };
  }

  function replyUnknown(){
    return {
      emoji: "🤔",
      text: "Je ne suis pas sûr d'avoir bien compris. Vous pouvez reformuler, ou choisir une option ci-dessous :",
      quickReplies: ["🎮 Recharger un jeu", "🎬 Streaming", "💬 Contacter WhatsApp"]
    };
  }

  function replyCategoryMobile(){
    return {
      emoji: "🎮",
      text: "Voici nos jeux mobile disponibles :",
      quickReplies: ["🔥 Free Fire", "🎯 PUBG Mobile", "⚔️ Mobile Legends", "💎 Genshin Impact", "🗡️ Bleach: Soul Resonance"]
    };
  }
  function replyCategoryGiftcards(){
    return {
      emoji: "🎁",
      text: "Voici nos cartes cadeau disponibles :",
      quickReplies: ["🎮 PlayStation", "🟢 Xbox", "🍄 Nintendo eShop", "🕹️ Steam"]
    };
  }
  function replyCategoryStreaming(){
    return {
      emoji: "🎬",
      text: "Voici nos abonnements streaming disponibles :",
      quickReplies: ["📺 Netflix", "🎧 Spotify", "🏰 Disney+"]
    };
  }
  function replyCategorySoftware(){
    return {
      emoji: "💻",
      text: "Voici les logiciels disponibles :",
      quickReplies: ["📄 Microsoft Office", "🎨 Adobe Creative Cloud"]
    };
  }

  const MOBILE_TAX_RATE = 0.035; // taxe appliquée uniquement aux jeux mobile, comme sur les boutons "Commander" de la page

  function replyOrderConfirmed(){
    if (!memory.chosenTicket || !memory.itemRef) {
      return {
        emoji: "🤔",
        text: "Dites-moi d'abord quel produit et quel montant vous intéressent, et je prépare la commande !",
        quickReplies: ["🎮 Recharger un jeu", "🎬 Streaming"]
      };
    }
    const isMobile = memory.itemRef.category === "mobile";

    // pour les jeux mobile, l'ID en jeu est obligatoire avant de finaliser
    if (isMobile && !memory.gameId) {
      memory.awaitingGameId = true;
      saveMemory(memory);
      return {
        emoji: "🎮",
        text: "Avant de valider, quel est votre ID en jeu (Player ID) ? Précisez aussi le serveur si votre jeu en a un.",
        quickReplies: []
      };
    }

    const qty = memory.pendingQty || 1;
    const subtotal = memory.chosenTicket.price * qty;
    const tax = isMobile ? Math.round(subtotal * MOBILE_TAX_RATE) : 0;
    const total = subtotal + tax;
    const label = `${memory.itemRef.name} ${memory.chosenTicket.label}${qty > 1 ? " x" + qty : ""}`;

    let text = `Excellente nouvelle !\nVotre commande est prête : ${label}`;
    text += isMobile
      ? ` pour ${ApionData.formatPrice(total)} TTC (taxe 3,5% incluse).\nID en jeu : ${memory.gameId}`
      : ` pour ${ApionData.formatPrice(total)}.`;
    text += "\nJe vous transmets sur WhatsApp pour finaliser le paiement.";

    const orderLabel = isMobile ? `${label} — ID: ${memory.gameId}` : label;

    // on repart à zéro sur l'attente d'ID pour une prochaine commande éventuelle
    memory.awaitingGameId = false;
    saveMemory(memory);

    return {
      emoji: "🎉",
      text,
      order: { label: orderLabel, price: ApionData.formatPrice(total) },
      quickReplies: ["💬 Ouvrir WhatsApp"],
      forceWhatsapp: true
    };
  }

  function replyQuantity(qty){
    if (!memory.chosenTicket || !memory.itemRef) return replyUnknown();
    memory.pendingQty = qty;
    saveMemory(memory);
    const total = memory.chosenTicket.price * qty;
    return {
      emoji: "🤔",
      text: `Je vérifie cela pour vous…\n${qty} × ${memory.itemRef.name} ${memory.chosenTicket.label} = ${ApionData.formatPrice(total)}. Je valide ?`,
      quickReplies: ["Je valide cette commande", "Annuler"]
    };
  }

  // ---------------- Détection d'intention + génération de réponse ----------------
  function resolve(userText){
    const normText = normalize(userText);

    // si on vient de demander l'ID en jeu, le message suivant EST la réponse
    // (sauf si le client change d'avis et annule)
    if (memory.awaitingGameId) {
      if (/^(non|annul\w*|laisse tomber|pas maintenant)\b/.test(normText)) {
        memory.awaitingGameId = false; memory.chosenTicket = null; memory.pendingQty = null;
        saveMemory(memory);
        return { emoji: "😕", text: "Aucun souci, commande annulée. Que recherchez-vous ?", quickReplies: ["🎮 Recharger un jeu", "🎬 Streaming"] };
      }
      memory.gameId = userText.trim();
      memory.awaitingGameId = false;
      saveMemory(memory);
      return replyOrderConfirmed();
    }

    // intentions courtes / mots-clés prioritaires
    for (const [intent, pattern] of Object.entries(INTENT_PATTERNS)) {
      if (pattern.test(normText)) {
        switch (intent) {
          case "greeting": return replyGreeting();
          case "thanks": return { emoji: "😊", text: "Avec plaisir ! N'hésitez pas si vous avez besoin d'autre chose.", quickReplies: ["🎮 Recharger un jeu", "💬 Contacter WhatsApp"] };
          case "payment": return replyPayment();
          case "delivery": return replyDelivery();
          case "human": return replyHuman();
          case "help": return replyHelp();
          case "order_confirm": {
            const impliedQty = extractQuantity(normText);
            if (impliedQty && impliedQty > 1 && memory.chosenTicket) return replyQuantity(impliedQty);
            return replyOrderConfirmed();
          }
          case "order_cancel":
            memory.chosenTicket = null; memory.pendingQty = null; saveMemory(memory);
            return { emoji: "😕", text: "Aucun souci. On reprend à zéro : que recherchez-vous ?", quickReplies: ["🎮 Recharger un jeu", "🎬 Streaming"] };
          case "category_mobile": return replyCategoryMobile();
          case "category_giftcard": return replyCategoryGiftcards();
          case "category_software": return replyCategorySoftware();
          case "category_streaming": return replyCategoryStreaming();
        }
      }
    }

    // sélection exacte d'un palier déjà affiché (ex: tap sur une puce "86 Diamants")
    if (memory.itemRef) {
      const exact = memory.itemRef.tickets.find(t => normalize(t.label) === normText);
      if (exact) {
        memory.chosenTicket = exact;
        saveMemory(memory);
        return {
          emoji: memory.itemRef.icon,
          text: `Parfait : ${memory.itemRef.name} — ${exact.label} pour ${ApionData.formatPrice(exact.price)}. On valide ?`,
          ticket: { name: `${memory.itemRef.name} — ${exact.label}`, price: ApionData.formatPrice(exact.price) },
          quickReplies: ["Je valide cette commande", "Voir tous les montants", "Autre montant"]
        };
      }
    }

    // produit mentionné dans le message
    const productKey = extractProduct(normText);
    const amount = extractAmount(normText);

    if (productKey) {
      const item = ApionData.getItem(productKey);
      if (item) {
        return replyProductTickets(item, amount);
      }
      const brand = ApionData.getUnlisted(productKey);
      if (brand) return replyUnlisted(brand);
    }

    // pas de produit dans ce message, mais un montant + un produit en mémoire
    if (amount && memory.itemRef) {
      return replyProductTickets(memory.itemRef, amount);
    }

    // quantité seule ("et si je prends deux ?") avec un produit déjà retenu
    const qty = extractQuantity(normText);
    if (qty && memory.chosenTicket) {
      return replyQuantity(qty);
    }

    // "voir tous les montants"
    if (/tous les montants|tout voir|toutes les options/.test(normText) && memory.itemRef) {
      return replyAllTickets(memory.itemRef);
    }

    return replyUnknown();
  }

  async function respond(userText){
    // `await` + délai artificiel pour laisser l'UI jouer l'animation de réflexion.
    // C'est ici que la v2 remplacerait ce bloc par un vrai appel réseau.
    return resolve(userText);
  }

  function getMemory(){ return memory; }

  return { respond, resetMemory, getMemory, normalize, extractProduct };
})();
