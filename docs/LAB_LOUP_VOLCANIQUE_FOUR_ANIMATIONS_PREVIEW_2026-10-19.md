# Loup volcanique — quatre animations de prévisualisation (19 octobre 2026)

Statut : **PREVIEW_READY**, jamais intégré automatiquement. Les modèles canoniques préexistants restent inchangés.

## Charte et origine
- Référence : `gh-pages/docs/LAB_CAPTURE_CHARTE_MODELES_ANIMATIONS_ICONES_V1.md` et `gh-pages/docs/LAB_CHARTE.md`.
- Dépôt `GenSrpg_labo_combat_dynamique` ; autorité média `global-assets`.
- Checkpoint de départ : `checkpoint/global-assets-start-loup-volcanique-sprites-2026-10-19`, à `global-assets@a94829e4892aa5260d8747de0a9f50c4893f6be0`.
- Branche : `work/global-assets-loup-volcanique-sprites-preview-2026-10-19`.
- Vue **face** : `assets/library/capture/creatures/loup_volcanique/runtime/loup_volcanique_opponent.webp` ; loup orienté gauche (3/4 adversaire).
- Vue **dos** : `assets/library/capture/creatures/loup_volcanique/runtime/loup_volcanique_player.webp` ; loup orienté droite (3/4 joueur).
- Référence des orientations : `assets/library/capture/creatures/loup_volcanique/loup_volcanique.meta.json`.
- Les portraits originaux font 320×320. Deux PNG maîtres **candidats** RGBA 512×512 sont créés par redimensionnement à 448 et marge transparente 32px ; leur approbation finale par l'auteur reste obligatoire.

## Livrables
Sous `assets/library/capture/creatures/loup_volcanique/review_animation_20261019/` :

| Action | Vue | Frames | Aperçu |
|---|---|---|---|
| Attaque (morsure volcanique) | face | 20 PNG RGBA 512×512 | `animations/attaque/face/previews/loup_volcanique_attaque_face_preview.webp` |
| Attaque (morsure volcanique) | dos | 20 PNG RGBA 512×512 | `animations/attaque/dos/previews/loup_volcanique_attaque_dos_preview.webp` |
| Déplacement (course sur place) | face | 20 PNG RGBA 512×512 | `animations/deplacement/face/previews/loup_volcanique_deplacement_face_preview.webp` |
| Déplacement (course sur place) | dos | 20 PNG RGBA 512×512 | `animations/deplacement/dos/previews/loup_volcanique_deplacement_dos_preview.webp` |

Chaque action possède un atlas 5×4 (2560×2048), un contact sheet et un aperçu WebP animé de ~12 ips. Les 4 aperçus et les 80 frames sont rassemblés dans une archive de révision séparée. `preview_manifest.json` conserve les SHA256, la provenance et les checks.

## Méthode et limites
La génération part exclusivement des modèles GitHub officiels : déformation locale modérée de l'image du même angle, sans création de nouvelle silhouette. Les membres alternent à la course, tête et pattes se mobilisent à l'attaque ; un effet de flamme attenant à la gueule intervient pendant l'attaque. Ce ne sont **pas** des animations dessinées à la main anatomiquement reconstruites image par image : tout défaut de déformation exige contrôle artistique.

Les 1res et 20es frames correspondent **pixel pour pixel au PNG maître candidat 512×512**, et ces maîtres candidats reproduisent les modèles originaux sans changer la perspective. Le master candidat est distinct du master approuvé au sens contractuel de la charte ; ne pas déclarer une approbation que l'auteur n'a pas donnée.

## Bloquages avant catalogue
1. Validation explicite par l'auteur des deux maîtres 512 et des quatre mouvements (attaque face/dos, déplacement face/dos).
2. Vérification visuelle sur smartphone de la continuité, du sens, des déformations et de l'absence d'artefacts.
3. Conversion éventuelle en sprite-strip adaptée au renderer réel, sans inventer de nouveau catalogue ni remplacer les trois assetIds existants.
4. CI sentinelle et test réel en jeu lors du raccord **dans un lot distinct**.

**Interdits dans ce lot :** modification `data/assets/catalog/global-visual-assets.v1.json`, réécriture des masters `runtime/`, changements du moteur, de la mécanique des collisions ou du dépôt principal.
