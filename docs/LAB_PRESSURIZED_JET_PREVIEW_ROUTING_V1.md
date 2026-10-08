# Pressurized Jet Preview Routing V1

Date : 2026-10-08

## Base

- Base exacte : `78de0026f01f26d51fd3d4a0616c853a53851b79`
- Checkpoint départ : `checkpoint/lab-start-pressurized-jet-preview-routing-v1-2026-10-08`
- Branche : `work/lab-pressurized-jet-preview-routing-v1-2026-10-08`

## Objectif

Raccorder les quatre assets Jet pressurisé au vrai registre de présentation utilisé
par la preview et prouver le chemin complet :

`assetId -> demoPresentationAssets -> SkillPresentationBinding V9 -> DomSkillFxRenderer beam`.

Aucun skill gameplay permanent n'est ajouté et aucune compétence existante n'est
auto-modifiée.

## Changement

`examples/dom-demo/demo-assets.js` expose désormais :

- `pack:capture:sprite-pressurized-jet-cast-01`
- `pack:capture:sprite-pressurized-jet-beam-start-01`
- `pack:capture:sprite-pressurized-jet-beam-body-01`
- `pack:capture:sprite-pressurized-jet-impact-01`

Les URLs restent générées exclusivement depuis `GLOBAL_VISUAL_LIBRARY` et la
branche canonique `global-assets`.

Aucun chemin de média n'est introduit dans le gameplay.

## Test du vrai chemin

`tests/unit/pressurized-jet-preview-routing-v1.test.mjs` vérifie :

1. les quatre IDs sont réellement résolus par le registre de preview ;
2. leurs URLs pointent vers le pack canonique `global-assets` ;
3. un vrai binding V9 consomme cast / travel / impact Jet pressurisé ;
4. `createCaptureSkillPresentationAssetsV2` résout le body du beam via cet ID ;
5. `createDomSkillFxRenderer` reçoit ensuite ce binding réel ;
6. le renderer produit un seul visuel `beam` continu source -> cible ;
7. le body utilise l'atlas réel 12 frames et `background-size: 1200% 100%`.

Le test utilise uniquement un fixture de binding ; aucun nouvel ID de compétence
n'entre dans `configuredSkills`.

## CI

Run : `37795485943`

- foundation : SUCCESS
- 1281 / 1281 tests Node PASS
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

GREEN technique après CI documentaire finale et checkpoint exact.

La validation artistique du rayon sur smartphone reste distincte.
