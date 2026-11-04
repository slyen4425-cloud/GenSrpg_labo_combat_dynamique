// Real Chromium proof: official global-assets exposes the approved Golden fox move atlases.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd();
const raw="https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/";
function officialBytes(path){
  const remote=raw+path;
  const p=spawnSync("curl",["--fail","--location","--silent","--show-error",
    "--retry","3","--retry-delay","1","--max-time","45",remote],
    {encoding:null,maxBuffer:22*1024*1024,timeout:90000});
  if(p.error||p.status!==0)throw Error("Official Golden fox media unavailable: "+remote+" "+String(p.stderr||p.error));
  return p.stdout;
}
const catalogBytes=officialBytes("data/assets/catalog/global-visual-assets.v1.json");
const catalog=JSON.parse(catalogBytes.toString("utf8"));
if(catalog.storage?.branch!=="global-assets")throw Error("Catalog authority changed");
const assets={};
for(const view of ["player"]){
  const id="pack:capture:creature-renard-magique-dore-movement-"+view+"-12-v1";
  const hits=catalog.assets.filter(x=>x.id===id);
  if(hits.length!==1)throw Error("Missing/duplicated official Golden fox ID "+id);
  const asset=hits[0];
  const filename="capture/creatures/renard_magique_dore/animations/movement/"+view+
    "/atlases/renard_magique_dore_mouvement_"+(view==="player"?"joueur":"adversaire")+"_12f.webp";
  if(!asset.tags?.includes("attack")||asset.tags?.includes("movement")||!asset.tags?.includes("player")||asset.tags?.includes("opponent"))throw Error("Lumilo player must be attack-only in official catalog");
  if(!/attaque.*joueur/i.test(asset.label))throw Error("Official Lumilo asset label not updated");
  if(asset.resource.file!==filename||asset.resource.frameCount!==12||
      asset.resource.frameMs!==120||
      asset.resource.playbackMode!=="loop")throw Error("Wrong official author metadata: "+id);
  const bytes=officialBytes("assets/library/"+filename);
  if(bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WEBP")
    throw Error("Official atlas is not WebP "+id);
  assets[view]=bytes;
}
const html='<!doctype html><html><body><script type="module">'+
' import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "/src/assets/global-visual-library.js";'+
' import {createGlobalPresentationAssetResolverV1} from "/src/assets/global-presentation-asset-resolver-v1.js";'+
' try {'+
' const res=await fetch("/__catalog",{cache:"no-store"});'+
' if(!res.ok)throw Error("catalog not served"); const data=await res.json();'+
' if(GLOBAL_VISUAL_LIBRARY.revision!=="2026-11-04-v56-lumilo-opponent-attack-12f")throw Error("cache revision wrong");'+
' const fox=data.assets.filter(a=>a.id==="pack:capture:creature-renard-magique-dore-movement-player-12-v1");'+
' if(fox.length!==1||!fox[0].tags.includes("attack")||fox[0].tags.includes("movement"))throw Error("live editor catalog does not classify Lumilo as attack");'+
' const resolveAsset=createGlobalPresentationAssetResolverV1({assetCatalog:data,assetUrlForFile:globalVisualAssetUrl});'+
' for(const view of ["player"]){'+
' const id="pack:capture:creature-renard-magique-dore-movement-"+view+"-12-v1";'+
' const media=resolveAsset(id); if(!media||media.playbackMode!=="loop"||media.frameCount!==12)throw Error("native resolver missed "+id);'+
' if(!media.url.startsWith("https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/"))throw Error("noncanonical URL");'+
' if(!media.url.endsWith("?v="+GLOBAL_VISUAL_LIBRARY.revision))throw Error("stale asset URL");'+
' const img=new Image(); img.src="/__renard/"+view+".webp"; await img.decode();'+
' if(img.naturalWidth!==6144||img.naturalHeight!==512)throw Error("actual atlas dimensions incorrect "+view);'+
' const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512; const ctx=canvas.getContext("2d",{willReadFrequently:true});'+
' for(const idx of [0,5,11]){ctx.clearRect(0,0,512,512);ctx.drawImage(img,idx*512,0,512,512,0,0,512,512);'+
' const p=ctx.getImageData(0,0,512,512).data;let opaque=0;for(let i=3;i<p.length;i+=4)if(p[i]>15)opaque++;'+
' if(opaque<1000)throw Error("real frame empty "+view+" "+idx); }'+
' const node=document.createElement("div");node.style.cssText="width:120px;height:120px;overflow:hidden;";'+
' const sprite=new Image();sprite.src=img.src;sprite.style.cssText="width:1200%;height:120px;max-width:none;display:block;";'+
' node.append(sprite);document.body.append(node);'+
' const anim=sprite.animate([{transform:"translateX(0%)"},{transform:"translateX(-91.6666666667%)"}],'+
' {duration:media.frameCount*media.frameMs,iterations:Infinity,easing:"steps(12,end)"});'+
' if(anim.effect.getTiming().iterations!==Infinity||anim.effect.getTiming().duration!==12*media.frameMs)throw Error("12f authored playback loop changed");'+
' anim.cancel();node.remove();'+
' }'+
' document.body.dataset.renardMediaSmoke="pass:player-12f:official:resolver:alpha:loop";'+
' } catch(e){document.body.dataset.renardMediaSmoke="error:"+String(e.message||e)} finally{await fetch("/__done",{method:"POST"})}'+
' </script></body></html>';
// Hold the browser load event until the module has decoded the real WebP atlas.
// Chromium --dump-dom otherwise snapshots before async image decoding completes.
let released=false;const pending=[];
const tinyGif=Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=","base64");
const unblock=()=>{released=true;for(const response of pending)
  response.writeHead(200,{"Content-Type":"image/gif"}).end(tinyGif);
  pending.length=0;};
const server=createServer(async(req,res)=>{
  try{
    const p=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(p==="/__hold"){
      if(released)return void res.writeHead(200,{"Content-Type":"image/gif"}).end(tinyGif);
      pending.push(res);return;
    }
    if(p==="/__done"){unblock();return void res.writeHead(200).end("ok");}
    if(p==="/__catalog")return void res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(catalogBytes);
    if(p.startsWith("/__renard/")){
      const view=p.slice("/__renard/".length).replace(".webp","");
      if(!assets[view])return void res.writeHead(404).end("Unknown view");
      return void res.writeHead(200,{"Content-Type":"image/webp","Cache-Control":"no-store"}).end(assets[view]);
    }
    if(p==="/"){
      const editor=await readFile(resolve(root,"examples/dom-demo/capture-editor-v2.html"),"utf8");
      const probe=html.slice(html.indexOf("<script type=\"module\">"),html.indexOf("</script>")+9);
      if(!editor.includes("</head>")||!probe.includes("createGlobalPresentationAssetResolverV1"))throw Error("Editor probe fixture missing");
      return void res.writeHead(200,{"Content-Type":"text/html"}).end(editor.replace("</head>",probe+"</head>").replace("</body>",'<img src="/__hold" alt="" style="display:none"></body>'));
    }
    const file=resolve(root,"."+p);
    if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
    const body=await readFile(file);
    res.writeHead(200,{"Content-Type":extname(p)===".js"?"text/javascript":"application/octet-stream"}).end(body);
  }catch(e){res.writeHead(404).end(String(e))}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
  const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .filter(Boolean).find(n=>spawnSync("which",[n]).status===0);
  if(!chrome)throw Error("Chromium is required for true media proof");
  const url="http://127.0.0.1:"+server.address().port+"/";
  const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu",
    "--disable-dev-shm-usage","--no-first-run","--virtual-time-budget=50000","--dump-dom",url],
    {stdio:["ignore","pipe","pipe"]});
  const out=[],err=[];child.stdout.on("data",x=>out.push(x));child.stderr.on("data",x=>err.push(x));
  const exit=await Promise.race([once(child,"close").then(([code])=>code),
    new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Golden fox Chromium timeout"));},85000);t.unref();child.once("close",()=>clearTimeout(t));})]);
  const actual=Buffer.concat(out).toString("utf8");
  const result=actual.match(/data-renard-media-smoke="([^"]*)"/)?.[1]??"missing";
  if(exit!==0||!result.startsWith("pass:"))throw Error("Golden fox real Chromium fail: exit "+exit+" status "+result+
    " stdoutTail "+actual.slice(-700)+" stderrTail "+Buffer.concat(err).toString("utf8").slice(-600));
  console.log("PASS Golden fox player 12f: official catalog, canonical resolver, real WebP, visible frames, loop");
}finally{server.close()}
