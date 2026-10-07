# Point de reprise courant — 2026-10-07

## Lot actif

Projectile Power Values V1

Branche :
`work/lab-projectile-power-values-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-projectile-power-values-v1-2026-10-07`

Base exacte :
`129e6f0c6121868ad98f63d8f636f398d14d5533`

Base GREEN précédente :
`checkpoint/lab-projectile-power-help-v1-green-2026-10-07`

## Demande utilisateur

Régler uniquement les puissances projectile auteur :

- Boule de feu : `2`
- Cendre aveuglante : `1`
- Goutte vive : `1`

## État de départ vérifié

- Boule de feu : `1`
- Cendre aveuglante : `0`
- Goutte vive : `1`

Donc seules Boule de feu et Cendre aveuglante nécessitent une modification.
Goutte vive doit rester strictement inchangée.

## Périmètre autorisé

- `data/capture/showcase/fireball.capture-skill-transfer-v1.json`
- `data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json`
- test sentinelle dédié
- documentation

## Domaines protégés

Ne pas modifier :
- Goutte vive hors sentinelle de valeur ;
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

## TDD

1. RED : attendre exactement `2 / 1 / 1` ;
2. modifier uniquement les deux champs auteur nécessaires ;
3. vérifier que Goutte vive conserve exactement son blob ;
4. CI complète ;
5. checkpoint/preview GREEN.

## Critère de fin

Les trois valeurs auteur sont exactement :
`Boule de feu 2 / Cendre aveuglante 1 / Goutte vive 1`,
sans autre changement fonctionnel.
