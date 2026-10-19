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


## Résultat contrôlé

- Source Git WebP avant retouche : blob `bcc9a7585155bb7a3a3bf3795644af356a17f382` ; SHA256 `1a36c39c1af33d649fba0e5f8ee4753bf011be3f2b0cbd76e6035ef9868b7c0d`.
- WebP corrigé réel : blob `6c9d564d1e0347db4f9941b92856fa1eabdfdc88`, 217104 octets, SHA256 `2f6475c0b2b26be1fe67aaaa93c2d34bcc319fab2d181aa6e3fabe77d2e505a3`.
- Fichier inchangé en dimensions (1024×1024), canal alpha conservé, une image physique remplacée.
- Vérification source stricte et contour de griffe après traitement avec Pillow, sans conversion du reste du modèle ; workflow de réparation `39206148362` conclu SUCCESS.
- Test permanent `tests/unit/scarabacier-player-claw-repair-2026-10-19.test.mjs`, vérifiant le contenu binaire exact, et sentinelle historique des trois créatures.
- Workflow de conversion ponctuelle retiré après succès ; script de provenance reproductible conservé.
- Le modèle de face, l’icône, les métadonnées et le catalogue autoritaire n'ont pas été changés.
- **Limite** : rendu en combat sur smartphone non revendiqué ; validation visuelle finale utilisateur distincte.
