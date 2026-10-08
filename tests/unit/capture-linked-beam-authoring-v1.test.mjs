import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  captureBeamVisualPackV1,
  applyCaptureBeamVisualPackV1
} from "../../src/ui/capture-editor-beam-visual-pack-v1.js";
import {
  humanSkillEditorFieldsFromDraftV1,
  buildHumanSkillDraftV1
} from "../../src/ui/capture-editor-human-v2.js";
import {
  importCaptureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {
  demoPresentationAssets
} from "../../examples/dom-demo/demo-assets.js";
import {
  createCaptureSkillPresentationAssetsV2
} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {
  createDomSkillFxRenderer
} from "../../src/adapters/renderer/dom-skill-fx.js";

const inputFile = new URL(
  "../../data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json",
  import.meta.url
);

function element() {
  return {
    className: "", dataset: {}, style: {}, children: [],
    append(...children) { this.children.push(...children); },
    remove() { this.removed = true; }
  };
}

test("pack selects coherent beam parts and preserves mechanics, custom audio and existing author export", async () => {
  const sourceText = await readFile(inputFile, "utf8");
  const original = importCaptureTransferJsonV1(sourceText).value.draft;
  const originalMechanics = original.definition;
  const fields = humanSkillEditorFieldsFromDraftV1(original);
  const extraAudioId = fields.presentation.castAudioAssetId;
  const visuals = applyCaptureBeamVisualPackV1({
    packId: "pressurized-jet", presentation: fields.presentation
  });

  const pack = captureBeamVisualPackV1("pressurized-jet");
  assert.equal(visuals.castAssetId, pack.beamStart);
  assert.equal(visuals.beamStartAssetId, pack.beamStart);
  assert.equal(visuals.travelAssetId, pack.travel);
  assert.equal(visuals.impactAssetId, pack.impact);
  assert.equal(visuals.travelPlaybackMode, "loop");
  assert.equal(visuals.castAudioAssetId, extraAudioId);

  const updated = buildHumanSkillDraftV1({
    ...fields, form: "beam", projectileClash: {power:0}, presentation: visuals
  });
  assert.equal(updated.definition.form, "beam");
  assert.equal(updated.definition.id, "cap_water_atk_3");
  assert.equal(updated.definition.energyCost, originalMechanics.energyCost);
  assert.equal(updated.definition.cooldownMs, originalMechanics.cooldownMs);
  assert.equal(updated.definition.preparationMs, originalMechanics.preparationMs);
  assert.deepEqual(updated.definition.effects, originalMechanics.effects);
  assert.equal(updated.presentation.visual.beamStart.assetId, pack.beamStart);
  assert.equal(updated.presentation.visual.cast.assetId, pack.beamStart);
  assert.equal(updated.presentation.visual.cast.anchor, "mouth");
  assert.equal(updated.presentation.visual.beamStart.anchor, "mouth");

  const roundtrip = importCaptureTransferJsonV1(
    exportCaptureSkillTransferJsonV1(updated)
  ).value.draft;
  assert.deepEqual(roundtrip, updated);
  assert.equal(humanSkillEditorFieldsFromDraftV1(roundtrip).presentation.beamStartAssetId, pack.beamStart);
  assert.equal(JSON.parse(await readFile(inputFile, "utf8")).draft.definition.form, "projectile",
    "pack authoring cannot silently overwrite the saved Showcase skill");

  const resolved = createCaptureSkillPresentationAssetsV2({
    skillPresentations: { [updated.id]: updated.presentation },
    assetForId(id) { return demoPresentationAssets.asset(id) ?? (id === "core:icon-skill-aqua-dash-01" ? {url:"icon.webp"} : null); }
  }).presentationForSkill(updated.id, { sourceView: "player", targetView: "opponent", fxType: "beam" });
  assert.equal(resolved.beamStart.assetId, pack.beamStart);
  assert.equal(resolved.travel.assetId, pack.travel);
  assert.equal(resolved.impact.assetId, pack.impact);
});

test("beam FX follows moving actor anchors; start, body and target share one cancellable owner", async () => {
  const pack = captureBeamVisualPackV1("pressurized-jet");
  const asset = id => ({
    ...demoPresentationAssets.asset(id),
    playbackMode: "loop"
  });
  const presentation = {
    beamStart: asset(pack.beamStart),
    travel: asset(pack.travel),
    impact: asset(pack.impact),
    travelSourceAnchor: "mouth",
    feedback: null
  };
  const added = [];
  const frameCallbacks = new Map();
  const cancelled = [];
  let nextFrame = 1;
  let pendingFinish;
  let movingX = 440;
  const arena = {
    ownerDocument: { createElement: element },
    append(node) { added.push(node); },
    getBoundingClientRect() {
      return {left: 0, top: 0, width: 600, height: 300};
    }
  };
  const anchors = {
    player: { getBoundingClientRect() { return {left:50,top:120,width:40,height:40}; } },
    opponent: { getBoundingClientRect() { return {left:movingX,top:120,width:40,height:40}; } }
  };
  const renderer = createDomSkillFxRenderer({
    arena,
    anchors,
    presentationForSkill() { return presentation; },
    sourceAnchorFor() { return {left: 70, top: 120, width: 0, height:0}; },
    requestFrame(fn) {
      const id=nextFrame++;
      frameCallbacks.set(id,fn);
      return id;
    },
    cancelFrame(id) { cancelled.push(id); frameCallbacks.delete(id); },
    animate(_node,_frames,options) {
      if (options.iterations === Infinity) {
        return {finished: Promise.resolve(), cancel() {}};
      }
      return {
        finished: new Promise(resolve=>{pendingFinish=resolve}),
        cancel() {}
      };
    }
  });
  const result=renderer.play({type:"beam",skillId:"linked-ray",fromSlot:"player",targetSlot:"opponent",durationMs:900});
  assert.equal(result.status,"running");
  assert.equal(added.length,1);
  assert.deepEqual(added[0].children.map(x=>x.dataset.beamPart),["body","start","target"]);
  assert.equal(added[0].style.left,"70px");
  assert.equal(Number.parseFloat(added[0].style.width),Math.hypot(390,20));
  assert.equal(added[0].children[1].style.left,"0");
  assert.equal(added[0].children[2].style.left,"100%");

  const frame = [...frameCallbacks.values()][0];
  movingX=490;
  frame();
  assert.equal(Number.parseFloat(added[0].style.width),Math.hypot(440,20));
  assert.equal(added[0].children[2].style.left,"100%");
  pendingFinish();
  assert.deepEqual(await result.finished,{status:"arrived"});
  assert.equal(added[0].removed,true);
  assert.equal(renderer.activeCount,0);
  assert.ok(cancelled.length>=1);
});
