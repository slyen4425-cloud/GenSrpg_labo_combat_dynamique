// Native editor smoke: a second status sprite is a rare, opt-in choice.
// Validate PC / phone landscape / narrow without mocking editor controls.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe=`<script>
document.addEventListener("DOMContentLoaded",()=>{
  let attempts=0;
  function check(){
    const report=m=>document.body.dataset.dualStatusSmoke=m;
    try {
      const one=q=>document.querySelector(q);
      const assert=(yes,msg)=>{if(!yes)throw Error(msg);};
      const creature=one("[data-creature-front-select]");
      if(!creature||creature.options.length<10){
        if(++attempts<55)return setTimeout(check,180);
        throw Error("official asset catalog not ready");
      }
      one('[data-editor-tab="skills"]').click();
      assert(one('[data-editor-panel="skills"]')?.hidden===false,"Skills tab not shown");
      one("[data-skill-new]").click();
      const chooser=one("[data-skill-effect-add-kind]");
      chooser.value="standard";chooser.dispatchEvent(new Event("change",{bubbles:true}));
      one("[data-skill-effect-add]").click();
      const row=[...document.querySelectorAll("[data-skill-effects-host] [data-skill-effect-row]")].at(-1);
      assert(row,"missing native effect row");
      const kind=row.querySelector("[data-skill-effect-kind]");
      kind.value="apply_status";kind.dispatchEvent(new Event("change",{bubbles:true}));
      const toggle=row.querySelector("[data-skill-status-opponent-visual-enabled]");
      const enemy=row.querySelector("[data-skill-status-opponent-visual-asset]");
      const primary=row.querySelector("[data-skill-status-visual-asset]");
      assert(toggle&&enemy&&primary,"optional status sprite UI missing");
      assert(!toggle.checked,"opposing asset should be opt-in");
      const field=enemy.closest("label");
      assert(field.hidden,"opponent chooser should be hidden by default");
      assert(enemy.options.length>8,"opposing sprite not using existing visual catalog");
      assert(enemy.options.length===primary.options.length,"different catalog used for opponent sprite");
      toggle.checked=true;toggle.dispatchEvent(new Event("change",{bubbles:true}));
      assert(!field.hidden,"second sprite chooser was not revealed");
      const candidates=[...enemy.options].filter(o=>o.value);
      assert(candidates.length>2,"not enough actual sprites to choose");
      enemy.value=candidates[1].value;
      enemy.dispatchEvent(new Event("change",{bubbles:true}));
      assert(enemy.value===candidates[1].value,"opponent asset selection lost");
      toggle.checked=false;toggle.dispatchEvent(new Event("change",{bubbles:true}));
      assert(field.hidden,"disabled option should hide secondary chooser");
      assert(enemy.value===candidates[1].value,"temporary UI toggle wiped a retained choice");
      toggle.checked=true;toggle.dispatchEvent(new Event("change",{bubbles:true}));
      assert(enemy.value===candidates[1].value,"optional choice was not restored");
      report("pass:"+innerWidth+":"+enemy.options.length);
    }catch(e){report("error:"+String(e.message||e));}
  }
  setTimeout(check,2200);
});
</script>`;

const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const file=resolve(root,"."+pathname);
    if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
    let body=await readFile(file);
    if(pathname.endsWith("/capture-editor-v2.html"))
      body=Buffer.from(body.toString("utf8").replace("</head>",probe+"</head>"));
    res.writeHead(200,{"Content-Type":mime[extname(pathname)]??"application/octet-stream"}).end(body);
  }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try {
  const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .filter(Boolean).find(bin=>spawnSync("which",[bin]).status===0);
  if(!chrome)throw Error("Chromium is required");
  for(const [w,h] of [[1440,900],[920,520],[390,844]]) {
    const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html?tab=skills";
    const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run",
      "--window-size="+w+","+h,"--force-device-scale-factor=1","--virtual-time-budget=14000","--dump-dom",url],
      {stdio:["ignore","pipe","pipe"]});
    const out=[],err=[];child.stdout.on("data",b=>out.push(b));child.stderr.on("data",b=>err.push(b));
    const exit=await Promise.race([once(child,"close").then(([code])=>code),
      new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("status sprite browser timeout "+w));},65000);t.unref();child.once("close",()=>clearTimeout(t));})]);
    const html=Buffer.concat(out).toString("utf8");
    const result=html.match(/data-dual-status-smoke="([^"]*)"/)?.[1]??"missing";
    if(exit!==0||!result.startsWith("pass:"))
      throw Error("Dual status sprite editor "+w+"x"+h+": "+result+" "+Buffer.concat(err).toString("utf8").slice(-400));
    console.log("PASS dual-status sprite "+w+"x"+h+" "+result);
  }
}finally{server.close();}
