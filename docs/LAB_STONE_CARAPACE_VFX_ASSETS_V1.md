# LAB — Stone Carapace VFX Assets V1

Date: 2026-10-06

## Scope

Additive visual asset pack only for Capture:
- stone carapace cast/charge: 16 frames;
- stone carapace aura: 16 frames.

No gameplay, Combat Runtime, Animation Core, FX Core, collision, damage, status-rule or renderer change.

## Ownership

Single media/catalog authority remains `global-assets`.
No parallel catalogue, resolver or runtime source is introduced.

## Branches

- base: `d8a635a4bb0cb17de5b379942d08614b90096142`
- start checkpoint: `checkpoint/global-assets-before-stone-carapace-vfx-pack-v1-2026-10-06`
- work: `work/global-assets-stone-carapace-vfx-pack-v1-2026-10-06`

## Asset inventory

Path: `assets/library/capture/sprites/skills/stone_carapace/`

- 32 PNG RGBA frames, 512x512;
- 2 horizontal WebP atlases, 8192x512;
- sequence manifest;
- CSV manifest;
- provenance report;
- source transport copies under `assets/library/capture/sprites/source/stone_carapace_v1/`.

Canonical IDs:
- `pack:capture:sprite-stone-carapace-cast-01`
- `pack:capture:sprite-stone-carapace-aura-01`

The pack is additive and does not replace any existing skill binding.

## Build status

Generation workflow `37463661646` completed SUCCESS.
Generated asset commit: `57fb419ef6e3b9e90f50de907ad0bcb0e68c9013`.

The final branch commit below exists only to trigger the normal Laboratory CI after the bot-generated asset commit, because GitHub does not trigger a second workflow from a workflow-token push.

## Exit criteria

Before publication to `global-assets`:
1. normal Laboratory CI must pass on this branch;
2. create GREEN checkpoint;
3. fast-forward `global-assets` non-forced;
4. then update only the lab catalogue cache revision on a dedicated lab branch and run full lab CI.
