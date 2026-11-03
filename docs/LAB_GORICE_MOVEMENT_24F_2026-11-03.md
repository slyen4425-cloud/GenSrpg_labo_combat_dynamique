# Gorice — deux animations de déplacement approuvées (2026-11-03)

## Autorité et provenance
- **Base** `global-assets@e1eecf3cd93d388e646f141677aaf5139259157f`; START `checkpoint/lab-start-gorice-movement-24f-assets-2026-11-03`; WORK `work/lab-gorice-movement-24f-assets-2026-11-03`.
- ZIP effectivement déposé : `_incoming/GORICE_DEPLACEMENTS_JOUEUR_ADVERSAIRE_24_FRAMES_VALIDES.zip`, **12 722 008 octets**, SHA256 `4eb0515e387ba1bbad8ca193f6faed61029a4ed9a20004bff763f254abfc0948`, Git blob `1db42e0a4339bc6dfa3c5c0306fa251a5c7d68d1`.
- Deux séquences distinctes approuvées par l'auteur après preview : joueur/dos vers la droite, adversaire/face vers la gauche. Ne jamais utiliser une image miroir ni inverser les membres.
- Les 24 PNG sont conservés **octet pour octet**, sans régénération ni changement de pose, et les atlas WebP originaux sont conservés. Vérification des pixels visibles et de l'alpha de chaque case contre son PNG source (les valeurs RGB des pixels totalement transparents ne font pas partie du visuel et peuvent être normalisées par l'encodeur WebP).
- Attention : la **frame 01 de la séquence joueur n'est pas certifiée pixel-identique à la vue maître originale**, limitation déjà signalée avant validation artistique. Ne pas déclarer l'invariant « frame 01 == master » prouvé ; ne pas toucher au PNG maître ni réécrire la séquence acceptée.

## Périmètre de ce lot assets
- Lecture unique du ZIP dans `global-assets`, sans référence à GensRPG, au Labo Exploration ou à un stockage historique.
- Deux sous-dossiers **nouveaux** : `assets/library/capture/creatures/gorille_des_glaces/animations/movement/player/` et `.../opponent/`. 12 PNG RGBA 512×512 par vue ; un atlas WebP 6144×512 horizontal ; preview GIF + WebP animé ; manifeste officiel, version `capture-creature-animation-v1`.
- IDs ajoutés au **seul** `data/assets/catalog/global-visual-assets.v1.json` :
  - `pack:capture:creature-gorille-des-glaces-movement-player-12-v1`
  - `pack:capture:creature-gorille-des-glaces-movement-opponent-12-v1`
- Préserver les animations de charge/canalisation, leurs identifiants et tous les modèles maîtres, ainsi que la compétence et la configuration de Gorice. **Ne pas équiper automatiquement** : l'éditeur choisit les séquences enregistrées, selon la mécanique native.
- Cadences source du joueur : frames 01–11 = 130 ms, frame 12 = 400 ms. Adversaire = 110 ms par frame. Le catalogue fournit le `frameMs` nominal par vue (130/110) ; les durées originales complètes restent dans le manifeste. Le runtime peut imposer la cadence uniforme de la bibliothèque ; pas d'horloge ad hoc.

## Contrôles et critères
- ZIP whitelist/CRC/Git blob/SHA256, 24 PNG RGBA 512² à alpha réel, aucune frame vide, marge min 42 px (**joueur 57 px, adversaire 43 px**), distincts, 2 atlas lossless, previews 12 frames.
- Validation visible pixel/alpha de chaque frame du WebP contre le PNG ; vérification dans la vraie bibliothèque, unicité des IDs et respect des `counts` catalogue.
- TDD RED : `tests/unit/gorice-movement-24f-assets-2026-11-03.test.mjs`, puis `npm run ci` et workflow `import-gorice-movement-24f-2026-11-03.yml` sur la branche temporaire. Le workflow ne pousse jamais directement sur `global-assets`.
- GREEN uniquement après tests réels, checkpoint exact, PR vers `global-assets` et CI post-fusion.
- Le raccord du **cache client** `gh-pages` et son test en navigateur sont un lot séparé, sinon le catalogue chargé en cache peut ne pas exposer les nouveaux assets. Ne pas publier une animation de combat par défaut sans contrôle via le vrai éditeur. Validation smartphone paysage distincte.
