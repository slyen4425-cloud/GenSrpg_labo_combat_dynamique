// Real Chromium regression of the actual mounted 2.5D arena shadow painter.
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { once } from "node:events";

const root = process.cwd();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp"
};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const filename = resolve(root, "." + pathname);
    if (!filename.startsWith(root + sep)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    const contents = await readFile(filename);
    response.writeHead(200, {
      "Content-Type": mime[extname(filename)] ?? "application/octet-stream",
      "Cache-Control": "no-store"
    }).end(contents);
  } catch {
    response.writeHead(404).end("Not found");
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");

function browserBinary() {
  for (const candidate of [
    process.env.CHROME_PATH, "google-chrome", "google-chrome-stable", "chromium", "chromium-browser"
  ]) {
    if (candidate && spawnSync("which", [candidate]).status === 0) return candidate;
  }
  throw new Error("Chrome/Chromium required for real shadow-light smoke");
}

try {
  const url = "http://127.0.0.1:" + server.address().port +
    "/tests/browser/shadow-light-fixture.html";
  const browser = spawn(browserBinary(), [
    "--headless=new", "--no-sandbox", "--disable-gpu",
    "--disable-dev-shm-usage", "--disable-background-networking",
    "--no-first-run", "--disable-extensions", "--virtual-time-budget=12000",
    "--dump-dom", url
  ], { stdio: ["ignore", "pipe", "pipe"] });
  const chunks = [], errors = [];
  browser.stdout.on("data", buffer => chunks.push(buffer));
  browser.stderr.on("data", buffer => errors.push(buffer));
  const exitCode = await Promise.race([
    once(browser, "close").then(([code]) => code),
    new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        browser.kill("SIGKILL");
        reject(new Error("Chromium smoke timed out after 50 seconds"));
      }, 50000);
      timeout.unref();
      browser.once("close", () => clearTimeout(timeout));
    })
  ]);
  if (exitCode !== 0) {
    throw new Error("Chromium exited " + exitCode + ": " +
      Buffer.concat(errors).toString("utf8").slice(-1400));
  }
  const dom = Buffer.concat(chunks).toString("utf8");
  const probe = dom.match(/data-shadow-probe="([^"]+)"/)?.[1] ?? "missing";
  if (probe !== "ok:silhouette:flight:direction:contact:restore") {
    throw new Error("Real DOM mask/light/flying controls failed: " + probe +
      "; html tail=" + dom.slice(-1600));
  }
  console.log("Real Chrome light projection: alpha silhouette painted, airborne cast, reversible direction, old contact/restore.");
} finally {
  server.close();
}
