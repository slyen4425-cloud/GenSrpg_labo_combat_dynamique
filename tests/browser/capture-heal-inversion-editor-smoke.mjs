// Real Chromium: configure the native Heal inversion skill editor, including
// status and area author controls. No mock UI, no second HP authority.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",
  ".css":"text/css",".json":"application/json"};
const probe=`<script>
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    try{
      const one=q=>document.querySelector(q);
      const verify=(ok,msg)=>{if(!ok)throw Error(msg);};
      one('[data-editor-tab="skills"]').click();
      verify(one('[data-editor-panel="skills"]')?.hidden===false,"skills panel hidden");
      one("[data-skill-new]").click();
      const chooser=one("[data-skill-effect-add-kind]");
      verify([...chooser.options].some(o=>o.value==="effect:apply_status"),
        "native effect picker missing status");
      chooser.value="effect:apply_status";
      chooser.dispatchEvent(new Event("change",{bubbles:true}));
      const effects=one("[data-skill-effects-host]");
      const row=[...effects.querySelectorAll("[data-skill-effect-row]")].at(-1);
      verify(Boolean(row),"new status row missing");
      verify(row.querySelector("[data-skill-effect-kind]").value==="apply_status",
        "wrong native effect");
      const kind=row.querySelector("[data-skill-status-kind]");
      verify([...kind.options].some(o=>o.value==="heal_inversion"),
        "Heal inversion absent from real status list");
      kind.value="heal_inversion";kind.dispatchEvent(new Event("change",{bubbles:true}));
      const pct=row.querySelector("[data-skill-status-heal-inversion-percent]");
      const cfg=row.querySelector('[data-skill-status-config-kind="heal_inversion"]');
      verify(Boolean(pct)&&cfg.hidden===false,"conversion percent controls hidden");
      verify(pct.value==="100","wrong editable default inversion");
      pct.value="50";
      const pol=row.querySelector("[data-skill-status-polarity]");
      verify(pol.value==="detrimental"&&pol.disabled,"harmful curse must be automatic");
      const duration=row.querySelector("[data-skill-status-duration-seconds]");
      duration.value="20";
      const stacking=row.querySelector("[data-skill-status-stacking]");
      stacking.value="stack";stacking.dispatchEvent(new Event("change",{bubbles:true}));
      verify(row.querySelector("[data-skill-status-max-stacks-field]").hidden===false,
        "stack configuration hidden");
      verify(pct.value==="50"&&duration.value==="20","author settings not editable");
      chooser.value="effect:persistent_zone";
      chooser.dispatchEvent(new Event("change",{bubbles:true}));
      const zoneRow=[...effects.querySelectorAll("[data-skill-effect-row]")].at(-1);
      verify(zoneRow!==row && zoneRow.querySelector("[data-skill-effect-kind]").value==="persistent_zone",
        "native zone authoring missing");
      const zoneEffect=zoneRow.querySelector("[data-skill-zone-effect-kind]");
      zoneEffect.value="apply_status";zoneEffect.dispatchEvent(new Event("change",{bubbles:true}));
      const zoneKind=zoneRow.querySelector("[data-skill-zone-status-kind]");
      zoneKind.value="heal_inversion";zoneKind.dispatchEvent(new Event("change",{bubbles:true}));
      const zonePct=zoneRow.querySelector("[data-skill-zone-status-heal-inversion-percent]");
      verify(Boolean(zonePct)&&!zonePct.parentElement.hidden,"zone rate invisible");
      zonePct.value="25";
      verify(zoneRow.querySelector("[data-skill-zone-status-polarity]").value==="detrimental",
        "zone curse polarity wrong");
      document.body.dataset.healInversionSmoke="pass:skill:zone:mobile";
    }catch(e){document.body.dataset.healInversionSmoke="error:"+e.message;}
  },2800);
});
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
server.listen(0,"127.0.0.1");await once(server,"listening");
try{
  const bin=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable",
    "chromium","chromium-browser"].filter(Boolean)
    .find(x=>spawnSync("which",[x]).status===0);
  if(!bin)throw Error("Chromium required");
  const url="http://127.0.0.1:"+server.address().port+
    "/examples/dom-demo/capture-editor-v2.html?tab=skills";
  for(const [width,height] of [[1440,900],[920,520]]){
    const child=spawn(bin,["--headless=new","--no-sandbox","--disable-gpu",
      "--disable-dev-shm-usage","--no-first-run","--window-size="+width+","+height,
      "--virtual-time-budget=9000","--dump-dom",url],
      {stdio:["ignore","pipe","pipe"]});
    const out=[],errs=[];
    child.stdout.on("data",x=>out.push(x));child.stderr.on("data",x=>errs.push(x));
    const exit=await Promise.race([
      once(child,"close").then(([code])=>code),
      new Promise((_,reject)=>{
        const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("browser timeout"));},55000);
        t.unref();child.once("close",()=>clearTimeout(t));
      })
    ]);
    const html=Buffer.concat(out).toString("utf8");
    const result=html.match(/data-heal-inversion-smoke="([^"]*)"/)?.[1]??"missing";
    if(exit!==0||!result.startsWith("pass:"))
      throw Error("Heal inversion Chromium "+width+"x"+height+" "+result+" "+
        Buffer.concat(errs).toString("utf8").slice(-480));
    console.log("PASS Heal inversion "+width+"x"+height+" "+result);
  }
}finally{server.close();}
