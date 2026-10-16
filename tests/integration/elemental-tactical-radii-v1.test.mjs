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
    // These variables tint both waves and persistent zones.
    const selector='.skill-fx--expanding-wave[data-element="'+element+'"] {';
    const start=css.indexOf(selector);
    assert.ok(start>=0,"wave/zone selector for "+element);
    const rules=css.slice(start,css.indexOf("}",start)).split("\n");
    for(const [property,alpha] of [
      ["--tactical-edge","0.52"],["--tactical-halo","0.14"],
      ["--tactical-inner","0.18"],["--tactical-fill","0.012"]
    ]){
      const line=rules.find(line=>line.includes(property+":"));
      assert.ok(line,property+" missing in "+element);
      assert.ok(line.trim().endsWith(", "+alpha+");"),property+" is too bright for "+element+": "+line);
    }
  }
  // The fallback for unknown elements must be subdued as well.
  for(const [property,alpha] of [
    ["--tactical-edge","0.52"],["--tactical-halo","0.12"],
    ["--tactical-inner","0.16"],["--tactical-fill","0.012"]
  ]){
    assert.ok(css.includes(property+", rgba(245, 225, 185, "+alpha+")"),property+" neutral opacity");
  }
  assert.ok(css.includes("border: 1.5px solid var(--tactical-edge"),"stroke width preserved");
  assert.ok(css.includes("pointer-events: none"),"marker remains inert");
});

test("fire persistent-zone ring alone is low-contrast; validated expanding wave retains its existing art",()=>{
  const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  const marker='.skill-fx--tactical-zone[data-element="fire"] {';
  const pos=css.indexOf(marker);
  assert.ok(pos>=0,"isolated persistent fire ring rule");
  const rule=css.slice(pos,css.indexOf("}",pos));
  for(const line of ["opacity: 0.28;","border-width: 1px;","box-shadow: none;","background: transparent;"]){
    assert.ok(rule.includes(line),"subdued fire-zone ring: "+line);
  }
  // The shared palette must not be rewritten, because expanding wave was
  // explicitly approved by the user.
  const shared=css.slice(css.indexOf('.skill-fx--expanding-wave[data-element="fire"] {'));
  const colorRules=shared.slice(0,shared.indexOf("}"));
  assert.ok(colorRules.includes("--tactical-edge: rgba(255, 91, 64, 0.52);"));
  assert.ok(colorRules.includes("--tactical-halo: rgba(255, 50, 44, 0.14);"));
  const html=readFileSync(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
  assert.ok(html.includes('href="./demo.css?v=fire-zone-subtle-20261016"'),"mobile editor must request new CSS URL");
});

test("Firestorm ground ring alone has a barely visible stroke, with expanding bubble protected",()=>{
  const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  const base='.skill-fx--expanding-wave[data-element="fire"] {';
  assert.ok(css.includes(base),"existing common fire element palette preserved");
  const section=css.slice(css.indexOf(base),css.indexOf("}",css.indexOf(base)));
  assert.ok(section.includes("--tactical-edge: rgba(255, 91, 64, 0.52);"),
    "the approved expanding bubble must keep its original 52% edge");
  const override='.skill-fx--tactical-zone[data-element="fire"] {';
  const at=css.indexOf(override);
  assert.ok(at>=0,"only persistent ground fire-zone has a separate subtle style");
  const rules=css.slice(at,css.indexOf("}",at));
  assert.ok(rules.includes("--tactical-edge: rgba(255, 91, 64, 0.18);"),"fire zone ring must become faint");
  assert.ok(rules.includes("--tactical-halo: rgba(255, 50, 44, 0);"),"no distracting glow");
  assert.ok(rules.includes("--tactical-fill: transparent;"),"no overlay tint over the flames");
  assert.ok(rules.includes("border-width: 1px;"),"reduce only ground zone line width");
  assert.ok(!override.includes("expanding-wave"),"do not touch the growing bubble");
});
