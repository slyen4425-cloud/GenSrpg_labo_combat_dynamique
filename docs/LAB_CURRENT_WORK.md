# Point de reprise courant — 2026-10-07

## Lot actif

Goutte Vive Projectile Power 2 V1

Branche :
`work/lab-goutte-projectile-power-2-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-goutte-projectile-power-2-v1-2026-10-07`

Base exacte :
`c86f81733c3b2f392717124e9d16ef802aea0daa`

Base GREEN précédente :
`checkpoint/lab-fireball-cast-side-placement-v1-green-2026-10-07`

## Correction utilisateur

La valeur correcte de Goutte vive est :
`projectileClash.power = 2`

La valeur `1` du lot précédent était une erreur de consigne corrigée par l'auteur.

## Objectif

Modifier uniquement la puissance projectile auteur de Goutte vive :
`1 -> 2`

et réaligner les sentinelles qui validaient l'ancienne décision à 1.

## Périmètre autorisé

- `data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json`
- tests/sentinelles Goutte vive concernant explicitement projectileClash.power
- documentation

## Domaines protégés

Ne pas modifier :
- dégâts ;
- élément Eau ;
- énergie ;
- timings ;
- FX / audio / sockets ;
- ProjectilePowerV1 / projectile-clash ;
- Combat Runtime ;
- Boule de feu ;
- Cendre aveuglante ;
- créatures ;
- esquive ;
- paysage ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. RED : Goutte vive doit être puissance 2 ;
2. modifier uniquement le champ auteur `projectileClash.power` ;
3. réaligner les anciennes sentinelles de valeur 1 avec la décision corrigée ;
4. vérifier la vraie chaîne configuredSkills -> export -> adapter -> Runtime ;
5. CI complète ;
6. checkpoint/preview GREEN.

## Critère de fin

Goutte vive est puissance projectile 2 partout dans la vraie chaîne, sans autre changement auteur.
