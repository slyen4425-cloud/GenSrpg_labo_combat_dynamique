# 2026-10-19 — Retouche griffe arrière Scarabacier

La vue joueur `scarabacier_player.webp`, précédemment corrigée en orientation,
comporte une petite griffe flottante et tronquée dans la partie inférieure gauche
de l'image. L'utilisateur a confirmé ce défaut.

## Portée et provenance

- Une seule image physique : `assets/library/capture/creatures/scarabacier/runtime/scarabacier_player.webp`.
- Vue adverse `scarabacier_opponent.webp` et icône `scarabacier_icon.webp` inchangées.
- Référence stable inchangée : `pack:capture:creature-scarabacier-player-01`.
- Base : `global-assets` à `8e1d09fce0debf5b3a5a6a95c86091a78a38845e`.
- Checkpoint début : `checkpoint/lab-start-scarabacier-claw-2026-10-19`.
- Branche isolée : `work/lab-scarabacier-claw-2026-10-19`.

## Retouche minimale

Le masque agit uniquement autour des pixels de la griffe flottante à gauche,
au bas de la patte arrière. Il ne faut pas régénérer la créature ni toucher à sa
morphologie, à son armure ou à sa tête. Le script
`scripts/repair_scarabacier_player_claw.py` valide le SHA256 exact du fichier
source et produit un WebP 1024×1024 doté de transparence alpha.

## Vérifications exigées

Contrôle réel de la signature WebP, alpha, dimensions et du masque supprimé ;
conservation de la patte et des autres vues, sentinelles existantes et
`npm run ci`. Publication du média binaire réel sur GitHub et vérification de
son SHA avant GREEN. Vérification visuelle utilisateur toujours distincte.

