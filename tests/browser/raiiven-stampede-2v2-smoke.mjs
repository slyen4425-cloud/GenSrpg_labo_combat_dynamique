// Browser smoke: one real animated wave shell in each 2v2 direction.
// All contacts travel through live opaque DOM models -> Combat Runtime -> Session.
// No test-side application of damage, and no fabricated collision callbacks.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

const root=process.cwd();
const html=`<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="/examples/dom-demo/demo.css">
<style>
body { background:#202020; color:white; }
.test-arena { position:relative; width:650px; height:320px; margin:20px; }
.fighter { position:absolute; width:32px; height:32px; background:#bbb; }
</style></head><body data-wave2v2-browser="pending">
<script type="module">
import {normalizeSkillDefinition} from "/src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "/src/contracts/battle-format-definition.js";
import {createCombatSession} from "/src/core/combat/combat-session.js";
import {createCombatRuntime} from "/src/core/combat/combat-runtime.js";
import {createDomSkillFxRenderer} from "/src/adapters/renderer/dom-skill-fx.js";
import {planSkillReleaseFx} from "/src/core/fx/skill-fx-plan.js";
const check=(condition,why)=>{if(!condition)throw Error(why);};
const ids=["player","ally","opponent","opponent-b"];
const format=normalizeBattleFormatDefinition({
 id:"browser-wave-2v2",localActorId:"player",
 teams:{local:["player","ally"],enemy:["opponent","opponent-b"]},
 actors:ids.map(actorId=>({actorId,
  teamId:["player","ally"].includes(actorId)?"local":"enemy",
  creatureId:actorId,displayName:actorId,fighterConfigId:actorId,controllerId:"human-local"}))
});
const skill=normalizeSkillDefinition({
 id:"raiiven-stampede-browser",name:"Cavalcade des damnés",category:"offensive",
 form:"projectile",element:"shadow",projectileTargeting:"stampede",
 stampede:{passes:3,passDurationMs:1800,gapMs:600,cloneCount:5},
 hitPresenceStates:["surface","airborne"],targetRelations:["enemy"],
 allowedDistances:["short","medium","long"],
 energyCost:10,preparationMs:0,travelMs:6600,recoveryMs:200,cooldownMs:0,
 effect:{damage:40,heal:0,tags:[]}
});
function fighter(id){return {id,maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,
  energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0};}
async function scenario(source){
 const enemies=ids.filter(id=>format.teamOf(id)!==format.teamOf(source));
 const session=createCombatSession({battleFormat:format,distance:"short",fighters:ids.map(fighter)});
 const arena=document.createElement("section");arena.className="test-arena";document.body.append(arena);
 const xy={player:[60,145],ally:[115,218],opponent:[245,145],"opponent-b":[390,195]};
 const anchors=Object.fromEntries(ids.map(id=>{
  const element=document.createElement("div");element.className="fighter";
  element.dataset.actor=id;element.style.left=xy[id][0]+"px";element.style.top=xy[id][1]+"px";
  const shadow=document.createElement("span");
  shadow.className="fighter__shadow";
  shadow.dataset.demoShadow="true";
  shadow.style.opacity="0.42";
  element.append(shadow);
  const motion=document.createElement("div");
  motion.className="fighter__motion";
  motion.dataset.demoMotion="true";
  const standing=document.createElement("img");
  standing.src="/assets/test/creatures/braisombre/runtime/braisombre_player.webp";
  standing.className="fighter__image";
  standing.dataset.demoImage="true";
  motion.append(standing);
  element.append(motion);
  arena.append(element);return [id,element];
 }));
 const sourceMotions=Object.fromEntries(ids.map(id=>[id,
   anchors[id].querySelector("[data-demo-motion]")]));
 const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
 const visualModel=slot=>({snapshot(){
  const r=anchors[slot].getBoundingClientRect();
  return {mask,origin:{x:r.left,y:r.top},
   axisX:{x:r.right,y:r.top},axisY:{x:r.left,y:r.bottom}};
 }});
 let runtime=null,releaseShell=null,samples=0,waveStartAt=0,actorMoved=false;
 const contacts=[],resolutions=[];
 const fx=createDomSkillFxRenderer({
   arena,anchors,targetAnchors:anchors,presentationForSkill:()=>null,
   // Chromium virtual time advances JS timers but can freeze compositor
   // animations. Drive the REAL Web Animation's currentTime explicitly;
   // the renderer still samples its browser-computed DOM bounds.
   requestFrame:callback=>setTimeout(()=>{
     const motion=releaseShell?.getAnimations?.()?.[0];
     if(motion){
       motion.pause();
       motion.currentTime=Math.min(6600,Math.max(0,performance.now()-waveStartAt));
     }
     samples++;callback();
     actorMoved ||= !!sourceMotions[source].style.translate &&
       sourceMotions[source].style.translate!=="0px 0px";
   },16),
   cancelFrame:handle=>clearTimeout(handle),
   sourceSpriteFor(slot){return {
     attack:{
       url:"/assets/test/creatures/braisombre/runtime/braisombre_player.webp",
       frameCount:5,playbackMode:"loop",assetId:"test:raiiven-standard-attack-5f",
       displayScale:slot==="player"?1.1:0.85,
       offsetX:slot==="player"?9:-4,
       offsetY:slot==="player"?-20:18
     },
     movement:{
       url:"/assets/test/creatures/braisombre/runtime/braisombre_player.webp",
       frameCount:7,assetId:"test:raiiven-movement-must-not-be-used",
       displayScale:1.8,offsetX:80,offsetY:-90
     }
   };},
   sourceMotionFor:slot=>sourceMotions[slot],
   waveTargetsFor(fromSlot){
     return ids.filter(id=>format.teamOf(id)!==format.teamOf(fromSlot));
   },
   targetCollisionModelFor:visualModel,
   onProjectileContact(contact){
     contacts.push(contact);
     return contact.waveMultiTarget
       ? runtime.reportExpandingWaveTargetContact(contact)
       : runtime.reportActionContact(contact);
   }
 });
 runtime=createCombatRuntime({
   session,tickMs:30,enableExpandingWaveMultiTarget:true,
   onRelease({action}){
     const plan=planSkillReleaseFx({action,actorSlot:source,targetSlot:action.targetId});
     check(plan.length===1,"single wave release plan");
     check(fx.play(plan[0]).status==="running","live animated wave");
     releaseShell=arena.querySelector(".skill-fx--stampede");
     waveStartAt=performance.now();
   },
   onResolved(result){resolutions.push(result);}
 });
 try {
  runtime.start();
  check(runtime.startSkill({actorId:source,targetId:enemies[0],skill}).ok,"started action");
  check(releaseShell?.dataset.stampede==="true","real native stampede shell");
  check(releaseShell.querySelectorAll(".skill-fx--stampede-ghost").length===4,"four copies only; fifth horse is the real sourceMotion");
  check(releaseShell.dataset.stampedeNativeCaster==="true","real actor—not a fake caster—is in herd");
  check(sourceMotions[source].dataset.stampedeCasterActive==="true","real source actor participates during wave");
  check(sourceMotions[source].querySelectorAll(".skill-fx--stampede-caster").length===1,
    "native fighter owns moving official atlas");
  check(releaseShell.querySelectorAll("[data-stampede-horse-shadow]").length===0,
    "no huge copied Cavalcade shadows");
  check(releaseShell.dataset.stampedePose==="standard-attack","same canonical attack atlas as ordinary combat");
   // Native combat Movement Visual and stampede must share identical pose.
   await new Promise(resolve=>setTimeout(resolve,160));
   const realPose=sourceMotions[source].querySelector(".skill-fx--stampede-caster-sprite")?.style.transform;
   const expectedPose=source==="player"
     ? "translate(9px, -20px) scale(1.1)"
     : "translate(-4px, 18px) scale(0.85)";
   check(realPose===expectedPose,"real caster official ATTACK pose "+realPose);
   check(sourceMotions[source].querySelector(".skill-fx--stampede-caster-sprite")?.dataset.assetId
     ==="test:raiiven-standard-attack-5f","attack uses 5-frame authored atlas, not 7-frame movement");
   const originalShadow=anchors[source].querySelector("[data-demo-shadow]");
   check(originalShadow.style.translate===sourceMotions[source].style.translate &&
     originalShadow.style.translate!=="","native shadow follows the true horse rather than remaining at origin");
   check(originalShadow.style.visibility==="visible","native shadow visible under the real caster during the pass");
   check([...releaseShell.querySelectorAll(".skill-fx--stampede-ghost")].every(ghost=>ghost.style.transform==="none"),
     "copies keep the source attack orientation; no automatic horizontal flip");
   check([...releaseShell.querySelectorAll(".skill-fx--stampede-attack-pose")]
     .every(ghost=>ghost.style.transform===realPose),
     "every horse uses the same official FACE/DOS scale and XY offset as the standard creature animation");
  const horseNodes=[...releaseShell.querySelectorAll(".skill-fx--stampede-ghost")];
  check(horseNodes.every(node=>node.style.opacity==="1"&&node.style.width===horseNodes[0].style.width),"four equal-sized ghost companions to the native fifth horse");
  await new Promise(resolve=>setTimeout(resolve,7400));
  check(contacts.filter(x=>x.waveMultiTarget).length===6,
   "two distinct visible ring crossings: "+contacts.map(x=>x.targetId).join(",")+
   " samples="+samples+" ring="+JSON.stringify(releaseShell&&{left:releaseShell.getBoundingClientRect().left,top:releaseShell.getBoundingClientRect().top,width:releaseShell.getBoundingClientRect().width})+
   " actor="+JSON.stringify({left:anchors[enemies[0]].getBoundingClientRect().left,top:anchors[enemies[0]].getBoundingClientRect().top})+
   " state="+runtime.hasActiveAction);
  check(new Set(contacts.map(x=>x.targetId)).size===2,"two enemy slots");
  check(new Set(contacts.map(x=>x.passIndex)).size===3,"all three passes");
  check(new Set(contacts.map(x=>x.targetId+":"+x.passIndex)).size===6,"one contact per pass and target");
  check(resolutions.length===6,"six distinct native Runtime resolutions");
  check(resolutions.every(x=>x.outcome==="hit"&&x.waveContact===true),"canonical successful hits");
  for(const id of enemies)check(session.snapshot().fighters[id].hp===0,"enemy "+id+" must receive three times 40 damage");
  for(const id of ids.filter(id=>!enemies.includes(id))){
    check(session.snapshot().fighters[id].hp===100,"ally "+id+" must never be hurt");
  }
  check(session.snapshot().fighters[source].energy===10,"only one energy cost");
  check(runtime.hasActiveAction===false,"action reaches natural deadline");
  check(actorMoved,"the actual native source model physically advances with its herd");
  return source+":"+enemies.join("+");
 } finally {
  runtime.dispose();fx.dispose();arena.remove();
 }
}
try {
 const passes=[];
 for(const source of ["player","opponent"])passes.push(await scenario(source));
 document.body.dataset.wave2v2Browser="pass:"+passes.join("|");
}catch(error){document.body.dataset.wave2v2Browser="fail:"+String(error.stack||error);}
</script></body></html>`;
const types={".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(pathname==="/__wave_2v2"){
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
  if(!binary)throw Error("Chromium required for wave 2v2 regression");
  const url="http://127.0.0.1:"+server.address().port+"/__wave_2v2";
  const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--no-first-run","--virtual-time-budget=25000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
  const stdout=[],stderr=[];
  child.stdout.on("data",x=>stdout.push(x));child.stderr.on("data",x=>stderr.push(x));
  const exitCode=await Promise.race([
    once(child,"close").then(([code])=>code),
    new Promise((_,reject)=>{const timeout=setTimeout(()=>{
      child.kill("SIGKILL");reject(Error("Wave 2v2 Chromium timed out"));
    },50000);timeout.unref();child.once("close",()=>clearTimeout(timeout));})
  ]);
  const document=Buffer.concat(stdout).toString("utf8");
  const result=document.match(/data-wave2v2-browser="([^"]*)"/)?.[1]??"no-outcome";
  if(exitCode!==0||!result.startsWith("pass:")){
    throw Error("Real 2v2 wave Chromium: "+result+"\n"+Buffer.concat(stderr).toString("utf8").slice(-500));
  }
  console.log("Real 2v2 wave: DOM + animated shell + Combat Runtime + Session",result);
}finally{server.close();}
