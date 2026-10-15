# Capture — Bulle de feu expansive (20 frames) — Pack visuel V1

Date : 2026-10-15.

## Objectif

Ajouter un FX pur représentant une sphère de flammes qui enfle autour du lanceur puis s'étend dans l'arène. Animation non directionnelle et utilisable visuellement pour des ennemis au sol comme en l'air ; **les collisions, les dégâts et les catégories de cibles appartiennent au moteur de règles, pas au sprite**.

## Gouvernance

- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Propriétaire des ressources visuelles Capture : `global-assets`.
- Base SHA : `e55fea3b559c348be596d7c16250808a39c315a1`.
- Départ : `checkpoint/global-assets-before-fire-bubble-expansion-v1-2026-10-15`.
- Travail : `work/global-assets-fire-bubble-expansion-v1-2026-10-15`.
- Aucun changement de `main`, du dépôt `Zombicide-40k` ou des règles de combat.

## Fichiers et source

- Source générée : `explosion_de_feu_en_20_images.png`, RGBA **1402×1122**, 5 colonnes × 4 rangées, SHA-256 `328b6dc5015054618010c17a69a48df113f3a4965f55d77f5e6e12a60d20b42a`.
- Extraction ordonnée ligne par ligne, hors séparations ; suppression des résidus de bord par léger fondu alpha (5 px).
- 20 WebP RGBA 512×512 individuels dans `assets/library/capture/sprites/skills/fire_bubble_expansion/frames/`.
- Atlas WebP transparent en bande horizontale de **7680×384** (20 cellules 384×384) dans `atlases/`.
- Manifeste `sprite_skill_fire_bubble_expansion_sequence.json` et provenance CSV.
- Source : chaque case initiale est proche de 280×280 ; les 512×512 sont **agrandies**, elles ne sont pas natives 512 px. Les PNG RGBA individuels de sauvegarde restent dans l'archive locale.

## Raccord visuel

- Identifiant : `pack:capture:sprite-fire-bubble-expansion-01`.
- Catalogue unique : `data/assets/catalog/global-visual-assets.v1.json`.
- `resource.format = sprite-strip`, 20 frames, 80 ms/frame indicatifs, `once` (1,6 s), paramétrage runtime conservé.
- Pas de nouvelle compétence, pas de mécanisme de projectile ajouté, pas d'altération d'un autre FX.

## Vérification

- Sentinelle : `tests/unit/capture-fire-bubble-expansion-assets-v1.test.mjs`.
- Contrôles prévus : 20 fichiers, WebP + alpha, résolution 512×512, ordre, atlas 7680×384, ID unique, compteurs catalogue, tests du laboratoire et CI.
- Aucune validation mobile manuelle revendiquée avant retour utilisateur.