// Real Chromium/CDP gate: wait in WALL time until 5 official Vipfer icons and
// 3 approved six-frame atlases are decoded from global-assets. No mock images.
import {createServer} from "node:http";
import {readFile,mkdtemp,rm} from "node:fs/promises";
import {resolve,extname,sep,join} from "node:path";
import {tmpdir} from "node:os";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd(),mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",
 ".json":"application/json",".css":"text/css",".png":"image/png",".webp":"image/webp"};
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  const bytes=await readFile(file);
  res.writeHead(200,{"Content-Type":mime[extname(file)]??"application/octet-stream"}).end(bytes);
 }catch(err){res.writeHead(404).end(String(err));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
const profile=await mkdtemp(join(tmpdir(),"vipfer-real-preview-"));
let chrome=null,ws=null;
try{
 const chromeBin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!chromeBin)throw Error("Chromium required");
 if(typeof WebSocket!=="function")throw Error("Node 22 global WebSocket required for real-time CDP gate");
 const pageUrl="http://127.0.0.1:"+server.address().port+
  "/examples/dom-demo/vipfer-skill-media-preview-20261123.html";
 chrome=spawn(chromeBin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--no-first-run","--remote-debugging-port=9222","--remote-allow-origins=*",
  "--user-data-dir="+profile,pageUrl],{stdio:["ignore","pipe","pipe"]});
 const errorLines=[];
 chrome.stderr.on("data",v=>errorLines.push(v.toString("utf8")));
 let target=null;
 for(let attempt=0;attempt<100;attempt++){
  if(chrome.exitCode!==null)throw Error("Chrome ended "+chrome.exitCode+" "+errorLines.join("").slice(-500));
  try{
   const response=await fetch("http://127.0.0.1:9222/json/list");
   const tabs=await response.json();
   target=tabs.find(x=>x.type==="page"&&x.url.includes("vipfer-skill-media-preview"));
   if(target?.webSocketDebuggerUrl)break;
  }catch{}
  await delay(200);
 }
 if(!target?.webSocketDebuggerUrl)throw Error("CDP real Chrome target not visible: "+errorLines.join("").slice(-500));
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener("open",resolve,{once:true});ws.addEventListener("error",reject,{once:true});
 });
 let id=0;const pending=new Map();
 ws.addEventListener("message",event=>{
  const msg=JSON.parse(String(event.data));const cb=pending.get(msg.id);
  if(cb){pending.delete(msg.id);cb(msg);}
 });
 const evaluate=(expr)=>new Promise((resolve,reject)=>{
  const seq=++id;
  const timeout=setTimeout(()=>{pending.delete(seq);reject(Error("CDP evaluation timeout"));},4000);
  pending.set(seq,msg=>{clearTimeout(timeout);if(msg.error)reject(Error(JSON.stringify(msg.error)));
   else resolve(msg.result?.result?.value);});
  ws.send(JSON.stringify({id:seq,method:"Runtime.evaluate",params:{expression:expr,returnByValue:true}}));
 });
 let last=null;
 for(let i=0;i<100;i++){
  last=await evaluate('({state:document.body?.dataset?.vipferMediaSmoke,status:document.getElementById("status")?.textContent,icons:document.querySelectorAll("#icons img").length,sprites:document.querySelectorAll("#sprites canvas").length})');
  if(last?.state?.startsWith("pass:")){
   if(last.icons!==5||last.sprites!==3)throw Error("Incorrect media count "+JSON.stringify(last));
   console.log("Vipfer real CDN images decoded and six-frame strips rendered:",JSON.stringify(last));
   last=null;break;
  }
  if(last?.state?.startsWith("fail:"))throw Error("Vipfer official CDN preview "+JSON.stringify(last));
  await delay(350);
 }
 if(last)throw Error("Vipfer real CDN preview timed out waiting for remote asset decoding: "+
  JSON.stringify(last)+"; Chrome stderr: "+errorLines.join("").slice(-500));
}finally{
 try{ws?.close();}catch{}
 if(chrome && chrome.exitCode===null && chrome.signalCode===null){
   // Chrome may still be writing its profile after SIGKILL: wait for the
   // actual child process to exit before removing files. Never turn a
   // successful real-media verdict into a false CI failure during cleanup.
   const closed=once(chrome,"close").catch(()=>{});
   try{chrome.kill("SIGKILL");}catch{}
   await Promise.race([closed,delay(4000)]);
 }
 server.close();
 await rm(profile,{recursive:true,force:true,maxRetries:15,retryDelay:200});
}
