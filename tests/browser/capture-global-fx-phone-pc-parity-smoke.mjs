// A real 16:9 Capture editor, the real Gorice/Firestorm/Pique skill drafts,
// the native FX renderer and phone/PC Chromium layout. No artistic asset copy:
// a neutral SVG is used solely to expose each official visual's DOM bounds.
import {createServer} from "node:http";
import {readFile} from "node:fs/promises";
import {spawn,spawnSync} from "node:child_process";
import {once} from "node:events";
import {resolve,sep,extname} from "node:path";
const root=process.cwd();
const html=await readFile("examples/dom-demo/capture-editor-v2.html","utf8");
const tpl=html.match(/<template data-capture-preview-template>([\s\S]*?)<\/template>/)?.[1];
if(!tpl?.includes('data-demo-slot="opponent-1"'))throw Error("real editor template is missing");
const inline="import {createCombatState} from \"/src/core/combat/combat-state.js\";\nimport {createCombatBarrierV1} from \"/src/core/combat/combat-entity-v1.js\";\nimport {createCombatEntityOverlayV1} from \"/src/adapters/renderer/combat-entity-overlay-v1.js\";\nimport {mountCombatDemo} from \"/src/ui/demo-app.js\";\nimport {createDomSkillFxRenderer} from \"/src/adapters/renderer/dom-skill-fx.js\";\nlet demo=null,fx=null;\ntry{\n  const get=path=>fetch(path).then(r=>{if(!r.ok)throw Error(\"missing \"+path);return r.json();});\n  const [creature,profile,snow,ice,fire]=await Promise.all([\n    get(\"/data/capture/showcase/gorice.capture-creature-transfer-v1.json\"),\n    get(\"/data/profiles/biped.profile.json\"),\n    get(\"/data/capture/showcase/boule_neige.capture-skill-transfer-v1.json\"),\n    get(\"/data/capture/showcase/pique_glace.capture-skill-transfer-v1.json\"),\n    get(\"/data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json\")\n  ]);\n  const source=creature.draft.presentation, castSource=snow.draft.presentation.visual.cast;\n  const spikeSource=ice.draft.presentation.visual.travel;\n  const zoneSource=fire.draft.presentation.visual.aura;\n  if(source.viewOverrides.player.displayScale!==1.7 ||\n    source.viewOverrides.opponent.position.y!==50 ||\n    castSource.offsetX!==85 || castSource.opponentOffsetX!==-70 ||\n    spikeSource.groundOffsetYPx!==15 || zoneSource.displayScaleX!==1.6)\n    throw Error(\"published Gorice/Firestorm author values changed\");\n  const svg=\"data:image/svg+xml,\"+encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\"><rect x=\"12\" y=\"12\" width=\"72\" height=\"72\" fill=\"#ff6622\"/></svg>');\n  const meta={id:creature.draft.id,name:creature.draft.displayName,profile:source.profileId,\n    assetBaseUrl:location.origin+\"/\",views:{player:svg,opponent:svg},\n    runtimePreview:{player:svg,opponent:svg},\n    displayScale:{player:source.viewOverrides.player.displayScale,opponent:source.viewOverrides.opponent.displayScale},\n    offsetByView:{player:source.viewOverrides.player.position,opponent:source.viewOverrides.opponent.position}};\n  const scene=document.querySelector(\"[data-combat-demo]\");\n  demo=await mountCombatDemo({root:scene,nativeVisualSource:{profiles:[profile],creatureMetas:[meta]}});\n  const arena=document.querySelector(\"[data-combat-arena]\");\n  for(let n=0;n<60;n++){\n    const scale=Number.parseFloat(getComputedStyle(arena).getPropertyValue(\"--combat-arena-author-offset-scale\"));\n    if(Number.isFinite(scale)&&scale>0.2)break;\n    await new Promise(resolve=>setTimeout(resolve,50));\n  }\n  const rect=arena.getBoundingClientRect();\n  if(Math.abs(rect.width/rect.height-16/9)>.012)throw Error(\"arena ratio unexpected\");\n  const arenaScale=Number.parseFloat(getComputedStyle(arena).getPropertyValue(\"--combat-arena-author-offset-scale\"));\n  if(Math.abs(arenaScale-rect.height/400)>.006)throw Error(\"arena scale incorrect\");\n  const count=arena.dataset.combatActiveCount, metrics={count,arena:[rect.width,rect.height],sides:{}};\n  const ids=[\"local-1\",\"opponent-1\"];\n  const anchors=Object.fromEntries(ids.map(id=>[id,arena.querySelector('[data-demo-slot=\"'+id+'\"] [data-demo-motion]')]));\n  const targetAnchors=Object.fromEntries(ids.map(id=>[id,arena.querySelector('[data-demo-slot=\"'+id+'\"]')]));\n  for(const side of ids){\n    const target=side===\"local-1\"?\"opponent-1\":\"local-1\";\n    const visual={\n      boule_neige:{\n        cast:{...castSource,url:svg,offsetX:side===\"local-1\"?castSource.offsetX:castSource.opponentOffsetX,\n          offsetY:side===\"local-1\"?castSource.offsetY:castSource.opponentOffsetY},\n        travel:{...snow.draft.presentation.visual.travel,url:svg},\n        impact:{...snow.draft.presentation.visual.impact,url:svg}\n      },\n      pique_glace:{travel:{...spikeSource,url:svg}},\n      cap_fire_atk_6:{persistentZone:{...zoneSource,url:svg},persistentZoneLayer:\"behind\"}\n    };\n    fx=createDomSkillFxRenderer({arena,anchors,targetAnchors,\n      targetAnchorFor:id=>demo.getVisibleTargetRectFor(id),\n      restingOffsetFor:id=>demo.getRestingOffsetFor(id),\n      presentationForSkill:id=>visual[id]??null});\n    fx.syncPersistentZones([{id:\"zone-\"+side,skillId:\"cap_fire_atk_6\",\n      sourceActorId:side,skillElement:\"fire\",radius:\"short\",\n      appliedAtMs:0,expiresAtMs:16000,radiusGrowthSteps:1}]);\n    fx.play({type:\"cast\",skillId:\"boule_neige\",actorSlot:side,fromSlot:side,targetSlot:target,durationMs:16000});\n    fx.play({type:\"projectile\",skillId:\"boule_neige\",fromSlot:side,targetSlot:target,durationMs:16000});\n    fx.play({type:\"impact\",skillId:\"boule_neige\",actorSlot:side,fromSlot:side,targetSlot:target,durationMs:16000});\n    fx.play({type:\"channel-pulse\",skillId:\"pique_glace\",actorSlot:side,fromSlot:side,targetSlot:target,durationMs:16000});\n    const find=type=>[...arena.querySelectorAll('[data-skill-fx=\"'+type+'\"]')].at(-1);\n    const zone=find(\"persistent-zone\"),cast=find(\"cast\"),projectile=find(\"projectile\"),impact=find(\"impact\"),pulse=find(\"channel-pulse\");\n    if(![zone,cast,projectile,impact,pulse].every(Boolean))throw Error(\"one native skill FX did not render\");\n    const w=element=>Number.parseFloat(getComputedStyle(element).width)/rect.height;\n    const actor=anchors[side].getBoundingClientRect();\n    const aim=demo.getVisibleTargetRectFor(target) ?? targetAnchors[target].getBoundingClientRect();\n    metrics.sides[side]={\n      zone:w(zone),cast:w(cast),projectile:w(projectile),impact:w(impact),spike:w(pulse),\n      zoneCenterX:(zone.getBoundingClientRect().left+zone.getBoundingClientRect().width/2-rect.left)/rect.width,\n      castOffsetX:(Number.parseFloat(cast.style.left)-(actor.left+actor.width/2-rect.left))/rect.height,\n      castOffsetY:(Number.parseFloat(cast.style.top)-(actor.top+actor.height/2-rect.top))/rect.height,\n      spikeGroundY:(Number.parseFloat(pulse.style.top)-(aim.bottom-rect.top))/rect.height,\n      zoneRadius:zone.dataset.zoneRadius,\n      skillIds:[cast.dataset.skillId,projectile.dataset.skillId,pulse.dataset.skillId]\n    };\n    fx.dispose();fx=null;\n  }\n  for(const side of ids){\n    const m=metrics.sides[side];\n    const expectedX=(side===\"local-1\"?85:-70)/400;\n    if(Math.abs(m.castOffsetX-expectedX)>.004 || Math.abs(m.castOffsetY-15/400)>.004 ||\n      Math.abs(m.spikeGroundY-15/400)>.004)\n      throw Error(\"author FX X/Y no longer matches phone units \"+side+\" \"+JSON.stringify(m));\n    if(m.zoneRadius!==\"short\"||m.skillIds.join(\"|\")!==\"boule_neige|boule_neige|pique_glace\")\n      throw Error(\"authored FX identity changed\");\n  }\n\n  // Same REAL DOM wall and same official author scale on both device sizes.\n  // The barrier's visible sprite rect is also the only collision rectangle.\n  const wallDraft=await get(\"/data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json\");\n  const wallEffect=wallDraft.draft.definition.effects[0];\n  if(wallEffect.visualScale!==4||wallEffect.visualScaleX!==1.5||wallEffect.arenaXPct!==47)\n    throw Error(\"official wall author settings changed\");\n  const wallState=createCombatState({fighters:[\n    {id:\"local-1\",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,statValuesById:{glace:30}},\n    {id:\"opponent-1\",maxHp:100,initialHp:100,maxEnergy:20,initialEnergy:20,statValuesById:{glace:30}}\n  ]});\n  const invoked=createCombatBarrierV1({state:wallState,sourceActorId:\"local-1\",\n    protectedActorId:\"local-1\",sourceSkillId:\"mur_de_glace\",effect:wallEffect});\n  const fighters=Object.fromEntries(ids.map(id=>[id,targetAnchors[id]]));\n  const wallOverlay=createCombatEntityOverlayV1({arenaHost:arena,fighterContainers:fighters});\n  try{\n    wallOverlay.render(invoked.state);\n    const sprite=arena.querySelector(\"[data-combat-entities-arena-host] [data-combat-entity-sprite]\");\n    if(!sprite)throw Error(\"official wall is missing in real arena\");\n    const bounds=sprite.getBoundingClientRect();\n    const actualScale=Number.parseFloat(arena.style.getPropertyValue(\"--combat-arena-author-offset-scale\"));\n    metrics.wall={width:bounds.width/rect.height,height:bounds.height/rect.height,\n      centerX:(bounds.left+bounds.width/2-rect.left)/rect.width,\n      centerY:(bounds.top+bounds.height/2-rect.top)/rect.height};\n    if(Math.abs(actualScale-rect.height/400)>.006 ||\n       Math.abs(metrics.wall.width-420/400)>.01 ||\n       Math.abs(metrics.wall.height-368/400)>.01 ||\n       Math.abs(metrics.wall.centerX-.47)>.012 ||\n       Math.abs(metrics.wall.centerY-.55)>.012)\n       throw Error(\"wall geometry deviates from authored phone/PC ratio \"+JSON.stringify(metrics.wall));\n    // The REAL opposing wall must keep its left edge in its team's half.
    const enemy=createCombatBarrierV1({state:wallState,sourceActorId:"opponent-1",
      protectedActorId:"opponent-1",sourceSkillId:"mur_de_glace",effect:wallEffect});
    if(!enemy.record)throw Error("opponent's official wall could not be summoned");
    wallOverlay.render(enemy.state);
    const enemySprite=arena.querySelector("[data-combat-entities-arena-host] [data-combat-entity-sprite]");
    const enemyBadge=arena.querySelector("[data-combat-entities-arena-host] [data-combat-entity-hp]");
    if(!enemySprite||!enemyBadge||!enemyBadge.textContent.includes("Mur"))
      throw Error("opponent wall or HP missing");
    const eb=enemySprite.getBoundingClientRect(),hb=enemyBadge.getBoundingClientRect();
    const controls=arena.querySelector(".coop-controls")?.getBoundingClientRect();
    if((eb.left-rect.left)/rect.width<.515)
      throw Error("opponent wall enters player territory");
    if(hb.left<rect.left-4||hb.right>rect.right+4||hb.top<rect.top-4||hb.bottom>rect.bottom+4)
      throw Error("opponent HP label outside arena");
    if(controls&&hb.left<controls.right&&hb.right>controls.left&&
      hb.top<controls.bottom&&hb.bottom>controls.top)
      throw Error("opponent HP hidden under right controls");
    // Renderer/Runtime share one true projectile lane for impact-time wall
    // contact: observed wall, never a generic invulnerability shortcut.
    const nativeFx=createDomSkillFxRenderer({arena,anchors,targetAnchors,
      barrierCollisionRectsFor:q=>wallOverlay.collisionRectsFor(q),
      presentationForSkill:id=>({travel:{...snow.draft.presentation.visual.travel,
        url:svg,...(id==="vertical-ice"?{trajectoryMode:"under_target"}:{})}})});
    try{
      nativeFx.play({type:"projectile",skillId:"boule_neige",fromSlot:"local-1",
        targetSlot:"opponent-1",durationMs:5000});
      const direct=nativeFx.barrierContactFor({sourceActorId:"local-1",
        targetActorId:"opponent-1",kind:"projectile",skillId:"boule_neige"});
      if(direct?.entityId!==enemy.record.id)
        throw Error("native projectile missed the real opposing wall at resolution");
      nativeFx.play({type:"projectile",skillId:"vertical-ice",fromSlot:"local-1",
        targetSlot:"opponent-1",durationMs:5000});
      const vertical=nativeFx.barrierContactFor({sourceActorId:"local-1",
        targetActorId:"opponent-1",kind:"projectile",skillId:"vertical-ice"});
      if(vertical!==null)throw Error("under-target projectile wrongly intercepted");
    }finally{nativeFx.dispose();}
    metrics.enemyWall={left:(eb.left-rect.left)/rect.width,
      width:eb.width/rect.height,centerY:(eb.top+eb.height/2-rect.top)/rect.height,
      hpX:(hb.left+hb.width/2-rect.left)/rect.width,
      hpY:(hb.top-rect.top)/rect.height};
  }finally{wallOverlay.dispose();}\n  document.body.dataset.globalFxParity=encodeURIComponent(JSON.stringify(metrics));\n}catch(error){document.body.dataset.globalFxParity=\"error:\"+encodeURIComponent(error.stack||error.message);}\nfinally{fx?.dispose();demo?.dispose();}";
const page=[
  '<!doctype html><html><head><meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width,initial-scale=1">',
  '<link rel="stylesheet" href="/examples/dom-demo/demo.css">',
  '<link rel="stylesheet" href="/examples/dom-demo/capture-editor-v2.css">',
  '</head><body data-preview-landscape-active="true">',
  '<section class="capture-preview-shell" data-capture-preview-shell data-landscape-required="true">',
  '<div class="capture-preview-host">',tpl,'</div></section>',
  '<script type="module">',inline,'</script></body></html>'
].join("\n");
const types={".js":"text/javascript",".css":"text/css",".json":"application/json",".html":"text/html"};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,"http://localhost");
    if(url.pathname==="/__global_fx_parity__"){
      const count=url.searchParams.get("count");
      if(!["1","2"].includes(count))throw Error("invalid BattleFormat");
      const needle='class="arena arena--coop-2v2" data-combat-arena';
      if(!page.includes(needle))throw Error("canonical arena template not present");
      res.writeHead(200,{"Content-Type":"text/html"}).end(
        page.replace(needle,needle+' data-combat-active-count="'+count+'"'));
      return;
    }
    const path=resolve(root,"."+decodeURIComponent(url.pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403).end("Forbidden");return;}
    const bytes=await readFile(path);
    res.writeHead(200,{"Content-Type":types[extname(path)]??"application/octet-stream"}).end(bytes);
  }catch(error){res.writeHead(404).end(String(error));}
});
server.listen(0,"127.0.0.1");await once(server,"listening");
const chrome=[process.env.CHROME_PATH,"google-chrome","google-chrome-stable","chromium","chromium-browser"]
 .filter(Boolean).find(x=>spawnSync("which",[x]).status===0);
if(!chrome){server.close();throw Error("real Chromium is required");}
async function probe(width,height,count){
  const url="http://127.0.0.1:"+server.address().port+"/__global_fx_parity__?count="+count;
  const child=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu",
    "--disable-dev-shm-usage","--no-first-run","--virtual-time-budget=8000",
    "--window-size="+width+","+height,"--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
  const stdout=[],stderr=[];child.stdout.on("data",x=>stdout.push(x));child.stderr.on("data",x=>stderr.push(x));
  const status=await Promise.race([
    once(child,"close").then(([code])=>code),
    new Promise((_,reject)=>{const t=setTimeout(()=>{child.kill("SIGKILL");reject(Error("Chromium timeout"));},45000);t.unref();child.once("close",()=>clearTimeout(t));})
  ]);
  const dom=Buffer.concat(stdout).toString("utf8");
  const raw=dom.match(/data-global-fx-parity="([^"]+)"/)?.[1];
  if(status!==0||!raw||raw.startsWith("error:"))
    throw Error("real Gorice/Firestorm skill FX "+width+"x"+height+" / "+count+": "+
      (raw?decodeURIComponent(raw):Buffer.concat(stderr).toString("utf8").slice(-600)));
  return JSON.parse(decodeURIComponent(raw));
}
try{
  for(const count of [1,2]){
    const phone=await probe(920,490,count),pc=await probe(1920,1080,count);
    for(const side of ["local-1","opponent-1"]){
      for(const key of ["zone","cast","projectile","impact","spike","zoneCenterX","castOffsetX","castOffsetY","spikeGroundY"]){
        const small=phone.sides[side][key],large=pc.sides[side][key];
        if(Math.abs(small-large)>.012)
          throw Error("FX "+count+"v"+count+" "+side+" "+key+" phone "+small+" PC "+large);
      }
    }
    for(const key of ["left","width","centerY","hpX","hpY"]){
      if(Math.abs(phone.enemyWall[key]-pc.enemyWall[key])>.012)
        throw Error("REAL opponent wall "+count+" "+key+" phone "+phone.enemyWall[key]+" PC "+pc.enemyWall[key]);
    }
    for(const key of ["width","height","centerX","centerY"]){
      if(Math.abs(phone.wall[key]-pc.wall[key])>.012)
        throw Error("REAL wall "+count+" actor "+key+" phone "+phone.wall[key]+" PC "+pc.wall[key]);
    }
    console.log("PASS actual Gorice projectile + Pique under-target + Firestorm zone phone/PC "+count+" active "+
      JSON.stringify({phone:phone.arena,pc:pc.arena,sides:["local-1","opponent-1"]}));
  }
}finally{server.close();}
