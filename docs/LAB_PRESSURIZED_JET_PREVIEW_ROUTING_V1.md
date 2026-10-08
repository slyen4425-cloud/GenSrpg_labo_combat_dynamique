# Pressurized Jet Preview Routing V1

Date : 2026-10-08

## Base

- Base exacte : `78de0026f01f26d51fd3d4a0616c853a53851b79`
- Checkpoint départ : `checkpoint/lab-start-pressurized-jet-preview-routing-v1-2026-10-08`
- Branche : `work/lab-pressurized-jet-preview-routing-v1-2026-10-08`

## Objectif

Raccorder les quatre assets Jet pressurisé au vrai registre de présentation utilisé
par la preview et prouver le chemin complet :

`assetId -> global-assets catalog -> canonical presentation resolver -> SkillPresentationBinding V9 -> DomSkillFxRenderer beam`.

Aucun skill gameplay permanent n'est ajouté et aucune compétence existante n'est
auto-modifiée.

## Changement

Le vrai chemin de preview conserve `global-assets` comme seule autorité média.

Nouveau résolveur pur :
`src/assets/global-presentation-asset-resolver-v1.js`.

Il transforme une entrée du catalogue global en asset de présentation runtime
(`url`, `frameCount`, `frameMs`, `playbackMode`, `headingRad` et scales
optionnels) sans recopier les métadonnées du média dans la démo.

`examples/dom-demo/capture-editor-v2.js` installe ce résolveur une fois le
catalogue global chargé, puis conserve l'ordre existant :
legacy demo explicite -> asset créateur -> catalogue global.

Les quatre entrées Jet pressurisé ajoutées auparavant dans `demo-assets.js`
ont été retirées afin d'éviter une seconde autorité. Elles sont donc résolues
uniquement depuis le catalogue `global-assets`.

Aucun chemin de média n'est introduit dans le gameplay.

## Test du vrai chemin

`tests/unit/pressurized-jet-preview-routing-v1.test.mjs` vérifie :

1. les quatre IDs sont résolus par le résolveur du catalogue global ;
2. `demo-assets.js` ne contient aucun doublon Jet pressurisé ;
3. leurs URLs pointent vers le pack canonique `global-assets` ;
4. un vrai binding V9 consomme cast / travel / impact Jet pressurisé ;
5. `createCaptureSkillPresentationAssetsV2` résout le body du beam via cet ID ;
6. `createDomSkillFxRenderer` reçoit ensuite ce binding réel ;
7. le renderer produit un seul visuel `beam` continu source -> cible ;
8. le body utilise l'atlas réel 12 frames et `background-size: 1200% 100%`.

Le test utilise uniquement un fixture de binding ; aucun nouvel ID de compétence
n'entre dans `configuredSkills`.

## CI

Run de référence après suppression de la double autorité : `37798423324`

- foundation : SUCCESS
- suite Node complète PASS
- 0 FAIL
- Creature Library Chromium smoke : SUCCESS
- sentinelle des 103 créatures conservée

## Domaines protégés

Inchangés :

- gameplay des compétences ;
- dégâts ;
- énergie ;
- cooldowns ;
- résistances / pénétration ;
- exports auteur eau ;
- 103 créatures configurées ;
- `global-assets` ;
- `main` ;
- `gh-pages` ;
- `Zombicide-40k` ;
- Exploration.

## Statut

GREEN technique après CI finale `37798626210` (foundation + Chromium SUCCESS).

Le checkpoint V1 historique `checkpoint/lab-pressurized-jet-preview-routing-v1-green-2026-10-08`
reste immuable sur l'ancienne variante qui dupliquait encore les quatre assets
dans `demo-assets.js`.

La correction mono-autorité est figée séparément comme V2 :
`checkpoint/lab-pressurized-jet-preview-routing-v2-green-2026-10-08`.

La validation artistique du rayon sur smartphone reste distincte.
