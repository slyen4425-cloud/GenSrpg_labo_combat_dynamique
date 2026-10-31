# Mur de glace — raccord visuel et collision projectile 1v1 (2026-10-31)

## Base et périmètre
- Branche `work/lab-wall-1v1-sensor-parity-2026-10-31` issue de `gh-pages@12ef00c407f8038f0f33dc4c4006beb16b306247`.
- START `checkpoint/lab-start-wall-1v1-sensor-parity-2026-10-31`.
- RED `checkpoint/lab-red-wall-1v1-sensor-parity-2026-10-31`, test sentinelle `tests/unit/capture-wall-1v1-sensor-parity-2026-10-31.test.mjs`.
- Problème : le renderer du 1v1 montait un `CombatEntityOverlay` sans résolution des sprites de la bibliothèque officielle, et ne lui demandait jamais de rectangles de collision pour `DomSkillFxRenderer`. Le 2v2 transmettait déjà ces deux capacités. Conséquence : une entité pouvait exister en Combat State, mais le projectile 1v1 ne pouvait pas produire l'ID d'une collision confirmée.
- Correctif minimal : 1v1 transmet `assetForId: presentationAssets.visualAsset` et `barrierCollisionRectsFor: combatEntityOverlay.collisionRectsFor` au même moteur DOM. Aucun nouveau propriétaire d'asset, collision, dégâts, PV ni horloge.

- Publication : les deux entrées `examples/dom-demo/demo.js` et `index.html` portent la même révision d'import ESM `wall-1v1-sensor-parity-20261031`, vérifiée par une sentinelle Node ; cela évite de charger l'ancien 1v1 en cache après Pages.

## Invariants et preuves
- Le sprite et la jauge de PV restent les nœuds persistants du même overlay ; aucun nouveau renderer ni catalogue.
- Un projectile ne peut intercepter qu'après intersection segment balayé / rectangle visible, identifiant exact reporté par `onProjectileContact → CombatRuntime.reportActionContact → CombatSession → Combat Damage`.
- Aucun contact observé (projectile contournant) : pas d'absorption par le mur ; dégâts normaux vers le combattant.
- Sentinelles Node : le vrai branchement du module 1v1, la source unique des sprites et le mécanisme natif de dégâts pour collision / absence de collision.
- Sentinelle Chromium existante : `tests/browser/capture-ice-barrier-editor-smoke.mjs` vérifie une image réelle persistante dans le DOM, une géométrie rectangulaire réelle, la perte 80 → 55 PV et les contrôles de l'éditeur. Ce smoke ne constitue pas un test physique sur Android ni un test de combat joué de bout en bout en 1v1.
- CI complète Foundation et 4 Chromium à confirmer sur SHA final ; puis checkpoint GREEN seulement au même SHA, PR vers gh-pages et Pages.

## Suites strictement distinctes
- Mur placé librement dans l'arène et collision de rayon/contact/zone hors protection ciblée (#167), puis familiers agissants séparément.
- Compétences canalisées (#168) : nouveau lot après vérification de celui-ci.
- Aucun changement de `main`, `global-assets`, GenSrpg ni Exploration.
