

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
