# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Water Atk1 Author Export V1

Branche :
`work/lab-water-atk1-author-export-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-water-atk1-author-export-v1-2026-10-07`

Base :
`69fe844ef3c24ce7d0210fa6b36f78c9c2fbde97`

## Validation utilisateur précédente

Sylvain a validé sur smartphone :
- correction de la bibliothèque de créatures ;
- attaque souterraine / Burrow Visual V1.

## Résultat

`cap_water_atk_1` / **Goutte vive** est intégré via le vrai Capture Transfer en mode remplacement, sans duplication.

Fichier auteur :
`data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json`

Blob exact :
`53046be3171e46b571edc763666bb45397fe9785`

Le fichier GitHub correspond exactement à l'export fourni.

## Ownership

Inchangé :
- `configuredSkills` = unique owner actif ;
- Capture Transfer = unique chemin de remplacement ;
- Showcase = simple source d'import au démarrage.

## TDD

RED :
- commit `5c60e748239891dac8adb8c7f727fc71e9f5cacb`
- CI `37671589125`
- 1237 / 1240 PASS
- 3 FAIL ciblés.

GREEN fonctionnel :
- commit `ca403a4a4f8a421906222f220f19e01eb61e7ed0`
- CI `37671779676`
- 1240 / 1240 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_WATER_ATK1_AUTHOR_EXPORT_V1.md`

## Domaines protégés

Inchangés :
- créatures ;
- Combat Runtime / Session / Timing ;
- Animation / FX / Burrow ;
- collision ;
- Roster ;
- Dodge ;
- audio selector policy ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action

Créer checkpoint GREEN du lot puis ouvrir séparément :
**Audio Role Tags V1** — tous les sons sélectionnables, rôles utilisés comme tags de classement uniquement.
