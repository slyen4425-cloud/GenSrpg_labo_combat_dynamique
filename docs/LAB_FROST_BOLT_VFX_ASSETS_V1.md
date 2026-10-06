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
