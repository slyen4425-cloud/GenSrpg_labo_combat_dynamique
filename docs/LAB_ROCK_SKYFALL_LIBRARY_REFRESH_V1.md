# Bibliothèque visuelle : raccord du pack Chute de pierre
10 octobre 2026

- Catalogue canonique publié sur `global-assets`, SHA `268fa5fb09d09ad9f361792e66814f70a13e3310`. Deux nouveaux sprites additifs, `pack:capture:sprite-falling-rock-skyfall-01` (20 frames, travel) et `pack:capture:sprite-rock-impact-upward-01` (16 frames, impact), soit 121 assets dont 68 sprites.
- Basé sur `gh-pages` `651a884677b8cea902ed512d0834ebe796074e7d`, branche `work/lab-rock-skyfall-assets-refresh-v1-2026-10-10`, checkpoint `checkpoint/lab-start-rock-skyfall-assets-refresh-v1-2026-10-10`.
- Seule modification runtime : incrémenter le cache-buster de la bibliothèque existante vers `2026-10-10-v22-rock-skyfall-impact`. Aucune seconde bibliothèque, aucun changement du moteur V10 `skyfall`, des dégâts, des capacités créateur ni des 103 créatures.
- L'éditeur Capture utilise la résolution existante par `assetId`. Le nouvel asset peut être choisi dans le rôle projectile/travel, l'impact dans le rôle impact. Aucune assignation forcée à la compétence `cap_earth_atk_4`, laissée à la configuration de l'auteur.
- Tests de URLs et cache-buster ; garde historique Carapace 12f conservée mais sans verrouiller la révision sur son ancien numéro devenu obsolète. Node/Chromium et publication Pages seront validés sur SHA final. Test manuel Android requis pour validation graphique, distinct du GREEN technique.
