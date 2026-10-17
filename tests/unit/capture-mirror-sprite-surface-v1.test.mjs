import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createDomSkillFxRenderer } from "../../src/adapters/renderer/dom-skill-fx.js";
import { createDomStatusFxRenderer } from "../../src/adapters/renderer/dom-status-fx.js";
import { sweptPointHitsSpriteEllipseV1 } from "../../src/adapters/renderer/dom-visible-model-contact.js";
import { importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1 } from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import { CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 } from "../../src/catalogs/capture-showcase-skill-presets-v1.js";
import { createHash } from "node:crypto";

const rect=(left,top,width,height)=>({left,top,width,height});
const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
const frame=r=>({mask,origin:{x:r.left,y:r.top},axisX:{x:r.left+r.width,y:r.top},axisY:{x:r.left,y:r.top+r.height}});

test("RED: shield boundary uses the live sprite ellipse, never a hardcoded radius nor body scale",()=>{
  const segment={previousPoint:{x:10,y:110},point:{x:250,y:110}};
  const contact=sweptPointHitsSpriteEllipseV1({...segment,previousRect:rect(120,50,120,120),rect:rect(120,50,120,120)});
  assert.ok(contact);
  assert.ok(Math.abs(contact.x-120)<0.001);
  assert.equal(contact.y,110);
  const bigger=sweptPointHitsSpriteEllipseV1({...segment,previousRect:rect(80,10,200,200),rect:rect(80,10,200,200)});
  assert.ok(Math.abs(bigger.x-80)<0.001,"live sprite scale enlarges true collision surface");
  assert.equal(sweptPointHitsSpriteEllipseV1({
    previousPoint:{x:10,y:30},point:{x:250,y:30},
    previousRect:rect(120,50,120,120),rect:rect(120,50,120,120)
  }),null,"trajectory above a shield must not trigger");
  assert.equal(sweptPointHitsSpriteEllipseV1({
    previousPoint:{x:160,y:110},point:{x:250,y:110},
    previousRect:rect(120,50,120,120),rect:rect(120,50,120,120)
  }),null,"leaving shield from inside is not an incoming collision");
  const moved=sweptPointHitsSpriteEllipseV1({
    previousPoint:{x:50,y:110},point:{x:140,y:110},
    previousRect:rect(220,50,120,120),rect:rect(90,50,120,120)
  });
  assert.ok(moved,"moving shield must be sampled continuously in its current position");
});

function liveHarness({shield=true,shieldKind="projectile_mirror",spriteRect=rect(155,70,110,80)}={}){
  let shotRect=rect(40,105,10,10),targetRect=rect(200,100,20,20),barrierRect=spriteRect;
  let frameTick=null;const contacts=[];
  const doc={createElement(){
    return {className:"",dataset:{},style:{},ownerDocument:doc,children:[],
      append(x){this.children.push(x)},
      remove(){this.removed=true},
      getBoundingClientRect(){return this.dataset.statusFx==="sprite"?barrierRect:shotRect}
    };
  }};
  const motion=doc.createElement();
  motion.getBoundingClientRect=()=>targetRect;
  motion.querySelector=s=>motion.children.find(n=>!n.removed&&
    n.dataset.statusFx==="sprite" && n.dataset.statusKind==="projectile_mirror")??null;
  const source=doc.createElement();
  source.getBoundingClientRect=()=>rect(10,100,30,40);
  const statusFx=createDomStatusFxRenderer({
    targetFor:()=>({motion,image:{src:"/creature.png"},statusHost:null}),
    statusPresentationFor:()=>shield?{mode:"sprite",sprite:{
      url:"/shield.webp",assetId:"pack:capture:sprite-status-energy-shield-01",
      displayScale:2.5,opacity:0.7,playbackMode:"hold-last",frameCount:8,frameMs:90
    }}:null
  });
  const activeState=()=>({elapsedMs:200,fighters:{opponent:{statusEffects:shield?[{
    definition:{id:"lib_magic_barrier:0",kind:shieldKind,polarity:"beneficial",durationMs:30000},
    appliedAtMs:0,expiresAtMs:30000
  }]:[]}}});
  statusFx.sync(activeState());
  const arena={ownerDocument:doc,append(){},getBoundingClientRect:()=>rect(0,0,420,240)};
  const renderer=createDomSkillFxRenderer({arena,anchors:{player:source,opponent:motion},
    targetAnchors:{player:source,opponent:motion},
    targetCollisionModelFor:()=>({snapshot:()=>frame(targetRect)}),
    onProjectileContact:c=>contacts.push(c),
    animate:()=>({finished:new Promise(()=>{}),cancel(){}}),
    requestFrame(cb){frameTick=cb;return 1},cancelFrame(){}
  });
  renderer.play({type:"projectile",skillId:"test-bolt",element:"light",
    fromSlot:"player",targetSlot:"opponent",durationMs:1000});
  return {contacts,statusFx,renderer,
    setShot(r){shotRect=r},setShield(r){barrierRect=r},setTarget(r){targetRect=r},
    runFrame(){assert.equal(typeof frameTick,"function");const fn=frameTick;frameTick=null;fn()},
    removeStatus(){statusFx.sync({fighters:{opponent:{statusEffects:[]}}})}
  };
}

test("RED: native mirror sprite owns the FIRST contact point, well outside the creature opaque mask",()=>{
  const h=liveHarness();
  h.setShot(rect(245,105,10,10));
  h.runFrame();
  assert.equal(h.contacts.length,1);
  assert.equal(h.contacts[0].targetId,"opponent");
  assert.ok(Math.abs(h.contacts[0].contactPoint.x-155)<0.001,
    "return projectile must originate at the visible barrier, not body nor overshot frame");
});

test("status sprite removed or wrong status type: native opaque creature remains the only contact owner",()=>{
  for(const opt of [{shield:false},{shieldKind:"shield"}]){
    const h=liveHarness(opt);
    h.setShot(rect(180,105,10,10));
    h.runFrame();
    assert.equal(h.contacts.length,0,"do not collide early on absent or non-mirror sprite");
    h.setShot(rect(215,105,10,10));h.runFrame();
    assert.equal(h.contacts.length,1,"legacy creature contact still triggers");
  }
  const h=liveHarness();
  h.removeStatus();h.setShot(rect(180,105,10,10));h.runFrame();
  assert.equal(h.contacts.length,0,"expired mirror sprite cannot intercept");
  h.setShot(rect(215,105,10,10));h.runFrame();
  assert.equal(h.contacts.length,1);
});

test("author's real Barrière lumineuse 30s mirror / scale 2.5 / hold-last survives canonical import",async()=>{
  const p="data/capture/showcase/lib_magic_barrier.capture-skill-transfer-v1.json";
  const raw=await readFile(new URL("../../"+p,import.meta.url));
  assert.equal(raw.length,2824);
  assert.equal(createHash("sha256").update(raw).digest("hex"),"324546d0b687a8422f80da80a44cecf095985ed36f6dd8ee3bd9548244b7b270");
  assert.equal(CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.filter(v=>v===p).length,1);
  const record=importCaptureTransferJsonV1(raw.toString("utf8")).value.draft;
  assert.equal(record.id,"lib_magic_barrier");
  assert.equal(record.definition.effects[0].status.kind,"projectile_mirror");
  assert.equal(record.definition.effects[0].status.durationMs,30000);
  const sprite=record.presentation.statusVisuals["lib_magic_barrier:0"].sprite;
  assert.equal(sprite.displayScale,2.5);
  assert.equal(sprite.opacity,0.7);
  assert.equal(sprite.playbackMode,"hold-last");
  assert.deepEqual(importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(record)).value.draft,record);
});
