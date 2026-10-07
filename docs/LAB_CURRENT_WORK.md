# Point de reprise courant — 2026-10-07

## Validation utilisateur précédente

Sylvain a validé sur smartphone :
- correction de la bibliothèque de créatures ;
- attaque souterraine / Burrow Visual V1.

Base GREEN utilisateur retenue :
`69fe844ef3c24ce7d0210fa6b36f78c9c2fbde97`.

## Lot actif

Water Atk1 Author Export V1

Branche :
`work/lab-water-atk1-author-export-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-water-atk1-author-export-v1-2026-10-07`

Base exacte :
`69fe844ef3c24ce7d0210fa6b36f78c9c2fbde97`

## Objectif

Intégrer exactement l'export auteur :
- ID stable : `cap_water_atk_1`
- nom : `Goutte vive`
- schema : `capture-skill-transfer-v1`

Le fichier utilisateur est la source de vérité complète selon §33.

## Owner

- `configuredSkills` reste l'unique owner actif ;
- Capture Transfer reste le seul chemin de remplacement ;
- Showcase startup ne fait qu'appliquer le transfert auteur en mode `replace`.

## Fichiers autorisés

- `data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json`
- `src/catalogs/capture-showcase-skill-presets-v1.js`
- test auteur dédié
- documentation du lot

## Domaines protégés

Ne pas modifier :
- données auteur ;
- créatures ;
- Combat Runtime / Session / Timing ;
- Animation / FX / Burrow ;
- collision ;
- Roster ;
- Dodge ;
- audio selector policy (lot séparé) ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD prévu

1. RED : le preset auteur exact n'existe pas dans la vitrine ;
2. intégrer le fichier sans transformation ;
3. ajouter l'ID au catalogue Showcase ;
4. vérifier import exact, valeurs auteur et remplacement stable ;
5. CI complète ;
6. checkpoint GREEN ;
7. lot audio séparé.

## Critère de fin

- fichier GitHub identique à l'export fourni ;
- `cap_water_atk_1` remplacé via l'owner existant ;
- aucune duplication ;
- présentation / audio auteur préservés ;
- CI verte.
