# Tempête de flammes — Outcome FX zone-only V1

Date : 2026-10-06

## Base

Base exacte :

`cab67439b310f0e8ffe54bd8b806d664de827752`

Cette base inclut déjà le lot GREEN `firestorm-action-cadence-v1` :
- ticks pendant les actions ;
- horloge d’activation correcte ;
- reinforce sans repousser le prochain tick ;
- 1124 / 1124 PASS.

Checkpoint de départ :

`checkpoint/lab-start-zone-only-outcome-fx-v1-2026-10-06`

Branche :

`work/lab-zone-only-outcome-fx-v1-2026-10-06`

## Symptôme utilisateur

L’activation de Tempête donnait encore l’impression :

1. d’attendre un projectile invisible ;
2. puis de provoquer un Impact sur le monstre ciblé.

## Audit de la vraie configuration Tempête

`cap_fire_atk_6` :

- `form = "beam"` ;
- `preparationMs = 2000` ;
- `travelMs = 0` ;
- aucun `visual.travel` ;
- aucun `visual.impact` ;
- unique effet gameplay : `persistent_zone`.

Le binding V8 contient toutefois encore des enrichissements feedback génériques, notamment :

`feedback.impactBurst`.

## Cause

Il n’existait en réalité aucun projectile.

`planSkillReleaseFx` ne crée un projectile que pour :

`form === "projectile"`.

Tempête étant `beam` et ayant `travelMs = 0`, aucun projectile n’était lancé.

Le faux Impact venait de `planSkillOutcomeFx` :

tout résultat sémantique `hit` avec un `skillId` créait automatiquement :

`type: "impact"`.

Le renderer d’Impact peut jouer `impactBurst` même sans sprite `visual.impact`.

En parallèle, `combat-resolution-presenter` faisait jouer la réaction visuelle :

`target -> hit`

pour tout outcome `hit`, même lorsque l’effet immédiat appliquait 0 dégât et que la compétence ne faisait qu’installer une zone.

Ces deux comportements combinés donnaient l’impression d’un projectile invisible qui arrivait sur la cible.

## Correction

### Classification presentation-only

`skill-fx-plan.js` expose :

`isPersistentZoneOnlySkillFxV1(skill)`.

Une compétence est considérée zone-only si :

- elle possède au moins un effet ;
- tous ses effets sont `persistent_zone` ;
- son effet immédiat ne contient ni dégât, ni soin, ni stun, ni interruption.

Cette classification ne modifie aucune règle gameplay.

### Plan Outcome

Pour une compétence zone-only :

`planSkillOutcomeFx(...)`

renvoie maintenant :

`[]`

au lieu d’un Impact cible générique.

Donc aucun :
- sprite Impact ;
- impactBurst ;
- flash/shake liés à l’Impact ;
- audio Impact.

### Presenter

Le presenter conserve temporairement la définition de la compétence déjà fournie par l’action Runtime.

Aucune lookup parallèle n’est créée.

Au moment de l’Outcome :

- le même skill est fourni au plan FX ;
- si la compétence est zone-only, la cible ne joue pas la réaction `hit` ;
- le cache est supprimé à la résolution, à l’interruption ou au dispose.

## Tempête conserve exactement

- préparation auteur : 2000 ms ;
- cast audio ;
- castBurst ;
- apparition / renforcement de la zone ;
- `travelMs = 0` ;
- durée 7000 ms ;
- tick 1000 ms ;
- dégâts 5 ;
- short → medium → long ;
- cadence corrigée du lot précédent ;
- binding V8 auteur inchangé.

Le fichier JSON de Tempête n’a pas été modifié.

## Compatibilité

Les vrais Impacts restent inchangés.

Sentinelle dédiée :

- une compétence zone + dégât immédiat réel continue à produire un Impact ;
- Boule de feu continue à produire son Impact normal ;
- projectile clash et miss restent inchangés.

## TDD

### RED

CI :

`37446065151`

Résultat :

- 1127 tests ;
- 1125 PASS ;
- 2 FAIL attendus.

Échecs ciblés :

1. plan zone-only créait encore `impact` ;
2. presenter jouait encore Impact FX / réaction hit sur la cible.

### GREEN fonctionnel

Commit plan :

`e54388444f3bcdfa591d9d61c82c0c378a1e42f9`

Commit presenter :

`b9d1066547fd2672e2b76ea210917de0054955bd`

CI :

`37446279051`

Résultat :

- 1127 tests ;
- 1127 PASS ;
- 0 FAIL.

## Fichiers fonctionnels modifiés

- `src/core/fx/skill-fx-plan.js`
- `src/adapters/renderer/combat-resolution-presenter.js`

Tests :

- `tests/unit/skill-fx.test.mjs`
- `tests/unit/combat-resolution-presenter.test.mjs`

## Domaines protégés

Aucune modification de :

- Combat Runtime ;
- Combat Session ;
- Action Resolver ;
- Persistent Zone Runtime ;
- Tempête JSON ;
- dégâts ;
- cadence ;
- collision ;
- géométrie ;
- DOM Skill FX renderer ;
- assets ;
- scales / offsets ;
- IA.

## Validation smartphone

À vérifier :

1. lancer Tempête ;
2. les 2 secondes de préparation restent présentes ;
3. aucun projectile ne doit apparaître ;
4. aucun burst / Impact ne doit apparaître sur le monstre ciblé ;
5. le monstre ciblé ne doit pas jouer une réaction de coup reçu à l’activation ;
6. la zone doit apparaître / être renforcée normalement ;
7. les ticks de dégâts doivent ensuite continuer normalement ;
8. vérifier une vraie attaque projectile juste après pour confirmer que son Impact fonctionne toujours.

État : GREEN technique après CI finale et checkpoint.
