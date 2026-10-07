# Goutte Projectile Power Regression V1

Date : 2026-10-07

## Retour utilisateur

Goutte vive semblait arriver en combat avec une puissance projectile 0, tandis qu'un projectile adverse était à 1 ; les projectiles se traversaient sans clash.

## Contrat vérifié

Le contrat existant est volontaire :
- `power = 0` : hors système de clash, les projectiles peuvent se traverser ;
- puissance positive : participe au clash ;
- puissance supérieure : survit et continue ;
- puissance égale : annulation mutuelle.

## Donnée auteur

`cap_water_atk_1` / Goutte vive possède déjà :
`projectileClash.power = 1`.

Aucune donnée auteur n'a été modifiée.

## Vrai chemin testé

`Author Transfer -> configuredSkills -> Combat Export -> Native Adapter -> Combat Runtime`

Résultat :
- entrée historique native : power 0 ;
- remplacement auteur : power 1 ;
- configuredSkills : power 1 ;
- export combat : power 1 ;
- skill natif : power 1 ;
- Runtime : 1 vs 1 => deux résultats `clashed`.

Le moteur actuel ne transforme donc pas Goutte vive en 0.

## Correctif produit

L'UI explique désormais sans ambiguïté :
- `0 = hors système de clash : les projectiles se traversent` ;
- `Minimum actif = 1`.

Cela évite de lire 0 comme une puissance faible.

## Tests

Vrai chemin :
`tests/integration/goutte-projectile-power-regression-v1.test.mjs`

Sentinelle UI :
`tests/unit/projectile-power-v1.test.mjs`

CI finale fonctionnelle :
`37677076374`

Résultat :
- 1244 / 1244 PASS ;
- 0 FAIL ;
- structure / frontières / indépendance : OK.

## Conclusion

Aucun changement de Combat Rules n'était justifié.
Aucune règle Eau > Feu n'a été inventée.
Pour qu'un projectile continue après le clash, sa puissance doit être strictement supérieure à celle de l'autre.
