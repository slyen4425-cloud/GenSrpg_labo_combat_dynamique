# LAB — Carapace de pierre HD V1

Date : 2026-10-06

## Objet

Publier et raccorder dans le labo combat le pack transparent Carapace de pierre validé par Sylvain, sans créer de nouvelle autorité et sans réaffecter automatiquement une capacité existante.

## Autorité médias

- branche runtime : `global-assets`
- commit publié : `a27e3e3e3cfbeb0920f9d496a5b7735979ebe94a`
- checkpoint : `checkpoint/global-assets-stone-carapace-vfx-pack-v1-green-2026-10-06`
- catalogue unique : `data/assets/catalog/global-visual-assets.v1.json`

## Contenu

- charge / cast : 16 frames PNG RGBA 512×512
- aura protectrice : 16 frames PNG RGBA 512×512
- total : 32 frames
- 2 atlas WebP 8192×512
- manifeste CSV, séquences et provenance
- sources de transport conservées sous `assets/library/capture/sprites/source/stone_carapace_v1/`

IDs :
- `pack:capture:sprite-stone-carapace-cast-01`
- `pack:capture:sprite-stone-carapace-aura-01`

Le catalogue global contient 104 assets après ajout. Les deux IDs sont additifs et n'en remplacent aucun.

## Validation assets

- génération : run `37463661646` SUCCESS
- commit généré : `57fb419ef6e3b9e90f50de907ad0bcb0e68c9013`
- commit de validation/documentation : `a27e3e3e3cfbeb0920f9d496a5b7735979ebe94a`
- CI branche assets : run `37472901378` SUCCESS
- CI publication `global-assets` : run `37472981231` SUCCESS

## Raccord labo

Le labo continue à lire uniquement `global-assets` via `GLOBAL_VISUAL_LIBRARY`.
Le seul changement runtime de ce lot est la révision de cache :
`2026-10-06-v16-stone-carapace-vfx-pack-v1`.

Aucun changement sur FX Core, Animation Core, renderer, gameplay, collisions, dégâts, règles de statut, énergie ou cooldown.

## Validation attendue

CI complète du labo : run `37473328167` SUCCESS. Checkpoint GREEN final à créer après validation de ce commit documentaire.


## Clôture

Le raccord est limité au cache-buster de la bibliothèque globale et aux sentinelles/documentation.
Le pack est disponible pour l'éditeur Capture via le catalogue existant, sans seconde autorité.
