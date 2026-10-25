# Éditeur Capture — mode de sprite DOS ignoré et remplacé par « Boule roulante »

## Reproduction et cause racine
Le transfert d'auteur Freclairions V10 du 24 octobre 2026 comporte `visual.movementBack.mode="sprite"` et `visual.rangedAttackBack.mode="sprite"`, sans `visual.movement` ni `visual.rangedAttack` (FACE). L'éditeur publiait bien ces données dans `data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json` et dans la projection Native Visual Adapter.

La fonction existante `writeCreatureRecordFields` projetait pourtant les paramètres du mode d'animation uniquement à partir du slot FACE, puis prenait `"roll"` si celui-ci était absent. Après sélection de Freclairions, le menu « Mode d'animation » affichait donc « Boule roulante (rotation) » sans relation avec la vraie fiche. Lors d'une sauvegarde, `buildHumanCreatureDraftV3` lisait la valeur affichée et pouvait remplacer le bon `visual.movementBack.mode="sprite"` par `"roll"`. Les paramètres communs `displayScale`, `rotationTurns`, `frameCount`, `transitionMs` avaient la même asymétrie FACE/DOS. Même défaut côté attaque (par chance, le fallback était « sprite »).

## Modification à la source, un seul propriétaire
`captureCreatureEditorVisualSlotForSettingsV1(visual,role)` est une fonction de sélection **purement UI** qui choisit le slot FACE lorsqu'il existe, à défaut le slot DOS, et `null` si les deux sont absents. `writeCreatureRecordFields` réutilise ce résultat pour projeter les réglages communs existants des animations de déplacement et d'attaque, y compris les paramètres d'échelle, rotation, nombre de frames et transition. Aucun mécanisme nouveau de sauvegarde, de fallback runtime ou d'animation n'est créé.

- FACE + DOS : conserve le comportement FACE prioritaire des contrôles communs existants.
- FACE seule : comportement inchangé.
- DOS seule : restitue les réglages DOS enregistrés et ne bascule plus sur « Boule roulante ».
- Aucun sprite : valeurs de création par défaut inchangées.
- Aucune migration ni réécriture des exports auteur, du catalogue, des medias, ou des profils de mouvement.

## Tests et publication
1. Régression Node sur le véritable export Freclairions V10 et les configurations génériques FACE + DOS / FACE seule / DOS seule / aucune, avec aller-retour du constructeur auteur.
2. Chromium : vrai chargement Showcase `crea_foudrillon`, menu d'animation initial « Sprite animé », sauvegarde « image statique », retour à « Sprite animé », alternance de créatures et export vérifiant le mode DOS, tout en laissant FACE vide.
3. CI Foundation + quatre navigateurs, checkpoint GREEN sur SHA exact et PR vers `gh-pages` uniquement après succès complet.
4. Validation d'usage tactile sur Android réservée à l'auteur.

Périmètre : `src/ui/capture-editor-human-v2.js`, `tests/unit/capture-creature-animation-mode-roundtrip-2026-10-25.test.mjs`, `tests/browser/capture-creature-library-smoke.mjs`, `docs/LAB_CURRENT_WORK.md` et présent document.
