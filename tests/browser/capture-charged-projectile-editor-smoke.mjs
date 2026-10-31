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
      const effectChoice=document.querySelector("[data-skill-effect-add-kind]");
      const effectButton=document.querySelector("[data-skill-effect-add]");
      if(!effectChoice||!effectButton||!effectChoice.closest("article")?.textContent.includes("Effets tactiques"))
        throw Error("charged must be offered from tactical effects > add effect");
      effectChoice.value="charged";effectButton.click();
      if(!enabled.checked||settings.hidden||getComputedStyle(settings).display==="none"||
          document.querySelector("[data-skill-form]").value!=="projectile")
        throw Error("adding charged effect did not expose one projectile configuration");
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
const castProbe=`<script type="module">
import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
try {
  const arena=document.createElement("div"),anchor=document.createElement("div");
  arena.style.cssText="position:absolute;left:0;top:0;width:400px;height:200px";
  anchor.style.cssText="position:absolute;left:30px;top:40px;width:50px;height:50px";
  arena.append(anchor);document.body.append(arena);
  const pixel="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
  const fx=createDomSkillFxRenderer({arena,anchors:{player:anchor},
    presentationForSkill:()=>({cast:{url:pixel,displayScale:1}})});
  const playback=fx.play({type:"cast",skillId:"charged-test",actorSlot:"player",
    durationMs:5000,sizeMultiplier:1});
  const sprite=arena.querySelector('[data-skill-fx="cast"]');
  if(!sprite||sprite.style.scale!=="1")throw Error("initial cast sprite missing");
  if(!playback.setSizeMultiplier?.(1.1)||sprite.style.scale!=="1.1")
    throw Error("first charge not scaled during cast");
  if(!playback.setSizeMultiplier?.(1.2)||sprite.style.scale!=="1.2"||
      arena.querySelectorAll('[data-skill-fx="cast"]').length!==1)
    throw Error("cast restarted or second charge scale incorrect");
  if(getComputedStyle(sprite).scale!=="1.2")
    throw Error("real Chromium render does not compose charge scale");
  document.body.dataset.chargedCastSmoke="pass:cast:1.0:1.1:1.2:one-sprite";
  fx.cancelAll();arena.remove();
}catch(e){document.body.dataset.chargedCastSmoke="error:"+e.message;}
</script>`;
const server=createServer(async(req,res)=>{
 try {
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let content=await readFile(file);
  if(pathname.endsWith("/capture-editor-v2.html"))
    content=Buffer.from(content.toString("utf8").replace("</head>",probe+castProbe+"</head>"));
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
 const castResult=html.match(/data-charged-cast-smoke="([^"]*)"/)?.[1]??"missing";
 if(code!==0||!result.startsWith("pass:")||!castResult.startsWith("pass:"))
   throw Error("Real charged editor/cast Chromium smoke failed: "+result+" / "+castResult+"\n"+Buffer.concat(stderr).toString("utf8").slice(-500));
 console.log("Real charged author editor:",result);
 console.log("Real charged cast scale:",castResult);
}finally{server.close();}
