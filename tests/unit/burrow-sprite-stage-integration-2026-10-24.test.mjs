import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname,resolve} from "node:path";
import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {builtInBurrowSpriteAssetV1,defaultBurrowSpritesV1} from "../../src/assets/burrow-terrain-builtins-v1.js";
import {burrowBindingFromFieldsV1,burrowEditorFieldsFromVisualV1} from "../../src/ui/capture-burrow-stage-fields-v1.js";
import {playDomBurrowTerrainFxV2} from "../../src/adapters/renderer/dom-burrow-terrain-fx-v2.js";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../..");
const rootDir=resolve(root,"assets/library/capture/sprites/skills/burrow_terrain");
const stages=["start","travel","impact"];

test("sixty physical transparent sprite PNGs and three real WebP atlases published",()=>{
 const manifest=JSON.parse(readFileSync(resolve(rootDir,"manifest.json"),"utf8"));
 for(const stage of stages){
   const cfg=manifest.stages[stage];
   assert.equal(cfg.frameCount,20);
   const frameDir=resolve(rootDir,stage,"frames");
   assert.equal(readdirSync(frameDir).filter(p=>p.endsWith(".png")).length,20);
   const atlas=readFileSync(resolve(rootDir,cfg.file));
   assert.equal(atlas.toString("ascii",0,4),"RIFF");
   assert.equal(atlas.toString("ascii",8,12),"WEBP");
   for(let i=1;i<=20;i++){
     const p=resolve(frameDir,"sprite_burrow_"+stage+"_"+String(i).padStart(2,"0")+".png");
     const png=readFileSync(p);
     assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
     assert.equal(png.readUInt32BE(16),512);
     assert.equal(png.readUInt32BE(20),512);
     assert.equal(png[25],6);
   }
 }
});

test("V13 preserves 3 distinct burrow stage controls through the normalized presentation",()=>{
 const config=burrowBindingFromFieldsV1({
   burrowTerrainConfig:{
     start:{assetId:"burrow:start",scale:1.2,offsetX:12,offsetY:-6,frameMs:60},
     travel:{assetId:"burrow:travel",scale:.9,offsetX:0,offsetY:8,frameMs:45},
     impact:{assetId:"",scale:1,offsetX:0,offsetY:0,frameMs:70}
   }
 });
 const raw={version:13,baseVersion:2,id:"skill:test-burrow",subjectType:"skill",subjectId:"test-burrow",visual:{burrowTerrain:config},audio:{}};
 const norm=normalizeSkillPresentationBinding(raw);
 assert.equal(norm.version,13);
 assert.equal(norm.visual.burrowTerrain.start.scale,1.2);
 assert.equal(norm.visual.burrowTerrain.travel.frameMs,45);
 assert.equal(norm.visual.burrowTerrain.impact,null);
 assert.deepEqual(burrowEditorFieldsFromVisualV1(norm.visual).burrowTerrainConfig.start,
   {assetId:"burrow:start",scale:1.2,offsetX:12,offsetY:-6,frameMs:60});
 const skill=createCaptureSkillPresentationAssetsV2({
   skillPresentations:{"test-burrow":raw},
   assetForId:()=>null
 }).presentationForSkill("test-burrow");
 assert.equal(skill.burrowTerrain.start.frameCount,20);
 assert.equal(skill.burrowTerrain.travel.offsetY,8);
 assert.equal(skill.burrowTerrain.impact,null);
 assert.match(builtInBurrowSpriteAssetV1("burrow:start").url,/burrow_terrain\/start\/sprite_burrow_start_atlas\.webp/);
});

function fakeArena(){
 const nodes=[],animations=[];
 const arena={ownerDocument:{
   createElement(){const n={style:{},dataset:{},className:"",setAttribute(){},
     animate(frames,options){const a={frames,options,cancelled:false,cancel(){this.cancelled=true;}};animations.push(a);return a;},
     remove(){this.removed=true;}};nodes.push(n);return n;}
 },append(){}};
 return {arena,nodes,animations};
}
test("runtime renders three stage sprites and cancels all animations, no procedural CSS fallback",()=>{
 const {arena,nodes,animations}=fakeArena();
 const fx=playDomBurrowTerrainFxV2({
   arena,from:{x:50,y:65},to:{x:470,y:170},travelMs:850,
   sprites:defaultBurrowSpritesV1()
 });
 assert.equal(fx.status,"playing");
 assert.deepEqual(nodes.map(n=>n.dataset.burrowFx),
   ["sprite-start","sprite-travel","sprite-impact"]);
 assert.equal(animations.filter(a=>a.options.iterations===undefined).length,3);
 fx.cancel();fx.cancel();
 assert.ok(nodes.every(n=>n.removed));
 assert.ok(animations.every(a=>a.cancelled));
});
test("empty sprite selection can disable individual stages",()=>{
 const {arena,nodes}=fakeArena();
 const sprites={...defaultBurrowSpritesV1(),travel:null};
 const fx=playDomBurrowTerrainFxV2({
  arena,from:{x:0,y:0},to:{x:300,y:0},travelMs:800,sprites
 });
 assert.deepEqual(nodes.map(n=>n.dataset.burrowFx),["sprite-start","sprite-impact"]);
 fx.cancel();
});
