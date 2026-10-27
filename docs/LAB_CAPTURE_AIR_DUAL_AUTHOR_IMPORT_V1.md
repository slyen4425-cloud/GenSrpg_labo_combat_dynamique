# LAB — Capture Air: importing two author skill transfers (2026-10-11)

This is the author-import lot. Base `gh-pages` `50a4bd36a0572c34b05c79be2bd650f900039f5e`; initial checkpoint `checkpoint/lab-start-capture-air-dual-skill-import-2026-10-11`; work branch `work/lab-capture-air-dual-skill-import-2026-10-11`.

## Scope

Only the author files `lib_tailwind` and `cap_air_atk_3`, added verbatim under `data/capture/showcase`. The canonical `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` list is extended to import them with the existing Transfer pipeline, which updates configuredSkills in-place by stable ID instead of creating a second catalog. The 103 creatures and other skills are untouched. Existing player loadout IDs remain stable. No `main`, `global-assets`, `Zombicide-40k`, Exploration or engine change. Preserve all author values; do not auto-replace the icon.

- `lib_tailwind`: original input SHA256 `012c4d275eb33288700008fdb7d0e105d90dfc4e6220044bde4e2769617a6f75`, git blob `b66e3a7a95e1ae2a1691d9ef44b102f80af6f845`. Four apply_status effects: 30 speed points self and three target statuses with the same id `status`; 150% skill recharge, 100% energy regen, -100 defense. This duplication is preserved only for faithful import and will be diagnosed in a **separate** lot immediately afterward.
- `cap_air_atk_3`: original input SHA256 `0fb30bd4ecb13f2793906900e5be990aa1b8beee2b965f84e1b4d40e049784fd`, git blob `82a9d4899b277c4e0acc947704fdac73eabe342b`. Charge aérienne melee/contact with aerial approach, cast and audio.
- Test `tests/unit/capture-air-dual-skill-import-v1.test.mjs` checks exact author content hashes, available IDs, effects, and replacement through the canonical Transfer planner; full CI and browser smoke on exact SHA. Before publication create GREEN checkpoint and FF `gh-pages` under lease; verify post-release CI/Pages. An engine-level status/HUD diagnostic follows separately.
