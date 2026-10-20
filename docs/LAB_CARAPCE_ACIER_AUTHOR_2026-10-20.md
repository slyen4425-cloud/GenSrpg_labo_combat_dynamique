# Ajout de Carapace d'acier dans l'éditeur Capture — 20 octobre 2026

## Source autorisée
Export utilisateur `gensrpg-capture-skill-carapce_acier.json` SHA-256 `b9c51205f4dbf2c3c6c88dd86d2015fa4bcc99bc2ee86f12e7f925e2b752fad4`.

L'ID exact `carapce_acier` est conservé ; la fiche n'existait pas encore dans la vitrine active. L'enregistrement est ajouté au catalogue historique de presets, lequel alimente `configuredSkills` comme unique propriétaire.

## Paramètres de l'export (aucune modification)
- Nom : Carapace d acier, niveau 5, élément steel, catégorie buff_debuff, ciblage self.
- Préparation 2500 ms, coût 4, récupération 0, cooldown 30000 ms.
- Statut `status-1` positif, défense +500 points, durée 15000 ms, 1 stack et réactualisation.
- Sprite `pack:capture:sprite-steel-carapace-hold-01`, lecture hold-last.
- **Icône du fichier conservée** `pack:capture:icon-skill-armure-de-pointe-01`, malgré l'icône distincte Carapace d'acier également disponible. Ne pas modifier automatiquement.
- Aucun loadout ou association à Scarabacier ajoutée : la fiche reste une capacité indépendante à équiper dans l'éditeur.

## Fichiers et validation
- Autorité : `data/capture/showcase/carapce_acier.capture-skill-transfer-v1.json`
- Archive de provenance : `data/capture/source-exports/gensrpg-capture-skill-carapce_acier-2026-10-20.json`
- Liste de chargement : `src/catalogs/capture-showcase-skill-presets-v1.js`
- Sentinelle : `tests/unit/capture-carapce-acier-author-2026-10-20.test.mjs`
- Aucun nouveau média ; chaque asset cité est présent dans global-assets.
- CI, checkpoint et Pages doivent être vérifiés sur SHA exact avant GREEN.
