import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const root = new URL("../../", import.meta.url);
const base = "assets/library/capture/sprites/skills/fireball_2/frames/";

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function readRgbaPng(path) {
  const bytes = readFileSync(new URL(path, root));
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idats = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idats.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  assert.equal(bitDepth, 8, "8-bit PNG required");
  assert.equal(colorType, 6, "RGBA PNG required");

  const bpp = 4;
  const rowBytes = width * bpp;
  const raw = inflateSync(Buffer.concat(idats));
  const pixels = Buffer.alloc(width * height * bpp);
  let src = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[src++];
    const rowStart = y * rowBytes;
    for (let x = 0; x < rowBytes; x += 1) {
      const value = raw[src++];
      const left = x >= bpp ? pixels[rowStart + x - bpp] : 0;
      const up = y > 0 ? pixels[rowStart - rowBytes + x] : 0;
      const upLeft = y > 0 && x >= bpp
        ? pixels[rowStart - rowBytes + x - bpp]
        : 0;

      let decoded = value;
      if (filter === 1) decoded = (value + left) & 255;
      else if (filter === 2) decoded = (value + up) & 255;
      else if (filter === 3) decoded = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) decoded = (value + paeth(left, up, upLeft)) & 255;
      else assert.equal(filter, 0, "unsupported PNG filter");

      pixels[rowStart + x] = decoded;
    }
  }

  return { width, height, pixels };
}

test("Fireball 2 projectile does not contain a broad translucent underlayer", () => {
  for (let i = 1; i <= 12; i += 1) {
    const suffix = String(i).padStart(2, "0");
    const { width, height, pixels } = readRgbaPng(
      base + "sprite_skill_fireball_2_projectile_" + suffix + ".png"
    );

    assert.deepEqual([width, height], [512, 512]);

    let visible = 0;
    let weakAlpha = 0;
    for (let p = 3; p < pixels.length; p += 4) {
      const alpha = pixels[p];
      if (alpha > 0) {
        visible += 1;
        if (alpha < 32) weakAlpha += 1;
      }
    }

    const coverage = visible / (width * height);
    const weakRatio = weakAlpha / Math.max(visible, 1);

    assert.ok(
      coverage < 0.15,
      "projectile frame " + suffix + " alpha coverage too broad: " + coverage.toFixed(3)
    );
    assert.ok(
      weakRatio < 0.35,
      "projectile frame " + suffix + " contains too much weak-alpha veil: " + weakRatio.toFixed(3)
    );
  }
});
