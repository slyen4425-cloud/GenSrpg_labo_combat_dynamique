# Dracendre — sprite de mouvement en attaque aérienne (23 octobre 2026)

## Régression réellement identifiée
`CombatResolutionPresenter.presentRelease` transmet bien une capacité `approachMode:"aerial"` à `visuals.playApproachFor`. Le propriétaire Demo UI `src/ui/demo-app.js` appelle toutefois `slot.playMovementAppearance` uniquement quand `approachMode==="ground"`. Résultat : la trajectoire aérienne est animée mais le modèle reste sur sa pose fixe ; les sprites de mouvement V9 ne sont pas déclenchés en vol. La fiche Dracendre V9 du lot #72 possède `visual.movement` face et `visual.movementBack` dos.

## Correctif unique
Même `slot.playMovementAppearance` et même `createDomCreatureMovementVisualV1` pour les approches `ground` **et** `aerial`. Choix par vue joueur=dos, adversaire=face depuis `creatureMovementAppearanceForViewV1`. La durée de l'apparence aérienne couvre le plan de vol (`planDurationMs`), et le contrôleur déjà propriétaire l'annule lors de la fin ou interruption. Les modes `teleport` / `burrow` n'obtiennent aucun sprite parasite. Fallback inchangé pour les créatures sans sprite. Aucune modification de collision, trajectoire, Combat Rules, stat, force, animation d'attaque à distance, source d'audio, playlist ou FX.

## Tests et charte
Unitaire sur la réelle fiche Dracendre importée V9, les quatre modes d'approche et les deux vues ; sentinelle du chemin vrai Demo UI pour l'appel sprite, le plan et la fin propre ; CI Foundation + quatre jobs navigateur. Validation visuelle sur smartphone par l'auteur : le mouvement d'ailes doit être visible pendant Vague de chaleur (contact aerial), côté joueur ET adversaire. Note : le fait que le sprite soit effectivement multiframe dépend du média référencé et des métadonnées d'asset effectivement chargées ; aucun média fictif n'est ajouté.

Base `gh-pages@82592abd5e366e1639d63d2ce0cd336ac2f370b6`. START `checkpoint/lab-start-aerial-movement-sprite-2026-10-23`, travail `work/lab-aerial-movement-sprite-2026-10-23`. GREEN seulement après CI 5/5.
