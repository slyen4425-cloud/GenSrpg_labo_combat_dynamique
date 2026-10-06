# LAB — Trait de givre HD V1 — Assets

Date : 2026-10-06

## Objet
Publier un pack visuel Capture additif « Trait de givre » dans l'autorité unique `global-assets`.

## Base / branches
- base assets : `a27e3e3e3cfbeb0920f9d496a5b7735979ebe94a`
- checkpoint départ : `checkpoint/global-assets-before-frost-bolt-vfx-pack-v1-2026-10-06`
- branche : `work/global-assets-frost-bolt-vfx-pack-v1-2026-10-06`

## Contenu cible
- cast/charge : 16 frames ;
- projectile : 12 frames ;
- impact : 12 frames ;
- aura créature givrée : 16 frames, formation puis maintien visuel quasi fixe sur la seconde moitié de la boucle.

## Périmètre
Autorisé : médias frost_bolt, sources/provenance, catalogue global unique, script/test dédié, documentation et bootstrap temporaire.
Protégé : FX Core, Animation Core, renderer, Combat Rules, gameplay, dégâts, collisions, énergie, cooldowns, assets glace génériques existants et `main`.

IDs additifs :
- `pack:capture:sprite-frost-bolt-cast-01`
- `pack:capture:sprite-frost-bolt-projectile-01`
- `pack:capture:sprite-frost-bolt-impact-01`
- `pack:capture:sprite-frost-bolt-status-aura-01`

Le projectile générique `pack:capture:sprite-projectile-ice-01` reste inchangé.


## Build généré
- bootstrap : `d30a4cb27f9107bd8e41732e405807472a0b06a3`
- build assets : run `37530496680` — SUCCESS
- commit généré : `cfd8c76cc4111e010520a630835842e586de9b4e`
- inventaire : 56 PNG RGBA 512×512 + 4 atlas WebP
- atlas cast/aura : 8192×512
- atlas projectile/impact : 6144×512
- catalogue : 108 assets / 61 sprites
- alpha réel présent sur les 56 frames
- les 4 IDs frost-bolt sont additifs ; `pack:capture:sprite-projectile-ice-01` reste inchangé

La CI normale du dépôt est déclenchée par le présent commit documentaire après le push du bot de build.
