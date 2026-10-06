# LAB — Trait de givre HD V1

Date : 2026-10-06

## Reprise réelle
La charte et les documents LIVE ont été relus avant raccord.
Un GREEN plus récent a été détecté pendant le chantier :
`checkpoint/lab-combat-hud-dodge-layout-v1-green-2026-10-06` = `f2fae88f8dd89de561e725f24174d99d0b1c8d43`.

La première branche frost créée depuis le GREEN précédent est donc abandonnée et n'est pas utilisée pour ce raccord. Aucun cherry-pick en bloc n'est effectué.

## Autorité médias
- `global-assets` publié : `e5a32bcdc33f564b3d42892eeda6d5f67e792a86`
- checkpoint assets : `checkpoint/global-assets-frost-bolt-vfx-pack-v1-green-2026-10-06`
- CI assets avant publication : `37530781632` SUCCESS
- CI publication global-assets : `37530866243` SUCCESS
- catalogue unique : 108 assets / 61 sprites

IDs :
- `pack:capture:sprite-frost-bolt-cast-01`
- `pack:capture:sprite-frost-bolt-projectile-01`
- `pack:capture:sprite-frost-bolt-impact-01`
- `pack:capture:sprite-frost-bolt-status-aura-01`

## Contenu
- cast : 16 PNG RGBA 512×512
- projectile : 12 PNG RGBA 512×512
- impact : 12 PNG RGBA 512×512
- aura givrée : 16 PNG RGBA 512×512
- 4 atlas WebP runtime
- aura : 250 ms/phase ; les 8 dernières phases quasi fixes donnent environ 2 s de maintien visuel givré par boucle

## Raccord labo
Le labo ne duplique aucun média.
Il continue à lire uniquement `global-assets` via `GLOBAL_VISUAL_LIBRARY`.

Seul changement runtime :
`2026-10-06-v17-frost-bolt-vfx-pack-v1`.

La sentinelle d'arène est rendue dépendante de `GLOBAL_VISUAL_LIBRARY.revision` au lieu de figer une ancienne valeur de cache. Son contrat d'asset/arène n'est pas assoupli.

## Protégé
Aucun changement FX Core, Animation Core, renderer, gameplay, Combat Rules, dégâts, collision, énergie, cooldown, HUD/esquive ou capacité existante.
Aucun merge sur `main`.


## Validation labo
- premier candidat : `7f0d05a85b89f89bed96454626f8b671f20df523`
- CI `37531175715` : rouge uniquement sur une erreur de syntaxe introduite dans la sentinelle `demo-presentation-assets.test.mjs`
- correction ciblée : `449b1be627aca8875439751d6d7aea520c752743`
- CI complète : `37531479805` — **1196/1196**, 0 échec

Le correctif ne modifie ni le comportement des arènes ni le moteur : la sentinelle compare désormais le paramètre de cache à l'autorité `GLOBAL_VISUAL_LIBRARY.revision`, sans valeur historique figée.

État du lot : **GREEN technique**, prêt pour checkpoint final. Aucun merge sur `main`.
