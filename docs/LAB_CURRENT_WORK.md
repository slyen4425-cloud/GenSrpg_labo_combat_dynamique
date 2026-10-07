# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Projectile Power Values V1

Branche :
`work/lab-projectile-power-values-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-projectile-power-values-v1-2026-10-07`

Base :
`129e6f0c6121868ad98f63d8f636f398d14d5533`

## Résultat

Valeurs auteur finales :

- Boule de feu : `2`
- Cendre aveuglante : `1`
- Goutte vive : `1`

## Modifications réelles

Deux lignes de données uniquement :

- Boule de feu : `1 -> 2`
- Cendre aveuglante : `0 -> 1`

Goutte vive est restée strictement inchangée.

Blob Goutte vive :
`53046be3171e46b571edc763666bb45397fe9785`

## TDD

RED :
- commit `20736cd856661b965672c8fb72a35f40a7ff8460`
- CI `37681164571`

GREEN :
- Boule de feu `e014291d9bbaa254881c8713bc0aa5241b9af13e`
- Cendre aveuglante `1404cd78d4bfe6640c2a4f19bcd7d98e75f3df50`
- CI `37681281954`
- 1247 / 1247 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_PROJECTILE_POWER_VALUES_V1.md`

## Domaines protégés

Inchangés :
- dégâts ;
- éléments ;
- énergie ;
- timings ;
- FX / audio / sockets ;
- ProjectilePowerV1 / projectile-clash ;
- Combat Runtime ;
- créatures ;
- paysage ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action protocolaire

- CI documentaire finale ;
- checkpoint `checkpoint/lab-projectile-power-values-v1-green-2026-10-07` ;
- preview `preview/lab-projectile-power-values-v1-2026-10-07` ;
- validation utilisateur au besoin.
