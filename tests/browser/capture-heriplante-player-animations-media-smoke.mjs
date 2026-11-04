// Real Chrome proof against the ONE published global-assets catalog and both Hériplante player atlases.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {resolve,sep,extname} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd();
const origin="https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/";
function officialBytes(path){
  const url=origin+path;
  const r=spawnSync("curl",["--fail","--location","--silent","--show-error",
    "--retry","3","--retry-delay","2","--max-time","45",url],
    {encoding:null,maxBuffer:20*1024*1024,timeout:100000});
  if(r.error||r.status!==0)throw Error("Official Heriplante media missing "+url+": "+String(r.stderr||r.error));
  return r.stdout;
}
const data=officialBytes("data/assets/catalog/global-visual-assets.v1.json");
const catalog=JSON.parse(data.toString("utf8"));
if(catalog.storage?.branch!=="global-assets"||catalog.counts?.assets!==catalog.assets.length)
  throw Error("Official catalog authority/count broken");
const configs=[
  {action:"attack",frameMs:125,playbackMode:"once"},
  {action:"movement",frameMs:100,playbackMode:"loop"}
];
const imageData={};
for(const item of configs){
  const id="pack:capture:creature-heriplante-"+item.action+"-player-12-v1";
  const asset=catalog.assets.filter(x=>x.id===id);
  if(asset.length!==1)throw Error("Missing/duplicated Heriplante animation "+id);
  const a=asset[0];
  const file="capture/creatures/heriplante/animations/"+item.action+
    "/player/atlases/heriplante_"+item.action+"_player_12f.webp";
  if(a.resource?.file!==file||a.resource?.frameCount!==12||
     a.resource?.frameMs!==item.frameMs||a.resource?.playbackMode!==item.playbackMode||
     !a.tags?.includes(item.action)||!a.tags?.includes("player")||
     a.tags?.includes(item.action==="attack"?"movement":"attack")||
     a.tags?.includes("opponent"))throw Error("Wrong official author catalog metadata "+id);
  const bytes=officialBytes("assets/library/"+file);
  if(bytes.toString("ascii",0,4)!=="RIFF"||bytes.toString("ascii",8,12)!=="WEBP")
    throw Error("Official atlas is not WebP "+id);
  imageData[item.action]=bytes;
}
const probe='<script type="module">'+
' import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "/src/assets/global-visual-library.js";'+
' import {createGlobalPresentationAssetResolverV1} from "/src/assets/global-presentation-asset-resolver-v1.js";'+
' try{'+
' const response=await fetch("/__catalog",{cache:"no-store"});if(!response.ok)throw Error("catalog unavailable");'+
' const catalog=await response.json();'+
' if(!GLOBAL_VISUAL_LIBRARY.revision.includes("v58-heriplante-player-attack-movement-12f"))throw Error("editor catalog revision stale");'+
' const resolveAsset=createGlobalPresentationAssetResolverV1({assetCatalog:catalog,assetUrlForFile:globalVisualAssetUrl});'+
' for(const action of ["attack","movement"]){'+
' const id="pack:capture:creature-heriplante-"+action+"-player-12-v1";'+
' const info=resolveAsset(id); const expected=action==="attack"?125:100;const play=action==="attack"?"once":"loop";'+
' if(!info||info.frameCount!==12||info.frameMs!==expected||info.playbackMode!==play)throw Error("native resolver wrong "+id);'+
' if(!info.url.startsWith("https://raw.githubusercontent.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/global-assets/")||!info.url.endsWith("?v="+GLOBAL_VISUAL_LIBRARY.revision))throw Error("noncanonical media URL "+id);'+
' const img=new Image();img.src="/__media/"+action+".webp"; await img.decode();'+
' if(img.naturalWidth!==6144||img.naturalHeight!==512)throw Error("atlas size wrong "+id);'+
' const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;const ctx=canvas.getContext("2d",{willReadFrequently:true});'+
' let first=null,delta=0;'+
' for(const index of [0,5,11]){ctx.clearRect(0,0,512,512);ctx.drawImage(img,index*512,0,512,512,0,0,512,512);'+
' const pixels=ctx.getImageData(0,0,512,512).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>15)visible++;'+
' if(visible<1000)throw Error("empty published frame "+id+" "+index);'+
' if(index===0)first=new Uint8ClampedArray(pixels);else for(let i=0;i<pixels.length;i+=4)if(pixels[i+3]!==first[i+3]||pixels[i]!==first[i]||pixels[i+1]!==first[i+1]){delta++;break;}'+
' }'+
' if(delta===0)throw Error("published animation has duplicate poses "+id);'+
' const anim=document.createElement("div").animate([{opacity:1},{opacity:0.8}],{duration:info.frameCount*info.frameMs,iterations:play==="loop"?Infinity:1});'+
' if(anim.effect.getTiming().iterations!==(play==="loop"?Infinity:1))throw Error("native playback wrong "+id);anim.cancel();'+
' }'+
' document.body.dataset.heriplanteMediaSmoke="pass:attack-12f-once:movement-12f-loop:official:resolver:alpha";'+
' }catch(e){document.body.dataset.heriplanteMediaSmoke="error:"+String(e.message||e)}finally{await fetch("/__done",{method:"POST"})}'+
'</script>';

let released=false;const pending=[];
const gif=Buffer.from("R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=","base64");
function unblock(){released=true;for(const r of pending)r.writeHead(200,{"Content-Type":"image/gif"}).end(gif);pending.length=0;}
const server=createServer(async(req,res)=>{
  try{
    const uri=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    if(uri==="/__hold"){if(released)return void res.writeHead(200,{"Content-Type":"image/gif"}).end(gif);pending.push(res);return;}
    if(uri==="/__done"){unblock();return void res.writeHead(200).end("ok");}
    if(uri==="/__catalog")return void res.writeHead(200,{"Content-Type":"application/json","Cache-Control":"no-store"}).end(data);
    if(uri.startsWith("/__media/")){
      const kind=uri.slice("/__media/".length).replace(".webp","");
      return void res.writeHead(imageData[kind]?200:404,{"Content-Type":"image/webp","Cache-Control":"no-store"}).end(imageData[kind]||"missing");
    }
    if(uri==="/"){
      const html=await readFile(resolve(root,"examples/dom-demo/capture-editor-v2.html"),"utf8");
      if(!html.includes("</head>")||!html.includes("</body>"))throw Error("Native author page missing");
      const source=html.replace("</head>",probe+"</head>")
        .replace("</body>",'<img src="/__hold" style="display:none" alt=""></body>');
      return void res.writeHead(200,{"Content-Type":"text/html","Cache-Control":"no-store"}).end(source);
    }
    const file=resolve(root,"."+uri);
    if(!file.startsWith(root+sep))return void res.writeHead(403).end("forbidden");
    const bytes=await readFile(file);
    res.writeHead(200,{"Content-Type":extname(uri)===".js"?"text/javascript":"application/octet-stream"}).end(bytes);
  }catch(e){res.writeHead(404).end(String(e.message||e))}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
  const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .filter(Boolean).find(x=>spawnSync("which",[x]).status===0);
  if(!chrome)throw Error("Chromium unavailable: cannot certify actual sprite rendering");
  const url="http://127.0.0.1:"+server.address().port+"/";
  const p=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
    "--no-first-run","--virtual-time-budget=50000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
  const stdout=[],stderr=[];
  p.stdout.on("data",x=>stdout.push(x));p.stderr.on("data",x=>stderr.push(x));
  const code=await Promise.race([once(p,"close").then(([code])=>code),
    new Promise((_,reject)=>{const t=setTimeout(()=>{p.kill("SIGKILL");reject(Error("Chromium timeout"));},85000);
      t.unref();p.once("close",()=>clearTimeout(t));})]);
  const dom=Buffer.concat(stdout).toString("utf8");
  const outcome=dom.match(/data-heriplante-media-smoke="([^"]*)"/)?.[1]??"missing";
  if(code!==0||!outcome.startsWith("pass:"))
    throw Error("Real Hériplante editor Chromium failed: "+outcome+" exit="+code+
      " domTail="+dom.slice(-500)+" stderrTail="+Buffer.concat(stderr).toString("utf8").slice(-600));
  console.log("PASS Heriplante player attack 12f once + movement 12f loop: official catalog, native resolver, real WebP, visible distinct poses");
}finally{unblock();server.close()}
