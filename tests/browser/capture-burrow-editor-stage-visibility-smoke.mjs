// Real Chromium test of the actual public skill editor, not mock controls.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
import {resolve,sep,extname} from "node:path";

const root=process.cwd();
const probe=String.raw`<script type="module">
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
try{
 const library=document.querySelector("[data-skill-library-select]");
 const stage=document.querySelector("[data-burrow-stage-fields]");
 const movement=stage?.closest(".card");
 const approach=document.querySelector("[data-skill-approach]");
 if(!library||!stage||!movement||!approach)throw Error("native controls not present");
 let loaded=false;
 for(let n=0;n<100;n++){
   if([...library.options].some(opt=>opt.value==="attaque-sous-terraine")){loaded=true;break;}
   await sleep(200);
 }
 if(!loaded)throw Error("published underground skill not listed in library");
 const selectUnderground=()=>{
   library.value="attaque-sous-terraine";
   library.dispatchEvent(new Event("change",{bubbles:true}));
 };
 selectUnderground();
 if(approach.value!=="burrow")throw Error("imported skill lost burrow approach");
 if(stage.hidden)throw Error("burrow sprite stage fields are hidden after skill selection");
 if(movement.dataset.collapsed==="true")throw Error("Movement card still collapsed after skill selection");
 if(movement.querySelector("[data-editor-card-toggle]")?.getAttribute("aria-expanded")!=="true")
   throw Error("Movement disclosure accessibility state did not follow expansion");
 const sizes=["start","travel","impact"].map(x=>Number(document.querySelector("[data-burrow-"+x+"-scale]").value));
 const y=["start","travel","impact"].map(x=>Number(document.querySelector("[data-burrow-"+x+"-y]").value));
 if(JSON.stringify(sizes)!=="[1.5,1.5,1]"||JSON.stringify(y)!=="[-25,-50,0]")
   throw Error("authored stages damaged "+JSON.stringify({sizes,y}));
 if(getComputedStyle(stage).display==="none")throw Error("sprite stages hidden in real CSS");
 document.querySelector("[data-skill-new]").click();
 if(stage.hidden===false||approach.value!=="none")throw Error("new skill retains previous underground stage");
 if(Number(document.querySelector("[data-burrow-start-scale]").value)!==1)
   throw Error("new skill inherited old authored stage scale");
 selectUnderground();
 if(stage.hidden||Number(document.querySelector("[data-burrow-impact-scale]").value)!==1)
   throw Error("reselected underground skill lost its sprite stages");
 // The second author skill now also uses the underground approach, with WATER
 // visual assets rather than the three built-in earth animations.
 if(![...library.options].some(opt=>opt.value==="cap_water_atk_2"))
   throw Error("Morsure de marée missing from the active library");
 library.value="cap_water_atk_2";
 library.dispatchEvent(new Event("change",{bubbles:true}));
 if(approach.value!=="burrow"||stage.hidden)
   throw Error("Morsure de marée underground settings are hidden");
 const actualAssets=["start","travel","impact"].map(x=>document.querySelector("[data-burrow-"+x+"-asset]").value);
 const expectedAssets=["pack:capture:sprite-pressurized-jet-impact-01","pack:capture:sprite-cast-water-01","burrow:impact"];
 if(JSON.stringify(actualAssets)!==JSON.stringify(expectedAssets))
   throw Error("Morsure de marée author sprites lost "+JSON.stringify(actualAssets));
 const waterSizes=["start","travel","impact"].map(x=>Number(document.querySelector("[data-burrow-"+x+"-scale]").value));
 if(JSON.stringify(waterSizes)!=="[1.2,1.2,1]")
   throw Error("Morsure de marée scales modified "+JSON.stringify(waterSizes));
 document.body.dataset.burrowEditorProbe="pass:two-author-skills:underground-stages:new:reloaded";
}catch(error){document.body.dataset.burrowEditorProbe="fail:"+String(error.stack??error.message??error);}
</script>`;
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json",".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,"http://localhost").pathname;
  const filename=resolve(root,"."+decodeURIComponent(path));
  if(!filename.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  let content=await readFile(filename);
  if(path.endsWith("/capture-editor-v2.html"))
    content=Buffer.from(content.toString("utf8").replace("</head>",probe+"</head>"));
  res.writeHead(200,{"Content-Type":mime[extname(filename)]??"application/octet-stream","Cache-Control":"no-store"}).end(content);
 }catch(e){res.writeHead(404).end("Not found");}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
 const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .filter(Boolean).find(bin=>spawnSync("which",[bin]).status===0);
 if(!chrome)throw Error("Real Chromium required");
 const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html?tab=skills";
 const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
  "--no-first-run","--virtual-time-budget=28000","--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
 const output=[],errors=[];child.stdout.on("data",x=>output.push(x));child.stderr.on("data",x=>errors.push(x));
 const exit=await Promise.race([once(child,"close").then(([code])=>code),
  new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Burrow editor Chromium timeout"));},65000);t.unref();child.once("close",()=>clearTimeout(t));})]);
 const html=Buffer.concat(output).toString("utf8");
 const actual=html.match(/data-burrow-editor-probe="([^"]+)"/)?.[1]??"missing";
 if(exit!==0||!actual.startsWith("pass:"))
  throw Error("Real underground editor "+actual+" / "+Buffer.concat(errors).toString("utf8").slice(-450));
 console.log("PASS native editor underground stages: "+actual);
}finally{server.close();}
