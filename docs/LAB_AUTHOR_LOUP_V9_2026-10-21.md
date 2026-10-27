# Loup volcanique — export auteur V9 FACE/DOS du 21 octobre 2026

## Donnée de référence et traçabilité
Export fourni par le créateur : `gensrpg-capture-creature-crea-loup.json` ; SHA-256 UTF-8 : `d757279d7dcc0ca413dc27fa700ea342aac62dbd12f89af8e2e7f60c869641eb`.

- Source conservée sans modification : `data/capture/source-exports/gensrpg-capture-creature-crea-loup-2026-10-21.json` (inactive).
- Seule fiche active remplacée à ID stable : `data/capture/showcase/crea-loup.capture-creature-transfer-v1.json` déjà chargée par le catalogue `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1`.
- Ne pas créer de copie supplémentaire dans le registre `configuredCreatures`, ni toucher aux réglages des autres créatures.
- Ancienne fiche V2 : face/dos/icône seulement. Fiche auteur V9 : mêmes identifiants visuels de base et quatre animations distinctes.

## Quatre références du catalogue officiel global-assets
- Mouvement FACE adversaire : `pack:capture:creature-loup-volcanique-movement-face-12-v1`, ressource 12 frames.
- Mouvement DOS joueur : `pack:capture:creature-loup-volcanique-movement-dos-12-v1`, ressource 12 frames.
- Attaque FACE adversaire : `pack:capture:creature-loup-volcanique-attack-face-12-v1`, ressource 12 frames.
- Attaque DOS joueur : `pack:capture:creature-loup-volcanique-attack-dos-12-v1`, ressource 12 frames.
- Tous les identifiants existent dans `global-assets:data/assets/catalog/global-visual-assets.v1.json` (lu avant édition).
- Le champ auteur `frameCount: 1` de la présentation n'est pas réécrit : l'adaptateur canonique résout `Math.max(slot.frameCount, resource.frameCount)` ; les assets du catalogue portent 12 frames. Le champ `movementPlayback.frameMs: 0` utilise la cadence ressource/fallback du renderer existant ; ne pas substituer une cadence devinée aux données auteur.

## Comportements préservés
- Échelles mouvement joueur 1,3 / adversaire 1,2 ; attaque joueur 1,7 / adversaire 1,4 ; placement attaque DOS y=-20.
- Statistiques, résistances, compétence et loadout exacts ; socket bouche face/dos et positions conservés, aucune nouvelle capability.
- Aucun traitement de saturation du Loup : le créateur accepte l'embrasement du modèle Feu et demande seulement de surveiller les créatures suivantes.
- Moteur Animation, ombres, dégâts, contacts, audios existants et modèles de deux autres vues protégés.
- Périmètre totalement distinct du chantier musique/ambiance en cours.

## Gates
Test unité source exact + import/normalisation V9 + projection native FACE/DOS depuis le catalogue de mouvement actuel ; CI GitHub cinq jobs ; lecture Chromium de la véritable vitrine ; checkpoint GREEN sur SHA testé et fusion `gh-pages` seulement après revue. Validation esthétique/tactile Android reste séparée.
