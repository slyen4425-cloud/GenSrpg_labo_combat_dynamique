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

try {
  const origin = "http://127.0.0.1:" + server.address().port;
  const url = origin + "/examples/dom-demo/capture-editor-v2.html";
  // Validates the complete browser module graph and real Human Editor DOM projection.
  const normalDom = await dumpDom(url);
  assertCreatures(normalDom, "normal browser bootstrap");
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
