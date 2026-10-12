# Projectile FX orientation and perspective UI V1 — 2026-10-12

## User-reported reproduction
- **Tornade** (`cap_air_atk_4`) imported from the author's file looked upside down when the opposing AI fired.
- In V12 the editor exposed two overlapping size/depth controls: the older V11 `perspectiveAmount` (0–0.5) and the stronger `farScaleRatio` (0.15–1). The latter supersedes the former when enabled.

## Proven root cause and permanent generic correction
In `DomSkillFxRenderer`, a linear projectile applied `rotate(atan2(target-source) - headingRad)` even when no `headingRad` metadata existed, silently treating missing metadata as 0 radians. An intrinsically upright sprite therefore tilted in one direction and inverted by almost 180° from the opposite camp.

**Single visual authority:** a projectile sprite only tracks the firing direction if its presentation asset **explicitly declares a finite `headingRad`** (the existing native-heading metadata). Otherwise it remains at `rotate(0rad)`, as authored, for both player and opponent. Skyfall is unchanged and remains upright. The creator's runtime assets naturally lack directional metadata unless the creator later supplies it; the same safeguard works for single images and sprite atlases. Existing explicitly directional visuals still follow their heading through both directions.

A second normalization error in the Global Presentation Asset Resolver had interpreted `headingRad: null` as 0 (because `Number(null) === 0`). This has been corrected to treat null as unspecified while preserving an actual `headingRad:0`.

No changes to trajectory geometry, source/target sockets, core collision, animation duration, damage/resistances, projectile clash, Combat Runtime, beams, skill export contract, or non-projectile FX.

## Perspective user experience
- The **far size ratio** is now the **primary** single visible perspective control, with guidance `0.25 = 25% of near-side size`.
- The old `perspectiveAmount` control is retained only inside a collapsed “Perspective historique (compatibilité)” section. That value is preserved when importing/exporting old V11 skills, so legacy games remain compatible.
- Tornade's existing V12 author preset keeps its `farScaleRatio=0.25` and `arrivalLayer=front`, but its shadowed `perspectiveAmount` has been set to zero; no duplicate depth setting survives in its saved configuration.
- Later user imports may legitimately require a *directional* sprite (e.g. a missile pointing horizontally). In that case its native `headingRad` must be explicitly defined in the asset metadata when such creator UI is offered; no image-content inference or global forced mirroring has been added.

## Tests and governance
- RED `447a052ac2286094317f5ba045194ef927440258` — CI failure by new upright-orientation and compatibility-UI regression tests.
- Follow-up code GREEN at `0fd496c2e68ac972c44951c22b66fd37f0fb3a93`: CI `38271306720` SUCCESS with foundation, Chromium Firestorm and Chromium Creature Library.
- Additional input resolver test verifies missing/null and explicit zero native headings; final CI evidence is recorded in the work journal.
- Starting published GREEN `5fc32b67a191f3c8532899d3ee664e24381bf736`. Checkpoint `checkpoint/lab-start-projectile-orientation-v1-2026-10-12`; work branch `work/lab-projectile-orientation-v1-2026-10-12`.
- Checkpoint GREEN and `gh-pages` fast-forward only after CI at an identical SHA. Manual Android visual confirmation remains separate. No changes to main, global-assets, GenSrpG or Exploration.
