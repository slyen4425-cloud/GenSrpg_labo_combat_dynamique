# Loup volcanique — quatre animations en prévisualisation (19 octobre 2026)

## Source et contrat
- Références canoniques : `assets/library/capture/creatures/loup_volcanique/runtime/loup_volcanique_opponent.webp` (FACE adversaire) et `loup_volcanique_player.webp` (DOS joueur).
- Sources maîtresses approuvées en bibliothèque Capture : 320×320 RGBA, orientation FACE regarde à gauche / DOS regarde à droite.
- Contrat [charte modèles-animations-icônes](../docs/LAB_CAPTURE_CHARTE_MODELES_ANIMATIONS_ICONES_V1.md) sur `gh-pages` : deux angles verrouillés, 20 frames chacune, 512×512 RGBA, frame 01 identique au maître de 512px, aperçus avant import.
- Maîtres 512px **dérivés par redimensionnement** des deux modèles existants, conservés à côté des aperçus. Aucune nouvelle vue inventée, aucune réflexion horizontale.
- Animation limitée à des déformations 2D non rotatives et sans réinterprétation de l'anatomie : `attack` = impulsion / frappe en avant + courte flambée connectée au museau ; `movement` = course sur place / foulées alternées / mouvement de tête et queue. Les quatre animations sont des **prototypes à valider visuellement**, et non une animation squelettique authentique.

## Traçabilité
- Base : `global-assets@a94829e4892aa5260d8747de0a9f50c4893f6be0`.
- Checkpoint de départ : `checkpoint/global-assets-start-loup-volcanique-animations-preview-2026-10-19`.
- Branche de production : `work/global-assets-loup-volcanique-animations-preview-2026-10-19`.
- Générateur : `scripts/preview_loup_volcanique_animations_v1.py`.
- CI media : `.github/workflows/preview-loup-volcanique-animations-v1.yml`.
- Sorties (après action verte) : `assets/library/capture/creatures/loup_volcanique/animation_previews_v1/`, 4 × 20 frames, 4 atlas, 4 animations WebP, 4 planches JPEG et manifeste complet avec SHA de chaque frame.
- Périmètre strict : scripts de production + workflow + nouveaux fichiers de **revue**, sans mutation des médias canoniques ni du catalogue.
- Protégés : `main`, `gh-pages`, `Zombicide-40k`, autres laboratoires, autre contenu de `global-assets`, mécaniques de combat et données auteur.

## Validation BLOQUANTE
- Présenter quatre animations fluides indépendantes + quatre planches et la comparaison de frame 1 au modèle.
- Valider les deux vues pour **les deux actions** ; toute dérive de perspective, masque, patte, flamme ou artefact impose une correction.
- **Ne pas fusionner** ce brouillon dans `global-assets`, ne pas enregistrer de nouveaux `assetId` et ne pas raccorder au jeu avant validation explicite.
- La CI de la branche et les contrôles de fichier ne remplacent pas la validation artistique Android.
