# Combat Presence / Reach V1

Date : 2026-10-06

## Base

`b807415b0145af350dc1d2b64ab666a5d9ae4326`

Checkpoint de départ :

`checkpoint/lab-start-combat-presence-reach-v1-2026-10-06`

Branche :

`work/lab-combat-presence-reach-v1-2026-10-06`

## But

Créer la fondation pierre-feuille-ciseaux permettant à une compétence de déclarer explicitement quelles présences de combat elle peut atteindre, sans casser les compétences historiques.

## Nouveau contrat

`COMBAT_PRESENCE_STATES` :

- `surface`
- `airborne`
- `underground`

Nouveau champ SkillDefinition optionnel :

`hitPresenceStates`

Exemples :

`["surface"]`

`["surface", "airborne"]`

La valeur `null` signifie : comportement legacy inchangé.

## Owner de présence

Nouveau helper pur :

`src/core/combat/combat-presence-v1.js`

Il dérive la présence depuis le contexte de l'action déjà possédé par Combat Runtime.

Aucune variable DOM et aucun état parallèle ne sont créés.

Pour V1 :

- hors travel : `surface`
- `approachMode = aerial` pendant travel : `airborne`
- la valeur `underground` est réservée pour le lot Burrow suivant.

## Compatibilité legacy

Une attaque sans `hitPresenceStates` continue d'utiliser la logique historique `evasion.incomingForms`.

Une attaque qui fournit explicitement `hitPresenceStates` devient autoritaire pour les états de présence réellement modélisés.

Donc :

- surface-only -> rate une cible airborne ;
- surface + airborne -> peut toucher une cible airborne ;
- l'ancienne évasion par forme ne bloque pas un anti-aérien explicitement configuré ;
- une compétence legacy non migrée ne change pas.

Les autres approches historiques, notamment teleport, ne sont pas silencieusement reclassées par ce lot.

## TDD RED

Commit :

`a4b2a5c8d09443403af1a07ce670e62000c57d92`

CI :

`37470929134`

Résultat :

- 1129 tests ;
- 1126 PASS ;
- 3 FAIL attendus.

Échecs ciblés :

1. champ `hitPresenceStates` absent ;
2. surface-only touchait encore airborne ;
3. anti-air explicite restait bloqué par l'évasion legacy.

La sentinelle legacy était déjà PASS.

## GREEN

Commit fonctionnel :

`a2b914a91c948da170e9ae713d2eb296431d928e`

CI :

`37471232617`

Résultat :

- 1129 / 1129 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

- `src/contracts/skill-definition.js`
- `src/core/combat/combat-presence-v1.js`
- `src/core/combat/action-resolver.js`

Tests :

- `tests/integration/combat-presence-reach-v1.test.mjs`

## Protégé / inchangé

Aucune modification de :

- Combat Runtime ;
- Combat Session ;
- renderer / FX ;
- collision ;
- Skill data historiques ;
- Tempête de flammes ;
- dégâts ;
- status ;
- roster ;
- profils créatures ;
- éditeur.

## Suite

Lot suivant :

`Burrow gameplay`

Il étendra `approachMode` avec `burrow` et utilisera exactement ce contrat de présence pour passer `underground` pendant le travel.

Le rendu visuel sera traité séparément après le gameplay, afin que l'animation ne devienne jamais l'autorité de l'esquive.
