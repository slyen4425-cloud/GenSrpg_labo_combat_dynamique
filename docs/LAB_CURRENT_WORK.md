

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
