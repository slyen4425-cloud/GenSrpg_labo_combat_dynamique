# Capture — Steel and Rust combat VFX, 18 October 2026

## Scope and governance
- Original four animation types: **Carapace d'acier**, **Impact Aile acier**, **Cast Tourbillon de rouille**, **Projectile Aile acier**; two user-requested Carapace variants, resulting in **five distinct 20-frame sequences**.
- Single owner: `global-assets` Asset Input/Capture catalogue in `GenSrpg_labo_combat_dynamique`. No change to Combat Runtime, FX Core, damage, skills, editor, `main`, `gh-pages` or `Zombicide-40k`.
- Starting SHA: `f92814097634e0a80b3b8dfc1fbc6631a1a988e1`.
- Starting checkpoint: `checkpoint/lab-start-capture-steel-rust-vfx-2026-10-18`.
- Work branch: `work/lab-capture-steel-rust-vfx-2026-10-18`.

## Physical media
- Five user-approved 1402x1122 transparent source PNG sprite sheets 5x4 were generated in the ChatGPT conversation and their original SHA-256 digests recorded in `sources.json`.
- To reliably transfer via GitHub API, the original sheets have **lossy WebP RGBA quality 85 transport copies** (checksum-validated), stored in `assets/library/capture/sprites/source/steel_rust_vfx_20261018/`. This intentional compression step is declared transparently; original PNGs remain in the user archive.
- Each sheet is cropped 5 columns x 4 rows; narrow 3px grid gutters removed; each resulting cell resized via Pillow LANCZOS to **512×512 PNG RGBA**. Thus the export is 512px, **not native 512px source resolution**.
- One 7680×384 transparent WebP sprite-strip atlas per logical animation. **100 individual PNG + 5 atlases**, four sequence manifests, four CSV provenance files.
- Unique stable IDs and associated `frameCount:20` / `playbackMode:once` in the unique global asset catalog.
- Steel Carapace `hold` is a distinct rendered source sheet whose final frames show the fully closed shell; it has `holdLastFrame:true` / `holdFrameIndex:19` in its manifest, and `holdLastFrame:true` in its catalogue resource. The `fade` variant instead dissipates normally.

## Canonical folders and IDs
| Directory | Sequence | ID |
|---|---|---|
| `capture/sprites/skills/steel_carapace/` | fade | `pack:capture:sprite-steel-carapace-fade-01` |
| `capture/sprites/skills/steel_carapace/` | hold | `pack:capture:sprite-steel-carapace-hold-01` |
| `capture/sprites/skills/steel_wing_impact/` | impact | `pack:capture:sprite-steel-wing-impact-01` |
| `capture/sprites/skills/rust_whirlwind/` | cast | `pack:capture:sprite-rust-whirlwind-cast-01` |
| `capture/sprites/skills/steel_wing_projectile/` | projectile | `pack:capture:sprite-steel-wing-projectile-01` |

## Acceptance
- Real binary inspection, five source checksums and 100 frame SHA-256/PNG RGBA/size checks, WebP 5 atlases checks, unique catalog IDs, safe fast-forward, GitHub CI success.
- `npm run ci` through normal Laboratory workflow; validate on a real smartphone/skill editor separately; passing structural/media checks is **not** proof that any existing skill's presentation binding was automatically changed.
## Vérification d'import GitHub

- Commit contenant les médias réels : `927dd1df8c7c2331a84ce07cc56eca1bb569679b`.
- Import automatisé `39168798429` : `SUCCESS` ; script SHA/alpha et CI complète exécutés avant commit.
- Revue de l'arbre Git : 100 PNG RGBA physiques, 5 atlas WebP physiques, 4 manifestes de séquences, 4 fichiers de provenance, soit 113 fichiers générés dans les quatre dossiers de compétences.
- Catalogue autoritaire : 186 assets, dont 97 sprites ; cinq nouveaux `assetId` uniques, y compris les deux Carapaces.
- Les sources WebP utilisées pour le transport sont des versions compressées à perte des planches originales ; sources PNG inchangées fournies dans l'archive utilisateur. 512×512 est la résolution d'export, pas la résolution source native.
- CI normale sur ce commit documentaire : en attente au moment de cette note. Le contrôle éditeur / jeu réel Android n'est pas revendiqué.
