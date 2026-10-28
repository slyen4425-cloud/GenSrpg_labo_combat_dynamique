import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {normalizeCaptureMarkerV1, markerStatusDefinitionV1, normalizeCaptureMarkerLibraryV1} from "../../src/contracts/capture-marker-v1.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {withFighterHp, advanceCombatTime} from "../../src/core/combat/combat-state.js";
import {applyStatusEffectV1, advanceStatusEffectsV1, consumeCaptureMarkerStacksV1} from "../../src/core/combat/status-effect-runtime-v1.js";

const fighter = id => ({id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0});
const initial = () => createCombatSession({fighters:[fighter("a"),fighter("b")]}).snapshot();
const marker = (extras={}) => ({
  id:"sangsue-vitale",name:"Sangsue vitale",polarity:"detrimental",
  durationMs:20000,maxStacks:10,
  periodic:{kind:"life_steal",amount:5,intervalMs:5000,damageMode:"fixed",
    channel:"poison",percent:50,...extras}
});
const add = (state,mark=marker(),stacks=1,sourceActorId="a") => {
  let next=state;
  for(let i=0;i<stacks;i++){
    next=applyStatusEffectV1({state:next,sourceActorId,targetActorId:"b",
      sourceSkillId:"life-drain-cast",status:markerStatusDefinitionV1(mark),atMs:0});
  }
  return next;
};
// The session's real advance updates elapsedMs separately from StatusRuntime.
const tick = (state,deltaMs=5000) =>
  advanceCombatTime(advanceStatusEffectsV1({state,deltaMs}),deltaMs);

test("periodic life_steal keeps the single stack counter, exports faithfully and validates its own fields",()=>{
  const m=normalizeCaptureMarkerV1(marker({maxHeal:12}));
  assert.equal(m.periodic.kind,"life_steal");
  assert.deepEqual(normalizeCaptureMarkerLibraryV1([m])[0],m);
  assert.equal(markerStatusDefinitionV1(m).kind,"stack_counter");
  assert.equal(markerStatusDefinitionV1(m).periodic.maxHeal,12);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({percent:101})),/percent/i);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({percent:-1})),/percent/i);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({maxHeal:-2})),/maxHeal/i);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({percent:"invalid"})),/percent/i);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({strange:1})),/unknown/i);
  assert.throws(()=>normalizeCaptureMarkerV1(marker({intervalMs:0})),/intervalMs/i);
  assert.throws(()=>normalizeCaptureMarkerV1({...marker(),periodic:{kind:"heal",amount:5,intervalMs:1000,percent:50}}),/unknown|heal|percent/i);
});

test("one native periodic tick damages marker holder and heals its living caster based on actual lost HP",()=>{
  let state=withFighterHp(initial(),"a",30);
  state=add(state,marker(),3);
  const counter=state.fighters.b.statusEffects.find(x=>x.definition.kind==="stack_counter");
  assert.equal(counter.stacks,3);
  assert.equal(counter.nextTickAtMs,5000);
  state=tick(state);
  assert.equal(state.fighters.b.hp,85,"three stacks deal 15 actual damage");
  assert.equal(state.fighters.a.hp,37.5,"50% of 15 HP is 7.5, like native skill life steal");
  assert.equal(state.fighters.b.statusEffects.filter(x=>x.definition.kind==="stack_counter").length,1);
  state=tick(state,5000);
  assert.equal(state.fighters.b.hp,70);
  assert.equal(state.fighters.a.hp,45);
});

test("native shields and immunity block life steal; partially absorbed damage drains only the actual loss",()=>{
  const shield={id:"protect",kind:"shield",polarity:"beneficial",durationMs:15000,stacking:"replace",amount:13};
  let state=withFighterHp(initial(),"a",10);
  state=applyStatusEffectV1({state,sourceActorId:"b",targetActorId:"b",status:shield,atMs:0});
  state=add(state,marker(),3);
  state=tick(state);
  assert.equal(state.fighters.b.hp,98);
  assert.equal(state.fighters.a.hp,11,"15 requested - 13 shield => 2 HP lost => 1 HP healed");
  const immunity={id:"immune",kind:"immunity",polarity:"beneficial",
    durationMs:15000,stacking:"replace",domains:["damage"]};
  let imm=withFighterHp(initial(),"a",10);
  imm=applyStatusEffectV1({state:imm,sourceActorId:"b",targetActorId:"b",status:immunity,atMs:0});
  imm=add(imm,marker(),3);
  imm=tick(imm);
  assert.equal(imm.fighters.a.hp,10);
  assert.equal(imm.fighters.b.hp,100);
});

test("native overkill, missing HP, maxHeal and a knocked-out caster are respected",()=>{
  let state=withFighterHp(withFighterHp(initial(),"a",95),"b",4);
  state=tick(add(state,marker({maxHeal:1}),3));
  assert.equal(state.fighters.b.hp,0);
  assert.equal(state.fighters.a.hp,96,"overkill 4 HP -> 2 requested, capped to 1");
  let ko=withFighterHp(initial(),"a",0);
  ko=tick(add(ko,marker(),3));
  assert.equal(ko.fighters.a.hp,0,"marker tick must never resurrect its source");
  assert.equal(ko.fighters.b.hp,85);
  let full=tick(add(initial(),marker(),3));
  assert.equal(full.fighters.a.hp,100,"healing cannot exceed maxHP");
});

test("reflected DoT knockout never allows the source to steal life back from KO",()=>{
  const reflect={id:"reflect-dot",kind:"damage_reflection",polarity:"beneficial",
    durationMs:15000,stacking:"replace",percent:100,incomingKinds:["dot"]};
  let state=withFighterHp(initial(),"a",10);
  state=applyStatusEffectV1({state,sourceActorId:"b",targetActorId:"b",
    status:reflect,atMs:0});
  state=tick(add(state,marker(),3));
  assert.equal(state.fighters.b.hp,85,"victim loses 15 real HP");
  assert.equal(state.fighters.a.hp,0,"100% reflection knocks out source before healing");
});

test("one shared marker clock credits only its most recent living caster across abilities",()=>{
  const fighters=[fighter("a"),fighter("b"),fighter("c")];
  let state=createCombatSession({fighters}).snapshot();
  state=withFighterHp(withFighterHp(state,"a",25),"c",35);
  state=applyStatusEffectV1({state,sourceActorId:"a",targetActorId:"b",
    sourceSkillId:"first",status:markerStatusDefinitionV1(marker()),atMs:0});
  state=applyStatusEffectV1({state,sourceActorId:"c",targetActorId:"b",
    sourceSkillId:"second",status:markerStatusDefinitionV1(marker()),atMs:1000});
  assert.equal(state.fighters.b.statusEffects.length,1,"no independent status or duplicate clock");
  assert.equal(state.fighters.b.statusEffects[0].sourceActorId,"c");
  state=tick(state,5000);
  assert.equal(state.fighters.b.hp,90);
  assert.equal(state.fighters.a.hp,25,"first caster is not healed by a marker now owned by c");
  assert.equal(state.fighters.c.hp,40,"current source alone receives half of 10 real damage");
});

test("zero damage cannot drain, stack consumption changes next tick and existing damage/heal stay unchanged",()=>{
  let zero=withFighterHp(initial(),"a",40);
  zero=tick(add(zero,marker({percent:0}),3));
  assert.equal(zero.fighters.a.hp,40);
  let consumed=withFighterHp(initial(),"a",40);
  consumed=add(consumed,marker(),3);
  const before=consumeCaptureMarkerStacksV1({
    state:consumed,targetActorId:"b",markerId:"sangsue-vitale",count:2,minimum:2
  });
  const after=tick(before.state);
  assert.equal(after.fighters.b.hp,95);
  assert.equal(after.fighters.a.hp,42.5);
  for(const kind of ["damage","heal"]){
    const old={id:"legacy-"+kind,name:"Ancien",polarity:kind==="heal"?"beneficial":"detrimental",
      durationMs:10000,maxStacks:2,periodic:{kind,amount:3,intervalMs:5000}};
    const normalized=normalizeCaptureMarkerV1(old);
    assert.equal(normalized.periodic.kind,kind);
    assert.equal(markerStatusDefinitionV1(old).periodic.kind,kind);
  }
});

test("the actual Capture editor presents, saves, reloads and explains the same periodic drain definition",async()=>{
  const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const js=await readFile(new URL("../../src/ui/capture-marker-library-v1.js",import.meta.url),"utf8");
  const explain=await readFile(new URL("../../src/ui/capture-skill-explanation-v1.js",import.meta.url),"utf8");
  assert.match(html,/<option value="life_steal">Drain de vie par charge<\/option>/);
  for(const id of ["marker-periodic-percent","marker-periodic-max-heal"]){
    assert.ok(html.includes("data-"+id));
    assert.ok(js.includes('"'+id+'"'));
  }
  assert.match(js,/periodic\.kind==="life_steal"/);
  assert.match(explain,/p\.kind==="life_steal"/);
  // Module URL identity is state ownership: different query URLs create
  // different WeakMaps for one marker library, losing all marker pickers.
  const human=await readFile(new URL("../../src/ui/capture-editor-human-v2.js",import.meta.url),"utf8");
  const effects=await readFile(new URL("../../src/ui/capture-marker-effect-fields-v1.js",import.meta.url),"utf8");
  const extract=(text)=>text.match(/from "\.\/capture-marker-library-v1\.js(\?v=[\w-]+)?"/)?.[0]??"";
  assert.ok(extract(human),"human editor must import the canonical marker state owner");
  assert.equal(extract(human),extract(effects),"skill effect editor must use exactly the SAME ESM module instance");
  assert.ok(human.includes('from "./capture-marker-effect-fields-v1.js?v=marker-life-drain-20261028"'),"parent must reload current effect-fields module so old cached URLs cannot create another state owner");

});
