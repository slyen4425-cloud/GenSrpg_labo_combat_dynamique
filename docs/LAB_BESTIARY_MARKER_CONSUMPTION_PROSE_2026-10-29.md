# Bestiaire — explications des effets proportionnels aux charges consommées

Date : 2026-10-29.

## Périmètre

Source du chantier : `gh-pages@9bda4f716f979a56def9bae3d21d2dd94770df8a`.
Départ : `checkpoint/lab-start-bestiary-marker-per-charge-prose-2026-10-29`.
Travail : `work/lab-bestiary-marker-per-charge-prose-2026-10-29`.

Le bestiaire existant affiche `describeCaptureSkillV1()` à partir des `SkillDefinition` auteurs. Aucun texte ad hoc par créature, aucune modification du contrat ou des dégâts, aucune copie de la formule dans les transferts JSON.

## Règle générale

Si un effet `consume_marker` comporte `perCharge:true`, les sous-effets numériques réellement multipliés par le moteur (`damage`, `heal`, `energy_restore`, `energy_drain`) affichent immédiatement après la quantité **« par charge consommée »**.

- Explosion florale / Grainou : **Inflige 25 dégâts de Nature par charge consommée à la cible.**
- Choc venin : calcul analogue pour ses dégâts d'Électricité.
- Soin et énergie dans un effet à charges : afficher la même proportion sur leur quantité.
- Si `perCharge` est absent ou `false`, ne pas inventer cette proportion ; si un sous-effet est non numérique (ex. statut), ne pas lui attribuer de multiplication.
- Le message « les effets augmentent avec les charges consommées », trop vague, est supprimé. La première phrase continue de préciser le nom du marqueur consommé, le nombre et le minimum éventuel.

Tests : `tests/unit/capture-bestiary-marker-consumption-prose-2026-10-29.test.mjs`, avec régressions sur les capacités ordinaires. CI Foundation + quatre Chromium ; checkpoint GREEN après validation et publication GitHub Pages.

Limites : cette modification est textuelle (projection de l'éditeur), sans modification des transferts auteur, des paramètres de combat ou des animations.
