import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {importCaptureTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1 as CREATURES} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 as SKILLS} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {projectCombatArenaBarrierXForSideV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";

const root=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const cases=[
 {id:"crea_crys_2",kind:"creature",sha:"b4e481de8d67e2e7968836e831187a6d1843ff4923c4a832f8cdc351c2ca5c58",live:"data/capture/showcase/crea_crys_2.capture-creature-transfer-v1.json",archive:"data/capture/source-exports/gensrpg-capture-creature-crea_crys_2-author-2026-11-03.json"},
 {id:"boule_neige",kind:"skill",sha:"ee83444579b670eea4d31f10973d0468464e22a56e5ffd3442e98cbdddbfe597",live:"data/capture/showcase/boule_neige.capture-skill-transfer-v1.json",archive:"data/capture/source-exports/gensrpg-capture-skill-boule_neige-author-2026-11-03.json"},
 {id:"gorice",kind:"creature",sha:"538b4b8e1fc6ac91a39d46e2d35ea1425760a29573ab27ce5e0bee1ba63edede",live:"data/capture/showcase/gorice.capture-creature-transfer-v1.json",archive:"data/capture/source-exports/gensrpg-capture-creature-gorice-author-2026-11-03.json"}
];
const registry=normalizeCaptureStatRegistryV1(JSON.parse(root("data/capture/monster-capture-stat-registry.v1.json")));
test("Nov 3 archives stay signed; Nov 5 active Gorice/Gemmor exports preserve explicit author deltas",()=>{
 for(const entry of cases){
  const source=root(entry.archive),current=root(entry.live);
  assert.equal(createHash("sha256").update(source).digest("hex"),entry.sha,entry.id);
  const expected=JSON.parse(source);
  if(entry.id==="crea_crys_2"){
    assert.equal(expected.draft.presentation.viewOverrides.player.displayScale,1.7,
      "signed Nov 3 Gemmor provenance remains unchanged");
    assert.equal(expected.draft.presentation.viewOverrides.opponent.displayScale,1);
    expected.draft.presentation.viewOverrides.player.displayScale=1.4;
    expected.draft.presentation.viewOverrides.opponent.displayScale=0.7;
    expected.draft.elements=["earth","nature"];
    expected.draft.capture.spawnTags=["earth","nature"];
    expected.draft.presentation.profileId="biped";
    expected.draft.combat.approachTimeModifierPct=25;
  }
  if(entry.id==="gorice"){
    expected.draft.presentation.viewOverrides.player.displayScale=1.5;
    expected.draft.presentation.viewOverrides.opponent.displayScale=0.8;
  }
  assert.deepEqual(JSON.parse(current),expected,
    entry.id+" must match immutable Nov 3 source plus approved Nov 4–5 author changes");
  const loaded=importCaptureTransferJsonV1(current,{statRegistry:registry});
  assert.equal(loaded.kind,entry.kind,entry.id);
  assert.equal(loaded.value.draft.id,entry.id);
  const manifest=entry.kind==="creature"?CREATURES:SKILLS;
  assert.equal(manifest.filter(x=>x===entry.live).length,1,entry.id);
 }
 assert.equal(new Set(CREATURES).size,CREATURES.length);
 assert.equal(new Set(SKILLS).size,SKILLS.length);
});
test("Gemmor, new charged snowball and latest Gorice animations survive native import",()=>{
 const g=importCaptureTransferJsonV1(root(cases[0].live),{statRegistry:registry}).value;
 assert.equal(g.draft.displayName,"Gemmor");assert.equal(g.statValues.values.earth,15);
 const s=importCaptureTransferJsonV1(root(cases[1].live),{statRegistry:registry}).value.draft;
 assert.equal(s.definition.chargedAttack.maxCharges,10);
 assert.equal(s.presentation.visual.cast.opponentOffsetX,-70);
 const gor=importCaptureTransferJsonV1(root(cases[2].live),{statRegistry:registry}).value;
 assert.equal(gor.draft.presentation.visual.rangedAttack.assetId,"pack:capture:creature-gorille-des-glaces-attack-opponent-12-charge-v1");
 assert.equal(gor.draft.presentation.visual.rangedAttackBack.assetId,"pack:capture:creature-gorille-des-glaces-attack-player-12-charge-v1");
 assert.equal(gor.loadout.slots[4].skillId,"furie_bestiale");
});
test("arena wall X preserves player authored position, but resolves on the opposite team's side",()=>{
 assert.equal(projectCombatArenaBarrierXForSideV1({authoredXPct:47,ownerCenterXPct:80,opponentSide:false}),47);
 const enemy=projectCombatArenaBarrierXForSideV1({authoredXPct:47,ownerCenterXPct:80,opponentSide:true});
 assert.ok(enemy>=74&&enemy<80,"opponent wall must be near enemy and not midfield");
 assert.notEqual(enemy,47);
 assert.equal(projectCombatArenaBarrierXForSideV1({authoredXPct:47,ownerCenterXPct:20,opponentSide:true}),23.98);
});
