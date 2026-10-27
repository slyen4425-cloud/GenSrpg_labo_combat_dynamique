// Fixture historique 5 dégâts / 1000 ms : ces tests isolent le Runtime des réglages auteur actuels.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";
import {createCombatSession} from "../../src/core/combat/combat-session.js";
import {applyPersistentZoneEffectsV1,advancePersistentZonesV1} from "../../src/core/combat/persistent-zone-runtime-v1.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {normalizePersistentZoneSpatialV1,visiblePersistentZoneRelationV1} from "../../src/contracts/persistent-zone-spatial-v1.js";

const author=()=>JSON.parse(readFileSync(new URL(
  "../../tests/fixtures/firestorm-pre-settings-2026-10-23.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
const rect=(left,top,width,height)=>({left,top,width,height});

// 16:9 mobile-like spawn. The actual native sprite-zone geometry is measured
// from the SAME styled FX node as the thin tactical outline; 144px is 20vw.
// The opposing visible silhouette starts 240px from the zone source edge.
function arenaFixture(draft){
  const sourceRect=rect(185,235,30,30);
  let enemyRect=rect(440,190,160,120);
  const document={createElement(tag){
    const node={tag,className:"",style:{},dataset:{},children:[],
      append(...xs){this.children.push(...xs);},
      remove(){this.removed=true;},
      getBoundingClientRect(){
        const x=parseFloat(this.style.left)||0,y=parseFloat(this.style.top)||0;
        const matches=String(this.style.transform??"").match(/scale\(([^,]+),\s*([^)]+)\)/);
        const sx=matches?Number(matches[1]):1;
        const sy=matches?Number(matches[2]):1;
        return rect(x-144*sx/2,y-144*sy/2,144*sx,144*sy);
      }};
    node.ownerDocument=document;return node;
  }};
  const arena={ownerDocument:document,nodes:[],
    append(x){this.nodes.push(x);},
    getBoundingClientRect(){return rect(0,0,720,405);}};
  const anchors={player:{getBoundingClientRect:()=>sourceRect},
    opponent:{getBoundingClientRect:()=>enemyRect}};
  const visual=draft.presentation.visual.aura;
  const fx=createDomSkillFxRenderer({
    arena,anchors,targetAnchors:anchors,
    presentationForSkill:()=>({persistentZone:{
      ...visual,url:"https://example.test/firestorm.webp"
    },persistentZoneLayer:"behind"}),
    animate:()=>({finished:new Promise(()=>{}),cancel(){}})
  });
  const skill=normalizeSkillDefinition(draft.definition);
  const fighter=id=>({id,maxHp:500,initialHp:500,maxEnergy:40,initialEnergy:40,
    energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,
    chargeTimeModifierPct:0});
  const battleFormat={actors:[{actorId:"player"},{actorId:"opponent"}],
    teamOf:id=>id==="player"?"local":id==="opponent"?"enemy":null};
  const session=createCombatSession({distance:"long",battleFormat,fighters:[fighter("player"),fighter("opponent")]});
  let state=session.snapshot();
  const read=(zones)=>{
    fx.syncPersistentZones(zones);
    return normalizePersistentZoneSpatialV1(fx.sampleZoneSpatialContext(zones));
  };
  function stage(n){
    while((state.persistentZones?.[0]?.activations??0)<n){
      state=applyPersistentZoneEffectsV1({state,actorId:"player",targetId:"opponent",skill,atMs:0});
    }
    const zones=state.persistentZones;
    const sample=read(zones);
    const zone=zones[0];
    const contains=visiblePersistentZoneRelationV1({sample,zoneId:zone.id,sourceActorId:"player",radius:zone.radius,candidateId:"opponent"});
    const marker=arena.nodes.find(x=>x.className?.includes("skill-fx--tactical-zone"));
    const sprite=arena.nodes.find(x=>x.className?.includes("skill-fx--persistent-zone"));
    if(zone.radius==="long"){
      assert.match(marker.className,/skill-fx--tactical-full-arena/,
        "long is full battlefield, so the marker outlines the arena");
      assert.equal(marker.style.transform,"none");
    }else{
      assert.equal(marker?.style.transform,sprite?.style.transform,
        "short/medium marker uses same sampled native ellipse");
    }
    const hpBefore=state.fighters.opponent.hp;
    // Real persistent-zone damage owner; this sample must be the same as the
    // visible contour and the author skill's radius.
    const ticked=advancePersistentZonesV1({state,deltaMs:1000,battleFormat,zoneSpatialContext:{visibleZones:sample}});
    assert.equal(ticked.fighters.opponent.hp<hpBefore,contains || zone.radius==="long",
      "native damage must agree with displayed boundary");
    return {radius:zone.radius,contains,damaged:ticked.fighters.opponent.hp<hpBefore,marker,sprite};
  }
  return {stage,fx,setEnemyRect:r=>{enemyRect=r;},getState:()=>state};
}

test("author Firestorm level 2 stays away from a stationary opponent; level 3 reaches it",()=>{
 const data=author(),s=data.definition,e=s.effects[0];
 assert.equal(s.id,"cap_fire_atk_6");
 assert.equal(e.radius,"short");
 assert.equal(e.radiusGrowthSteps,1);
 assert.equal(e.maxActivations,3);
 assert.equal(e.tickEffect.amount,5);
 const f=arenaFixture(data);
 const lv1=f.stage(1);assert.equal(lv1.radius,"short");assert.equal(lv1.contains,false);
 const lv2=f.stage(2);assert.equal(lv2.radius,"medium");assert.equal(lv2.contains,false);
 const lv3=f.stage(3);assert.equal(lv3.radius,"long");assert.equal(lv3.damaged,true);
 f.fx.dispose();
});

test("a target can still deliberately enter Firestorm level 2; the native circle follows the same geometry",()=>{
 const f=arenaFixture(author());
 f.stage(1);f.stage(2);
 f.setEnemyRect(rect(310,190,160,120));
 const nearby=f.stage(2);
 assert.equal(nearby.contains,true);
 assert.equal(nearby.damaged,true);
 f.fx.dispose();
});
