import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {humanSkillEditorFieldsFromDraftV1, buildHumanSkillDraftV1} from "../../src/ui/capture-editor-human-v2.js";
import {importCaptureTransferJsonV1, exportCaptureSkillTransferJsonV1} from "../../src/adapters/input/capture/capture-entity-transfer-v1.js";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";

const read = relative => readFileSync(new URL(relative, import.meta.url), "utf8");
const author = () => importCaptureTransferJsonV1(read("../../data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json")).value.draft;
const draftAtOpacity = pct => {
  const fields=humanSkillEditorFieldsFromDraftV1(author());
  return buildHumanSkillDraftV1({...fields,form:"projectile",
    presentation:{...fields.presentation,travelOpacityPct:pct,
      travelAssetId:"pack:capture:sprite-fire-bubble-expansion-01",
      travelTrajectoryMode:"expanding_wave",
      waveStartRadiusPct:8,waveEndRadiusPct:65,waveThicknessPct:8}});
};

test("human editor exposes a percentage opacity field for projectile including the expanding wave",()=>{
  const html=read("../../examples/dom-demo/capture-editor-v2.html");
  assert.match(html,/data-skill-travel-opacity-pct/);
  assert.match(html,/Opacité de l’onde/i);
});

test("wave opacity is editable and roundtrips via the one canonical presentation binding",()=>{
  for(const percent of [0,35,100]){
    const edited=draftAtOpacity(percent);
    assert.equal(edited.presentation.visual.travel.opacity,percent/100);
    const restored=importCaptureTransferJsonV1(exportCaptureSkillTransferJsonV1(edited)).value.draft;
    assert.equal(restored.presentation.visual.travel.opacity,percent/100);
    assert.equal(humanSkillEditorFieldsFromDraftV1(restored).presentation.travelOpacityPct,percent);
    assert.equal(restored.definition.projectileTargeting,"expanding_wave");
    assert.deepEqual(restored.definition.expandingWave,{startRadiusPct:8,endRadiusPct:65,thicknessPct:8});
  }
  assert.equal(humanSkillEditorFieldsFromDraftV1(author()).presentation.travelOpacityPct,100);
  assert.throws(()=>draftAtOpacity(101),/Opacité du sprite|0.*100/);
  assert.throws(()=>draftAtOpacity(-1),/Opacité du sprite|0.*100/);
});

function rendererScene(opacity){
  const rect=(left,top,width,height)=>({left,top,width,height});
  const animated=[];
  const doc={createElement(){
    const node={style:{},dataset:{},className:"",children:[],
      append(...items){this.children.push(...items);},
      remove(){this.removed=true;},
      getBoundingClientRect(){return rect(0,0,20,20);}};
    node.ownerDocument=doc;
    return node;
  }};
  const arena={ownerDocument:doc,nodes:[],
    append(node){this.nodes.push(node);},
    getBoundingClientRect(){return rect(0,0,1000,500);}};
  const anchor=(x,y)=>({getBoundingClientRect(){return rect(x,y,20,20);}});
  const anchors={player:anchor(100,200),opponent:anchor(450,200)};
  const fx=createDomSkillFxRenderer({
    arena,anchors,targetAnchors:anchors,
    presentationForSkill:()=>({travel:{url:"https://example.test/fire-wave.webp",assetId:"test:fire-wave",
      frameCount:1,playbackMode:"stretch",opacity}}),
    animate:(node,keyframes,options)=>{
      const task={node,keyframes,options,finished:new Promise(()=>{}),cancel(){}};
      animated.push(task);return task;
    }
  });
  fx.play({type:"projectile",fromSlot:"player",targetSlot:"opponent",skillId:"fire-wave",
    durationMs:2000,expandingWave:{startRadiusPct:8,endRadiusPct:65,thicknessPct:8}});
  return {fx,arena,shell:arena.nodes[0],animated};
}

test("the single animated wave shell respects authored opacity rather than overriding it",()=>{
  for(const opacity of [0,0.35,1]){
    const scene=rendererScene(opacity);
    const shellAnim=scene.animated.find(a=>a.node===scene.shell);
    assert.ok(shellAnim);
    assert.equal(shellAnim.keyframes[0].opacity,0.4*opacity);
    assert.equal(shellAnim.keyframes[1].opacity,opacity);
    assert.equal(scene.shell.style.width,"1300px");
    assert.equal(scene.shell.dataset.waveMode,"expanding_wave");
    scene.fx.dispose();
  }
});
