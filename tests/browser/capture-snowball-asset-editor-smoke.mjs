// Real Chromium: published Capture editor selects and loads all 3 physical snowball atlases.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd(), mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe = `<script type="module">
import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js";
const roles={cast:"[data-skill-cast-fx]",projectile:"[data-skill-travel-fx]",impact:"[data-skill-impact-fx]"};
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
try {
 const response=await fetch(GLOBAL_VISUAL_LIBRARY.catalogUrl,{cache:"no-store"});
 if(!response.ok)throw Error("canonical global-assets catalog HTTP "+response.status);
 const catalog=await response.json();
 if(catalog.storage?.branch!=="global-assets")throw Error("wrong catalog authority");
 for(const [role,selector] of Object.entries(roles)){
   const id="pack:capture:sprite-boule-de-neige-"+role+"-01";
   const matches=catalog.assets.filter(asset=>asset.id===id);
   if(matches.length!==1)throw Error("canonical asset count "+id+": "+matches.length);
   const asset=matches[0];
   if(asset.resource?.frameCount!==12||asset.resource?.format!=="sprite-strip"||asset.resource?.mime!=="image/webp")
     throw Error("invalid sprite strip "+id);
   let picker,found=false;
   for(let n=0;n<65;n++){
      picker=document.querySelector(selector);
      if(picker&&[...picker.options].some(option=>option.value===id)){found=true;break;}
      await delay(250);
   }
   if(!found)throw Error("real editor missing sprite selector "+id);
   picker.value=id;picker.dispatchEvent(new Event("change",{bubbles:true}));
   if(picker.value!==id)throw Error("not selectable "+id);
   const img=new Image();
   await new Promise((ok,fail)=>{
     const timeout=setTimeout(()=>fail(Error("atlas timeout "+id)),18000);
     img.onload=()=>{clearTimeout(timeout);ok();};
     img.onerror=()=>{clearTimeout(timeout);fail(Error("published WebP load error "+id));};
     img.src=globalVisualAssetUrl(asset.resource.file);
   });
   if(img.naturalWidth!==6144||img.naturalHeight!==512)
     throw Error("incorrect atlas geometry "+id+" "+img.naturalWidth+"x"+img.naturalHeight);
 }
 document.body.dataset.snowballAssetsSmoke="pass:canonical:3-pickers:3-webp:6144x512";
}catch(error){document.body.dataset.snowballAssetsSmoke="error:"+String(error.message??error);}
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+pathname);
  if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let body=await readFile(file);
  if(pathname.endsWith("/capture-editor-v2.html"))
   body=Buffer.from(body.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(pathname)]??"application/octet-stream"}).end(body);
 }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
 const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"].filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
 if(!bin)throw Error("Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html";
 const child=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
   "--no-first-run","--virtual-time-budget=30000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const out=[],errors=[];
 child.stdout.on("data",c=>out.push(c));child.stderr.on("data",c=>errors.push(c));
 const exit=await Promise.race([once(child,"close").then(([code])=>code),
  new Promise((_,reject)=>{const timer=setTimeout(()=>{child.kill("SIGKILL");reject(Error("snowball browser probe timed out"));},65000);timer.unref();child.once("close",()=>clearTimeout(timer));})]);
 const html=Buffer.concat(out).toString("utf8");
 const result=html.match(/data-snowball-assets-smoke="([^"]*)"/)?.[1]??"missing";
 if(exit!==0||!result.startsWith("pass:"))
  throw Error("Snowball real Chromium browser: "+result+"; "+Buffer.concat(errors).toString("utf8").slice(-600));
 console.log("Snowball editor browser: "+result);
}finally{server.close();}
