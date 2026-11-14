// ===================== APION — Couche de connaissances =====================
// Ce fichier est la SEULE source de vérité produit pour APION.
// -> Pour ajouter/modifier un produit ou un prix, on édite uniquement ce fichier.
// -> apion-brain.js ne contient AUCUN prix ni nom de produit en dur : il lit tout ici.
//
// v2 (roadmap) : ce fichier pourra être remplacé par un fetch() vers une vraie
// base de données / API produit, sans toucher à apion-brain.js ni apion-ui.js —
// il suffira que la fonction ApionData.getCatalog() retourne la même forme.

const ApionData = (() => {

  // ---- Catalogue réel (doit rester synchronisé avec les tickets des pages) ----
  const CATALOG = {
    playstation: {
      name: "PlayStation Network (PSN)", icon: "🎮", category: "giftcards",
      currency: "Portefeuille PSN", page: "cartes-cadeaux.html", anchor: "#playstation",
      delivery: "10 minutes",
      tickets: [
        { id: "PSN-010", label: "PSN 10€", price: 7980 },
        { id: "PSN-020", label: "PSN 20€", price: 15760 },
        { id: "PSN-030", label: "PSN 30€", price: 23540 },
        { id: "PSN-050", label: "PSN 50€", price: 36200 },
        { id: "PSN-100", label: "PSN 100€", price: 72700 }
      ]
    },
    xbox: {
      name: "Xbox Live", icon: "🟢", category: "giftcards",
      currency: "Crédit Xbox Live", page: "cartes-cadeaux.html", anchor: "#xbox",
      delivery: "10 minutes",
      tickets: [
        { id: "XBX-010", label: "Xbox 10€", price: 7980 },
        { id: "XBX-020", label: "Xbox 20€", price: 15760 },
        { id: "XBX-030", label: "Xbox 30€", price: 23540 },
        { id: "XBX-050", label: "Xbox 50€", price: 36200 },
        { id: "XBX-100", label: "Xbox 100€", price: 72700 }
      ]
    },
    netflix: {
      name: "Netflix", icon: "📺", category: "streaming",
      currency: "Premium 4K", page: "streaming.html", anchor: "",
      delivery: "5 minutes",
      tickets: [
        { id: "NFX-01M", label: "Netflix 1 Mois", price: 3500 },
        { id: "NFX-03M", label: "Netflix 3 Mois", price: 10000 },
        { id: "NFX-12M", label: "Netflix 12 Mois", price: 37500 }
      ]
    },
    freefire: {
      name: "Free Fire", icon: "🔥", category: "mobile",
      currency: "Diamants", page: "mobile-games.html", anchor: "#freefire",
      delivery: "5 minutes",
      tickets: [
        { id: "FF-100", label: "100 Diamants", price: 1200 },
        { id: "FF-210", label: "210 Diamants", price: 2200 },
        { id: "FF-310", label: "310 Diamants", price: 2700 },
        { id: "FF-520", label: "520 Diamants", price: 4200 },
        { id: "FF-1060", label: "1060 Diamants", price: 8200 },
        { id: "FF-2180", label: "2180 Diamants", price: 16700 }
      ]
    },
    pubgm: {
      name: "PUBG Mobile", icon: "🎯", category: "mobile",
      currency: "UC", page: "mobile-games.html", anchor: "#pubgm",
      delivery: "5 minutes",
      tickets: [
        { id: "PUBG-060", label: "60 UC", price: 1200 },
        { id: "PUBG-325", label: "325 UC", price: 3950 },
        { id: "PUBG-660", label: "660 UC", price: 7700 },
        { id: "PUBG-1800", label: "1800 UC", price: 18950 }
      ]
    },
    mlbb: {
      name: "Mobile Legends: Bang Bang", icon: "⚔️", category: "mobile",
      currency: "Diamants", page: "mobile-games.html", anchor: "#mlbb",
      delivery: "5 minutes",
      tickets: [
        { id: "MLBB-086", label: "86 Diamants", price: 1325 },
        { id: "MLBB-172", label: "172 Diamants", price: 2475 },
        { id: "MLBB-257", label: "257 Diamants", price: 3750 },
        { id: "MLBB-336", label: "336 Diamants", price: 4500 },
        { id: "MLBB-570", label: "570 Diamants", price: 7725 },
        { id: "MLBB-716", label: "716 Diamants", price: 9225 },
        { id: "MLBB-1164", label: "1164 Diamants", price: 12875 }
      ]
    },
    genshin: {
      name: "Genshin Impact", icon: "💎", category: "mobile",
      currency: "Cristaux Genèse", page: "mobile-games.html", anchor: "#genshin",
      delivery: "5 minutes",
      tickets: [
        { id: "GI-060", label: "60 Cristaux Genèse", price: 800 },
        { id: "GI-330", label: "330 Cristaux Genèse", price: 3200 },
        { id: "GI-1090", label: "1 090 Cristaux Genèse", price: 9700 },
        { id: "GI-2240", label: "2 240 Cristaux Genèse", price: 19500 },
        { id: "GI-3880", label: "3 880 Cristaux Genèse", price: 32500 },
        { id: "GI-8080", label: "8 080 Cristaux Genèse", price: 65000 },
        { id: "GI-WLK", label: "Pass Bénédiction Lunaire", price: 3200 }
      ]
    },
    bleach: {
      name: "Bleach: Soul Resonance", icon: "🗡️", category: "mobile",
      currency: "Jade Spirituel", page: "mobile-games.html", anchor: "#bleach",
      delivery: "5 minutes",
      tickets: [
        { id: "BSR-060", label: "60 Jade Spirituel", price: 800 },
        { id: "BSR-330", label: "330 Jade Spirituel", price: 3200 },
        { id: "BSR-1080", label: "1 080 Jade Spirituel", price: 9700 },
        { id: "BSR-2180", label: "2 180 Jade Spirituel", price: 19500 },
        { id: "BSR-3680", label: "3 680 Jade Spirituel", price: 32500 },
        { id: "BSR-7480", label: "7 480 Jade Spirituel", price: 65000 },
        { id: "BSR-MNT", label: "Carte Mensuelle", price: 3200 },
        { id: "BSR-PT", label: "Phase Training (Pass de Combat)", price: 6450 } // vérifié via SEAGM ($8.15) x taux Apay (~790 FCFA/$, dérivé de la Carte Mensuelle)
      ]
    },

    // ---- Nouveaux (2026-07-02) — tarifs ESTIMÉS, à confirmer avant mise en ligne ----
    nintendo: {
      name: "Nintendo eShop", icon: "🍄", category: "giftcards",
      currency: "Carte eShop", page: "cartes-cadeaux.html", anchor: "#nintendo",
      delivery: "10 minutes", priceStatus: "estimate",
      tickets: [
        { id: "NIN-010", label: "eShop 10€", price: 7980 },
        { id: "NIN-020", label: "eShop 20€", price: 15760 },
        { id: "NIN-030", label: "eShop 30€", price: 23540 },
        { id: "NIN-050", label: "eShop 50€", price: 36200 },
        { id: "NIN-100", label: "eShop 100€", price: 72700 }
      ]
    },
    steam: {
      name: "Steam", icon: "🕹️", category: "giftcards",
      currency: "Portefeuille Steam", page: "cartes-cadeaux.html", anchor: "#steam",
      delivery: "10 minutes", priceStatus: "estimate",
      tickets: [
        { id: "STM-010", label: "Steam 10€", price: 7980 },
        { id: "STM-020", label: "Steam 20€", price: 15760 },
        { id: "STM-030", label: "Steam 30€", price: 23540 },
        { id: "STM-050", label: "Steam 50€", price: 36200 },
        { id: "STM-100", label: "Steam 100€", price: 72700 }
      ]
    },
    spotify: {
      name: "Spotify Premium", icon: "🎧", category: "streaming",
      currency: "Premium Individuel", page: "streaming.html", anchor: "#spotify",
      delivery: "5 minutes", priceStatus: "estimate",
      tickets: [
        { id: "SPT-01M", label: "Spotify 1 Mois", price: 2500 },
        { id: "SPT-03M", label: "Spotify 3 Mois", price: 7000 },
        { id: "SPT-12M", label: "Spotify 12 Mois", price: 25000 }
      ]
    },
    disney: {
      name: "Disney+", icon: "🏰", category: "streaming",
      currency: "Standard", page: "streaming.html", anchor: "#disney",
      delivery: "5 minutes", priceStatus: "estimate",
      tickets: [
        { id: "DNY-01M", label: "Disney+ 1 Mois", price: 3000 },
        { id: "DNY-03M", label: "Disney+ 3 Mois", price: 8500 },
        { id: "DNY-12M", label: "Disney+ 12 Mois", price: 32000 }
      ]
    },
    office: {
      name: "Microsoft Office", icon: "📄", category: "software",
      currency: "Licence", page: "logiciels.html", anchor: "#office",
      delivery: "10 minutes", priceStatus: "estimate",
      tickets: [
        { id: "OFC-M365P", label: "Microsoft 365 Personnel (1 an)", price: 15000 },
        { id: "OFC-M365F", label: "Microsoft 365 Famille (1 an)", price: 25000 },
        { id: "OFC-2024P", label: "Office 2024 Professionnel", price: 35000 }
      ]
    },
    adobe: {
      name: "Adobe Creative Cloud", icon: "🎨", category: "software",
      currency: "Abonnement", page: "logiciels.html", anchor: "#adobe",
      delivery: "10 minutes", priceStatus: "estimate",
      tickets: [
        { id: "ADB-01M", label: "Adobe CC 1 Mois", price: 8000 },
        { id: "ADB-03M", label: "Adobe CC 3 Mois", price: 20000 },
        { id: "ADB-12M", label: "Adobe CC 12 Mois", price: 65000 }
      ]
    },
    telegram: {
      name: "Vérification de compte Telegram", icon: "✈️", category: "services",
      currency: "Service", page: "services.html", anchor: "#telegram",
      delivery: "quelques minutes",
      tickets: [
        { id: "TLG-VRF", label: "Vérification compte Telegram", price: 1000 }
      ]
    }
  };

  // ---- Marques qu'APION reconnaît mais qui ne sont pas encore en boutique ----
  // (l'agent reste honnête : jamais de faux prix, juste une bascule vers WhatsApp)
  const KNOWN_NOT_LISTED = {
    crunchyroll:{ name: "Crunchyroll", icon: "🍥" },
    primevideo: { name: "Prime Video", icon: "📦" },
    windows:    { name: "Windows", icon: "🪟" },
    antivirus: { name: "Antivirus", icon: "🛡️" },
    canva:     { name: "Canva", icon: "✂️" }
  };

  const PAYMENT_METHODS = [
    { key: "mtn",    name: "MTN Mobile Money" },
    { key: "airtel", name: "Airtel Money" }
  ];

  // ---- Synonymes / alias -> clé canonique du catalogue ou de KNOWN_NOT_LISTED ----
  // Trié du plus long au plus court est géré dynamiquement dans le brain.
  const SYNONYMS = {
    // Free Fire
    "ff": "freefire", "free fire": "freefire", "freefire": "freefire",
    // PUBG Mobile
    "pubg": "pubgm", "pubgm": "pubgm", "pubg mobile": "pubgm",
    // Mobile Legends
    "ml": "mlbb", "mlbb": "mlbb", "mobile legends": "mlbb", "mobile legend": "mlbb",
    // Genshin
    "gi": "genshin", "genshin": "genshin", "genshin impact": "genshin",
    // Bleach
    "bleach": "bleach", "bsr": "bleach", "soul resonance": "bleach",
    // PlayStation
    "psn": "playstation", "ps": "playstation", "ps4": "playstation", "ps5": "playstation",
    "playstation": "playstation", "play station": "playstation",
    // Xbox
    "xbox": "xbox", "xbl": "xbox", "xbox live": "xbox",
    // Netflix
    "netflix": "netflix", "nflx": "netflix",
    // Marques connues mais non vendues
    "nintendo": "nintendo", "switch": "nintendo",
    "steam": "steam",
    "crunchyroll": "crunchyroll", "crunchy roll": "crunchyroll",
    "spotify": "spotify",
    "disney": "disney", "disney+": "disney", "disney plus": "disney",
    "prime video": "primevideo", "primevideo": "primevideo", "amazon prime": "primevideo",
    "windows": "windows",
    "office": "office", "microsoft office": "office", "word": "office", "excel": "office",
    "antivirus": "antivirus",
    "adobe": "adobe", "photoshop": "adobe", "illustrator": "adobe",
    "canva": "canva",
    // Telegram
    "telegram": "telegram", "tg": "telegram", "compte telegram": "telegram",
    "verification telegram": "telegram", "verifier telegram": "telegram"
  };

  const QUANTITY_WORDS = {
    "un": 1, "une": 1, "1": 1,
    "deux": 2, "2": 2,
    "trois": 3, "3": 3,
    "quatre": 4, "4": 4,
    "cinq": 5, "5": 5
  };

  const COPY = {
    greeting:
      "👋 Bonjour et bienvenue sur Apay.\nJe suis APION, le Gardien Numérique d'Apay.\nJe peux vous aider à trouver un produit et vous accompagner jusqu'au paiement, directement sur le site.\nQue recherchez-vous aujourd'hui ?",
    quickActionsIntro: "Vous pouvez aussi choisir directement :",
    thinkingLabel: "APION réfléchit…"
  };

  function getItem(key){ return CATALOG[key] || null; }
  function getCatalog(){ return CATALOG; }
  function getUnlisted(key){ return KNOWN_NOT_LISTED[key] || null; }
  function getPaymentMethods(){ return PAYMENT_METHODS; }
  function getSynonyms(){ return SYNONYMS; }
  function getQuantityWords(){ return QUANTITY_WORDS; }
  function getCopy(){ return COPY; }

  function formatPrice(n){
    return n.toLocaleString("fr-FR").replace(/\u202F|\u00A0/g, " ") + " FCFA";
  }

  return {
    getItem, getCatalog, getUnlisted, getPaymentMethods,
    getSynonyms, getQuantityWords, getCopy, formatPrice
  };
})();
