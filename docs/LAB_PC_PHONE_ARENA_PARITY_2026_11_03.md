# Lot 2026-11-03 — parité proportions arène téléphone/PC
Base gh-pages 114cd8a3d3ce26e0d8a931f5c712f861b8c02114; START checkpoint/lab-start-pc-phone-arena-parity-2026-11-03; WORK work/lab-pc-phone-arena-parity-2026-11-03.
Signal auteur : rendu téléphone paysage validé; créatures ennemies décollées sur PC.
Cause : la scène 16:9 grandit, mais largeur des slots min(Ndvh,Mrem) plafonnée sur PC. Leurs positions top/left restent proportionnelles à l'arène.
Objectif : conserver N téléphone (player29, ally27, opponent31, opponent-b30; en 2v2 opponent24, opponent-b23) et projeter en largeur d'arène 16:9: N * 9 /16 % (pas de plafond px ni dépendance viewport). Ne pas toucher les coordonnées, displayScale auteur, apparences, masque/ombres, moteur Combat, énergie, dégâts, catalogue, main, exploration ou GenSRPG.
Périmètre : CSS propriétaire examples/dom-demo/capture-editor-v2.css ; tests unitaires sentinelles + nouveau test; un navigateur Chromium avec template et CSS natifs sur tailles mobile/PC en 1v1/2v2, intégré au workflow CI; invalidation cache CSS d'entrée si nécessaire; docs courant/lot.
Étapes : TDD RED, correction CSS unique, vraie géométrie Chromium; CI Foundation + 4 jobs Chromium sur SHA final, checkpoint GREEN, PR gh-pages, CI + Pages sur SHA fusion. Validation artistique sur téléphone physique par auteur séparée.
