# Apay — Roadmap 2.1

Repo: [Moundwa/apay-digital-cg](https://github.com/Moundwa/apay-digital-cg)  
Règle: branche → tests manuels → preview Vercel → OK humain → merge `main`.  
Jamais de push direct sur `main`. Le store (catalogues, checkout, Mobile Money, APION) reste intouchable.

## Principe
- Le store tourne. On ne le casse pas.
- La charte s’applique **par-dessus** (`assets/apay-charte.css`), pas à la place de `style.css`.
- Une couche à la fois. Homepage d’abord. Hub et Pass plus tard.

## Fait (hors repo + socle)
- Charte visuelle 1.0
- Tokens CSS + deck applications (story, maillot, WhatsApp)
- Kakemono IFC 85×200 — QR `apay-digital-cg.store`, samedi 13 h – 16 h 45
- Maquettes homepage + portrait hero
- GitHub connecté (`Moundwa`)

## P0 — appliqué sur `feat/homepage-refonte` (cette livraison)
- Overlay charte `assets/apay-charte.css` (Ember CTA, accent Signal, motion 200 ms)
- `theme-color` → `#05070d` (`index.html` + `manifest.json`)
- Un seul CTA hero primaire : **Entrer dans l’univers** → `#categories`
- Header « Commander » et bandeau bas « Voir les produits » conservés
- Catalogues, checkout, tickets, widget APION : **non modifiés**

## P1 — ensuite (après merge P0)
- Même overlay sur pages catalogues (partenaires invités dans le cadre Apay)
- OG / meta alignés charte
- Pictos services (remplacer les emoji quand les fichiers sont validés)
- Horaires IFC sur un bloc Events dédié, si on l’ouvre

## P2 — parké
- Hub communautaire type Discord
- Pass Apay (battle pass + rewards)
- Territoire Future / formation

## Tests avant merge
1. Preview Vercel de la branche
2. CTA hero → scroll `#categories`
3. Commander un palier test (Mobile Money / APION) inchangé
4. Widget APION ouvre toujours
5. Mobile : un seul bouton Ember visible dans le hero
