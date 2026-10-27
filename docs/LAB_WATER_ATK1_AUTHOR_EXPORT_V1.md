# Water Atk1 Author Export V1

Date : 2026-10-07

## Objectif

Intégrer exactement l'export auteur de `cap_water_atk_1` / **Goutte vive** dans la vitrine Capture, sans reconstruire ni corriger silencieusement la compétence.

Base :
`69fe844ef3c24ce7d0210fa6b36f78c9c2fbde97`

Checkpoint de départ :
`checkpoint/lab-start-water-atk1-author-export-v1-2026-10-07`

Branche :
`work/lab-water-atk1-author-export-v1-2026-10-07`

## Source auteur

Fichier :
`gensrpg-capture-skill-cap_water_atk_1.json`

Intégré sous :
`data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json`

Blob Git exact :
`53046be3171e46b571edc763666bb45397fe9785`

Le blob correspond exactement aux octets du fichier utilisateur.

## Valeurs auteur préservées

- ID : `cap_water_atk_1`
- nom : `Goutte vive`
- niveau requis : 1
- forme : projectile
- élément : water
- énergie : 3
- préparation : 800 ms
- trajet : 800 ms
- récupération : 200 ms
- cooldown : 15000 ms
- dégâts : 10 water
- dodgeable : true
- cast : `pack:capture:sprite-cast-water-01`
- projectile : `pack:capture:sprite-projectile-water-01`
- impact : `pack:capture:sprite-impact-water-01`
- son cast : `gensrpg:sound:xel-cbc6cf88`
- son trajet : `gensrpg:sound:xel-48520d94`

## Ownership

Inchangé :
- `configuredSkills` reste l'unique owner actif ;
- Capture Transfer reste l'unique chemin de remplacement ;
- le catalogue Showcase ne fait que référencer le transfert auteur ;
- aucun mock, fallback ou doublon de compétence ajouté.

## TDD

RED :
- commit `5c60e748239891dac8adb8c7f727fc71e9f5cacb`
- CI `37671589125`
- 1240 tests
- 1237 PASS / 3 FAIL ciblés :
  1. fichier auteur absent ;
  2. remplacement stable impossible ;
  3. preset absent du catalogue.

GREEN fonctionnel :
- fichier auteur : `ed2424935d91e5f69794890c9fb56c72855f5584`
- catalogue : `ac759e26aa07bb258b9c24fe7c5b6161a69e8fc0`
- correction exactitude octets : `ca403a4a4f8a421906222f220f19e01eb61e7ed0`
- CI `37671779676`
- 1240 / 1240 PASS
- 0 FAIL
- structure / frontières / indépendance : OK

## Domaines protégés

Aucun changement de :
- créatures ;
- Combat Runtime / Session / Timing ;
- Animation / FX / Burrow ;
- collision ;
- Roster ;
- Dodge ;
- politique des sélecteurs audio ;
- main ;
- Zombicide-40k ;
- Exploration.

## Suite

Le besoin « tous les sons accessibles, rôles uniquement comme tags » est traité dans un micro-lot distinct.
