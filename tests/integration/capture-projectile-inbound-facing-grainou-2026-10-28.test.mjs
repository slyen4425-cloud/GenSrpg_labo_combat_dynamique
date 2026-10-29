import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
import {CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import {CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1} from "../../src/catalogs/capture-showcase-creature-presets-v1.js";

const read=path=>readFile(new URL("../../"+path,import.meta.url),"utf8");
const skillPath="data/capture/showcase/graine_sansue_cap.capture-skill-transfer-v1.json";
const creaturePath="data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json";
const skillSource="data/capture/source-exports/gensrpg-capture-skill-graine_sansue_cap-2026-10-28-r2.json";
const creatureSource="data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-28-r2.json";
const sha=s=>createHash("sha256").update(s).digest("hex");

function node(rect={left:0,top:0,width:80,height:80}) {
  return {className:"",style:{},dataset:{},children:[],append(child){this.children.push(child);},remove(){},getBoundingClientRect(){return rect}};
}

async function flight({fromSlot="player",targetSlot=fromSlot==="player"?"opponent":"player",
  fromPoint=null,asset={url:"/native-element-projectile.webp",headingRad:-0.48,coreAnchor:{x:0.5,y:0.5}},
  trajectoryMode=null}={}) {
  const original=JSON.parse(await read("data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json"));
  const binding=normalizeSkillPresentationBinding(original.draft.presentation);
  const projection=createCaptureSkillPresentationAssetsV2({
    skillPresentations:{[original.draft.id]:binding},
    assetForId:()=>asset
  });
  const animations=[];
  const arena=node({left:0,top:0,width:900,height:500});
  arena.ownerDocument={createElement:()=>node()};
  const anchors={
    player:node({left:80,top:320,width:80,height:80}),
    opponent:node({left:720,top:120,width:80,height:80})
  };
  const renderer=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
    presentationForSkill:(id,context)=>{
      const resolved=projection.presentationForSkill(id,context);
      return trajectoryMode ? {...resolved,travel:{...resolved.travel,trajectoryMode}} : resolved;
    },
    animate(target,keyframes,options){
      const animation={node:target,keyframes,options,finished:new Promise(()=>{}),cancel(){}};
      animations.push(animation);return animation;
    }
  });
  const command={type:"projectile",skillId:original.draft.id,fromSlot,targetSlot,
    ...(fromPoint ? {fromPoint}:{}),durationMs:original.draft.definition.travelMs};
  renderer.play(command);
  const shell=animations.find(x=>x.node.className.includes("skill-fx--projectile"));
  assert.ok(shell,"projectile must use the native FX renderer");
  const sprite=shell.node.children.find(x=>x.className.includes("skill-fx__sprite"));
  assert.ok(sprite,"projectile travel sprite must be visible");
  return {renderer,command,shell,sprite};
}

function angleOf(transform){
  const match=/rotate\(([-\d.eE]+)rad\)/.exec(transform);
  assert.ok(match,"sprite must expose native rotation");
  return Number(match[1]);
}

test("directional projectile player-to-enemy retains authored facing and exact movement",async()=>{
  const f=await flight();
  const theta=Math.atan2(-200,640);
  assert.equal(f.sprite.style.transform,"rotate("+(theta+0.48)+"rad)");
  assert.equal(f.shell.options.duration,2500);
  assert.doesNotMatch(f.sprite.style.transform,/scaleX\(-1\)/);
  f.renderer.dispose();
});

test("enemy-to-player projectile faces left without turning the artwork upside-down",async()=>{
  for(const headingRad of [-0.48,0]){
    const f=await flight({fromSlot:"opponent",asset:{url:"/element.webp",headingRad}});
    const theta=Math.atan2(200,-640);
    const smallTilt=theta-Math.PI+headingRad;
    assert.equal(f.sprite.style.transform,"rotate("+smallTilt+"rad) scaleX(-1)",
      "renderer must mirror the sprite instead of rotating it ~180 degrees");
    assert.ok(Math.abs(angleOf(f.sprite.style.transform))<Math.PI/2,
      "visual tilt must stay small while its nose points towards the player");
    assert.equal(f.shell.options.duration,2500);
    f.renderer.dispose();
  }
});

test("reflected projectile uses its real mirror contact point and receives the same inward facing",async()=>{
  const skill={id:"cap_air_atk_4",form:"projectile",element:"air",
    projectileTargeting:"direct",projectileClash:{power:1},travelMs:1500};
  const contactPoint={x:733,y:153};
  const action={skill,travelMs:1500,mirrorReturn:{contactPoint}};
  const planned=planSkillReleaseFx({action,actorSlot:"opponent",targetSlot:"player"});
  assert.equal(planned.length,1);
  assert.deepEqual(planned[0].fromPoint,contactPoint,"return must launch at the contact position");
  const f=await flight({...planned[0],asset:{url:"/reflected-projectile.webp",headingRad:-0.48}});
  assert.ok(f.sprite.style.transform.endsWith("scaleX(-1)"),
    "the returned projectile must point back to the original attacker");
  assert.ok(Math.abs(angleOf(f.sprite.style.transform))<Math.PI/2);
  assert.equal(f.command.fromPoint,contactPoint);
  f.renderer.dispose();
});

test("mirror triggered on player also returns rightward with original sprite facing",async()=>{
  const contactPoint={x:140,y:350};
  const skill={id:"cap_air_atk_4",form:"projectile",element:"air",
    projectileTargeting:"direct",projectileClash:{power:1},travelMs:1500};
  const action={skill,travelMs:1500,mirrorReturn:{contactPoint}};
  const planned=planSkillReleaseFx({action,actorSlot:"player",targetSlot:"opponent"});
  const f=await flight({...planned[0],asset:{url:"/reverse-mirror.webp",headingRad:-0.48}});
  assert.doesNotMatch(f.sprite.style.transform,/scaleX\(-1\)/,
    "the mirror facing must be derived from flight direction, not a fixed return flag");
  assert.ok(Math.abs(angleOf(f.sprite.style.transform))<Math.PI/2);
  assert.equal(f.command.fromPoint,contactPoint);
  f.renderer.dispose();
});

test("non-directional Tornade/personal FX and skyfall never gain unwanted rotation or flip",async()=>{
  const neutral=await flight({fromSlot:"opponent",asset:{url:"/tornado.webp"}});
  assert.equal(neutral.sprite.style.transform,"rotate(0rad)");
  neutral.renderer.dispose();
  const skyfall=await flight({fromSlot:"opponent",
    asset:{url:"/fall.webp",headingRad:-0.48},trajectoryMode:"skyfall"});
  assert.equal(skyfall.sprite.style.transform,"rotate(0rad)");
  skyfall.renderer.dispose();
});

test("latest two author transfers replace the same canonical IDs without losing settings",async()=>{
  const liveSkill=await read(skillPath);
  const liveCreature=await read(creaturePath);
  const savedSkill=await read(skillSource);
  const savedCreature=await read(creatureSource);
  const expectedSkill=JSON.parse(savedSkill);
  expectedSkill.draft.definition.effects[0].marker.maxStacks=2;
  assert.deepEqual(JSON.parse(liveSkill),expectedSkill,"older skill stays identical except new author Graine marker cap");
  const oldCreature=await read("data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r3.json");
  assert.equal(sha(oldCreature),"70a9390ff81d42d7f2dc9ec574091078a31e20bdad48f8540a23ea627c78a72b",
    "r3 remains immutable");
  const r4Creature=await read("data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r4.json");
  assert.equal(sha(r4Creature),"56af0e17f4aad906429bb25ed86330ef75c5b576dda1a367d739e4840e23fa9e","r4 source is historical and immutable");
  const currentCreature=await read("data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r5.json");
  assert.equal(sha(liveCreature),sha(currentCreature),"new creature source is published exactly");
  assert.equal(sha(savedSkill),"ec432fc7141806394c9be527c5f629ecaf870d103cbad7c06fecc927d93f7531");
  assert.equal(sha(savedCreature),"4a3ae6fa27f47382960720aa941d87c973546ba518fbaa6880c6d747ac283f1f");
  const skill=JSON.parse(liveSkill).draft;
  assert.equal(skill.id,"graine_sansue_cap");
  assert.equal(skill.definition.cooldownMs,10000);
  assert.equal(skill.definition.projectileClash.power,1);
  assert.equal(skill.presentation.visual.icon.assetId,"pack:capture:icon-skill-graine-sangsue-01");
  assert.equal(skill.presentation.visual.travel.assetId,"pack:capture:sprite-graine-sangsue-projectile-01");
  assert.equal(skill.presentation.visual.impact.assetId,"pack:capture:sprite-graine-sangsue-debuff-01");
  assert.deepEqual(skill.definition.effects[0].marker.periodic,
    {kind:"life_steal",amount:5,intervalMs:3000,damageMode:"combat",channel:"nature",percent:100});
  const creature=JSON.parse(liveCreature);
  assert.equal(creature.draft.id,"crea_nat_1");
  assert.equal(creature.draft.displayName,"Grainou");
  assert.deepEqual(creature.loadout.slots.slice(0,3).map(slot=>slot.skillId),["coupe_feuille","graine_sansue_cap","Spore_soporifique"]);
  assert.equal(creature.draft.combat.reaction.activeWindowMs,800);
  assert.equal(creature.draft.combat.reaction.type,"defense");
  assert.equal(creature.draft.combat.reaction.damageReductionPct,30);
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(x=>x===skillPath).length,1);
  assert.equal(CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1.filter(x=>x===creaturePath).length,1);
});
