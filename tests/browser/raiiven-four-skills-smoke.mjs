// Real Chromium exercise: canonical skill transfer -> CombatSession -> explicit
// DOM decoy choice -> native damage/retaliation -> echoed ability -> shared FX.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd();
const html=`<!doctype html><html><head><meta charset="utf-8"><style>
body{background:#15101f;color:white}.arena{position:relative;width:650px;height:350px}
.actor{position:absolute;width:75px;height:75px;overflow:visible}
</style></head><body data-raiiven-skills-browser="pending"><script type="module">
import {normalizeCaptureSkillTransferV1} from "/src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "/src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "/src/contracts/battle-format-definition.js";
import {createCombatSession} from "/src/core/combat/combat-session.js";
import {createDomDecoyOverlayV1} from "/src/adapters/renderer/dom-decoy-overlay-v1.js";
import {applySpriteVisual} from "/src/adapters/renderer/dom-skill-fx.js";
import {playDomShadowEchoFxV1} from "/src/adapters/renderer/dom-shadow-echo-fx-v1.js";
const check=(condition,reason)=>{if(!condition)throw Error(reason);};
const skill=async id=>{
 const response=await fetch("/data/capture/showcase/"+id+".capture-skill-transfer-v1.json");
 check(response.ok,"missing skill transfer: "+id);
 return normalizeCaptureSkillTransferV1(await response.json()).draft.definition;
};
const fighter=id=>({id,maxHp:160,initialHp:160,maxEnergy:30,initialEnergy:30,
 energyChargeAmount:0,energyChargeIntervalMs:2000,movementEnergyPerStep:0,chargeTimeModifierPct:0});
const strike=normalizeSkillDefinition({id:"raiiven-native-smoke-strike",name:"Frappe",
 category:"offensive",form:"projectile",element:"fire",approachMode:"none",
 energyCost:0,preparationMs:0,travelMs:0,recoveryMs:0,cooldownMs:0,
 targetRelations:["enemy"],allowedDistances:["short","medium","long"],
 effect:{damage:20,heal:0,interruptsPreparation:false,stunMs:0,tags:[]}});
const decoy=await skill("raiiven-dedale-silhouettes");
const echo=await skill("raiiven-remanence-interdite");
async function scenario(two){
 const ids=two?["raiiven","friend","enemy","enemy2"]:["raiiven","enemy"];
 const format=normalizeBattleFormatDefinition({id:"raiiven-browser-"+(two?2:1),localActorId:"raiiven",
 teams:{players:two?["raiiven","friend"]:["raiiven"],enemies:two?["enemy","enemy2"]:["enemy"]},
 actors:ids.map(id=>({actorId:id,teamId:["raiiven","friend"].includes(id)?"players":"enemies",
 creatureId:id,displayName:id,fighterConfigId:id,controllerId:id==="raiiven"?"human-local":"ai-enemy"}))});
 const session=createCombatSession({battleFormat:format,fighters:ids.map(fighter)});
 const area=document.createElement("section");area.className="arena";document.body.append(area);
 const slots=Object.fromEntries(ids.map((id,index)=>{
  const node=document.createElement("div");node.className="actor";
  node.style.left=(90+index*120)+"px";node.style.top=(80+index%2*100)+"px";
  node.dataset.actor=id;area.append(node);return [id,node];
 }));
 let selected=null;
 const overlay=createDomDecoyOverlayV1({fighterContainers:slots,
   appearanceFor:()=>({url:"/assets/test/creatures/braisombre/runtime/braisombre_player.webp",
     frameCount:1,mode:"sprite",playbackMode:"loop"}),
   applySpriteVisual,onChoose:choice=>{selected=choice;}});
 try{
  check(session.useSkill({actorId:"raiiven",targetId:"raiiven",skill:decoy}).ok,"decoy starts");
  overlay.render(session.snapshot());
  const visuals=slots.raiiven.querySelectorAll("[data-combat-decoy]");
  check(visuals.length===2,"two visible copies");
  visuals[0].click();check(selected?.actorId==="raiiven","real click selects decoy");
  const enemyHpBefore=session.snapshot().fighters.enemy.hp;
  const raiivenHpBefore=session.snapshot().fighters.raiiven.hp;
  const outcome=session.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike,decoyId:selected.decoyId});
  check(outcome.outcome==="decoy","native explicit decoy interception");
  check(session.snapshot().fighters.enemy.hp===enemyHpBefore-10,"native ten shadow retaliation");
  check(session.snapshot().fighters.raiiven.hp===raiivenHpBefore,"real target unhurt");
  overlay.render(session.snapshot());
  check(slots.raiiven.querySelectorAll("[data-combat-decoy]").length===1,"one visual decoy removed");
  const real=session.useSkill({actorId:"enemy",targetId:"raiiven",skill:strike});
  check(real.ok && real.outcome==="hit","real body remains targetable");
  const cast=session.useSkill({actorId:"raiiven",targetId:"enemy",skill:echo});
  check(cast.ok,"echo runs native copy");
  check(cast.echoCopied===true,"native echo tag");
  check(session.snapshot().fighters.enemy.hp===enemyHpBefore-22,"copied 20 fire becomes 12 shadow");
  check(cast.events.some(e=>e.type==="hit"&&e.damageChannel==="shadow"),"shadow channel");
  const fx=playDomShadowEchoFxV1({arena:area,type:"projectile",
   sourceRect:slots.raiiven.getBoundingClientRect(),targetRect:slots.enemy.getBoundingClientRect(),
   durationMs:220,animate:(node,frames,settings)=>node.animate(frames,settings)});
  check(fx.node.dataset.shadowEcho==="true","shared shadow presentation");
  await fx.finished;check(fx.node.isConnected===false,"FX cleanup");
  return two?"2v2":"1v1";
 }finally{overlay.dispose();area.remove();}
}
try{
 const done=[];
 for(const two of [false,true])done.push(await scenario(two));
 document.body.dataset.raiivenSkillsBrowser="pass:"+done.join("+");
}catch(error){document.body.dataset.raiivenSkillsBrowser="fail:"+String(error.stack||error);}
</script></body></html>`;
const types={".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(pathname==="/__raiiven_skills"){res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end(html);return;}
  const filepath=resolve(root,"."+pathname);
  if(!filepath.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  const bytes=await readFile(filepath);
  res.writeHead(200,{"Content-Type":types[extname(pathname)]??"application/octet-stream"}).end(bytes);
 }catch(error){res.writeHead(404).end(String(error));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
 const binaries=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean);
 const binary=binaries.find(x=>spawnSync("which",[x]).status===0);
 if(!binary)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/__raiiven_skills";
 const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--disable-background-networking","--no-first-run","--virtual-time-budget=12000","--dump-dom",url],
 {stdio:["ignore","pipe","pipe"]});
 const out=[],err=[];
 child.stdout.on("data",x=>out.push(x));child.stderr.on("data",x=>err.push(x));
 const code=await Promise.race([
  once(child,"close").then(([code])=>code),
  new Promise((_,reject)=>{const timeout=setTimeout(()=>{
   child.kill("SIGKILL");reject(Error("Raiiven Chromium timed out"));},45000);
   timeout.unref();child.once("close",()=>clearTimeout(timeout));})
 ]);
 const document=Buffer.concat(out).toString("utf8");
 const result=document.match(/data-raiiven-skills-browser="([^"]*)"/)?.[1]??"no-outcome";
 if(code!==0||!result.startsWith("pass:"))
   throw Error("Raiiven real Chromium: "+result+"\n"+Buffer.concat(err).toString("utf8").slice(-350));
 console.log("Raiiven real Chromium native 1v1/2v2 decoy and shadow echo",result);
}finally{server.close();}
