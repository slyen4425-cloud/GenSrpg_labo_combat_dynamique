// Live browser gate: render the real Vipfer icon/sprite binaries by their
// canonical global-assets IDs; no fixture substitutions or second visual registry.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,extname,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd(),mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",
 ".json":"application/json",".css":"text/css",".png":"image/png",".webp":"image/webp"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const f=resolve(root,"."+pathname);
  if(!f.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  const bytes=await readFile(f);
  res.writeHead(200,{"Content-Type":mime[extname(f)]??"application/octet-stream"}).end(bytes);
 }catch(err){res.writeHead(404).end(String(err));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
 const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!bin)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+
  "/examples/dom-demo/vipfer-skill-media-preview-20261123.html";
 const chrome=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--no-first-run","--virtual-time-budget=22000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const o=[],e=[];chrome.stdout.on("data",d=>o.push(d));chrome.stderr.on("data",d=>e.push(d));
 const code=await Promise.race([once(chrome,"close").then(([status])=>status),
  new Promise((_,reject)=>{const t=setTimeout(()=>{chrome.kill("SIGKILL");reject(Error("Vipfer real media browser timeout"));},70000);
   t.unref();chrome.once("close",()=>clearTimeout(t))})]);
 const html=Buffer.concat(o).toString("utf8");
 const state=html.match(/data-vipfer-media-smoke="([^"]*)"/)?.[1]??"missing";
 if(code!==0||!state.startsWith("pass:"))throw Error("Vipfer official 5-icon 3-sprite browser gate: "+state+"; err="+
  Buffer.concat(e).toString("utf8").slice(-600));
 console.log("Vipfer real public catalog assets rendered in Chromium:",state);
}finally{server.close();}
