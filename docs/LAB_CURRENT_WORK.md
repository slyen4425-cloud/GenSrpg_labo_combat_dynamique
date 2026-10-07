# Point de reprise courant — 2026-10-07

## Micro-lot actif

Maraileron Author Export V1

Branche :
`work/lab-maraileron-author-export-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-maraileron-author-export-v1-2026-10-07`

Base exacte :
`539d7b82a11e9df83de2af65bdecdef0eeb81ac2`

Base précédente :
`checkpoint/lab-dodge-vanish-visual-v1-green-2026-10-07`

## Objectif

Intégrer sans reconstruction les deux exports auteur fournis par Sylvain :
- capacité `cap_water_atk_2` — Morsure de marée ;
- créature `crea_maraileron` — Maraileron.

Le chemin obligatoire reste :
`importCaptureTransferJsonV1 -> planCaptureTransferImportV1(mode:"replace") -> applyCaptureTransferPlanToEditorStateV1`.

L'export auteur est la source de vérité conformément à LAB_CHARTE §33.

## Owners concernés

- données capacité : `configuredSkills` ;
- données créature : `configuredCreatures` ;
- import/remplacement : Capture Transfer owner existant ;
- hydratation vitrine : catalogues Showcase existants.

Aucun nouvel owner n'est autorisé.

## Fichiers autorisés

- `data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json`
- `data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json`
- `src/catalogs/capture-showcase-skill-presets-v1.js`
- `src/catalogs/capture-showcase-creature-presets-v1.js`
- tests dédiés au round-trip/remplacement
- `docs/LAB_CURRENT_WORK.md`
- rapport de lot

## Domaines protégés

Ne pas modifier :
- Combat Runtime / Session ;
- Animation Core ;
- FX Core ;
- renderer ;
- collisions ;
- Dodge ;
- Tempête / zones persistantes ;
- audio ;
- roster ;
- dépôt Zombicide-40k ;
- dépôt Exploration ;
- main.

## TDD prévu

RED :
- les exports Maraileron/Morsure ne sont pas encore présents dans les presets showcase ;
- le vrai chemin de remplacement par ID stable n'est donc pas encore protégé par une sentinelle dédiée.

GREEN attendu :
- les deux transferts sont importables ;
- `cap_water_atk_2` remplace exactement l'ancienne capacité sans changer le nombre de capacités ;
- `crea_maraileron` remplace exactement l'ancienne créature sans changer le nombre de créatures ;
- valeurs auteur importantes conservées ;
- Maraileron garde son loadout exact, dont `cap_water_atk_2` en slot-2 ;
- round-trip export/import stable ;
- CI complète verte.

## Suite séparée

Après GREEN technique de ce lot seulement :
**Burrow Visual V1** sur une nouvelle branche/checkpoint.
Le gameplay burrow reste possédé par Combat Runtime ; le lot suivant ne modifiera que la projection visuelle générique.
