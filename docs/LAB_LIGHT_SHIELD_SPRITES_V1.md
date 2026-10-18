# Bouclier de lumière — Sprite Cast et Barrière (2026-10-17)

## Sources et réalisation
Deux planches générées dans la conversation utilisateur (PNG RGBA 1402x1122, grilles 5x4).
Export de 40 vrais PNG RGBA 512x512 et 2 atlas WebP 7680x384; cadre source
d'environ 280x280 agrandi en 512x512, pas natif. Le contenu et la frame 20 ont
été inspectés visuellement avant export; le ZIP réel est vérifié lors de l'import.

## Identification
- Cast: pack:capture:sprite-light-shield-cast-01 (release, 20 x 70ms).
- Barrière: pack:capture:sprite-light-shield-barrier-01 (skill, 20 x 80ms).
- La dernière frame de la barrière est une image complète à figer : manifeste
  hold_last_frame=true (index 19); le renderer interprète normalement
  playbackMode=once, et le réglage garder dernière frame du skill reste configurable.
- Propriétaire canonique: global-assets, catalogue global-visual-assets.v1.json.
- Ressources: assets/library/capture/sprites/skills/light_shield/
- Aucune nouvelle règle gameplay; ne pas remplacer les autres sorts.

## Gouvernance
Checkpoint initial checkpoint/lab-start-light-shield-sprites-2026-10-17,
base a4f8604d339ecc8ab4951d6affa92a6a57f0a698,
branche work/lab-light-shield-sprites-2026-10-17.
Automate d'import et sentinelle capture-light-shield-assets-v1.test.mjs.
Après import et CI, le comportement réel de l'option garder la dernière frame
dans l'éditeur Combat doit encore être confirmé en preview mobile.
