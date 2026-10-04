# Moving attack contact stop V1 — 2026-10-04

État : GREEN technique, validation utilisateur smartphone/preview attendue.

## Références

- Base GREEN utilisateur : `b65d2c12cf7e488fb4164127cfe2def199bd1b77`
- Checkpoint base : `checkpoint/lab-combat-reference-pace-v1-green-2026-10-04`
- Départ : `checkpoint/lab-start-moving-attack-contact-stop-v1-2026-10-04`
- Travail : `work/lab-moving-attack-contact-stop-v1-2026-10-04`
- RED : `cc0da7e670984ea8f2dad6eb273292997c634388`, CI 37224643052 FAILURE attendue
- Source/tests verts : `550e609e1b0453b8743578ad3fb09526b84b2a2f`
- CI verte : 37224791601 — 1035/1035 PASS, gardes structure/indépendance incluses

## Cause

Le capteur de contact visible et Combat Runtime étaient corrects : le premier contact réel résolvait déjà l'impact et les dégâts. En revanche, le plan visuel d'approche continuait jusqu'à la position cible capturée au lancement.

Quand deux attaques de contact à déplacement partaient simultanément, chaque créature poursuivait vers l'ancienne position de l'autre après le contact. Cela produisait le croisement et la traversée de l'arène observés avec Griffe.

## Correction

- `DomActorRenderer` reste l'unique propriétaire WAAPI.
- Au premier contact visible d'une approche continue (`ground` / `aerial`), le renderer capture la pose réellement affichée avant d'annuler la phase aller.
- Le retour démarre depuis cette pose courante vers l'état de base : pas de téléportation de retour.
- Le timing/easing du retour est relu directement dans le segment `*-home` de l'`AnimationPlan` actif. La Demo UI ne possède aucune durée.
- Corps et ombre utilisent la même transition de retour et restent sous le même lifecycle renderer.
- Les timers/cues de la phase aller restant après contact sont nettoyés.
- `teleport` conserve son cycle natif existant.
- Combat Runtime, contact/dégâts, récupération et règles gameplay ne sont pas modifiés.

## TDD / charte

Le RED a reproduit :
1. absence de méthode renderer pour revenir depuis la pose visible ;
2. absence du raccord contact -> arrêt de l'aller.

Une première implémentation a déclenché la garde `demo-ui-boundary` car une durée était fournie par l'UI. Elle a été retirée : le timing appartient à nouveau exclusivement à l'AnimationPlan/Core.

CI finale : 1035 PASS / 0 FAIL.

## Fichiers du lot

- `src/adapters/renderer/dom-actor-renderer.js`
- `src/ui/demo-app.js`
- `tests/unit/moving-attack-contact-stop-v1.test.mjs`
- documentation du lot

Aucun asset, aucune règle combat, aucun preset, `main`, `global-assets` ou `Zombicide-40k` modifié.

## Validation attendue

Dans la preview, provoquer deux Griffe / attaques de contact avec déplacement simultanées. Au premier contact visible, les deux créatures doivent arrêter la phase aller et repartir vers leur position, sans se traverser ni poursuivre vers l'autre bord. Les dégâts doivent rester appliqués au contact réel.
