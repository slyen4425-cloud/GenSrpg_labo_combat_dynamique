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
              // The three new author sheets must be read back from their
              // active owner after startup, never a native/legacy fallback.
              const lumiloSelect=get("creature-library-select");
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
                throw Error("Nid de frelon active & reserve 5-charge marker scopes not rendered");
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
              fill("marker-name","Poïson");
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
              if(get("marker-id").value!=="poison"||!get("marker-id").readOnly)
                throw Error("name-only author save failed to create and lock canonical poison ID");
              if(get("marker-periodic-channel").value!=="poison"||
                 get("marker-threshold-channel").value!=="fire"||
                 get("marker-icon").value!==iconId)
                throw Error("marker dropdown selections lost on save");
              if(!prePicker.querySelector('option[value="poison"]')||prePicker.value!=="venin-static")
                throw Error("new marker was not offered, or existing Venin choice was silently overwritten");
              get("marker-new").click();
              fill("marker-name","Poïson");
              get("marker-save").click();
              if(!get("marker-library-state").textContent.includes("déjà enregistré"))
                throw Error("new marker with existing ID silently overwrites prior author definition");
              fill("marker-library-select","poison");
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
              fill("marker-library-select","poison");
              if(get("marker-permanent").checked || get("marker-duration").disabled)
                throw Error("loading timed marker must restore ordinary duration field");
              if(get("marker-periodic-channel").value!=="poison" ||
                 get("marker-threshold-channel").value!=="fire" ||
                 get("marker-icon").value!==iconId)
                throw Error("marker reference dropdowns did not roundtrip");
              fill("marker-library-select","eternel");
              if(!get("marker-permanent").checked || !get("marker-duration").disabled)
                throw Error("loading permanent marker lost unchecked duration model");
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
              fill("stat-custom-id","arcane_venin");
              fill("stat-custom-label","Venin arcanique");
              get("stat-custom-id").dispatchEvent(new Event("input",{bubbles:true}));
              get("stat-custom-label").dispatchEvent(new Event("input",{bubbles:true}));
              if(!values(get("stat-custom-damage-channel")).includes("arcane_venin"))
                throw Error("canonical stat builder did not offer its proposed new channel");
              fill("stat-custom-damage-channel","arcane_venin");
              get("stat-custom-add").click();
              if(!values(get("marker-periodic-channel")).includes("arcane_venin") ||
                 !values(get("marker-threshold-channel")).includes("arcane_venin"))
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
            if(!skillText().includes("15 s") || !skillText().includes("5 dégâts") ||
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
              if(ids.length!==103 || new Set(ids).size!==103)
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
              document.body.dataset.elementLibraryProbe="ok:103:multi:skill:asset";
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
  const required = ["crea_maraileron", "crea_mossback", "crea-loup"];
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
  if (options.length !== 103 || new Set(options).size !== 103) {
    throw new Error(scenario + ": expected 103 unique creature ids; got " + options.length);
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
  console.log(scenario + ": lib_aqua_heal visible once alongside existing skills (" + ids.length + ")");
}

try {
  const origin = "http://127.0.0.1:" + server.address().port;
  const url = origin + "/examples/dom-demo/capture-editor-v2.html";
  // Validates the complete browser module graph and real Human Editor DOM projection.
  const normalDom = await dumpDom(url);
  assertCreatures(normalDom, "normal browser bootstrap");
  assertAquaHealSkill(normalDom, "normal browser bootstrap");
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
  if(elementProbe!=="ok:103:multi:skill:asset")
    throw Error("Real editor element grouping / identity regression: "+elementProbe);
  console.log("Element library UI: 103 unique creatures, fire/water/air groups, multi-element and same-name IDs retained, asset groups");
  const markerDom=await dumpDom(url+"?verify-markers=1");
  assertCreatures(markerDom,"marker library and active skill editor real browser bootstrap");
  const markerProbe=markerDom.match(/data-marker-probe="([^"]+)"/)?.[1] ?? "missing";
  if(markerProbe!=="ok:library:periodic:cost:placement:consume:roundtrip:combat-export:permanent")
    throw Error("Native marker authoring / skill roundtrip regression: "+markerProbe);
  console.log("Shared marker library and skill UI: real Chrome authoring, 103 creatures, placement/consume and combat export");
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
  console.log("Damage reflection real editor: 35% during 12s saved and exported, 103 creatures retained");
  const zoneStatusDom=await dumpDom(url+"?verify-zone-status=1");
  assertCreatures(zoneStatusDom,"zone status actual editor bootstrap");
  const zoneStatusProbe=zoneStatusDom.match(/data-zone-status-probe="([^"]+)"/)?.[1] ?? "missing";
  if(zoneStatusProbe!=="ok:mist:25:poison:4")
    throw Error("Real UI zone buff/poison save/export failed: "+zoneStatusProbe);
  console.log("Native area status authoring: defense while inside, poison on entry, original skill preserved");
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
