# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Fireball Cast Side Placement V1

Branche :
`work/lab-fireball-cast-side-placement-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-fireball-cast-side-placement-v1-2026-10-07`

Base :
`1bb89aecce8ed4e5848d2ccb98cbd72c423aeb67`

## Résultat

Boule de feu utilise maintenant le binding side-aware V9 existant.

Cast effectif :
- joueur : `+30`
- opposant : `-30`
- Y : `0`

Donnée canonique :
- `offsetX = 30`
- `offsetMode = "mirror_x"`

## Diagnostic validé

Le runtime transmettait déjà correctement la vue du lanceur.
Le défaut venait de la présentation Boule de feu encore en V8, incapable de porter un offset par côté.

Aucun renderer concurrent ni règle Fireball spécifique n'a été ajouté.

## TDD

RED :
- `f519c41a5bedbf9e3e01c6062a3e5d9b33a25f8f`
- CI `37682185692`
- 1247 / 1248 PASS.

GREEN :
- implémentation `e49ebd95fe2e62f1c68f1a732e42e504e0a33bab`
- sentinelle alignée `6fe9c45efad79645d518e349fbbdeea7f99fe21a`
- CI `37682374126`
- 1248 / 1248 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_FIREBALL_CAST_SIDE_PLACEMENT_V1.md`

## Domaines protégés

Inchangés :
- puissance projectile Boule de feu = 2 ;
- dégâts / éléments / énergie / timings ;
- assets / audio ;
- moteur side-aware V9 ;
- Combat Runtime / Rules ;
- autres compétences ;
- esquive ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action

Créer checkpoint/preview GREEN, puis ouvrir séparément :
**Goutte Vive Projectile Power 2 V1**
pour corriger la valeur auteur `1 -> 2`.
