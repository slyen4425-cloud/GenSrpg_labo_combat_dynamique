import test from "node:test";
import assert from "node:assert/strict";
import {nearestBarrierSegmentContactV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1,interceptCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";

const effect={kind:"summon_entity",targetScope:"self",entityKind:"barrier",statId:"glace",
  hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"]};
function scene(){
  const initial=createCombatState({fighters:[
    {id:"hero",maxHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
    {id:"enemy",maxHp:100,maxEnergy:10,initialEnergy:10}]});
  return createCombatBarrierV1({state:initial,sourceActorId:"hero",protectedActorId:"hero",
    sourceSkillId:"ice-wall",effect}).state;
}
test("beam/contact visual segment picks the nearest wall actually intersected, never a lateral one",()=>{
  const from={x:0,y:50},to={x:100,y:50};
  const candidates=[
    {entityId:"far",rect:{left:70,top:20,width:15,height:60}},
    {entityId:"away",rect:{left:15,top:75,width:15,height:20}},
    {entityId:"near",rect:{left:30,top:20,width:15,height:60}}
  ];
  assert.deepEqual(nearestBarrierSegmentContactV1({from,to,barriers:candidates}),
    {entityId:"near",point:{x:30,y:50}});
  assert.equal(nearestBarrierSegmentContactV1({from:{x:0,y:5},to:{x:100,y:5},barriers:candidates}),null);
  assert.equal(nearestBarrierSegmentContactV1({from:{x:0,y:50},to:{x:20,y:50},barriers:candidates}),null);
  assert.equal(nearestBarrierSegmentContactV1({from:{x:20,y:50},to:{x:20,y:50},barriers:candidates}),null);
});
test("native beam and melee cannot steal wall HP without exact geometric evidence",()=>{
  const state=scene(),id=state.combatEntities[0].id;
  for(const incomingKind of ["beam","contact"]){
    const miss=interceptCombatBarrierV1({state,sourceActorId:"enemy",targetActorId:"hero",
      damage:35,incomingKind});
    assert.equal(miss.absorbedByEntity,0,incomingKind+" must not auto-hit invisible wall");
    const fake=interceptCombatBarrierV1({state,sourceActorId:"enemy",targetActorId:"hero",
      damage:35,incomingKind,contactedEntityId:"another-wall"});
    assert.equal(fake.absorbedByEntity,0);
    const observed=interceptCombatBarrierV1({state,sourceActorId:"enemy",targetActorId:"hero",
      damage:35,incomingKind,contactedEntityId:id});
    assert.equal(observed.absorbedByEntity,35);
    assert.equal(observed.state.combatEntities[0].hp,45);
  }
});
