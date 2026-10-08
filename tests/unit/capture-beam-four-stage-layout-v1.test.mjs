import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mountCaptureBeamStageLayoutV1 } from "../../src/ui/capture-editor-beam-stage-layout-v1.js";

class Node {
  constructor(name, document) {
    this.name=name;
    this.ownerDocument=document;
    this.children=[];
    this.parentNode=null;
    this.hidden=false;
    this.dataset={};
    this.value="";
  }
  append(child) { if(child.parentNode) child.parentNode.removeChild(child); this.children.push(child); child.parentNode=this; }
  insertBefore(child, next) {
    if(child.parentNode) child.parentNode.removeChild(child);
    const i=next==null?-1:this.children.indexOf(next);
    if(next!=null && i<0)throw Error("Missing reference");
    this.children.splice(i<0?this.children.length:i,0,child);child.parentNode=this;
  }
  removeChild(child){const i=this.children.indexOf(child);if(i<0)throw Error("Missing child");this.children.splice(i,1);child.parentNode=null;}
  remove(){this.parentNode?.removeChild(this);}
  get nextSibling(){if(!this.parentNode)return null;return this.parentNode.children[this.parentNode.children.indexOf(this)+1]??null;}
  closest(sel){return sel==="label"?this.parentNode:null;}
}
const config=[
  ["[data-skill-socket]","start"],
  ["[data-skill-cast-fx]","start"],["[data-skill-cast-scale]","start"],["[data-skill-cast-playback]","start"],
  ["[data-skill-beam-start-fx]","start"],["[data-skill-beam-start-scale]","start"],["[data-skill-cast-audio]","start"],
  ["[data-skill-travel-fx]","body"],["[data-skill-travel-scale]","body"],["[data-skill-travel-playback]","body"],["[data-skill-travel-audio]","body"],
  ["[data-skill-impact-fx]","impact"],["[data-skill-impact-scale]","impact"],["[data-skill-impact-duration]","impact"],["[data-skill-impact-audio]","impact"]
];

function testFixture(){
 const doc={createComment(label){return new Node(label,doc);}};
 const advanced=new Node("advanced",doc);
 const audio=new Node("audio",doc);
 const host=new Node("beam-host",doc);
 const form=new Node("style",doc);form.value="projectile";
 const selectors={"[data-skill-beam-stage-editor]":host,"[data-skill-form]":form};
 const stages={};
 for(const step of ["start","body","impact"]){const stage=new Node(step,doc);host.append(stage);stages[step]=stage;selectors[`[data-beam-stage-fields="${step}"]`]=stage;}
 const labels={};
 for(const [selector] of config){const label=new Node("label "+selector,doc);const input=new Node("input "+selector,doc);label.append(input);(selector.includes("-audio]")?audio:advanced).append(label);selectors[selector]=input;labels[selector]=label;}
 const root={ownerDocument:doc,querySelector(selector){return selectors[selector]??null;}};
 return {root,advanced,audio,host,stages,labels,form};
}

test("Rayon editor has one coherent 3-phase card immediately after tactical zone and before movement",async()=>{
 const html=await readFile(new URL("../../examples/dom-demo/capture-editor-v2.html",import.meta.url),"utf8");
 const start=html.indexOf('data-skill-beam-stage-editor');
 const tactical=html.indexOf('data-skill-effects-host');
 const move=html.indexOf('<h2>Mouvement</h2>');
 assert.ok(start>tactical && start<move,"Rayon should be adjacent to tactical zone");
 assert.ok(html.indexOf('data-skill-beam-pack')>tactical && html.indexOf('data-skill-beam-pack')<move,"existing pack must be in same card");
 for(const step of ["start","body","impact"]){
   assert.equal(html.split(`data-beam-stage-fields="${step}"`).length-1,1);
 }
 for(const [sel] of config){assert.equal(html.split(sel.slice(1,-1)).length-1,1,sel+" must remain ONE canonical control");}
});

test("switching Rayon / Projectile reuses the same 15 canonical visual and audio controls, without copying values",()=>{
 const f=testFixture(),originalOrder=[...f.advanced.children],originalAudio=[...f.audio.children];
 const session=mountCaptureBeamStageLayoutV1(f.root);
 assert.deepEqual(f.advanced.children.filter(x=>x.name.startsWith("label ")),originalOrder);
 f.form.value="beam";
 session.sync();
 for(const [selector,stage] of config){
   assert.equal(f.labels[selector].parentNode,f.stages[stage]);
 }
 assert.equal(f.stages.start.children.length,7);
 assert.equal(f.stages.body.children.length,4);
 assert.equal(f.stages.impact.children.length,4);
 assert.equal(f.audio.children.filter(x=>x.name.startsWith("label ")).length,0,"audio choices must appear inside beam stages");
 assert.equal(f.advanced.children.filter(x=>x.name.startsWith("label ")).length,0);
 f.root.querySelector("[data-skill-beam-start-fx]").value="pack:capture:test";
 f.root.querySelector("[data-skill-travel-audio]").value="gensrpg:audio:water-travel";
 f.form.value="projectile";session.sync();
 assert.deepEqual(f.advanced.children.filter(x=>x.name.startsWith("label ")),originalOrder);
 assert.deepEqual(f.audio.children.filter(x=>x.name.startsWith("label ")),originalAudio);
 assert.equal(f.root.querySelector("[data-skill-beam-start-fx]").value,"pack:capture:test");
 assert.equal(f.root.querySelector("[data-skill-travel-audio]").value,"gensrpg:audio:water-travel");
 session.dispose();
 assert.deepEqual(f.advanced.children,originalOrder);
 assert.deepEqual(f.audio.children,originalAudio);
});
