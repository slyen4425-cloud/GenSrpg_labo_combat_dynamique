import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {
  importCaptureTransferJsonV1,
  exportCaptureCreatureTransferJsonV1,
  exportCaptureSkillTransferJsonV1
} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {capturePortableNativeSkillDraftsV1} from "../../src/catalogs/capture-portable-native-skill-catalog-v1.js";
import {captureComplexNativeSkillDraftsV1} from "../../src/catalogs/capture-complex-native-skill-catalog-v1.js";
import {
  applyCaptureTransferBatchToEditorStateV1,
  buildCaptureEditorDatabaseV1
} from "../../src/ui/capture-editor-file-transfer-v1.js";
import {normalizeCaptureStatRegistryV1} from "../../src/contracts/capture-stat-registry-v1.js";
import {normalizeCaptureProgressionRulesV1} from "../../src/contracts/capture-progression-rules-v1.js";

const CREATURE="data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json";
const SKILL="data/capture/showcase/choc_venin.capture-skill-transfer-v1.json";
const originals=[
  {path:CREATURE,bytes:5024,sha256:"54893dce6c212afe6907593babf57c989416a97b4858ab75df42a91735c22fce"},
  {path:SKILL,bytes:3730,sha256:"071f2b06eb12b2aa03f8d160092841a03cfae36ba184896c1b32dd1cc4d65051"}
];
const read=relative=>readFile(new URL("../../"+relative,import.meta.url));
const readJson=async relative=>JSON.parse((await read(relative)).toString("utf8"));
const registry=normalizeCaptureStatRegistryV1(await readJson("data/capture/monster-capture-stat-registry.v1.json"));
const progressionRules=normalizeCaptureProgressionRulesV1(await readJson("data/capture/monster-capture-progression-rules.v1.json"));
const importRecord=async(file)=>importCaptureTransferJsonV1((await read(file)).toString("utf8"),{statRegistry:registry});

test("RED: both fresh author transfers replace only the same two stable canonical IDs, byte exact",async()=>{
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(p=>p===CREATURE).length,1);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(p=>p===SKILL).length,1);
  assert.equal(new Set(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.length);
  assert.equal(new Set(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1).size,CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length);
  for(const {path,bytes,sha256} of originals){
    const source=await read(path);
    assert.equal(source.length,bytes,path+" must retain uploaded exact bytes");
    assert.equal(createHash("sha256").update(source).digest("hex"),sha256,path+" exact author SHA-256");
  }
});

test("Freclairions: native transfer retains author level, 24 skills, equipment, stats, identity and rendering",async()=>{
  const transfer=await importRecord(CREATURE);
  assert.equal(transfer.kind,"creature");
  const c=transfer.value;
  assert.equal(c.draft.id,"crea_foudrillon");
  assert.equal(c.draft.displayName,"Freclairions");
  assert.equal(c.draft.level,1);
  assert.equal(c.draft.skillIds.length,24);
  assert.ok(c.draft.skillIds.includes("lib_paralyze"));
  assert.ok(c.draft.skillIds.includes("choc_venin"));
  assert.deepEqual(c.loadout.slots.map(s=>s.skillId),
    ["lib_paralyze","choc_venin","lib_tailwind","lib_chain_lightning","cap_air_atk_7"]);
  assert.deepEqual(c.statValues.values,{health:120,speed:15,physical:0,defense:0,fire:0,water:0,
    earth:0,air:10,electric:10,light:0,shadow:0,poison:0});
  assert.equal(c.draft.combat.approachTimeModifierPct,-40);
  assert.equal(c.draft.presentation.profileId,"flying");
  assert.equal(c.draft.presentation.visual.front.assetId,"pack:capture:creature-guepe-cybernetique-opponent-01");
  assert.equal(c.draft.presentation.visual.back.assetId,"pack:capture:creature-guepe-cybernetique-player-01");
  assert.deepEqual(importCaptureTransferJsonV1(
    exportCaptureCreatureTransferJsonV1(c,{statRegistry:registry}),{statRegistry:registry}).value,c);
});

test("Choc venimeux: author timing and 10 electric damage per real consumed Venin stack persist through Transfer",async()=>{
  const transfer=await importRecord(SKILL);
  assert.equal(transfer.kind,"skill");
  const s=transfer.value.draft;
  assert.equal(s.id,"choc_venin");
  assert.equal(s.definition.name,"Choc venimeux");
  assert.deepEqual([s.requiredLevel,s.definition.energyCost,s.definition.preparationMs,s.definition.cooldownMs],
    [5,4,700,45000]);
  const consume=s.definition.effects[0];
  assert.equal(consume.kind,"consume_marker");
  assert.deepEqual([consume.markerId,consume.count,consume.minimum,consume.perCharge],
    ["venin-static","all",1,true]);
  assert.deepEqual([consume.effects[0].kind,consume.effects[0].amount,consume.effects[0].channel],
    ["damage",10,"electric"]);
  assert.equal(s.presentation.visual.icon.assetId,"pack:capture:icon-skill-paralysie-01");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(s)).value.draft,s);
});

test("both existing IDs are replaced atomically in the same configured owners, not duplicated or auto-re-equipped",async()=>{
  const ct=await importRecord(CREATURE),st=await importRecord(SKILL);
  const dard=await importRecord("data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json");
  const {schema: _schema, version: _version, ...creatureRecord}=ct.value;
  const beforeCreature={
    ...creatureRecord,
    draft:{...ct.value.draft,skillIds:ct.value.draft.skillIds.filter(id=>id!=="choc_venin")},
    loadout:{...ct.value.loadout,slots:ct.value.loadout.slots.map(slot=>slot.id==="slot-2"?{...slot,skillId:"lib_static_bite"}:slot)}
  };
  const beforeSkill={...st.value.draft,definition:{...st.value.draft.definition,cooldownMs:0}};
  const creatures=new Map([["crea_foudrillon",beforeCreature]]);
  // Seed all canonical native + showcased skills: a creature transfer is
  // validated against the complete configuredSkills owner, never a two-item mock.
  const skills=new Map();
  for(const draft of [...capturePortableNativeSkillDraftsV1(),...captureComplexNativeSkillDraftsV1()])
    if(!skills.has(draft.id))skills.set(draft.id,draft);
  for(const file of CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1){
    const transfer=await importRecord(file);
    skills.set(transfer.value.draft.id,transfer.value.draft);
  }
  skills.set("choc_venin",beforeSkill);
  const originalDard=skills.get("lib_paralyze");
  const applied=applyCaptureTransferBatchToEditorStateV1({
    transfers:[st,ct],configuredCreatures:creatures,configuredSkills:skills,
    statRegistry:registry,progressionRules,mode:"replace"
  });
  assert.equal(applied.actions.length,2);
  assert.deepEqual(applied.actions.map(x=>x.action),["replace-skill","replace-creature"]);
  assert.deepEqual(creatures.get("crea_foudrillon"),creatureRecord);
  assert.deepEqual(skills.get("choc_venin"),st.value.draft);
  assert.equal(skills.get("lib_paralyze"),originalDard);
  assert.equal([...creatures.keys()].filter(x=>x==="crea_foudrillon").length,1);
  assert.equal([...skills.keys()].filter(x=>x==="choc_venin").length,1);
  const db=buildCaptureEditorDatabaseV1({configuredCreatures:creatures,configuredSkills:skills,statRegistry:registry,progressionRules});
  assert.equal(db.creatures.filter(x=>x.draft.id==="crea_foudrillon").length,1);
  assert.equal(db.skills.filter(x=>x.id==="choc_venin").length,1);
});
