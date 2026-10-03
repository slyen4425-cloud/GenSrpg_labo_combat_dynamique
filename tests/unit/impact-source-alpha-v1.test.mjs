import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { createHash } from "node:crypto";

const root = new URL("../../", import.meta.url);
const sha = b => createHash("sha256").update(b).digest("hex");
const SOURCE_SHA = "8a1b0ded3ed0604bd54ee01c9ea50ca5974da28b1ce1692159de481bfbed11e0";
const names = ["blade", "physical", "electric", "water", "nature"];

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

test("impact assets preserve the supplied illustrated RGBA source and all 40 real frames",()=>{
  const m=JSON.parse(readFileSync(new URL("assets/library/capture/sprites/source/impact_elemental_extraction_v1.json",root),"utf8"));
  const sourceBytes=readFileSync(new URL(m.source.file,root));
  assert.equal(sha(sourceBytes),SOURCE_SHA,"artistic source must be the supplied original");
  assert.equal(m.source.sha256,SOURCE_SHA);
  const source=rgbaPng(sourceBytes);
  assert.deepEqual([source.width,source.height],[1536,1024]);
  assert.equal(m.families.length,5);
  const catalog=JSON.parse(readFileSync(new URL("data/assets/catalog/global-visual-assets.v1.json",root),"utf8"));
  for(const [familyIndex,family] of m.families.entries()) {
    const name=names[familyIndex], id="pack:capture:sprite-impact-"+name+"-01";
    assert.equal(family.assetId,id);
    const definitions=catalog.assets.filter(a=>a.id===id); assert.equal(definitions.length,1);
    assert.equal("assets/library/"+definitions[0].resource.file,family.atlas);
    assert.equal(definitions[0].resource.frameCount,8);
    assert.equal(definitions[0].resource.format,"sprite-strip");
    assert.equal(family.frames.length,8);
    const hashes=new Set();
    for(const [index,frame] of family.frames.entries()) {
      const bytes=readFileSync(new URL(frame.file,root));
      assert.equal(sha(bytes),frame.sha256); hashes.add(sha(bytes));
      assert.ok(frame.file.endsWith("/sprite_impact_"+name+"_"+String(index+1).padStart(2,"0")+".png"));
      const image=rgbaPng(bytes); assert.deepEqual([image.width,image.height],[400,400]);
      let visible=0, semi=0; const colors=new Set();
      for(let y=0;y<400;y++) for(let x=0;x<400;x++) {
        const p=(y*400+x)*4, alpha=image.pixels[p+3];
        if(x<8||x>=392||y<8||y>=392) assert.equal(alpha,0,"transparent padding must protect the effect");
        if(alpha>=64) {visible++;colors.add(image.pixels.subarray(p,p+3).toString("hex"));}
        if(alpha>0&&alpha<255) semi++;
      }
      assert.ok(visible>30,"actual illustrated particles must exist");
      assert.ok(semi>30,"source glow alpha must survive");
      assert.ok(colors.size>16,"solid shapes or placeholders are not the supplied artwork");
      const [origin,top]=frame.sourceOrigin, yOffset=frame.offset[1];
      const [tx0,ty0,tx1,ty1]=family.excludedTitle;
      for(let y=0;y<family.sourceRow[1]-top;y++) {
        const left=index===0?0:family.seams[index-1][y];
        const right=index===7?1536:family.seams[index][y];
        for(let x=left;x<right;x++) {
          const expected=source.pixels.subarray(((y+top)*1536+x)*4,((y+top)*1536+x)*4+4);
          const actual=image.pixels.subarray(((y+yOffset)*400+x-origin)*4,((y+yOffset)*400+x-origin)*4+4);
          if(x>=tx0&&x<tx1&&y+top>=ty0&&y+top<ty1) assert.deepEqual([...actual],[0,0,0,0],"heading removed");
          else assert.ok(actual.equals(expected),"source RGB and alpha must remain unchanged");
        }
      }
    }
    assert.equal(hashes.size,8,"eight genuinely different frames are required");
    const atlas=readFileSync(new URL(family.atlas,root));
    assert.equal(sha(atlas),family.atlasSha256);
    assert.equal(atlas.toString("ascii",0,4),"RIFF"); assert.equal(atlas.toString("ascii",8,12),"WEBP");
    assert.equal(atlas.toString("ascii",12,16),"VP8L","lossless runtime atlas");
    assert.equal(atlas[20],0x2f);
    const bits=atlas.readUInt32LE(21);
    assert.deepEqual([(bits&0x3fff)+1,((bits>>>14)&0x3fff)+1],[3200,400]);
  }
});
