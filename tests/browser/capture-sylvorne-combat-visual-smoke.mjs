// The REAL Combat renderer mounts Sylvorne FACE / DOS from approved original PNG bytes.
// Unlike a catalog-only fixture, this probes [data-demo-image] in the true arena template.
// One run uses the normal collision-mask path; another denies canvas readback to
// prove that a successfully decoded original creature is still visible.
import {createServer} from "node:http";
import {readFile,readFileSync} from "node:fs";
import {resolve,extname,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd();
const transfer=JSON.parse(readFileSync("data/capture/showcase/crea_sylvorne.capture-creature-transfer-v1.json","utf8")).draft;
const binding=transfer.presentation;
const profile=JSON.parse(readFileSync("data/profiles/massive.profile.json","utf8"));
const remoteBase="https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/assets/library/";
const media={
  player:{id:"pack:capture:creature-sylvorne-player-01",name:"sylvorne_dos.png"},
  opponent:{id:"pack:capture:creature-sylvorne-opponent-01",name:"sylvorne_face.png"},
  icon:{id:"pack:capture:creature-sylvorne-icon-01",name:"sylvorne_icone.png"}
};
for(const [role,ref] of Object.entries(media)) {
  const v=binding.visual[role==="player"?"back":role==="opponent"?"front":"icon"];
  if(v?.assetId!==ref.id) throw Error("Author visual binding changed: "+role);
}
const pngs={};
for(const [role,ref] of Object.entries(media)){
  const path="capture/creatures/sylvorne/runtime/"+ref.name;
  const remote=remoteBase+path;
  const request=spawnSync("curl",["--fail","--location","--silent","--show-error",
    "--retry","2","--retry-delay","1","--max-time","35",remote],
    {maxBuffer:3*1024*1024,timeout:90000});
  if(request.status!==0)throw Error("Original Sylvorne image missing: "+remote+" "+request.stderr);
  const bytes=request.stdout;
  if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))
    throw Error("Original Sylvorne image is not PNG: "+remote);
  pngs[role]=bytes;
}
const original=readFileSync("examples/dom-demo/capture-editor-v2.html","utf8");
const template=original.match(/<template data-capture-preview-template>([\s\S]*?)<\/template>/)?.[1];
if(!template?.includes('data-demo-slot="local-1"')||!template.includes('data-demo-slot="opponent-1"'))
  throw Error("Official combat arena actor slots missing");
const script=String.raw`<script type="module">
import {mountCombatDemo} from "/src/ui/demo-app.js";
try {
  const fallback=new URLSearchParams(location.search).has("mask-readback-denied");
  if(fallback){
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(kind,options){
      if(kind==="2d"&&options?.willReadFrequently===true)return null;
      return original.call(this,kind,options);
    };
  }
  const data=await fetch("/__native").then(r=>r.json());
  const stage=document.querySelector("[data-combat-demo]");
  const visuals=await mountCombatDemo({
    root:stage, nativeVisualSource:data,
    fetchImpl:()=>{throw Error("Demo fixtures must not replace Sylvorne")}
  });
  const ids=[["local-1","sylvorne_dos.png"],["opponent-1","sylvorne_face.png"]];
  for(const [id,name] of ids){
    const slot=stage.querySelector('[data-demo-slot="'+id+'"]');
    const img=slot?.querySelector("[data-demo-image]");
    if(!img)throw Error("Real combat image missing from actor "+id);
    await img.decode();
    if(!img.src.includes("/__media/"+(id==="local-1"?"player":"opponent")))
      throw Error("Incorrect SIDE for "+id+": "+img.src);
    if(img.naturalWidth!==512||img.naturalHeight!==512)
      throw Error("Original 512px sprite not decoded for "+id);
    if(img.hidden||getComputedStyle(img).display==="none")
      throw Error("Decoded original "+name+" stays hidden in arena "+id);
    if(slot.dataset.visibleCollisionReady!==(fallback?"false":"true"))
      throw Error("Native alpha mask state mismatch for "+id+": "+slot.dataset.visibleCollisionReady);
    if(!slot.querySelector("[data-demo-shadow]"))
      throw Error("Original actor shadow is missing");
  }
  visuals.dispose();
  document.body.dataset.sylvorneCombatSmoke="pass:real-arena:original-png:face-dos:"+(fallback?"mask-fallback":"mask-native");
}catch(error){
  document.body.dataset.sylvorneCombatSmoke="error:"+String(error.stack||error.message).slice(0,800);
}
</script>`;
const fixture='<!doctype html><html lang="fr"><head><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<link rel="stylesheet" href="/examples/dom-demo/demo.css">'+
 '<link rel="stylesheet" href="/examples/dom-demo/capture-editor-v2.css">'+
 '</head><body data-preview-landscape-active="true">'+
 '<section class="capture-preview-shell" data-capture-preview-shell data-landscape-required="true">'+
 '<div class="capture-preview-host">'+template+'</div></section>'+
 script+'</body></html>';
const mime={".js":"text/javascript",".mjs":"text/javascript",".json":"application/json",
 ".css":"text/css",".html":"text/html"};
let server;
server=createServer((request,response)=>{
  try{
    const url=new URL(request.url,"http://127.0.0.1");
    const path=decodeURIComponent(url.pathname);
    if(path==="/__page")return void response.writeHead(200,{"Content-Type":"text/html"}).end(fixture);
    if(path==="/__native"){
      const base="http://127.0.0.1:"+server.address().port;
      const get=role=>base+"/__media/"+role;
      const meta={
        id:transfer.id,name:transfer.displayName,profile:binding.profileId,
        views:{player:get("player"),opponent:get("opponent"),icon:get("icon")},
        runtimePreview:{player:get("player"),opponent:get("opponent"),icon:get("icon")},
        assetBaseUrl:base+"/",displayScale:{
          player:binding.viewOverrides.player.displayScale,
          opponent:binding.viewOverrides.opponent.displayScale
        },
        offsetByView:{player:binding.viewOverrides.player.position,opponent:binding.viewOverrides.opponent.position},
        transformOrigin:binding.transformOrigin,fxAnchors:{player:{},opponent:{}}
      };
      return void response.writeHead(200,{"Content-Type":"application/json"}).end(
        JSON.stringify({profiles:[profile],creatureMetas:[meta]}));
    }
    if(path.startsWith("/__media/")){
      const bytes=pngs[path.slice("/__media/".length)];
      return bytes?void response.writeHead(200,{"Content-Type":"image/png"}).end(bytes)
       :void response.writeHead(404).end("Unknown original media");
    }
    const target=resolve(root,"."+path);
    if(!target.startsWith(root+sep))return void response.writeHead(403).end("Forbidden");
    readFile(target,(error,bytes)=>{
      if(error)return void response.writeHead(404).end(String(error));
      response.writeHead(200,{"Content-Type":mime[extname(path)]??"application/octet-stream"}).end(bytes);
    });
  }catch(error){response.writeHead(500).end(String(error));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
 .filter(Boolean).find(name=>spawnSync("which",[name]).status===0);
if(!chrome){server.close();throw Error("Real Chromium is required for Sylvorne combat proof");}
try{
  for(const mode of ["mask-native","mask-readback-denied"]){
    const url="http://127.0.0.1:"+server.address().port+"/__page?"+mode;
    const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu",
      "--disable-dev-shm-usage","--no-first-run","--window-size=900,450",
      "--virtual-time-budget=6000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
    const out=[],err=[];child.stdout.on("data",chunk=>out.push(chunk));child.stderr.on("data",chunk=>err.push(chunk));
    const code=await Promise.race([once(child,"close").then(([n])=>n),
      new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Sylvorne combat Chromium timeout"));},55000);
        t.unref();child.once("close",()=>clearTimeout(t));})]);
    const dom=Buffer.concat(out).toString("utf8");
    const state=dom.match(/data-sylvorne-combat-smoke="([^"]*)"/)?.[1]??"no-result";
    if(code!==0||!state.startsWith("pass:"))throw Error("Sylvorne combat "+mode+": "+state+
      " stderr="+Buffer.concat(err).toString("utf8").slice(-400));
    console.log("PASS Sylvorne live combat actor renderer "+mode+": "+state);
  }
}finally{server.close();}
