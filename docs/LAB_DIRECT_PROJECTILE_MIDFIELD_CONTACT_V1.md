# LAB — Projectile direct : collision au milieu de l'arène

Date : 2026-10-12.

## Demande / scénario utilisateur

Après la correction de la trajectoire fixe des projectiles directs, lorsqu'une créature se déplace **au sol vers une Boule de feu**, le projectile doit toucher **à l'endroit du contact réel** et déclencher immédiatement l'impact et les dégâts, même au milieu de l'arène ; il ne doit pas rejoindre le slot de repos avant de disparaître.

Le contrat est indépendant du sens de tir : joueur→adversaire et adversaire→joueur. Un déplacement aérien ou souterrain hors de la ligne du projectile ne doit pas réorienter la Boule de feu vers la créature, et la règle métier `hitPresenceStates:[\"surface\"]` déjà validée reste en place.

## Propriétaire et diagnostic

Le flux LIVE existe déjà, sous les propriétaires uniques :

1. `src/adapters/renderer/dom-skill-fx.js` lance le projectile sur la ligne fixe entre les slots, sans suivre la hauteur du modèle. Le même FX adapter échantillonne `targetCollisionModelFor(...).snapshot()` et détecte la traversée du masque opaque par `sweptPointHitsOpaqueMask` (prise en compte du déplacement du modèle et du projectile entre deux frames).
2. Ce capteur transmet une seule fois `onProjectileContact` au `CombatRuntime.reportActionContact`.
3. `src/core/combat/combat-runtime.js` résout le hit **avant** l'impact nominal, puis conserve la seule autorité des PV / dégâts.
4. `src/adapters/renderer/combat-resolution-presenter.js` fait disparaître le projectile par le `cancelProjectileFor` existant ; le FX d'impact cible la position **vivante** de la créature, pas son slot au repos.

Le propriétaire physique est déjà correct pour le cas décrit. Il serait dangereux de créer une seconde collision à partir des positions prédites ou de la durée visuelle, ou de réécrire le Runtime alors que le cas est correctement traité.

## Protection par test d'intégration

Ajout : `tests/integration/capture-direct-projectile-midfield-contact-v1.test.mjs`.

- Réutilise **Boule de feu auteur réelle**, `CombatSession`, `CombatRuntime`, `createDomSkillFxRenderer`, `createCombatResolutionPresenter`.
- Simule un adversaire au sol qui avance vers le projectile et le rencontre autour de la moitié de l'arène. Exécute réellement deux frames successives du détecteur (non-contact puis intersection).
- Vérifie : un seul contact ; résultat `hit` ; dégâts et perte de PV avant le `travelMs` nominal ; annulation du projectile ; impact à la position actuelle du modèle, pas au slot initial ; aucune résolution ou dégâts en double.
- Rejoue l'essai pour **les deux sens de tir**, en gardant le segment visuel stable et sans visée verticale dynamique.
- Protections préexistantes : `tests/unit/direct-projectile-rest-lane-v1.test.mjs` (vol/enterrement ne modifient pas la ligne de repos), `tests/integration/capture-fireball-airborne-regression-v1.test.mjs` (absence de dégâts sur aérien, cible au sol touchée).

## Gouvernance / publication

- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique` ; base `gh-pages` GREEN `781f057b3e574d42bfb710ce6fcd5e15e158db4e`, CI et Pages success.
- Départ : `checkpoint/lab-start-direct-projectile-midfield-contact-2026-10-12` ; travail : `work/lab-direct-projectile-midfield-contact-2026-10-12`.
- Périmètre déclaré : test d'intégration, ce rapport, `docs/LAB_CURRENT_WORK.md` ; **aucune modification du moteur ou des assets** puisqu'aucun défaut n'a été confirmé dans cette chaîne de collision.
- Les réglages auteur, dégâts, vitesses, animations, inventaires, mode Capture et dépôts externes ne sont pas modifiés.
- GREEN après CI complète, Chrome, checkpoint, FF non forcé de `gh-pages`, puis CI/Pages de publication. Le rendu exact sur smartphone demeure à valider manuellement.
