# Game Options / Esquive V1

Date : 2026-10-06

## Base

Base exacte :

`8f71546b3e0ca90155650235803c427deb6e28ac`

Checkpoint de départ :

`checkpoint/lab-start-game-options-dodge-v1-2026-10-06`

Branche :

`work/lab-game-options-dodge-v1-2026-10-06`

## But

Ajouter une action Esquive globale au gameplay Capture, visible directement dans le HUD combat, sans la mélanger au loadout de capacités de la créature et sans créer de seconde autorité de réaction.

## Options de jeu

Nouveau contrat :

`CaptureGameOptionsV1`

Réglages Esquive :

- `enabled` ;
- `maxCharges` ;
- `rechargeMs`.

Compatibilité :
- un ancien export sans `gameOptions` reste valide ;
- l'Esquive globale est désactivée par défaut pour les anciennes données ;
- le Human Editor l'active par défaut dans la configuration de test afin qu'elle soit immédiatement testable.

## Action de combat

Le HUD Capture affiche désormais une touche :

`Esquive`

à côté du bloc des capacités.

Elle affiche :
- charges disponibles / maximum ;
- temps restant avant la prochaine recharge lorsqu'une charge manque.

Le bouton n'est disponible que lorsqu'une vraie attaque entrante peut accepter la réaction.

## Autorité de l'esquive

L'UI ne décide jamais qu'une attaque est évitée.

Chaîne :

`bouton Esquive`
→ `CombatRuntime.previewRechargeableReaction`
→ action ennemie réelle en cours
→ `CombatSession.previewRechargeableReaction`
→ `resolveReaction` existant
→ consommation de charge uniquement après réaction acceptée.

Une attaque `dodgeable: false` :
- refuse l'Esquive ;
- ne consomme aucune charge.

## Charges rechargeables

Nouveau owner générique :

`src/core/combat/rechargeable-action-v1.js`

Il n'est pas spécifique à l'Esquive.

Il stocke uniquement les timestamps des charges consommées dans :

`CombatState.rechargeableActions`

La disponibilité est dérivée de :

`state.elapsedMs`

Donc :
- aucune horloge supplémentaire ;
- aucun `setTimeout` gameplay ;
- aucune décrémentation autoritaire dans l'UI ;
- chaque charge revient indépendamment après `rechargeMs`.

Avec `rechargeMs = 0`, la charge est immédiatement de nouveau disponible.

## Skill de réaction synthétique

`buildCaptureDodgeReactionSkillV1` construit une réaction normalisée :
- coût énergie 0 ;
- cooldown de skill 0 ;
- aucune limite d'usage SkillDefinition ;
- les charges globales restent possédées par Rechargeable Action ;
- résultat `evaded` via l'Action Resolver existant.

Il ne crée donc pas un deuxième moteur d'Esquive.

## Export / Preview

Game Options circule maintenant :

`Human Editor`
→ `CaptureBattleSetupEditorDraftV1`
→ Export V2/V3
→ `CaptureCombatExportV1.battle.gameOptions`
→ Capture adapter stack
→ native combat source
→ combat preview.

## TDD RED Core

HEAD RED :

`ced8fd4224751723f8aa61bd8a2ab88dabef9164`

CI :

`37502180842`

Résultat :
- 1173 tests ;
- 1170 PASS ;
- 3 FAIL ciblés ;
- uniquement les deux nouveaux modules absents.

## TDD RED UI

HEAD RED :

`626389effae387482a37e8be2e27533d081fb68f`

CI :

`37502728409`

Résultat :
- 1181 tests ;
- 1178 PASS ;
- 3 FAIL ciblés :
  - Game Options non exporté ;
  - contrôles HTML absents ;
  - bouton non raccordé au Runtime.

## GREEN

HEAD fonctionnel avant documentation :

`187aa269501fffdeaae96a37e2698b7f5b3ae542`

CI :

`37503893109`

Résultat :
- 1181 / 1181 PASS ;
- 0 FAIL.

Sentinelles :
- Game Options exporté jusqu'à la source native ;
- charge consommée uniquement après réaction acceptée ;
- attaque non esquivable ne consomme pas ;
- recharge via `elapsedMs` ;
- UI contient Options de jeu + touche Esquive ;
- UI appelle les APIs Runtime rechargeables ;
- placement paysage ennemi toujours GREEN ;
- Generic Dodge historique toujours GREEN.

## Fichiers fonctionnels

- `src/contracts/capture-game-options-v1.js`
- `src/contracts/capture-battle-setup-editor-draft-v1.js`
- `src/contracts/capture-combat-export-v1.js`
- `src/core/combat/rechargeable-action-v1.js`
- `src/core/combat/combat-session.js`
- `src/core/combat/combat-runtime.js`
- `src/adapters/input/capture/capture-editor-exporter-v2.js`
- `src/adapters/input/capture/capture-export-adapter-stack-v1.js`
- `src/ui/capture-editor-human-v2.js`
- `src/ui/capture-editor-combat-test-v1.js`
- `src/ui/combat-2v2-test-ui.js`
- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.css`
- tests dédiés.

## Protégé / inchangé

- Combat Damage ;
- Status Runtime ;
- Presence / Reach ;
- Burrow ;
- Immunity ;
- Reserve Targeting ;
- Scheduled Effects ;
- Persistent Zone ;
- collision ;
- projectile ;
- FX ;
- placement des ennemis ;
- scales auteur ;
- Tempête.

## Suite

1. micro-lot UI `Creature Movement Group V1` :
   regrouper profil morphologique + tempo + valeur personnalisée dans un bloc Mouvement sans changement de données ;
2. micro-lot moteur `Stack Mechanics V1` :
   compteur générique par cible/clé, seuil et effets de seuil, sans nom métier codé en dur.
