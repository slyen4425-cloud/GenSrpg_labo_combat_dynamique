// Isolated Chromium smoke of the actual published mini-preview page.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

const root=process.cwd();
const mime={".js":"text/javascript",".mjs":"text/javascript",".html":"text/html",".css":"text/css",".json":"application/json"};
const probe=`<script>
window.addEventListener("error",e=>document.body.dataset.previewSmoke="error:"+e.message);
window.addEventListener("unhandledrejection",e=>document.body.dataset.previewSmoke="rejection:"+String(e.reason?.message??e.reason));
window.addEventListener("DOMContentLoaded",()=>{
 setTimeout(()=>{
  try{
   const buttons=[...document.querySelectorAll("[data-mini-cast]")];
   if(buttons.length!==2)throw Error("two cast buttons missing");
   const arena=document.querySelector("[data-mini-arena]");
   if(!arena||arena.querySelectorAll("[data-mini-model]").length!==4)throw Error("missing 4 actors");
   const status=document.querySelector("[data-mini-status]");
   if(!status.textContent.includes("Prêt"))throw Error("initialization failed:"+status.textContent);
   buttons[0].click();
   setTimeout(()=>{
    try{
     const shell=arena.querySelector(".skill-fx--expanding-wave");
     if(!shell||shell.dataset.element!=="fire"||shell.dataset.waveMode!=="expanding_wave")throw Error("no real native wave shell");
     if(!status.textContent.includes("Dragon"))throw Error("no native action:"+status.textContent);
     const color=getComputedStyle(shell).getPropertyValue("--tactical-edge");
     if(!color.includes("0.52"))throw Error("author-approved growing wave ring changed:"+color);
     document.body.dataset.previewSmoke="pass:four-models:player-cast:real-native-wave";
    }catch(error){document.body.dataset.previewSmoke="error:"+error.message;}
   },150);
  }catch(error){document.body.dataset.previewSmoke="error:"+error.message;}
 },80);
});
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const filename=resolve(root,"."+path);
  if(!filename.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let data=await readFile(filename);
  if(path.endsWith("/expanding-wave-2v2-preview.html")){
    data=Buffer.from(data.toString("utf8").replace("</body>",probe+"</body>"));
  }
  res.writeHead(200,{"Content-Type":mime[extname(path)]??"application/octet-stream"}).end(data);
 }catch(error){res.writeHead(404).end(String(error));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
 const binary=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!binary)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/expanding-wave-2v2-preview.html";
 const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run","--disable-background-networking","--virtual-time-budget=2500","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const stdout=[],stderr=[];
 child.stdout.on("data",chunk=>stdout.push(chunk));child.stderr.on("data",chunk=>stderr.push(chunk));
 const code=await Promise.race([
  once(child,"close").then(([code])=>code),
  new Promise((_,reject)=>{const timeout=setTimeout(()=>{child.kill("SIGKILL");reject(Error("mini preview timed out"));},40000);timeout.unref();child.once("close",()=>clearTimeout(timeout));})
 ]);
 const dom=Buffer.concat(stdout).toString("utf8");
 const result=dom.match(/data-preview-smoke="([^"]*)"/)?.[1]??"no-result";
 if(code!==0||!result.startsWith("pass:"))throw Error("Real mobile preview Chromium: "+result+"\n"+Buffer.concat(stderr).toString("utf8").slice(-350));
 console.log("Real mini-preview bootstrap passed:",result);
}finally{server.close();}
