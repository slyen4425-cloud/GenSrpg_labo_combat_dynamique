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
  let attempts=0;
  function inspect(){
    const out=(message)=>{document.body.dataset.referenceFilterSmoke=message;};
    const one=(q)=>document.querySelector(q);
    try{
      const skill=one("[data-skill-library-select]");
      const creature=one("[data-creature-library-select]");
      if(!skill||!creature)throw Error("missing native library selectors");
      const skills=[...skill.options].map(o=>o.value);
      const creatures=[...creature.options].map(o=>o.value);
      if(!skills.includes("coupe_feuille")||!creatures.includes("crea_crys_2")){
        if(++attempts<55)return setTimeout(inspect,210);
        throw Error("official showcases not hydrated");
      }
      const verify=(condition,message)=>{if(!condition)throw Error(message);};
      const choose=(select,id)=>{select.value=id;select.dispatchEvent(new Event("change",{bubbles:true}));};
      const skillFilter=skill.previousElementSibling;
      verify(skillFilter?.matches("[data-skill-element-filter]"),"missing static skill element filter");
      const originalSkillCount=skill.options.length;
      choose(skillFilter,"fire");
      verify(skill.options.length<originalSkillCount,"skill filter did not remove off-element options from native DOM");
      choose(skillFilter,"nature");
      verify([...skill.options].some(o=>o.value==="coupe_feuille"),"Nature skill missing under native filter");
      verify([...skill.options].filter(o=>o.value==="armure-de-pointe").length===1,
        "published Armure de pointe is not offered exactly once under Nature");
      choose(skillFilter,"");
      verify(skill.options.length===originalSkillCount,"reset must restore entire skill catalog");

      const creatureFilter=creature.previousElementSibling;
      verify(creatureFilter?.dataset.referenceElementFilter==="creature","missing creature library filter");
      const fullCreatureCount=creature.options.length;
      choose(creatureFilter,"earth");
      verify(creature.options.length<fullCreatureCount,"creature filter did not remove off-element options");
      verify([...creature.options].some(o=>o.value==="crea_crys_2"),"Earth/Nature creature not in Earth filter");
      choose(creatureFilter,"nature");
      verify([...creature.options].some(o=>o.value==="crea_crys_2"),"Earth/Nature creature not in Nature filter");

      const evolution=one("[data-evolution-target]");
      const evolutionFilter=evolution?.previousElementSibling;
      verify(evolutionFilter?.dataset.referenceElementFilter==="creature","evolution target filter missing");
      choose(evolutionFilter,"nature");
      verify([...evolution.options].some(o=>o.value==="crea_crys_2"),"evolution multi-element filtering missing");
      const opponents=[...document.querySelectorAll("[data-test-opponent-creature]")];
      verify(opponents.length===6,"test team selector list incomplete");
      const team=opponents[0],teamFilter=team.previousElementSibling;
      verify(teamFilter?.dataset.referenceElementFilter==="creature","combat roster filter missing");
      const teamSelected=team.value,allTeamCount=team.options.length;
      choose(teamFilter,"earth");
      verify(team.value===teamSelected,"filter changed selected combat roster");
      verify(team.options.length<allTeamCount,"combat roster options did not narrow for native Android");
      verify([...team.options].some(o=>o.value==="crea_crys_2"),"combat team Earth option lost");
      // Normal creature reload invokes team refresh; owner must keep the filter.
      choose(creatureFilter,"");
      const creatureBefore=creature.value;
      choose(creature,"crea_crys_2");
      verify(team.previousElementSibling?.dataset.referenceElementFilter==="creature","team refresh discarded filter");
      verify(team.previousElementSibling.value==="earth","team refresh forgot author filter");
      verify([...team.options].some(o=>o.value==="crea_crys_2"),"team refresh removed matching creature");

      const loadout=one("[data-loadout-slot]");
      verify(loadout?.previousElementSibling?.dataset.skillElementFilter==="true"||
        loadout?.previousElementSibling?.dataset.referenceElementFilter==="skill","loadout element filter missing");

      one('[data-editor-tab="skills"]').click();
      verify(one('[data-editor-panel="skills"]')?.hidden===false,"skills tab is not visible");
      one("[data-skill-new]").click();
      const name=one("[data-skill-name]"),id=one("[data-skill-id]");
      verify(id.readOnly,"new skill ID must be automatic and read-only");
      name.value="Prisme Éclairé Quartz V2";
      name.dispatchEvent(new Event("input",{bubbles:true}));
      verify(id.value==="prisme-eclaire-quartz-v2","new skill slug not generated from author name: "+id.value);
      name.value="Armure de pointes";
      name.dispatchEvent(new Event("input",{bubbles:true}));
      verify(/^armure-de-pointes(?:-\\d+)?$/.test(id.value),"new skill ID not updated from typed name");
      // The real active registry must reload the authored preset, not a
      // legacy template or a second hand-built copy.
      choose(skill,"armure-de-pointe");
      verify(id.value==="armure-de-pointe"&&id.readOnly,
        "published Armure de pointe cannot be selected as a real skill");
      verify(name.value==="Armure de pointe","author's capacity name not reloaded");
      verify(one("[data-skill-required-level]")?.value==="5","author level lost");
      verify(one("[data-skill-energy-cost]")?.value==="3","author energy cost lost");
      verify(one("[data-skill-cooldown]")?.value==="30000","author cooldown lost");
      const statusFx=[...document.querySelectorAll("[data-skill-status-visual-asset]")];
      verify(statusFx.some(node=>node.value==="pack:capture:sprite-armure-ronces-plante-carnivore-back-01"),
        "original authored thorn armor mask is missing after native skill reload");
      // Optional adversary status sprite shares the canonical asset filter.
      const opponentStatus=[...document.querySelectorAll("[data-skill-status-opponent-visual-asset]")];
      verify(opponentStatus.length>0,"opponent status sprite selector missing");
      verify(opponentStatus.some(node=>node.previousElementSibling?.dataset.referenceElementFilter==="asset"),
        "opponent status sprite selector lacks canonical asset element filter");
      choose(skill,"coupe_feuille");
      verify(id.value==="coupe_feuille"&&id.readOnly,"existing skill identity was not restored");
      name.value="Coupe feuille édition";
      name.dispatchEvent(new Event("input",{bubbles:true}));
      verify(id.value==="coupe_feuille","renaming existing skill must not change its permanent ID");

      // A creature visual picker is an asset catalog, not a species reference.
      const model=one("[data-creature-front-select]");
      const modelFilter=model?.previousElementSibling;
      verify(modelFilter?.dataset.referenceElementFilter==="asset","creature model picker lacks asset element filter");
      const modelCount=model.options.length;
      verify(modelCount>10,"creature model asset library not hydrated");
      choose(modelFilter,"nature");
      verify(model.options.length<modelCount,"creature model asset filter did not narrow native options");
      choose(modelFilter,"");
      verify(model.options.length===modelCount,"creature model reset lost assets");

      // A status sprite is created dynamically inside a buff/debuff effect row.
      const effectKind=one("[data-skill-effect-add-kind]");
      choose(effectKind,"effect:apply_status");
      one("[data-skill-effect-add]").click();
      const status=[...document.querySelectorAll("[data-skill-status-visual-asset]")].at(-1);
      verify(status,"status visual sprite selector missing after effect creation");
      const statusFilter=status.previousElementSibling;
      verify(statusFilter?.dataset.referenceElementFilter==="asset","buff/status sprite lacks asset element filter");
      const statusCount=status.options.length;
      verify(statusCount>8,"status sprite catalog unexpectedly empty");
      choose(statusFilter,"fire");
      verify(status.options.length<statusCount,"status sprite Fire filter did not remove incompatible options");
      choose(statusFilter,"nature");
      verify([...status.options].some(o=>/nature|plante|ronce/i.test(o.textContent)),"Nature status sprite not offered");
      choose(statusFilter,"");
      verify(status.options.length===statusCount,"status sprite reset did not restore original options");

      out("pass:"+innerWidth+":"+originalSkillCount+":"+fullCreatureCount+":"+allTeamCount);
    }catch(error){out("error:"+String(error.message||error));}
  }
  setTimeout(inspect,2500);
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
      new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("reference filter browser timeout "+width));},65000);t.unref();child.once("close",()=>clearTimeout(t));})]);
    const html=Buffer.concat(out).toString("utf8"),
      result=html.match(/data-reference-filter-smoke="([^"]*)"/)?.[1]??"missing";
    if(exit!==0||!result.startsWith("pass:"))
      throw Error("Reference filter real editor "+width+"x"+height+": "+result+" "+Buffer.concat(err).toString("utf8").slice(-450));
    console.log("PASS reference filters "+width+"x"+height+" "+result);
  }
}finally{server.close();}
