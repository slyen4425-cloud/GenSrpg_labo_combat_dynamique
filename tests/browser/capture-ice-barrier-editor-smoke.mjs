// Real Chromium: native charged status editor is operable.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd(),mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe=`<script type="module">
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {createCombatEntityOverlayV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
try{
 const state=createCombatState({fighters:[
   {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
   {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
 ]});
 const effect={kind:"summon_entity",entityKind:"barrier",statId:"glace",hpPerStatPoint:1,
  interceptKinds:["projectile","beam","contact"]};
 const summoned=createCombatBarrierV1({state,sourceActorId:"player",protectedActorId:"player",
  sourceSkillId:"wall",effect});
 const host=document.createElement("div");document.body.append(host);
 const overlay=createCombatEntityOverlayV1({fighterContainers:{player:host}});
 overlay.render(summoned.state);
 if(!host.querySelector("[data-combat-entity-id]")?.textContent.includes("80 / 80 PV"))
   throw Error("native barrier missing from DOM or HP label");
 const hit=applyCombatDamageV1({state:summoned.state,sourceActorId:"opponent",
   targetActorId:"player",damage:25,incomingKind:"projectile"});
 overlay.render(hit.state);
 if(!host.querySelector("[data-combat-entity-id]")?.textContent.includes("55 / 80 PV"))
   throw Error("barrier HP did not update after real damage");
 overlay.dispose();host.remove();
 document.body.dataset.barrierOverlaySmoke="pass:real-entity:80hp:hit25:55hp";
}catch(e){document.body.dataset.barrierOverlaySmoke="error:"+e.message;}
document.addEventListener("DOMContentLoaded",()=>{
 setTimeout(()=>{
  try {
   document.querySelector("[data-skill-new]").click();
   document.querySelector("[data-skill-effect-add-kind]").value="standard";
   document.querySelector("[data-skill-effect-add]").click();
   const row=[...document.querySelectorAll("[data-skill-effects-host] [data-skill-effect-row]")].at(-1);
   if(!row)throw Error("native effect row missing");
   const kind=row.querySelector("[data-skill-effect-kind]");
   kind.value="summon_entity";kind.dispatchEvent(new Event("change",{bubbles:true}));
   const box=row.querySelector('[data-skill-effect-config-kind="summon_entity"]');
   if(!box||box.hidden||getComputedStyle(box).display==="none")throw Error("wall options hidden");
   const stat=row.querySelector("[data-skill-barrier-stat-id]");
   const ratio=row.querySelector("[data-skill-barrier-hp-ratio]");
   if(![...stat.options].some(x=>x.value==="glace"))throw Error("official glace stat missing");
   stat.value="glace";ratio.value="1.5";
   const kinds=[...row.querySelectorAll("[data-skill-barrier-intercept-kind]")]
     .filter(x=>x.checked).map(x=>x.value);
   if(ratio.value!=="1.5"||kinds.length!==3)throw Error("wall options not editable");
   document.body.dataset.barrierEditorSmoke="pass:real-editor:glace:1.5:intercepts";
  }catch(e){document.body.dataset.barrierEditorSmoke="error:"+e.message;}
 },2400);
});
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname),file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let body=await readFile(file);
  if(pathname.endsWith("/capture-editor-v2.html"))body=Buffer.from(body.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(pathname)]??"application/octet-stream"}).end(body);
 }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
 const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!bin)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html";
 const child=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run","--virtual-time-budget=8000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const out=[],errs=[];child.stdout.on("data",x=>out.push(x));child.stderr.on("data",x=>errs.push(x));
 const exit=await Promise.race([once(child,"close").then(([code])=>code),
  new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("browser timeout"));},50000);t.unref();child.once("close",()=>clearTimeout(t));})]);
 const html=Buffer.concat(out).toString("utf8");
 const author=html.match(/data-barrier-editor-smoke="([^"]*)"/)?.[1]??"missing";
 const overlay=html.match(/data-barrier-overlay-smoke="([^"]*)"/)?.[1]??"missing";
 if(exit!==0||!author.startsWith("pass:")||!overlay.startsWith("pass:"))
   throw Error("Ice barrier real Chromium "+author+" / "+overlay+" "+Buffer.concat(errs).toString("utf8").slice(-500));
 console.log(author+" / "+overlay);
}finally{server.close();}
