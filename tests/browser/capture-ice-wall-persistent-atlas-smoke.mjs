// Real Chromium integration: all three official ice wall atlases animate once,
// hold the last wall frame through damage, and disappear only when HP reaches zero.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd(),mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe = `<script type="module">
import {createCombatState} from "../../src/core/combat/combat-state.js";
import {createCombatBarrierV1} from "../../src/core/combat/combat-entity-v1.js";
import {applyCombatDamageV1} from "../../src/core/combat/combat-damage-application-v1.js";
import {createCombatEntityOverlayV1} from "../../src/adapters/renderer/combat-entity-overlay-v1.js";
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
const ids=["pack:capture:sprite-mur-glace-01","pack:capture:sprite-mur-glace-herisse-01","pack:capture:sprite-mur-glace-arcanique-01"];
try{
 const res=await fetch(GLOBAL_VISUAL_LIBRARY.catalogUrl,{cache:"no-store"});
 if(!res.ok)throw Error("official wall catalog unavailable: "+res.status);
 const catalog=await res.json();
 if(catalog.storage?.branch!=="global-assets")throw Error("duplicate catalog authority");
 for(const id of ids){
   const items=catalog.assets.filter(x=>x.id===id);
   if(items.length!==1)throw Error("official wall ID missing/duplicate "+id);
   const asset=items[0];
   if(asset.resource?.frameCount!==12||asset.resource?.holdLastFrame!==true||asset.resource?.playbackMode!=="once")
      throw Error("wall animation metadata wrong "+id);
   const imageAsset={
     url:globalVisualAssetUrl(asset.resource.file),
     frameCount:asset.resource.frameCount,frameMs:asset.resource.frameMs,
     playbackMode:asset.resource.playbackMode,holdLastFrame:asset.resource.holdLastFrame
   };
   const state=createCombatState({fighters:[
     {id:"player",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10,statValuesById:{glace:80}},
     {id:"opponent",maxHp:100,initialHp:100,maxEnergy:10,initialEnergy:10}
   ]});
   const summoned=createCombatBarrierV1({state,sourceActorId:"player",protectedActorId:"player",
     sourceSkillId:"test-wall",effect:{kind:"summon_entity",entityKind:"barrier",
       statId:"glace",hpPerStatPoint:1,interceptKinds:["projectile","beam","contact"],spriteAssetId:id}});
   const host=document.createElement("div");host.style.cssText="position:relative;width:400px;height:230px;";
   document.body.append(host);
   const overlay=createCombatEntityOverlayV1({fighterContainers:{player:host},assetForId:key=>key===id?imageAsset:null});
   overlay.render(summoned.state);
   const node=host.querySelector("[data-combat-entity-id]");
   const img=node?.querySelector("[data-combat-entity-image]");
   if(!img)throw Error("actual wall image missing "+id);
   await Promise.race([img.decode(),new Promise((_,bad)=>setTimeout(()=>bad(Error("WebP timeout "+id)),16000))]);
   if(img.naturalWidth!==6144||img.naturalHeight!==512)throw Error("wrong real atlas "+id);
   const plays=img.getAnimations();
   if(plays.length!==1)throw Error("wall construction was not animated "+id+" "+plays.length);
   const animation=plays[0];
   if(animation.effect?.getTiming()?.iterations!==1)throw Error("wall animation repeats "+id);
   animation.finish();
   if(getComputedStyle(img).transform==="none")throw Error("wall completed frame not visible "+id);
   const completedTransform=getComputedStyle(img).transform;
   const hit=applyCombatDamageV1({state:summoned.state,sourceActorId:"opponent",targetActorId:"player",
     damage:25,incomingKind:"projectile",contactedEntityId:summoned.record.id});
   overlay.render(hit.state);
   if(host.querySelector("[data-combat-entity-id]")!==node||node.querySelector("[data-combat-entity-image]")!==img)
     throw Error("wall sprite recreated after hit "+id);
   if(getComputedStyle(img).transform!==completedTransform)throw Error("wall reset to construction frame on hit "+id);
   if(!node.textContent.includes("55 / 80 PV"))throw Error("native wall HP not updated "+id);
   const end=applyCombatDamageV1({state:hit.state,sourceActorId:"opponent",targetActorId:"player",
     damage:99,incomingKind:"projectile",contactedEntityId:summoned.record.id});
   overlay.render(end.state);
   if(host.querySelector("[data-combat-entity-id]"))throw Error("wall remains after HP reaches zero "+id);
   overlay.dispose();host.remove();
 }
 document.body.dataset.persistentIceWallSmoke="pass:three-atlases:construction-once:hold-final:hp-driven-destruction";
}catch(e){document.body.dataset.persistentIceWallSmoke="error:"+String(e.message||e);}
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+path);if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let body=await readFile(file);
  if(path.endsWith("/capture-editor-v2.html"))body=Buffer.from(body.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(path)]??"application/octet-stream"}).end(body);
 }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
 const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
   .filter(Boolean).find(name=>spawnSync("which",[name]).status===0);
 if(!bin)throw Error("Chromium binary required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html";
 const child=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
   "--no-first-run","--virtual-time-budget=35000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const out=[],err=[];child.stdout.on("data",x=>out.push(x));child.stderr.on("data",x=>err.push(x));
 const exit=await Promise.race([once(child,"close").then(([code])=>code),
  new Promise((_,fail)=>{const t=setTimeout(()=>{child.kill("SIGKILL");fail(Error("persistent wall real browser timeout"));},80000);t.unref();child.once("close",()=>clearTimeout(t));})]);
 const html=Buffer.concat(out).toString("utf8");
 const match=html.match(/data-persistent-ice-wall-smoke="([^"]*)"/)?.[1]??"missing";
 if(exit!==0||!match.startsWith("pass:"))
   throw Error("Persistent Ice Wall real browser: "+match+" "+Buffer.concat(err).toString("utf8").slice(-500));
 console.log("Persistent Ice Wall Chromium: "+match);
}finally{server.close();}
