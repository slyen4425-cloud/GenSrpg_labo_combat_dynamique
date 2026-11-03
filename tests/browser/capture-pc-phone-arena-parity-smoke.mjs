// Real Chromium / real author editor combat template / the two existing CSS owners.
// Compare the PHONE composition to desktop without mocking creature positioning.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
import {resolve,sep,extname} from "node:path";

const root=process.cwd();
const original=await readFile("examples/dom-demo/capture-editor-v2.html","utf8");
const template=original.match(/<template data-capture-preview-template>([\s\S]*?)<\/template>/)?.[1];
if(!template?.includes('data-demo-slot="opponent-1"'))throw Error("real preview template missing");
const browserScript=[
  '<script>',
  'try {',
  'const count=new URLSearchParams(location.search).get("count");',
  'const arena=document.querySelector("[data-combat-arena]");',
  'arena.dataset.combatActiveCount=count;',
  'const bounding=arena.getBoundingClientRect();',
  'if(Math.abs(bounding.width/bounding.height-16/9)>.01)throw Error("native arena not 16:9");',
  'const ids=count==="2"?["local-1","local-2","opponent-1","opponent-2"]:["local-1","opponent-1"];',
  'const result={count,arena:[bounding.width,bounding.height],slots:{}};',
  'for(const id of ids){',
  'const node=arena.querySelector("[data-demo-slot="+JSON.stringify(id)+"]");',
  'if(!node)throw Error("missing native slot "+id);',
  'const rect=node.getBoundingClientRect();',
  'const motion=node.querySelector("[data-demo-motion]").getBoundingClientRect();',
  'result.slots[id]={width:parseFloat(getComputedStyle(node).width)/bounding.height,',
  '  centerX:(rect.left+rect.width/2-bounding.left)/bounding.width,',
  '  centerY:(rect.top+rect.height/2-bounding.top)/bounding.height,',
  '  footY:(motion.bottom-bounding.top)/bounding.height};',
  '}',
  'document.body.dataset.proportionProbe=encodeURIComponent(JSON.stringify(result));',
  '}catch(error){document.body.dataset.proportionProbe="error:"+encodeURIComponent(error.stack||error.message);}',
  '</script>'
].join("\n");
const fixture=[
  '<!doctype html><html><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<link rel="stylesheet" href="/examples/dom-demo/demo.css">',
  '<link rel="stylesheet" href="/examples/dom-demo/capture-editor-v2.css">',
  '</head><body data-preview-landscape-active="true">',
  '<section class="capture-preview-shell" data-capture-preview-shell data-landscape-required="true">',
  '<div class="capture-preview-host">',template,'</div></section>',
  browserScript,'</body></html>'
].join("\n");
const mime={".css":"text/css",".js":"text/javascript",".json":"application/json",".html":"text/html",".svg":"image/svg+xml"};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/__arena_parity__"){
      res.writeHead(200,{"Content-Type":"text/html"}).end(fixture);return;
    }
    const filepath=resolve(root,"."+decodeURIComponent(url.pathname));
    if(!filepath.startsWith(root+sep)){res.writeHead(403).end("Forbidden");return;}
    const bytes=await readFile(filepath);
    res.writeHead(200,{"Content-Type":mime[extname(filepath)]??"application/octet-stream"}).end(bytes);
  }catch(error){res.writeHead(404).end(String(error));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .filter(Boolean).find(bin=>spawnSync("which",[bin]).status===0);
if(!chrome){server.close();throw Error("real Chromium is required for viewport parity");}
async function measure(width,height,count){
  const url="http://127.0.0.1:"+server.address().port+"/__arena_parity__?count="+count;
  const args=["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
    "--no-first-run","--window-size="+width+","+height,"--virtual-time-budget=1800","--dump-dom",url];
  const proc=spawn(chrome,args,{stdio:["ignore","pipe","pipe"]});
  const stdout=[],stderr=[];
  proc.stdout.on("data",chunk=>stdout.push(chunk));
  proc.stderr.on("data",chunk=>stderr.push(chunk));
  const exit=await Promise.race([
    once(proc,"close").then(([code])=>code),
    new Promise((_,reject)=>{const timeout=setTimeout(()=>{
      proc.kill("SIGKILL");reject(Error("Chromium viewport timeout"));
    },45000);timeout.unref();proc.once("close",()=>clearTimeout(timeout));})
  ]);
  const html=Buffer.concat(stdout).toString("utf8");
  const encoded=html.match(/data-proportion-probe="([^"]+)"/)?.[1];
  if(exit!==0||!encoded||encoded.startsWith("error:"))
    throw Error("native arena browser "+width+"x"+height+" count="+count+
      " "+(encoded??Buffer.concat(stderr).toString("utf8").slice(-400)));
  return JSON.parse(decodeURIComponent(encoded));
}
const expected1={"local-1":0.29,"opponent-1":0.31};
const expected2={"local-1":0.29,"local-2":0.27,"opponent-1":0.24,"opponent-2":0.23};
try{
  for(const count of [1,2]){
    const phone=await measure(900,400,count); // representative phone landscape, 20:9
    const pc=await measure(1920,1080,count);
    const expected=count===1?expected1:expected2;
    for(const [id,expectedSize] of Object.entries(expected)){
      const small=phone.slots[id],large=pc.slots[id];
      if(!small||!large)throw Error("missing real slot "+id);
      for(const [label,actual] of [["phone",small.width],["PC",large.width]])
        if(Math.abs(actual-expectedSize)>.012)
          throw Error(count+"v"+count+" "+label+" "+id+" size "+actual.toFixed(3)+" versus mobile baseline "+expectedSize);
      for(const key of ["width","centerX","centerY","footY"])
        if(Math.abs(small[key]-large[key])>.012)
          throw Error("mobile/PC diverged on "+id+" "+key+": "+small[key]+" / "+large[key]);
    }
    console.log("PASS native mobile/PC parity "+count+" active: "+JSON.stringify({phone:phone.arena,pc:pc.arena,slots:Object.keys(expected)}));
  }
}finally{server.close();}
