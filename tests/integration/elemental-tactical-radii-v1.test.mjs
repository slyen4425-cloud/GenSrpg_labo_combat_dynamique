import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";

const rect=(left,top,width,height)=>({left,top,width,height});
function fixture(){
  const doc={createElement(){
    const node={style:{},dataset:{},className:"",children:[],append(...n){this.children.push(...n);},
      remove(){this.removed=true;},getBoundingClientRect(){return rect(0,0,120,120);}};
    node.ownerDocument=doc;return node;
  }};
  const arena={ownerDocument:doc,nodes:[],append(n){this.nodes.push(n);},
    getBoundingClientRect(){return rect(0,0,720,405);}};
  const anchor={getBoundingClientRect(){return rect(200,240,30,30);}};
  const fx=createDomSkillFxRenderer({arena,anchors:{player:anchor,opponent:anchor},
    targetAnchors:{player:anchor,opponent:anchor},
    presentationForSkill:()=>({travel:{url:"https://example.test/wave.webp",assetId:"wave",frameCount:1},
      persistentZone:{url:"https://example.test/zone.webp",assetId:"zone",frameCount:1,displayScale:1}}),
    animate:()=>({finished:new Promise(()=>{}),cancel(){}})});
  return {arena,fx};
}
const zone=(element,radius="short")=>({id:"z",sourceActorId:"player",skillId:"s",radius,skillElement:element,
  appliedAtMs:0,expiresAtMs:15000,durationMs:15000});
test("the unique native persistent-zone element colors the existing tactical marker on every reinforcement, no sprite mutation",()=>{
  const scene=fixture();
  for(const [el,radius] of [["fire","short"],["ice","medium"],["nature","long"],["shadow","short"],[null,"medium"]]){
    scene.fx.syncPersistentZones([zone(el,radius)]);
    const sprite=scene.arena.nodes.find(n=>n.dataset.skillFx==="persistent-zone");
    const marker=scene.arena.nodes.find(n=>n.dataset.tacticalRadius==="persistent-zone");
    assert.ok(marker && sprite);
    assert.equal(marker.dataset.element,el??"");
    assert.equal(sprite.dataset.element,undefined);
    assert.equal(sprite.dataset.zoneRadius,radius);
  }
  scene.fx.syncPersistentZones([]);
  assert.ok(scene.arena.nodes.filter(n=>n.dataset.tacticalRadius==="persistent-zone").every(n=>n.removed));
  scene.fx.dispose();
});
test("expanding wave inherits the existing author element, not a second derived one",()=>{
  const scene=fixture();
  const action={skill:{id:"s",form:"projectile",element:"electric",projectileTargeting:"expanding_wave",
    expandingWave:{startRadiusPct:8,endRadiusPct:65,thicknessPct:8}},travelMs:1500};
  const plans=planSkillReleaseFx({action,actorSlot:"player",targetSlot:"opponent"});
  scene.fx.play(plans[0]);
  const shell=scene.arena.nodes.find(n=>n.dataset.waveMode==="expanding_wave");
  assert.equal(shell.dataset.element,"electric");
  assert.ok(shell.children.some(n=>n.className==="skill-fx__tactical-radius"));
  scene.fx.dispose();
});
test("elemental CSS defines a readable outline for each author element without altering the geometry",()=>{
  const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  for(const element of ["fire","water","ice","nature","electric","earth","air","poison","light","shadow","steel","psy","spirit"])
    assert.ok(css.includes('.skill-fx--tactical-zone[data-element="'+element+'"]'),element);
  assert.match(css,/--tactical-edge/);
  assert.match(css,/\.skill-fx--tactical-zone::after\s*\{\s*display:\s*none/);
});

test("tactical element palette is deliberately translucent without changing authored RGB colors",()=>{
  const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  const elements=["fire","water","ice","nature","electric","earth","air","poison","light","shadow","steel","psy","spirit"];
  for(const element of elements){
    // The same CSS custom properties tint waves and persistent zones.
    const selector='.skill-fx--expanding-wave[data-element="'+element+'"] {';
    const start=css.indexOf(selector);
    assert.ok(start>=0,"wave/zone selector for "+element);
    const rules=css.slice(start,css.indexOf("}",start));
    for(const [property,alpha] of [
      ["--tactical-edge","0.52"],["--tactical-halo","0.14"],
      ["--tactical-inner","0.18"],["--tactical-fill","0.012"]
    ]){
      const match=rules.match(new RegExp(property+":\\\\s*rgba\\\\([^)]*,\\\\s*([0-9.]+)\\\\)"));
      assert.ok(match,property+" missing in "+element);
      assert.equal(match[1],alpha,property+" is too bright for "+element);
    }
  }
  // The neutral palette must also respect the same subdued defaults.
  assert.match(css,/--tactical-edge, rgba\\(245, 225, 185, 0\\.52\\)/);
  assert.match(css,/--tactical-halo, rgba\\(245, 225, 185, 0\\.12\\)/);
  assert.match(css,/--tactical-inner, rgba\\(245, 225, 185, 0\\.16\\)/);
  assert.match(css,/--tactical-fill, rgba\\(245, 225, 185, 0\\.012\\)/);
  // Size, hitbox and renderer are out of scope. Preserve a thin,
  // non-interactive, independent overlay.
  assert.match(css,/border: 1\\.5px solid var\\(--tactical-edge/);
  assert.match(css,/pointer-events: none/);
});
