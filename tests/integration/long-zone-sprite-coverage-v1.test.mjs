import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {normalizeSkillDefinition} from "../../src/contracts/skill-definition.js";

const author=()=>JSON.parse(readFileSync(new URL("../../data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json",import.meta.url),"utf8")).draft;
const rect=(left,top,width,height)=>({left,top,width,height});
function scene(){
  const animations=[],doc={createElement(tag){
    const node={tag,style:{},dataset:{},className:"",children:[],
      append(...items){this.children.push(...items);},
      remove(){this.removed=true;},
      getBoundingClientRect(){return rect(0,0,192,192);}};
    node.ownerDocument=doc;return node;
  }};
  const arena={ownerDocument:doc,nodes:[],append(n){this.nodes.push(n);},
    getBoundingClientRect(){return rect(0,0,720,405);}};
  const anchor=(x,y)=>({getBoundingClientRect(){return rect(x,y,35,35);}});
  const anchors={player:anchor(195,205),opponent:anchor(540,150)};
  const draft=author();
  const skill=normalizeSkillDefinition(draft.definition);
  const aura={...draft.presentation.visual.aura,
    url:"https://example.test/firestorm-atlas.webp",frameCount:16};
  const fx=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
    presentationForSkill:()=>({persistentZone:aura,persistentZoneLayer:"behind"}),
    animate:(node,frames,options)=>{
      const x={node,frames,options,finished:new Promise(()=>{}),cancel(){this.cancelled=true;}};
      animations.push(x);return x;
    }});
  const zone=(radius)=>({id:"firestorm",sourceActorId:"player",skillId:skill.id,skillElement:skill.element,
    radius,appliedAtMs:1000,expiresAtMs:16000,durationMs:15000});
  return {arena,fx,animations,zone};
}
test("long native full-field damage stage projects the SAME author sprite over the whole battlefield",()=>{
  const s=scene(),skill=author().definition;
  assert.equal(skill.effects[0].maxActivations,3);
  assert.equal(skill.effects[0].radiusGrowthSteps,1);
  const aura=author().presentation.visual.aura;
  assert.equal(aura.displayScaleX,1.6,"preserve calibrated stage 2");
  assert.equal(aura.opacity,0.5);
  s.fx.syncPersistentZones([s.zone("short")]);
  const sprite=s.arena.nodes.find(n=>n.dataset.skillFx==="persistent-zone");
  const marker=s.arena.nodes.find(n=>n.dataset.tacticalRadius==="persistent-zone");
  assert.ok(sprite&&marker);
  assert.match(sprite.style.transform,/scale\(/);
  assert.equal(sprite.style.width,"");
  assert.equal(sprite.style.height,"");
  s.fx.syncPersistentZones([s.zone("medium")]);
  assert.match(sprite.style.transform,/scale\(/);
  assert.equal(sprite.dataset.zoneRadius,"medium");
  assert.equal(sprite.style.left,marker.style.left);
  assert.equal(sprite.style.top,marker.style.top);
  s.fx.syncPersistentZones([s.zone("long")]);
  assert.equal(s.arena.nodes.filter(n=>n.dataset.skillFx==="persistent-zone").length,1);
  assert.equal(sprite.style.width,"100%");
  assert.equal(sprite.style.height,"100%");
  assert.equal(sprite.style.left,"50%");
  assert.equal(sprite.style.top,"50%");
  assert.equal(sprite.style.transform,"translate(-50%, -50%)");
  assert.equal(sprite.style.aspectRatio,"auto");
  assert.equal(sprite.dataset.zoneRadius,"long");
  assert.equal(sprite.style.opacity,"0.5");
  assert.equal(sprite.dataset.assetId,"pack:capture:sprite-fire-zone-loop-01");
  assert.equal(marker.style.width,"calc(100% - 4px)");
  assert.ok(s.animations.every(x=>!x.cancelled),"same sprite playback must survive reinforcement");
  const initialFrameCount=s.animations.length;
  s.fx.syncPersistentZones([s.zone("medium")]);
  assert.equal(sprite.style.width,"");
  assert.equal(sprite.style.height,"");
  assert.equal(sprite.style.aspectRatio,"");
  assert.match(sprite.style.transform,/scale\(/);
  assert.equal(s.animations.length,initialFrameCount);
  s.fx.syncPersistentZones([]);
  assert.equal(sprite.removed,true);
  assert.equal(marker.removed,true);
  s.fx.dispose();
});

test("a separate-frames author image covers a widescreen full-area zone without ugly pillarboxing",()=>{
  const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  assert.match(css,/\.skill-fx--persistent-zone\[data-zone-radius="long"\] \.skill-fx__loop-frame\s*\{\s*object-fit:\s*cover/);
  // For other radii the authored 1:1 sprite remains unaffected.
  assert.match(css,/\.skill-fx__loop-frame\s*\{[\s\S]*?object-fit:\s*contain/);
});
