# Three Air skills and enemy bench inspection — 2026-10-12

## Source and ownership
User supplied three current Capture skill export JSONs. `cap_air_atk_7` (Ouragan, new), `lib_tailwind` (Vent arrière, replacement), `cap_air_atk_4` (Tornade, replacement) are saved under `data/capture/showcase/` without altering their authored effects, icons, frame speed, visuals or audio. The showcase catalog owns one unique path per skill ID. A preexisting personal browser override must be replaced by explicit import; it is never overwritten silently.

## The two reserve targeting paths
- Whole reserve: an active-target capability with `all_enemy_reserves` damages every eligible enemy bench member once upon its native successful resolution, using canonical combat/roster effects. No extra per-member click.
- One reserve: `targetLocations:["reserve"]`, `targetRelations:["enemy"]`, plus an effect scoped `target` allow an exact individual bench member through the existing Roster preview and `useSkillOnTarget`. The two paths are not a second damage engine.

## Touch inspection
`Réserves adverses` is an independent native `<details>` element on the Capture editor combat test HUD. Default closed, available to inspect any time, auto-opened when the chosen skill admits enemy bench targets. It displays grouped enemy reserves with name, health `<progress>`, numerical health and KO status. Roster Session snapshot is the only data source. Non-targetable creatures can be inspected but not clicked as a skill target. Active members are hidden, including after substitutions; previously active members that return to reserve become visible. No change to Rappel selection or cooldown. Existing 1v1/2v2 and Roster-less screens retain their old behavior.

## Test gates
New dedicated tests verify exact imported author bytes, structural group splash / individual targeting contract, enemy bench visibility, changing Roster health, KO blocking and direct target callback independent of recall. Existing historical test fixtures were updated only for replaced authored JSON and new catalog count. Full Node and Chromium CI, Pages and user Android acceptance are separately tracked in LIVE journal.

## Governance
Base published GREEN: `dc2c71851d3bf67318f2970e322588eaa14e2bab`.
Start checkpoint: `checkpoint/lab-start-air-skill-bench-ui-v1-2026-10-12`.
Work branch: `work/lab-air-skill-bench-ui-v1-2026-10-12`.
Protected: all combat gameplay, FX, geometry, Roster HP owner, GenSrpG and Exploration.
