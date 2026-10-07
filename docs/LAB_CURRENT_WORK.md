# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Goutte Vive Projectile Power 2 V1

Branche :
`work/lab-goutte-projectile-power-2-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-goutte-projectile-power-2-v1-2026-10-07`

Base :
`c86f81733c3b2f392717124e9d16ef802aea0daa`

## Résultat

Goutte vive :
`projectileClash.power = 2`

Modification auteur unique :
`1 -> 2`

## Vraie chaîne

La valeur 2 est conservée dans :
Author Transfer -> configuredSkills -> Combat Export -> Native Adapter -> Combat Runtime.

Deux projectiles Goutte vive puissance 2 s'annulent mutuellement lorsqu'ils se rencontrent, conformément au contrat égalité existant.

## TDD

RED :
- `d21dd700c71af411643c1f5c0b5d37c17833e950`
- CI `37682665363`
- 1247 / 1248 PASS.

Donnée :
- `5be9cf13a178f265a53076eeb88cca6abe89b692`

GREEN :
- sentinelle true-path `ac08d10b05a319700af46347ee285d480536c6ee`
- CI `37682851059`
- 1248 / 1248 PASS
- 0 FAIL.

Rapport :
`docs/LAB_GOUTTE_PROJECTILE_POWER_2_V1.md`

## Inclus depuis le GREEN précédent

Boule de feu :
- cast joueur `+30`
- cast opposant `-30`
- SkillPresentationBinding V9 side-aware.

## Domaines protégés

Inchangés :
- dégâts / éléments / énergie / timings Goutte vive ;
- FX / audio / sockets ;
- ProjectilePowerV1 / projectile-clash ;
- Combat Runtime ;
- Cendre aveuglante ;
- créatures ;
- paysage ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action

- CI documentaire finale ;
- checkpoint `checkpoint/lab-goutte-projectile-power-2-v1-green-2026-10-07` ;
- preview `preview/lab-goutte-projectile-power-2-v1-2026-10-07` ;
- puis chantier séparé **Creature Dodge Appearance FX V1**.
