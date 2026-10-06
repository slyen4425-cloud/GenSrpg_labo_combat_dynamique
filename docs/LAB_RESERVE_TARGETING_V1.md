# Reserve Targeting V1

Date : 2026-10-06

## Base

`53baa6dfd0bfcfbc080988ae45a3345ba00c9746`

Checkpoint de départ :

`checkpoint/lab-start-reserve-targeting-v1-2026-10-06`

Branche :

`work/lab-reserve-targeting-v1-2026-10-06`

## But

Permettre aux capacités de cibler une créature en réserve, alliée ou ennemie, sans déplacer l'autorité Roster vers CombatState et sans créer un second moteur de dégâts/statuts.

## Contrat de cible

Nouveau :

`CombatTargetRefV1`

Actif :

```json
{ "scope": "active", "actorId": "opponent" }
```

Réserve :

```json
{
  "scope": "reserve",
  "teamId": "opponent",
  "memberId": "enemy-b"
}
```

SkillDefinition possède désormais :

`targetLocations`

Valeur legacy par défaut :

`["active"]`

Opt-in :

`["active", "reserve"]` ou `["reserve"]`.

Aucune compétence historique n'acquiert silencieusement le ciblage du banc.

## Autorité Roster

Les membres de réserve restent exclusivement dans `RosterSession`.

Ils ne sont jamais persistés dans :

`CombatState.fighters`.

Lors d'une résolution vers la réserve, RosterSession crée uniquement une frame d'évaluation temporaire à deux combattants :
- source active ;
- snapshot de la réserve ciblée.

Cette frame consomme les mêmes owners Core :
- Combat Damage ;
- Damage Application ;
- Immunity / shields ;
- Status Runtime ;
- Immediate Tactical Effects.

Après résolution :
- seul le snapshot réserve est sauvegardé dans RosterSession ;
- les statistiques source / énergie / cooldown / usage sont réinjectées dans le combattant actif ;
- aucun acteur de réserve n'existe dans le CombatState persistant.

## Coût / cooldown / usage

Le chemin réserve réutilise `resolveSkillStart` sur un proxy sans effets afin de conserver :
- stun / silence ;
- range ;
- activation requirements ;
- cooldown ;
- usage limit ;
- énergie ;
- timing calculé ;
- taunt existant.

La résolution réserve ne possède donc aucun second système de coût ou cooldown.

Si une taunt redirige l'action vers une cible active, la cible réserve voulue est refusée avant commit réel avec `taunted_target_locked`.

## Relations allié / ennemi

Quand un BattleFormat est fourni :
- relation dérivée par `battleFormat.teamOf(actorId)` et le slot propriétaire de la réserve.

Fallback :
- relation dérivée par le roster propriétaire du slot.

Une réserve du même camp est `ally`, pas `self`.

Le contrat `targetRelations` est vérifié avant toute dépense.

## Effets V1 supportés sur réserve

- legacy direct damage ;
- legacy direct heal ;
- structured damage ;
- heal ;
- energy_restore ;
- energy_drain ;
- apply_status ;
- cleanse ;
- dispel.

Tous doivent viser `target`.

Hors périmètre V1 :
- persistent_zone sur réserve ;
- scheduled_effect sur réserve ;
- multi-target scopes vers réserve.

Ces cas sont refusés explicitement avec `unsupported_reserve_effect`.

## Sémantique temporelle réserve

Le contrat Roster existant reste inchangé :

une créature en réserve est hors de l'horloge active.

Donc :
- les statuses gardent leurs timestamps absolus ;
- ils peuvent expirer pendant la réserve ;
- les ticks DoT/HoT manqués ne sont pas rejoués au retour.

Le ciblage réserve n'ajoute aucune horloge parallèle.

## TDD RED

HEAD RED initial :

`bd22e518fc5e997540f4c942b2883b55793b2828`

CI :

`37486276635`

Résultat :

- 1156 tests ;
- 1149 PASS ;
- 7 FAIL ciblés ;
- aucun échec historique hors nouveaux contrats/APIs.

## GREEN fonctionnel

HEAD fonctionnel :

`33e6ed0b60eb8d36bfe06304f7b75652e76cbed0`

CI :

`37486922738`

Résultat :

- 1157 / 1157 PASS ;
- 0 FAIL.

Sentinelles :
- active-only refuse reserve sans coût ;
- dégâts réserve respectent résistance ;
- source reçoit damageDealtTotal ;
- réserve n'entre jamais dans CombatState ;
- immunity protège ;
- heal + buff allié fonctionnent ;
- mauvaise relation refusée avant coût ;
- cooldown + usage consommés exactement une fois ;
- scheduled/persistent refusés proprement en V1 ;
- anciennes sentinelles Roster/Combat restent vertes.

## Fichiers fonctionnels

- `src/contracts/combat-target-ref-v1.js`
- `src/contracts/skill-definition.js`
- `src/core/combat/roster-session.js`
- `tests/unit/combat-target-ref-v1.test.mjs`
- `tests/integration/reserve-targeting-v1.test.mjs`

## Protégé / inchangé

- Combat Runtime ;
- renderer / FX ;
- collision ;
- Scheduled Effect owner ;
- Persistent Zone Runtime ;
- Presence / Reach ;
- Burrow ;
- Dodge ;
- Immunity owner ;
- Tempête ;
- positionnement visuel ;
- éditeur.

## Suite

Lot suivant :

`Creature Mobility Tempo V1`

Puis exposition des contrats dans le Human Editor.
