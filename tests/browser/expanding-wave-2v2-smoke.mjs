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
 id:"wave-browser",name:"Onde feu",category:"offensive",
 form:"projectile",element:"fire",projectileTargeting:"expanding_wave",
 expandingWave:{startRadiusPct:3,endRadiusPct:65,thicknessPct:6},
 hitPresenceStates:["surface","airborne"],targetRelations:["enemy"],
 allowedDistances:["short","medium","long"],
 energyCost:3,preparationMs:0,travelMs:1200,recoveryMs:0,cooldownMs:0,
 effect:{damage:20,heal:0,tags:[]}
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
  arena.append(element);return [id,element];
 }));
 const mask={width:4,height:4,opaque:new Uint8Array(16).fill(1)};
 const visualModel=slot=>({snapshot(){
  const r=anchors[slot].getBoundingClientRect();
  return {mask,origin:{x:r.left,y:r.top},
   axisX:{x:r.right,y:r.top},axisY:{x:r.left,y:r.bottom}};
 }});
 let runtime=null,releaseShell=null;
 const contacts=[],resolutions=[];
 const fx=createDomSkillFxRenderer({
   arena,anchors,targetAnchors:anchors,presentationForSkill:()=>null,
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
     releaseShell=arena.querySelector(".skill-fx--expanding-wave");
   },
   onResolved(result){resolutions.push(result);}
 });
 try {
  runtime.start();
  check(runtime.startSkill({actorId:source,targetId:enemies[0],skill}).ok,"started action");
  check(releaseShell?.dataset.waveMode==="expanding_wave","real wave shell");
  const style=getComputedStyle(releaseShell);
  check(style.getPropertyValue("--tactical-edge").includes("0.52"),"shared wave palette preserved");
  await new Promise(resolve=>setTimeout(resolve,1750));
  check(contacts.filter(x=>x.waveMultiTarget).length===2,"two distinct visible ring crossings: "+contacts.map(x=>x.targetId).join(","));
  check(new Set(contacts.map(x=>x.targetId)).size===2,"no repeated enemy contact");
  check(resolutions.length===2,"two distinct Runtime resolutions");
  check(resolutions.every(x=>x.outcome==="hit"&&x.waveContact===true),"canonical successful hits");
  for(const id of enemies)check(session.snapshot().fighters[id].hp===80,"enemy "+id+" damaged exactly once");
  for(const id of ids.filter(id=>!enemies.includes(id))){
    check(session.snapshot().fighters[id].hp===100,"ally "+id+" must never be hurt");
  }
  check(session.snapshot().fighters[source].energy===17,"only one energy cost");
  check(runtime.hasActiveAction===false,"action reaches natural deadline");
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
  const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--no-first-run","--virtual-time-budget=12000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
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
