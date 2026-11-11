import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const creature=JSON.parse(read("data/capture/showcase/crea_sylvorne.capture-creature-transfer-v1.json"));
const visual=creature.draft.presentation.visual;
// Metadata shape matches the official global-assets entries, not a runtime copy.
const fixture=(slot,assetType,category,tags)=>({
  id:slot.assetId,assetType,category,mediaType:"image",
  tags:["capture","creature","sylvorne",...tags],
  compatibility:{uses:["combat","capture","editor"]}
});

test("Sylvorne original face/back stay selectable as creatures while its UI portrait is an icon",()=>{
  assert.equal(creature.draft.id,"crea_sylvorne");
  const front=fixture(visual.front,"sprite","creature",["face","opponent"]);
  const back=fixture(visual.back,"sprite","creature",["back","player"]);
  const icon=fixture(visual.icon,"portrait","ui",["icon"]);
  assert.equal(captureEditorAssetMatchesRoleV1(front,"creature"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(back,"creature"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(icon,"creature"),true,
    "Keep legacy creature portrait compatibility for existing visual pickers");
  assert.equal(captureEditorAssetMatchesRoleV1(icon,"creature-icon"),true,
    "Original author portrait must appear in canonical creature icon picker");
  assert.equal(captureEditorAssetMatchesRoleV1(icon,"icon"),false,
    "Generic skill/reaction icons must not silently mix with creature portraits");
});

test("Public editor declares the canonical icon role and refreshes using that same declared role",()=>{
  const html=read("examples/dom-demo/capture-editor-v2.html");
  const owner=read("src/ui/capture-editor-human-v2.js");
  assert.match(html,/<select data-creature-icon-select data-asset-role="creature-icon">/);
  assert.match(html,/<select data-creature-front-select data-asset-role="creature"/);
  assert.match(html,/<select data-creature-back-select data-asset-role="creature"/);
  assert.ok(owner.includes("select.dataset.assetRole"),"Initial and refreshed selectors must read their configured role");
  assert.ok(!owner.includes('select.matches?.("[data-creature-icon-select]")'),
    "No second hidden icon-role owner; use the same DOM contract");
});
