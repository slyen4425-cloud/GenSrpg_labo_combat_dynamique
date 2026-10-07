# Projectile Power Help V1

Date : 2026-10-07

## Objectif

Rendre la règle de puissance projectile compréhensible directement dans l'éditeur sans modifier le gameplay.

## Base

Base :
`9e37c39d6c3bbb9a231f8e7d3dc00ccacacd4477`

Checkpoint de départ :
`checkpoint/lab-start-projectile-power-help-v1-2026-10-07`

Branche :
`work/lab-projectile-power-help-v1-2026-10-07`

## Aide ajoutée

Le bloc `Collision entre projectiles` explique maintenant :

- `0` = hors système de clash : les projectiles se traversent ;
- minimum actif = `1` ;
- `1 contre 1` = puissance égale, les deux projectiles sont annulés et disparaissent ;
- `2 contre 1` = le projectile de puissance 2 détruit celui de puissance 1 et continue ;
- la puissance de clash est indépendante des dégâts ;
- l'élément n'intervient pas dans cette règle actuelle ;
- aucune règle élémentaire telle que Eau > Feu n'est appliquée ici.

## Architecture

Aucun code gameplay modifié.

Inchangés :
- `src/contracts/projectile-power-v1.js`
- `src/core/combat/projectile-clash.js`
- Combat Runtime
- valeurs auteur
- éléments et dégâts

L'UI décrit uniquement le contrat existant.

## TDD

RED :
- `580709f6918c39accb09b85f966ea5eae5d8a629`
- CI `37679035816`
- 1245 / 1246 PASS
- 1 FAIL ciblé : exemples / séparation dégâts-élément absents.

GREEN :
- `814734fdfc5d1941d36ba1e4efd09e1a9fbfba9a`
- CI `37679147775`
- 1246 / 1246 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Domaines protégés

Aucun changement de :
- Goutte vive ;
- puissance des compétences ;
- Projectile Clash ;
- Combat Runtime ;
- Animation / FX ;
- paysage ;
- audio ;
- créatures ;
- Roster ;
- main ;
- Zombicide-40k ;
- Exploration.

## Validation utilisateur

GREEN technique.

À vérifier sur smartphone :
- texte lisible sous la puissance projectile ;
- aucun encombrement excessif ;
- compréhension immédiate des exemples 1 vs 1 et 2 vs 1.
