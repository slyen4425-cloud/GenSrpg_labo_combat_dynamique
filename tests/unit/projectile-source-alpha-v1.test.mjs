import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";

const root = new URL("../../", import.meta.url);
const sha = b => createHash("sha256").update(b).digest("hex");
const SOURCE_SHA = "ad41429d03909e3b7799eedb2d1745ec6a41b7110efc919dc4c95624268b8914";
const names = ["fire", "water", "earth", "thorn", "electric", "ice", "light", "shadow"];

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

test("eight projectile assets use 64 genuine RGBA phases extracted from the audited transparent sheet", () => {
  const m=JSON.parse(readFileSync(new URL("assets/library/capture/sprites/source/projectile_elemental_extraction_v1.json",root),"utf8"));
  const original=readFileSync(new URL(m.original.file,root));
  assert.equal(sha(original),SOURCE_SHA,"original user sheet must remain archived unchanged");
  assert.equal(m.original.sha256,SOURCE_SHA);
  assert.equal(original[25],2,"the supplied original is flattened RGB, not genuine alpha");
  const matteBytes=readFileSync(new URL(m.transparent.file,root));
  assert.equal(sha(matteBytes),m.transparent.sha256);
  assert.equal(m.backgroundExtraction.tool,"imagegen");
  const matte=rgbaPng(matteBytes);
  assert.deepEqual([matte.width,matte.height],m.transparent.size);
  assert.equal(m.families.length,8);
  const catalog=JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json",root),"utf8"));
  for (const [familyIndex,family] of m.families.entries()) {
    const name=names[familyIndex],id="pack:capture:sprite-projectile-"+name+"-01";
    assert.equal(family.assetId,id);
    const definitions=catalog.assets.filter(asset=>asset.id===id);
    assert.equal(definitions.length,1);
    assert.equal(definitions[0].category,"travel");
    assert.equal(definitions[0].resource.format,"sprite-strip");
    assert.equal("assets/library/"+definitions[0].resource.file,family.atlas);
    assert.equal(definitions[0].resource.frameCount,8);
    assert.equal(definitions[0].resource.frameMs,45);
    assert.equal(family.frames.length,8);
    const hashes=new Set();
    for(const [index,frame] of family.frames.entries()) {
      const bytes=readFileSync(new URL(frame.file,root));
      assert.equal(sha(bytes),frame.sha256);hashes.add(sha(bytes));
      assert.ok(frame.file.endsWith("/sprite_projectile_"+name+"_"+String(index+1).padStart(2,"0")+".png"));
      const image=rgbaPng(bytes);
      assert.deepEqual([image.width,image.height],m.frameSize);
      const [w,h]=m.frameSize;
      let visible=0,semi=0;const colors=new Set();
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const p=(y*w+x)*4,a=image.pixels[p+3];
        if(x<8||x>=w-8||y<8||y>=h-8)assert.equal(a,0,"transparent margins protect particles");
        if(a>=32){visible++;colors.add(image.pixels.subarray(p,p+3).toString("hex"));}
        if(a>0&&a<255)semi++;
      }
      assert.ok(visible>24,"real illustrated projectile or fragments required");
      assert.ok(semi>24,"glow and smooth edges require real partial alpha");
      assert.ok(colors.size>20,"solid-color placeholders are not the source artwork");
      const [left,top,right,bottom]=frame.sourceRect,[dx,dy]=frame.offset;
      for(let y=top;y<bottom;y++){
        const expected=matte.pixels.subarray((y*matte.width+left)*4,(y*matte.width+right)*4);
        const begin=((y-top+dy)*w+dx)*4;
        assert.ok(image.pixels.subarray(begin,begin+expected.length).equals(expected),"extraction must copy matte RGBA without resampling");
      }
    }
    assert.equal(hashes.size,8,"eight distinct phases are required");
    const atlas=readFileSync(new URL(family.atlas,root));
    assert.equal(sha(atlas),family.atlasSha256);
    assert.equal(atlas.toString("ascii",0,4),"RIFF");
    assert.equal(atlas.toString("ascii",8,12),"WEBP");
    assert.equal(atlas.toString("ascii",12,16),"VP8L","lossless atlas required");
    assert.equal(atlas[20],0x2f);
    const bits=atlas.readUInt32LE(21);
    assert.deepEqual([(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1],[m.frameSize[0]*8,m.frameSize[1]]);
  }
});
