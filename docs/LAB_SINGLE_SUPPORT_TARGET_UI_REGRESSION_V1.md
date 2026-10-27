# Régression de ciblage implicite des compétences de soutien — 2026-10-11

## Signalement et cause

Le bouton de combat autorisait déjà le clic direct pour une définition strictement `targetRelations:["self"]` et pour une unique cible ennemie. En revanche, une compétence positive ayant `["self","ally"]` et **une seule cible réellement disponible** exigeait inutilement un clic sur la créature. Le choix d'un allié explicite (`["ally"]`) doit rester manuel conformément à son contrat existant.

La compétence auteur `cap_earth_atk_3` — Charge tellurique — a été vérifiée : définition importée `targetRelations:["self"]`, identifiant/niveaux/zone/statut inchangés. Son vrai chargement par `adaptCaptureSkillToSkillDefinition` est couvert par sentinelle : cible implicite = lanceur malgré sélection précédente de l'ennemi. Si le navigateur montre encore une demande de ciblage avec cette définition strictement soi, ce symptôme n'a pas été reproduit côté moteur et exige un essai Android avec données exactes chargées.

## Modification

`src/ui/combat-2v2-test-ui.js` : `resolveCombatSkillClickTargetV1` retourne la seule cible validée par les règles si la compétence autorise soi (`self`) ou est ennemie pure à unique cible ; ne change pas le comportement allié seul, ni la sélection manuelle si plusieurs cibles sont disponibles. Les règles de légalité, KO, présence et `session.previewSkill` continuent de filtrer les candidats avant cette décision ; aucun contournement gameplay.

## TDD / protections

- Tests RED `tests/unit/combat-implicit-single-target-ui-v1.test.mjs` commit `4ba1618845f4bfd4ac13673e79707ba87770e714`, foundation CI `38095234359` deux échecs attendus.
- Première correction `576796e1b9dca927d2a5d8409ad9c68a64ac38c2` : la sentinelle allié-seul a détecté une portée trop large, CI foundation `38095257867` échec attendu en revue de régression.
- Correction ciblée `98e00d91db9e1406c1c3f2b68d9d24398da8e26f` : n'affecte pas le ciblage explicite des compétences `ally` seules.
- Baseline `gh-pages` `37febdf150aa027f213124945637a4d46dc25387` ; checkpoint départ `checkpoint/lab-start-single-support-target-ui-regression-v1-2026-10-11`.

Aucune modification aux compétences auteur, à la bibliothèque des créatures, à l'animation, aux zones/FX, à `main`, `global-assets`, `Zombicide-40k` ou Exploration. La validation smartphone reste une étape distincte après publication.
