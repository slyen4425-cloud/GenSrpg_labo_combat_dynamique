# Chute de pierre — pack de deux animations terrestres
10 octobre 2026

## Périmètre
- Deux animations visuelles nouvelles et addititives pour Capture : rocher descend du ciel (20 frames), puis éruption de roche qui remonte depuis le sol (16 frames).
- Media et catalogue détenus exclusivement par `global-assets`. Aucun effet sur dégâts, ciblage, règles, moteur projectile ou capacités existantes.
- Contrat déjà présent : `trajectoryMode="skyfall"` appartient au moteur de présentation V10 ; ne pas le dupliquer.
- IDs : `pack:capture:sprite-falling-rock-skyfall-01` (travel) et `pack:capture:sprite-rock-impact-upward-01` (impact), choisis dans l'éditeur de compétences par assetId.
- 36 WebP alpha 512×512 (sources agrandies depuis planches 1402×1122 et 1254×1254), atlas optimisés 384×384 par frame, `once`, 70 ms pour la descente et 75 ms pour l'impact.
- Les exports PNG masters/frames et les GIFs de prévisualisation sont disponibles dans l'archive utilisateur. La bibliothèque runtime déclare les WebP et atlas pour limiter le poids. Les sources originales ne sont pas des frames natives 512.
## Protocole
- Base `global-assets` `23d978a46b6ec7b4c1529d09fc231b312957567c` ; checkpoint `checkpoint/global-assets-before-rock-skyfall-vfx-pack-v1-2026-10-10` ; travail `work/global-assets-rock-skyfall-vfx-pack-v1-2026-10-10`.
- Déclaration de périmètre dans `LAB_CURRENT_WORK.md` avant intégration des assets.
- Revue : seulement deux dossiers de skills, catalogue, sentinelle, rapport, journal ; rien dans `Zombicide-40k`, main ni Exploration.
- Vérification requise : Node sentinelle des 36 frames/2 atlas, catalogue unique, suite laboratoire CI, publication fast-forward sans force et checkpoint GREEN sur SHA exact. Rafraîchissement du catalogue dans `gh-pages` par branche labo distincte et CI navigateur puis Pages.
- Validation graphique/tactile en situation de combat restant à confirmer par l'utilisateur.
