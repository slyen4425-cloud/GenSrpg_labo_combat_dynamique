# Labo Combat — consommation des huit nouvelles icônes Capture (2026-10-13)

## Propriétaires et références
- Médias : `global-assets@e55fea3b559c348be596d7c16250808a39c315a1` — huit WebP 128×128 réels, 8 nouveaux `assetId`, source/manifeste `capture_eight_skill_icons_v1.provenance.json`.
- Bibliothèque : `data/assets/catalog/global-visual-assets.v1.json`, 149 assets et 57 icônes.
- Consommateur : `gh-pages`. Base `eab6e5064f03510c7543952f0705360d887b6710`, checkpoint `checkpoint/lab-start-eight-skill-icons-consumer-v1-2026-10-13`, branche `work/lab-eight-skill-icons-consumer-v1-2026-10-13`.

## Modification minimale
- Révision cache `2026-10-13-v31-capture-eight-skill-icons` du résolveur global, sans duplication des assets.
- Mise à jour additive du test du rayon électrique : préserver le cache v30 ou ultérieur.
- Test de résolution des huit IDs par le résolveur et le presenter génériques.
- Page autonome de preview réelle : `examples/dom-demo/capture-eight-skill-icons-preview.html`.
- Les images sont chargées depuis les médias publiés, avec erreur visible si une image ne charge pas, sans image placeholder.

## Garde-fous
Aucune modification des compétences auteur, de leur identité et de leur icône attribuée, des règles de combat, FX, 2v2, créatures ou autres dépôts. Il n'existe pas de correspondance confirmée pour attribuer automatiquement chaque icône à un ID de compétence — elles sont sélectionnables par la bibliothèque.

## Validation
CI du SHA final et checkpoint GREEN avant fast-forward `gh-pages`. Vérifier CI et déploiement Pages du SHA de production. Contrôle visuel réel et lisibilité sur smartphone par l'utilisateur, distincts du GREEN technique.
