# Atténuation des contours tactiques élémentaires V1 — 16 octobre 2026

## Objet

Retour auteur : le nouveau cercle tactique coloré est trop voyant et masque la lisibilité du sprite. Choix explicite : réduire l'intensité **sans** ajouter une nouvelle option dans l'éditeur.

## Périmètre et autorité

- Source unique de présentation : `examples/dom-demo/demo.css`, règles `--tactical-edge`, `--tactical-halo`, `--tactical-inner`, `--tactical-fill` des 13 éléments.
- Le même jeu de variables colore l'onde expansive et la zone persistante ; l'élément natif reste projeté par le renderer existant.
- **Aucun changement** aux transforms, bounds, épaisseur du trait (1,5 CSS px), hitboxes, animation des sprites, damage ticks, phase 3 plein champ, IA, index des capacités ou données des exports. Le pointeur reste non interactif.

## Réglages visuels (alpha)

| Composant | Précédent | Nouveau |
| --- | ---: | ---: |
| Ligne extérieure de chaque élément | 0,88 | **0,52** |
| Halo coloré | 0,32 | **0,14** |
| Anneau intérieur de l'onde | 0,35 | **0,18** |
| Remplissage intérieur de zone | 0,035 | **0,012** |

Les teintes RGB de tous les éléments sont strictement identiques. La palette neutre est également adoucie : contour 0,78 → 0,52, halo 0,24 → 0,12, anneau 0,30 → 0,16, remplissage 0,035 → 0,012.

## Tests et limites

- Le test `elemental-tactical-radii-v1.test.mjs` vérifie les nouvelles alphas pour les 13 éléments et les valeurs neutres, en plus du raccord `CombatState.skillElement` et de la géométrie existante.
- Le navigateur réel `firestorm-zone-growth-smoke.mjs` vérifie l'alpha calculé du trait feu, le halo, le comportement du sprite, le contour, les rayons court/moyen/long, et la fin des zones en 1v1/2v2 (joueur et IA).
- Validation technique = Foundation + Firestorm Chromium + Creature Library Chromium **sur le SHA final**, puis checkpoint GREEN, publication sous lease et déploiement GitHub Pages. Validation esthétique sur téléphone Android paysage encore distincte.
