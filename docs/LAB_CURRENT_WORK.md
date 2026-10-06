# Laboratoire Combat Dynamique — Current Work

## 2026-10-06 — Trait de givre HD V1 — raccord Asset Presentation

- Base labo exacte : `f2fae88f8dd89de561e725f24174d99d0b1c8d43` (`checkpoint/lab-combat-hud-dodge-layout-v1-green-2026-10-06`).
- Checkpoint départ : `checkpoint/lab-start-frost-bolt-vfx-pack-v2-2026-10-06`.
- Branche : `work/lab-frost-bolt-vfx-pack-v2-2026-10-06`.
- Ancienne branche frost v1 depuis `2c0e838...` : abandonnée après découverte du GREEN HUD plus récent ; aucune promotion.
- Autorité médias : `global-assets` = `e5a32bcdc33f564b3d42892eeda6d5f67e792a86`.
- Périmètre autorisé : `src/assets/global-visual-library.js`, sentinelles cache/catalogue ciblées, documentation.
- Objectif : exposer les 4 IDs Frost Bolt par le resolver/catalogue existants avec le cache `2026-10-06-v17-frost-bolt-vfx-pack-v1`.
- Protégés : moteur FX, Animation Core, renderer, HUD/esquive, gameplay, collisions, dégâts, énergie, cooldown, autres capacités, nouveau catalogue/resolver, `main`.
- Tests prévus : cache global + URLs des 4 atlas + CI complète.
- Critère GREEN : CI complète verte, revue limitée au périmètre, checkpoint final exact.
- Statut : EN COURS.
