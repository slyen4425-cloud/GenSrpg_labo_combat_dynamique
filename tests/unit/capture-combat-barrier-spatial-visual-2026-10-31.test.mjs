import test from "node:test";
import assert from "node:assert/strict";
import {sweptSegmentRectContactV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";

const effect={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:2.5,
 interceptKinds:["projectile","beam","contact"],spriteAssetId:"pack:capture:fx-ice-wall-author",
 visualScale:1.4,offsetForwardPx:25,offsetUpPx:6};
function active(){const state=createCombatState({fighters:[
 {id:"hero",maxHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
 {id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10}
]});return createCombatBarrierV1({state,sourceActorId:"hero",protectedActorId:"hero",sourceSkillId:"ice-wall",effect}).state;}

test("real wall contract retains editable HP coefficient and an authored sprite binding",()=>{
 const normalized=normalizeSkillEffectV1(effect);
 assert.equal(normalized.hpPerStatPoint,2.5);
 assert.equal(normalized.spriteAssetId,effect.spriteAssetId);
 const wall=active().combatEntities[0];
 assert.equal(wall.maxHp,200);
 assert.equal(wall.spriteAssetId,effect.spriteAssetId);
 assert.equal(wall.hpPerStatPoint,2.5);
 assert.equal(wall.visualScale,1.4);
 assert.equal(wall.offsetForwardPx,25);
 assert.throws(()=>normalizeSkillEffectV1({...effect,visualScale:5}),/visualScale/);
 assert.throws(()=>normalizeSkillEffectV1({...effect,offsetUpPx:300}),/offsetUpPx/);
});

test("actual swept projectile intersects persistent wall rectangle before body",()=>{
 const wall={left:40,top:20,width:20,height:60};
 assert.deepEqual(sweptSegmentRectContactV1({from:{x:0,y:50},to:{x:100,y:50},rect:wall}),{x:40,y:50});
 assert.equal(sweptSegmentRectContactV1({from:{x:0,y:10},to:{x:100,y:10},rect:wall}),null);
 assert.deepEqual(sweptSegmentRectContactV1({from:{x:100,y:50},to:{x:0,y:50},rect:wall}),{x:60,y:50});
 assert.deepEqual(sweptSegmentRectContactV1({from:{x:50,y:50},to:{x:90,y:50},rect:wall}),{x:50,y:50});
});

test("spatially observed projectile cannot damage a wall it did not collide with",()=>{
 const s=active(),id=s.combatEntities[0].id;
 const miss=applyCombatDamageV1({state:s,sourceActorId:"enemy",targetActorId:"hero",damage:35,
 incomingKind:"projectile",contactedEntityId:null});
 assert.equal(miss.absorbedByEntity,0);
 assert.equal(miss.state.fighters.hero.hp,65);
 assert.equal(miss.state.combatEntities[0].hp,200);
 const hit=applyCombatDamageV1({state:s,sourceActorId:"enemy",targetActorId:"hero",damage:35,
 incomingKind:"projectile",contactedEntityId:id});
 assert.equal(hit.absorbedByEntity,35);
 assert.equal(hit.state.fighters.hero.hp,100);
 assert.equal(hit.state.combatEntities[0].hp,165);
 const fake=applyCombatDamageV1({state:s,sourceActorId:"enemy",targetActorId:"hero",damage:35,
 incomingKind:"projectile",contactedEntityId:"barrier:foreign"});
 assert.equal(fake.absorbedByEntity,0);
});


test("a protected hero's vulnerability or immunity cannot silently change a wall's HP",()=>{
 const s=active(),id=s.combatEntities[0].id;
 const vulnerable={...s,fighters:Object.freeze({...s.fighters,hero:Object.freeze({...s.fighters.hero,
  statusEffects:[Object.freeze({definition:{id:"test-vulnerable",kind:"incoming_effect_modifier",
   modifierPct:100,affectedPolarity:"detrimental"},appliedAtMs:0,expiresAtMs:20000,stacks:1})]})})};
 const wallHit=applyCombatDamageV1({state:vulnerable,sourceActorId:"enemy",targetActorId:"hero",
  damage:30,incomingKind:"projectile",contactedEntityId:id});
 assert.equal(wallHit.absorbedByEntity,30,"wall must take raw incoming damage");
 assert.equal(wallHit.state.combatEntities[0].hp,170);
 assert.equal(wallHit.appliedDamage,0);
});


test("wall sprite is resolved through the exact same canonical skill presentation asset authority",async()=>{
 const {createCaptureSkillPresentationAssetsV2}=await import("../../src/adapters/renderer/capture-skill-presentation-assets-v2.js");
 const asset={url:"https://example.test/real-asset.webp",frameCount:12,frameMs:90};
 const presentations=createCaptureSkillPresentationAssetsV2({skillPresentations:{},
  assetForId:id=>id===effect.spriteAssetId?asset:null});
 assert.strictEqual(presentations.visualAsset(effect.spriteAssetId),asset);
 assert.equal(presentations.visualAsset("nonexistent"),null);
});

test("nominal projectile timeout without observed barrier geometry never invents wall collision",()=>{
 const state=active(),wall=state.combatEntities[0];
 const nominal=applyCombatDamageV1({state,sourceActorId:"enemy",targetActorId:"hero",
   damage:35,incomingKind:"projectile"});
 assert.equal(nominal.absorbedByEntity,0,"only exact observed wall contact may intercept");
 assert.equal(nominal.state.combatEntities[0].hp,wall.hp);
 assert.equal(nominal.state.fighters.hero.hp,65,"nominal hit reaches the fighter when no wall was crossed");
 const observed=applyCombatDamageV1({state,sourceActorId:"enemy",targetActorId:"hero",
   damage:35,incomingKind:"projectile",contactedEntityId:wall.id});
 assert.equal(observed.absorbedByEntity,35,"the native observed geometry still protects the hero");
 assert.equal(observed.state.combatEntities[0].hp,wall.hp-35);
 assert.equal(observed.state.fighters.hero.hp,100);
 const beam=applyCombatDamageV1({state,sourceActorId:"enemy",targetActorId:"hero",
   damage:35,incomingKind:"beam"});
 assert.equal(beam.absorbedByEntity,35,"beam behavior remains unchanged until independent spatial sensor lot");
});
