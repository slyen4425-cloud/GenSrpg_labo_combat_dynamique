# Sylvorne — original media under one global-assets library

**START:** global-assets@`14e216c7fa27fa768d9be090ceaef829a76ff161` checkpoint `checkpoint/lab-start-sylvorne-official-visuals-2026-11-10`, work `work/lab-sylvorne-official-visuals-2026-11-10`.

This PR **does not publish** until the existing author source images are visually verified. The three PNG blobs are copied, not re-generated, from an isolated GitHub CI review branch `work/lab-sylvorne-source-art-preflight-2026-11-10@9baff0a16fe171b45c998bbbdb4c78d2bc39ee01` and originate from the unchanged author ZIP blob `48dcbd6f7cc971ec9e5ed832169e16c1faa329bf`.

- Face blob `26d2a5d93b15a56e3a5260c72f6fe18a40215160` 512x512 RGBA (opponent)
- Back blob `ffac839675032c6ff9738947cd1ef44b544be087` 512x512 RGBA (player)
- Original icon blob `21a60e50cb5281f9b6e964fd097b67c29495f9b1` 512x512 RGBA

Two combat views cropped independently (the back right hand crosses an equal-panel boundary), scaled with preserved aspect ratio and 42px pixel-alpha safety. No fake sprites, no horizontal mirror, no removal from the original archive. Same canonical `data/assets/catalog/global-visual-assets.v1.json` and `assets/library/capture/creatures` owner as Pieuvre. All 404 existing asset IDs and bytes kept identical; just three new asset IDs. No gameplay, combat rules, PWA or save changes. 

Approval pending: human review of FACE/DOS/icon and CI on this SHA; then merge into `global-assets` for Combat source PR #289 to adopt by authoritative bindings. Do not merge this review branch into Combat `main` — global-assets is a separate asset library.
