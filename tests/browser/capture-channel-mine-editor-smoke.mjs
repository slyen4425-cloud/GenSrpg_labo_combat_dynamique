// Real Chromium: native charged status editor is operable.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd(),mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe=`<script>
document.addEventListener("DOMContentLoaded",()=>{
 setTimeout(()=>{
  try{
   const sel=q=>document.querySelector(q);
   const enabled=sel("[data-skill-channeling-enabled]");
   if(!enabled)throw Error("channeling missing");
   sel("[data-skill-new]").click();
   enabled.click();
   const box=sel("[data-skill-channeling-config]");
   if(!enabled.checked||box.hidden||getComputedStyle(box).display==="none")
     throw Error("channel setup unavailable");
   sel("[data-skill-channeling-interval]").value="750";
   sel("[data-skill-channeling-energy]").value="2";
   sel("[data-skill-channeling-effect-add]").click();
   const effects=sel("[data-skill-channeling-effects-host]");
   if(!effects.querySelector("[data-skill-effect-row]"))throw Error("no native pulse effect row");
   enabled.click();
   if(!box.hidden)throw Error("channel collapse broken");
   const kind=sel("[data-skill-effect-add-kind]");
   kind.value="mine";sel("[data-skill-effect-add]").click();
   const mine=sel('[data-skill-effects-host] [data-skill-effect-row]');
   if(!mine||!mine.querySelector('[data-skill-scheduled-mine]')?.checked)
      throw Error("mine not in original native tactical row");
   if(mine.querySelector('[data-skill-scheduled-delay-seconds]').value!=="3")
      throw Error("mine native delay incorrect");
   const trajectory=sel("[data-skill-trajectory-mode]");
   if(![...trajectory.options].some(x=>x.value==="under_target"))
     throw Error("under-target projectile missing");
   const filters=[...document.querySelectorAll("[data-skill-element-filter]")];
   if(filters.length<6)throw Error("skill element filters missing on all selectors: "+filters.length);
   const library=sel("[data-skill-library-select]");
   if(![...library.options].some(o=>o.value==="pique_glace"))
     throw Error("Pique de glace upload missing from the native saved skill list");
   if(library.options.length>1){
     const selected=library.value;
     const sourceTotal=library.options.length;
     const ice=filters.find(f=>f.parentElement?.contains(library));
     const iceOption=[...ice.options].find(x=>x.value==="ice");
     if(iceOption){ice.value="ice";ice.dispatchEvent(new Event("change",{bubbles:true}));
       if(library.value!==selected)throw Error("filter discarded selected ability");
       if(library.options.length>=sourceTotal ||
          [...library.options].some(o=>o.value==="cap_fire_atk_5"))
         throw Error("mobile skill editor filter must remove unrelated options, not only hide");
       ice.value="";ice.dispatchEvent(new Event("change",{bubbles:true}));
       if(library.options.length!==sourceTotal)throw Error("clearing element filter did not restore skill choices");
     }
   }
   // Real Android-like author path: the normal Projectile + Channeling
   // combination was invalid. One guided click must produce a savable
   // native area channel without discarding existing media references.
   // Use the real editor tab navigation: this panel is hidden by default
   // while the editor starts on the Creature tab. Never force CSS/hidden
   // or invent a second selector in a synthetic detached subtree.
   sel('[data-editor-tab="skills"]').click();
   if(sel('[data-editor-panel="skills"]').hidden)
     throw Error("Skills navigation did not display its native panel");
   const unified=sel("[data-skill-effect-add-kind]");
   for(const type of ["damage","heal","apply_status","scheduled_effect","summon_entity"])
     if(![...unified.options].some(o=>o.value==="effect:"+type))
       throw Error("unified effects menu missing "+type);
   const effectsHost=sel("[data-skill-effects-host]");
   const previousCount=effectsHost.children.length;
   unified.value="effect:apply_status";
   unified.dispatchEvent(new Event("change",{bubbles:true}));
   const newRow=[...effectsHost.children].at(-1);
   if(effectsHost.children.length!==previousCount+1 || unified.value!=="standard" ||
      newRow?.querySelector("[data-skill-effect-kind]")?.value!=="apply_status")
     throw Error("unified picker did not reveal native status controls");
   sel("[data-skill-new]").click();
   if(enabled.checked||sel("[data-skill-channeling-effects-host]").children.length!==0)
     throw Error("new skill inherited the previous ability's invisible channel effects");
   sel("[data-skill-name]").value="Pique de glace";
   // Follow the actual mobile path: the Skills card may be collapsed by the
   // editor accordion, so open it through its real heading before requiring
   // visible bounding rectangles for the selected mechanism.
   const effectsCard=sel("[data-skill-effect-add-kind]").closest(".card");
   if(effectsCard?.dataset.collapsed==="true")
     effectsCard.querySelector(".card-title")?.click();
   if(effectsCard?.dataset.collapsed==="true")
     throw Error("Effects card cannot be opened by normal author controls");
   const panels=["[data-skill-charged-panel]","[data-skill-charged-effects-panel]",
     "[data-skill-channeling-section]","[data-skill-contact-hold]"];
   if(panels.some(q=>!sel(q).hidden||sel(q).getClientRects().length!==0))
     throw Error("independent mechanics panels remain VISIBLE outside the selector");
   const chooser=sel("[data-skill-effect-add-kind]");
   chooser.value="channeling";
   chooser.dispatchEvent(new Event("change",{bubbles:true}));
   if(sel("[data-skill-channeling-section]").hidden||
       sel("[data-skill-channeling-section]").getClientRects().length===0||
       panels.filter(q=>!sel(q).hidden||sel(q).getClientRects().length!==0).length!==1)
     throw Error("selecting channeling did not show exactly its original panel: "+
       panels.map(q=>q+"(hidden="+sel(q).hidden+",rect="+sel(q).getClientRects().length+
         ",computed="+getComputedStyle(sel(q)).display+")").join("|")+
       "; card="+effectsCard?.dataset.collapsed);
   const preset=sel("[data-skill-channel-ice-preset]");
   if(!preset)throw Error("guided ice-spike preset missing");
   preset.click();
   const motion=sel("[data-skill-ground-motion]");
   const groundY=sel("[data-skill-ground-offset-y]");
   if(!motion||!groundY||!sel("[data-skill-ground-rise-px]"))
     throw Error("ground trajectory author controls missing");
   motion.value="fixed";motion.dispatchEvent(new Event("change",{bubbles:true}));
   groundY.value="35";
   if(!sel("[data-skill-ground-rise-px]").closest("label").hidden)
     throw Error("fixed ice spike still shows irrelevant rise distance");
   const form=sel("[data-skill-form]");
   if(!enabled.checked||form.value!=="area"||trajectory.value!=="under_target")
     throw Error("ice spike preset failed canonical area + under-target presentation");
   const pulseEffects=sel("[data-skill-channeling-effects-host]");
   const damage=pulseEffects.querySelector("[data-skill-effect-amount]");
   if(!damage||Number(damage.value)!==12)
     throw Error("ice spike repeated native damage not configured");
   sel("[data-skill-channel-ice-sprite-jump]").click();
   const travelPicker=sel("[data-skill-travel-fx]");
   const visualPanel=sel("[data-skill-fx-advanced]");
   if(![...travelPicker.options].some(o=>o.value==="pack:capture:sprite-pointe-glace-01"))
     throw Error("official ice spike missing from native Trajet picker");
   travelPicker.value="pack:capture:sprite-pointe-glace-01";
   travelPicker.dispatchEvent(new Event("change",{bubbles:true}));
   if(!visualPanel.open||visualPanel.closest(".card").dataset.collapsed==="true"||
      travelPicker.getClientRects().length===0)
     throw Error("ice sprite shortcut did not display the original Trajet selector: "+
       "advanced="+visualPanel.open+", card="+visualPanel.closest(".card").dataset.collapsed+
       ", rects="+travelPicker.getClientRects().length+
       ", ancestry="+(()=>{let x=travelPicker,chain=[];while(x&&chain.length<14){const st=getComputedStyle(x);chain.push(x.tagName+"."+String(x.className||"").slice(0,50)+"[hidden="+x.hidden+",open="+x.open+",display="+st.display+",rect="+x.getClientRects().length+"]");x=x.parentElement;}return chain.join(">")})());
   form.value="projectile";form.dispatchEvent(new Event("change",{bubbles:true}));
   if(form.value!=="area")throw Error("form guard left invalid projectile + channeling");
   sel("[data-skill-create]").click();
   if(![...library.options].some(o=>o.textContent.includes("Pique de glace")))
     throw Error("native ice spike could not be saved after guided configuration");
   document.body.dataset.channelMineSmoke="pass:channel:native-mine:under-target:filters:ice-spike-saved";
  }catch(e){document.body.dataset.channelMineSmoke="error:"+e.message;}
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
 const html=Buffer.concat(out).toString("utf8"),result=html.match(/data-channel-mine-smoke="([^"]*)"/)?.[1]??"missing";
 if(exit!==0||!result.startsWith("pass:"))throw Error("Channel mine real Chromium "+result+" "+Buffer.concat(errs).toString("utf8").slice(-500));
 console.log(result);
}finally{server.close();}
