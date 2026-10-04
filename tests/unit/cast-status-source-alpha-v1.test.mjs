import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";
const root = new URL("../../", import.meta.url);
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
function rgbaPng(bytes) {
  assert.equal(bytes.subarray(0,8).toString("hex"), "89504e470d0a1a0a");
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert.equal(bytes[24],8); assert.equal(bytes[25],6, "real RGBA alpha required");
  assert.equal(bytes[28],0, "non-interlaced PNG required");
  const chunks=[];
  for(let p=8;p<bytes.length;) {
    const size=bytes.readUInt32BE(p), type=bytes.toString("ascii",p+4,p+8);
    if(type==="IDAT") chunks.push(bytes.subarray(p+8,p+8+size));
    p+=size+12;
  }
  const raw=inflateSync(Buffer.concat(chunks)), stride=width*4;
  assert.equal(raw.length,(stride+1)*height);
  const pixels=Buffer.alloc(stride*height);
  const paeth=(a,b,c)=>{const p=a+b-c, pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++) {
    const filter=raw[y*(stride+1)]; assert.ok(filter<=4);
    for(let x=0;x<stride;x++) {
      const a=x>=4?pixels[y*stride+x-4]:0;
      const b=y?pixels[(y-1)*stride+x]:0;
      const c=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
      const predictor=[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter];
      pixels[y*stride+x]=(raw[y*(stride+1)+x+1]+predictor)&255;
    }
  }
  return {width,height,pixels};
}

const sheets = [
  { name: "cast_charge", sourceSha: "aac01479c103250ff2fd7cb459f7131364c089d6586d64d813b4da7c59706b69",
    ids: ["blade", "physical", "electric", "water", "nature"].map(n => "pack:capture:sprite-cast-" + n + "-01"),
    category: "release", frameMs: 60 },
  { name: "status_aura", sourceSha: "bcc082152b0b5c83b34b51c890dc43bc48267751120740ad478801fcb8f19904",
    ids: ["healing-aura", "energy-shield", "stone-shell", "poison", "regeneration", "purification", "curse"].map(n => "pack:capture:sprite-status-" + n + "-01"),
    category: "skill", frameMs: 90 }
];
for (const sheet of sheets) {
  test(sheet.name + ": native IDs consume distinct illustrated RGBA phases copied from the archived transparent sheet", () => {
    const m = JSON.parse(readFileSync(new URL("assets/library/capture/sprites/source/" + sheet.name + "_extraction_v1.json", root), "utf8"));
    const original = readFileSync(new URL(m.original.file, root));
    assert.equal(sha(original), sheet.sourceSha);
    assert.equal(m.original.sha256, sheet.sourceSha);
    assert.equal(original.subarray(0, 3).toString("hex"), "ffd8ff");
    assert.equal(m.original.format, "JPEG");
    const matteBytes = readFileSync(new URL(m.transparent.file, root));
    assert.equal(sha(matteBytes), m.transparent.sha256);
    const matte = rgbaPng(matteBytes);
    assert.deepEqual([matte.width, matte.height], [1536, 1024]);
    assert.equal(m.backgroundExtraction.tool, "imagegen");
    assert.equal(m.families.length, sheet.ids.length);
    const catalog = JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json", root), "utf8"));
    for (const [familyIndex, family] of m.families.entries()) {
      const id = sheet.ids[familyIndex], definitions = catalog.assets.filter(a => a.id === id);
      assert.equal(family.assetId, id);
      assert.equal(definitions.length, 1);
      assert.equal(definitions[0].category, sheet.category);
      assert.equal(definitions[0].resource.format, "sprite-strip");
      assert.equal("assets/library/" + definitions[0].resource.file, family.atlas);
      assert.equal(definitions[0].resource.frameCount, 8);
      assert.equal(definitions[0].resource.frameMs, sheet.frameMs);
      assert.equal(family.frames.length, 8);
      const hashes = new Set();
      for (const frame of family.frames) {
        const bytes = readFileSync(new URL(frame.file, root));
        assert.equal(sha(bytes), frame.sha256); hashes.add(sha(bytes));
        const image = rgbaPng(bytes), [w, h] = m.frameSize;
        assert.deepEqual([image.width, image.height], [256, 256]);
        let visible = 0, semi = 0, dark = 0; const colors = new Set();
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const p = (y * w + x) * 4, alpha = image.pixels[p + 3];
          if (x < 8 || x >= w - 8 || y < 8 || y >= h - 8) assert.equal(alpha, 0);
          if (alpha >= 32) { visible++; colors.add(image.pixels.subarray(p, p + 3).toString("hex")); }
          if (alpha > 0 && alpha < 255) semi++;
          if (alpha >= 128 && Math.max(...image.pixels.subarray(p, p + 3)) < 40) dark++;
        }
        assert.ok(visible > 24 && semi > 24 && colors.size > 20, "real textured art and partial alpha required");
        if (family.name === "curse" && family.frames.indexOf(frame) >= 1 && family.frames.indexOf(frame) <= 5)
          assert.ok(dark > 10, "black curse details must survive extraction");
        const [left, top, right, bottom] = frame.sourceRect, [dx, dy] = frame.offset;
        for (let y = top; y < bottom; y++) {
          const expected = matte.pixels.subarray((y * matte.width + left) * 4, (y * matte.width + right) * 4);
          const begin = ((y - top + dy) * w + dx) * 4;
          assert.ok(image.pixels.subarray(begin, begin + expected.length).equals(expected), "exact RGBA copy required");
        }
      }
      assert.equal(hashes.size, 8);
      const atlas = readFileSync(new URL(family.atlas, root));
      assert.equal(sha(atlas), family.atlasSha256);
      assert.equal(atlas.toString("ascii", 0, 4), "RIFF");
      assert.equal(atlas.toString("ascii", 8, 12), "WEBP");
      assert.equal(atlas.toString("ascii", 12, 16), "VP8L");
      const bits = atlas.readUInt32LE(21);
      assert.deepEqual([(bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1], [2048, 256]);
      const sequence = JSON.parse(readFileSync(new URL(family.sequence, root), "utf8"));
      assert.equal(sequence.frame_ms, sheet.frameMs);
      assert.ok(sequence.frames.every(f => f.endsWith(".png")));
    }
  });
}
test("the global catalogue retains one definition per ID and counts the seven new status assets", () => {
  const c = JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json", root), "utf8"));
  assert.equal(c.assets.length, 95);
  assert.equal(new Set(c.assets.map(a => a.id)).size, 95);
  assert.equal(c.counts.assets, 95);
  assert.equal(c.counts.sprites, c.assets.filter(a => a.assetType === "sprite").length);
  assert.equal(c.storage.branch, "global-assets");
});
