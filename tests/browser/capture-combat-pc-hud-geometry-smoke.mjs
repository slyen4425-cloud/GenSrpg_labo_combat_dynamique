// #351: Real Chromium uses the ACTUAL Capture preview template and its TWO CSS owners.
// Baseline is read from immutable START git commit, never copied/duplicated to this tree.
// The DOM fixture isolates HUD geometry; combat rules/abilities are tested by normal CI.
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";

const root = process.cwd();
const START_SHA = "1ec3174f6c2106f5b1ff35676fbe3fd0c9c2c8ea";
const cssPath = "examples/dom-demo/capture-editor-v2.css";
const original = await readFile("examples/dom-demo/capture-editor-v2.html", "utf8");
const template = original.match(/<template data-capture-preview-template>([\s\S]*?)<\/template>/)?.[1];
if (!template?.includes('class="combat-dodge-action combat-dodge-action--arena"')
  || !template.includes('class="skill-bar__grid" data-combat-skills'))
  throw Error("The actual authored Capture combat HUD template has changed; revisit test");

const gitCss = spawnSync("git", ["show", START_SHA + ":" + cssPath],
  { encoding: "utf8", maxBuffer: 2_000_000 });
if (gitCss.status !== 0 || !gitCss.stdout.includes("combat-dodge-action--arena"))
  throw Error("Missing immutable START CSS baseline (checkout fetch-depth: 0): " + gitCss.stderr);
const beforeCss = gitCss.stdout;
const afterCss = await readFile(cssPath, "utf8");

const browserScript = [
  '<script>',
  'try {',
  'const args=new URLSearchParams(location.search);',
  'const count=args.get("count"),mode=args.get("mode");',
  'const arena=document.querySelector("[data-combat-arena]");',
  'if(arena.dataset.combatActiveCount!==count)throw Error("native BattleFormat count not set");',
  'const skillGrid=arena.querySelector("[data-combat-skills]");',
  'const names=["Trait","Mur","Esprit","Lanterne","Ultime"];',
  'skillGrid.innerHTML=names.map((name,i)=>"<button type=button class=\\"action-option action-option--skill\\" data-hud-skill=\\""+i+"\\"><span class=\\"action-option__icon-shell\\">✦</span><strong>"+name+"</strong></button>").join("");',
  'const dodge=arena.querySelector("[data-combat-dodge]");',
  'dodge.hidden=false;',
  'dodge.querySelector("[data-combat-dodge-charges]").textContent="2 / 2";',
  'const ally=arena.querySelector(".squad-card--command-ally");',
  'if(count==="1")ally.style.display="none";',
  'const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};',
  'const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));',
  'const stack=arena.querySelector(".coop-command-stack");',
  'const skills=[...arena.querySelectorAll("[data-hud-skill]")];',
  'const box={arena:rect(arena),stack:rect(stack),dodge:rect(dodge),playerHp:rect(arena.querySelector(".squad-card--local-full"))};',
  'if(count==="2")box.ally=rect(ally);',
  'const accessible=skills.map(button=>{',
  'const b=button.getBoundingClientRect();const hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);',
  'const canPoint=hit===button||button.contains(hit);',
  'button.focus();const canFocus=document.activeElement===button;',
  'return b.width>=18&&b.height>=18&&canPoint&&canFocus;',
  '});',
  'const data={count,mode,viewport:{width:innerWidth,height:innerHeight},fine:matchMedia("(pointer: fine)").matches,',
  'dodgeVsStack:overlap(box.dodge,box.stack),dodgeVsSkills:skills.map(skill=>overlap(box.dodge,rect(skill))),',
  'dodgeVsHp:overlap(box.dodge,box.playerHp),dodgeVsAlly:box.ally?overlap(box.dodge,box.ally):0,',
  'gap:box.stack.left-box.dodge.right,accessible,skillCount:skills.length,',
  'overflowX:Math.max(0,document.documentElement.scrollWidth-innerWidth),',
  'stackWidth:box.stack.width,box};',
  'document.body.dataset.layoutProbe=encodeURIComponent(JSON.stringify(data));',
  '}catch(error){document.body.dataset.layoutProbe="error:"+encodeURIComponent(error.stack||error);}',
  '</script>'
].join("\n");

const mime = { ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".html": "text/html", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost");
    if (u.pathname === "/__hud_css") {
      const css = u.searchParams.get("mode") === "before" ? beforeCss : afterCss;
      res.writeHead(200, { "Content-Type": "text/css" }).end(css);
      return;
    }
    if (u.pathname === "/__hud_layout") {
      const count=u.searchParams.get("count"), mode=u.searchParams.get("mode");
      if (!["1","2"].includes(count) || !["before","after"].includes(mode)) throw Error("invalid probe");
      const marker='class="arena arena--coop-2v2" data-combat-arena';
      if (!template.includes(marker)) throw Error("native arena root missing");
      const body=[
        '<!doctype html><html><head><meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width,initial-scale=1">',
        '<link rel="stylesheet" href="/examples/dom-demo/demo.css">',
        '<link rel="stylesheet" href="/__hud_css?mode='+mode+'">',
        '</head><body data-preview-landscape-active="true">',
        '<section class="capture-preview-shell" data-landscape-required="true">',
        '<div class="capture-preview-host">',
        template.replace(marker,marker+' data-combat-active-count="'+count+'"'),
        '</div></section>', browserScript, '</body></html>'
      ].join("\n");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(body);
      return;
    }
    const file = resolve(root, "." + decodeURIComponent(u.pathname));
    if (!file.startsWith(root + sep)) throw Error("Forbidden");
    const bytes=await readFile(file);
    res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" }).end(bytes);
  } catch(error) { res.writeHead(404).end(String(error)); }
});
server.listen(0,"127.0.0.1");
await once(server,"listening");
const chrome = [process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
  .filter(Boolean).find(bin=>spawnSync("which",[bin]).status===0);
if(!chrome) { server.close(); throw Error("Real Chromium is required for combat HUD geometry"); }
const host="http://127.0.0.1:"+server.address().port;

async function runChrome(args,label) {
  // Bare headless Chrome defaults to pointer:none and silently skips the PC
  // (pointer:fine) media rule. Emulate physical mouse on desktop and touch
  // on phone, matching Chromium's supported Blink pointer/hover settings.
  const phone = args.some(arg => /--window-size=(915,412|800,360)/.test(arg));
  const pointer = phone
    ? "--blink-settings=primaryHoverType=0,availableHoverTypes=0,primaryPointerType=2,availablePointerTypes=2"
    : "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4";
  const proc=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",pointer,
    "--disable-background-networking","--no-first-run","--hide-scrollbars",
    "--virtual-time-budget=1300",...args],{stdio:["ignore","pipe","pipe"]});
  const out=[],err=[];
  proc.stdout.on("data",b=>out.push(b));proc.stderr.on("data",b=>err.push(b));
  const code=await Promise.race([
    once(proc,"close").then(([status])=>status),
    new Promise((_,reject)=>{const t=setTimeout(()=>{proc.kill("SIGKILL");reject(Error("Chrome timeout "+label));},40000);t.unref();proc.once("close",()=>clearTimeout(t));})
  ]);
  if(code!==0)throw Error("Chrome exited "+code+" "+label+" "+Buffer.concat(err).toString("utf8").slice(-250));
  return Buffer.concat(out).toString("utf8");
}
async function probe(w,h,count,mode){
  const url=host+"/__hud_layout?count="+count+"&mode="+mode;
  const dom=await runChrome(["--window-size="+w+","+h,"--dump-dom",url],w+"x"+h+" "+count+" "+mode);
  const raw=dom.match(/data-layout-probe="([^"]+)"/)?.[1];
  if(!raw||raw.startsWith("error:"))throw Error("HUD browser probe "+w+"x"+h+" "+count+" "+mode+" "+(raw??dom.slice(-350)));
  return JSON.parse(decodeURIComponent(raw));
}
const assert=(condition,details)=>{if(!condition)throw Error(details);};
const close=(a,b)=>Math.abs(a-b)<1.5;
const outDir="artifacts/combat-pc-hud";
try {
  // Preserve visual evidence even when a geometry assertion is RED.
  await mkdir(outDir,{recursive:true});
  for(const count of ["1","2"]){
    for(const mode of ["before","after"]){
      const name=outDir+"/"+mode+"-1648x927-"+count+"v"+count+".png";
      const url=host+"/__hud_layout?count="+count+"&mode="+mode;
      await runChrome(["--window-size=1648,927","--screenshot="+resolve(name),url],name);
      console.log("SCREENSHOT "+name);
    }
  }
  for(const mode of ["before","after"]){
    const name=outDir+"/"+mode+"-915x412-phone-2v2.png";
    await runChrome(["--window-size=915,412","--screenshot="+resolve(name),
      host+"/__hud_layout?count=2&mode="+mode],name);
    console.log("SCREENSHOT "+name);
  }
  // Full and resized desktop landscape, wide, and zoom-equivalent CSS viewports.
  // The latter test responsive breakpoints; actual browser zoom still needs manual verification.
  const desktops=[[1366,768],[1648,927],[1920,1080],[2560,1080],[1518,853],[1318,742]];
  const phones=[[915,412],[800,360]];
  for(const count of ["1","2"]){
    for(const [w,h] of desktops){
      const before=await probe(w,h,count,"before");
      const after=await probe(w,h,count,"after");
      assert(after.fine === true && before.fine === true, "desktop must use mouse/fine pointer: "+w+" "+count);
      assert(after.skillCount===5,"not five skills: "+w+" "+count);
      assert(after.accessible.every(Boolean),"skill under another HUD or unreachable: "+w+" "+count+" "+JSON.stringify(after));
      assert(after.dodgeVsStack===0 && after.dodgeVsSkills.every(x=>x===0),
        "Esquive overlaps skills: "+w+" "+count+" "+JSON.stringify(after));
      assert(after.gap>=6,"Esquive too close to the dock: "+w+" "+count+" "+after.gap);
      assert(after.dodgeVsHp===0 && after.dodgeVsAlly===0,
        "Esquive covers HP or ally card: "+w+" "+count+" "+JSON.stringify(after));
      assert(after.overflowX<=1,"horizontal overflow: "+w+" "+count+" "+after.overflowX);
      if(count==="1"&&w===1648)
        assert(before.dodgeVsStack>0,"known RED overlap did not reproduce on original 1648x927 CSS");
      console.log("PASS desktop "+w+"x"+h+" active="+count+" before_overlap="+before.dodgeVsStack.toFixed(1)+" after_gap="+after.gap.toFixed(1));
    }
    for(const [w,h] of phones){
      const before=await probe(w,h,count,"before"),after=await probe(w,h,count,"after");
      assert(after.fine === false && before.fine === false, "phone must use touch/coarse pointer: "+w+" "+count);
      for(const el of ["stack","dodge","playerHp"]){
        for(const axis of ["x","y","width","height"])
          assert(close(before.box[el][axis],after.box[el][axis]),
            "approved phone HUD changed "+w+"x"+h+" "+count+" "+el+" "+axis);
      }
      console.log("PASS phone parity "+w+"x"+h+" active="+count);
    }
  }
}finally{server.close();}
