# Labo Combat — Stun Arc électrique et Esquive classique pendant action

**14 octobre 2026** — Régression signalée pendant les essais de capacités.

## Problèmes identifiés

1. La véritable compétence auteur **Arc électrique** (`lib_chain_lightning`) contient un `apply_status` `stun` pendant 3000 ms. L'effet et l'événement `charge-interrupt` existent, mais le chemin `CombatRuntime.applyResolutionInterrupt` déléguait à une interruption limitée à `interruptibleDuringPreparation=true` **et uniquement avant `releaseAtMs`**. Une attaque déjà entrée en déplacement pouvait continuer malgré le stun.
2. Le bouton d'Esquive ordinaire du jeu appelait `CombatRuntime.activateRechargeableReaction` directement, alors que cette fonction ne vérifiait pas `activeByActor`. Une créature pouvait lancer l'Esquive pendant la préparation, le déplacement ou la récupération de sa propre action.

## Règles implémentées par le moteur

- Lorsqu'un **vrai statut stun est actif** sur le destinataire d'un événement `charge-interrupt`, si sa propre attaque est encore non résolue, elle est **annulée** via `cancelActionsForActor` (même propriétaire qui émet `onInterrupted` et arrête l'animation visible). Cela vaut pendant la préparation, même si le skill a le flag `interruptibleDuringPreparation:false`, et pendant le trajet avant la résolution/impact.
- Le contrôle d'interruption hérité d'un simple effet `interruptsPreparation` **sans statut stun actif** conserve ses protections d'origine (`interruptibleDuringPreparation` et `releaseAtMs`). Les frappes déjà résolues ne sont pas annulées rétroactivement ; aucune durée/horloge supplémentaire.
- `activateRechargeableReaction` vérifie le propriétaire natif `canStartAction(actorId)` avant tout débit de charge. Elle renvoie `action_in_progress` ou `recovering` lorsqu'un acteur exécute sa propre compétence/commande ou termine sa récupération.
- Le Human Combat UI utilise le **même** `lockedByAction` que les compétences pour désactiver le bouton d'Esquive tant que la créature est occupée ; cela n'active aucun traitement parallèle. Après récupération, Esquive redevient possible si ses charges le permettent.
- Les réactions contre les attaques adverses, la fenêtre configurable, les charges/recharges, le système de statut `auto_dodge` d'Esquive foudroyante et les buffs événementiels restent sur leur unique propriétaire.

## Preuve de tests

Sentinelle `tests/unit/capture-stun-dodge-action-consistency-v1.test.mjs` :
- Charge **le véritable export** `data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json` plutôt qu'une fausse capacité;
- Arc stun 3 s interrompt un cast noninterruptible encore en préparation ou une approche en cours après release, et le coup annulé ne frappe pas plus tard ;
- Esquive ordinaire refusée pendant préparation, trajet et récupération, **deux charges conservées** après chaque refus ; activation correcte après récupération, une charge dépensée ;
- Sentinelle source du bouton : le même `lockedByAction` est utilisé sur l'UI.
- Tests existants de dodge, stun/silence/immobilize, IA, rayons, collisions, skyfall et multi-cibles doivent rester verts dans Foundation et deux parcours Chromium.

## Gouvernance

Base `gh-pages@20f26e67d1533984df90debacf323fda2561f299` CI/Pages GREEN ; branche isolée `work/lab-action-stun-dodge-consistency-2026-10-14` et checkpoint d'origine `checkpoint/lab-start-action-stun-dodge-consistency-2026-10-14`.

Fichiers modifiés : `src/core/combat/combat-runtime.js`, `src/ui/combat-2v2-test-ui.js`, test sentinelle, présente note et `docs/LAB_CURRENT_WORK.md`. Aucun export auteur, FX, code IA, règle de projectile ou autre dépôt touché. Étape finale : 3 jobs CI SUCCESS au SHA exact, checkpoint GREEN à ce SHA, fast-forward avec lease, puis CI/Pages de production SUCCESS. Test sur smartphone réel par l'auteur.
