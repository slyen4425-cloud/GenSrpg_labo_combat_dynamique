# Goutte Vive Projectile Power 2 V1

Date : 2026-10-07

## Correction auteur

Valeur finale :
`cap_water_atk_1 / Goutte vive / projectileClash.power = 2`

La valeur 1 du lot précédent était une consigne corrigée par l'auteur.

## Modification

Un seul champ auteur :
- `data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json`
- `projectileClash.power: 1 -> 2`

Aucun autre champ Goutte vive n'a été modifié.

## TDD

RED :
- `d21dd700c71af411643c1f5c0b5d37c17833e950`
- CI `37682665363`
- 1247 / 1248 PASS
- seul échec : valeur encore à 1.

Donnée :
- `5be9cf13a178f265a53076eeb88cca6abe89b692`

La CI suivante a correctement révélé l'ancienne sentinelle true-path encore figée sur 1.

Sentinelle true-path réalignée :
- `ac08d10b05a319700af46347ee285d480536c6ee`

GREEN :
- CI `37682851059`
- 1248 / 1248 PASS
- 0 FAIL.

## Vraie chaîne vérifiée

Author Transfer -> configuredSkills -> Combat Export -> Native Adapter -> Combat Runtime.

La puissance reste 2 à chaque étape.

Deux Goutte vive puissance 2 qui se rencontrent s'annulent mutuellement selon la règle existante d'égalité.

## Invariants

Inchangés :
- dégâts 10 Eau ;
- énergie 3 ;
- préparation 800 ms ;
- trajet 800 ms ;
- récupération 200 ms ;
- cooldown 15000 ms ;
- FX / audio / sockets ;
- ProjectilePowerV1 / projectile-clash ;
- Combat Runtime ;
- Boule de feu ;
- Cendre aveuglante ;
- créatures ;
- esquive ;
- main ;
- Zombicide-40k ;
- Exploration.
