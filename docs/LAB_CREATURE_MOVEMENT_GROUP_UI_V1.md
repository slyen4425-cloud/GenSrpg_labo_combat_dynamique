# Creature Movement Group UI V1

Date : 2026-10-06

## Base

`0cf4d9b9b7f53714e4e42329998a818b764f0a23`

## But

Clarifier l'éditeur Créature sans modifier les données.

## Changement UI

Nouveau groupe `Mouvement` :
- Archétype d'animation ;
- Tempo de déplacement ;
- Réglage avancé du temps d'approche.

Nouveau groupe séparé :
`Taille et placement en combat`.

Les sélecteurs `data-*` restent inchangés et uniques.

## Autorités inchangées

- `profileId` reste Creature Presentation ;
- `approachTimeModifierPct` reste la valeur gameplay unique ;
- presets de tempo restent une projection Human Editor ;
- displayScale / viewOverrides restent Creature Presentation.

Aucun JS fonctionnel n'a été modifié.

## TDD

RED :
- CI `37504548865`
- 1183 tests ;
- 1181 PASS ;
- 2 FAIL ciblés, uniquement les groupes HTML absents.

GREEN :
- CI `37504786727`
- 1183 / 1183 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.css`
- `tests/unit/capture-creature-movement-group-ui-v1.test.mjs`

## Protégé

Aucune modification de :
- Human Editor JS ;
- drafts ;
- adapters ;
- Combat Timing ;
- profiles ;
- renderer ;
- FX ;
- scales auteur ;
- Game Options Dodge.
