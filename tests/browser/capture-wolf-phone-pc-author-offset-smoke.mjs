// Real Chromium: the official Loup volcanique Y+60 author override must place
// the SAME visible creature and shadow at the same normalized height on phone
// and PC. Uses the actual Capture template, CSS and mountCombatDemo renderer.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
import {resolve,sep,extname} from "node:path";
const root=process.cwd();
const html=await readFile("examples/dom-demo/capture-editor-v2.html","utf8");
const tpl=html.match(/<template data-capture-preview-template>([\s\S]*?)<\/template>/)?.[1];
if(!tpl?.includes('data-demo-slot="opponent-1"'))throw Error("real editor template unavailable");
const script=String.raw`<script type="module">
import {mountCombatDemo} from "/src/ui/demo-app.js";
let demo=null;
try {
  const [transfer,profile]=await Promise.all([
    fetch("/data/capture/showcase/crea-loup.capture-creature-transfer-v1.json").then(r=>r.json()),
    fetch("/data/profiles/quadruped.profile.json").then(r=>r.json())
  ]);
  const source=transfer.draft.presentation;
  if(transfer.draft.displayName!=="Loup volcanique" ||
     source.viewOverrides.opponent.position.y!==60 ||
     source.viewOverrides.player.position.y!==0)
    throw Error("official Loup author Y+60/0 modified");
  const svg="data:image/svg+xml,"+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><path d="M8 84L12 40 37 22 62 27 85 70 81 86 72 86 65 60 38 57 27 86 19 86Z" fill="#a43"/></svg>');
  const wolf={id:transfer.draft.id,name:transfer.draft.displayName,
    profile:source.profileId,assetBaseUrl:location.origin+"/",
    views:{player:svg,opponent:svg},
    runtimePreview:{player:svg,opponent:svg},
    displayScale:{
      player:source.viewOverrides.player.displayScale,
      opponent:source.viewOverrides.opponent.displayScale
    },
    offsetByView:{
      player:source.viewOverrides.player.position,
      opponent:source.viewOverrides.opponent.position
    }};
  const scene=document.querySelector("[data-combat-demo]");
  demo=await mountCombatDemo({root:scene,
    nativeVisualSource:{profiles:[profile],creatureMetas:[wolf]}});
  const arena=document.querySelector("[data-combat-arena]");
  const count=Number(arena.dataset.combatActiveCount);
  if(Math.abs(arena.getBoundingClientRect().width/arena.getBoundingClientRect().height-16/9)>.015)
    throw Error("real combat arena no longer 16:9");
  // Full CSS and WAAPI settling; no fabricated final position is injected.
  for(let n=0;n<45;n++){
    const foe=document.querySelector('[data-demo-slot="opponent-1"]');
    const hero=document.querySelector('[data-demo-slot="local-1"]');
    const s=Number.parseFloat(getComputedStyle(arena).getPropertyValue("--combat-arena-author-offset-scale"));
    if(foe.dataset.visibleCollisionReady==="true" &&
       hero.dataset.visibleCollisionReady==="true" &&
       Number.isFinite(s) && s>.05)break;
    await new Promise(res=>setTimeout(res,50));
  }
  const bounds=arena.getBoundingClientRect();
  const scale=Number.parseFloat(getComputedStyle(arena).getPropertyValue("--combat-arena-author-offset-scale"));
  if(!Number.isFinite(scale)||Math.abs(scale-bounds.height/400)>.005)
    throw Error("arena does not own its position scale "+scale+" H="+bounds.height);
  const data={count,arena:[bounds.width,bounds.height],slots:{},scale};
  for(const id of ["local-1","opponent-1"]){
    const node=document.querySelector('[data-demo-slot="'+id+'"]');
    const motion=node.querySelector("[data-demo-motion]");
    const rect=motion.getBoundingClientRect();
    const offset=demo.getRestingOffsetFor(id);
    data.slots[id]={
      x:(rect.left+rect.width/2-bounds.left)/bounds.width,
      y:(rect.top+rect.height/2-bounds.top)/bounds.height,
      foot:(rect.bottom-bounds.top)/bounds.height,
      width:rect.width/bounds.height,
      authorY:offset.y/bounds.height,
      transform:getComputedStyle(motion).transform
    };
  }
  if(Math.abs(data.slots["opponent-1"].authorY-.15)>.004 ||
     Math.abs(data.slots["local-1"].authorY)>.0001)
    throw Error("wolf +60 authored Y does not occupy 15% of native arena: "+JSON.stringify(data.slots));
  document.body.dataset.wolfPhonePcProbe=encodeURIComponent(JSON.stringify(data));
}catch(e){
  document.body.dataset.wolfPhonePcProbe="error:"+encodeURIComponent(e.stack||e.message);
}finally{demo?.dispose();}
</script>`;
const page=[
  "<!doctype html><html><head><meta charset='utf-8'>",
  "<meta name='viewport' content='width=device-width,initial-scale=1'>",
  "<link rel='stylesheet' href='/examples/dom-demo/demo.css'>",
  "<link rel='stylesheet' href='/examples/dom-demo/capture-editor-v2.css'>",
  "</head><body data-preview-landscape-active='true'>",
  '<section class="capture-preview-shell" data-capture-preview-shell data-landscape-required="true">',
  '<div class="capture-preview-host">',tpl,'</div></section>',script,
  "</body></html>"
].join("\n");
const mime={".css":"text/css",".html":"text/html",".js":"text/javascript",".json":"application/json",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/__wolf_author_parity__"){
      const count=url.searchParams.get("count");
      if(!["1","2"].includes(count))throw Error("invalid active count");
      const key='class="arena arena--coop-2v2" data-combat-arena';
      if(!page.includes(key))throw Error("native arena selector absent");
      res.writeHead(200,{"Content-Type":"text/html"}).end(page.replace(key,key+' data-combat-active-count="'+count+'"'));
      return;
    }
    const path=resolve(root,"."+decodeURIComponent(url.pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403).end("Forbidden");return;}
    const bytes=await readFile(path);
    res.writeHead(200,{"Content-Type":mime[extname(path)]??"application/octet-stream"}).end(bytes);
  }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
const binary=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
 .filter(Boolean).find(x=>spawnSync("which",[x]).status===0);
if(!binary){server.close();throw Error("Real Chromium required");}
async function probe(width,height,count){
  const url="http://127.0.0.1:"+server.address().port+"/__wolf_author_parity__?count="+count;
  const c=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
    "--no-first-run","--window-size="+width+","+height,"--virtual-time-budget=7000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
  const stdout=[],stderr=[];c.stdout.on("data",x=>stdout.push(x));c.stderr.on("data",x=>stderr.push(x));
  const status=await Promise.race([once(c,"close").then(([x])=>x),
    new Promise((_,reject)=>{const t=setTimeout(()=>{c.kill("SIGKILL");reject(Error("browser timeout"));},45000);t.unref();c.once("close",()=>clearTimeout(t));})]);
  const out=Buffer.concat(stdout).toString("utf8");
  const result=out.match(/data-wolf-phone-pc-probe="([^"]+)"/)?.[1];
  if(status!==0 || !result || result.startsWith("error:"))
    throw Error("native wolf "+width+"x"+height+" count="+count+": "+(result?decodeURIComponent(result):Buffer.concat(stderr).toString("utf8").slice(-800)));
  return JSON.parse(decodeURIComponent(result));
}
try{
  for(const count of [1,2]){
    const phone=await probe(920,490,count),pc=await probe(1920,1080,count);
    for(const id of ["local-1","opponent-1"])
      for(const metric of ["x","y","foot","width","authorY"])
        if(Math.abs(phone.slots[id][metric]-pc.slots[id][metric])>.018)
          throw Error("wolf "+count+" active "+id+" "+metric+" phone "+phone.slots[id][metric]+" PC "+pc.slots[id][metric]);
    console.log("PASS ACTUAL authored wolf Y+60 and real body/shadow positioning phone/PC",count,"active",JSON.stringify({phone:phone.arena,pc:pc.arena,foeY:[phone.slots["opponent-1"].y,pc.slots["opponent-1"].y],foeFoot:[phone.slots["opponent-1"].foot,pc.slots["opponent-1"].foot]}));
  }
}finally{server.close();}
