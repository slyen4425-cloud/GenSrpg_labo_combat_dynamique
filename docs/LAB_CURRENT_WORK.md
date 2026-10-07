# Point de reprise courant — 2026-10-07

## Lot actif

Projectile Power Help V1

Branche :
`work/lab-projectile-power-help-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-projectile-power-help-v1-2026-10-07`

Base exacte :
`9e37c39d6c3bbb9a231f8e7d3dc00ccacacd4477`

Base GREEN précédente :
`checkpoint/lab-landscape-toggle-removal-v1-green-2026-10-07`

## Besoin utilisateur

Rendre le fonctionnement de la puissance projectile plus clair directement dans l'éditeur.

## Règle existante à expliquer, sans la modifier

- `0` = hors système de clash : les projectiles peuvent se traverser ;
- minimum actif = `1` ;
- puissance égale = annulation mutuelle ;
- puissance supérieure = le projectile le plus fort détruit l'autre et continue ;
- la puissance de clash est indépendante des dégâts ;
- aucune priorité élémentaire (ex. Eau > Feu) n'est appliquée dans ce contrat actuel.

## Périmètre

UI informative uniquement :
- `examples/dom-demo/capture-editor-v2.html`
- test sentinelle projectile power
- documentation

## Domaines protégés

Ne pas modifier :
- `src/contracts/projectile-power-v1.js` ;
- `src/core/combat/projectile-clash.js` ;
- Combat Runtime ;
- données auteur Goutte vive ;
- valeurs de puissance ;
- éléments ;
- Animation / FX ;
- paysage ;
- audio ;
- créatures ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. RED : l'éditeur doit expliquer les 4 cas fondamentaux ;
2. exemples visibles `1 vs 1` et `2 vs 1` ;
3. rappeler puissance de clash ≠ dégâts ;
4. préciser qu'aucune règle élémentaire n'est appliquée aujourd'hui ;
5. CI complète ;
6. checkpoint/preview GREEN.

## Critère de fin

Un joueur peut comprendre le réglage sans connaître le moteur, sans qu'aucune règle gameplay ne soit dupliquée dans l'UI.
