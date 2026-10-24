# Attaque aérienne : animation de créature universelle — 24/10/2026

## Symptôme et cause
Le lot Dracendre du 23 octobre a permis de jouer les sprites `movement` et `movementBack` lors des approches aériennes, mais `playApproachFor()` dans `src/ui/demo-app.js` conservait ce sprite durant TOUT le plan aérien. Le propriétaire `CombatResolutionPresenter.presentRelease()` ne déclenchait les poses d'attaque `rangedAttack/rangedAttackBack` que lors des attaques sans approche de type projectile/beam/area. Ainsi, une nouvelle créature ayant ses propres sprites d'attaque ne voyait jamais sa pose d'attaque durant une capacité à `approachMode="aerial"`.

Ce défaut concerne le routage commun et non l'identifiant Dracendre. L'éventuel `frameCount:1` exporté par certaines fiches (par exemple Maraileron) n'est **pas** en soi la cause ici : le seul Native Visual Adapter corrige déjà le nombre de frames depuis `asset.resource.frameCount` lorsqu'il est disponible. Aucun JSON auteur n'est modifié.

## Correctif limité à Demo UI / rendu
`creatureAerialAppearanceForPhaseV1(meta, view, phase)` choisit uniquement un média déjà résolu par les propriétaires existants.
- `aerial-arc-apex` : animation de mouvement Face/Dos.
- `aerial-arc-impact` : animation d'attaque Face/Dos si configurée ; sinon garder le mouvement existant. Lecture `stretch` durant la plongée pour exposer toutes les frames d'une attaque même lorsque le trajet est court. Aucun réglage de compétence sauvegardé n'est réécrit.
- `aerial-home` : rétablit le mouvement Face/Dos ou la présentation native si aucun sprite de déplacement.
- Pour une créature sans sprite d'attaque, le parcours du 23 octobre reste inchangé. Une nouvelle créature avec seulement un sprite d'attaque peut maintenant l'afficher au moment de la plongée.
- `ground`, `teleport`, `burrow`, les capacités à distance sans approche et les animations d'esquive restent inchangées.

Les trois phases sont celles du véritable `AnimationPlan`. Son propriétaire existant programme déjà les callbacks `onPhase` et leurs timers ; l'ajout réutilise ces mêmes callbacks pour remplacer l'unique apparence active. `createDomCreatureMovementVisualV1` reste propriétaire du nœud sprite et du masque de collision visible ; aucune deuxième animation, seconde horloge, couche sprite, transform gameplay ou timer n'est créée. Les handles sont annulés lors des changements de phase et dans `finally`; les timers de phase existants sont annulés en cas d'interruption. Les règles de touche, délais de dégâts, ombres et animation de déplacement 2.5D ne changent pas.

## Gouvernance et validation
Base : `gh-pages@7c42fd24e8322fc2c68c0fffebaecfb46f128264`
START : `checkpoint/lab-start-aerial-attack-appearance-all-creatures-2026-10-24`
Travail : `work/lab-aerial-attack-appearance-all-creatures-2026-10-24`
Fichiers autorisés : Demo UI, sentinelles unitaires, documentation et Current Work. `main`, `global-assets` et `Zombicide-40k` intouchés.

Sentinelles nouvelles : Dracendre et Maraileron authentiques (Face/Dos), créature générique attaque uniquement ou sans sprite, ground/teleport/burrow inchangés, branchement du plan/masque/annulation. Exécuter CI Foundation + quatre jobs browser avant GREEN technique. Le test visuel du rendu final sur Android paysage reste distinct et soumis à validation de l'auteur.
