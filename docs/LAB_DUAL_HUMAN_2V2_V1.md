# Labo Combat — Contrôle solo des deux créatures en 2v2 V1

Date : 13 octobre 2026.

## Décision produit : trois modes indépendants
- **Humain + IA alliée** : mode historique par défaut, `controllerId:human-local` puis `ai-ally`. Conservé sans changement des comportements de décision adverses/alliés.
- **Solo local de deux créatures** : opt-in dans l'onglet Combat, uniquement si deux actifs par équipe, `controllerId:human-local` sur les deux slots alliés. Un tap/clic sur l'un des deux modèles/cartes alliés bascule le propriétaire de l'**unique HUD**. Pas d'invocation ni d'action/timer supplémentaires.
- **Deux joueurs humains** : orientation future, non implémentée ; `human-remote` ne doit être ni simulé par l'IA ni capturé par le contrôle local. Aucun réseau ajouté.

## Base, ownership et fichiers
- Base de départ strictement publiée et vérifiée `gh-pages@c9b19479ea2d89c8b63ed5f8e07f2e36d746237a` (portrait de réserve validé), CI `38400771582` / Pages `38400771906` SUCCESS.
- Checkpoint départ : `checkpoint/lab-start-dual-human-2v2-v1-2026-10-13`, branche `work/lab-dual-human-2v2-v1-2026-10-13`.
- `src/ui/capture-editor-combat-test-v1.js` projette **uniquement pour le test** le choix facultatif `allyControlMode:"solo"` vers le `controllerId` du deuxième allié. En l'absence du choix, l'ancienne donnée/export est inchangé.
- `src/ui/combat-2v2-test-ui.js` garde `format.localActorId` comme ancre stable du format et crée une sélection UI isolée `createLocalControlSelectionV1`. La sélection courante redirige les boutons de capacités, sélection de cible, Esquive, énergie, cooldowns et affichage du HUD vers le bon `actorId`.
- `src/ui/capture-combat-roster-controller-v1.js` obtient l'ID de l'acteur contrôlé uniquement lors de la projection des actions Rappel/Invocation et des candidates locales ; `Roster Session` reste l'unique responsable du roster et des PV. Aucun changement à Combat Rules, Runtime, Session, Damage/Health ni IA. Les deux slots conservent leurs actions et timelines indépendantes.
- `examples/dom-demo/capture-editor-v2.html` propose un choix IA/solo dans le test 2v2 et un indicateur discret de la créature pilotée ; CSS donne le focus uniquement à la créature actuellement contrôlée, sans masquer l'indicateur de cible.

## Fonctionnement / limites
- Le 1v1 reste inchangé et le mode IA demeure le défaut.
- En solo, **l'autre allié reste actif** et son action déjà préparée n'est pas annulée par le changement de HUD. L'IA adverse demeure active. Le HUD affiche les charges, cooldowns et l'énergie de l'acteur sélectionné depuis leurs propriétaires canoniques.
- Un tap sur un allié lorsqu'une compétence est explicitement en attente de ciblage reste une interaction de ciblage (utile aux soins/buffs alliés) ; sinon, ce tap change le contrôle.
- Un changement d'acteur est gratuit et immédiat. Le Rappel est toujours une commande native avec ses coûts/temporisations propres, séparée du changement de contrôle.
- Aucun partage de réseau, second HUD, second Combat Runtime, nouvelle autorité de dégâts ni modification d'asset auteur. Un test manuel Android paysage est obligatoire pour valider ergonomie/latence/accessibilité et peut conduire à du polish UI distinct.

## Tests et porte de publication
- TDD RED `tests/unit/dual-human-2v2-v1.test.mjs` au commit `e15bfc66f55546453d37329d2bb3a393bb0f3932` ; la CI `38401112003` échoue faute de contrat local (attendu).
- Tests : IA historique, solo A↔B et refus de contrôle ennemi/futur distant, persistance du BattleFormat, spécifications IA adverses uniquement, deux actions natives parallèles sans annulation et énergie propre, formulaire test 1v1/2v2 et export IA non modifié.
- Sentinelles historiques source de l'unique barre/local actor mises à jour de façon additive pour autoriser le `controlledActorId()` variable, tout en conservant la vérification de la source de compétences par acteur et l'interdiction d'IDs en dur.
- CI du code `38402179715`, SHA `8c26482518caddc5a6c3cec73e969eca990fe9f0` : Foundation SUCCESS, Chromium Firestorm SUCCESS, Chromium 103 créatures SUCCESS.
- Clôture requise : CI complète sur SHA documentaire final, checkpoint GREEN strictement identique, contrôle `gh-pages` avant publication fast-forward sous lease, puis CI/Pages post-publication. Validation utilisateur mobile séparée.
