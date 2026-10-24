// Chromium integration smoke: real Showcase files and Bestiary UI.
// Only global-assets network data is a fixture, to keep CI offline and deterministic.
import {createServer} from "node:http";
import {readFile,readFileSync} from "node:fs";
import {resolve,extname,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd();
const fixture=JSON.parse(readFileSync("data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json","utf8")).draft;
const visual=fixture.presentation.visual;
const media=(data,file,assetType="sprite")=>({
  id:data.assetId,assetType,mediaType:"image",resource:{file}
});
const catalog={assets:[
  media(visual.front,"capture/creatures/venombre/runtime/venombre_opponent.webp"),
  media(visual.back,"capture/creatures/venombre/runtime/venombre_player.webp"),
  media(visual.icon,"capture/creatures/venombre/runtime/venombre_icon.webp","portrait")
]};
const probe=[
  "<script>",
  "const realFetch=window.fetch.bind(window);",
  "const assetFixture="+JSON.stringify(catalog)+";",
  "window.fetch=(input,options)=>{",
  "  const url=new URL(input,location.href);",
  "  if(url.href.includes('global-visual-assets.v1.json'))",
  "    return Promise.resolve(new Response(JSON.stringify(assetFixture),{status:200,headers:{'Content-Type':'application/json'}}));",
  "  return realFetch(input,options);",
  "};",
  "document.addEventListener('DOMContentLoaded',()=>{",
  "  let frontSeen=false;",
  "  const portrait=document.querySelector('[data-bestiary-portrait]');",
  "  const observer=new MutationObserver(()=>{",
  "    const img=portrait.querySelector('img');",
  "    if(img && img.alt==='Vue de face de Venombre' && img.src.includes('venombre_opponent.webp'))frontSeen=true;",
  "  });",
  "  observer.observe(portrait,{childList:true,subtree:true});",
  "  setTimeout(()=>{",
  "    const button=document.querySelector('.creature-choice');",
  "    if(button)button.click();",
  "  },500);",
  "  setTimeout(()=>{",
  "    try {",
  "      const name=document.querySelector('[data-bestiary-name]').textContent;",
  "      const count=document.querySelector('[data-bestiary-count]').textContent;",
  "      if(name!=='Venombre'||count!=='1 / 1')throw Error('bad entry:'+name+'/'+count);",
  "      if(!frontSeen)throw Error('front-only image missing');",
  "      if(document.querySelector('[data-bestiary]').dataset.bestiaryView!=='detail')throw Error('gallery did not open a page');",
  "      if(document.querySelectorAll('[data-bestiary-skills] .skill').length!==5)throw Error('equipped five-slot loadout not rendered');",
  "      const notes=[...document.querySelectorAll('[data-bestiary-measures] .stat__effect')].map(node=>node.textContent);",
  "      if(notes.length<2||!notes.some(v=>v.includes('1 point = +1 PV max')))throw Error('editor-format stat effect missing');",
  "      if(!notes.some(v=>v.includes('temps de charge')))throw Error('charge stat effect missing');",
  "      if(document.querySelector('[data-bestiary-attributes]'))throw Error('legacy attributes panel still present');",
  "      document.querySelector('[data-bestiary-return]').click();",
  "      if(document.querySelector('[data-bestiary]').dataset.bestiaryView!=='catalog')throw Error('return did not restore gallery');",
  "      if(document.querySelector('[data-bestiary-back]'))throw Error('rear view leaked');",
  "      const input=document.querySelector('[data-bestiary-search]');",
  "      input.value='aucune';input.dispatchEvent(new Event('input',{bubbles:true}));",
  "      if(document.querySelector('[data-bestiary-count]').textContent!=='0 / 1')throw Error('search not connected');",
  "      input.value='venombre';input.dispatchEvent(new Event('input',{bubbles:true}));",
  "      if(document.querySelectorAll('.creature-choice').length!==1)throw Error('search reset failed');",
  "      document.body.dataset.bestiarySmoke='pass:real-transfer:detail-route:5-equipped-slots:no-legacy-stats';",
  "    }catch(error){document.body.dataset.bestiarySmoke='error:'+error.message;}",
  "    observer.disconnect();",
  "  },1700);",
  "});",
  "</script>"
].join("\n");
const mime={".js":"text/javascript",".mjs":"text/javascript",".html":"text/html",".css":"text/css",".json":"application/json"};
const server=createServer((req,res)=>{
  const path=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
  const file=resolve(root,"."+path);
  if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
  readFile(file,(error,data)=>{
    if(error)return void res.writeHead(404).end("Not found");
    if(path.endsWith("/bestiary.html"))
      data=Buffer.from(data.toString("utf8").replace("</head>",probe+"</head>"));
    res.writeHead(200,{"Content-Type":mime[extname(path)]??"application/octet-stream"}).end(data);
  });
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
try{
  const binary=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .filter(Boolean).find(v=>spawnSync("which",[v]).status===0);
  if(!binary)throw Error("Chromium required");
  const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/bestiary.html";
  const child=spawn(binary,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
    "--no-first-run","--disable-background-networking","--virtual-time-budget=6200","--dump-dom",url],
    {stdio:["ignore","pipe","pipe"]});
  const output=[],errors=[];
  child.stdout.on("data",c=>output.push(c));
  child.stderr.on("data",c=>errors.push(c));
  const exit=await Promise.race([
    once(child,"close").then(([n])=>n),
    new Promise((_,reject)=>{
      const timeout=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Bestiary Chromium timeout"));},45000);
      timeout.unref();child.once("close",()=>clearTimeout(timeout));
    })
  ]);
  const dom=Buffer.concat(output).toString("utf8");
  const result=dom.match(/data-bestiary-smoke="([^"]*)"/)?.[1]??"no-result";
  if(exit!==0||!result.startsWith("pass:"))
    throw Error("Bestiary browser: "+result+"\n"+Buffer.concat(errors).toString("utf8").slice(-350));
  console.log("Bestiary real-browser smoke passed:",result);
}finally{server.close();}
