# GORICE — 4 ANIMATIONS OFFICIELLES, COPIES BINAIRES DE RÉFÉRENCE

**Référence de mouvement pour le standard GORILLE, pas une copie de l'apparence à réutiliser.**

Les 4 atlas WebP sont des strips horizontaux de 12 cellules, **512×512 par frame (6144×512 au total)**. Les quatre vraies previews animées 12 images sont également conservées, ainsi que les 2 GIF de déplacement, 2 planches de contrôle des attaques et les quatre manifestes originaux.

| Séquence | Vue | Atlas officiel | Prévisualisation animée | Images | Lecture |
|---|---|---|---|---:|---|
| Déplacement | DOS / joueur | [deplacement_dos_12f.webp](deplacement_dos_12f.webp) | [deplacement_dos_preview.webp](deplacement_dos_preview.webp) | 12 | Boucle |
| Déplacement | FACE / adversaire | [deplacement_face_12f.webp](deplacement_face_12f.webp) | [deplacement_face_preview.webp](deplacement_face_preview.webp) | 12 | Boucle |
| Charge / canalisation | DOS / joueur | [charge_dos_12f.webp](charge_dos_12f.webp) | [charge_dos_preview.webp](charge_dos_preview.webp) | 12 | Une fois, frame 12 maintenue |
| Charge / canalisation | FACE / adversaire | [charge_face_12f.webp](charge_face_12f.webp) | [charge_face_preview.webp](charge_face_preview.webp) | 12 | Une fois, frame 12 maintenue |

**Fichiers additionnels** : `deplacement_{dos,face}_preview.gif`, `charge_{dos,face}_planche.png`, les quatre `*.source-manifest.json` et [manifest.json](manifest.json).

**Provenance officielle :** [déplacement PR #219](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/pull/219), [charge dos PR #211](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/pull/211), [charge face PR #214](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/pull/214). Les copies ont les **mêmes identifiants de blobs Git** que leurs originaux sur `global-assets` ; aucun sprite n'est généré.

## Particularités importantes, fidèles aux originaux

- Le déplacement joueur a **11 frames à 130 ms, dernière frame à 400 ms** ; le déplacement adverse a **12 frames à 110 ms**. Ces pauses sont documentées, **pas** à reproduire automatiquement sur un nouveau cycle.
- Les attaques sont des séquences de **charge/canalisation** : 12 frames puis maintien de la dernière pose, **pas une attaque aller-retour ni une boucle**.
- Pour les déplacements historiques, le manifeste d'origine précise que la **frame 01 n'est pas certifiée pixel-identique au modèle maître**, malgré la validation artistique de la prévisualisation. Ne jamais affirmer l'inverse.
- Pour les attaques historiques, certaines marges de pose sont **inférieures au minimum 42 px de la charte actuelle** : ne pas altérer les fichiers officiels, mais imposer 42 px minimum aux **nouvelles** animations.

## Protection

- **Aucun catalogue ni assetId créé.** Ces fichiers sont une documentation de création et non une bibliothèque runtime concurrente.
- Les 4 animations originales de Gorice restent **inchangées** sur `global-assets` et dans Monster Capture.
- Une future créature de morphologie gorille conserve son propre modèle FACE et DOS et **sa propre identité visuelle**.
