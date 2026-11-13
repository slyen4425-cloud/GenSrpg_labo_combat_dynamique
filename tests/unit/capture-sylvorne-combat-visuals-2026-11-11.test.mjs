import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";
import {buildCaptureEditorCombatTestV1} from "../../src/ui/capture-editor-combat-test-v1.js";
import {adaptCaptureExportToNativeVisualSourceV1} from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import {loadCombatDemoVisualSource} from "../../src/ui/demo-app.js";
import {captureEditorAssetMatchesRoleV1} from "../../src/ui/capture-editor-human-v2.js";
import {globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const media=[
  ["front","pack:capture:creature-sylvorne-opponent-01","capture/creatures/sylvorne/runtime/sylvorne_face.png","sprite"],
  ["back","pack:capture:creature-sylvorne-player-01","capture/creatures/sylvorne/runtime/sylvorne_dos.png","sprite"],
  ["icon","pack:capture:creature-sylvorne-icon-01","capture/creatures/sylvorne/runtime/sylvorne_icone.png","portrait"]
];
test("Sylvorne: real Showcase -> editor combat export -> native visual adapter -> actor slots",async()=>{
  const registry=normalizeCaptureStatRegistryV1(JSON.parse(await read("data/capture/monster-capture-stat-registry.v1.json")));
  const progressionRules=normalizeCaptureProgressionRulesV1(JSON.parse(await read("data/capture/monster-capture-progression-rules.v1.json")));
  const creature=importCaptureTransferJsonV1(await read("data/capture/showcase/crea_sylvorne.capture-creature-transfer-v1.json"),{statRegistry:registry}).value;
  const configuredCreatures=new Map([[creature.draft.id,{draft:creature.draft,loadout:creature.loadout,statValues:creature.statValues}]]);
  const configuredSkills=new Map();
  for(const id of creature.draft.skillIds){
    const skill=importCaptureTransferJsonV1(await read("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")).value.draft;
    configuredSkills.set(id,skill);
  }
  const combatRules={schema:"capture-combat-rules-editor-draft-v1",maxEnergy:12,initialEnergy:12,energyChargeAmount:1,energyChargeIntervalMs:2000,movementEnergyPerStep:1,chargeTimeModifierPct:0};
  const exported=buildCaptureEditorCombatTestV1({
    configuredCreatures,configuredSkills,localCreatureIds:["crea_sylvorne"],
    opponentCreatureIds:["crea_sylvorne"],activePerTeam:1,arenaId:null,
    combatRules,statRegistry:registry,progressionRules,previewLevel:20
  });
  const assets=media.map(([,id,file,assetType])=>({
    id,mediaType:"image",assetType,category:assetType==="portrait"?"ui":"creature",
    tags:["capture","creature","sylvorne"],
    compatibility:{uses:["editor","combat","capture"]},
    resource:{file,mime:"image/png"}
  }));
  const profile=JSON.parse(await read("data/profiles/massive.profile.json"));
  const native=adaptCaptureExportToNativeVisualSourceV1({
    exported,assetCatalog:{assets},profiles:[profile],assetUrlForFile:globalVisualAssetUrl
  });
  assert.equal(native.creatureMetas.length,1,"both actor slots must reuse the one Sylvorne definition");
  const meta=native.creatureMetas[0];
  assert.equal(meta.id,"crea_sylvorne");
  assert.equal(meta.profile,"massive");
  assert.equal(meta.presentationFallback,undefined,"must never use SANS IMAGE");
  assert.equal(meta.runtimePreview.player,globalVisualAssetUrl(media[1][2]));
  assert.equal(meta.runtimePreview.opponent,globalVisualAssetUrl(media[0][2]));
  assert.equal(meta.runtimePreview.icon,globalVisualAssetUrl(media[2][2]));
  assert.equal(meta.displayScale.player,1.6);
  assert.equal(meta.displayScale.opponent,1.16);
  assert.deepEqual(meta.offsetByView.opponent,{x:0,y:45},"Sylvorne opponent must be lowered by 45px");
  assert.deepEqual(meta.offsetByView.player,{x:0,y:0},"Sylvorne player view must remain anchored at Y=0");
  const visuals=await loadCombatDemoVisualSource({
    nativeVisualSource:native,
    fetchImpl:()=>{throw Error("Preview must use the injected native visual source, not demo creature fixtures");}
  });
  assert.equal(visuals.creatureMetas[0],meta);
  assert.deepEqual(exported.actors.map(actor=>actor.creatureId),["crea_sylvorne","crea_sylvorne"]);
});
test("Sylvorne portrait is selectable as creature icon without polluting reaction icons",()=>{
  const portrait={assetType:"portrait",mediaType:"image",category:"ui",tags:["capture","creature","sylvorne"],compatibility:{uses:["editor"]}};
  assert.equal(captureEditorAssetMatchesRoleV1(portrait,"creature-icon"),true);
  assert.equal(captureEditorAssetMatchesRoleV1(portrait,"icon"),false);
  const ordinaryIcon={assetType:"icon",mediaType:"image",category:"ui",tags:["skill"],compatibility:{uses:["editor"]}};
  assert.equal(captureEditorAssetMatchesRoleV1(ordinaryIcon,"creature-icon"),true);
  const unsafe={...portrait,compatibility:{uses:["combat"]}};
  assert.equal(captureEditorAssetMatchesRoleV1(unsafe,"creature-icon"),false);
});

test("public combat preview uses one Sylvorne cache revision from HTML to live actor renderer",async()=>{
  const html=await read("examples/dom-demo/capture-editor-v2.html");
  const rev=html.match(/capture-editor-v2[.]js[?]v=([^"]+)/)?.[1];
  assert.ok(rev?.endsWith("sylvorne-fx-size-20261111-recolor-20261113-recolor-sliders-20261113"));
  for(const [path,dependencies] of [
    ["examples/dom-demo/capture-editor-v2.js",["capture-editor-human-v2.js","capture-editor-preview-runtime-loader-v1.js"]],
    ["src/ui/capture-editor-preview-runtime-loader-v1.js",["capture-combat-preview-v1.js"]],
    ["src/ui/capture-combat-preview-v1.js",["demo-app.js","combat-2v2-test-ui.js"]]
  ]){
    const source=await read(path);
    for(const dependency of dependencies)
      assert.ok(source.includes(dependency+"?v="+rev),"stale combat module "+dependency+" in "+path);
  }
});
