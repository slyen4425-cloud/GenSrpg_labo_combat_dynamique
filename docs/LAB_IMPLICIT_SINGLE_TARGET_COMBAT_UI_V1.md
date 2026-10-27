# Combat Capture — ciblage implicite d'une cible unique V1 (2026-10-10)

## Retour utilisateur
En 1v1, après un clic sur un ennemi ou sur soi, lancer une capacité `self` ou une attaque contre l'ennemi unique nécessitait parfois un deuxième clic sur une cible, alors que le choix était évident. Le choix manuel doit rester utilisable en 2v2 et pour les soins/buffs d'alliés.

## Cause
`src/ui/combat-2v2-test-ui.js` conserve une seule variable `selectedTargetId` initialisée sur un ennemi. Le clic de capacité refusait toute action si cette cible mémorisée ne figurait pas dans `skillTargetOptions(skill).availableIds`, même quand cette collection contenait exactement une cible autorisée disponible. L'utilisateur était obligé d'armer la compétence puis de cliquer sur soi ou sur l'ennemi.

## Correction au seul propriétaire UI
- Nouvelle fonction pure `resolveCombatSkillClickTargetV1` dans `src/ui/combat-2v2-test-ui.js`.
- `self` uniquement : auto-cible `format.localActorId` si celui-ci figure dans `availableIds`, indépendamment de `selectedTargetId`.
- `enemy` uniquement : auto-cible un seul adversaire disponible; en 2v2 à deux cibles admissibles, la sélection manuelle mémorisée garde son autorité. Si aucune cible ennemie n'est sélectionnée dans ce cas, une cible doit être touchée.
- `ally` et `self+ally` : pas d'auto-choix silencieux ; le joueur choisit explicitement son allié ou lui-même, selon les permissions du skill.
- Les indicateurs `data-target-required` et le gestionnaire de clic de capacité utilisent **la même décision pure**, pour ne pas afficher « choisir cible » quand l'action est directe.
- `combatSkillTargetOptionsV1` continue de consulter `isSkillTargetAllowed`, les HP, `isPresent` (présence/roster) et `session.previewSkill` ; toutes les restrictions du moteur restent inchangées. L'action passe encore uniquement par `activateLocalSkill` puis `runtime.startSkill`.

## Tests ciblés
`tests/unit/combat-implicit-single-target-ui-v1.test.mjs` couvre :
- self 1v1 direct alors qu'un ennemi est sélectionné ;
- ennemi unique 1v1 après avoir ciblé soi ;
- self direct en 2v2 après sélection ennemi/allié ;
- ennemi sélectionné en 2v2 préservé, choix requis après allié ;
- dernier ennemi en 2v2, adversaire KO, absent ou temporairement indisponible ;
- aucun déclenchement implicite si les previews sont indisponibles ;
- `ally` et `self+ally` explicitement ciblés ;
- sentinelle UI sur un unique résolveur en clic et disponibilité.

## Gouvernance
- Base publique : `gh-pages` `1dfac0e56c5cff40dc81c2ccfa29f9ce43285578`, Laboratory CI `38071188272` SUCCESS, Pages `38071187909` SUCCESS.
- Checkpoint départ : `checkpoint/lab-start-implicit-single-target-combat-ui-v1-2026-10-10`.
- Branche de travail : `work/lab-implicit-single-target-combat-ui-v1-2026-10-10`.
- RED attendu : `c056582c953bc537d9c978de32aa0b5990553403`, CI `38072023923` FAILURE (résolveur absent).
- Correctif : `3cb3d6362f6b3d0d89e7ad44d86e98bc0a72bd82`.
- Publication et checkpoint GREEN conditionnés à CI entière sur SHA documentaire exact, fast-forward sous lease vers `gh-pages`, CI et GitHub Pages SUCCESS.
- Aucun changement aux règles, contrats, data de capacité, au runtime, aux sprites, aux créatures/loadouts, aux autres dépôts. Validation tactile Android de ce nouveau comportement reste utilisateur.
