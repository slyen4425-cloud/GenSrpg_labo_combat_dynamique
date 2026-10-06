# Tempête de flammes — Zone pure sans faux impact cible V1

Date : 2026-10-06

## Base

Base exacte :

`cab67439b310f0e8ffe54bd8b806d664de827752`

Cette base contient déjà les correctifs GREEN de cadence pendant les actions :

- horloge de zone appliquée au vrai instant d’impact ;
- ticks qui continuent pendant les actions ;
- reinforce qui ne repousse plus le prochain tick ;
- autorité long stabilisée.

Checkpoint de départ :

`checkpoint/lab-start-pure-zone-presentation-v1-2026-10-06`

Branche :

`work/lab-pure-zone-presentation-v1-2026-10-06`

## Symptôme utilisateur

Après stabilisation de Tempête de flammes, l’activation donnait encore l’impression :

- qu’un projectile invisible partait vers la cible ;
- puis qu’un impact se produisait sur le monstre.

L’export créateur de Tempête ne contient pourtant :

- aucun sprite travel ;
- aucun sprite impact.

## Audit

Tempête active :

- `form = beam` ;
- `travelMs = 0` ;
- dégâts directs = `0` ;
- seul effet gameplay différé = `persistent_zone` ;
- aura persistante sur la source ;
- feedback V8 comprenant encore `impactBurst` / fumée.

Le plan Release était déjà correct :

`planSkillReleaseFx`

ne produit un projectile que pour :

`form === "projectile"`.

Tempête n’avait donc aucun projectile réel.

### Cause réelle

`resolveSkillCompletion` produit historiquement un événement `hit` générique même lorsque le direct damage vaut zéro.

Ensuite :

`planSkillOutcomeFx`
→ tout outcome `hit`
→ plan `impact`

puis :

`dom-skill-fx`
→ aucun sprite impact ;
→ mais feedback `impactBurst` / `aftermathSmoke` encore jouable.

En parallèle :

`combat-resolution-presenter`
→ outcome `hit`
→ animation `hit` / recul de la cible.

L’ensemble donnait exactement l’illusion d’un projectile invisible suivi d’un impact.

## Correction

Une seule règle sémantique de présentation a été ajoutée :

`resolutionHasImmediateTargetEffectV1(resolution)`

Owner :

`src/core/fx/skill-fx-plan.js`

Un outcome `hit` possède un impact cible immédiat seulement si la résolution montre un effet immédiat réel, notamment :

- dégâts directs demandés / calculés / appliqués ;
- absorption shield ;
- effet tactical immédiat ;
- heal ;
- énergie modifiée ;
- status appliqué ;
- cleanse / dispel effectif ;
- interruption.

### Cas zone pure

Pour Tempête à l’activation :

- hit event présent pour compatibilité gameplay ;
- `baseDamage = 0` ;
- `damage = 0` ;
- `appliedDamage = 0` ;
- `absorbedByShield = 0` ;
- aucun status/heal/énergie immédiat.

Résultat :

- aucun plan `impact` ;
- aucun `impactBurst` artificiel sur la cible ;
- aucune fumée d’impact artificielle sur la cible ;
- aucune animation `hit` / recul cible.

Le Cast, l’animation de lancement du lanceur, l’audio Cast et la zone persistante restent intacts.

## Compatibilité

Les anciens événements `hit` incomplets, qui ne fournissent pas encore de métriques de dégâts, restent volontairement considérés comme des impacts réels.

Cela protège :

- Boule de feu ;
- impacts historiques ;
- KO ;
- recall touché ;
- tests legacy de présentation.

Les outcomes :

- blocked ;
- reflected ;
- immune ;
- projectile clash ;

restent inchangés.

Une capacité de debuff à zéro dégâts conserve également son impact lorsque la résolution contient `status-applied`.

## TDD

### RED

Commit :

`e0a9cffefce27b104f2a11e49cc4472955a2eeeb`

CI :

`37452046216`

Résultat :

- 1128 tests ;
- 1126 PASS ;
- 2 FAIL ciblés :
  1. faux impact FX de zone pure ;
  2. faux recul cible de zone pure.

Les sentinelles direct damage / status immediate étaient déjà PASS.

### Première implémentation

Commits :

- `931c386cc8930d24fcc87df8e2cb55bc2d4f9e65`
- `4495a950a82d937d25b18e56010a62b954691168`

Les tests ciblés passent.

La CI complète a révélé que plusieurs anciennes fixtures de présentation utilisent un `hit` sans métriques de dégâts.

### Compatibilité legacy

Commits :

- `0a97ea763015bab090e11567e961f63137e97369`
- `52d9c853120f219cab3fb6e8a73a0068adafcc32`

La règle finale ne supprime l’impact que lorsque le zéro est explicitement démontré.

CI :

`37452439730`

Résultat :

- 1128 / 1128 PASS.

### Sentinelle projectile invisible

Commit :

`cde6d3d6ff4ae515e605ab01d7f305929ca3d04e`

CI :

`37452516814`

Résultat :

- 1129 / 1129 PASS.

La sentinelle impose explicitement :

`form = beam + travelMs = 0 -> aucun plan projectile`.

## Fichiers fonctionnels modifiés

- `src/core/fx/skill-fx-plan.js`
- `src/adapters/renderer/combat-resolution-presenter.js`

Tests :

- `tests/unit/pure-zone-presentation-v1.test.mjs`

Documentation :

- `docs/LAB_CURRENT_WORK.md`
- ce rapport.

## Domaines protégés

Aucun changement dans :

- `cap_fire_atk_6.capture-skill-transfer-v1.json` ;
- Combat Runtime ;
- Combat Session ;
- Persistent Zone Runtime ;
- cadence des ticks ;
- short / medium / long ;
- dégâts = 5 ;
- durée = 7000 ms ;
- cooldown / énergie ;
- renderer projectile ;
- collision ;
- zone sprite / scale / offsets ;
- sockets.

## Validation smartphone

À vérifier :

1. activer Tempête ;
2. voir la charge / animation du lanceur ;
3. à la fin de la préparation, la zone doit apparaître ;
4. aucun projectile invisible ne doit sembler partir vers la cible ;
5. aucun impact / recul artificiel ne doit se produire sur le monstre au moment de l’activation ;
6. les ticks `-5` doivent ensuite continuer exactement comme dans le lot cadence validé ;
7. renforcer short → medium → long et confirmer le même comportement.
