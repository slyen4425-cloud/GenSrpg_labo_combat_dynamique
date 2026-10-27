import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  creatureAerialAppearanceForPhaseV1,
  creatureMovementAppearanceForApproachV1,
  creatureRangedAppearanceForViewV1
} from "../../src/ui/demo-app.js";

const read = (path) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

function showcaseMeta(id) {
  const transfer = JSON.parse(read("data/capture/showcase/" + id + ".capture-creature-transfer-v1.json"));
  const v = transfer.draft.presentation.visual;
  // The two public presentation channels are projected by the single Native Visual Adapter.
  // Use the actual author ids as fixtures, without adding a second runtime catalog.
  const visual = slot => slot?.assetId ? Object.freeze({
    assetId: slot.assetId, url: "https://assets.test/" + slot.assetId, frameCount: 12
  }) : null;
  return Object.freeze({
    movementFxByView: Object.freeze({
      player: visual(v.movementBack ?? v.movement),
      opponent: visual(v.movement)
    }),
    rangedAttackFx: visual(v.rangedAttack),
    rangedAttackBackFx: visual(v.rangedAttackBack)
  });
}

test("aerial attacks animate movement then the authored attack, then return for EVERY creature and view", () => {
  for (const creature of ["crea_dracendre", "crea_maraileron"]) {
    const meta = showcaseMeta(creature);
    for (const view of ["player", "opponent"]) {
      const movement = creatureMovementAppearanceForApproachV1(meta, view, "aerial");
      const attack = creatureRangedAppearanceForViewV1(meta, view);
      assert.ok(movement?.url, creature + " " + view + " movement");
      assert.ok(attack?.url, creature + " " + view + " attack");
      assert.equal(creatureAerialAppearanceForPhaseV1(meta, view, "aerial-arc-apex"), movement);
      assert.equal(creatureAerialAppearanceForPhaseV1(meta, view, "aerial-arc-impact"), attack);
      assert.equal(creatureAerialAppearanceForPhaseV1(meta, view, "aerial-home"), movement);
      assert.notEqual(movement.assetId, attack.assetId);
    }
  }
});

test("a new creature with attack only still animates at aerial impact; without sprites keeps native motion", () => {
  const meta = {
    movementFxByView: { player: null, opponent: null },
    rangedAttackFx: { assetId: "pack:test:generic-front-attack", url: "https://assets.test/attack" },
    rangedAttackBackFx: { assetId: "pack:test:generic-back-attack", url: "https://assets.test/back-attack" }
  };
  assert.equal(creatureAerialAppearanceForPhaseV1(meta,"player","aerial-arc-apex"),null);
  assert.equal(creatureAerialAppearanceForPhaseV1(meta,"opponent","aerial-arc-impact"),meta.rangedAttackFx);
  assert.equal(creatureAerialAppearanceForPhaseV1(meta,"player","aerial-arc-impact"),meta.rangedAttackBackFx);
  assert.equal(creatureAerialAppearanceForPhaseV1(meta,"player","aerial-home"),null);
  assert.equal(creatureAerialAppearanceForPhaseV1({},"player","aerial-arc-impact"),null);
  assert.equal(creatureAerialAppearanceForPhaseV1({},"player","aerial-arc-apex"),null);
  assert.throws(()=>creatureAerialAppearanceForPhaseV1(meta,"invalid","aerial-arc-impact"), /unknown creature view/);
});

test("ground and teleport/burrow modes are not rerouted onto the aerial attack pose", () => {
  const meta = showcaseMeta("crea_maraileron");
  for(const view of ["player","opponent"]) {
    assert.equal(creatureMovementAppearanceForApproachV1(meta,view,"ground"),meta.movementFxByView[view]);
    for(const mode of ["teleport","burrow","none"]) {
      assert.equal(creatureMovementAppearanceForApproachV1(meta,view,mode),null);
    }
    for(const phase of ["ground-step","teleport-attack","burrow-dive","unknown"]) {
      assert.equal(creatureAerialAppearanceForPhaseV1(meta,view,phase),null);
    }
  }
});

test("true demo path uses the AnimationPlan phase scheduler and one sprite owner, cancels on interruption", () => {
  const src = read("src/ui/demo-app.js");
  const path = src.slice(src.indexOf("  function playApproachFor("),src.indexOf("  function cancelFor("));
  assert.ok(path.includes('const plan = planAnimation('));
  assert.ok(path.includes("const aerialAttackAppearance = approachMode === \"aerial\""));
  assert.ok(path.includes('["aerial-arc-impact", "aerial-home"].includes(payload.label)'));
  assert.ok(path.includes('creatureAerialAppearanceForPhaseV1('));
  assert.ok(path.includes('slot.playMovementAppearance('));
  assert.ok(path.includes('activeAppearance?.cancel?.();'));
  assert.ok(path.includes('phaseTimers.push(timerId)'));
  assert.ok(path.includes('globalThis.clearTimeout(timerId)'));
  assert.ok(path.includes('payload.phaseDurationMs'));
  assert.ok(path.includes('playbackMode: "stretch"'));
  assert.ok(path.includes('watchVisibleModelContact({'));
});
