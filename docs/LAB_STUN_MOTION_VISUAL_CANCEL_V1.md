# Arc électrique : stopper réellement le mouvement visuel lors du stun

**Date : 14 octobre 2026.**

## Diagnostic vérifié

La compétence auteur `lib_chain_lightning` applique le vrai statut `stun` durant 3000 ms, en plus de ses dégâts. Le moteur `CombatRuntime.applyResolutionInterrupt` sait désormais interrompre une action native déjà en cours d'approche, quel que soit `interruptibleDuringPreparation`, et fait remonter un callback `onInterrupted`.

Les deux vrais écrans combat connectent ce callback à `CombatResolutionPresenter.cancelActionPresentation(actorId)`. Cette fonction annulait le cast, les pistes audio et les projectiles, mais l'animation du combattant restait active : `visuals.cancelFor` n'était appelé que lorsque `rosterVisualsByActor.delete(actorSlot)` réussissait, ce qui concerne les invocations/rappels, non le mouvement `visuals.playApproachFor`.

**Conséquence :** action de combat annulée mais déplacement visible poursuivi.

## Correction ciblée

Le seul propriétaire de la présentation `src/adapters/renderer/combat-resolution-presenter.js` suit les approches réellement lancées dans une `approachVisualsByActor` privée. Un appel de `cancelActionPresentation(actorSlot)` annule `visuals.cancelFor(actorSlot)` **uniquement si** un mouvement d'approche ou une séquence de roster de cet acteur est effectivement détenu, puis nettoie cast, sons de déplacement/pas et projectile comme auparavant. Le suivi est libéré à la résolution de la promesse de mouvement, à l'interruption, et au dispose. Aucun nouveau timer ou autorité gameplay.

Ne pas rendre `cancelFor` inconditionnel : la première correction exploratoire avait cassé la sentinelle `zone-idle-recall-fx-v1` (double `cancelFor` lors de `presentPreparation` d'un rappel). Le suivi par ownership respecte le chemin historique du rappel.

## Tests / invariants

- Test dédié `tests/unit/capture-stun-movement-visual-interrupt-v1.test.mjs` : véritable export `Arc électrique`, `CombatSession + CombatRuntime + CombatResolutionPresenter` raccordés aux callbacks réels de l'UI ; le stun annule action et animation de l'acteur en cours d'approche, et aucun coup ne survient plus tard.
- Sol / aérien / téléportation interrompus si stun réellement appliqué ; une approche souterraine reste immunisée à cet Arc si son hit est esquivé par présence souterraine (ne pas modifier le moteur d'immunités pour faire passer le test). `cancelActionsForActor` standard interrompt également le visuel.
- Le test `capture-stun-dodge-action-consistency-v1`, le rappel `zone-idle-recall-fx-v1` et toutes les sentinelles Foundation doivent rester verts.
- Aucune modification du statut `stun`, de ses dégâts/contrats, du Runtime/ActionResolver, de l'IA, des rayons, de la compétence utilisateur ou des assets. Pas de modification du dépôt principal.
- Validation finale : Foundation + Firestorm Chromium + Creature Library Chromium, checkpoint GREEN sur SHA exact, FF sous lease, CI et Pages postpublication. Le ressenti visuel Android appartient aux essais utilisateur.
