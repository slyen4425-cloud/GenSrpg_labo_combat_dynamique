// Real Chromium DOM smoke: authentic Firestorm skill -> CombatSession/Runtime
// -> Persistent Zone Runtime -> live DomSkillFxRenderer. Neither gameplay nor
// sprite growth is implemented here; the click is a test-only player adapter.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

const root = process.cwd();
const page = [
'<!doctype html><html><head><meta charset="utf-8">',
'<link rel="stylesheet" href="/examples/dom-demo/demo.css">',
'<style>body{background:#202020;color:white}.test-arena{width:650px;height:320px;position:relative;margin:15px}.fighter{position:absolute;width:55px;height:55px;top:100px;background:#999}</style>',
'</head><body data-firestorm-browser="pending"><script type="module">',
'import {normalizeSkillDefinition} from "/src/contracts/skill-definition.js";',
'import {createCombatSession} from "/src/core/combat/combat-session.js";',
'import {createCombatRuntime} from "/src/core/combat/combat-runtime.js";',
'import {createDomSkillFxRenderer} from "/src/adapters/renderer/dom-skill-fx.js";',
'import {createBattleActorAiController} from "/src/core/combat/battle-actor-ai-controller.js";',
'const assert = (condition, detail) => { if(!condition)throw Error(detail); };',
'const playerSprite = "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2764%27 height=%2764%27%3E%3Ccircle cx=%2732%27 cy=%2732%27 r=%2730%27 fill=%27orange%27/%3E%3C/svg%3E";',
'async function scenario(skill, visual, teamSize, controller, crossing) {',
' const locals = teamSize===1 ? ["player"] : ["player-a","player-b"];',
' const enemies = teamSize===1 ? ["opponent"] : ["opponent-a","opponent-b"];',
' const ids = locals.concat(enemies);',
' const actorId=controller==="player"?locals[0]:enemies[0];',
' const targetId=controller==="player"?enemies[0]:locals[0];',
' const format={actors:ids.map(actorId=>({actorId})),teamOf(id){return locals.includes(id)?"local":enemies.includes(id)?"enemy":null;}};',
' const fighters=ids.map(id=>({id,maxHp:500,initialHp:500,maxEnergy:50,initialEnergy:50,energyChargeAmount:0}));',
' const session=createCombatSession({distance:"long",battleFormat:format,fighters});',
' const arena=document.createElement("section");arena.className="test-arena";document.body.append(arena);',
' const anchors=Object.fromEntries(ids.map((id,index)=>{const div=document.createElement("div");div.className="fighter";div.style.left=String(55+index*125)+"px";arena.append(div);return [id,div];}));',
' const fx=createDomSkillFxRenderer({arena,anchors,targetAnchors:anchors,presentationForSkill(id){assert(id===skill.id,"skill id");return {persistentZone:{...visual,url:playerSprite},persistentZoneLayer:"behind"};}});',
' let clock=0,scheduled=null;',
' const runtime=createCombatRuntime({session,now(){return clock;},setTimer(fn){scheduled=fn;return 1;},clearTimer(){scheduled=null;},onState(state){fx.syncPersistentZones(state.persistentZones??[]);}});',
' const ai=controller==="ai" ? createBattleActorAiController({session,runtime,actorId,targetIds:[targetId],skillIds:[skill.id],skillsById:new Map([[skill.id,skill]])}):null;',
' const button=document.createElement("button");button.textContent="Firestorm player";arena.append(button);',
' let clickResult=null;button.addEventListener("click",()=>{clickResult=runtime.startSkill({actorId,targetId,skill});});',
' function advance(time){clock=time;const fn=scheduled;scheduled=null;assert(typeof fn==="function","Runtime timer at "+time);fn();}',
' function activate(){if(ai){assert(ai.takeTurn().status==="skill_started","AI start at "+clock);}else{button.click();assert(clickResult?.ok,"player real click at "+clock);}}',
' function check(radius,activations,previous=null){const zone=session.snapshot().persistentZones[0];assert(zone?.radius===radius,"actual zone radius "+zone?.radius+" expected "+radius);assert(zone.activations===activations,"actual activations "+zone.activations);assert(zone.expiresAtMs-zone.appliedAtMs===15000,"authored 15s zone duration");const node=arena.querySelector(".skill-fx--persistent-zone");assert(node?.dataset.zoneRadius===radius,"DOM radius "+node?.dataset.zoneRadius);assert(node.style.opacity==="0.5","authored sprite opacity");const size=node.getBoundingClientRect().width;assert(size>0,"DOM width");if(previous){assert(size>previous.width+10,"DOM did not visually grow "+size+" vs "+previous.width);if(!crossing)assert(node===previous.node,"renderer recreated zone before expiry");}return {node,width:size};}',
' try {runtime.start();advance(25000);activate();advance(27000);const short=check("short",1);',
' if(crossing){advance(41000);activate();advance(42001);assert(session.snapshot().persistentZones.length===0,"old zone must expire while cast prepares");advance(43000);check("medium",2,short);advance(58001);',
' }else{advance(28500);activate();advance(30500);const medium=check("medium",2,short);advance(32000);activate();advance(34000);check("long",3,medium);advance(49001);}',
' assert(session.snapshot().persistentZones.length===0,"zone must be removed at expiry");',
' const restart=clock+1000;advance(restart);activate();advance(restart+2000);check("short",1);',
' return teamSize+"v"+teamSize+":"+controller+":"+(crossing?"crossing":"normal");',
' }finally{runtime.dispose();fx.dispose();arena.remove();}',
'}',
'try{',
' const response=await fetch("/data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json");assert(response.ok,"real authored JSON request");',
' const draft=(await response.json()).draft;const skill=normalizeSkillDefinition(draft.definition);',
' assert(skill.id==="cap_fire_atk_6"&&skill.effects[0].reactivation==="reinforce","authored skill contract");',
' const passes=[];for(const teamSize of [1,2])for(const controller of ["player","ai"])for(const crossing of [false,true]){passes.push(await scenario(skill,draft.presentation.visual.aura,teamSize,controller,crossing));}',
' document.body.dataset.firestormBrowser="pass:"+passes.join("|");',
'}catch(error){document.body.dataset.firestormBrowser="fail:"+String(error.stack||error);}',
'</script></body></html>'
].join("\n");
const types={".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  if(pathname==="/__firestorm_browser"){
    res.writeHead(200,{"Content-Type":"text/html; charset=utf-8"}).end(page);
    return;
  }
  const pathnameOnDisk=resolve(root,"."+pathname);
  if(!pathnameOnDisk.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  const bytes=await readFile(pathnameOnDisk);
  res.writeHead(200,{"Content-Type":types[extname(pathname)]??"application/octet-stream"}).end(bytes);
 }catch(error){res.writeHead(404).end(String(error));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
 const candidates=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean);
 const binary=candidates.find(candidate=>spawnSync("which",[candidate]).status===0);
 if(!binary)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/__firestorm_browser";
 const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--disable-background-networking","--no-first-run","--virtual-time-budget=12000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const stdout=[],stderr=[];
 child.stdout.on("data",x=>stdout.push(x));child.stderr.on("data",x=>stderr.push(x));
 const code=await Promise.race([once(child,"close").then(([code])=>code),new Promise((_,reject)=>{const timeout=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Chromium timed out"));},50000);timeout.unref();child.once("close",()=>clearTimeout(timeout));})]);
 const dom=Buffer.concat(stdout).toString("utf8");
 const outcome=dom.match(/data-firestorm-browser="([^"]*)"/)?.[1]??"no-outcome";
 if(code!==0||!outcome.startsWith("pass:"))throw Error("Real Firestorm Chromium: "+outcome+"\n"+Buffer.concat(stderr).toString("utf8").slice(-300));
 console.log("Real Firestorm Chromium DOM + Runtime + zone renderer:",outcome);
}finally{server.close();}
