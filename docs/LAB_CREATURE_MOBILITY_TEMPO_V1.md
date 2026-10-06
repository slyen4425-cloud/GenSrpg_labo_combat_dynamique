# Creature Mobility Tempo V1

Date : 2026-10-06

## Base

Base exacte :

`13da10837203e16a23a2c419ba3ba49b8f575e9a`

Checkpoint de départ :

`checkpoint/lab-start-creature-mobility-tempo-v1-2026-10-06`

Branche :

`work/lab-creature-mobility-tempo-v1-2026-10-06`

## But

Séparer la morphologie visuelle d'une créature de son tempo gameplay d'approche.

Les profils :
- bipède ;
- quadrupède ;
- volant ;
- massif ;
- rampant ;

restent des profils de présentation/animation.

La vitesse gameplay est une donnée distincte.

## Autorité unique

Nouveau champ combat :

`approachTimeModifierPct`

Sémantique :
- négatif = plus rapide ;
- 0 = temps auteur inchangé ;
- positif = plus lent.

Il n'existe pas de seconde valeur persistée "classe de vitesse".

Les futurs presets UI Très rapide / Rapide / Normal / Lent / Très lent écriront cette valeur unique.

## Chaîne

`Capture Creature Draft`
→ `Capture creature adapter`
→ `FighterConfig`
→ `CombatState.fighter.approachTimeModifierPct`
→ `Action Resolver`
→ `effectiveApproachTimingMs`
→ `action.travelMs`.

Le `skill.travelMs` source reste inchangé.

## Combinaison

Pour ground / aerial / burrow :

`permanentPct + somme statuses approach_time_modifier actifs`

Le résultat passe ensuite par le multiplicateur global de vitesse déjà existant.

Exemple :
- permanent rapide : -20 % ;
- debuff ralentissement : +50 % ;
- total : +30 % ;
- 1000 ms auteur → 1300 ms effectifs avant multiplicateur global.

Teleport n'utilise pas cette locomotion et reste inchangé.

## Compatibilité

Champ absent :
`0 %`

Aucune créature historique n'est modifiée.

Aucune valeur n'est dérivée automatiquement :
- de l'Agilité ;
- de la Vitesse stat ;
- du niveau ;
- du profileId ;
- de l'archétype visuel.

## Roster

`RosterSession.snapshotFighter` conserve explicitement `approachTimeModifierPct`.

Un rappel / invocation ne perd donc pas le tempo propre de la créature.

## TDD RED

HEAD RED :

`efae2c62afda5a8ce1a0c99a9cae8ebcb743418e`

CI :

`37487800215`

Résultat :
- 1163 tests ;
- 1158 PASS ;
- 5 FAIL ciblés ;
- aucun échec historique.

## Harness intermédiaire

Deux runs intermédiaires ont révélé une erreur de sentinelle :
la créature Showcase Loup possède `maxEnergy = 0`, alors que le harness injectait `initialEnergy = 10`.

Le validateur CombatState refusait correctement cette donnée invalide.

Aucun assouplissement moteur n'a été fait.

Le harness a été corrigé pour fournir `maxEnergy = 10` avec `initialEnergy = 10`.

## GREEN

HEAD fonctionnel :

`79c4185ddeae8a77b35eb4d15565de0316892042`

CI :

`37488768025`

Résultat :
- 1163 / 1163 PASS ;
- 0 FAIL.

Sentinelles :
- Draft + adapter conservent le champ signed finite ;
- -25 % : 1000 → 750 ms sur ground/aerial/burrow ;
- +50 % : 1000 → 1500 ms ;
- permanent + status = addition unique ;
- teleport inchangé ;
- legacy absent = 0 % ;
- `skill.travelMs` auteur inchangé.

## Fichiers fonctionnels

- `src/contracts/capture-creature-editor-draft-v1.js`
- `src/adapters/input/capture/capture-creature-to-fighter-config.js`
- `src/core/combat/combat-state.js`
- `src/core/combat/combat-timing.js`
- `src/core/combat/action-resolver.js`
- `src/core/combat/roster-session.js`
- `tests/integration/creature-mobility-tempo-v1.test.mjs`

## Protégé / inchangé

- profils morphologiques ;
- Animation Core ;
- renderer / FX ;
- collision ;
- données Showcase ;
- SkillDefinition.travelMs ;
- global skill speed ;
- status approach_time_modifier ;
- Reserve Targeting ;
- Tempête.

## Suite

Exposition Human Editor :
- presets mobilité créature ;
- burrow ;
- portée de présence ;
- dodgeable ;
- réserve ;
- immunity ;
- scheduled_effect.
