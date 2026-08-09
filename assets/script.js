// ===================== APAY DIGITAL — script.js =====================
const WA_NUMBER = "242069678759";

// Single source of truth for per-product visuals/accents — reused by the
// tab system below AND by APION (assets/apion-*.js), so a product only
// ever needs to be described in one place.
const GAME_META = {
  freefire: { name: "Free Fire",              icon: "🔥",  img: "assets/img/freefire-art.jpg", glow: "rgba(255,106,57,0.35)",  a: "#FF6A39", b: "#5FA3FF", cat: "mobile" },
  pubgm:    { name: "PUBG Mobile",             icon: "🎯",  img: "assets/img/pubgm-art.jpg",    glow: "rgba(155,178,140,0.35)", a: "#9BAE7A", b: "#5FA3FF", cat: "mobile" },
  mlbb:     { name: "Mobile Legends",          icon: "⚔️", img: "assets/img/mlbb-art.jpg",     glow: "rgba(139,107,255,0.35)", a: "#8B6BFF", b: "#5FA3FF", cat: "mobile" },
  genshin:  { name: "Genshin Impact",          icon: "💎",  img: "assets/img/genshin-art.jpg",  glow: "rgba(242,201,76,0.35)",  a: "#F2C94C", b: "#6FD8FF", cat: "mobile" },
  bleach:   { name: "Bleach: Soul Resonance",  icon: "🗡️", img: "assets/img/bleach-art.jpg",   glow: "rgba(229,72,77,0.35)",   a: "#E5484D", b: "#5FA3FF", cat: "mobile" },
  playstation: { name: "PlayStation",          icon: "🎮",  img: "assets/img/playstation-art.jpg", glow: "rgba(0,112,209,0.35)", a: "#0070D1", b: "#5FA3FF", cat: "giftcards" },
  xbox:        { name: "Xbox",                 icon: "🟢",  img: "assets/img/xbox-art.jpg",        glow: "rgba(16,124,16,0.35)", a: "#107C10", b: "#5FA3FF", cat: "giftcards" },
  netflix:     { name: "Netflix",               icon: "📺", img: "assets/img/netflix-art.jpg",     glow: "rgba(229,9,20,0.35)",  a: "#E50914", b: "#5FA3FF", cat: "streaming" },
  // ---- Nouveaux (2026-07-02) — visuels provisoires (SVG), à remplacer par les vrais artworks ----
  nintendo: { name: "Nintendo eShop",  icon: "🍄",  img: "assets/img/nintendo-art.jpg", glow: "rgba(230,0,18,0.35)",   a: "#E60012", b: "#5FA3FF", cat: "giftcards" },
  steam:    { name: "Steam",           icon: "🕹️", img: "assets/img/steam-art.jpg",    glow: "rgba(102,192,244,0.35)", a: "#66C0F4", b: "#5FA3FF", cat: "giftcards" },
  spotify:  { name: "Spotify Premium", icon: "🎧",  img: "assets/img/spotify-art.jpg",  glow: "rgba(29,185,84,0.35)",  a: "#1DB954", b: "#5FA3FF", cat: "streaming" },
  disney:   { name: "Disney+",         icon: "🏰",  img: "assets/img/disney-art.jpg",   glow: "rgba(61,142,247,0.35)", a: "#3D8EF7", b: "#5FA3FF", cat: "streaming" },
  office:   { name: "Microsoft Office",icon: "📄",  img: "assets/img/office-art.jpg",   glow: "rgba(234,62,35,0.35)",  a: "#EA3E23", b: "#5FA3FF", cat: "software" },
  adobe:    { name: "Adobe Creative Cloud", icon: "🎨", img: "assets/img/adobe-art.jpg", glow: "rgba(255,51,102,0.35)", a: "#FF3366", b: "#5FA3FF", cat: "software" }
};
window.APAY_GAME_META = GAME_META;

function waLink(message){
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

// notifies APION's chat UI of what the visitor is currently looking at
function notifyApionContext(id){
  const meta = GAME_META[id];
  if (!meta) return;
  window.dispatchEvent(new CustomEvent("apion:page-context", {
    detail: { id, name: meta.name, category: meta.cat }
  }));
}

// ---- mobile nav ----
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
    });
  }

  // on mobile, tap to open dropdown instead of hover
  document.querySelectorAll(".has-dropdown > a").forEach((link) => {
    link.addEventListener("click", (e) => {
      if (window.innerWidth <= 980) {
        e.preventDefault();
        link.parentElement.classList.toggle("open");
      }
    });
  });

  // ---- game tabs (mobile-games.html, cartes-cadeaux.html) ----
  const tabBtns = document.querySelectorAll(".tab-btn");
  const panels = document.querySelectorAll(".tab-panel");
  const apionWidget = document.getElementById("apionWidget");
  const apionFloat = document.getElementById("apionFloat");

  const hgvImg = document.getElementById("hgvImg");
  const hgvGlow = document.getElementById("hgvGlow");
  const hgvChip = document.getElementById("hgvChip");
  const hgvName = document.getElementById("hgvName");
  const hgvCard = document.querySelector(".hgv-card");

  function updateHeroVisual(id){
    const meta = GAME_META[id];
    if (!meta || !hgvImg) return;
    hgvImg.classList.add("hgv-fading");
    setTimeout(() => {
      hgvImg.src = meta.img;
      hgvImg.alt = meta.name;
      hgvImg.classList.remove("hgv-fading");
    }, 220);
    if (hgvGlow) hgvGlow.style.background = `radial-gradient(circle at 50% 45%, ${meta.glow}, transparent 65%)`;
    if (hgvChip) hgvChip.querySelector(".hgv-chip-icon").textContent = meta.icon;
    if (hgvName) hgvName.textContent = meta.name;

    // brief blue halo pulse on the card to mark the update
    if (hgvCard) {
      hgvCard.classList.add("hgv-pulse");
      setTimeout(() => hgvCard.classList.remove("hgv-pulse"), 700);
    }
  }

  let apionAccentTimer;
  function updateApionAccent(id){
    const meta = GAME_META[id];
    if (!meta || !apionWidget) return;
    // briefly switch to the game's colors, then ease back to Apion's usual blue
    apionWidget.style.setProperty("--apion-a", meta.a);
    apionWidget.style.setProperty("--apion-b", meta.b);
    apionWidget.classList.add("apion-flash");
    clearTimeout(apionAccentTimer);
    apionAccentTimer = setTimeout(() => {
      apionWidget.style.setProperty("--apion-a", "var(--azure)");
      apionWidget.style.setProperty("--apion-b", "var(--azure-2)");
      apionWidget.classList.remove("apion-flash");
    }, 1500);
  }

  if (tabBtns.length) {
    let switching = false;
    function activate(id, animate) {
      const newPanel = document.getElementById(id);
      const oldPanel = document.querySelector(".tab-panel.active");
      if (!newPanel || newPanel === oldPanel || switching) return;
      switching = true;

      tabBtns.forEach((b) => b.classList.toggle("active", b.dataset.tab === id));

      const showNew = () => {
        newPanel.style.display = "block";
        newPanel.classList.add("tp-enter");
        void newPanel.offsetWidth; // force reflow
        requestAnimationFrame(() => {
          newPanel.classList.add("active");
          newPanel.classList.remove("tp-enter");
          switching = false;
        });
      };

      if (oldPanel && animate) {
        oldPanel.classList.add("tp-leave");
        oldPanel.classList.remove("active");
        setTimeout(() => {
          oldPanel.classList.remove("tp-leave");
          oldPanel.style.display = "none";
          showNew();
        }, 260);
      } else {
        if (oldPanel) { oldPanel.classList.remove("active"); oldPanel.style.display = "none"; }
        showNew();
      }

      updateHeroVisual(id);
      updateApionAccent(id);
      notifyApionContext(id);
    }
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        activate(btn.dataset.tab, true);
        history.replaceState(null, "", "#" + btn.dataset.tab);
      });
    });
    const hash = window.location.hash.replace("#", "");
    if (hash && document.getElementById(hash)) {
      activate(hash, false);
    } else {
      const initialPanel = document.querySelector(".tab-panel.active");
      const initialId = initialPanel ? initialPanel.id : null;
      if (initialId && GAME_META[initialId]) {
        updateHeroVisual(initialId);
        updateApionAccent(initialId);
        notifyApionContext(initialId);
      }
    }
  } else if (document.body.dataset.apionPage === "streaming") {
    // streaming.html has a single product (Netflix), no tabs to click
    notifyApionContext("netflix");
  }

  // ---- Apion idle bubble (hover preview before the chat is opened) ----
  if (apionWidget && apionFloat) {
    const IDLE_DELAY = 30000;
    let idleTimer;
    function scheduleIdleBubble(){
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!apionWidget.classList.contains("ap-open")) {
          apionWidget.classList.add("show-bubble");
        }
      }, IDLE_DELAY);
    }
    function dismissIdleBubble(){
      apionWidget.classList.remove("show-bubble");
      scheduleIdleBubble();
    }
    document.addEventListener("click", (e) => {
      if (e.target.closest(".af-close")) return; // handled separately
      dismissIdleBubble();
    });
    const closeBtn = document.querySelector("#afBubble .af-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        dismissIdleBubble();
      });
    }
    scheduleIdleBubble();
  }
});
