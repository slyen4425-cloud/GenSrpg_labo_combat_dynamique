import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeCreaturePresentationBinding } from "../../src/contracts/creature-presentation-binding.js";
import { buildHumanCreatureDraftV3, captureEditorAssetMatchesRoleV1 } from "../../src/ui/capture-editor-human-v2.js";
import { adaptCaptureExportToNativeVisualSourceV1 } from "../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js";
import { createCombatResolutionPresenter } from "../../src/adapters/renderer/combat-resolution-presenter.js";
import { createDomCreatureMovementVisualV1 } from "../../src/adapters/renderer/dom-creature-movement-visual-v1.js";
import { creatureRangedAppearanceForViewV1 } from "../../src/ui/demo-app.js";

const motion = {
  assetId:"pack:test:shoot", mode:"sprite", displayScale:1.25, rotationTurns:0, frameCount:12, transitionMs:80
};
function binding(version=5) {
  return {
    id:"creature:shooter",version,subjectType:"creature",subjectId:"shooter",
    profileId:"quadruped",displayScale:1,position:{x:0,y:0},
    transformOrigin:{x:"50%",y:"50%"},
    visual:{
      front:{assetId:"pack:test:front"},back:null,icon:null,
      movement:{assetId:"pack:test:roll",mode:"roll",displayScale:.8,rotationTurns:3,frameCount:1,transitionMs:80},
      ...(version===5?{rangedAttack:motion}:{})
    },sockets:[],audio:{}
  };
}
test("V5 uses the same validated animation parameters without altering V4 movement",()=>{
  const v5=normalizeCreaturePresentationBinding(binding());
  assert.equal(v5.version,5);
  assert.deepEqual(v5.visual.rangedAttack,motion);
  assert.equal(v5.visual.movement.mode,"roll");
  assert.deepEqual(normalizeCreaturePresentationBinding(v5),v5);
  const v4=normalizeCreaturePresentationBinding(binding(4));
  assert.equal(v4.version,4);
  assert.equal(v4.visual.rangedAttack,undefined);
  for(const invalid of [{assetId:"unstable"},{frameCount:0},{displayScale:0},{mode:"teleport"},{transitionMs:600}]){
    assert.throws(()=>normalizeCreaturePresentationBinding({...binding(),visual:{
      ...binding().visual,rangedAttack:{...motion,...invalid}
    }}));
  }
  assert.throws(()=>normalizeCreaturePresentationBinding({...binding(),visual:{...binding().visual,unknownFx:"x"}}));
});
function creatureFields(){
  return {id:"shooter",displayName:"Tireur",description:"Test",level:10,
    sourceStats:{force:1,agility:1,intelligence:1,spirit:1,endurance:1,initiative:1},
    elements:[],resistances:{},capture:{capturable:true,captureRate:10,spawnChance:10,spawnTags:[],evolution:null},
    combat:{maxHp:100,maxEnergy:10,initialEnergy:0,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0},
    linkedSkillIds:[],profileId:"quadruped",displayScale:1,
    visual:{frontAssetId:"pack:test:front",backAssetId:"",iconAssetId:"",
      movementAssetId:"pack:test:roll",movementMode:"roll",movementDisplayScale:.8,movementRotationTurns:3,
      movementFrameCount:1,movementTransitionMs:80},
    sockets:[],audio:{}
  };
}
test("human author draft stores V5 ranged pose and existing movement without touching combat values",()=>{
  const base=buildHumanCreatureDraftV3(creatureFields());
  assert.equal(base.presentation.version,4);
  const changed=buildHumanCreatureDraftV3({...creatureFields(),visual:{...creatureFields().visual,
    rangedAttackAssetId:motion.assetId,rangedAttackMode:"sprite",
    rangedAttackDisplayScale:1.25,rangedAttackRotationTurns:0,
    rangedAttackFrameCount:12,rangedAttackTransitionMs:80}});
  assert.equal(changed.presentation.version,5);
  assert.deepEqual(changed.presentation.visual.rangedAttack,motion);
  assert.deepEqual(changed.presentation.visual.movement,base.presentation.visual.movement);
  assert.deepEqual(changed.combat,base.combat);
  assert.deepEqual(changed.presentation.sockets,base.presentation.sockets);
});
test("Capture adapter connects optional ranged sprites without modifying the projectile definition",()=>{
  const fighter={maxHp:100,initialHp:100,maxEnergy:5,initialEnergy:5,energyChargeAmount:0,energyChargeIntervalMs:1000,movementEnergyPerStep:0,chargeTimeModifierPct:0};
  const exported={
    schema:"capture-combat-export-v1",battle:{id:"ranged",localActorId:"local"},
    teams:{heroes:["local"],foes:["enemy"]},
    actors:[
      {actorId:"local",teamId:"heroes",creatureId:"shooter",displayName:"Tireur",controllerId:"human-local"},
      {actorId:"enemy",teamId:"foes",creatureId:"old",displayName:"Ancien",controllerId:"ai-enemy"}
    ],
    creatures:[
      {id:"shooter",displayName:"Tireur",combat:fighter,skillIds:[],presentationId:"creature:shooter",metadata:{}},
      {id:"old",displayName:"Ancien",combat:fighter,skillIds:[],presentationId:"creature:old",metadata:{}}
    ],
    skills:[],rosters:[],
    presentation:{creatures:{
      "creature:shooter":binding(),
      "creature:old":{id:"creature:old",version:1,subjectType:"creature",subjectId:"old",profileId:"biped",
        visual:{front:{assetId:"pack:test:front"},back:null,icon:null},sockets:[],audio:{}}
    }},metadata:{}
  };
  const source=adaptCaptureExportToNativeVisualSourceV1({
    exported,
    assetCatalog:{assets:[
      {id:"pack:test:front",resource:{file:"front.png"}},
      {id:"pack:test:roll",resource:{file:"roll.png"}},
      {id:"pack:test:shoot",resource:{file:"shoot.png",frameCount:12}}
    ]},
    profiles:[{id:"quadruped",idle:{},attack:{},hit:{},ko:{}},{id:"biped",idle:{},attack:{},hit:{},ko:{}}],
    assetUrlForFile:file=>"https://example.test/"+file
  });
  const shooter=source.creatureMetas.find(x=>x.id==="shooter");
  const old=source.creatureMetas.find(x=>x.id==="old");
  assert.equal(shooter.movementFx.url,"https://example.test/roll.png");
  assert.equal(shooter.rangedAttackFx.url,"https://example.test/shoot.png");
  assert.equal(shooter.rangedAttackFx.frameCount,12);
  assert.equal(shooter.rangedAttackFx.mode,"sprite");
  assert.equal(old.rangedAttackFx,null);
  assert.equal(old.movementFx,null);
});
test("release starts ranged creature pose for projectile and beam, not melee or support",()=>{
  const captured=[];
  const visuals={playEventFor(slot,type,options){captured.push({slot,type,options});return Promise.resolve({status:"finished"})},
    cancelFor(){},playApproachFor(slot,mode){captured.push({slot,type:"approach",mode});return Promise.resolve({status:"finished"})}};
  const p=createCombatResolutionPresenter({visuals});
  for(const form of ["projectile","beam","area"]){
    p.presentRelease({actorSlot:"opponent",targetSlot:"player",
      action:{actionType:"skill",travelMs:400,skill:{id:"shot",form,approachMode:"none",element:"fire"}}});
    assert.equal(captured.at(-1).options.metadata.useRangedAppearance,true);
  }
  p.presentRelease({actorSlot:"opponent",targetSlot:"player",
    action:{actionType:"skill",travelMs:400,skill:{id:"melee",form:"contact",approachMode:"ground",element:null}}});
  assert.equal(captured.at(-1).type,"approach");
  p.presentRelease({actorSlot:"opponent",targetSlot:"player",
    action:{actionType:"skill",travelMs:0,skill:{id:"buff",form:"self",approachMode:"none",element:null}}});
  assert.equal(captured.at(-1).options.metadata.useRangedAppearance,false);
  p.dispose();
});
test("Appearance has five accessible disclosure chapters, with both motion controls together",()=>{
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.css",import.meta.url),"utf8");
  const matches=[...html.matchAll(/data-creature-appearance-group="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(matches,["views","defense","animations","imports","position"]);
  for(const marker of ["data-creature-ranged-attack-appearance","data-creature-ranged-attack-visual",
    "data-creature-ranged-attack-mode","data-creature-ranged-attack-frames",
    "data-creature-ranged-attack-turns","data-creature-ranged-attack-transition"]){
    assert.equal((html.match(new RegExp(marker,"g"))??[]).length,1,marker);
  }
  const group=html.split('data-creature-appearance-group="animations"')[1].split("</details>")[0];
  assert.match(group,/data-creature-movement-visual/);
  assert.match(group,/data-creature-ranged-attack-visual/);
  assert.match(css,/creature-appearance-group > summary:focus-visible/);
  assert.equal(captureEditorAssetMatchesRoleV1({mediaType:"image",assetType:"sprite",category:"movement",resource:{frameCount:12},compatibility:{uses:["editor"]}},"movement"),true);
  assert.equal(captureEditorAssetMatchesRoleV1({mediaType:"image",assetType:"sprite",category:"movement",resource:{frameCount:1},compatibility:{uses:["editor"]}},"movement"),false);
});
function fixture(){
  const listeners=[];
  const doc={createElement(tag){
    if(tag==="canvas")return {width:0,height:0,getContext(){return {drawImage(){}}},toDataURL(){return "data:image/png;base64,AAAA"}};
    const el={ownerDocument:doc,style:{},dataset:{},naturalWidth:100,naturalHeight:100,complete:true,
      children:[],append(child){this.children.push(child)},remove(){this.removed=true},
      animate(frames,options){this.lastAnimation={frames,options};return {finished:Promise.resolve(),cancel(){}}}};
    Object.defineProperty(el,"src",{configurable:true,get(){return this._src||""},set(value){this._src=value;this.onload?.()}});
    return el;
  }};
  const image=doc.createElement("img");
  image.addEventListener=(_type,fn)=>listeners.push(fn);
  Object.defineProperty(image,"src",{get(){return this._src||""},set(value){this._src=value;for(const l of listeners.splice(0))l()}});
  const motionHost={ownerDocument:doc,append(el){this.node=el}};
  const collisionModel={setPresentationScale(){},clear(){},refreshFromImage(){return true}};
  return {image,motionHost,visual:createDomCreatureMovementVisualV1({motion:motionHost,image,collisionModel})};
}
async function flush(){await Promise.resolve();await Promise.resolve();await Promise.resolve()}
test("the same imported image can use one frame for movement and many frames for ranged attacks",async()=>{
  const f=fixture(),normal="https://example.test/normal.png",url="https://example.test/shared.png";
  f.image.src=normal;
  const roll={url,mode:"roll",rotationTurns:3,frameCount:1,displayScale:1,transitionMs:0};
  const shot={url,mode:"sprite",rotationTurns:0,frameCount:12,displayScale:1,transitionMs:0};
  f.visual.prepare(roll,normal,shot);
  const a=f.visual.play(shot,600,1);
  await flush();
  assert.equal(f.image.src,"data:image/png;base64,AAAA","ranged uses cropped first frame as collision silhouette");
  a.cancel();
  const b=f.visual.play(roll,600,1);
  await flush();
  assert.equal(f.image.src,url,"movement uses the full single PNG when its frame count is one");
  b.cancel();f.visual.dispose();
});

test("one preloaded shell swaps safely between shot sprite and rolling image",async()=>{
  const f=fixture(),normal="https://example.test/normal.png";
  f.image.src=normal;
  const move={url:"https://example.test/ball.png",mode:"roll",rotationTurns:3,frameCount:1,displayScale:.9,transitionMs:80};
  const shot={url:"https://example.test/shoot.png",mode:"sprite",rotationTurns:0,frameCount:12,displayScale:1.1,transitionMs:80};
  f.visual.prepare(move,normal,shot);
  const a=f.visual.play(shot,600,1);
  await flush();
  assert.equal(f.image.src,"data:image/png;base64,AAAA");
  assert.equal(f.motionHost.node.children[0].style.animationName,"skill-fx-strip");
  assert.equal(f.visual.tintTarget().host,f.motionHost.node);
  a.cancel();
  assert.equal(f.image.src,normal);
  const b=f.visual.play(move,900,1);
  await flush();
  assert.equal(f.image.src,move.url);
  b.cancel();
  assert.equal(f.image.src,normal);
  f.visual.dispose();
});


test("V6 stores distinct FACE/DOS ranged poses; V1-V5 contracts stay untouched", () => {
  const legacy = normalizeCreaturePresentationBinding(binding());
  assert.equal(legacy.version, 5);
  assert.equal(legacy.visual.rangedAttackBack, undefined);
  const back = { ...motion, assetId: "pack:test:shoot-back" };
  const upgraded = normalizeCreaturePresentationBinding({
    ...binding(), version: 6,
    visual: { ...binding().visual, rangedAttackBack: back }
  });
  assert.equal(upgraded.version, 6);
  assert.deepEqual(upgraded.visual.rangedAttack, motion);
  assert.deepEqual(upgraded.visual.rangedAttackBack, back);
  assert.deepEqual(normalizeCreaturePresentationBinding(upgraded), upgraded);
  assert.deepEqual(legacy, normalizeCreaturePresentationBinding(binding()));
  // Optional front: author can supply only a back view without fabricating a front.
  const backOnly = normalizeCreaturePresentationBinding({
    ...binding(4), version: 6,
    visual: { ...binding(4).visual, rangedAttackBack: back }
  });
  assert.equal(backOnly.visual.rangedAttack, undefined);
  assert.equal(backOnly.visual.rangedAttackBack.assetId, "pack:test:shoot-back");
  for (const invalid of [{ assetId: "bad" }, { frameCount: 0 }, { mode: "teleport" }, { displayScale: 0 }]) {
    assert.throws(() => normalizeCreaturePresentationBinding({
      ...upgraded, visual: {
        ...upgraded.visual, rangedAttackBack: { ...back, ...invalid }
      }
    }));
  }
  assert.throws(() => normalizeCreaturePresentationBinding({
    ...legacy, visual: { ...legacy.visual, rangedAttackBack: back }
  }), /unknown field/);
});

test("author saves front and back independently, keeps the original combat and V5 fallback", () => {
  const fields = creatureFields();
  const original = buildHumanCreatureDraftV3(fields);
  const settings = {
    rangedAttackMode: "sprite",
    rangedAttackDisplayScale: 1.25,
    rangedAttackRotationTurns: 0,
    rangedAttackFrameCount: 12,
    rangedAttackTransitionMs: 80
  };
  const v5 = buildHumanCreatureDraftV3({
    ...fields, visual: { ...fields.visual, ...settings, rangedAttackAssetId: "pack:test:shoot" }
  });
  assert.equal(v5.presentation.version, 5);
  assert.equal(v5.presentation.visual.rangedAttackBack, undefined);
  const both = buildHumanCreatureDraftV3({
    ...fields, visual: { ...fields.visual, ...settings,
      rangedAttackAssetId: "pack:test:shoot",
      rangedAttackBackAssetId: "pack:test:shoot-back"
    }
  });
  assert.equal(both.presentation.version, 6);
  assert.equal(both.presentation.visual.rangedAttack.assetId, "pack:test:shoot");
  assert.equal(both.presentation.visual.rangedAttackBack.assetId, "pack:test:shoot-back");
  assert.deepEqual(both.presentation.visual.movement, original.presentation.visual.movement);
  assert.deepEqual(both.combat, original.combat);
  assert.deepEqual(both.presentation.sockets, original.presentation.sockets);
  const onlyBack = buildHumanCreatureDraftV3({
    ...fields, visual: { ...fields.visual, ...settings,
      rangedAttackBackAssetId: "pack:test:shoot-back"
    }
  });
  assert.equal(onlyBack.presentation.version, 6);
  assert.equal(onlyBack.presentation.visual.rangedAttack, undefined);
  assert.equal(onlyBack.presentation.visual.rangedAttackBack.assetId, "pack:test:shoot-back");
});

test("native Capture export resolves both assets and the actual slot camera selects the right one", () => {
  const front = motion;
  const back = { ...motion, assetId: "pack:test:shoot-back" };
  const presentation = normalizeCreaturePresentationBinding({
    ...binding(), version: 6,
    visual: { ...binding().visual, rangedAttack: front, rangedAttackBack: back }
  });
  const fighter = { maxHp: 100, initialHp: 100, maxEnergy: 5, initialEnergy: 5,
    energyChargeAmount: 0, energyChargeIntervalMs: 1000,
    movementEnergyPerStep: 0, chargeTimeModifierPct: 0 };
  const exported = {
    schema: "capture-combat-export-v1", battle: { id: "dual-ranged", localActorId: "local" },
    teams: { heroes: ["local"], foes: ["enemy"] },
    actors: [
      { actorId: "local", teamId: "heroes", creatureId: "shooter", displayName: "Tireur", controllerId: "human-local" },
      { actorId: "enemy", teamId: "foes", creatureId: "old", displayName: "Ancien", controllerId: "ai-enemy" }
    ],
    creatures: [
      { id: "shooter", displayName: "Tireur", combat: fighter, skillIds: [],
        presentationId: "creature:shooter", metadata: {} },
      { id: "old", displayName: "Ancien", combat: fighter, skillIds: [],
        presentationId: "creature:old", metadata: {} }
    ],
    skills: [], rosters: [],
    presentation: { creatures: {
      "creature:shooter": presentation,
      "creature:old": {
        id: "creature:old", version: 1, subjectType: "creature",
        subjectId: "old", profileId: "biped",
        visual: { front: { assetId: "pack:test:front" }, back: null, icon: null },
        sockets: [], audio: {}
      }
    } }, metadata: {}
  };
  const catalog = { assets: [
    { id: "pack:test:front", resource: { file: "front.png" } },
    { id: "pack:test:roll", resource: { file: "roll.png" } },
    { id: "pack:test:shoot", resource: { file: "face.png", frameCount: 12 } },
    { id: "pack:test:shoot-back", resource: { file: "dos.png", frameCount: 20 } }
  ] };
  const build = () => adaptCaptureExportToNativeVisualSourceV1({
    exported, assetCatalog: catalog,
    profiles: [{ id: "quadruped", idle: {}, attack: {}, hit: {}, ko: {} },
      { id: "biped", idle: {}, attack: {}, hit: {}, ko: {} }],
    assetUrlForFile: file => "https://example.test/" + file
  });
  const metas = build().creatureMetas;
  const shooter = metas.find(x => x.id === "shooter");
  const old = metas.find(x => x.id === "old");
  assert.equal(shooter.rangedAttackFx.assetId, "pack:test:shoot");
  assert.equal(shooter.rangedAttackBackFx.assetId, "pack:test:shoot-back");
  assert.equal(creatureRangedAppearanceForViewV1(shooter, "player").url, "https://example.test/dos.png");
  assert.equal(creatureRangedAppearanceForViewV1(shooter, "opponent").url, "https://example.test/face.png");
  assert.equal(shooter.rangedAttackFx.frameCount, 12);
  assert.equal(shooter.rangedAttackBackFx.frameCount, 20);
  assert.equal(old.rangedAttackFx, null);
  assert.equal(creatureRangedAppearanceForViewV1(old, "player"), null);
  exported.presentation.creatures["creature:shooter"] = binding();
  const legacy = build().creatureMetas.find(x => x.id === "shooter");
  assert.equal(legacy.rangedAttackBackFx, null);
  assert.equal(creatureRangedAppearanceForViewV1(legacy, "player").url, "https://example.test/face.png");
  assert.equal(creatureRangedAppearanceForViewV1(legacy, "opponent").url, "https://example.test/face.png");
  assert.throws(() => creatureRangedAppearanceForViewV1(shooter, "side"), /unknown creature view/);
});

test("the two new selectors share the attack-only asset catalog, remain inside Animations", () => {
  const html = readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html", import.meta.url), "utf8");
  const fragment = html.split('data-creature-appearance-group="animations"')[1].split("</details>")[0];
  assert.match(fragment, /data-creature-ranged-attack-visual data-asset-role="attack"/);
  assert.match(fragment, /data-creature-ranged-attack-back-visual data-asset-role="attack"/);
  assert.equal((html.match(/data-creature-ranged-attack-back-visual/g) ?? []).length, 1);
  assert.match(fragment, /FACE \(adversaire\)/);
  assert.match(fragment, /DOS \(joueur\)/);
  const js = readFileSync(new URL("../../src/ui/capture-editor-human-v2.js", import.meta.url), "utf8");
  for (const marker of ["rangedAttackBackAssetId", "data-creature-ranged-attack-back-visual"]) {
    assert.match(js, new RegExp(marker));
  }
  const badFx = { category: "travel", assetType: "sprite", mediaType: "image", compatibility: { uses: ["editor"] } };
  assert.equal(captureEditorAssetMatchesRoleV1(badFx, "attack"), false);
});
