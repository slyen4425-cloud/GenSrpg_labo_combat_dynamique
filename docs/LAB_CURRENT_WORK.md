# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Projectile Power Help V1

Branche :
`work/lab-projectile-power-help-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-projectile-power-help-v1-2026-10-07`

Base :
`9e37c39d6c3bbb9a231f8e7d3dc00ccacacd4477`

## Résultat

Le bloc `Collision entre projectiles` explique désormais clairement :

- `0` = hors système de clash ;
- minimum actif = `1` ;
- `1 contre 1` = annulation mutuelle ;
- `2 contre 1` = puissance 2 détruit puissance 1 et continue ;
- puissance de clash indépendante des dégâts ;
- aucune règle élémentaire n'est appliquée dans ce contrat actuel.

## Ownership

Aucun changement d'owner.

Inchangés :
- `ProjectilePowerV1` ;
- `projectile-clash` ;
- Combat Runtime ;
- données auteur.

L'UI décrit seulement le contrat existant.

## TDD

RED :
- `580709f6918c39accb09b85f966ea5eae5d8a629`
- CI `37679035816`
- 1245 / 1246 PASS.

GREEN :
- `814734fdfc5d1941d36ba1e4efd09e1a9fbfba9a`
- CI `37679147775`
- 1246 / 1246 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_PROJECTILE_POWER_HELP_V1.md`

## Correctif paysage inclus dans cette base

Le lot précédent est également inclus :
- toggle paysage supprimé ;
- paysage automatique via `previewDisplayMode.enter({ enabled: true })` ;
- rotate gate conservé uniquement comme secours navigateur.

Checkpoint précédent :
`checkpoint/lab-landscape-toggle-removal-v1-green-2026-10-07`

## Domaines protégés

Inchangés :
- Combat Rules / Runtime ;
- Goutte vive ;
- Animation / FX ;
- audio ;
- créatures ;
- Roster ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action protocolaire

- CI documentaire finale ;
- checkpoint `checkpoint/lab-projectile-power-help-v1-green-2026-10-07` ;
- preview `preview/lab-projectile-power-help-v1-2026-10-07` ;
- validation smartphone utilisateur.
