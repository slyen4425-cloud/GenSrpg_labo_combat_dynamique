import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
import {normalizePersistentZoneSpatialV1, visiblePersistentZoneRelationV1} from "../../src/contracts/persistent-zone-spatial-v1.js";

function scene({opacity=0.35, sprite=true}={}) {
  const animations=[];
  const rect=(left,top,width,height)=>({left,top,width,height});
  const doc={createElement(tag){
    const node={tag, className:"",style:{},dataset:{},children:[],
      append(...children){this.children.push(...children);},
      remove(){this.removed=true;},
      getBoundingClientRect(){
        const x=parseFloat(this.style.left)||0,y=parseFloat(this.style.top)||0;
        const width=parseFloat(this.style.width)||192;
        const height=parseFloat(this.style.height)||192;
        return rect(x-width/2,y-height/2,width,height);
      }
    };
    node.ownerDocument=doc;
    return node;
  }};
  const arena={ownerDocument:doc,nodes:[],
    append(node){this.nodes.push(node);},
    getBoundingClientRect(){return rect(0,0,1000,500);}};
  const source=(left,top)=>({getBoundingClientRect(){return rect(left,top,30,30);}});
  const anchors={player:source(100,200),opponent:source(420,200)};
  const travel=sprite?{url:"https://example.test/wave.png",assetId:"test:wave",frameCount:1,opacity}:null;
  const fx=createDomSkillFxRenderer({
    arena,anchors,targetAnchors:anchors,
    presentationForSkill:()=>({
      travel,
      persistentZone:{url:"https://example.test/field.png",assetId:"test:field",
        frameCount:1,displayScale:1.3,displayScaleX:1,displayScaleY:1,
        opacity:0,attachment:"fixed-source"}
    }),
    animate:(node,keyframes,options)=>{
      const anim={node,keyframes,options,finished:new Promise(()=>{}),cancel(){this.cancelled=true;}};
      animations.push(anim);return anim;
    }
  });
  return {fx,arena,animations};
}

const zone=(id,radius)=>({
  id,skillId:"field",sourceActorId:"player",radius,
  appliedAtMs:0,expiresAtMs:15000,durationMs:15000
});

test("wave tactical boundary is inside the authoritative expanding shell and beneath its decorative sprite",()=>{
  for(const opacity of [0,0.35,1]){
    const s=scene({opacity});
    s.fx.play({type:"projectile",skillId:"wave",fromSlot:"player",targetSlot:"opponent",
      durationMs:2500,expandingWave:{startRadiusPct:8,endRadiusPct:65,thicknessPct:8}});
    const shell=s.arena.nodes[0];
    assert.equal(shell.style.width,"1300px");
    const marker=shell.children.find(x=>x.className.includes("skill-fx__tactical-radius"));
    const spriteNode=shell.children.find(x=>x.dataset.assetId==="test:wave");
    assert.ok(marker && spriteNode);
    assert.ok(shell.children.indexOf(marker)<shell.children.indexOf(spriteNode));
    assert.equal(marker.style.inset,undefined,"CSS marker fills the exact native shell");
    assert.ok(Math.abs(parseFloat(marker.children[0].style.inset)-(8/130*100))<0.001);
    const shellAnimation=s.animations.find(a=>a.node===shell);
    const spriteAlpha=s.animations.find(a=>a.node===spriteNode &&
      a.keyframes.some(frame=>frame.opacity!==undefined));
    assert.ok(shellAnimation && spriteAlpha);
    assert.equal(shellAnimation.keyframes[0].opacity,undefined,
      "gameplay radius remains visible even with transparent art");
    assert.equal(spriteAlpha.keyframes[0].opacity,0.4*opacity);
    assert.equal(spriteAlpha.keyframes[1].opacity,opacity);
    s.fx.dispose();
    assert.equal(shell.removed,true);
  }
});

test("persistent ground zone marker shares the native sampled ellipse but never the sprite opacity",()=>{
  const s=scene();
  const area=zone("player:field:one","short");
  s.fx.syncPersistentZones([area]);
  const [spriteNode,marker]=s.arena.nodes;
  assert.ok(marker.className.includes("skill-fx--tactical-zone"));
  assert.ok(spriteNode.className.includes("skill-fx--persistent-zone"));
  assert.equal(marker.style.left,spriteNode.style.left);
  assert.equal(marker.style.top,spriteNode.style.top);
  assert.equal(marker.style.transform,spriteNode.style.transform);
  assert.equal(spriteNode.style.opacity,"0");
  assert.equal(marker.style.opacity,undefined);
  const sample=normalizePersistentZoneSpatialV1(s.fx.sampleZoneSpatialContext([area]));
  assert.deepEqual(sample.zones[0].bounds,(()=>{
    const {left,top,width,height}=spriteNode.getBoundingClientRect();
    return {left,top,width,height};
  })());
  assert.equal(visiblePersistentZoneRelationV1({sample,zoneId:area.id,
    sourceActorId:"player",radius:"short",candidateId:"player"}),true);
  // A native radius reinforcement does not create a second geometry authority.
  s.fx.syncPersistentZones([{...area,radius:"medium"}]);
  assert.equal(marker.style.transform,spriteNode.style.transform);
  s.fx.syncPersistentZones([]);
  assert.equal(marker.removed,true);
  assert.equal(spriteNode.removed,true);
  s.fx.dispose();
});

test("full-battlefield long zones show a subtle arena boundary, not a misleading small circle",()=>{
  const s=scene();
  const area=zone("player:field:long","long");
  s.fx.syncPersistentZones([area]);
  const [spriteNode,marker]=s.arena.nodes;
  assert.match(marker.className,/skill-fx--tactical-full-arena/);
  assert.equal(marker.style.width,"calc(100% - 4px)");
  assert.equal(marker.style.height,"calc(100% - 4px)");
  assert.equal(marker.style.transform,"none");
  assert.notEqual(spriteNode.style.transform,"none");
  s.fx.dispose();
  assert.equal(marker.removed,true);
});

test("tactical styling is noninteractive, faint, and independent from sprite alpha",()=>{
  const css=readFileSync(new URL("../../examples/dom-demo/demo.css",import.meta.url),"utf8");
  assert.match(css,/\.skill-fx__tactical-radius\s*\{/);
  assert.match(css,/\.skill-fx--tactical-zone\s*\{/);
  assert.match(css,/pointer-events:\s*none/);
  assert.match(css,/border:\s*1px solid rgba/);
});
