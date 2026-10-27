# Reserve Effect Targeting V2 — active + bench, single member targeting
Date : 2026-10-12

## Audited baseline
- V1 introduced `CombatTargetRefV1`, `SkillDefinition.targetLocations`, and `RosterSession.useSkillOnTarget`. It supported one specific active **or** reserve member per cast, reusing canonical damage, healing, immunity, shields, status and cost rules.
- V1 explicitly refused multi-target scopes on reserve. Demo combat options read **only** `BattleFormat.actors` (visible active fighters), and had no ability to choose a bench member.
- Roster remains the sole owner of reserve snapshots; reserve fighters must never be retained in `CombatState.fighters`.

## V2 authoring contract
For an active target and side splash, add several independent effects in the existing skill editor:
```json
{
  "targetLocations": ["active"],
  "targetRelations": ["enemy"],
  "effects": [
    {"kind":"damage","targetScope":"target","amount":50,"channel":"physical"},
    {"kind":"damage","targetScope":"all_enemy_reserves","amount":10,"channel":"physical"}
  ]
}
```
Replace `damage` with `heal`, `all_enemy_reserves` with `all_ally_reserves`, and use ally/self relations to produce the analogous support skill. The amounts are **base values**; real damage can differ because of existing mitigation, and healing is capped to max HP.

New effect scopes (damage/heal only):
- `all_enemy_reserves` — each living bench member on all opposing team slots;
- `all_ally_reserves` — each living bench member of all friendly team slots, including one's own bench.

These effects are supplemental to the normal active-target action and require an active target location. They are applied only if the native action resolves as hit; no second cost, skill count, cooldown or timer is created. Active-only skills continue behaving exactly as before.

For an explicitly selected single reserve:
```json
{
  "targetLocations":["reserve"],
  "targetRelations":["enemy"],
  "effects":[{"kind":"damage","targetScope":"target","amount":20,"channel":"physical"}]
}
```
For single-reserve healing, use `targetRelations:["ally"]` and `kind:"heal"`. Set `targetLocations:["active","reserve"]` to allow both selectable locations for a target-scoped skill. A reserve target is an exact `{scope:"reserve",teamId,memberId}` tuple, never a generic whole bench.

## Authority and UI flow
- `SkillDefinition` and `SkillEffectV1` validate authoring; editing retains the existing effect rows and exposes both new scopes.
- `CombatSession` attaches one existing Roster resolver, guards unsupported rosterless casts, and executes the supplemental effect only at successful native action completion (both immediate and timed).
- `ActionResolver` only passes active effects to the active CombatState tactical owner; no reserve target is invented there.
- `RosterSession` resolves each living eligible bench member using the same canonical `applyImmediateTacticalEffectsV1`, including resistance/shield/immunity and healing, then persists the member snapshot. Damage totals are returned to the live source. Bench KO members are skipped.
- `RosterSession.previewSkillOnTarget` shares the existing target/ref validation for individual reserve targeting before any cost is spent.
- The 1v1/2v2 combat HUD gets reserve candidates only from Roster previews, and uses the **existing Rappel roster panel** to select exactly one eligible reserve member. Selecting for a skill does not mutate the voluntary recall selection. The V1 individual-reserve API resolves that selection immediately using canonical rules; visual projectile travel to off-field creatures is not represented. Existing active actions and mid-arena collisions are untouched.

## Invariants and test gates
- Existing skills default `targetLocations:["active"]` and never reach bench without explicit author setting.
- No reserve members in persistent `CombatState.fighters`.
- One skill cost/cooldown/usage commit; multiple different reserve effects may apply during one native action.
- Same separate `damage/heal` authority, no shadow engine or independent clock.
- Untouched: direct projectile geometry and collision, SKYFALL/beam/zone, existing Fireball presence states, 103 creature catalog, imported assets, main/global-assets and other repositories.
- Tests: `tests/integration/reserve-effect-targeting-v2.test.mjs`, `tests/unit/capture-reserve-target-selection-v2.test.mjs`, V1 reserve and roster tests, full Node foundation, real Chromium Firestorm and creature-library browser.
- Smartphone manual validation (landscape): mixed fire/heal, named bench hit/heal, 1v1 and 2v2, voluntary Rappel remaining independent; manual GREEN separate from technical CI GREEN.

## Governance
Base `gh-pages` `8946e587443a720a86910153a70b0935fbd3345f`.
Start `checkpoint/lab-start-reserve-effect-targeting-v2-2026-10-12`.
Work `work/lab-reserve-effect-targeting-v2-2026-10-12`.
No edits to `main` or `Zombicide-40k`.
