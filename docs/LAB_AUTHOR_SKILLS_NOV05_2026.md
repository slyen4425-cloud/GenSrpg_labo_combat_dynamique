# 5 novembre 2026 — Trois exports de compétences auteur

## Périmètre
Lot de données Capture uniquement, branche `work/lab-author-skills-coupe-sangsue-armure-2026-11-05` depuis `gh-pages@2d799658ed442ff75f92da157e46e29aa9839da2`. Aucun système de gameplay, autre labo, progression ou créature modifié.

La base courante contient déjà les trois IDs et chemins dans la liste officielle `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`; remplacer leurs **fichiers uniques** sans ajouter de doublon, sans modifier les archives historiques datées.

| ID | Fichier utilisateur | Taille | SHA-256 du fichier intégral |
|---|---|---|---|
| `coupe_feuille` | `gensrpg-capture-skill-coupe_feuille (1).json` | 4582 | `7012425c6f69d71b436453deb87c3ef33b4d75f5957762a4c4f711510ac60539` |
| `sangsue` | `gensrpg-capture-skill-sangsue.json` | 2509 | `5afcd8493028eec52736bc32cd6ba131295d550c6c30ebb8644bac8065d15502` |
| `armure-de-pointe` | `gensrpg-capture-skill-armure-de-pointe (1).json` | 3472 | `5dd9ff195ca6225af740dcc8118923bdd96856823464182d1e7cc90c3f5069bb` |

## Contenu auteur
- Coupe feuille : même rayon, dégâts 15, projectile clash 1, résistances ignorées 30%. Trois sons désormais liés aux étapes cast/travel/impact ; boucle uniquement pendant travel.
- Sangsue : contact au sol, 6 dégâts Nature chaque 1000ms et vol de vie 100%, niveau 15 inchangé. Ajoute icône et son d'impact.
- Armure de pointe : renvoie 100% des dégâts **contact** pendant 10s, niveau 5 et statut `status-1` inchangés. Ajoute audio et deux masques de ronces (dos et adversaire), `opponentAssetId` optionnel, décalages auteur 19/0 et -18/-30, `hold-last`.

## Validation
Tests dédiés : SHA exact des trois fichiers, IDs uniques, import Transfer, définition d'attaque et présentation. Les tests historiques du 21–30 octobre continuent de vérifier les **archives immuables**; seules les assertions décrivant l'ancien export actif sont mises à jour. CI 5/5 et déploiement public demandés avant GREEN.

Pas de changement à `global-assets` : tous les assetIds proviennent des bibliothèques existantes.
