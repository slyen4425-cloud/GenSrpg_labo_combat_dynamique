

## 2026-10-06 — Fumée cendre HD V1 — raccord Asset Presentation

- Demande : rendre disponible dans le labo combat le pack Fumée cendre validé et publié dans l'autorité `global-assets`.
- Base labo exacte : `953721606d834e8194d2a312bd6453f0042bad79`.
- Checkpoint départ : `checkpoint/lab-start-ash-smoke-vfx-pack-v1-2026-10-06`.
- Branche : `work/lab-ash-smoke-vfx-pack-v1-2026-10-06`.
- Autorité médias publiée : `global-assets` = `d8a635a4bb0cb17de5b379942d08614b90096142` ; checkpoint `checkpoint/global-assets-ash-smoke-vfx-pack-v1-green-2026-10-06`.
- Périmètre autorisé : `src/assets/global-visual-library.js`, test cache/catalogue ciblé, `docs/LAB_ASH_SMOKE_VFX_PACK_V1.md`, présent `LAB_CURRENT_WORK.md`.
- Objectif : changer uniquement la révision/cache-buster du catalogue global afin que les 4 IDs `pack:capture:sprite-ash-smoke-*` soient chargés par le resolver existant.
- Interdits : moteur FX, renderer, gameplay, collisions, dégâts, énergie, cooldown, données de Cendre aveuglante, autres capacités, nouveau catalogue/resolver.
- Critère GREEN : cache-buster avancé, tests ciblés + CI complète verts, aucune autre source runtime modifiée.
- Statut : EN COURS.


### Fumée cendre HD V1 — clôture GREEN

- global-assets publié : `d8a635a4bb0cb17de5b379942d08614b90096142` ; CI publication run `37456705713` SUCCESS.
- Raccord labo : révision `2026-10-06-v15-ash-smoke-vfx-pack-v1`.
- Première CI du cache-buster : une sentinelle d'arène avait la révision v14 figée en dur ; corrigée pour comparer à l'autorité `GLOBAL_VISUAL_LIBRARY.revision`, sans assouplir le contrat d'arène.
- CI finale labo : run `37457043132` — **1130/1130**, 0 échec.
- Tests explicitement verts : pack Fumée cendre / cache global et cinq arènes canoniques.
- Aucun moteur, gameplay, collision, dégâts, énergie, cooldown ou capacité existante modifié.
- État : **GREEN**. Aucun merge sur `main`.


## 2026-10-06 — Carapace de pierre HD V1 — raccord Asset Presentation

- Demande : rendre disponible dans le labo combat le pack Carapace de pierre validé visuellement par Sylvain.
- Base labo exacte : `216d6b62bb2d79ff51048792fc27219d42d971d9`.
- Checkpoint départ : `checkpoint/lab-start-stone-carapace-vfx-pack-v1-2026-10-06`.
- Branche : `work/lab-stone-carapace-vfx-pack-v1-2026-10-06`.
- Autorité médias publiée : `global-assets` = `a27e3e3e3cfbeb0920f9d496a5b7735979ebe94a`.
- Checkpoint assets : `checkpoint/global-assets-stone-carapace-vfx-pack-v1-green-2026-10-06`.
- CI assets branche : run `37472901378` SUCCESS.
- CI publication global-assets : run `37472981231` SUCCESS.
- Périmètre labo : cache-buster de `GLOBAL_VISUAL_LIBRARY`, sentinelles ciblées et documentation uniquement.
- IDs publiés : `pack:capture:sprite-stone-carapace-cast-01` et `pack:capture:sprite-stone-carapace-aura-01`.
- Interdits : moteur FX, renderer, gameplay, collisions, dégâts, règles de statut, énergie, cooldowns, autres capacités, nouveau catalogue/resolver.
- Critère GREEN : révision `2026-10-06-v16-stone-carapace-vfx-pack-v1`, tests ciblés et CI complète verts, checkpoint final.
- Statut : EN COURS.
