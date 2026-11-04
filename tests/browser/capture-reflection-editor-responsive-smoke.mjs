// Real Chromium layout regression: the actual skill editor, not a mock.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {extname,resolve,sep} from "node:path";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";

const root=process.cwd();
const mime={".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",".json":"application/json"};
const probe=`<script>
document.addEventListener("DOMContentLoaded",()=>{
  setTimeout(()=>{
    try {
      const one=sel=>document.querySelector(sel);
      // Activate the actual Skills tab: DOM of inactive tabs has zero geometry.
      one('[data-editor-tab="skills"]').click();
      one("[data-skill-new]").click();
      const kind=one("[data-skill-effect-add-kind]"),add=one("[data-skill-effect-add]");
      kind.value="standard";add.click();
      const row=[...document.querySelectorAll("[data-skill-effects-host] [data-skill-effect-row]")].at(-1);
      if(!row)throw Error("native skill effect row missing");
      const effect=row.querySelector("[data-skill-effect-kind]");
      effect.value="apply_status";effect.dispatchEvent(new Event("change",{bubbles:true}));
      const status=row.querySelector("[data-skill-status-kind]");
      status.value="damage_reflection";status.dispatchEvent(new Event("change",{bubbles:true}));
      const box=row.querySelector('[data-skill-status-config-kind="damage_reflection"]');
      const group=box?.querySelector('[data-reflection-controls="main"]');
      const kinds=group?.querySelector(".skill-status-config__grid");
      if(!group||box.hidden||!kinds)throw Error("reflection author controls not visible");
      const bounds=x=>x.getBoundingClientRect();
      if(bounds(box).width<200||bounds(group).width<200)
        throw Error("skills tab not visible: panelHidden="+one('[data-editor-panel="skills"]').hidden+
          ", activeTab="+one('[data-editor-tab="skills"]').dataset.active+
          ", boxWidth="+Math.round(bounds(box).width)+", groupWidth="+Math.round(bounds(group).width));
      const fail=(msg)=>{throw Error(msg)};
      const percent=box.querySelector("[data-skill-status-reflection-percent]"),
        contact=group.querySelector("[data-reflection-contact-damage]"),
        all=group.querySelector("[data-reflection-all]");
      if(!percent||!contact||!all)fail("reflection values changed or missing");
      if(bounds(group).width<bounds(box).width*.82)fail("reflection subform trapped inside narrow grid column");
      const threshold=row.querySelector("[data-stack-threshold-enabled]");
      if(!threshold)fail("stack threshold control missing");
      all.click();
      if(kinds.hidden||getComputedStyle(kinds).display==="none")fail("per-source choices hidden");
      const checkboxes=[...group.querySelectorAll('label.check input[type="checkbox"]'),threshold];
      for(const c of checkboxes) {
        const r=bounds(c),label=c.closest("label"),p=bounds(label);
        if(r.width<13||r.width>27||r.height<13||r.height>27)
          fail("checkbox inherits oversized text field styles: "+r.width+"x"+r.height);
        if(getComputedStyle(label).display!=="flex")fail("checkbox label not horizontally aligned");
        if(r.left<p.left-2||r.right>p.right+2||r.top<p.top-2||r.bottom>p.bottom+2)
          fail("checkbox outside its own label");
      }
      // The author can select all sources or individual categories without losing
      // the native meaning of the controls. Geometry must remain within its owner.
      const checks=[...kinds.querySelectorAll("[data-reflection-kind]")];
      if(checks.length<7)fail("native damage reflection categories missing");
      for(const c of checks) {
        const p=bounds(c.closest("label"));
        if(p.left<bounds(kinds).left-3||p.right>bounds(kinds).right+3)
          fail("incoming kind overflows source grid");
      }
      percent.value="35";contact.value="7";
      if(percent.value!=="35"||contact.value!=="7")fail("reflection fields not editable");
      checks[0].click();
      all.click();
      if(!kinds.hidden||getComputedStyle(kinds).display!=="none")fail("select all does not collapse categories");
      const note=group.querySelector(".note");
      if(!note||bounds(note).right>bounds(group).right+3||bounds(note).left<bounds(group).left-3)
        fail("reflection explanation overflows");
      const compact={check:Math.round(bounds(all).width),section:Math.round(bounds(group).width)};
      document.body.dataset.reflectionLayoutSmoke="pass:"+innerWidth+":"+compact.check+":"+compact.section;
    }catch(e){document.body.dataset.reflectionLayoutSmoke="error:"+String(e.message||e)}
  },2200);
});
</script>`;

const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,"http://localhost").pathname);
    const file=resolve(root,"."+pathname);
    if(!file.startsWith(root+sep))return void res.writeHead(403).end("Forbidden");
    let body=await readFile(file);
    if(pathname.endsWith("/capture-editor-v2.html"))body=Buffer.from(body.toString("utf8").replace("</head>",probe+"</head>"));
    res.writeHead(200,{"Content-Type":mime[extname(pathname)]??"application/octet-stream"}).end(body);
  }catch(e){res.writeHead(404).end(String(e))}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
try {
  const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .filter(Boolean).find(bin=>spawnSync("which",[bin]).status===0);
  if(!chrome)throw Error("Chromium is required");
  for(const [width,height] of [[1440,900],[920,520],[390,844]]) {
    // Use the real editor deep-link, also applied after the async catalog-ready
    // promise; otherwise it can reset a manually selected tab to Creature.
    const url="http://127.0.0.1:"+server.address().port+"/examples/dom-demo/capture-editor-v2.html?tab=skills";
    const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--no-first-run",
      "--window-size="+width+","+height,"--force-device-scale-factor=1","--virtual-time-budget=14000","--dump-dom",url],
      {stdio:["ignore","pipe","pipe"]});
    const out=[],err=[];child.stdout.on("data",x=>out.push(x));child.stderr.on("data",x=>err.push(x));
    const exit=await Promise.race([once(child,"close").then(([code])=>code),
      new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("reflection layout browser timeout "+width));},65000);t.unref();child.once("close",()=>clearTimeout(t));})]);
    const html=Buffer.concat(out).toString("utf8"),
      result=html.match(/data-reflection-layout-smoke="([^"]*)"/)?.[1]??"missing";
    if(exit!==0||!result.startsWith("pass:"))
      throw Error("Reflection real editor "+width+"x"+height+": "+result+" "+Buffer.concat(err).toString("utf8").slice(-450));
    console.log("PASS reflection layout "+width+"x"+height+" "+result);
  }
}finally{server.close();}
