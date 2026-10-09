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
    // Probe the actual mounted editor once, with the same inputs and module graph.
    if (pathname.endsWith("/capture-editor-v2.html") &&
        new URL(req.url, "http://localhost").searchParams.has("verify-three-phase-rayon")) {
      const html = contents.toString("utf8");
      const probe = '<script>document.addEventListener("DOMContentLoaded",()=>{' +
        'const f=document.querySelector("[data-skill-form]");' +
        'f.value="beam";f.dispatchEvent(new Event("change",{bubbles:true}));' +
        'const h=document.querySelector("[data-skill-beam-stage-editor]");' +
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
      throw new Error(scenario + ": missing real creature " + id + "; loaded=" + options.length);
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
  const rayonDom = await dumpDom(url + "?verify-three-phase-rayon=1");
  assertCreatures(rayonDom, "rayon three-phase browser bootstrap");
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
