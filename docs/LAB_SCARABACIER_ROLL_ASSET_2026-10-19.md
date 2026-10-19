# Scarabacier — animation boule roulante (test asset) — 2026-10-19

## But et provenance
Premier test de l'apparence boule roulante de Scarabacier pendant son déplacement.
Planche artistique générée dans la conversation, source 1254×1254, grille 4×4.
16 PNG RGBA 512×512 obtenus par découpe et redimensionnement (taille non native).
Archive déposée par l'utilisateur : `_incoming/scarabacier_roll_frames_16_ready.zip`.
SHA256 exact de l'archive : `e082f9da7d8eb5604d2e3b2e1177808ae53f9408cb644ec9e4659e0564c631e4`.

## Livrables
- Propriétaire : Capture Visual Asset Input, bibliothèque `global-assets`.
- 16 PNG originaux de l'archive conservés octet pour octet.
- 1 atlas WebP RGBA 6144×384 composé de 16 cellules 384×384.
- 1 manifeste de provenance et hashes SHA256 frame/atlas.
- AssetId unique : `pack:capture:creature-scarabacier-roll-01` dans le catalogue existant.
- Animation destinée à tourner en boucle pendant le déplacement (85 ms/frame par défaut, réglage futur).
- Pas de modification aux images face, dos et icône de Scarabacier.

## Gouvernance et limites
- Base : `675760e54b1e53207ceff4f1be941c4d8826516d`.
- Départ : `checkpoint/lab-start-scarabacier-roll-sprite-2026-10-19`.
- Travail : `work/lab-scarabacier-roll-sprite-2026-10-19`.
- `main`, `gh-pages`, GenSrpG principal, gameplay, moteur combat et éditeur protégés.
- Il s'agit du lot média uniquement : l'activation automatique du sprite pendant un mouvement est une validation runtime séparée.

## Contrôles
ZIP SHA256 + CRC, 16 PNG RGBA distincts 512×512, alpha, atlas réel avec transparence,
catalogue autoritaire sans doublons, tests sentinelles et CI GitHub.
Aucun statut GREEN si les fichiers réels n'ont pas été committés et vérifiés.
Preview et ressenti visuel sur smartphone à confirmer par l'utilisateur.
