// Real Chromium boot of the unmodified Combat Lab author page, not a fake tab UI.
import {createServer} from "node:http";
import {readFile} from "node:fs";
import {resolve,extname,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd();
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".mjs":"text/javascript; charset=utf-8",".json":"application/json",
 ".css":"text/css; charset=utf-8",".webp":"image/webp"};
const probe=`<script>
document.addEventListener('DOMContentLoaded',()=>{
 const requested=new URLSearchParams(location.search).get('tab')||'creature';
 setTimeout(()=>{
  const root=document.querySelector('[data-capture-editor-human]');
  const tab=root?.querySelector('[data-editor-tab="'+requested+'"]');
  const panel=root?.querySelector('[data-editor-panel="'+requested+'"]');
  const active=[...root?.querySelectorAll('[data-editor-tab][data-active="true"]')||[]];
  const visible=[...root?.querySelectorAll('[data-editor-panel]:not([hidden])')||[]];
  const correct=tab?.dataset.active==='true'&&panel?.hidden===false&&
   active.length===1&&active[0]===tab&&visible.length===1&&visible[0]===panel;
  document.body.dataset.labAuthorTabResult=correct?'pass:'+requested:
   'fail:'+requested+':'+active.map(t=>t.dataset.editorTab).join(',')+
   ':'+visible.map(p=>p.dataset.editorPanel).join(',');
 },1100);
});
</script>`;
const server=createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
 const file=resolve(root,"."+pathname);
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 readFile(file,(error,bytes)=>{
  if(error){res.writeHead(404).end("Not found");return;}
  let out=bytes;
  if(pathname.endsWith("/capture-editor-v2.html"))
   out=Buffer.from(bytes.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(file)]||"application/octet-stream"}).end(out);
 });
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
 const binary=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
   .filter(Boolean).find(c=>spawnSync("which",[c]).status===0);
 if(!binary)throw Error("Chromium is required for native Lab editor deep-link");
 const origin="http://127.0.0.1:"+server.address().port;
 for(const tab of ["creature","skills","combat"]){
  const url=origin+"/examples/dom-demo/capture-editor-v2.html?tab="+tab;
  const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
   "--no-first-run","--disable-background-networking","--virtual-time-budget=5000","--dump-dom",url],
   {stdio:["ignore","pipe","pipe"]});
  const output=[],errors=[];
  child.stdout.on("data",data=>output.push(data));
  child.stderr.on("data",data=>errors.push(data));
  const code=await Promise.race([
   once(child,"close").then(([value])=>value),
   new Promise((_,reject)=>{
    const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Lab author tab Chromium timeout: "+tab));},45000);
    t.unref();child.once("close",()=>clearTimeout(t));
   })
  ]);
  const dom=Buffer.concat(output).toString("utf8");
  const outcome=dom.match(/data-lab-author-tab-result="([^"]*)"/)?.[1]??"no-result";
  if(code!==0||outcome!=="pass:"+tab)
   throw Error("Real Lab author tab "+tab+": "+outcome+" / "+Buffer.concat(errors).toString("utf8").slice(-350));
  console.log("Official Lab native author tab passed",tab);
 }
}finally{server.close();}
