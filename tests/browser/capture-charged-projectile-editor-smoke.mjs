// Headless Chromium smoke: actual Capture author editor, charge settings and disclosure.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe=`<script>
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    try {
      const field=s=>document.querySelector("[data-skill-charged-"+s+"]");
      const enabled=field("enabled"),settings=field("config");
      if(!enabled||!settings||!field("base-damage")||!field("bonus-damage")||!field("max-charges")||
        !field("window")||!field("size-pct"))throw Error("charged author controls absent");
      if(enabled.checked||!settings.hidden||getComputedStyle(settings).display!=="none")
        throw Error("optional charged controls should start collapsed");
      enabled.click();
      if(!enabled.checked||settings.hidden||getComputedStyle(settings).display==="none")
        throw Error("native author toggle did not expose settings");
      field("base-damage").value="7";
      field("bonus-damage").value="3";
      field("max-charges").value="4";
      field("window").value="400";
      field("size-pct").value="15";
      if(field("max-charges").value!=="4"||field("size-pct").value!=="15")
        throw Error("settings are not author-editable");
      enabled.click();
      if(!settings.hidden||getComputedStyle(settings).display!=="none")
        throw Error("charge controls did not collapse");
      document.body.dataset.chargedEditorSmoke="pass:real-editor:toggle:timing:values";
    }catch(e){document.body.dataset.chargedEditorSmoke="error:"+e.message;}
  },1300);
});
</script>`;
const server=createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let content=await readFile(file);
  if(pathname.endsWith("/capture-editor-v2.html"))
    content=Buffer.from(content.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(pathname)]??"application/octet-stream"}).end(content);
 }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try {
 const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!bin)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html";
 const child=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run","--disable-background-networking","--virtual-time-budget=7000","--dump-dom",url],
  {stdio:["ignore","pipe","pipe"]});
 const stdout=[],stderr=[];
 child.stdout.on("data",c=>stdout.push(c));
 child.stderr.on("data",c=>stderr.push(c));
 const code=await Promise.race([
   once(child,"close").then(([code])=>code),
   new Promise((_,reject)=>{const timer=setTimeout(()=>{child.kill("SIGKILL");reject(Error("editor smoke timed out"));},40000);timer.unref();child.once("close",()=>clearTimeout(timer));})
 ]);
 const html=Buffer.concat(stdout).toString("utf8");
 const result=html.match(/data-charged-editor-smoke="([^"]*)"/)?.[1]??"missing";
 if(code!==0||!result.startsWith("pass:"))
   throw Error("Real charged editor Chromium smoke failed: "+result+"\n"+Buffer.concat(stderr).toString("utf8").slice(-300));
 console.log("Real charged author editor:",result);
}finally{server.close();}
