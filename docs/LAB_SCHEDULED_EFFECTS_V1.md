# Scheduled Effects V1

Date : 2026-10-06

## Base

`47091e6c88de6136167b3af85a838f86f0d66f75`

Checkpoint de départ :

`checkpoint/lab-start-scheduled-effects-v1-2026-10-06`

Branche :

`work/lab-scheduled-effects-v1-2026-10-06`

## But

Permettre à une capacité de programmer des effets qui se résolvent plus tard sur l'horloge combat existante.

Exemple produit :

Comète lancée maintenant -> dégâts 30 secondes plus tard.

## Contrat

Nouveau `SkillEffectV1.kind` :

`scheduled_effect`

Trigger V1 :

```json
{
  "type": "after_ms",
  "delayMs": 30000
}
```

Effets imbriqués V1 autorisés :
- damage ;
- heal ;
- energy_restore ;
- energy_drain ;
- apply_status ;
- cleanse ;
- dispel.

Interdits en V1 :
- scheduled_effect imbriqué ;
- persistent_zone imbriquée.

Le wrapper utilise `targetScope = target` en V1.

## Autorité

Nouveau propriétaire :

`src/core/combat/scheduled-effect-runtime-v1.js`

La file programmée vit dans :

`CombatState.scheduledEffects`.

Aucun `setTimeout` gameplay.
Aucun timer par capacité.
Aucune horloge parallèle.

`CombatSession.advanceMs` avance la file programmée sur exactement la même horloge que :
- statuses ;
- zones persistantes ;
- cooldowns ;
- énergie.

## Résolution

À échéance, le Scheduled Effect Runtime réutilise :

`applyImmediateTacticalEffectsV1`

Donc dégâts, soins, statuts, immunité et autres primitives restent dans leurs owners existants.

Un effet est retiré de la file AVANT sa résolution afin de garantir une seule exécution.

## Temps absolu / relatif

Le lot a révélé une frontière importante.

Deux notions restent distinctes :

- `atMs` de timeline/FX : relatif à l'action ;
- `combatAtMs` : temps combat absolu pour les mutations d'état.

Avec Combat Runtime :
- `resolutionAtMs` fournit le temps combat absolu réel.

Avec l'API synchrone historique `useSkill()` :
- les mutations d'état restent au `state.elapsedMs` courant ;
- elles ne sont pas artificiellement datées dans le futur par `impactAtMs`.

Cette séparation évite une deuxième horloge et protège les snapshots de réserve.

## TDD RED

Premier RED :

`2373320c41533b22c47425341ac815d8ac7793ba`

Sentinelle absolue ajoutée :

`185ddaed4b53dfc987adb7c211cf547552ba5546`

CI RED :

`37477183761`

État initial :
- 1148 tests ;
- 1144 PASS ;
- 4 FAIL ciblés ;
- cause : `scheduled_effect` absent du contrat.

Une cinquième sentinelle protège ensuite l'ancrage au temps combat absolu.

## Régression intermédiaire détectée

HEAD intermédiaire :

`a10fd111ae662b3b152ced622c6048ccd86991cc`

CI :

`37478041087`

Les nouvelles sentinelles Scheduled étaient vertes, mais trois sentinelles Roster échouaient.

Cause réelle :

un `impactAtMs` relatif d'une résolution synchrone `useSkill()` avait été interprété comme un timestamp combat absolu.

Conséquences :
- DoT daté artificiellement dans le futur ;
- recall KO non déclenché au tick attendu ;
- status rappelé considéré inactif ;
- expiration réserve décalée.

Correction :

- Runtime réel : timestamp absolu explicite conservé ;
- `useSkill()` historique : mutation d'état au `state.elapsedMs` courant ;
- persistent zone conserve sa sémantique historique quand aucun timestamp absolu n'est fourni.

Aucune modification du Roster.

## GREEN fonctionnel

HEAD fonctionnel :

`80b9655f0b075e0971f92895d7d8eb933ec81a68`

CI :

`37478817242`

Résultat :

- 1149 / 1149 PASS ;
- 0 FAIL.

Sentinelles Scheduled :
- contrat after_ms ;
- aucun effet avant échéance ;
- résolution exacte une fois ;
- status appliqué au vrai timestamp d'échéance ;
- immunité active à l'échéance respectée ;
- délai ancré au temps combat absolu.

Sentinelles Roster restaurées :
- DoT KO annule rappel ;
- round-trip actif/réserve conserve les status/cooldowns/usages ;
- réserve ne rejoue pas les ticks manqués et expire correctement.

## Fichiers fonctionnels modifiés

- `src/contracts/skill-effect-v1.js`
- `src/core/combat/combat-state.js`
- `src/core/combat/scheduled-effect-runtime-v1.js`
- `src/core/combat/status-effect-runtime-v1.js`
- `src/core/combat/immediate-tactical-effects-v1.js`
- `src/core/combat/action-resolver.js`
- `src/core/combat/combat-session.js`
- `tests/integration/scheduled-effects-v1.test.mjs`

## Protégé / inchangé

Aucune modification de :
- Combat Runtime ;
- timers navigateur ;
- Roster Session ;
- renderer / FX ;
- collision ;
- Presence / Reach ;
- Burrow ;
- Dodge ;
- Immunity owner ;
- Tempête ;
- éditeur.

## Suite

Lot suivant :

`Reserve Targeting V1`

Le roster reste l'unique propriétaire des membres de réserve.
Il est interdit d'ajouter une copie du banc dans Combat State ou un deuxième moteur de dégâts réservé au banc.
