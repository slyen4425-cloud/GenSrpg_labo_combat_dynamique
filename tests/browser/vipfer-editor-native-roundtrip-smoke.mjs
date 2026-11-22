// Native Capture editor, real Chromium: open/save/reload Vipfer mechanics without gameplay drift.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",
  ".json":"application/json",".svg":"image/svg+xml",".webp":"image/webp",".png":"image/png"};
const probe=`<script>
window.addEventListener("error",e=>document.body.dataset.vipferEditorSmoke="fail:page:"+e.message);
window.addEventListener("unhandledrejection",e=>document.body.dataset.vipferEditorSmoke="fail:promise:"+String(e.reason));
document.addEventListener("DOMContentLoaded",()=>{
 setTimeout(async ()=>{
  const check=(yes,why)=>{if(!yes)throw Error(why)};
  const one=selector=>document.querySelector(selector);
  const select=one("[data-skill-library-select]");
  const open=id=>{const matches=[...select.options].filter(x=>x.value===id);
   check(matches.length===1,"official Vipfer skill unavailable in native selector "+id);
   select.value=id;select.dispatchEvent(new Event("change",{bubbles:true}));
   check(one("[data-skill-id]")?.value===id,"native skill hydration failed "+id);
  };
  const save=()=>{const id=one("[data-skill-id]").value;
    one("[data-skill-update]").click();
    check(one("[data-skill-library-state]")?.textContent?.includes("sauvegardée"),
      "native skill save rejected "+id+": "+one("[data-combat-live-status]")?.textContent);
    check(select.value===id,"save changed existing stable skill identity");
  };
  try{
   check(select&&one("[data-skill-update]"),"native Capture skill editor not bootstrapped");
   // The showcase loads asynchronously; check the REAL catalog after hydration,
   // rather than assuming all skills exist at DOMContentLoaded.
   for(let attempt=0;attempt<35;attempt++){
     if([...select.options].some(x=>x.value==="vipfer-couronne-eclats"))break;
     await new Promise(resolve=>setTimeout(resolve,250));
   }
   check([...select.options].some(x=>x.value==="vipfer-couronne-eclats"),
     "Vipfer presets unavailable after showcase hydration; "+JSON.stringify({
       options:select.options.length,
       state:one("[data-skill-library-state]")?.textContent,
       live:one("[data-combat-live-status]")?.textContent,
       bootstrap:document.documentElement.dataset.bootstrapError
     }));
   open("vipfer-couronne-eclats");
   check(one("[data-skill-trajectory-mode]").value==="salvo","salvo became direct in native UI");
   check(one("[data-skill-salvo-shots]").value==="3" &&
     one("[data-skill-salvo-shot-ms]").value==="550" &&
     one("[data-skill-salvo-gap-ms]").value==="150","salvo timing mismatch in UI");
   check(!one("[data-skill-salvo-panel]").hidden,"salvo settings not accessible");
   save();
   open("vipfer-mue-tranchante");
   const reflect=one('[data-skill-effects-host] [data-reflection-consume-on-contact]');
   check(reflect?.checked===true,"unique contact retaliation lost on native UI load");
   save();
   open("vipfer-broyeur-serpentin");
   check(one("[data-skill-contact-hold-enabled]")?.checked,
     "ultimate hold disabled in editor");
   check(one("[data-skill-contact-hold-stop-target]")?.checked,
     "ultimate target-sourced release was cleared");
   save();
   open("vipfer-couronne-eclats");
   check(one("[data-skill-trajectory-mode]").value==="salvo" &&
      one("[data-skill-salvo-shots]").value==="3",
      "salvo lost after real native save/reload");
   open("vipfer-mue-tranchante");
   check(one('[data-skill-effects-host] [data-reflection-consume-on-contact]')?.checked,
      "one-use reflection lost after real save/reload");
   open("vipfer-broyeur-serpentin");
   check(one("[data-skill-contact-hold-stop-target]")?.checked,
      "attributed ultimate release lost after real save/reload");
   document.body.dataset.vipferEditorSmoke="pass:salvo:unique-riposte:target-hold:save-reload";
  }catch(e){document.body.dataset.vipferEditorSmoke="fail:"+String(e.stack||e);}
 },1000);
});
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const f=resolve(root,"."+pathname);
  if(!f.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let content=await readFile(f);
  if(pathname.endsWith("/capture-editor-v2.html"))
    content=Buffer.from(content.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(pathname)]??"application/octet-stream"}).end(content);
 }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
 const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
   .filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!bin)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html";
 const child=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
   "--disable-background-networking","--no-first-run","--virtual-time-budget=14000","--dump-dom",url],
   {stdio:["ignore","pipe","pipe"]});
 const out=[],err=[];
 child.stdout.on("data",v=>out.push(v));child.stderr.on("data",v=>err.push(v));
 const code=await Promise.race([once(child,"close").then(([c])=>c),
   new Promise((_,reject)=>{const timer=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Vipfer author Chrome timeout"));},50000);timer.unref();child.once("close",()=>clearTimeout(timer));})]);
 const html=Buffer.concat(out).toString("utf8");
 const result=html.match(/data-vipfer-editor-smoke="([^"]*)"/)?.[1]??"missing";
 if(code!==0||!result.startsWith("pass:"))
   throw Error("Native Vipfer author Chromium: "+result+" "+Buffer.concat(err).toString("utf8").slice(-300));
 console.log("Native Vipfer editor hydration, save, and reload:",result);
}finally{server.close();}
