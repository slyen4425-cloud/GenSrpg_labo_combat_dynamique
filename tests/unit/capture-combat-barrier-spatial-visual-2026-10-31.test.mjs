import test from "node:test";
import assert from "node:assert/strict";
import {sweptSegmentRectContactV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {normalizeSkillEffectV1} from "../../src/contracts/skill-effect-v1.js";

const effect={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",hpPerStatPoint:2.5,
 interceptKinds:["projectile","beam","contact"],spriteAssetId:"pack:capture:fx-ice-wall-author"};
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
