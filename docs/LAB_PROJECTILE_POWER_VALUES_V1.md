# Projectile Power Values V1

Date : 2026-10-07

## Demande

Régler uniquement les puissances projectile auteur :

- Boule de feu : `2`
- Cendre aveuglante : `1`
- Goutte vive : `1`

## État initial

- Boule de feu : `1`
- Cendre aveuglante : `0`
- Goutte vive : `1`

## Modification

Deux champs seulement ont été modifiés :

- `data/capture/showcase/fireball.capture-skill-transfer-v1.json`
  - `projectileClash.power: 1 -> 2`
- `data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json`
  - `projectileClash.power: 0 -> 1`

Goutte vive n'a pas été réécrite.

Blob Goutte vive conservé :
`53046be3171e46b571edc763666bb45397fe9785`

## TDD

RED :
- `20736cd856661b965672c8fb72a35f40a7ff8460`
- CI `37681164571`
- la sentinelle échoue avant modification.

GREEN :
- Boule de feu : `e014291d9bbaa254881c8713bc0aa5241b9af13e`
- Cendre aveuglante : `1404cd78d4bfe6640c2a4f19bcd7d98e75f3df50`
- CI `37681281954`
- 1247 / 1247 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Invariants

Inchangés :
- dégâts ;
- éléments ;
- énergie ;
- timings ;
- FX / audio / sockets ;
- ProjectilePowerV1 ;
- projectile-clash ;
- Combat Runtime ;
- créatures ;
- paysage ;
- main ;
- Zombicide-40k ;
- Exploration.

## Valeurs finales

- Boule de feu : `2`
- Cendre aveuglante : `1`
- Goutte vive : `1`
