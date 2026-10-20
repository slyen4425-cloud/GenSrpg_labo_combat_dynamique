# Régression ombre — arène cachée au chargement (20 octobre 2026)

## Symptôme utilisateur
Après le correctif d'autorité unique PR #34, les ombres ont complètement disparu en test mobile.

## Cause identifiée
`createSlot.loadRuntimeAsset` cachait l'ombre puis attendait `collisionModel.snapshot()` pour l'autoriser de nouveau. Ce snapshot exprime un objet **dans l'espace de l'écran** : il demande une taille positive du `motion` et des marqueurs DOM. Dans le mode éditeur/preview, l'arène peut être cachée (`display:none`) pendant l'initialisation ; même si l'image a chargé et que le masque alpha existe, `snapshot()` est null. Le callback `load` unique se termine sans remettre l'ombre visible. Ouvrir la preview plus tard ne relance pas ce callback.

## Correctif unique et soustractif
- `VisibleModelCollision` garde la propriété du **seul masque alpha** ; il expose son état existant en lecture seule via `opaqueMask`.
- `createSlot.loadRuntimeAsset` utilise `collisionModel.opaqueMask` après `refreshFromImage()`, sans demander la projection screen-space `snapshot()` pour décider de l'ombre.
- `groundShadowLayoutFromOpaqueMaskV2` est toujours l'unique calcul de largeur/hauteur/contact/opacité de l'ombre ; `DomActorRenderer` toujours seul responsable de ses mouvements.
- L'ombre reste cachée uniquement pendant le changement de sprite, puis révélée dès que le masque alpha de la **bonne image** est disponible. Pas de masque d'affichage permanent, pas de seconde autorité, pas de timer, pas de fake alpha, pas de règle par créature.
- `snapshot()` et les collisions restent inchangés ; leur usage pour les contacts, une fois l'arène visible, reste obligatoire et indépendant.

## Sentinelle
`tests/unit/combat-shadow-hidden-arena-regression-2026-10-20.test.mjs` met en place un vrai `VisibleModelCollision` avec canvas et pixels alpha, mais une surface DOM à taille zéro (arène masquée). Il vérifie `refreshFromImage() === true`, `snapshot() === null`, et la géométrie d'ombre directement disponible depuis l'unique masque ; vérifie aussi la branche de sortie de `loadRuntimeAsset` et l'absence d'une double écriture de position.

## Frontières
Le premier correctif PR #34 (ordre de chargement et une seule autorité) n'est pas retiré. Aucun changement aux profils, visuels, sprites, statistiques, dégâts, statuts, moteur de combat ni au chantier parallèle des canaux d'élément. Validation visuelle réelle sur Android nécessaire après publication.
