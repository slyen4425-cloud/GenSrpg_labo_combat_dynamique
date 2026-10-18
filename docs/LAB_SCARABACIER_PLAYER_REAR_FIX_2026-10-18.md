# Correction Scarabacier — vue arrière joueur — 2026-10-18

## Objet et limites
Remplacer exclusivement la vue de dos joueur de Scarabacier, dont la tête, le corps et les pattes ne respectaient pas une orientation logique pour le jeu. Aucun changement au moteur, au gameplay, à la vue face, à l'icône ou au catalogue.

## Image réellement livrée
- **Source** : planche PNG RGBA « scarab_mécanique_aux_lames_dorées.png » générée et visuellement vérifiée dans la conversation ; la vue corrigée est celle de droite.
- **Traitement** : isolement de la vue arrière de la planche sans inclure la vue face ni l'icône, redimensionnement de la silhouette et centrage sur toile 1024 × 1024 transparente, encodage WebP RGBA qualité 87.
- **Destination canonique** : `assets/library/capture/creatures/scarabacier/runtime/scarabacier_player.webp`.
- **Identifiant inchangé** : `pack:capture:creature-scarabacier-player-01`.
- **SHA-256 du WebP** : `1a36c39c1af33d649fba0e5f8ee4753bf011be3f2b0cbd76e6035ef9868b7c0d`.
- **SHA Git du blob WebP** : `bcc9a7585155bb7a3a3bf3795644af356a17f382`.
- **Dimensions/canal** : 1024 × 1024, WEBP VP8X, canal alpha réel.
- **Nombre de médias physiques remplacés** : 1. Aucun média ajouté.

## Gouvernance
- Base propriétaire `global-assets` : `65c62b35fc7a984605702d5ccc63481583873049`.
- Checkpoint origine : `checkpoint/lab-start-scarabacier-player-rear-fix-2026-10-18`.
- Branche isolée : `work/lab-scarabacier-player-rear-fix-2026-10-18`.
- Périmètre des fichiers : le seul WebP arrière de Scarabacier, la présente note et `docs/LAB_CURRENT_WORK.md`.
- Domaines protégés : vue face, icône, métadonnées et `assetId` existants, autres créatures, `gh-pages`, `main`, GenSrpG principal, règles de combat et FX.

## Validation
- Les octets WebP générés localement sont vérifiés (PIL, signature RIFF/WEBP, taille, canal alpha, SHA-256).
- Correspondance de l'objet Git avec `git hash-object` du véritable fichier local.
- La sentinelle de la bibliothèque des trois créatures vérifie la présence physique, le format WebP VP8X, le canal alpha, les dimensions et les références `assetId`.
- La CI sur la branche de correction doit être vérifiée avant le checkpoint final.
- Le rendu réel sur l'appareil du joueur est une validation complémentaire et n'est pas présenté comme réalisé.
