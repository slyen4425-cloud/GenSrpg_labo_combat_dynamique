# 8 icônes épurées Monster Capture — intégration Capture du 17 octobre 2026

- Propriétaire : `global-assets` du laboratoire `GenSrpg_labo_combat_dynamique`.
- Base stable au départ : `ed6144ab7a93bd661bb6a60fa47d901eb71fef72`. Branche du lot : `work/lab-capture-simple-icons-2026-10-17`. Checkpoint : `checkpoint/lab-start-capture-simple-icons-2026-10-17`.
- Médias originaux : huit vrais PNG RGBA 1254 × 1254 générés dans ChatGPT puis validés comme version simplifiée. Images réelles inspectées visuellement aux échelles 128 et 48.
- Export de la bibliothèque : huit **vrais WebP RGBA transparents** en 128 × 128, Pillow LANCZOS qualité 15 (cohérent avec les précédentes icônes légères 128 × 128 du labo), déposés avec les icônes de compétences dans `assets/library/capture/icons/skills/`.
- Source de vérité unique : `data/assets/catalog/global-visual-assets.v1.json`, exactement 8 nouvelles entrées `pack:capture:icon-skill-*-01`, par `assetId`, catégorie `skill`, avec tags de `status/debuff` selon le sujet.
- Les anciennes icônes, notamment **Fleuraison énergie**, restent inchangées ; la nouvelle **Fleuraison** possède son propre `assetId` et son fichier. Aucun gameplay, dégât ou état de compétence n'est défini par l'image.
- Manifeste de provenance : `assets/library/capture/icons/skills/capture_simple_icons_2026_10_17.provenance.json`, avec SHA-256 des sources, SHA-256 et identifiant Git blob des exportés, dimensions et taille de chaque image.
- Sentinelle obligatoire : `tests/unit/capture-simple-icons-2026-10-17.test.mjs` (vrais octets binaires, transparence, dimensions, SHA-256/Git, absence de collision catalogue et liens vers médias).
- CI : `npm run ci`, statut à confirmer après commit.
- Publication dans `global-assets` après CI GREEN et contrôle des changements concurrents uniquement. `main` et `Zombicide-40k` non touchés.
- Vérification manuelle réelle en éditeur/jeu Capture sur smartphone : reste à valider par utilisateur ; le catalogage n'est pas une preuve du fonctionnement complet en combat.
