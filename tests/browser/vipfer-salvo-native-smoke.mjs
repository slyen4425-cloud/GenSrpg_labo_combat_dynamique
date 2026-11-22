// Browser smoke: three REAL Vipfer projectile flights in 1v1 and 2v2 through native Combat Runtime.
// Actual DOM opaque-model collisions feed the per-shot Combat Runtime, never a test damage owner.
// No fabricated contact callbacks or media validation claims; test-only SVG projectile fixture.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

const root=process.cwd();
const html=`<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/examples/dom-demo/demo.css">
<style>
body { background:#202020; color:white; }
.test-arena { position:relative; width:650px; height:320px; margin:20px; }
.fighter { position:absolute; width:64px; height:64px; background:#aaa; border-radius:15px; }
</style></head><body data-vipfer-salvo-browser="pending">
<script>window.addEventListener("error",event=>document.body.dataset.vipferSalvoBrowser="fail:page:"+event.message);
window.addEventListener("unhandledrejection",event=>document.body.dataset.vipferSalvoBrowser="fail:promise:"+String(event.reason));</script>
<script type="module">
import {normalizeCaptureSkillTransferV1} from "/src/contracts/capture-skill-transfer-v1.js";
import {normalizeBattleFormatDefinition} from "/src/contracts/battle-format-definition.js";
import {createCombatSession} from "/src/core/combat/combat-session.js";
import {createCombatRuntime} from "/src/core/combat/combat-runtime.js";
import {createDomSkillFxRenderer} from "/src/adapters/renderer/dom-skill-fx.js";
import {planSkillReleaseFx} from "/src/core/fx/skill-fx-plan.js";
const check=(value,message)=>{if(!value)throw Error(message)};
const transfer=await (await fetch("/data/capture/showcase/vipfer-couronne-eclats.capture-skill-transfer-v1.json")).json();
const skill=normalizeCaptureSkillTransferV1(transfer).draft.definition;
check(skill.salvo.shots===3 && skill.effects[0].amount===12,"canonical Vipfer author skill");
const icon='data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2232%22%20height%3D%2232%22%3E%3Ccircle%20cx%3D%2216%22%20cy%3D%2216%22%20r%3D%2212%22%20fill%3D%22%23b5c6cf%22/%3E%3C/svg%3E';
const fighter=id=>({id,maxHp:300,initialHp:300,maxEnergy:50,initialEnergy:50,energyChargeAmount:0,energyChargeIntervalMs:2000});
async function scenario(two){
 const ids=two?["player","ally","opponent","opponent-b"]:["player","opponent"];
 const format=normalizeBattleFormatDefinition({id:"vipfer-salvo-"+(two?"2v2":"1v1"),
  localActorId:"player",teams:{p:ids.filter(x=>x==="player"||x==="ally"),
  e:ids.filter(x=>x==="opponent"||x==="opponent-b")},
  actors:ids.map(actorId=>({actorId,teamId:actorId==="player"||actorId==="ally"?"p":"e",
    creatureId:actorId,displayName:actorId,fighterConfigId:actorId,controllerId:"human-local"}))});
 const session=createCombatSession({fighters:ids.map(fighter),...(two?{battleFormat:format}:{}),distance:"medium"});
 const arena=document.createElement("section");arena.className="test-arena";document.body.append(arena);
 const spots={player:[60,140],ally:[60,240],opponent:[355,140],"opponent-b":[455,240]};
 const anchors=Object.fromEntries(ids.map(id=>{const node=document.createElement("div");
  node.className="fighter";node.dataset.actor=id;
  node.style.left=spots[id][0]+"px";node.style.top=spots[id][1]+"px";
  arena.append(node);return [id,node]}));
 const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
 const model=slot=>({snapshot(){const r=anchors[slot].getBoundingClientRect();
  return {mask,origin:{x:r.left,y:r.top},axisX:{x:r.right,y:r.top},axisY:{x:r.left,y:r.bottom}}}});
 let runtime=null,release=null,frames=0;const starts=new WeakMap(),shells=new Set(),contacts=[],contactResults=[],resolutions=[];
 const fx=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,
  presentationForSkill:()=>({travel:{url:icon,assetId:"test-only-steel-disc",frameCount:1,displayScale:1}}),
  targetCollisionModelFor:model,
  requestFrame:callback=>setTimeout(()=>{
    // A Chromium fixture may freeze compositor time. Advance the REAL
    // WebAnimation and read its actual DOM bounds through the native sensor.
    for(const shell of arena.querySelectorAll(".skill-fx--projectile")){
      shells.add(shell);
      const anim=shell.getAnimations()[0];if(!anim)continue;
      if(!starts.has(shell)){
        starts.set(shell,performance.now());
        // Once a collision is reported the alpha-mask watcher intentionally
        // stops polling; an independent browser-compositor completion must
        // still resolve the REAL child WebAnimation's finished promise.
        setTimeout(()=>{
          if(shell.isConnected && !["idle","finished"].includes(anim.playState))anim.finish();
        },560);
      }
      // Virtual-time headless Chromium can freeze compositor completion for
      // paused animations: advance the REAL WebAnimation to its native end.
      // This settles its finished promise; it never fabricates an impact.
      const age=performance.now()-starts.get(shell);
      if(age>=550)anim.finish();
      else if(anim.playState!=="finished"){anim.pause();anim.currentTime=Math.max(0,age);}
    }
    frames++;callback();
  },16),
  cancelFrame:handle=>clearTimeout(handle),
  onProjectileContact(contact){
    contacts.push(contact);
    const result=contact.waveMultiTarget?runtime.reportExpandingWaveTargetContact(contact):runtime.reportActionContact(contact);
    contactResults.push({pass:contact.passIndex,result:result?.outcome,at:session.snapshot().elapsedMs});
    return result;
  }
 });
 runtime=createCombatRuntime({session,tickMs:20,
  onRelease({action}){
   const plan=planSkillReleaseFx({action,actorSlot:"player",targetSlot:action.targetId});
   check(plan.length===1 && plan[0].salvo?.shots===3,"one native salvo release plan");
   release=fx.play(plan[0]);
   check(release.status==="running","live salvo FX");
  },
  onResolved:v=>resolutions.push(v)
 });
 try{
   runtime.start();
   check(runtime.startSkill({actorId:"player",targetId:"opponent",skill}).ok,"native cast");
   await new Promise(resolve=>setTimeout(resolve,3100));
   check(release!==null,"native release happened");
   check(shells.size===3,"three actual independent rendered projectiles: "+shells.size);
   check(contacts.length===3,"three real target sprite collisions, got "+contacts.length+" frames "+frames);
   check(contacts.every(c=>c.waveMultiTarget) &&
     contacts.map(c=>c.passIndex).join(",")==="0,1,2","separate native shot indices");
   check(resolutions.length===3 && resolutions.every(x=>x.outcome==="hit"&&x.waveContact),
     "three authoritative successful hits: "+JSON.stringify({
       contacts:contacts.map(c=>({pass:c.passIndex,entity:c.combatEntityId,position:c.contactPoint})),
       contactResults,
       resolutions:resolutions.map(v=>({outcome:v.outcome,waveContact:v.waveContact,
         events:v.events?.map(e=>e.type),targetId:v.targetId})),
       hp:session.snapshot().fighters.opponent.hp}));
   check(session.snapshot().fighters.opponent.hp===264,"target receives exactly 3x12 damage");
   check(session.snapshot().fighters.player.energy===45,"one energy payment");
   for(const id of ids.filter(id=>id!=="opponent" && id!=="player")){
     check(session.snapshot().fighters[id].hp===300,"other 2v2 actor remains unharmed: "+id);
   }
   check(runtime.hasActiveAction===false,"action ends at natural deadline");
   await release.finished;
   check(fx.activeCount===0,"all salvo child sprite records and collision watchers must be cleaned");
   check(arena.querySelectorAll(".skill-fx--projectile").length===0,"no orphan projectile sprite after the salvo");
   return two?"2v2":"1v1";
 }finally{runtime.dispose();fx.dispose();arena.remove()}
}
try{
 const outcomes=[await scenario(false),await scenario(true)];
 document.body.dataset.vipferSalvoBrowser="pass:"+outcomes.join("+");
}catch(error){document.body.dataset.vipferSalvoBrowser="fail:"+String(error.stack||error)}
</script></body></html>`;
const types={".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(pathname==="/__vipfer_salvo"){
      res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end(html);return;
    }
    const filepath=resolve(root,"."+pathname);
    if(!filepath.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
    const bytes=await readFile(filepath);
    res.writeHead(200,{"Content-Type":types[extname(pathname)]??"application/octet-stream"}).end(bytes);
  }catch(error){res.writeHead(404).end(String(error));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
  const candidates=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean);
  const binary=candidates.find(candidate=>spawnSync("which",[candidate]).status===0);
  if(!binary)throw Error("Chromium required for Vipfer salvo regression");
  const url="http://127.0.0.1:"+server.address().port+"/__vipfer_salvo";
  const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--no-first-run","--virtual-time-budget=12000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
  const stdout=[],stderr=[];
  child.stdout.on("data",x=>stdout.push(x));child.stderr.on("data",x=>stderr.push(x));
  const exitCode=await Promise.race([
    once(child,"close").then(([code])=>code),
    new Promise((_,reject)=>{const timeout=setTimeout(()=>{
      child.kill("SIGKILL");reject(Error("Vipfer salvo Chromium timed out"));
    },50000);timeout.unref();child.once("close",()=>clearTimeout(timeout));})
  ]);
  const document=Buffer.concat(stdout).toString("utf8");
  const result=document.match(/data-vipfer-salvo-browser="([^"]*)"/)?.[1]??"no-outcome";
  if(exitCode!==0||!result.startsWith("pass:")){
    throw Error("Real Vipfer salvo Chromium: "+result+"\n"+Buffer.concat(stderr).toString("utf8").slice(-500));
  }
  console.log("Real Vipfer salvo: DOM + animated shell + Combat Runtime + Session",result);
}finally{server.close();}
