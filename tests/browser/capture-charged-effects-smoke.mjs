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
   const select=document.querySelector("[data-skill-effect-add-kind]"),add=document.querySelector("[data-skill-effect-add]");
   if(!select||!add||![...select.options].some(x=>x.value==="charged-effects"))throw Error("menu missing");
   document.querySelector("[data-skill-new]").click();
   select.value="charged-effects";add.click();
   const enabled=document.querySelector("[data-skill-charged-effects-enabled]");
   const config=document.querySelector("[data-skill-charged-effects-config]");
   if(!enabled?.checked||config?.hidden||getComputedStyle(config).display==="none")throw Error("charge options hidden");
   const potency=document.querySelector("[data-skill-charged-effects-potency]");
   const max=document.querySelector("[data-skill-charged-effects-max-charges]");
   potency.value="75";max.value="4";
   if(potency.value!=="75"||max.value!=="4")throw Error("charge settings not editable");
   select.value="standard";add.click();
   const row=[...document.querySelectorAll("[data-skill-effects-host] [data-skill-effect-row]")].at(-1);
   if(!row)throw Error("effect row missing");
   const kind=row.querySelector("[data-skill-effect-kind]");kind.value="apply_status";
   kind.dispatchEvent(new Event("change",{bubbles:true}));
   const status=row.querySelector("[data-skill-status-kind]");status.value="incoming_effect_modifier";
   status.dispatchEvent(new Event("change",{bubbles:true}));
   if(row.querySelector('[data-skill-status-config-kind="incoming_effect_modifier"]')?.hidden!==false)
     throw Error("status authoring unavailable");
   enabled.click();
   if(!config.hidden||getComputedStyle(config).display!=="none")throw Error("collapse failed");
   document.body.dataset.chargedEffectsSmoke="pass:real-editor:charge:status";
  }catch(e){document.body.dataset.chargedEffectsSmoke="error:"+e.message;}
 },2000);
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
 const html=Buffer.concat(out).toString("utf8"),result=html.match(/data-charged-effects-smoke="([^"]*)"/)?.[1]??"missing";
 if(exit!==0||!result.startsWith("pass:"))throw Error("Charged effects real Chromium "+result+" "+Buffer.concat(errs).toString("utf8").slice(-500));
 console.log(result);
}finally{server.close();}
