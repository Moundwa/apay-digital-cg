# Notifications WhatsApp automatiques

Le site envoie deux messages WhatsApp au client, depuis un **numéro dédié aux
notifications** (pas le WhatsApp habituel de la boutique, qui reste sur le téléphone) :

| Moment | Modèle Meta | Déclenché par |
|---|---|---|
| Paiement confirmé par OpenPay | `apay_paiement_recu` | callback / vérification OpenPay |
| Commande livrée | `apay_commande_livree` | bouton « Marquer livrée » du tableau de bord |

Le message n'est envoyé que si le client a donné un **numéro** (pas un email) comme
contact. Une erreur WhatsApp ne bloque jamais la commande : elle est affichée dans
le tableau de bord (ligne « WhatsApp client »).

Code : `api/_whatsapp.js`. Tant que les variables ci-dessous ne sont pas définies,
rien n'est envoyé.

## Variables d'environnement (Vercel → Production)

| Nom | Valeur |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | « Phone number ID » du numéro dédié (WhatsApp Manager / API Setup) |
| `WHATSAPP_TOKEN` | clé permanente d'un **utilisateur système** (Business Settings → System users), permissions `whatsapp_business_messaging` et `whatsapp_business_management` |
| `WHATSAPP_TEMPLATE_LANG` | facultatif, `fr` par défaut |

## Les deux modèles (catégorie **Utilitaire**, langue **Français**)

### `apay_paiement_recu`

Corps :

```
Bonjour ! Nous avons bien reçu votre paiement de {{1}} FCFA pour « {{2}} ».
Votre code de commande : {{3}}
Nous préparons votre commande et vous l'envoyons très vite.
Ce numéro envoie uniquement des notifications : pour nous écrire, contactez Apay Digital au +242 06 967 87 59.
```

Exemples pour Meta : `{{1}}` = `1 242`, `{{2}}` = `Free Fire 100 Diamants`, `{{3}}` = `AP-7K3Q9X`

Bouton « Visiter le site web », URL **dynamique** :
texte `Suivre ma commande`, URL `https://www.apay-digital-cg.store/suivi.html?code={{1}}`
(exemple : `https://www.apay-digital-cg.store/suivi.html?code=AP-7K3Q9X`)

### `apay_commande_livree`

Corps :

```
Votre commande {{1}} ({{2}}) a été livrée sur le contact indiqué.
Un souci avec votre code ? Écrivez à Apay Digital au +242 06 967 87 59 en donnant votre code de commande.
Merci pour votre confiance !
```

Exemples : `{{1}}` = `AP-7K3Q9X`, `{{2}}` = `Free Fire 100 Diamants`

Même bouton dynamique « Suivre ma commande » que ci-dessus.

## Coût

Meta facture chaque message « Utilitaire » envoyé (zone « Reste de l'Afrique » :
environ 0,004 $, soit 2 à 3 FCFA ; tarif exact dans WhatsApp Manager → Facturation).
