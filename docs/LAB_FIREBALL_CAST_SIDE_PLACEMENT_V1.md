# Fireball Cast Side Placement V1

Date : 2026-10-07

## Problème

Le cast de Boule de feu côté opposant ne respectait pas le décalage auteur attendu.

## Diagnostic

La présentation active était encore en SkillPresentationBinding V8 :
- joueur : offsetX = +30 ;
- aucun offset side-aware opposant ;
- donc le réglage opposant -30 ne pouvait pas être porté par le binding.

Le runtime et le resolver de vue étaient déjà corrects.

## Correction

Boule de feu passe uniquement sa présentation en V9 :
- cast.offsetX = +30
- cast.offsetY = 0
- cast.offsetMode = mirror_x

Résolution effective :
- joueur = +30
- opposant = -30

Aucune règle spécifique Fireball n'a été ajoutée au renderer.

## TDD

RED :
- commit `f519c41a5bedbf9e3e01c6062a3e5d9b33a25f8f`
- CI `37682185692`
- 1247 / 1248 PASS
- 1 FAIL ciblé.

Implémentation :
- `e49ebd95fe2e62f1c68f1a732e42e504e0a33bab`

Sentinelle historique V8 alignée sur la nouvelle autorité V9 :
- `6fe9c45efad79645d518e349fbbdeea7f99fe21a`

GREEN :
- CI `37682374126`
- 1248 / 1248 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Invariants

Inchangés :
- puissance projectile 2 ;
- dégâts ;
- éléments ;
- énergie ;
- timings ;
- assets / audio ;
- moteur side-aware ;
- Combat Runtime / Rules ;
- autres compétences ;
- esquive ;
- main ;
- Zombicide-40k ;
- Exploration.
