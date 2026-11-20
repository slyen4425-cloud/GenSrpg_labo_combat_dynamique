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
</style></head><body data-raiiven-skills-browser="pending"><script>window.addEventListener("error",event=>{document.body.dataset.raiivenSkillsBrowser="fail:page error "+(event.message||"unknown")});window.addEventListener("unhandledrejection",event=>{document.body.dataset.raiivenSkillsBrowser="fail:promise "+String(event.reason)});</script><script type="module">
import {normalizeCaptureSkillTransferV1} from "/src/contracts/capture-skill-transfer-v1.js";
import {normalizeSkillDefinition} from "/src/contracts/skill-definition.js";
import {normalizeBattleFormatDefinition} from "/src/contracts/battle-format-definition.js";
import {createCombatSession} from "/src/core/combat/combat-session.js";
import {createDomDecoyOverlayV1} from "/src/adapters/renderer/dom-decoy-overlay-v1.js";
import {composeDomTransform} from "/src/adapters/renderer/dom-keyframes.js";
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
  node.dataset.actor=id;
  const shadow=document.createElement("span");shadow.className="fighter__shadow";shadow.dataset.shadowMode="soft";node.append(shadow);
  const motion=document.createElement("div");motion.dataset.demoMotion="true";
  // Canonical creature actor (face/opponent versus dos/player) owns X/Y/scale.
  const player=id==="raiiven"||id==="friend";
  motion.style.transform=composeDomTransform({
    position:{x:player?-22:15,y:player?-30:60},
    scale:player?1.7:.82
  });
  motion.style.transformOrigin=player?"50% 86%":"54% 90%";
  const standing=document.createElement("img");
  standing.src="/assets/test/creatures/braisombre/runtime/braisombre_player.webp";
  standing.dataset.demoImage="true";motion.append(standing);node.append(motion);
  area.append(node);return [id,node];
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
  check(visuals.length===2,"two selectable decoys");
  check(slots.raiiven.querySelectorAll(".combat-decoy").length===2,"EXACTLY two visible copies, not three plus the real horse");
  check(slots.raiiven.querySelector("[data-demo-motion]").style.opacity!=="0","the original real Raiiven remains visible and is never projected twice");
  check(slots.raiiven.querySelectorAll("[data-combat-decoy-shadow]").length===2,"exactly two copied shadows beneath the two clones");
  check(slots.raiiven.querySelectorAll(".fighter__shadow").length===3,"one native ground shadow plus exactly two clone shadows");
  check([...slots.raiiven.querySelectorAll(".combat-decoy")].every(node=>node.style.transform==="scale(1)"),"full-size horses without small-clone scaling");
  check([...slots.raiiven.querySelectorAll(".combat-decoy__sprite")].every(sprite=>sprite.style.transform===slots.raiiven.querySelector("[data-demo-motion]").style.transform),"cloned pixels use exact native actor transform rather than a guessed scale");
  check([...slots.raiiven.querySelectorAll(".combat-decoy__sprite")].every(sprite=>
    sprite.style.transform.includes("-30px")&&sprite.style.transform.includes("scale(1.7")),
    "clones preserve player/back scale 1.7 and authored negative Y offset");
  check([...slots.raiiven.querySelectorAll(".combat-decoy__sprite")].every(sprite=>
    sprite.style.transformOrigin==="50% 86%"),
    "clones preserve exactly the native image pivot");
  const realBody=slots.raiiven.querySelector("[data-combat-decoy-real]");
  const beforeSlot=realBody.style.left;
  check(realBody!==null && realBody.querySelector("img")===null,"real selector is transparent, NEVER a duplicate horse image");
  check([...slots.raiiven.querySelectorAll(".combat-decoy")].every(node=>node.querySelector(".combat-decoy__sprite img")?.src===slots.raiiven.querySelector("[data-demo-motion] img").src),"both clones use the exact original native model image");
  check([...slots.raiiven.querySelectorAll(".combat-decoy__sprite img")].every(image=>image.dataset.decoyPose==="standing"),"only the two clones duplicate the standing pose");
  session.advanceMs(5000);
  overlay.render(session.snapshot());
  check(realBody.style.left!==beforeSlot,"true horse changes slot during Dédale");
  check(slots.raiiven.querySelector("[data-demo-motion]").style.translate!=="","the REAL native model moves with its selected true slot");
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
  // The same skill must render the original creature's opponent/FACE X/Y
  // adjustment and scale, with no special Raiiven-only mapping.
  const enemyIllusion=session.useSkill({actorId:"enemy",targetId:"enemy",skill:decoy});
  check(enemyIllusion.ok,"opponent can use generic decoy skill");
  overlay.render(session.snapshot());
  const enemyMotion=slots.enemy.querySelector("[data-demo-motion]");
  const enemyCopies=[...slots.enemy.querySelectorAll(".combat-decoy__sprite")];
  check(enemyCopies.length===2,"opponent also gets exactly two clones");
  check(enemyCopies.every(sprite=>sprite.style.transform===enemyMotion.style.transform),
    "opponent clones inherit official front-view scale X/Y");
  check(enemyCopies.every(sprite=>sprite.style.transform.includes("60px") &&
    sprite.style.transform.includes("scale(0.82") &&
    sprite.style.transformOrigin==="54% 90%"),
    "opponent clones preserve Y=+60, 0.82x and native origin");
  const fx=playDomShadowEchoFxV1({arena:area,type:"projectile",
   sourceRect:slots.raiiven.getBoundingClientRect(),targetRect:slots.enemy.getBoundingClientRect(),
   durationMs:220,animate:(node,frames,settings)=>node.animate(frames,settings)});
  check(fx.node.dataset.shadowEcho==="true","shared shadow presentation");
  // Virtual-time Chromium can freeze compositor animations; finish only the
  // VISUAL clock, then observe the real WAAPI finished/cleanup lifecycle.
  fx.animation.finish();
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
   throw Error("Raiiven real Chromium: "+result+"\nDOM="+document.slice(0,1000)+"\nChrome="+Buffer.concat(err).toString("utf8").slice(-2000));
 console.log("Raiiven real Chromium native 1v1/2v2 decoy and shadow echo",result);
}finally{server.close();}
