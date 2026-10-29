# Capture — Défense florale (12f), bibliothèque visuelle
Date : 2026-10-28.

## Traçabilité et autorité
- Branche autoritaire finale : `global-assets`; travail : `work/lab-fleur-defense-vfx-2026-10-28`.
- Source originale déposée : `assets/library/capture/sprites/skills/fleur_defense_12_frames_512.zip` (Git blob `5f3bb2b288f8fdc4dc9c22bb474dfce13bb9b3c4`, SHA-256 `653c5012f182931b4add1bef4641ab8837e749358236dba6b33d5ed0c70f9169`).
- Le workflow d'import original déjà exécuté avec succès [#40773353976](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/40773353976) a contrôlé les 12 PNG RGBA originaux 512×512, leurs empreintes, le WebP animé et la correspondance pixel des frames avec l'atlas.
- Les 18 blobs Git réels de ce chantier proviennent **inchangés** de ce résultat, sans nouvelle génération ni seconde importation.
- Un seul assetId canonique : `pack:capture:sprite-fleur-defense-01`. Fichier : `capture/sprites/skills/fleur_defense/fleur_defense_atlas_12f.webp`.
- 12 PNG RGBA + 1 atlas WebP lossless 6144×512 + 1 preview WebP animée + 1 planche PNG + 1 manifeste + 1 séquence JSON + 1 provenance JSON = **18 fichiers** sous `assets/library/capture/sprites/skills/fleur_defense/`.
- Définition de présentation : once, 12 frames, maintien demandé de la frame finale jusqu'à la fin du buff. Le gameplay et l'activation de la capacité sont pilotés par le runtime, pas par la bibliothèque de médias.
- Le ZIP est conservé dans l'historique Git ; pas de doublon dans la bibliothèque finale.
- La source a des résidus graphiques mentionnés dans le fil ; leur suppression n'est pas simulée. Validation artistique finale par l'utilisateur distincte de la disponibilité technique.
- Le fichier Spore soporifique est traité séparément sur `gh-pages` via PR #128 ; aucune copie de cette compétence n'est conservée sur `global-assets`.
- Périmètre protégé : `main`, `gh-pages`, le gameplay, les autres créatures et sprites.
- CI complète, revue du diff, checkpoint GREEN et publication fast-forward indispensables avant de déclarer fini.
