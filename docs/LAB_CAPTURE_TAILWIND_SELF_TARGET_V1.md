# Labo Combat — Vent arrière : réparation ciblage réel self, 2026-10-11

## Signal utilisateur / diagnostic

Après l'intégration des deux compétences auteur et de la correction d'IDs de statut, l'utilisateur voit **un seul effet sur sa créature** en combat et signale que certaines compétences équipées semblent dépourvues de réglages. Le test précédent de `createCombatSession` appelait explicitement `startSkill({targetId:"player"})` : il ne testait pas la cible réelle du bouton de combat.

L'UI propriétaire `src/ui/combat-2v2-test-ui.js` initialise `selectedTargetId` sur l'adversaire et résout les clics selon `skill.targetRelations`. Le preset `lib_tailwind` autorisait `enemy`, `ally`, `self` et affectait `targetScope:"self"` uniquement au bonus de Vitesse. Les trois autres statuts utilisaient `targetScope:"target"`. Sur un lancement vers l'adversaire, un statut tombait sur le lanceur et trois sur l'adversaire. La collision d'IDs réparée au lot précédent était une seconde cause indépendante : les deux corrections sont nécessaires.

## Correction à l'unique propriétaire

- Une seule définition modifiée : `data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json`.
- `targetRelations:["self"]` et les quatre `targetScope:"self"` : bonus de Vitesse +30, recharge +150%, régénération énergie +100%, contrepartie Défense −100, tous 15 secondes **sur le lanceur uniquement**.
- L'ID stable `lib_tailwind`, les IDs distincts des quatre statuts, leurs valeurs, durées, visual `statusVisuals`, icon, temps de recharge, énergie, animations, sons et tous les autres presets restent inchangés.
- C'est une correction de données du skill; aucun changement de `Combat Runtime`, `HUD`, targeting UI, de `main`, `global-assets` ou de `Zombicide-40k`.
- Git SHA256 de la représentation texte cible : `a76ce1197e283bf13afba1da3c3ab5a6fa601becb912b6f1c0f5c75f7d863504` (4093 octets). Source auteur originale conservée par Git dans le checkpoint antérieur.

## Régression de ciblage + configuration équipée

- Le test RED `tests/unit/capture-tailwind-actual-target-regression-v1.test.mjs` commence avec l'adversaire sélectionné, utilise `combatSkillTargetOptionsV1` et `resolveCombatSkillClickTargetV1`, puis le vrai `CombatSession` et le HUD. Un clic self doit donner 4 statuts à la créature et 0 au rival, en 1v1 comme en 2v2.
- Les anciens tests de données et statut restent actifs et sont mis à jour pour le ciblage self voulu, avec hash/valeurs toujours vérifiés.
- Audit des configurations équipées : `crea_ailevent` conserve les 4 IDs de loadout et `cap_air_atk_3` a bien son preset auteur actif et ses visuels/sons. Les `cap_air_atk_1,2,4` sont des entrées natives sans preset auteur additionnel actuellement ; les réglages éventuels faits dans une autre session ne peuvent pas être revendiqués comme restaurés sans leurs exports.
- `configuredSkills` et `configuredCreatures` sont des Maps reconstruites à chaque chargement. Enregistrer dans la bibliothèque active n'implique pas l'écriture sur GitHub ou en stockage persistant ; les JSON exportés et commits sont les sauvegardes reproductibles.

## Charte

Base `gh-pages` `7212ec92fc9fdc62d194e0c6125379573fee952a`, checkpoint départ `checkpoint/lab-start-capture-tailwind-self-target-2026-10-11`, work `work/lab-capture-tailwind-self-target-2026-10-11`. Test RED → GREEN au SHA exact, revue des fichiers, checkpoint GREEN et fast-forward non forcé si la CI est verte, puis validation CI + GitHub Pages sur le commit publié. Aucune suppression de donnée auteur ni fallback masqué. Test manuel Android obligatoire pour confirmer les 4 statuts sur Ailevent.
