# LAB — Fumée cendre HD V1

Date : 2026-10-06

## Objet

Publier dans la bibliothèque visuelle Capture un pack transparent fumée/cendre validé par Sylvain, sans créer de nouvelle autorité et sans réaffecter automatiquement une capacité existante.

## Autorité médias

- branche runtime : `global-assets`
- commit publié : `d8a635a4bb0cb17de5b379942d08614b90096142`
- checkpoint : `checkpoint/global-assets-ash-smoke-vfx-pack-v1-green-2026-10-06`
- catalogue unique : `data/assets/catalog/global-visual-assets.v1.json`

## Contenu

- charge / cast : 16 frames PNG RGBA 512×512
- projectile : 12 frames PNG RGBA 512×512
- impact : 12 frames PNG RGBA 512×512
- aura négative / status : 16 frames PNG RGBA 512×512
- total : 56 frames
- 4 sources originales RGBA conservées
- 4 atlas WebP runtime
- provenance SHA-256 + manifeste + séquences reproductibles

IDs :
- `pack:capture:sprite-ash-smoke-cast-01`
- `pack:capture:sprite-ash-smoke-projectile-01`
- `pack:capture:sprite-ash-smoke-impact-01`
- `pack:capture:sprite-ash-smoke-status-aura-01`

## Raccord labo

Le labo ne duplique aucun média. Il continue à lire `global-assets` via `GLOBAL_VISUAL_LIBRARY`.
Le seul changement runtime de ce lot est la révision de cache :
`2026-10-06-v15-ash-smoke-vfx-pack-v1`.

Aucun changement sur FX Core, animation, renderer, gameplay, collisions, dégâts, énergie, cooldown ou données de Cendre aveuglante.

## Validation assets

CI global-assets : run `37456501645` — 207/207, 0 échec.
Le payload final possède 56 PNG RGBA 512×512, alpha réel, 4 atlas et 4 IDs catalogue uniques.

## Portée

Ce lot rend les assets disponibles dans la bibliothèque/éditeur existants. Il ne remplace pas silencieusement les FX d'une compétence déjà enregistrée.
