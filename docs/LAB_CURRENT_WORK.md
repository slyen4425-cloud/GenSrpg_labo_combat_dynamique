# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Maraileron Author Export V1

Branche :
`work/lab-maraileron-author-export-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-maraileron-author-export-v1-2026-10-07`

Base :
`539d7b82a11e9df83de2af65bdecdef0eeb81ac2`

## Résultat

Les deux exports auteur fournis par Sylvain sont intégrés par le vrai pipeline §33, sans reconstruction :
- `cap_water_atk_2` — Morsure de marée ;
- `crea_maraileron` — Maraileron.

Les deux fichiers GitHub ont été comparés aux fichiers utilisateur : correspondance texte exacte.

Chemin :
`Showcase transfer -> importCaptureTransferJsonV1 -> planCaptureTransferImportV1(mode:"replace") -> applyCaptureTransferPlanToEditorStateV1 -> configuredSkills/configuredCreatures`.

## TDD

RED :
- commit `39ddc04153f8ef6d0ae440c6ca5ebc36b0e29d7e`;
- CI `37663672396`;
- 1226 / 1230 PASS ;
- 4 FAIL ciblés.

GREEN fonctionnel :
- commit `4f85547073512aefc3610a70b03418edb36737d5`;
- CI `37664111065`;
- 1230 / 1230 PASS ;
- 0 FAIL.

Rapport :
`docs/LAB_MARAILERON_AUTHOR_EXPORT_V1.md`

## Domaines protégés

Inchangés :
- Combat Runtime / Session ;
- Animation Core ;
- FX Core ;
- renderer ;
- collision ;
- Dodge ;
- persistent zones ;
- roster ;
- audio ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochain micro-lot

Burrow Visual V1.

Cause déjà reproduite :
- `approachMode: "burrow"` existe dans le gameplay ;
- `CombatResolutionPresenter` ne projette actuellement que ground / teleport / aerial ;
- `Visual Controller.playApproachFor` ne reconnaît également que ground / teleport / aerial ;
- burrow retombe donc sur l'attaque générique.

Contrainte :
le rendu burrow doit suivre le timing Runtime existant et ne doit jamais créer de contact DOM/collision autoritaire.

## Prochaine action protocolaire

- CI finale documentaire ;
- checkpoint GREEN et preview de ce lot ;
- ouvrir ensuite un checkpoint/branche séparés pour Burrow Visual V1.
