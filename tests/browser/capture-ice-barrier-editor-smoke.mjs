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
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
import {sweptSegmentRectContactV1,nearestBarrierSegmentContactV1} from "../../src/core/combat/combat-barrier-spatial-v1.js";
try{
 const state=createCombatState({fighters:[
   {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
   {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
 ]});
 const effect={kind:"summon_entity",entityKind:"barrier",statId:"glace",hpPerStatPoint:1,
  interceptKinds:["projectile","beam","contact"],spriteAssetId:"test:wall-art"};
 const summoned=createCombatBarrierV1({state,sourceActorId:"player",protectedActorId:"player",
  sourceSkillId:"wall",effect});
 const host=document.createElement("div");document.body.append(host);
 const wallArt="data:image/svg+xml,"+encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" width="70" height="92"><path fill="#8ddaf4" d="M15 0H58L70 90H0Z"/></svg>\`);
 const presentationAssets=createCaptureSkillPresentationAssetsV2({skillPresentations:{},
  assetForId:id=>id==="test:wall-art"?{url:wallArt,frameCount:1}:null});
 const overlay=createCombatEntityOverlayV1({fighterContainers:{player:host},
  assetForId:id=>presentationAssets.visualAsset(id)});
 overlay.render(summoned.state);
 const stableWall=host.querySelector("[data-combat-entity-id]");
 if(!stableWall?.textContent.includes("80 / 80 PV"))
   throw Error("native barrier missing from DOM or HP label");
 if(!stableWall.querySelector("[data-combat-entity-image]")?.src.startsWith("data:image/svg+xml"))
   throw Error("authored sprite is not mounted as a persistent image");
 const rect=overlay.collisionRectsFor({sourceActorId:"opponent",targetActorId:"player"})[0]?.rect;
 if(!rect||rect.width<=0||rect.height<=0)throw Error("real wall collision rect missing");
 const centerY=rect.top+rect.height/2;
 const contact=sweptSegmentRectContactV1({from:{x:rect.left-100,y:centerY},
   to:{x:rect.left+rect.width+100,y:centerY},rect});
 if(!contact)throw Error("swept projectile did not collide with real wall sprite");
 const bypass=applyCombatDamageV1({state:summoned.state,sourceActorId:"opponent",
   targetActorId:"player",damage:25,incomingKind:"projectile",contactedEntityId:null});
 if(bypass.absorbedByEntity!==0||bypass.state.fighters.player.hp!==75)
   throw Error("projectile missing sprite must bypass obstacle");
 // Real Chromium sprite rectangle is authoritative for rays and melee too.
 for(const kind of ["beam","contact"]){
   const segment=nearestBarrierSegmentContactV1({
     from:{x:rect.left-100,y:centerY},to:{x:rect.left+rect.width+100,y:centerY},
     barriers:overlay.collisionRectsFor({sourceActorId:"opponent",targetActorId:"player",kind})
   });
   if(segment?.entityId!==summoned.record.id)throw Error(kind+" failed real DOM wall contact");
   const avoid=nearestBarrierSegmentContactV1({
     from:{x:rect.left-100,y:rect.top-15},to:{x:rect.left+rect.width+100,y:rect.top-15},
     barriers:overlay.collisionRectsFor({sourceActorId:"opponent",targetActorId:"player",kind})
   });
   if(avoid!==null)throw Error(kind+" false-positive lateral wall contact");
   const noProof=applyCombatDamageV1({state:summoned.state,sourceActorId:"opponent",
     targetActorId:"player",damage:25,incomingKind:kind});
   if(noProof.absorbedByEntity!==0)throw Error(kind+" auto-intercept without visible evidence");
   const realHit=applyCombatDamageV1({state:summoned.state,sourceActorId:"opponent",
     targetActorId:"player",damage:25,incomingKind:kind,contactedEntityId:segment.entityId});
   if(realHit.absorbedByEntity!==25||realHit.state.fighters.player.hp!==100)
     throw Error(kind+" native damage failed after visual geometry");
 }
 const hit=applyCombatDamageV1({state:summoned.state,sourceActorId:"opponent",
   targetActorId:"player",damage:25,incomingKind:"projectile",contactedEntityId:summoned.record.id});
 overlay.render(hit.state);
 if(host.querySelector("[data-combat-entity-id]")!==stableWall)
   throw Error("persistent wall was recreated instead of retaining its DOM sprite");
 if(!stableWall.textContent.includes("55 / 80 PV"))
   throw Error("barrier HP did not update after real damage");
 overlay.dispose();host.remove();
 document.body.dataset.barrierOverlaySmoke="pass:persistent-sprite:geometry:80hp:hit25:55hp";
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
   if(ratio.value!=="1.5"||kinds.length!==3||!row.querySelector("[data-skill-barrier-sprite-asset-id]")||
     !row.querySelector("[data-skill-barrier-visual-scale]")||
     !row.querySelector("[data-skill-barrier-offset-forward]")||
     !row.querySelector("[data-skill-barrier-offset-up]"))
     throw Error("wall HP and sprite options not editable");
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
