// Real browser regression sentinel. Runs in Chrome/Chromium without npm dependencies.
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { once } from "node:events";

const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp"
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const filepath = resolve(root, "." + pathname);
    if (!filepath.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    let contents = await readFile(filepath);
    if (pathname.endsWith("/capture-editor-v2.html")) {
      const html=contents.toString("utf8");
      const diagnostic=`<script>
        window.addEventListener("error",e=>document.documentElement.dataset.bootstrapError=e.message);
        window.addEventListener("unhandledrejection",e=>document.documentElement.dataset.bootstrapError=String(e.reason?.message??e.reason));
      </script>`;
      contents=Buffer.from(html.replace("<head>","<head>"+diagnostic));
    }
    // Verify the REAL editor preview's own resolver, not the standalone FX
    // fixture used by older orientation tests. Execute in the native entry
    // module scope so the probe calls the same functions as "Tester combat".
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-editor-preview-heading")) {
      const html=contents.toString("utf8");
      contents=Buffer.from(html.replace(
        'src="./capture-editor-v2.js?v=sleep-conditions-20261028"',
        'src="./capture-editor-v2.js?verify-editor-preview-heading=1"'
      ));
    }
    if (pathname.endsWith("/capture-editor-v2.js") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-editor-preview-heading")) {
      const code=contents.toString("utf8");
      const probe=`
      void (async () => {
        try {
          // Use the real global-assets catalog the editor loads in production.
          visualContext=await loadPreviewVisualContext();
          const file=await fetch("../../data/capture/showcase/graine_sansue_cap.capture-skill-transfer-v1.json",{cache:"no-store"});
          if(!file.ok)throw Error("Graine sansue author's live skill missing");
          const transfer=await file.json();
          const assetId=transfer.draft.presentation.visual.travel.assetId;
          const actualAsset=resolvePreviewPresentationAsset(assetId);
          if(assetId!=="pack:capture:sprite-graine-sangsue-projectile-01" ||
             actualAsset?.headingRad!==0 || actualAsset?.frameCount!==12)
            throw Error("live editor preview stripped Graine sansue native heading: "+JSON.stringify(actualAsset));
          const presentation=buildPreviewPresentationAssets({
            skillPresentations:{[transfer.draft.id]:transfer.draft.presentation}
          }).presentationForSkill(transfer.draft.id,{sourceView:"opponent-1",view:"opponent"});
          if(presentation?.travel?.headingRad!==0 || presentation?.travel?.assetId!==assetId)
            throw Error("live opponent presentation lost authored Graine direction");
          document.body.dataset.editorPreviewHeadingProbe="ok:editor:opponent:heading:0";
        } catch(error) {
          document.body.dataset.editorPreviewHeadingProbe="fail:"+error.message;
        }
      })();`;
      contents=Buffer.from(code+"\n"+probe);
    }
    // Browser exercises the real authoring widgets in the loaded editor;
    // static selector tests alone did not catch previous gameplay regressions.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-sleep-author-ui")) {
      const html=contents.toString("utf8");
      contents=Buffer.from(html.replace(
        'src="./capture-editor-v2.js?v=sleep-conditions-20261028"',
        'src="./capture-editor-v2.js?verify-sleep-author-ui=1"'
      ));
    }
    if (pathname.endsWith("/capture-editor-v2.js") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-sleep-author-ui")) {
      const script=`
      void (async()=>{
        const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
        try{
          let row=null;
          for(let attempts=0;attempts<30 && row===null;attempts++){
            const add=document.querySelector("[data-skill-effect-add]");
            const host=document.querySelector("[data-skill-effects-host]");
            if(add && host){
              const initial=host.querySelectorAll("[data-skill-effect-row]").length;
              add.click();
              const all=[...host.querySelectorAll("[data-skill-effect-row]")];
              if(all.length>initial)row=all.at(-1);
            }
            if(!row)await delay(200);
          }
          if(!row)throw Error("live editor did not add a tactical effect row");
          const kind=row.querySelector("[data-skill-effect-kind]");
          const statusKind=row.querySelector("[data-skill-status-kind]");
          const sleep=row.querySelector("[data-skill-status-sleep-until-damage]");
          const polarity=row.querySelector("[data-skill-status-polarity]");
          const seconds=row.querySelector("[data-skill-status-duration-seconds]");
          if(!kind||!statusKind||!sleep||!polarity||!seconds)
            throw Error("real editor is missing Sommeil author controls");
          kind.value="apply_status";kind.dispatchEvent(new Event("change",{bubbles:true}));
          statusKind.value="stun";statusKind.dispatchEvent(new Event("change",{bubbles:true}));
          sleep.checked=true;sleep.dispatchEvent(new Event("change",{bubbles:true}));
          if(!seconds.parentElement.hidden||polarity.value!=="detrimental"||!polarity.disabled)
            throw Error("Sommeil must hide its timer and force a negative stun");
          const mode=row.querySelector("[data-skill-effect-condition-mode]");
          const marker=row.querySelector("[data-skill-effect-condition-marker]");
          const min=row.querySelector("[data-skill-effect-condition-minimum]");
          if(!mode||!marker||!min)throw Error("missing native per-effect condition controls");
          mode.value="marker";mode.dispatchEvent(new Event("change",{bubbles:true}));
          marker.dispatchEvent(new Event("focus"));
          // A newly opened editor legitimately has no registered markers.
          // Create one through its real library, then verify that the
          // condition picker updates from that authoritative registry.
          if(![...marker.options].some(o=>o.value)){
            const create=document.querySelector("[data-marker-new]");
            const name=document.querySelector("[data-marker-name]");
            const save=document.querySelector("[data-marker-save]");
            if(!create||!name||!save)throw Error("marker author controls unavailable");
            create.click();
            name.value="Marqueur sommeil test";
            name.dispatchEvent(new Event("input",{bubbles:true}));
            name.dispatchEvent(new Event("change",{bubbles:true}));
            save.click();
            marker.dispatchEvent(new Event("focus"));
          }
          if(marker.tagName!=="SELECT" ||
             ![...marker.options].some(o=>o.value==="marqueur-sommeil-test"))
            throw Error("new official marker missing from effect condition picker");
          min.value="2";
          mode.value="sleep";mode.dispatchEvent(new Event("change",{bubbles:true}));
          if(mode.value!=="sleep")throw Error("Sommeil condition is unavailable");
          document.body.dataset.sleepUiProbe="ok:editor:sleep:markers:conditions";
        }catch(error){document.body.dataset.sleepUiProbe="fail:"+error.message;}
      })();`;
      contents=Buffer.from(contents.toString("utf8")+"\n"+script);
    }
    // Test-only network-stall simulation: leave the real module graph and data path intact.
    // Only presentation CDN requests remain pending, like a stalled mobile connection.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("stall-presentation")) {
      const html = contents.toString("utf8");
      const intercept = '<script>' +
        'const normalFetch = window.fetch.bind(window);' +
        'window.fetch = (...args) => String(args[0]).includes("raw.githubusercontent.com")' +
        ' ? new Promise(() => {}) : normalFetch(...args);' +
        '</script>';
      contents = Buffer.from(html.replace("<head>", "<head>" + intercept));
    }
    // Chromium regression on the ACTUAL DomSkillFxRenderer used by combat
    // previews. The same projectile and mirror-return planner share one FX owner.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-projectile-inbound-facing")) {
      const html=contents.toString("utf8");
      const probe=`<script type="module">
        import {createDomSkillFxRenderer} from "../../src/adapters/renderer/dom-skill-fx.js";
        import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";
        import {normalizeSkillPresentationBinding} from "../../src/contracts/skill-presentation-binding.js";
        import {planSkillReleaseFx} from "../../src/core/fx/skill-fx-plan.js";
        import {createGlobalPresentationAssetResolverV1} from "../../src/assets/global-presentation-asset-resolver-v1.js";
        import {GLOBAL_VISUAL_LIBRARY,globalVisualAssetUrl} from "../../src/assets/global-visual-library.js?v=projectile-native-bidirectional-20261028";
        let fx=null;
        try {
          const files=await Promise.all(["graine_sansue_cap","coupe_feuille","cap_air_atk_4","fireball"].map(async name=>{
            const response=await fetch("../../data/capture/showcase/"+name+".capture-skill-transfer-v1.json",{cache:"no-store"});
            if(!response.ok)throw Error("skill author fixture missing: "+name);
            return (await response.json()).draft;
          }));
          const [graine,coupe,tornade,fireball]=files;
          const id=graine.id;
          // Asset metadata comes from the EXACT global-assets catalog used by
          // the running editor. No fabricated heading, sprite or second map.
          const mediaResponse=await fetch(GLOBAL_VISUAL_LIBRARY.catalogUrl,{cache:"no-store"});
          if(!mediaResponse.ok)throw Error("live media catalog unavailable: "+mediaResponse.status);
          const mediaCatalog=await mediaResponse.json();
          const assetForId=createGlobalPresentationAssetResolverV1({
            assetCatalog:mediaCatalog,assetUrlForFile:globalVisualAssetUrl
          });
          const directional=["pack:capture:sprite-graine-sangsue-projectile-01",
            "pack:capture:sprite-feuille-tranchante-projectile-03",
            "pack:capture:sprite-crachat-acide-projectile-01",
            "pack:capture:sprite-air-wind-bolt-01",
            "pack:capture:sprite-steel-wing-projectile-01",
            "pack:capture:sprite-kitsune-lunaire-projectile-01"];
          for(const assetId of directional){
            const resolved=assetForId(assetId);
            if(!resolved || resolved.headingRad!==0 || !resolved.url)
              throw Error("real direction metadata missing: "+assetId);
          }
          const legacyFireball=assetForId("pack:capture:sprite-fireball-travel-01");
          if(!legacyFireball || legacyFireball.headingRad!==Math.PI)
            throw Error("left-native legacy fireball heading missing from real media catalog");
          const projected=createCaptureSkillPresentationAssetsV2({
            skillPresentations:Object.fromEntries(files.map(file=>
              [file.id,normalizeSkillPresentationBinding(file.presentation)])),
            assetForId
          });
          const arena=document.createElement("div");
          arena.style.cssText="position:relative;width:900px;height:500px;pointer-events:none;";
          document.body.append(arena);
          const make=(left,top)=>{
            const n=document.createElement("div");
            n.style.cssText="position:absolute;left:"+left+"px;top:"+top+"px;width:80px;height:80px;";
            arena.append(n);return n;
          };
          const anchors={player:make(80,320),opponent:make(720,120)};
          fx=createDomSkillFxRenderer({
            arena,anchors,targetAnchors:anchors,
            presentationForSkill:(skillId,context)=>projected.presentationForSkill(skillId,context),
            animate(node,keyframes,options){
              return {node,keyframes,options,finished:new Promise(()=>{}),cancel(){}};
            }
          });
          const shoot=(fromSlot,targetSlot,fromPoint,skillId=id)=>{
            const before=arena.querySelectorAll(".skill-fx--projectile").length;
            fx.play({type:"projectile",skillId,fromSlot,targetSlot,
              ...(fromPoint?{fromPoint}:{}),durationMs:2500});
            const shell=arena.querySelectorAll(".skill-fx--projectile")[before];
            const sprite=shell?.querySelector(".skill-fx__sprite");
            if(!sprite)throw Error("native sprite not visible in direction "+fromSlot);
            return sprite.style.transform;
          };
          const outbound=shoot("player","opponent");
          const incoming=shoot("opponent","player");
          const fireballOutbound=shoot("player","opponent",null,fireball.id);
          const fireballIncoming=shoot("opponent","player",null,fireball.id);
          // Coupe feuille is genuinely a BEAM, not a projectile. Its real
          // path must be tested without a mocked projectile command.
          const beamsBefore=arena.querySelectorAll(".skill-fx--beam").length;
          fx.play({type:"beam",skillId:coupe.id,fromSlot:"opponent",targetSlot:"player",durationMs:2500});
          const coupeBeam=arena.querySelectorAll(".skill-fx--beam")[beamsBefore];
          if(!coupeBeam?.querySelector(".skill-fx__beam-body") ||
             !coupeBeam.style.transform.includes("rotate("))
            throw Error("Coupe feuille must render through its real beam owner");
          const neutralIncoming=shoot("opponent","player",null,tornade.id);
          const rect=arena.getBoundingClientRect();
          const contact={x:rect.left+730,y:rect.top+155};
          const action={skill:{id,form:"projectile",projectileTargeting:"direct",element:"air"},
            travelMs:2500,mirrorReturn:{contactPoint:contact}};
          const planned=planSkillReleaseFx({action,actorSlot:"opponent",targetSlot:"player"});
          if(planned.length!==1 || planned[0].fromPoint!==contact)
            throw Error("mirror return lost contact point");
          const reflected=shoot(planned[0].fromSlot,planned[0].targetSlot,planned[0].fromPoint);
          const fireballMirrorAction={skill:{id:fireball.id,form:"projectile",projectileTargeting:"direct",element:"fire"},
            travelMs:2500,mirrorReturn:{contactPoint:contact}};
          const fireballMirrorPlan=planSkillReleaseFx({action:fireballMirrorAction,actorSlot:"opponent",targetSlot:"player"});
          if(fireballMirrorPlan.length!==1 || fireballMirrorPlan[0].fromPoint!==contact)
            throw Error("fireball mirror must preserve real contact point");
          const fireballReflected=shoot(fireballMirrorPlan[0].fromSlot,fireballMirrorPlan[0].targetSlot,
            fireballMirrorPlan[0].fromPoint,fireball.id);
          // The same real media must stay upright when the PLAYER mirror
          // sends the enemy projectile back to the opponent (left -> right).
          const playerContact={x:rect.left+138,y:rect.top+351};
          const reverseAction={skill:{id,form:"projectile",projectileTargeting:"direct",element:"nature"},
            travelMs:2500,mirrorReturn:{contactPoint:playerContact}};
          const reversePlan=planSkillReleaseFx({action:reverseAction,actorSlot:"player",targetSlot:"opponent"});
          if(reversePlan.length!==1 || reversePlan[0].fromPoint!==playerContact)
            throw Error("player mirror return lost actual contact point");
          const reflectedRight=shoot(reversePlan[0].fromSlot,reversePlan[0].targetSlot,
            reversePlan[0].fromPoint,graine.id);
          const tilt=x=>Number(x.slice(x.indexOf("(")+1,x.indexOf("rad)")));
          if(outbound.includes("scaleX(-1)") ||
             !incoming.includes("scaleX(-1)") ||
             !fireballOutbound.includes("scaleX(-1)") ||
             fireballIncoming.includes("scaleX(-1)") ||
             fireballReflected.includes("scaleX(-1)") ||
             !reflected.includes("scaleX(-1)") ||

             reflectedRight.includes("scaleX(-1)") ||
             neutralIncoming!=="rotate(0rad)" ||
             ![outbound,incoming,fireballOutbound,fireballIncoming,reflected,fireballReflected,reflectedRight].every(x=>Math.abs(tilt(x))<Math.PI/2))
            throw Error("wrong real author projectile facing: "+
              JSON.stringify({outbound,incoming,fireballOutbound,fireballIncoming,neutralIncoming,reflected,fireballReflected,reflectedRight}));
          document.body.dataset.inboundProjectileProbe="ok:outbound:opponent:mirror:fireball:beam";
        } catch(error) {
          document.body.dataset.inboundProjectileProbe="fail:"+error.message;
        } finally {fx?.dispose();}
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }

    // Chromium smoke: actual HUD orb renderer inside the native editor page.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-energy-orbs")) {
      const html=contents.toString("utf8");
      const plugin=`<script type="module">
        import {createCombatEnergyOrbsRendererV1} from "../../src/adapters/renderer/combat-energy-orbs-v1.js";
        try {
          const host=document.createElement("div");
          host.className="hud__energy-orbs";
          host.style.width="180px";
          document.body.append(host);
          const hud=createCombatEnergyOrbsRendererV1({host});
          hud.render({energy:5,maxEnergy:12});
          if(host.children.length!==12 ||
              host.children[4].style.getPropertyValue("--energy-orb-fill")!=="100%" ||
              host.children[5].style.getPropertyValue("--energy-orb-fill")!=="0%")
            throw Error("native 5-of-12 is not drawn");
          if(getComputedStyle(host.children[0]).borderRadius!=="50%")
            throw Error("orb is not circular");
          hud.render({energy:5.5,maxEnergy:12});
          if(host.children[5].style.getPropertyValue("--energy-orb-fill")!=="50%")
            throw Error("half-filled orb missing");
          if(host.scrollWidth>host.clientWidth+1)
            throw Error("energy circles overflow 180px");
          hud.render({energy:6,maxEnergy:24});
          if(host.children.length!==12 || host.children[2].style.getPropertyValue("--energy-orb-fill")!=="100%" ||
              host.children[3].style.getPropertyValue("--energy-orb-fill")!=="0%")
            throw Error("proportional max>12 projection incorrect");
          if(host.getAttribute("aria-label")!=="Énergie : 6 sur 24")
            throw Error("accessible value mismatch");
          document.body.dataset.energyOrbsProbe="ok:12:5:50%";
        } catch(error) {
          document.body.dataset.energyOrbsProbe="fail:"+error.message;
        }
      </script>`;
      contents=Buffer.from(html.replace("</head>",plugin+"</head>"));
    }
    // Real healing-capability test despite an unrelated unsaved evolution target.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-heal-evolution-isolation")) {
      const html=contents.toString("utf8");
      const probe=`<script>
        document.addEventListener("DOMContentLoaded",()=>{
          let polls=0;
          const timer=setInterval(()=>{
            const q=(s)=>document.querySelector(s);
            const creature=q("[data-creature-library-select]");
            const skill=q("[data-skill-library-select]");
            if(!q("[data-creature-library-state]")?.textContent?.includes("3 modèles vitrine chargés") ||
               !creature?.querySelector('option[value="crea_lumilo"]') ||
               !skill?.querySelector('option[value="cap_light_special_1"]')){
              if(++polls>100){clearInterval(timer);document.body.dataset.healEvolutionProbe="timeout";}
              return;
            }
            clearInterval(timer);
            try{
              const change=(node,value)=>{node.value=value;node.dispatchEvent(new Event("change",{bubbles:true}));};
              change(creature,"crea_lumilo");
              const target=q("[data-evolution-target]");
              const enabled=q("[data-evolution-enabled]");
              if(!enabled.checked || !target.value) throw Error("saved Lumilo evolution missing");
              change(target,"");
              if(target.value!=="")throw Error("incomplete evolution not staged");
              change(skill,"cap_light_special_1");
              if(q("[data-skill-name]")?.value!=="Soin lumineux") throw Error("real Soin lumineux not loaded");
              q("[data-editor-validate]").click();
              const state=q("[data-editor-status]")?.textContent??"";
              if(!state.includes("Test de capacité prêt avec la créature enregistrée"))
                throw Error("skill testing blocked by unrelated evolution: "+state.slice(0,190));
              if(target.value!=="") throw Error("unsaved evolution was silently overwritten");
              change(creature,"crea_lumilo");
              if(q("[data-evolution-target]").value!=="crea_solarys")
                throw Error("saved creature evolution was mutated by test");
              document.body.dataset.healEvolutionProbe="ok:heal:preserve:creature";
            }catch(err){document.body.dataset.healEvolutionProbe="fail:"+err.message;}
          },100);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }

    // Author's real two movement selectors on the full Capture editor page.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url,"http://localhost").searchParams.has("verify-movement-face-back")) {
      const html=contents.toString("utf8");
      const probe=`<script>
        document.addEventListener("DOMContentLoaded",()=>{
          let attempts=0;
          const timer=setInterval(async()=>{
            const get=s=>document.querySelector(s);
            const lib=get("[data-creature-library-select]");
            const face=get("[data-creature-movement-visual]");
            const back=get("[data-creature-movement-back-visual]");
            const choices=[...face?.querySelectorAll('optgroup[data-asset-kind="movement"] option')??[]]
              .map(n=>n.value).filter(Boolean);
            if(!lib?.querySelector('option[value="crea-loup"]') || !face || !back ||
               choices.length < 2 || ![...back.options].some(n=>n.value===choices[1])){
              if(++attempts>95){clearInterval(timer);document.body.dataset.movementFaceBackProbe="timeout:missing-real-catalog"; }
              return;
            }
            clearInterval(timer);
            try {
              const change=(node,value)=>{
                if(!node) throw Error("missing field");
                node.value=String(value);
                node.dispatchEvent(new Event("change",{bubbles:true}));
              };
              change(lib,"crea-loup");
              if(get("[data-creature-name]")?.value!=="Loup volcanique")
                throw Error("real authored Loup not opened");
              change(face,choices[0]);
              change(back,choices[1]);
              change(get("[data-creature-movement-mode]"),"sprite");
              change(get("[data-creature-movement-frames]"),"12");
              change(get("[data-creature-movement-frame-ms]"),"80");
              change(get("[data-creature-movement-player-scale]"),"1.3");
              change(get("[data-creature-movement-opponent-scale]"),"0.9");
              get("[data-creature-update]").click();
              const savedState=get("[data-editor-status]")?.textContent??"";
              if(get("[data-editor-status]")?.dataset.tone==="error")
                throw Error("save rejected "+savedState.slice(0,180));
              change(lib,"crea_mossback");
              change(lib,"crea-loup");
              if(face.value!==choices[0] || back.value!==choices[1] ||
                 get("[data-creature-movement-frame-ms]").value!=="80" ||
                 get("[data-creature-movement-player-scale]").value!=="1.3" ||
                 get("[data-creature-movement-opponent-scale]").value!=="0.9")
                throw Error("saved face/back sprites lost when switching creature");
              let blob=null;
              const original=URL.createObjectURL;
              try{
                URL.createObjectURL=value=>{blob=value;return original.call(URL,value);};
                get("[data-export-current-creature]").click();
              }finally{URL.createObjectURL=original;}
              const exported=blob?JSON.parse(await blob.text()):null;
              const p=exported?.draft?.presentation;
              if(p?.version!==9 || p.visual.movement?.assetId!==choices[0] ||
                 p.visual.movementBack?.assetId!==choices[1] ||
                 p.visual.movementPlayback?.frameMs!==80 ||
                 p.visual.movementScaleByView?.player!==1.3 ||
                 p.visual.movementScaleByView?.opponent!==0.9)
                throw Error("real exported movement FACE/DOS not persisted");
              document.body.dataset.movementFaceBackProbe="ok:two-selects:save:reload:export";
            }catch(error){
              document.body.dataset.movementFaceBackProbe="fail:"+String(error.message??error).slice(0,160);
            }
          },100);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }

    // Regression on the actual author creature: only DOS has a sprite.
    // Test the real editor selector, save, reload and export, not a mock form.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url,"http://localhost").searchParams.has("verify-sprite-mode-back-only")) {
      const html=contents.toString("utf8");
      const probe=`<script>
        document.addEventListener("DOMContentLoaded",()=>{
          let attempts=0;
          const timer=setInterval(async()=>{
            const get=s=>document.querySelector(s);
            const lib=get("[data-creature-library-select]");
            if(!get("[data-creature-library-state]")?.textContent?.includes("3 modèles vitrine chargés") ||
               !lib?.querySelector('option[value="crea_foudrillon"]')){
              if(++attempts>95){clearInterval(timer);document.body.dataset.creatureSpriteModeProbe="timeout:showcase"; }
              return;
            }
            clearInterval(timer);
            try {
              const change=(node,value)=>{
                if(!node)throw Error("missing control");
                node.value=String(value);node.dispatchEvent(new Event("change",{bubbles:true}));
              };
              const mode=get("[data-creature-movement-mode]");
              const attack=get("[data-creature-ranged-attack-mode]");
              const front=get("[data-creature-movement-visual]");
              const back=get("[data-creature-movement-back-visual]");
              change(lib,"crea_foudrillon");
              if(get("[data-creature-name]").value!=="Freclairions")throw Error("wrong creature");
              if(front.value!=="" || !back.value.includes("guepe-cybernetique-movement-player"))
                throw Error("back-only author bindings not loaded");
              if(mode.value!=="sprite")throw Error("saved sprite read as "+mode.value);
              if(attack.value!=="sprite")throw Error("saved DOS attack read as "+attack.value);
              // Confirm editing also persists when only the DOS slot exists.
              change(mode,"static");
              get("[data-creature-update]").click();
              if(get("[data-editor-status]").dataset.tone==="error")throw Error("static save failed");
              change(lib,"crea_mossback");change(lib,"crea_foudrillon");
              if(mode.value!=="static")throw Error("static edit not reloaded");
              change(mode,"sprite");
              get("[data-creature-update]").click();
              if(get("[data-editor-status]").dataset.tone==="error")throw Error("sprite save failed");
              change(lib,"crea_mossback");change(lib,"crea_foudrillon");
              if(mode.value!=="sprite"||attack.value!=="sprite"||front.value!=="")
                throw Error("sprite mode reverted after save/reload");
              let blob=null;const native=URL.createObjectURL;
              try{
                URL.createObjectURL=value=>{blob=value;return native.call(URL,value);};
                get("[data-export-current-creature]").click();
              }finally{URL.createObjectURL=native;}
              const exported=blob?JSON.parse(await blob.text()):null;
              const v=exported?.draft?.presentation?.visual;
              if(v?.movement!==undefined || v.movementBack?.mode!=="sprite" ||
                 v.rangedAttack!==undefined || v.rangedAttackBack?.mode!=="sprite" ||
                 v.movementBack.assetId!=="pack:capture:creature-guepe-cybernetique-movement-player-12-v1")
                throw Error("export overwrote DOS sprite");
              document.body.dataset.creatureSpriteModeProbe="ok:back-only:sprite:save:reload:export";
            }catch(error){document.body.dataset.creatureSpriteModeProbe="fail:"+String(error.message??error).slice(0,180);}
          },100);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }

    // Soundtrack UI: exercise the real tab and saved silent scene with no uploaded media.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-soundtrack-authoring")) {
      const html=contents.toString("utf8");
      const probe=`<script>
        document.addEventListener("DOMContentLoaded",()=>{
          try {
            const tab=document.querySelector('[data-editor-tab="music"]');
            const panel=document.querySelector('[data-editor-panel="music"]');
            if(!tab||!panel) throw Error("missing music tab");
            tab.click();
            if(panel.hidden||tab.dataset.active!=="true")throw Error("tab not activated");
            const pick=selector=>panel.querySelector('[data-soundtrack-'+selector+']');
            if(pick("track-list").querySelectorAll("li").length!==6)throw Error("six Battle missing from default playlist");
            const upload=pick("local-files");
            if(!upload||!upload.multiple)throw Error("local soundtrack importer missing");
            const transfer=new DataTransfer();
            for(let i=1;i<=6;i++)transfer.items.add(
              new File([new Uint8Array(24)],"Battle_"+i+".mp3",{type:"audio/mpeg"})
            );
            upload.files=transfer.files;
            upload.dispatchEvent(new Event("change",{bubbles:true}));
            if(!pick("local-status").textContent.includes("6 / 6"))
              throw Error("six local Battle MP3s did not reach real editor resolver");
            document.documentElement.dataset.soundtrackLocalProbe="ok:six-battle:blob-session";
            pick("project-id").value="capture-browser-test";
            pick("new-project").click();
            pick("save").click();
            if(!pick("status").textContent.includes("Configuration enregistrée"))
              throw Error("silent scene not saved");
            document.documentElement.dataset.soundtrackAuthoringProbe="ok:tab:new-project:silent-save";
          }catch(error){document.documentElement.dataset.soundtrackAuthoringProbe="ERROR:"+error.message;}
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Actual editor/preview roster rendering, not a simulated roster.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url,"http://localhost").searchParams.has("verify-roster-menu-teams")) {
      const html=contents.toString("utf8");
      const script='<script src="/tests/browser/roster-menu-visibility-probe.js"></script>';
      contents=Buffer.from(html.replace("</head>",script+"</head>"));
    }

    // Real Chrome validation of the exact skill that previously blocked test.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url,"http://localhost").searchParams.has("verify-solar-reserve-status")) {
      const html=contents.toString("utf8");
      const probe=`<script>
        document.addEventListener("DOMContentLoaded",()=>{
          let polls=0;
          const q=s=>document.querySelector(s);
          const timer=setInterval(()=>{
            const creature=q("[data-creature-library-select]");
            const skill=q("[data-skill-library-select]");
            if(!q("[data-creature-library-state]")?.textContent?.includes("3 modèles vitrine chargés") ||
               !creature?.querySelector('option[value="crea_lumilo"]') ||
               !skill?.querySelector('option[value="cap_light_atk_3"]')) {
              if(++polls>100){clearInterval(timer);document.body.dataset.solarReserveProbe="timeout";}
              return;
            }
            clearInterval(timer);
            try {
              const change=(el,id)=>{el.value=id;el.dispatchEvent(new Event("change",{bubbles:true}));};
              change(creature,"crea_lumilo");
              change(skill,"cap_light_atk_3");
              if(q("[data-skill-name]")?.value!=="Charge solaire")throw Error("skill not loaded");
              q("[data-editor-validate]").click();
              const message=q("[data-editor-status]")?.textContent??"";
              if(!message.includes("Configuration valide") && !message.includes("Test de capacité prêt"))
                throw Error("Solar reserve status rejected: "+message.slice(0,220));
              document.body.dataset.solarReserveProbe="ok:solar:status:reserve:valid";
            } catch(e) {
              document.body.dataset.solarReserveProbe="fail:"+e.message;
            }
          },100);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }

    // Real Charge solaire animation path, not just validation of the editor form.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-solar-live-cast")) {
      const html=contents.toString("utf8");
      contents=Buffer.from(html.replace("</head>",
        '<script src="/tests/browser/solar-charge-real-cast-probe.js"></script></head>'));
    }

    // Real marker authoring through the existing skill editor and active configuredSkills.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-markers")) {
      const html=contents.toString("utf8");
      const probe=`<script>
        document.addEventListener("DOMContentLoaded",()=>{
          let attempts=0;
          const timer=setInterval(async()=>{
            const lib=document.querySelector("[data-skill-library-select]");
            const ready=document.querySelector("[data-creature-library-state]")
              ?.textContent?.includes("3 modèles vitrine chargés");
            if(!ready || !lib?.querySelector('option[value="lib_aqua_heal"]')){
              if(++attempts>70){clearInterval(timer);document.body.dataset.markerProbe="timeout";}
              return;
            }
            clearInterval(timer);
            try{
              const get=key=>document.querySelector("[data-"+key+"]");
              const fill=(key,v)=>{const node=get(key);if(!node)throw Error("field "+key+" absent");
                node.value=String(v);node.dispatchEvent(new Event("change",{bubbles:true}));};
              // Graine sansue and its shared marker must BOTH originate
              // from the canonical showcase catalogs after actual browser boot.
              if(!lib.querySelector('option[value="graine_sansue_cap"]'))
                throw Error("Graine sansue missing from the active skill library");
              if(!get("marker-library-select")?.querySelector('option[value="graine-sansue"]'))
                throw Error("Graine sansue missing from the shared marker library");
              lib.value="graine_sansue_cap";lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name")?.value!=="Graine sansue" ||
                 get("skill-required-level")?.value!=="5" ||
                 get("skill-cooldown")?.value!=="10000" ||
                 get("skill-icon")?.value!=="pack:capture:icon-skill-graine-sangsue-01" ||
                 get("skill-travel-fx")?.value!=="pack:capture:sprite-graine-sangsue-projectile-01")
                throw Error("Graine sansue latest author skill settings not loaded");
              const graineRows=[...document.querySelectorAll("[data-skill-effect-row]")];
              const graineMarker=graineRows.find(row=>
                row.querySelector("[data-skill-effect-kind]")?.value==="apply_marker");
              if(!graineMarker ||
                 graineMarker.querySelector("[data-skill-marker-pick]")?.value!=="graine-sansue" ||
                 graineMarker.querySelector("[data-skill-marker-charges]")?.value!=="1")
                throw Error("Graine sansue does not use its single authored marker");
              const markerSelect=get("marker-library-select");
              markerSelect.value="graine-sansue";
              markerSelect.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("marker-periodic-kind")?.value!=="life_steal" ||
                 get("marker-periodic-percent")?.value!=="100" ||
                 get("marker-periodic-seconds")?.value!=="3" ||
                 get("marker-periodic-channel")?.value!=="nature" ||
                 get("marker-max")?.value!=="2")
                throw Error("Shared Graine sansue drain is not loaded from its original author preset");
              // The three new author sheets must be read back from their
              // active owner after startup, never a native/legacy fallback.
              const lumiloSelect=get("creature-library-select");
              if(!lumiloSelect?.querySelector('option[value="crea_nat_1"]'))
                throw Error("Grainou missing from canonical creature library");
              lumiloSelect.value="crea_nat_1";
              lumiloSelect.dispatchEvent(new Event("change",{bubbles:true}));
              const grainouSlots=[...document.querySelectorAll("[data-loadout-slot]")].map(x=>x.value);
              if(get("creature-name")?.value!=="Grainou" ||
                 grainouSlots[0]!=="coupe_feuille" ||
                 grainouSlots[1]!=="graine_sansue_cap" ||
                 grainouSlots[2]!=="Spore_soporifique" ||
                 get("creature-reaction-type")?.value!=="defense" ||
                 get("creature-reaction-charges")?.value!=="2" ||
                 get("creature-reaction-recharge")?.value!=="20" ||
                 get("creature-reaction-window")?.value!=="0.8" ||
                 get("creature-reaction-reduction")?.value!=="30")
                throw Error("Grainou latest author loadout or defensive reaction not loaded: "+
                  JSON.stringify({slots:grainouSlots,reaction:get("creature-reaction-type")?.value,
                    charges:get("creature-reaction-charges")?.value,
                    recharge:get("creature-reaction-recharge")?.value,
                    window:get("creature-reaction-window")?.value,
                    reduction:get("creature-reaction-reduction")?.value}));
              if(!lumiloSelect?.querySelector('option[value="crea_ombre_2"]'))
                throw Error("Noctigriffe missing from configured creature owner");
              const teamSelect=get("test-opponent-creature");
              if(!document.querySelector('[data-test-opponent-creature] optgroup option[value="crea_ombre_2"]')||
                 ![...document.querySelectorAll('[data-test-opponent-creature] optgroup')]
                   .some(group=>group.label==="Ombre"&&group.querySelector('option[value="crea_ombre_2"]')))
                throw Error("Opponent combat selector must group Noctigriffe under Ombre");
              if(!document.querySelector('[data-editor-panel="skills"] [data-marker-cost-card]')||
                  document.querySelector('[data-editor-panel="creature"] [data-marker-cost-card]'))
                throw Error("Charge cost editor must be under Capacités, never Créature");
              if(!lumiloSelect?.querySelector('option[value="crea_lumilo"]'))
                throw Error("Lumilo missing from canonical creature selector");
              lumiloSelect.value="crea_lumilo";
              lumiloSelect.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("creature-name")?.value!=="Lumilo" ||
                 get("creature-level")?.value!=="1")
                throw Error("Lumilo authored draft not reloaded");
              const lumiloSlots=[...document.querySelectorAll("[data-loadout-slot]")].map(x=>x.value);
              if(lumiloSlots.join(",")!=="lib_light_bolt,lib_magic_barrier,cap_light_special_1,cap_light_atk_3,cap_light_atk_5")
                throw Error("Lumilo five authored slots lost on reload: "+lumiloSlots.join(","));
              if(!lib.querySelector('option[value="lib_light_bolt"]')||
                 !lib.querySelector('option[value="cap_light_atk_5"]')||
                 !lib.querySelector('option[value="Nid_frelon"]'))
                throw Error("new light skill entries missing or prior Nid vanished");
              lib.value="lib_magic_barrier";
              lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name")?.value!=="Barrière lumineuse"||
                 get("skill-required-level")?.value!=="5"||
                 get("skill-cooldown")?.value!=="50000")
                throw Error("author Barrière lumineuse not loaded from canonical library");
              const barrierRow=[...document.querySelectorAll("[data-skill-effect-row]")]
                .find(row=>row.querySelector("[data-skill-status-kind]")?.value==="projectile_mirror");
              if(!barrierRow||
                 barrierRow.querySelector("[data-skill-status-duration-seconds]")?.value!=="30"||
                 barrierRow.querySelector("[data-skill-status-visual-mode]")?.value!=="sprite"||
                 barrierRow.querySelector("[data-skill-status-visual-asset]")?.value!=="pack:capture:sprite-light-shield-barrier-01"||
                 barrierRow.querySelector("[data-skill-status-visual-scale]")?.value!=="2.7"||
                 barrierRow.querySelector("[data-skill-status-visual-opacity]")?.value!=="50")
                throw Error("Barrière 30-second mirror status, scale 2.7 and the authored light shield sprite lost in editor");
              let barrierBlob=null;
              const originalBarrierUrl=URL.createObjectURL;
              try {
                URL.createObjectURL=blob=>{barrierBlob=blob;return originalBarrierUrl.call(URL,blob);};
                get("export-current-skill").click();
              } finally {URL.createObjectURL=originalBarrierUrl;}
              const barrierExport=barrierBlob?JSON.parse(await barrierBlob.text()):null;
              if(barrierExport?.draft?.definition?.effects?.[0]?.status?.kind!=="projectile_mirror"||
                 barrierExport?.draft?.presentation?.statusVisuals?.["lib_magic_barrier:0"]?.sprite?.displayScale!==2.7)
                throw Error("real Barrier export lost mirror status or visual sprite surface");
              lib.value="lib_light_bolt";lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name")?.value!=="Rayon lumineux"||
                 get("skill-preparation")?.value!=="600"||
                 get("skill-travel-time")?.value!=="600"||
                 get("skill-cooldown")?.value!=="8000"||
                 get("skill-required-level")?.value!=="1"||
                 get("skill-icon")?.value!=="core:icon-skill-holy-beam-01")
                throw Error("Rayon lumineux authored projectile not loaded correctly");
              lib.value="cap_light_atk_5";lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name")?.value!=="Onde lumineuse"||
                 get("skill-required-level")?.value!=="20")
                throw Error("corrected Onde lumineuse ultimate not loaded");
              const healing=[...document.querySelectorAll("[data-skill-effect-row]")]
                .map(row=>({
                  kind:row.querySelector("[data-skill-effect-kind]")?.value,
                  scope:row.querySelector("[data-skill-effect-scope]")?.value,
                  amount:row.querySelector("[data-skill-effect-amount]")?.value
                }));
              if(healing.length!==2||healing[0].kind!=="heal"||
                 healing[0].scope!=="all_allies"||healing[0].amount!=="100"||
                 healing[1].kind!=="heal"||healing[1].scope!=="all_ally_reserves"||
                 healing[1].amount!=="100")
                throw Error("Onde lumineuse 100 HP ally active/reserve healing not restored: "+JSON.stringify(healing));
              let waveBlob=null;
              const createWaveBlob=URL.createObjectURL;
              try{
                URL.createObjectURL=blob=>{waveBlob=blob;return createWaveBlob.call(URL,blob);};
                get("export-current-skill").click();
              }finally{URL.createObjectURL=createWaveBlob;}
              const savedWave=waveBlob?JSON.parse(await waveBlob.text()):null;
              const savedEffects=savedWave?.draft?.definition?.effects;
              if(savedEffects?.length!==2||savedEffects.some(e=>e.kind!=="heal"||e.amount!==100)||
                 savedEffects[0].targetScope!=="all_allies"||
                 savedEffects[1].targetScope!=="all_ally_reserves")
                throw Error("real Onde lumineuse skill export changed 100 HP reserve heal");
              lumiloSelect.value="crea_foudrillon";
              lumiloSelect.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("creature-name")?.value!=="Freclairions")
                throw Error("prior Freclairions was replaced by Lumilo accidentally");
              // The canonical creature selector must reload the newly authored skill loadout.
              const creature=get("creature-library-select");
              if(!creature?.querySelector('option[value="crea_foudrillon"]')||
                 !creature?.querySelector('option[value="crea_ailevent"]'))
                throw Error("Foudrillon or Ailevent missing from canonical creature menu");
              creature.value="crea_foudrillon";creature.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("creature-name")?.value!=="Freclairions"||get("creature-level")?.value!=="1")
                throw Error("Freclairions did not load from configuredCreatures");
              const equipped=[...document.querySelectorAll("[data-loadout-slot]")].map(n=>n.value);
              if(equipped.join(",")!=="lib_paralyze,choc_venin,lib_tailwind,vol_eclaire,Nid_frelon")
                throw Error("Freclairions authored 5-slot loadout was not reloaded: "+equipped.join(","));
              creature.value="crea_ailevent";creature.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("creature-name")?.value!=="Ailevent")
                throw Error("Ailevent active menu reference disappeared");
              creature.value="crea_foudrillon";creature.dispatchEvent(new Event("change",{bubbles:true}));
              // Author files from 17 Oct: Vol eclaire and Nid de frelon
              // are actual library entries, never UI-only local defaults.
              if(!lib.querySelector('option[value="vol_eclaire"]')||
                 !lib.querySelector('option[value="Nid_frelon"]'))
                throw Error("Vol eclaire / Nid de frelon missing from active skill selector");
              lib.value="vol_eclaire";lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name")?.value!=="Vol éclaire" ||
                 get("skill-required-level")?.value!=="15")
                throw Error("Vol eclaire new author skill not reloaded");
              const volMarker=[...document.querySelectorAll("[data-skill-effect-row]")]
                .find(row=>row.querySelector("[data-skill-effect-kind]")?.value==="apply_marker");
              if(volMarker?.querySelector("[data-skill-marker-charges]")?.value!=="2")
                throw Error("Vol eclaire native two charges lost from author export");
              lib.value="Nid_frelon";lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name")?.value!=="Nid de frelon" ||
                 get("skill-required-level")?.value!=="20")
                throw Error("Nid de frelon ultimate not selected from active skill owner");
              const nidMarkers=[...document.querySelectorAll("[data-skill-effect-row]")]
                .filter(row=>row.querySelector("[data-skill-effect-kind]")?.value==="apply_marker");
              const nidScopes=nidMarkers.map(row=>row.querySelector("[data-skill-effect-scope]")?.value);
              if(nidScopes.join(",")!=="all_enemies,all_enemy_reserves" ||
                 nidMarkers.some(row=>row.querySelector("[data-skill-marker-charges]")?.value!=="5" ||
                   row.querySelector("[data-skill-marker-pick]")?.value!=="venin-static"))
                throw Error("Nid de frelon active & reserve 5-charge marker scopes not rendered: "+JSON.stringify({name:get("skill-name").value,scopes:nidScopes,charges:nidMarkers.map(row=>row.querySelector("[data-skill-marker-charges]")?.value),markers:nidMarkers.map(row=>row.querySelector("[data-skill-marker-pick]")?.value)}));
              // Author's real Dard static transfer: the uploaded marker-library JSON
              // is empty; the skill's single canonical apply_marker must populate it.
              if(!lib.querySelector('option[value="lib_paralyze"]'))
                throw Error("Dard static missing from active configuredSkills options");
              if(!get("marker-library-select").querySelector('option[value="venin-static"]'))
                throw Error("Venin static not indexed from authored skill");
              lib.value="lib_paralyze";lib.dispatchEvent(new Event("change",{bubbles:true}));
              if(get("skill-name").value!=="Dard static")
                throw Error("Dard static author name not roundtripped");
              const authoredMarker=[...document.querySelectorAll("[data-skill-effect-row]")]
                .find(row=>row.querySelector("[data-skill-effect-kind]")?.value==="apply_marker");
              if(!authoredMarker||
                  authoredMarker.querySelector("[data-skill-marker-pick]")?.value!=="venin-static"||
                  authoredMarker.querySelector("[data-skill-marker-charges]")?.value!=="1")
                throw Error("Dard static Venin placement not rendered from canonical skill");
              // Two author transfers are canonical: Dard places Venin, Choc spends it.
               if(!lib.querySelector('option[value="choc_venin"]'))
                 throw Error("Choc venimeux missing from active configuredSkills options");
               lib.value="choc_venin";lib.dispatchEvent(new Event("change",{bubbles:true}));
               if(get("skill-name").value!=="Choc venimeux" ||
                   get("skill-icon").value!=="pack:capture:icon-skill-paralysie-01" ||
                   get("skill-preparation").value!=="700" ||
                   get("skill-cooldown").value!=="45000" ||
                   get("skill-required-level").value!=="5")
                 throw Error("Choc venimeux author name/icon not loaded");
               const consumeRow=[...document.querySelectorAll("[data-skill-effect-row]")]
                 .find(row=>row.querySelector("[data-skill-effect-kind]")?.value==="consume_marker");
               if(!consumeRow ||
                   consumeRow.querySelector("[data-skill-consume-marker-pick]")?.value!=="venin-static"||
                   !consumeRow.querySelector("[data-marker-consume-per-charge]")?.checked||
                   consumeRow.querySelector("[data-marker-consume-minimum]")?.value!=="1"||
                   consumeRow.querySelector("[data-marker-result-amount]")?.value!=="10"||
                   consumeRow.querySelector("[data-marker-result-channel]")?.value!=="electric")
                 throw Error("Choc venimeux per-charge form was not mounted correctly");
               let skillBlob=null;
               const originalSkillUrl=URL.createObjectURL;
               try{
                 URL.createObjectURL=blob=>{skillBlob=blob;return originalSkillUrl.call(URL,blob);};
                 get("export-current-skill").click();
               }finally{URL.createObjectURL=originalSkillUrl;}
               const chocTransfer=skillBlob?JSON.parse(await skillBlob.text()):null;
               if(chocTransfer?.draft?.definition?.effects?.[0]?.perCharge!==true)
                 throw Error("Choc venimeux did not export its per-charge flag");
               lib.value="lib_paralyze";lib.dispatchEvent(new Event("change",{bubbles:true}));
               // The user's actual export was markers:[] despite this skill
              // containing Venin. Inspect the REAL JSON Blob downloaded from
              // the existing "Exporter la bibliothèque" button.
              const originalCreate=URL.createObjectURL;
              let captured=null;
              try {
                URL.createObjectURL=blob=>{captured=blob;return originalCreate.call(URL,blob);};
                get("marker-export").click();
              } finally {URL.createObjectURL=originalCreate;}
              if(!captured)throw Error("marker export generated no JSON blob despite authored skill");
              const exported=JSON.parse(await captured.text());
              const author=exported.markers?.find(x=>x.id==="venin-static");
              if(exported.schema!=="capture-markers-v1"||!author||
                 author.permanent!==true||author.maxStacks!==20||
                 author.periodic?.amount!==2||author.periodic?.intervalMs!==5000||
                 author.periodic?.channel!=="electric"||
                 author.onStackThreshold?.count!==20||
                 author.onStackThreshold?.effects?.[0]?.kind!=="knockout")
                throw Error("real marker-library export omitted or changed Venin from Dard static");
              fill("marker-library-select","venin-static");
              if(!get("marker-permanent").checked||
                  get("marker-max").value!=="20"||
                  get("marker-periodic-amount").value!=="2"||
                  get("marker-periodic-seconds").value!=="5"||
                  get("marker-threshold-count").value!=="20"||
                  get("marker-threshold-effect").value!=="knockout")
                throw Error("Dard static Venin permanent/periodic/KO author settings not reloaded");
              // Android author path: a marker must be savable using its NAME only.
              // Previous smoke artificially supplied a valid technical ID and
              // therefore did not detect the reported mobile regression.
              lib.value="lib_aqua_heal";lib.dispatchEvent(new Event("change",{bubbles:true}));
              get("skill-effect-add").click();
              const preRow=[...document.querySelectorAll("[data-skill-effect-row]")].at(-1);
              const preKind=preRow.querySelector("[data-skill-effect-kind]");
              preKind.value="apply_marker";preKind.dispatchEvent(new Event("change",{bubbles:true}));
              const prePicker=preRow.querySelector("[data-skill-marker-pick]");
              if(!prePicker)throw Error("marker effect picker not mounted");
              // The showcase now offers Peste as well as Venin: select the
              // known pre-existing Venin explicitly, not by option ordering.
              prePicker.value="venin-static";
              prePicker.dispatchEvent(new Event("change",{bubbles:true}));
              if(prePicker.value!=="venin-static")throw Error("existing Venin marker unavailable");
              const periodicChannel=get("marker-periodic-channel");
              const thresholdChannel=get("marker-threshold-channel");
              const iconPicker=get("marker-icon");
              const values=select=>[...select.options].map(x=>x.value);
              if(periodicChannel.tagName!=="SELECT" ||
                 thresholdChannel.tagName!=="SELECT" ||
                 !values(periodicChannel).includes("physical") ||
                 !values(periodicChannel).includes("fire") ||
                 !values(periodicChannel).includes("poison") ||
                 !values(thresholdChannel).includes("poison"))
                throw Error("native element menu missing from marker references");
              if(iconPicker.tagName!=="SELECT" ||
                 ![...iconPicker.options].some(x=>x.value))
                throw Error("marker icon chooser did not reuse global asset catalog");
              const iconId=[...iconPicker.options].find(x=>x.value)?.value;
              get("marker-new").click();
              fill("marker-name","Poïson test");
              if(!get("marker-id").readOnly)throw Error("marker technical ID must never need manual entry");
              if(get("marker-id").value!=="")throw Error("new marker must not require a prefilled technical ID");
              fill("marker-max",10);
              fill("marker-duration",10);
              get("marker-periodic-enabled").checked=true;
              get("marker-periodic-enabled").dispatchEvent(new Event("change",{bubbles:true}));
              fill("marker-periodic-kind","damage");
              fill("marker-periodic-amount",5);
              fill("marker-periodic-seconds",5);
              fill("marker-periodic-mode","combat");
              fill("marker-periodic-channel","poison");
              fill("marker-icon",iconId);
              get("marker-threshold-enabled").checked=true;
              fill("marker-threshold-count",10);
              fill("marker-threshold-effect","damage");
              fill("marker-threshold-amount",90);
              fill("marker-threshold-channel","fire");
              get("marker-save").click();
              if(!get("marker-library-state").textContent.includes("enregistré"))throw Error("marker library save failed: "+get("marker-library-state").textContent);
              if(get("marker-id").value!=="poison-test"||!get("marker-id").readOnly)
                throw Error("name-only author save failed to create and lock canonical poison ID");
              if(get("marker-periodic-channel").value!=="poison"||
                 get("marker-threshold-channel").value!=="fire"||
                 get("marker-icon").value!==iconId)
                throw Error("marker dropdown selections lost on save");
              if(!prePicker.querySelector('option[value="poison-test"]')||prePicker.value!=="venin-static")
                throw Error("new marker was not offered, or existing Venin choice was silently overwritten");
              // Native life-steal marker: real Android author flow in the SAME
              // marker library, including conditional fields and export/reload.
              get("marker-new").click();
              fill("marker-name","Drain vital");
              get("marker-periodic-enabled").checked=true;
              get("marker-periodic-enabled").dispatchEvent(new Event("change",{bubbles:true}));
              fill("marker-periodic-kind","life_steal");
              if(get("marker-periodic-percent-setting").hidden ||
                 get("marker-periodic-max-heal-setting").hidden)
                throw Error("life drain fields were not revealed by the real editor");
              fill("marker-periodic-amount",5);
              fill("marker-periodic-seconds",5);
              fill("marker-periodic-mode","fixed");
              fill("marker-periodic-channel","poison");
              fill("marker-periodic-percent",50);
              fill("marker-periodic-max-heal",8);
              get("marker-save").click();
              if(!get("marker-library-state").textContent.includes("enregistré"))
                throw Error("life drain marker save failed: "+get("marker-library-state").textContent);
              if(get("marker-id").value!=="drain-vital")
                throw Error("life drain marker did not use a generated stable ID");
              fill("marker-library-select","drain-vital");
              if(get("marker-periodic-kind").value!=="life_steal" ||
                 get("marker-periodic-percent").value!=="50" ||
                 get("marker-periodic-max-heal").value!=="8" ||
                 get("marker-periodic-channel").value!=="poison")
                throw Error("life drain marker did not reload its typed definition");
              const drainCreate=URL.createObjectURL;
              let drainBlob=null;
              try {
                URL.createObjectURL=blob=>{drainBlob=blob;return drainCreate.call(URL,blob);};
                get("marker-export").click();
              } finally {URL.createObjectURL=drainCreate;}
              const exportedDrain=drainBlob?JSON.parse(await drainBlob.text()):null;
              const drainMarker=exportedDrain?.markers?.find(x=>x.id==="drain-vital");
              if(drainMarker?.periodic?.kind!=="life_steal" ||
                 drainMarker.periodic.percent!==50 || drainMarker.periodic.maxHeal!==8 ||
                 drainMarker.periodic.amount!==5 || drainMarker.periodic.channel!=="poison")
                throw Error("life drain marker export lost its native properties");
              fill("marker-library-select","poison-test");
              get("marker-new").click();
              fill("marker-name","Poïson test");
              get("marker-save").click();
              if(!get("marker-library-state").textContent.includes("déjà enregistré"))
                throw Error("new marker with existing ID silently overwrites prior author definition");
              fill("marker-library-select","poison-test");
              if(!get("marker-id").readOnly)throw Error("existing marker ID must be immutable");
              // Real Android workflow: permanence is a checkbox, NOT durationMs=0.
              get("marker-new").click();
              fill("marker-name","Éternel");
              const eternal=get("marker-permanent");
              eternal.checked=true;
              eternal.dispatchEvent(new Event("change",{bubbles:true}));
              if(!get("marker-duration").disabled)throw Error("permanent should disable seconds input");
              fill("marker-duration",0);
              get("marker-save").click();
              if(!get("marker-library-state").textContent.includes("enregistré"))
                throw Error("permanent marker save rejected zero duration: "+get("marker-library-state").textContent);
              if(get("marker-id").value!=="eternel")throw Error("accented permanent marker slug invalid");
              fill("marker-library-select","poison-test");
              if(get("marker-permanent").checked || get("marker-duration").disabled)
                throw Error("loading timed marker must restore ordinary duration field");
              if(get("marker-periodic-channel").value!=="poison" ||
                 get("marker-threshold-channel").value!=="fire" ||
                 get("marker-icon").value!==iconId)
                throw Error("marker reference dropdowns did not roundtrip");
              fill("marker-library-select","eternel");
              if(!get("marker-permanent").checked || !get("marker-duration").disabled)
                throw Error("loading permanent marker lost unchecked duration model");
              fill("marker-library-select","poison-test");
              // Advanced marker controls: real Chromium creation, 3-charge threshold,
              // repeated movement slow and two extra native debuffs; reload/export.
              get("marker-new").click();
              fill("marker-name","Lenteur avancée");
              fill("marker-max",24);
              // Independent effect applies already at the FIRST stack, not after threshold.
              const chargeEnabled=get("marker-charge-enabled");
              chargeEnabled.checked=true;
              chargeEnabled.dispatchEvent(new Event("change",{bubbles:true}));
              fill("marker-charge-effect","reduce_stat");
              fill("marker-charge-amount",2);
              fill("marker-charge-status-duration",6);
              fill("marker-charge-stat-mode","points");
              if(![...get("marker-charge-stat").options].some(x=>x.value==="esprit"))
                throw Error("Esprit unavailable for single-charge marker native stat debuff");
              fill("marker-charge-stat","esprit");
              const chargeHost=get("marker-charge-extra-host");
              get("marker-charge-add-effect").click();
              const chargeExtra=chargeHost.querySelector("[data-marker-charge-extra]");
              if(!chargeExtra)throw Error("single-charge marker multi-effect authoring not mounted");
              const chargeExtraKind=chargeExtra.querySelector("[data-marker-extra-kind]");
              chargeExtraKind.value="slow_cooldown";
              chargeExtraKind.dispatchEvent(new Event("change",{bubbles:true}));
              chargeExtra.querySelector("[data-marker-extra-amount]").value="10";
              chargeExtra.querySelector("[data-marker-extra-duration]").value="6";
              fill("marker-duration",20);
              const thresholdToggle=get("marker-threshold-enabled");
              thresholdToggle.checked=true;
              thresholdToggle.dispatchEvent(new Event("change",{bubbles:true}));
              fill("marker-threshold-count",3);
              fill("marker-threshold-consume","keep");
              get("marker-threshold-repeat").checked=true;
              get("marker-threshold-repeat").dispatchEvent(new Event("change",{bubbles:true}));
              fill("marker-threshold-effect","slow_movement");
              fill("marker-threshold-amount",15);
              fill("marker-threshold-status-duration",4);
              const extrasHost=get("marker-threshold-extra-host");
              get("marker-threshold-add-effect").click();
              let advancedExtra=[...extrasHost.querySelectorAll("[data-marker-threshold-extra]")].at(-1);
              if(!advancedExtra)throw Error("advanced marker extra effect row missing");
              const setExtra=(row,key,val)=>{
                const node=row.querySelector("[data-"+key+"]");
                if(!node)throw Error("advanced marker extra field missing: "+key);
                node.value=String(val);node.dispatchEvent(new Event("change",{bubbles:true}));
              };
              setExtra(advancedExtra,"marker-extra-kind","slow_cooldown");
              setExtra(advancedExtra,"marker-extra-amount",10);
              setExtra(advancedExtra,"marker-extra-duration",4);
              get("marker-threshold-add-effect").click();
              advancedExtra=[...extrasHost.querySelectorAll("[data-marker-threshold-extra]")].at(-1);
              setExtra(advancedExtra,"marker-extra-kind","reduce_stat");
              setExtra(advancedExtra,"marker-extra-amount",5);
              setExtra(advancedExtra,"marker-extra-duration",4);
              if(![...advancedExtra.querySelector("[data-marker-extra-stat]").options].some(x=>x.value==="esprit"))
                throw Error("Esprit missing from real advanced marker stat dropdown");
              setExtra(advancedExtra,"marker-extra-stat","esprit");
              get("marker-save").click();
              if(!get("marker-library-state").textContent.includes("enregistré"))
                throw Error("advanced marker save failed: "+get("marker-library-state").textContent);
              fill("marker-library-select","lenteur-avancee");
              if(!get("marker-charge-enabled").checked ||
                 get("marker-charge-effect").value!=="reduce_stat" ||
                 get("marker-charge-stat").value!=="esprit" ||
                 chargeHost.querySelectorAll("[data-marker-charge-extra]").length!==1)
                throw Error("individual per-charge status settings did not survive author reload");
              if(get("marker-threshold-count").value!=="3" ||
                 !get("marker-threshold-repeat").checked ||
                 get("marker-threshold-effect").value!=="slow_movement" ||
                 extrasHost.querySelectorAll("[data-marker-threshold-extra]").length!==2)
                throw Error("advanced marker form did not survive saved-library reload");
              let advancedBlob=null;
              const originalMarkerExport=URL.createObjectURL;
              try {
                URL.createObjectURL=blob=>{advancedBlob=blob;return originalMarkerExport.call(URL,blob);};
                get("marker-export").click();
              } finally {URL.createObjectURL=originalMarkerExport;}
              const exportedAdvanced=advancedBlob?JSON.parse(await advancedBlob.text()):null;
              const advancedEntry=exportedAdvanced?.markers?.find(x=>x.id==="lenteur-avancee");
              if(!advancedEntry ||
                 advancedEntry.onStackAdded?.effects?.length!==2 ||
                 advancedEntry.onStackAdded.effects[0]?.status?.kind!=="stat_modifier" ||
                 advancedEntry.onStackAdded.effects[0]?.status?.statId!=="esprit" ||
                 advancedEntry.onStackAdded.effects[1]?.status?.kind!=="skill_cooldown_rate_modifier" ||
                 advancedEntry.maxStacks!==24 ||
                 advancedEntry.onStackThreshold?.repeat!=="each_addition" ||
                 advancedEntry.onStackThreshold?.effects?.length!==3 ||
                 advancedEntry.onStackThreshold.effects[0]?.status?.kind!=="approach_time_modifier" ||
                 advancedEntry.onStackThreshold.effects[1]?.status?.kind!=="skill_cooldown_rate_modifier" ||
                 advancedEntry.onStackThreshold.effects[2]?.status?.statId!=="esprit")
                throw Error("advanced marker export lost repeat, native status kinds or Esprit stat");
              fill("marker-library-select","poison");
              lib.value="lib_aqua_heal";lib.dispatchEvent(new Event("change",{bubbles:true}));
              get("skill-marker-cost-enabled").checked=true;
              get("skill-marker-cost-enabled").dispatchEvent(new Event("change",{bubbles:true}));
              fill("skill-marker-cost-id","poison");
              fill("skill-marker-cost-source","target");
              fill("skill-marker-cost-count",2);
              const add=()=>{get("skill-effect-add").click();return [...document.querySelectorAll("[data-skill-effect-row]")].at(-1);};
              const kind=(row,v)=>{const sel=row.querySelector("[data-skill-effect-kind]");
                sel.value=v;sel.dispatchEvent(new Event("change",{bubbles:true}));};
              let row=add();kind(row,"apply_marker");
              const marker=row.querySelector("[data-skill-marker-pick]");
              if(!marker?.querySelector('option[value="poison"]'))throw Error("marker not in ability picker");
              marker.value="poison";
              row.querySelector("[data-skill-marker-charges]").value="3";
              row=add();kind(row,"apply_marker");
              row.querySelector("[data-skill-marker-pick]").value="eternel";
              row.querySelector("[data-skill-marker-charges]").value="2";
              row=add();kind(row,"consume_marker");
              row.querySelector("[data-skill-consume-marker-pick]").value="*";
              row.querySelector("[data-marker-consume-mode]").value="all";
              const nestedChannel=row.querySelector("[data-marker-result-channel]");
              if(!nestedChannel || nestedChannel.tagName!=="SELECT" ||
                 !values(nestedChannel).includes("fire"))
                throw Error("consumed-marker nested damage channel is still a typed ID");
              row.querySelector("[data-marker-result-kind]").value="heal";
              row.querySelector("[data-marker-result-amount]").value="7";
              // This skill row also owns HIDDEN stack/zone add buttons:
              // scope the click to the consume-marker card, never the first
              // unrelated "Ajouter un effet" anywhere in the row.
              const consumeCard=row.querySelector('[data-skill-effect-config-kind="consume_marker"]');
              const addNested=[...consumeCard.querySelectorAll("button")].find(x=>x.textContent.includes("Ajouter un effet"));
              if(!addNested)throw Error("no nested marker-effect add button");
              addNested.click();
              const extra=[...row.querySelectorAll("[data-marker-consume-result]")].at(-1);
              const nestedKind=extra.querySelector("[data-marker-result-kind]");
              nestedKind.value="cleanse";nestedKind.dispatchEvent(new Event("change",{bubbles:true}));
              const tagPicker=extra.querySelector("[data-marker-result-tag-choice]");
              if(tagPicker?.tagName!=="SELECT" || !values(tagPicker).includes("marker:poison"))
                throw Error("cleanse status-tag filter is still a typed reference");
              tagPicker.value="marker:poison";
              const kindsBeforeSave=[...row.querySelectorAll("[data-marker-consume-result]")].map(e=>
                e.querySelector("[data-marker-result-kind]")?.value);
              if(kindsBeforeSave.join(",")!=="heal,cleanse")
                throw Error("nested editor rows already lost effect before save: "+kindsBeforeSave.join(","));
              get("skill-update").click();
              const status=document.querySelector("[data-skill-library-state]")?.textContent??"";
              if(!status.includes("sauvegardée"))throw Error("native configuredSkills save failed: "+status);
              lib.value="cap_fire_atk_6";lib.dispatchEvent(new Event("change",{bubbles:true}));
              lib.value="lib_aqua_heal";lib.dispatchEvent(new Event("change",{bubbles:true}));
              const rows=[...document.querySelectorAll("[data-skill-effect-row]")];
              const place=rows.find(n=>n.querySelector("[data-skill-effect-kind]")?.value==="apply_marker");
              const spend=rows.find(n=>n.querySelector("[data-skill-effect-kind]")?.value==="consume_marker");
              const permanentPlace=rows.find(n=>n.querySelector("[data-skill-effect-kind]")?.value==="apply_marker" &&
                n.querySelector("[data-skill-marker-pick]")?.value==="eternel");
              if(!place||!spend||!permanentPlace)throw Error("saved marker effects did not round-trip");
              if(!get("marker-permanent") || !get("marker-permanent").matches('input[type="checkbox"]'))
                throw Error("permanent marker author checkbox missing");
              if(!get("skill-marker-cost-enabled").checked||get("skill-marker-cost-id").value!=="poison"||
                 get("skill-marker-cost-source").value!=="target"||get("skill-marker-cost-count").value!=="2")
                throw Error("marker activation cost did not round-trip");
              if(!get("marker-periodic-enabled").checked || get("marker-periodic-seconds").value!=="5")
                throw Error("marker periodic authoring lost its configuration");
              if(place.querySelector("[data-skill-marker-pick]").value!=="poison"||
                 place.querySelector("[data-skill-marker-charges]").value!=="3")throw Error("placement round-trip differs");
              if(spend.querySelector("[data-skill-consume-marker-pick]").value!=="*"||
                 spend.querySelector("[data-marker-result-kind]").value!=="heal")throw Error("consumer round-trip differs");
              if(![...spend.querySelectorAll("[data-marker-consume-result]")].some(e=>
                e.querySelector("[data-marker-result-kind]")?.value==="cleanse" &&
                e.querySelector("[data-marker-result-tag-choice]")?.value==="marker:poison"))
                throw Error("multi-effect marker tag picker did not round-trip");
              get("editor-validate").click();
              if(get("editor-summary").textContent.includes("Corrige"))throw Error("combat exporter rejects new marker skill");
              // Live owner update, not a copied list: creating a new stat with
              // a new damage channel must immediately expand marker selectors.
              // Player never types an ID: the French name generates one.
              fill("stat-custom-label","Venin arcanique");
              get("stat-custom-label").dispatchEvent(new Event("input",{bubbles:true}));
              const generatedId = get("stat-custom-id").value;
              if(generatedId !== "venin-arcanique")
                throw Error("stat stable ID was not generated from the displayed name");
              if(!values(get("stat-custom-damage-channel")).includes(generatedId))
                throw Error("canonical stat builder did not offer its proposed new channel");
              fill("stat-custom-damage-channel",generatedId);
              get("stat-custom-add").click();
              if(!values(get("marker-periodic-channel")).includes(generatedId) ||
                 !values(get("marker-threshold-channel")).includes(generatedId))
                throw Error("marker dropdowns were not refreshed from the new live stat registry");
              document.body.dataset.markerProbe="ok:library:periodic:cost:placement:consume:roundtrip:combat-export:permanent";
            }catch(error){document.body.dataset.markerProbe="fail:"+error.message;}
          },100);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Real editor interaction: choosing FX style must NOT edit a skill until Appliquer.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-fx-quick")) {
      const html=contents.toString("utf8");
      const probe=`<script>
      document.addEventListener("DOMContentLoaded",()=>{
        let attempts=0;
        const timer=setInterval(()=>{
          const library=document.querySelector("[data-skill-library-select]");
          const ready=document.querySelector("[data-creature-library-state]")
            ?.textContent?.includes("3 modèles vitrine chargés");
          if(!ready || !library?.querySelector('option[value="cap_earth_atk_4"]')){
            if(++attempts>70){clearInterval(timer);document.body.dataset.fxQuickProbe="timeout";}
            return;
          }
          clearInterval(timer);
          try{
            library.value="cap_earth_atk_4";
            library.dispatchEvent(new Event("change",{bubbles:true}));
            const read=s=>document.querySelector(s)?.value;
            const style=document.querySelector("[data-skill-fx-quick-profile]");
            const apply=document.querySelector("[data-skill-fx-quick-apply]");
            const preview=document.querySelector("[data-skill-fx-quick-preview]");
            const workflow=document.querySelector("[data-skill-fx-unified-flow]");
            const starter=document.querySelector("[data-skill-fx-starter]");
            const starterSelect=document.querySelector("[data-skill-fx-starter-profile]");
            const starterApply=document.querySelector("[data-skill-fx-starter-apply]");
            const personalize=document.querySelector("[data-skill-fx-personalize]");
            const glowPreset=document.querySelector("[data-skill-fx-glow-preset]");
            const particlePreset=document.querySelector("[data-skill-fx-particle-preset]");
            if(!style||!apply||!preview||!workflow||!starter||!starterSelect||!starterApply||!personalize||!glowPreset||!particlePreset)
              throw Error("unified FX controls absent");
            if(!workflow.contains(starter)||!workflow.contains(style)||!workflow.contains(personalize))
              throw Error("one FX workflow does not own all three steps");
            if(!(starter.compareDocumentPosition(style) & Node.DOCUMENT_POSITION_FOLLOWING) ||
               !(style.compareDocumentPosition(personalize) & Node.DOCUMENT_POSITION_FOLLOWING))
              throw Error("FX steps not ordered style > intensity > personalization");
            if(personalize.open)throw Error("optional customization should be collapsed by default");
            if(document.querySelectorAll("[data-skill-fx-starter-profile], [data-skill-fx-quick-profile]").length!==2)
              throw Error("duplicate simple FX owners");
            if(!starterSelect.disabled && starterSelect.options.length>1){
              starterSelect.value=starterSelect.options[1].value;
              starterSelect.dispatchEvent(new Event("change",{bubbles:true}));
              if(read("[data-skill-projectile-trail-size]")!=="8")
                throw Error("choosing a style silently replaced rock FX");
              starterSelect.value="";
              starterSelect.dispatchEvent(new Event("change",{bubbles:true}));
            }
            if(read("[data-skill-projectile-trail-size]")!=="8"||
               read("[data-skill-impact-shake-amplitude]")!=="5")
              throw Error("authored rock FX changed on initial load");
            if(style.value!=="current")throw Error("saved custom values presented as preset");
            style.value="spectacular";
            style.dispatchEvent(new Event("change",{bubbles:true}));
            if(preview.dataset.level!=="spectacular"||apply.disabled)
              throw Error("indicative preview did not react");
            if(read("[data-skill-projectile-trail-size]")!=="8" ||
               read("[data-skill-impact-shake-amplitude]")!=="5")
              throw Error("preview silently overwrote author settings");
            apply.click();
            if(read("[data-skill-projectile-trail-size]")!=="7" ||
               read("[data-skill-impact-shake-amplitude]")!=="9" ||
               read("[data-skill-aftermath-smoke-size]")!=="36" ||
               read("[data-skill-fx-glow-strength]")!=="0.85")
              throw Error("quick apply did not reuse real V1 presets");
            if(read("[data-skill-travel-fx]")!=="pack:capture:sprite-falling-rock-skyfall-01")
              throw Error("quick preset replaced authored rock sprite");
            if(read("[data-skill-trajectory-mode]")!=="skyfall")
              throw Error("quick preset changed trajectory");
            const trail=document.querySelector("[data-skill-projectile-trail-size]");
            trail.value="8";
            trail.dispatchEvent(new Event("input",{bubbles:true}));
            if(style.value!=="current")throw Error("advanced edit did not restore custom label");
            personalize.open=true;
            glowPreset.value="discreet";
            glowPreset.dispatchEvent(new Event("change",{bubbles:true}));
            if(read("[data-skill-fx-glow-strength]")!=="0.35")
              throw Error("customization did not reuse original glow preset owner");
            if(read("[data-skill-travel-fx]")!=="pack:capture:sprite-falling-rock-skyfall-01")
              throw Error("customization modified authored media");
            document.body.dataset.fxQuickProbe="ok:preview:explicit-apply:presets:skyfall:advanced";
          }catch(e){document.body.dataset.fxQuickProbe="fail:"+e.message;}
        },100);
      });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Browser-only UX probe: real mounted stats, custom rate, removal and live skill draft.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-context-help")) {
      const html = contents.toString("utf8");
      const probe = `<script>
      document.addEventListener("DOMContentLoaded", () => {
        let attempts = 0;
        const timer = setInterval(() => {
          const library=document.querySelector("[data-skill-library-select]");
          const defense=document.querySelector('[data-stat-value="defense"]');
          const showcaseReady = document.querySelector("[data-creature-library-state]")
            ?.textContent?.includes("3 modèles vitrine chargés");
          if (!showcaseReady || !library?.querySelector('option[value="cap_fire_atk_6"]') ||
              !library?.querySelector('option[value="lib_aqua_heal"]') || !defense) {
            if (++attempts > 50) {clearInterval(timer);document.body.dataset.contextHelpProbe="timeout";}
            return;
          }
          clearInterval(timer);
          try {
            const statText=()=>document.querySelector("[data-context-stat-summary]").textContent;
            const skillText=()=>document.querySelector("[data-context-skill-summary]").textContent;
            const set=(el,val)=>{if(!el)throw Error("field missing");el.value=String(val);el.dispatchEvent(new Event("input",{bubbles:true}));};
            document.querySelector('[data-context-help="stats"] summary').click();
            if(!document.querySelector('[data-context-help="stats"]').open)throw Error("info button not opened by tap");
            if(!statText().includes("0,2 %"))throw Error("default defense help: "+statText());
            set(defense,5);
            if(!statText().includes("1 %"))throw Error("five points not one percent: "+statText());
            const coef=[...document.querySelectorAll("[data-stat-definition]")].find(x=>x.dataset.statDefinition==="defense")
              ?.querySelector("[data-stat-definition-damage-reduction-rate]");
            set(coef,0.5);
            if(!statText().includes("0,5 %") || !statText().includes("2,5 %"))
              throw Error("custom coefficient help did not update: "+statText());
            document.querySelector("[data-stat-registry-apply]").click();
            if(!statText().includes("0,5 %"))throw Error("applied rate not reflected");
            const remove=[...document.querySelectorAll("[data-stat-definition-remove]")].find(x=>x.dataset.statDefinitionRemove==="defense");
            if(!remove)throw Error("removal control absent");
            remove.click();
            if(document.querySelector('[data-stat-value="defense"]') ||
              !statText().includes("retirée"))throw Error("defense removal not reflected: "+statText());
            document.querySelector('[data-context-help="skill"] summary').click();
            if(!document.querySelector('[data-context-help="skill"]').open)throw Error("skill info cannot open");
            library.value="cap_fire_atk_6";
            library.dispatchEvent(new Event("change",{bubbles:true}));
            if(!skillText().includes("15 s") || !skillText().includes("10 dégâts") ||
              !skillText().includes("agrandit"))throw Error("authored Firestorm missing: "+skillText());
            set(document.querySelector("[data-skill-zone-duration-seconds]"),13);
            if(!skillText().includes("13 s") || skillText().includes("15 s"))throw Error("skill edit not live: "+skillText());
            library.value="lib_aqua_heal";
            library.dispatchEvent(new Event("change",{bubbles:true}));
            if(!skillText().includes("5 PV") || !skillText().includes("3 PV") ||
              !skillText().includes("20 s"))throw Error("heal switch not live: "+skillText());
            document.body.dataset.contextHelpProbe="ok:default:five:custom:removed:firestorm:live:heal";
          } catch(e) {document.body.dataset.contextHelpProbe="fail:"+e.message;}
        },100);
      });
      </script>`;
      contents = Buffer.from(html.replace("</head>", probe + "</head>"));
    }
    // Author-provided Ultimate must survive real bootstrap and expose native
    // bound-status duration UX while preserving the ten-second authored value.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-water-veil-ultimate")) {
      const html=contents.toString("utf8");
      const probe=`<script>
      document.addEventListener("DOMContentLoaded",()=>{
        let attempts=0;
        const timer=setInterval(()=>{
          const library=document.querySelector("[data-skill-library-select]");
          const option=library?.querySelector('option[value="cap_water_special_2"]');
          const showcaseReady=document.querySelector("[data-creature-library-state]")
            ?.textContent?.includes("3 modèles vitrine chargés");
          if(!showcaseReady || !option){
            if(++attempts>80){clearInterval(timer);document.body.dataset.waterVeilUltimateProbe="timeout";}
            return;
          }
          clearInterval(timer);
          try{
            const slot=document.querySelector('[data-loadout-slot-type="ultimate"]');
            if(!slot?.querySelector('option[value="cap_water_special_2"]'))throw Error("ultimate slot has no authored skill");
            library.value="cap_water_special_2";
            library.dispatchEvent(new Event("change",{bubbles:true}));
            const root=document.querySelector('[data-skill-effects-host]');
            const row=[...root.querySelectorAll("[data-skill-effect-row]")]
              .find(x=>x.querySelector("[data-skill-zone-status-behavior]"));
            if(!row)throw Error("authored zone effect not selected");
            const behavior=row.querySelector("[data-skill-zone-status-behavior]");
            const durationField=row.querySelector("[data-skill-zone-status-duration-field]");
            const durationInput=row.querySelector("[data-skill-zone-status-duration-seconds]");
            const note=row.querySelector("[data-skill-zone-status-duration-note]");
            if(behavior.value!=="while_inside" || !durationField.hidden ||
                !note || note.hidden || Number(durationInput.value)!==10)
              throw Error("while_inside must hide separate duration but preserve 10s");
            behavior.value="on_enter";
            behavior.dispatchEvent(new Event("change",{bubbles:true}));
            if(durationField.hidden || !note.hidden || Number(durationInput.value)!==10)
              throw Error("on_enter must reveal original saved duration");
            behavior.value="while_inside";
            behavior.dispatchEvent(new Event("change",{bubbles:true}));
            const isUltimate=document.querySelector("[data-skill-ultimate]")?.checked;
            if(!isUltimate)throw Error("saved skill lost ultimate flag");
            const attachment=document.querySelector("[data-skill-zone-attachment]");
            if(attachment?.value!=="fixed-source")throw Error("Veil must start anchored to ground");
            if(![...attachment.options].some(option=>option.value==="source"))throw Error("Moving zones mode absent");
            attachment.value="source";
            attachment.dispatchEvent(new Event("change",{bubbles:true}));
            attachment.value="fixed-source";
            attachment.dispatchEvent(new Event("change",{bubbles:true}));
            document.querySelector("[data-skill-update]").click();
            if(document.querySelector("[data-skill-zone-attachment]")?.value!=="fixed-source")
              throw Error("Saved author fixed-source field was dropped");
            const creature=document.querySelector("[data-creature-library-select]");
            creature.value="crea_maraileron";
            creature.dispatchEvent(new Event("change",{bubbles:true}));
            const activeUltimate=document.querySelector('[data-loadout-slot-type="ultimate"]');
            if(activeUltimate?.value!=="cap_water_special_2")
              throw Error("Maraileron lost active Ultimate slot: "+activeUltimate?.value);
            const healingSlot=[...document.querySelectorAll("[data-loadout-slot]")].find(x=>x.dataset.loadoutSlot==="slot-4");
            if(healingSlot && healingSlot.value!=="lib_aqua_heal")
              throw Error("Maraileron lost authored healing loadout");
            document.body.dataset.waterVeilUltimateProbe="ok:20:60:10:100";
          }catch(e){document.body.dataset.waterVeilUltimateProbe="fail:"+e.message;}
        },100);
      });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Probe the actual mounted editor once, with the same inputs and module graph.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-three-phase-rayon")) {
      const html = contents.toString("utf8");
      const probe = '<script>document.addEventListener("DOMContentLoaded",()=>{' +
        'const f=document.querySelector("[data-skill-form]");' +
        'f.value="beam";f.dispatchEvent(new Event("change",{bubbles:true}));' +
        'const h=document.querySelector("[data-skill-beam-stage-editor]");' +
        'const choices=document.querySelector("[data-skill-fx-first-choices]");' +
        'const controls=[...document.querySelectorAll("[data-skill-icon],[data-skill-form],[data-skill-trajectory-mode]")];' +
        'const order=controls.map(x=>x.hasAttribute("data-skill-icon")?"icon":x.hasAttribute("data-skill-form")?"form":"trajectory").join(",");' +
        'h.dataset.fxOrderProbe=order+":"+(choices&&controls.length===3&&controls.every(x=>choices.contains(x))?"visible":"misplaced");' +
        'h.dataset.beamProbe=["start","body","impact"].map(x=>' +
        'document.querySelectorAll("[data-beam-stage-fields="+x+"] label").length).join(",");' +
        '});</script>';
      contents = Buffer.from(html.replace("</head>", probe + "</head>"));
    }
    // Exercise the real add/status/save/export route from the browser UI.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-hot-export")) {
      const html = contents.toString("utf8");
      const probe = `<script>
        document.addEventListener("DOMContentLoaded", () => {
          const native = URL.createObjectURL.bind(URL);
          URL.createObjectURL = (blob) => {
            if (blob.type.includes("json")) {
              blob.text().then(text => {
                try {
                  const draft = JSON.parse(text).draft;
                  const hot = draft.definition.effects.filter(x =>
                    x.kind === "apply_status" &&
                    x.status.kind === "heal_over_time"
                  ).at(-1);
                  const media = draft.presentation?.statusVisuals?.lib_aqua_heal_regeneration?.sprite;
                   document.body.dataset.hotExportMediaProbe = [
                     draft.presentation?.visual?.icon?.assetId, media?.assetId,
                     media?.displayScale, media?.opacity
                   ].join(":");
                   document.body.dataset.hotExportProbe = hot
                    ? ["ok",hot.status.amount,hot.status.tickIntervalMs,hot.status.durationMs,
                       hot.targetScope,draft.definition.category,draft.id].join(":")
                    : "missing:effects=" + JSON.stringify(draft.definition.effects);
                } catch (e) { document.body.dataset.hotExportProbe = "json-error:" + e.message; }
              });
            }
            return native(blob);
          };
          let attempts = 0;
          const timer = setInterval(() => {
            const select = document.querySelector("[data-skill-library-select]");
            if (!select || !select.querySelector('option[value="lib_aqua_heal"]')) {
              if (++attempts > 40) {
                clearInterval(timer);
                document.body.dataset.hotExportProbe = "timeout";
              }
              return;
            }
            clearInterval(timer);
            try {
              const schedule = [...document.querySelectorAll("[data-progression-step]")]
                .map(row => row.querySelector("[data-progression-level]").value +
                  "/" + row.querySelector("[data-progression-slots]").value).join(",");
              document.body.dataset.previewProgressionProbe =
                schedule + ":" + document.querySelector("[data-test-creature-level]").value;
              select.value = "lib_aqua_heal";
              select.dispatchEvent(new Event("change",{bubbles:true}));
              const originalRows = [...document.querySelectorAll("[data-skill-effect-row]")];
              if (originalRows.length !== 2 ||
                  originalRows[0].querySelector("[data-skill-effect-kind]").value !== "heal" ||
                  Number(originalRows[0].querySelector("[data-skill-effect-amount]").value) !== 5 ||
                  originalRows[1].querySelector("[data-skill-status-kind]").value !== "heal_over_time" ||
                  Number(originalRows[1].querySelector("[data-skill-status-hot-amount]").value) !== 3 ||
                  Number(originalRows[1].querySelector("[data-skill-status-hot-tick-seconds]").value) !== 3 ||
                  Number(originalRows[1].querySelector("[data-skill-status-duration-seconds]").value) !== 20) {
                throw new Error("Latest authored +5 immediate / +3 each 3s for 20s not rehydrated in real editor");
              }
              const originalStatus = originalRows[1];
               const originalVisualAsset = originalStatus.querySelector("[data-skill-status-visual-asset]")?.value;
               const originalScale = originalStatus.querySelector("[data-skill-status-visual-scale]")?.value;
               const originalOpacity = originalStatus.querySelector("[data-skill-status-visual-opacity]")?.value;
               const originalMode = originalStatus.querySelector("[data-skill-status-visual-mode]")?.value;
               const icon = document.querySelector("[data-skill-icon]")?.value;
               if (icon !== "core:icon-skill-recall-01" ||
                   originalVisualAsset !== "pack:capture:sprite-water-healing-bubble-01" ||
                   originalMode !== "sprite" ||
                   Number(originalScale) !== 1.7 || Number(originalOpacity) !== 45) {
                 throw new Error("Current authored water-healing bubble missing from editor form: " + [icon,originalVisualAsset,originalMode,originalScale,originalOpacity].join(":"));
               }
               document.body.dataset.aquaHealPresetProbe = "ok:5:3:3:20:icon:aura:1.7:45";
              document.querySelector("[data-skill-effect-add]").click();
              const row = [...document.querySelectorAll("[data-skill-effect-row]")].at(-1);
              const set = (selector,value) => {
                const input=row.querySelector(selector);
                if (!input) throw new Error("Missing " + selector);
                input.value=String(value);
                input.dispatchEvent(new Event("change",{bubbles:true}));
              };
              set("[data-skill-effect-kind]","apply_status");
              set("[data-skill-effect-scope]","self");
              set("[data-skill-status-kind]","heal_over_time");
              set("[data-skill-status-id]","regen-browser-audit");
              set("[data-skill-status-polarity]","beneficial");
              set("[data-skill-status-duration-seconds]",6);
              set("[data-skill-status-hot-amount]",7);
              set("[data-skill-status-hot-tick-seconds]",1.5);
              document.querySelector("[data-skill-update]").click();
              const savedRows=document.querySelectorAll("[data-skill-effect-row]");
              if (savedRows.length !== 3 ||
                  savedRows[2].querySelector("[data-skill-status-kind]").value !== "heal_over_time") {
                throw new Error("HoT row disappeared on update: " + savedRows.length);
              }
              document.querySelector("[data-export-current-skill]").click();
            } catch(e) {document.body.dataset.hotExportProbe = "ui-error:" + e.message; }
          },200);
        });
      </script>`;
      contents = Buffer.from(html.replace("</head>", probe + "</head>"));
    }
    // Browser-authorized input path: choose current skill, change visible percent fields,
    // save via the existing active library, export through the real Blob URL.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-sprite-opacity")) {
      const html = contents.toString("utf8");
      const probe = `<script>
        document.addEventListener("DOMContentLoaded", () => {
          const nativeUrl = URL.createObjectURL.bind(URL);
          URL.createObjectURL = (blob) => {
            if (blob.type.includes("json")) {
              blob.text().then(value => {
                try {
                  const draft = JSON.parse(value).draft;
                  const visual = draft.presentation.visual;
                  const status = draft.presentation.statusVisuals.lib_aqua_heal_regeneration;
                  document.body.dataset.spriteOpacityProbe =
                    [draft.id, visual.cast.opacity, visual.aura.opacity,
                     status.sprite.opacity, status.sprite.assetId ? "sprite" : "missing",
                     draft.definition.effects.length].join(":");
                } catch(error) { document.body.dataset.spriteOpacityProbe = "json-error:" + error.message; }
              });
            }
            return nativeUrl(blob);
          };
          let attempts = 0;
          const timer = setInterval(() => {
            const library = document.querySelector("[data-skill-library-select]");
            const cast = document.querySelector("[data-skill-cast-fx]");
            const aura = document.querySelector("[data-skill-zone-fx]");
            if (!library?.querySelector('option[value="lib_aqua_heal"]') ||
                ![...cast.options].some(option => option.value) ||
                ![...aura.options].some(option => option.value)) {
              if (++attempts > 40) {
                clearInterval(timer);
                document.body.dataset.spriteOpacityProbe = "timeout";
              }
              return;
            }
            clearInterval(timer);
            try {
              library.value = "lib_aqua_heal";
              library.dispatchEvent(new Event("change", {bubbles:true}));
              const set = (selector, value) => {
                const field = document.querySelector(selector);
                if (!field) throw new Error("Missing " + selector);
                field.value = String(value);
                field.dispatchEvent(new Event("change", {bubbles:true}));
              };
              set("[data-skill-cast-fx]", [...cast.options].find(o=>o.value).value);
              set("[data-skill-zone-fx]", [...aura.options].find(o=>o.value).value);
              set("[data-skill-cast-opacity-pct]", 40);
              set("[data-skill-zone-opacity-pct]", 25);
              const row = [...document.querySelectorAll("[data-skill-effect-row]")]
                .find(el => el.querySelector("[data-skill-status-id]")?.value === "lib_aqua_heal_regeneration");
              if (!row) throw new Error("Missing authored regeneration status");
              const mode = row.querySelector("[data-skill-status-visual-mode]");
              mode.value = "sprite";
              mode.dispatchEvent(new Event("change",{bubbles:true}));
              const asset = row.querySelector("[data-skill-status-visual-asset]");
              const first = [...asset.options].find(o=>o.value);
              if (!first) throw new Error("Missing available status sprite asset");
              asset.value = first.value;
              row.querySelector("[data-skill-status-visual-opacity]").value = "35";
              document.querySelector("[data-skill-update]").click();
              document.querySelector("[data-export-current-skill]").click();
            } catch(error) { document.body.dataset.spriteOpacityProbe = "ui-error:" + error.message; }
          }, 200);
        });
      </script>`;
      contents = Buffer.from(html.replace("</head>", probe + "</head>"));
    }
    // Verify the actual active editor identity field and fire zone opacity independently
    // of the synthetic unit data; uses the real mounted selection event path.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-author-defaults")) {
      const html = contents.toString("utf8");
      const probe = `<script>
        document.addEventListener("DOMContentLoaded", () => {
          let attempts=0;
          const timer=setInterval(() => {
            const creature=document.querySelector("[data-creature-library-select]");
            const skill=document.querySelector("[data-skill-library-select]");
            if (!creature?.querySelector('option[value="crea-loup"]') ||
                !skill?.querySelector('option[value="cap_fire_atk_6"]')) {
              if (++attempts>40){clearInterval(timer);document.body.dataset.authorDefaultsProbe="timeout";}
              return;
            }
            clearInterval(timer);
            try {
              for (const id of ["crea_aquafin","crea_maraileron","crea_mossback","crea-loup"]) {
                creature.value=id;
                creature.dispatchEvent(new Event("change",{bubbles:true}));
                const level=document.querySelector("[data-creature-level]").value;
                if (level!=="1") throw new Error("Identity "+id+" level="+level+" expected=1");
              }
              const testLevel=document.querySelector("[data-test-creature-level]").value;
              if(testLevel!=="20")throw new Error("Test level lost its independent value "+testLevel);
              skill.value="cap_fire_atk_6";
              skill.dispatchEvent(new Event("change",{bubbles:true}));
              const zoneOpacity=document.querySelector("[data-skill-zone-opacity-pct]").value;
              const zoneSprite=document.querySelector("[data-skill-zone-fx]").value;
              if (Number(zoneOpacity)!==50 ||
                  zoneSprite!=="pack:capture:sprite-fire-zone-loop-01")
                throw new Error("Fire ultimate zone="+zoneOpacity+":"+zoneSprite);
              document.body.dataset.authorDefaultsProbe="ok:4:1:20:50";
            }catch(error){document.body.dataset.authorDefaultsProbe="ui-error:"+error.message;}
          },200);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Browser-only grouping probe: exercise the actual mounted owners and select DOM.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-element-library")) {
      const html = contents.toString("utf8");
      const probe = `<script>
        document.addEventListener("DOMContentLoaded", () => {
          let attempts=0;
          const timer=setInterval(() => {
            const creature=document.querySelector("[data-creature-library-select]");
            const skill=document.querySelector("[data-skill-library-select]");
            const state=document.querySelector("[data-creature-library-state]");
            if (!state?.textContent?.includes("3 modèles vitrine chargés") ||
                !creature?.querySelector('option[value="crea_aquafin"]') ||
                !skill?.querySelector('option[value="lib_tidal_bite"]')) {
              if (++attempts > 50) {clearInterval(timer);document.body.dataset.elementLibraryProbe="timeout";}
              return;
            }
            clearInterval(timer);
            try {
              const groups=(select)=>[...select.querySelectorAll("optgroup")].map(x=>x.label);
              const creatureGroups=groups(creature);
              const skillGroups=groups(skill);
              if (!["Feu","Eau","Air"].every(x=>creatureGroups.includes(x)))
                throw Error("creature groups: "+creatureGroups.join(","));
              if (!["Feu","Eau"].every(x=>skillGroups.includes(x)))
                throw Error("skill groups: "+skillGroups.join(","));
              const ids=[...creature.options].map(x=>x.value).filter(Boolean);
              if(ids.length!==104 || new Set(ids).size!==104)
                throw Error("creature identity count "+ids.length);
              creature.value="crea_aquafin";
              creature.dispatchEvent(new Event("change",{bubbles:true}));
              if(document.querySelector("[data-creature-id]").value!=="crea_aquafin")
                throw Error("creature selection lost ID");
              creature.value="crea_dracendre";
              creature.dispatchEvent(new Event("change",{bubbles:true}));
              if(![...creature.options].find(x=>x.value==="crea_dracendre")?.textContent?.includes("Feu + Air"))
                throw Error("multi-element label missing");
              if(document.querySelector("[data-creature-id]").value!=="crea_dracendre")
                throw Error("multi-element selected wrong ID");
              const names=[...skill.options].filter(x=>x.value==="lib_tidal_bite" || x.value==="cap_water_atk_2");
              if(names.length!==2 || names.some(x=>!x.textContent.includes(x.value)))
                throw Error("same-name skills not disambiguated");
              const fx=document.querySelector('[data-asset-role="cast"]');
              const assetGroups=fx ? groups(fx) : [];
              if(assetGroups.length && assetGroups.some(x=>!x.includes(" · ")))
                throw Error("asset provenance + element grouping missing: "+assetGroups.join(","));
              document.body.dataset.elementLibraryProbe="ok:104:multi:skill:asset";
            }catch(error){document.body.dataset.elementLibraryProbe="fail:"+error.message;}
          },200);
        });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Actual Human Editor: author a damage-reflection status, save through
    // configuredSkills, and export the canonical SkillDefinition in Chromium.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-damage-reflection")) {
      const html=contents.toString("utf8");
      const probe=`<script>
      document.addEventListener("DOMContentLoaded",()=>{
        const native=URL.createObjectURL.bind(URL);
        URL.createObjectURL=(blob)=>{
          if(blob.type.includes("json"))blob.text().then(value=>{
            try {
              const draft=JSON.parse(value).draft;
              const effect=draft.definition.effects.find(x=>x.kind==="apply_status" &&
                x.status.kind==="damage_reflection" && x.status.id==="browser-mirror");
              document.body.dataset.damageReflectionProbe=effect &&
                effect.status.percent===35 && effect.status.durationMs===12000
                ? "ok:35:12000":"fail:export:"+JSON.stringify(draft.definition.effects);
            }catch(error){document.body.dataset.damageReflectionProbe="fail:json:"+error.message;}
          });
          return native(blob);
        };
        let attempts=0;
        const timer=setInterval(()=>{
          const library=document.querySelector("[data-skill-library-select]");
          const state=document.querySelector("[data-creature-library-state]");
          if(!state?.textContent?.includes("3 modèles vitrine chargés") ||
             !library?.querySelector('option[value="lib_aqua_heal"]')){
            if(++attempts>70){clearInterval(timer);document.body.dataset.damageReflectionProbe="fail:timeout";}
            return;
          }
          clearInterval(timer);
          try {
            library.value="lib_aqua_heal";
            library.dispatchEvent(new Event("change",{bubbles:true}));
            document.querySelector("[data-skill-effect-add]").click();
            const row=[...document.querySelectorAll("[data-skill-effect-row]")].at(-1);
            const set=(selector,value)=>{
              const node=row.querySelector(selector);
              if(!node)throw Error("missing "+selector);
              node.value=String(value);
              node.dispatchEvent(new Event("change",{bubbles:true}));
              return node;
            };
            set("[data-skill-effect-kind]","apply_status");
            set("[data-skill-status-kind]","damage_reflection");
            set("[data-skill-status-id]","browser-mirror");
            set("[data-skill-status-polarity]","beneficial");
            set("[data-skill-status-duration-seconds]",12);
            const pct=set("[data-skill-status-reflection-percent]",35);
            if(pct.value!=="35"||!row.querySelector('[data-skill-status-config-kind="damage_reflection"]'))
              throw Error("reflection field not visible");
            document.querySelector("[data-skill-update]").click();
            document.querySelector("[data-export-current-skill]").click();
          }catch(error){document.body.dataset.damageReflectionProbe="fail:ui:"+error.message;}
        },200);
      });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Native browser route: author a real defensive zone and poison entry.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-zone-status")) {
      const html=contents.toString("utf8");
      const probe=`<script>
      document.addEventListener("DOMContentLoaded",()=>{
        const old=URL.createObjectURL.bind(URL);
        URL.createObjectURL=(blob)=>{
          if(blob.type.includes("json"))blob.text().then(content=>{
            try{
              const draft=JSON.parse(content).draft;
              const zones=draft.definition.effects.filter(e=>e.kind==="persistent_zone" &&
                e.tickEffect.kind==="apply_status");
              const defense=zones.find(e=>e.zoneId==="browser-mist");
              const poison=zones.find(e=>e.zoneId==="browser-poison");
              document.body.dataset.zoneStatusProbe=defense?.statusBehavior==="while_inside" &&
                defense.tickEffect.status.kind==="stat_modifier" &&
                defense.tickEffect.status.deltaPoints===25 &&
                defense.durationMs===12000 &&
                defense.persistAfterRecall===true &&
                poison?.persistAfterRecall===undefined &&
                poison?.statusBehavior==="on_enter" &&
                poison.tickEffect.status.kind==="damage_over_time" &&
                poison.tickEffect.status.amount===4 &&
                poison.tickEffect.status.tickIntervalMs===1000 &&
                draft.definition.effects.some(e=>e.kind==="heal")
                ? "ok:mist:25:poison:4":"fail:export:"+JSON.stringify(zones);
            }catch(e){document.body.dataset.zoneStatusProbe="fail:json:"+e.message;}
          });
          return old(blob);
        };
        let attempts=0;
        const timer=setInterval(()=>{
          const library=document.querySelector("[data-skill-library-select]");
          if(!document.querySelector("[data-creature-library-state]")?.textContent?.includes("3 modèles vitrine chargés") ||
              !library?.querySelector('option[value="lib_aqua_heal"]')){
            if(++attempts>70){clearInterval(timer);document.body.dataset.zoneStatusProbe="fail:timeout";}
            return;
          }
          clearInterval(timer);
          try{
            library.value="lib_aqua_heal";
            library.dispatchEvent(new Event("change",{bubbles:true}));
            const set=(row,selector,value)=>{
              const el=row.querySelector(selector);
              if(!el)throw Error("missing "+selector);
              el.value=String(value);
              el.dispatchEvent(new Event("change",{bubbles:true}));
            };
            const add=(id,behavior,statusKind)=>{
              document.querySelector("[data-skill-effect-add]").click();
              const row=[...document.querySelectorAll("[data-skill-effect-row]")].at(-1);
              set(row,"[data-skill-effect-kind]","persistent_zone");
              set(row,"[data-skill-effect-scope]","self");
              set(row,"[data-skill-zone-id]",id);
              set(row,"[data-skill-zone-duration-seconds]",12);
              const damageControls=row.querySelector('[data-skill-zone-effect-config-kind="damage"]');
              const statusControls=row.querySelector('[data-skill-zone-effect-config-kind="apply_status"]');
              const mode=row.querySelector("[data-skill-zone-status-behavior]");
              if(!damageControls || !statusControls || !mode)
                throw Error("zone UI sub-panels missing");
              if(damageControls.hidden || !statusControls.hidden)
                throw Error("legacy damage zone controls must be visible by default");
              set(row,"[data-skill-zone-effect-kind]","apply_status");
              if(!damageControls.hidden || statusControls.hidden || mode.disabled ||
                  mode.options.length!==2 || !statusControls.contains(mode))
                throw Error("zone status UI is not an enabled, exclusive editable panel");
              set(row,"[data-skill-zone-status-behavior]",behavior);
              if(mode.value!==behavior)throw Error("zone status trigger option not selectable");
              set(row,"[data-skill-zone-status-kind]",statusKind);
              const statField=row.querySelector('[data-skill-zone-status-config-kind="stat_modifier"]');
              const dotField=row.querySelector('[data-skill-zone-status-config-kind="damage_over_time"]');
              if(!statField || !dotField ||
                  statField.hidden!==(statusKind!=="stat_modifier") ||
                  dotField.hidden!==(statusKind!=="damage_over_time"))
                throw Error("zone status-specific fields not synchronized");
              set(row,"[data-skill-zone-status-id]",id+"-status");
              return row;
            };
            const mist=add("browser-mist","while_inside","stat_modifier");
            set(mist,"[data-skill-zone-status-stat-id]","defense");
            set(mist,"[data-skill-zone-status-delta-points]",25);
            const stay=mist.querySelector("[data-skill-zone-persist-after-recall]");
            if(!stay || stay.disabled)throw Error("missing active recall persistence checkbox");
            stay.checked=true;
            stay.dispatchEvent(new Event("change",{bubbles:true}));
            const poison=add("browser-poison","on_enter","damage_over_time");
            set(poison,"[data-skill-zone-status-polarity]","detrimental");
            set(poison,"[data-skill-zone-status-amount]",4);
            set(poison,"[data-skill-zone-status-tick-seconds]",1);
            set(poison,"[data-skill-zone-status-channel]","poison");
            document.querySelector("[data-skill-update]").click();
            document.querySelector("[data-export-current-skill]").click();
          }catch(e){document.body.dataset.zoneStatusProbe="fail:ui:"+e.message;}
        },200);
      });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // Real authoring path: existing shared marker library -> native area ->
    // save, switch skill, reload and export using the actual editor controls.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-zone-marker-entry")) {
      const html=contents.toString("utf8");
      const probe=`<script>
      document.addEventListener("DOMContentLoaded",()=>{
        const old=URL.createObjectURL.bind(URL);
        URL.createObjectURL=blob=>{
          if(blob.type.includes("json"))blob.text().then(content=>{
            try{
              const draft=JSON.parse(content).draft;
              const zone=draft.definition.effects.find(e=>e.kind==="persistent_zone"&&e.zoneId==="browser-marker-zone");
              const ok=zone?.tickEffect?.kind==="apply_marker" &&
                zone.tickEffect.marker.id==="peste" && zone.tickEffect.charges===2 &&
                zone.targetScope==="all_enemies" && zone.durationMs===20000 &&
                zone.radiusGrowthSteps===0 && zone.reactivation==="refresh" &&
                draft.definition.preparationMs===2000 && draft.definition.cooldownMs===45000;
              document.body.dataset.zoneMarkerProbe=ok?"ok:2:peste:20000:2000:45000:fixed":"fail:export:"+JSON.stringify(zone);
            }catch(e){document.body.dataset.zoneMarkerProbe="fail:json:"+e.message;}
          });
          return old(blob);
        };
        let attempts=0;
        const timer=setInterval(()=>{
          const library=document.querySelector("[data-skill-library-select]");
          const status=document.querySelector("[data-creature-library-state]")?.textContent??"";
          if(!status.includes("3 modèles vitrine chargés") ||
              !library?.querySelector('option[value="lib_aqua_heal"]')){
            if(++attempts>85){clearInterval(timer);document.body.dataset.zoneMarkerProbe="fail:timeout";}
            return;
          }
          clearInterval(timer);
          try{
            const set=(host,selector,value)=>{
              const el=host.querySelector(selector);
              if(!el)throw Error("missing "+selector);
              el.value=String(value);
              el.dispatchEvent(new Event("change",{bubbles:true}));
              if(el.value!==String(value))throw Error("option unavailable "+selector+"="+value);
              return el;
            };
            set(document,"[data-skill-library-select]","lib_aqua_heal");
            set(document,"[data-skill-preparation]",2000);
            set(document,"[data-skill-cooldown]",45000);
            document.querySelector("[data-skill-effect-add]").click();
            const row=[...document.querySelectorAll("[data-skill-effect-row]")].at(-1);
            set(row,"[data-skill-effect-kind]","persistent_zone");
            set(row,"[data-skill-effect-scope]","all_enemies");
            set(row,"[data-skill-zone-id]","browser-marker-zone");
            set(row,"[data-skill-zone-duration-seconds]",20);
            set(row,"[data-skill-zone-reactivation]","refresh");
            set(row,"[data-skill-zone-radius-growth-steps]",0);
            set(row,"[data-skill-zone-effect-kind]","apply_marker");
            const panel=row.querySelector('[data-skill-zone-effect-config-kind="apply_marker"]');
            if(!panel || panel.hidden)throw Error("marker panel hidden");
            set(row,"[data-skill-zone-marker-pick]","peste");
            set(row,"[data-skill-zone-marker-charges]",2);
            document.querySelector("[data-skill-update]").click();
            set(document,"[data-skill-library-select]","lib_light_bolt");
            set(document,"[data-skill-library-select]","lib_aqua_heal");
            const restored=[...document.querySelectorAll("[data-skill-effect-row]")]
              .find(x=>x.querySelector("[data-skill-zone-id]")?.value==="browser-marker-zone");
            if(!restored || restored.querySelector("[data-skill-zone-effect-kind]").value!=="apply_marker" ||
               restored.querySelector("[data-skill-zone-marker-pick]").value!=="peste" ||
               Number(restored.querySelector("[data-skill-zone-marker-charges]").value)!==2)
              throw Error("saved shared marker zone did not reload");
            document.querySelector("[data-export-current-skill]").click();
          }catch(e){document.body.dataset.zoneMarkerProbe="fail:ui:"+e.message;}
        },200);
      });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    // A real Chrome probe for the creator's per-creature guard controls.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-creature-reaction")) {
      const html=contents.toString("utf8");
      const probe=`<script>
      document.addEventListener("DOMContentLoaded",()=>{
        let attempts=0;
        const timer=setInterval(()=>{
          const library=document.querySelector("[data-creature-library-select]");
          if(!library?.querySelector('option[value="crea_foudrillon"]') ||
             !library?.querySelector('option[value="crea_mossback"]')){
            if(++attempts>105){clearInterval(timer);document.body.dataset.creatureReactionProbe="timeout";}
            return;
          }
          clearInterval(timer);
          try{
            const q=s=>document.querySelector(s);
            const field=s=>q("[data-creature-reaction-"+s+"]");
            const set=(e,v)=>{if(!e)throw Error("control missing");e.value=String(v);
              e.dispatchEvent(new Event("change",{bubbles:true}));};
            const selectCreature=id=>{set(library,id);};
            selectCreature("crea_foudrillon");
            if(field("type").value!=="legacy")throw Error("old author export must stay legacy");
            if(!q("[data-creature-reaction-defense-field]").hidden)
              throw Error("guard-only field displayed on legacy");
            set(field("type"),"defense");
            if(q("[data-creature-reaction-defense-field]").hidden ||
               field("reduction").disabled)throw Error("defense reduction not editable");
            set(field("charges"),3);
            set(field("recharge"),26);
            set(field("window"),0.55);
            set(field("reduction"),60);
            const iconId="pack:capture:icon-reaction-defense-01";
            const allIcons=[...field("icon").options].map(o=>o.value).filter(Boolean);
            if(allIcons.length<50 || new Set(allIcons).size!==allIcons.length)
              throw Error("reaction chooser does not expose all GenSrpG icon assets");
            if(!allIcons.includes(iconId) || !allIcons.includes("core:icon-skill-fireball-01"))
              throw Error("reaction chooser excludes other library icons");
            if(field("icon").querySelector("optgroup"))
              throw Error("reaction icon list must be flat on mobile");
            if(field("icon").dataset.availableIcons!==String(allIcons.length))
              throw Error("reaction icon count and chooser mismatch");
            set(field("icon"),iconId);
            const preview=q("[data-preview-reaction-icon]");
            if(!preview?.src.includes("icon_reaction_defense_01.webp") || preview.dataset.empty==="true")
              throw Error("reaction icon preview did not resolve from global library");
            q("[data-creature-update]").click();
            if(!q("[data-creature-library-state]").textContent.includes("mise à jour"))
              throw Error("real update refused: "+q("[data-editor-status]")?.textContent?.slice(0,120));
            selectCreature("crea_mossback");
            if(field("type").value!=="legacy" || field("icon").value!=="")
              throw Error("Foudrillon icon/settings leaked to another creature");
            selectCreature("crea_foudrillon");
            if(field("type").value!=="defense" || field("charges").value!=="3" ||
               field("recharge").value!=="26" || field("window").value!=="0.55" ||
               field("reduction").value!=="60" ||
               field("icon").value!=="pack:capture:icon-reaction-defense-01" ||
               !q("[data-preview-reaction-icon]")?.src.includes("icon_reaction_defense_01.webp") ||
               q("[data-creature-reaction-defense-field]").hidden)
              throw Error("saved guard fields not roundtripped in real editor");
            set(field("type"),"dodge");
            if(!q("[data-creature-reaction-defense-field]").hidden)
              throw Error("reduction must be hidden in Dodge");
            document.body.dataset.creatureReactionProbe="ok:legacy:defense:60:three:26000:550:dodge";
          }catch(e){document.body.dataset.creatureReactionProbe="fail:"+e.message;}
        },100);
      });
      </script>`;
      contents=Buffer.from(html.replace("</head>",probe+"</head>"));
    }
    res.writeHead(200, {
      "Content-Type": types[extname(filepath)] ?? "application/octet-stream",
      "Cache-Control": "no-store"
    }).end(contents);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");

function browserBinary() {
  for (const candidate of [
    process.env.CHROME_PATH,
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser"
  ]) {
    if (!candidate) continue;
    if (spawnSync("which", [candidate]).status === 0) return candidate;
  }
  throw new Error("Chrome/Chromium required for real browser regression smoke");
}

async function dumpDom(url, extraArgs = []) {
  const args = [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--disable-background-networking", "--no-first-run", "--no-default-browser-check",
    "--disable-extensions", "--virtual-time-budget=15000",
    "--dump-dom", ...extraArgs, url
  ];
  const child = spawn(browserBinary(), args, { stdio: ["ignore", "pipe", "pipe"] });
  const chunks = [];
  const errors = [];
  child.stdout.on("data", (chunk) => chunks.push(chunk));
  child.stderr.on("data", (chunk) => errors.push(chunk));
  const code = await Promise.race([
    once(child, "close").then(([code]) => code),
    new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Browser startup timed out (50s)"));
      }, 50000);
      timeout.unref();
      child.once("close", () => clearTimeout(timeout));
    })
  ]);
  const dom = Buffer.concat(chunks).toString("utf8");
  if (code !== 0) {
    throw new Error("Chromium exited " + code + ": " + Buffer.concat(errors).toString("utf8").slice(-1500));
  }
  return dom;
}

function assertCreatures(dom, scenario) {
  const select = dom.match(/<select\b[^>]*data-creature-library-select[^>]*>([\s\S]*?)<\/select>/i);
  if (!select) throw new Error(scenario + ": creature library <select> missing");
  const options = [...select[1].matchAll(/<option\b[^>]*value="([^"]+)"/g)]
    .map((match) => match[1]).filter(Boolean);
  const required = ["crea_maraileron", "crea_mossback", "crea-loup", "kitsune_lunaire"];
  for (const id of required) {
    if (!options.includes(id)) {
      const libraryStatus = dom.match(/data-creature-library-state[^>]*>([^<]*)/i)?.[1]?.trim() ?? "not mounted";
      const editorStatus = dom.match(/data-editor-status[^>]*>([^<]*)/i)?.[1]?.trim() ?? "not mounted";
      const error = dom.match(/data-bootstrap-error="([^"]+)"/i)?.[1] ?? "no captured JS error";
      throw new Error(scenario + ": missing real creature " + id + "; loaded=" + options.length +
        "; libraryStatus=" + libraryStatus.slice(0,300) + "; editorStatus=" + editorStatus.slice(0,300) +
        "; jsError=" + error.slice(0,600));
    }
  }
  if (options.length !== 104 || new Set(options).size !== 104) {
    throw new Error(scenario + ": expected 104 unique creature ids; got " + options.length);
  }
  console.log(scenario + ": " + options.length + " active creatures, all required IDs present");
}

function assertAquaHealSkill(dom, scenario) {
  const marker = "data-skill-library-select";
  const at = dom.indexOf(marker);
  if (at < 0 || dom.lastIndexOf("<select", at) < 0) {
    throw new Error(scenario + ": active skill library <select> missing");
  }
  const openEnd = dom.indexOf(">", at);
  const close = dom.indexOf("</select>", openEnd);
  if (openEnd < 0 || close < 0) {
    throw new Error(scenario + ": active skill library </select> missing");
  }
  const ids = [...dom.slice(openEnd + 1, close).matchAll(/value="([^"]+)"/g)]
    .map(match => match[1]).filter(Boolean);
  if (ids.filter(id => id === "lib_aqua_heal").length !== 1) {
    throw new Error(scenario + ": author lib_aqua_heal must appear exactly once in active skill selector");
  }
  if (!ids.includes("cap_water_atk_3")) {
    throw new Error(scenario + ": existing Jet pressurisé disappeared from active skill selector");
  }
  if (ids.filter(id => id === "coupe_feuille").length !== 1) {
    throw new Error(scenario + ": published Coupe feuille v11 must appear exactly once in active skill selector");
  }
  console.log(scenario + ": lib_aqua_heal visible once alongside existing skills (" + ids.length + ")");
}

try {
  const origin = "http://127.0.0.1:" + server.address().port;
  const url = origin + "/examples/dom-demo/capture-editor-v2.html";
  // Validates the complete browser module graph and real Human Editor DOM projection.
  const normalDom = await dumpDom(url);
  assertCreatures(normalDom, "normal browser bootstrap");
  assertAquaHealSkill(normalDom, "normal browser bootstrap");
  const soundtrackDom=await dumpDom(url+"?verify-soundtrack-authoring=1");
  assertCreatures(soundtrackDom,"soundtrack authoring real Chrome");
  const soundtrackProbe=soundtrackDom.match(/data-soundtrack-authoring-probe="([^"]+)"/)?.[1]??"missing";
  if(soundtrackProbe!=="ok:tab:new-project:silent-save")
    throw Error("Real Capture music tab / project config save failed: "+soundtrackProbe);
  const localMusicProbe=soundtrackDom.match(/data-soundtrack-local-probe="([^"]+)"/)?.[1]??"missing";
  if(localMusicProbe!=="ok:six-battle:blob-session")
    throw Error("Real Capture soundtrack local import failed: "+localMusicProbe+
      " author="+soundtrackProbe);
  console.log("Soundtrack authoring Chrome: six Battle loaded locally + new project silent save verified");
  const movementDom=await dumpDom(url+"?verify-movement-face-back=1");
  assertCreatures(movementDom,"Loup movement FACE/DOS authoring real Chrome");
  const movementProbe=movementDom.match(/data-movement-face-back-probe="([^"]+)"/)?.[1]??"missing";
  if(movementProbe!=="ok:two-selects:save:reload:export")
    throw Error("Real creature movement FACE/DOS editor roundtrip failed: "+movementProbe+
      " JS="+(movementDom.match(/data-bootstrap-error="([^"]+)"/)?.[1]??"none"));
  console.log("Loup movement FACE/DOS: native catalog menus, save, reload and author export verified in Chromium");
  const backOnlyDom=await dumpDom(url+"?verify-sprite-mode-back-only=1");
  assertCreatures(backOnlyDom,"Freclairions back-only sprite real Chrome");
  const backOnlyProbe=backOnlyDom.match(/data-creature-sprite-mode-probe="([^"]+)"/)?.[1]??"missing";
  if(backOnlyProbe!=="ok:back-only:sprite:save:reload:export")
    throw Error("Real Freclairions movement/attack sprite mode lost: "+backOnlyProbe+
      " JS="+(backOnlyDom.match(/data-bootstrap-error="([^"]+)"/)?.[1]??"none"));
  console.log("Freclairions DOS-only: sprite settings loaded, switch static -> sprite, saved, reselected and exported without rotation");
  const liveSolarDom=await dumpDom(url+"?verify-solar-live-cast=1", ["--virtual-time-budget=30000"]);
  const liveSolar=liveSolarDom.match(/data-solar-live-cast-probe="([^"]*)"/)?.[1]??"missing";
  if(liveSolar!=="ok:solar:next-skill:unfrozen")
    throw Error("Real Charge solaire runtime/presenter combat freeze: "+liveSolar+
      " JS="+(liveSolarDom.match(/data-bootstrap-error="([^"]*)"/)?.[1]??"none"));
  console.log("Charge solaire: actual skill button remains responsive; next skill usable after status applied");

  for (const marker of [
    "data-skill-effect-ignore-resistance-pct",
    "data-skill-effect-ignore-damage-reduction-pct",
    "data-skill-beam-pack-apply",
    "data-skill-beam-start-fx"
  ]) {
    if (!normalDom.includes(marker)) {
      throw new Error("Human Editor browser missing damage penetration control: " + marker);
    }
  }
  const energyDom=await dumpDom(url+"?verify-energy-orbs=1");
  const energyProbe=energyDom.match(/data-energy-orbs-probe="([^"]+)"/)?.[1] ?? "missing";
  if(energyProbe!=="ok:12:5:50%")
    throw Error("Real Chrome energy orbs regression: "+energyProbe);
  console.log("Capture HUD energy orbs: real Chrome 12 circles, partial fill, 180px wrap, capacity 24 and accessible count");
  const editorHeadingDom=await dumpDom(url+"?verify-editor-preview-heading=1");
  const editorHeadingProbe=editorHeadingDom.match(/data-editor-preview-heading-probe="([^"]+)"/)?.[1]??"missing";
  if(editorHeadingProbe!=="ok:editor:opponent:heading:0")
    throw Error("REAL editor preview opponent Graine sansue lost native heading: "+editorHeadingProbe+
      " JS="+(editorHeadingDom.match(/data-bootstrap-error="([^"]+)"/)?.[1]??"none"));
  console.log("REAL editor -> active asset resolver -> Graine sansue opponent FX heading 0: preserved");
  const sleepUiDom=await dumpDom(url+"?verify-sleep-author-ui=1");
  const sleepUiProbe=sleepUiDom.match(/data-sleep-ui-probe="([^"]+)"/)?.[1]??"missing";
  if(sleepUiProbe!=="ok:editor:sleep:markers:conditions")
    throw Error("REAL editor Sommeil / conditional author controls: "+sleepUiProbe+
      " JS="+(sleepUiDom.match(/data-bootstrap-error="([^"]+)"/)?.[1]??"none"));
  console.log("Sommeil browser: real editor adds a status, toggles stun-until-damage, and offers canonical marker/status conditions");
  const incomingDom=await dumpDom(url+"?verify-projectile-inbound-facing=1");
  const incomingProbe=incomingDom.match(/data-inbound-projectile-probe="([^"]+)"/)?.[1]??"missing";
  if(incomingProbe!=="ok:outbound:opponent:mirror:fireball:beam")
    throw Error("Actual Chromium projectile facing / mirror return regression: "+incomingProbe+
      " JS="+(incomingDom.match(/data-bootstrap-error="([^"]+)"/)?.[1]??"none"));
  console.log("Projectile orientation Chrome: outward, incoming and mirror return share native facing + contact point");
  const veilDom=await dumpDom(url+"?verify-water-veil-ultimate=1");
  assertCreatures(veilDom,"Voile aqueux ultimate browser bootstrap");
  const veilProbe=veilDom.match(/data-water-veil-ultimate-probe="([^"]+)"/)?.[1] ?? "missing";
  if(veilProbe!=="ok:20:60:10:100")
    throw Error("Real editor Voile aqueux Ultimate slot/duration regression: "+veilProbe);
  console.log("Voile aqueux browser: Ultime registered; 60s zone +100 DEF, 10s fallback hidden only while inside");
  const hotDom = await dumpDom(url + "?verify-hot-export=1");
  assertCreatures(hotDom, "HoT authoring browser bootstrap");
  const hotMatch = hotDom.match(/data-hot-export-probe="([^"]+)"/);
  if (!hotMatch || hotMatch[1] !== "ok:7:1500:6000:self:heal:lib_aqua_heal") {
    throw new Error("Live HoT save/export lost values: " + (hotMatch?.[1] ?? "probe did not run"));
  }
  if (!/data-aqua-heal-preset-probe="ok:5:3:3:20:icon:aura:1.7:45"/.test(hotDom)) {
    throw new Error("Active author preset not loaded with exact authored healing and media");
  }
  if (!/data-preview-progression-probe="1\/1,5\/2,10\/3,15\/4,20\/5:20"/.test(hotDom)) {
    throw new Error("Real editor lost five-tier progression or default preview level 20");
  }
  console.log("Progression browser: five unlock tiers and isolated test level 20 visible");
  if (!/data-hot-export-media-probe="core:icon-skill-recall-01:pack:capture:sprite-water-healing-bubble-01:1.7:0.45"/.test(hotDom)) {
    throw new Error("Real skill export lost the exact authored icon, aura, scale or opacity");
  }
  console.log("HoT browser save/export: +5 instant / +3 per 3s during 20s, authored icon and water healing bubble scale 1.7 opacity 45%, and added effect preserved");
  const opacityDom = await dumpDom(url + "?verify-sprite-opacity=1");
  assertCreatures(opacityDom, "sprite opacity real editor bootstrap");
  const opacityMatch = opacityDom.match(/data-sprite-opacity-probe="([^"]+)"/);
  if (!opacityMatch || opacityMatch[1].split(":").slice(0,4).join(":") !==
      "lib_aqua_heal:0.4:0.25:0.35" ||
      !opacityMatch[1].includes(":sprite:2")) {
    throw new Error("Actual editor save/export lost cast/aura/status opacity: " +
      (opacityMatch?.[1] ?? "browser opacity probe missing"));
  }
  console.log("Opacity real editor save/export: cast 40%, zone 25%, status 35% and existing HoT preserved");
  const authorDefaultsDom = await dumpDom(url + "?verify-author-defaults=1");
  assertCreatures(authorDefaultsDom, "author defaults identity browser bootstrap");
  if (!/data-author-defaults-probe="ok:4:1:20:50"/.test(authorDefaultsDom)) {
    const failure = authorDefaultsDom.match(/data-author-defaults-probe="([^"]+)"/)?.[1] ?? "no probe";
    throw new Error("Actual editor identity level 1 or fire zone 50% missing: " + failure);
  }
  console.log("Authored creature identity browser: four canonical/showcase identities at 1, preview at 20, ultimate zone at 50%");
  const quickDom=await dumpDom(url+"?verify-fx-quick=1");
  assertCreatures(quickDom,"FX beginner mode actual editor startup");
  const quick=quickDom.match(/data-fx-quick-probe="([^"]+)"/)?.[1] ?? "missing";
  if(quick!=="ok:preview:explicit-apply:presets:skyfall:advanced")
    throw Error("Real FX beginner mode did not preserve author values and explicit application: "+quick);
  console.log("Capture FX quick mode: indicative preview, explicit preset apply, skyfall preserved, advanced edit restores custom label");
  const helpDom=await dumpDom(url+"?verify-context-help=1");
  assertCreatures(helpDom,"context help actual browser bootstrap");
  const help=helpDom.match(/data-context-help-probe="([^"]+)"/)?.[1] ?? "missing";
  if(help!=="ok:default:five:custom:removed:firestorm:live:heal")
    throw Error("Actual editor help is not interactive or not value-derived: "+help);
  console.log("Context help real editor: touch opens, 0.2% defense, 5pt=1%, custom rate, deletion, Firestorm live edit, heal switch");
  const elementDom=await dumpDom(url+"?verify-element-library=1");
  assertCreatures(elementDom,"element groups actual browser bootstrap");
  const elementProbe=elementDom.match(/data-element-library-probe="([^"]+)"/)?.[1] ?? "missing";
  if(elementProbe!=="ok:104:multi:skill:asset")
    throw Error("Real editor element grouping / identity regression: "+elementProbe);
  console.log("Element library UI: 104 unique creatures, fire/water/air groups, multi-element and same-name IDs retained, asset groups");
  const markerDom=await dumpDom(url+"?verify-markers=1");
  assertCreatures(markerDom,"marker library and active skill editor real browser bootstrap");
  const markerProbe=markerDom.match(/data-marker-probe="([^"]+)"/)?.[1] ?? "missing";
  if(markerProbe!=="ok:library:periodic:cost:placement:consume:roundtrip:combat-export:permanent")
    throw Error("Native marker authoring / skill roundtrip regression: "+markerProbe);
  console.log("Shared marker library and skill UI: real Chrome authoring, 104 creatures, placement/consume and combat export");
  const guardDom=await dumpDom(url+"?verify-creature-reaction=1");
  assertCreatures(guardDom,"per-creature reaction real browser bootstrap");
  const guardProbe=guardDom.match(/data-creature-reaction-probe="([^"]+)"/)?.[1] ?? "missing";
  if(guardProbe!=="ok:legacy:defense:60:three:26000:550:dodge")
    throw Error("Real creature reaction settings did not persist: "+guardProbe);
  console.log("Creature reaction editor: Chrome verified legacy -> Defense 60%, 3 charges, 26s recharge, 0.55s window, save/reselect and Dodge visibility");
  const healEvolutionDom=await dumpDom(url+"?verify-heal-evolution-isolation=1");
  assertCreatures(healEvolutionDom, "healing skill evolution validation browser bootstrap");
  const healEvolutionProbe=healEvolutionDom.match(/data-heal-evolution-probe="([^"]+)"/)?.[1] ?? "missing";
  if(healEvolutionProbe!=="ok:heal:preserve:creature")
    throw Error("Actual Soin lumineux combat test blocked or creature saved draft mutated: "+healEvolutionProbe);
  console.log("Heal browser: real Soin lumineux testing bypasses only the incomplete unsaved evolution, preserving the saved creature");
  const rosterDom=await dumpDom(url+"?verify-roster-menu-teams=1");
  assertCreatures(rosterDom,"allied Recall and hostile separate reserve panel");
  const rosterProbe=rosterDom.match(/data-roster-visibility-probe="([^"]+)"/)?.[1]??"missing";
  if(rosterProbe!=="ok:allied:enemy-separated:skill")
    throw Error("Real roster menu contamination: "+rosterProbe);
  console.log("Recall menu real Chrome: allied-only, hostile bench separate, allied reserve skill preserved");
  const solarDom=await dumpDom(url+"?verify-solar-reserve-status=1");
  assertCreatures(solarDom,"Charge solaire reserve status validation browser bootstrap");
  const solarProbe=solarDom.match(/data-solar-reserve-probe="([^"]+)"/)?.[1] ?? "missing";
  if(solarProbe!=="ok:solar:status:reserve:valid")
    throw Error("Actual Charge solaire editor validation still rejects reserve status: "+solarProbe);
  console.log("Charge solaire reserve status: real Chrome editor accepts new author skill and reserve buff");

  const reflectionDom=await dumpDom(url+"?verify-damage-reflection=1");
  assertCreatures(reflectionDom,"damage reflection real editor bootstrap");
  const reflectionProbe=reflectionDom.match(/data-damage-reflection-probe="([^"]+)"/)?.[1] ?? "missing";
  if(reflectionProbe!=="ok:35:12000")
    throw Error("Human Editor saved reflection status is missing from real export: "+reflectionProbe);
  console.log("Damage reflection real editor: 35% during 12s saved and exported, 104 creatures retained");
  const zoneStatusDom=await dumpDom(url+"?verify-zone-status=1");
  assertCreatures(zoneStatusDom,"zone status actual editor bootstrap");
  const zoneStatusProbe=zoneStatusDom.match(/data-zone-status-probe="([^"]+)"/)?.[1] ?? "missing";
  if(zoneStatusProbe!=="ok:mist:25:poison:4")
    throw Error("Real UI zone buff/poison save/export failed: "+zoneStatusProbe);
  console.log("Native area status authoring: defense while inside, poison on entry, original skill preserved");
  const zoneMarkerDom=await dumpDom(url+"?verify-zone-marker-entry=1");
  assertCreatures(zoneMarkerDom,"Zone marker native authoring real browser");
  const zoneMarkerProbe=zoneMarkerDom.match(/data-zone-marker-probe="([^"]+)"/)?.[1]??"missing";
  if(zoneMarkerProbe!=="ok:2:peste:20000:2000:45000:fixed")
    throw Error("Zone marker author save/reload/export failed: "+zoneMarkerProbe);
  console.log("Zone marker browser: real Peste marker, two stacks on entry, 20s, 2s cast, 45s cooldown, fixed radius");
  const rayonDom = await dumpDom(url + "?verify-three-phase-rayon=1");
  assertCreatures(rayonDom, "rayon three-phase browser bootstrap");
  if (!/data-fx-order-probe="icon,form,trajectory:visible"/.test(rayonDom)) {
    throw new Error("FX browser UI did not show icon, form and trajectory first as canonical controls");
  }
  if (!/data-beam-probe="7,4,4"/.test(rayonDom) ||
      !/data-beam-active="true"/.test(rayonDom)) {
    throw new Error("Rayon browser UI did not move the original 15 controls (including skill sounds) into 3 phases");
  }
  console.log("Rayon browser UI: 7 + 4 + 4 canonical labels grouped successfully");
  // Optional global presentation host unavailable: creatures must still load.
  assertCreatures(await dumpDom(url, [
    "--host-resolver-rules=MAP raw.githubusercontent.com 127.0.0.1,EXCLUDE localhost"
  ]), "presentation host blocked");
  assertCreatures(await dumpDom(url + "?stall-presentation=1"),
    "presentation requests never complete");
} finally {
  server.close();
}
