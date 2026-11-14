// Génère api/_catalog.js (la liste de prix utilisée par le serveur) à partir de
// assets/apion-data.js, et vérifie que les boutons "Commander" des pages HTML
// ont bien le même code produit et le même prix.
//
// À lancer après CHAQUE modification de prix ou de produit :
//   node scripts/build-catalog.js
//
// Le serveur ne fait JAMAIS confiance au prix envoyé par le navigateur :
// il relit le prix dans api/_catalog.js à partir du code produit (ex. "FF-100").

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PAGES = ["cartes-cadeaux.html", "logiciels.html", "mobile-games.html", "services.html", "streaming.html"];

const dataSrc = fs.readFileSync(path.join(ROOT, "assets/apion-data.js"), "utf8");
const catalog = new Function(dataSrc + ";return ApionData;")().getCatalog();

const byId = {};
for (const item of Object.values(catalog)) {
  for (const t of item.tickets) {
    if (!t.id) throw new Error(`Produit sans code dans apion-data.js : ${item.name} / ${t.label}`);
    if (byId[t.id]) throw new Error(`Code produit en double : ${t.id}`);
    byId[t.id] = { label: `${item.name} — ${t.label}`, price: t.price, mobile: item.category === "mobile" };
  }
}

// Vérifie les boutons des pages et reprend leur libellé (plus lisible sur Telegram).
const errors = [];
const seen = new Set();
const re = /(orderItem|openOrderModal)\('([^']*)','([^']*)','([^']*)'\)/g;
for (const page of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, page), "utf8");
  let m;
  while ((m = re.exec(html))) {
    const [, fn, label, priceStr, id] = m;
    const price = parseInt(priceStr.replace(/\D/g, ""), 10);
    const entry = byId[id];
    if (!entry) { errors.push(`${page} : code inconnu ${id}`); continue; }
    if (entry.price !== price) errors.push(`${page} : ${id} affiché ${price} FCFA mais ${entry.price} FCFA dans apion-data.js`);
    if ((fn === "openOrderModal") !== entry.mobile) errors.push(`${page} : ${id} utilise ${fn} mais sa catégorie ne correspond pas`);
    entry.label = label;
    seen.add(id);
  }
}
for (const id of Object.keys(byId)) if (!seen.has(id)) errors.push(`${id} n'a aucun bouton "Commander" sur les pages`);

if (errors.length) {
  console.error("Catalogue incohérent :\n- " + errors.join("\n- "));
  process.exit(1);
}

const out =
  "// FICHIER GÉNÉRÉ par scripts/build-catalog.js — ne pas modifier à la main.\n" +
  "// Prix de référence côté serveur, en FCFA (hors taxe jeux mobile).\n" +
  "module.exports = " + JSON.stringify(byId, null, 2) + ";\n";
fs.writeFileSync(path.join(ROOT, "api/_catalog.js"), out);
console.log(`api/_catalog.js généré : ${Object.keys(byId).length} produits.`);
