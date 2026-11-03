# Lot 2026-11-03 — parité proportions arène téléphone/PC
Base gh-pages 114cd8a3d3ce26e0d8a931f5c712f861b8c02114; START checkpoint/lab-start-pc-phone-arena-parity-2026-11-03; WORK work/lab-pc-phone-arena-parity-2026-11-03.
Signal auteur : rendu téléphone paysage validé; créatures ennemies décollées sur PC.
Cause : la scène 16:9 grandit, mais largeur des slots min(Ndvh,Mrem) plafonnée sur PC. Leurs positions top/left restent proportionnelles à l'arène.
Objectif : conserver N téléphone (player29, ally27, opponent31, opponent-b30; en 2v2 opponent24, opponent-b23) et projeter en largeur d'arène 16:9: N * 9 /16 % (pas de plafond px ni dépendance viewport). Ne pas toucher les coordonnées, displayScale auteur, apparences, masque/ombres, moteur Combat, énergie, dégâts, catalogue, main, exploration ou GenSRPG.
Périmètre : CSS propriétaire examples/dom-demo/capture-editor-v2.css ; tests unitaires sentinelles + nouveau test; un navigateur Chromium avec template et CSS natifs sur tailles mobile/PC en 1v1/2v2, intégré au workflow CI; invalidation cache CSS d'entrée si nécessaire; docs courant/lot.
Étapes : TDD RED, correction CSS unique, vraie géométrie Chromium; CI Foundation + 4 jobs Chromium sur SHA final, checkpoint GREEN, PR gh-pages, CI + Pages sur SHA fusion. Validation artistique sur téléphone physique par auteur séparée.

## Résultat du lot
- Reproduction TDD RED : `21d02d76578b16591442c87abc1a4bf911723504`, CI `41629358286`, échec sur la largeur mobile plafonnée `min(Ndvh,Mrem)` (ancien comportement).
- Correctif : six règles CSS paysage converties en fractions exactes de l'arène 16:9 : joueur 16.3125 %, allié 15.1875 %, adverse 17.4375 %, adverse B 16.875 % ; en 2v2 adverse 13.5 %, adverse B 12.9375 %. Toutes les positions X/Y et le displayScale auteur sont **strictement inchangés**.
- Sentinelles anciennes des positions 1v1 et 2v2 ajustées à ces valeurs; elles continuent de contrôler les mêmes top/left, le nombre réel d'actifs et l'absence de nouveaux transforms.
- Le test Chromium `tests/browser/capture-pc-phone-arena-parity-smoke.mjs` emploie directement le `<template data-capture-preview-template>` du vrai éditeur et ses deux CSS publiés. Il compare la largeur normalisée, les centres X/Y et le bas du conteneur d'image pour tous les acteurs en 1v1 et 2v2 sur fenêtre paysage téléphone 900×400 et PC 1920×1080. La géométrie réelle du rendu headless varie selon sa fenêtre interne : arènes observées env. 556×313 et 1765×993; 1v1 **PASS**, 2v2 **PASS**.
- CI technique pré-documentation du code `7db2bd0ed03e091493c31d220eeefe09956fc580` : run **41630257449**, 5/5 SUCCESS (Foundation + 4 suites Chromium dont vraie parité mobile/PC). Le test est dans le job mobile plutôt que rajouté en fin de long parcours, sans masquer une autre sentinelle.
- Version CSS `?v=phone-pc-arena-parity-20261103` demandée au navigateur. Pas de JS runtime, d'asset, de catalogue ou de règle gameplay supplémentaire.
- Après synchronisation du journal canonique, exiger CI finale sur SHA exact, checkpoint `checkpoint/lab-pc-phone-arena-parity-green-2026-11-03`, PR gh-pages, CI post-fusion et déploiement Pages. Test artistique sur téléphone physique par l'auteur reste distinct.
