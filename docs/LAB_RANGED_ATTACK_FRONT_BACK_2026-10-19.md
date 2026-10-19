# Animation d'attaque à distance FACE / DOS — 19 octobre 2026

## Objectif
Le modèle vu de face (adversaire) et celui vu de dos (joueur) disposent de sélecteurs distincts dans l'onglet Créature > Apparence > Animations. Les deux listes exploitent le filtre `attack` du catalogue déjà présent. Aucun média n'est produit ou remplacé.

## Contrats et compatibilité
- `CreaturePresentationBindingV6` est additif : `visual.rangedAttack` pour face, `visual.rangedAttackBack` pour dos. Ils sont optionnels et validés par le contrat média partagé V4/V5.
- `V5` utilisait un sprite unique pour les deux vues. Il reste identique en runtime ; son chargement éditeur préremplit les deux listes avec cet asset. L'enregistrement en V6 ne supprime pas le dos.
- Sur un V6, l'absence d'une vue signifie affichage normal, jamais réutilisation tacite d'une silhouette mal orientée.
- Mode, taille, tours, frames et transition restent communs aux deux sélections ; le catalogue `resource.frameCount` est déjà pris en compte pour les sources de sprites.
- L'adaptateur de présentation est la seule autorité de résolution d'assets ; `creatureRangedAppearanceForViewV1` choisit la vue du combattant sans modifier la compétence, le projectile, le timing ou les collisions.

## Vérification
- Sentinelles de normalisation et d'aller-retour des fiches, comparaison rétrocompatible V5.
- Réel passage d'un export au média combat : adversaire -> face, joueur -> dos, absence -> normal.
- Deux sélecteurs HTML sous `Animations`, tous deux filtrés sur `attack`.
- CI complète (foundation et navigateurs), checkpoint GREEN et Pages au SHA exact à confirmer par GitHub Actions.
- Test visuel réel sur smartphone séparé de la validation technique.

## Vérification réelle du lot technique
- Run GitHub Actions `39290933321` sur `338b74b9d6d378d35444fe30d2891daf71e129eb` : **5/5 SUCCESS** (Foundation et 4 navigateurs).
- Checkpoint final `checkpoint/lab-ranged-front-back-green-2026-10-19`; publication `gh-pages` à vérifier au SHA après commit documentaire.
