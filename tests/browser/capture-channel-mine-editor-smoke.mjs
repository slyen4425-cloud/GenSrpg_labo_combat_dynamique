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
   if(library.options.length>1){
     const selected=library.value;
     const ice=filters.find(f=>f.parentElement?.contains(library));
     const iceOption=[...ice.options].find(x=>x.value==="ice");
     if(iceOption){ice.value="ice";ice.dispatchEvent(new Event("change",{bubbles:true}));
       if(library.value!==selected)throw Error("filter discarded selected ability");}
   }
   document.body.dataset.channelMineSmoke="pass:channel:native-mine:under-target:filters";
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
