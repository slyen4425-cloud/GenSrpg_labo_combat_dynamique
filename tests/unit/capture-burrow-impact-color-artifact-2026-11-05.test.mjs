import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inflateSync} from "node:zlib";

function visibleNeonPixels(bytes) {
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
  let p=8,w=0,h=0,depth=0,color=0;
  const compressed=[];
  while(p+12<=bytes.length){
    const n=bytes.readUInt32BE(p),kind=bytes.toString("ascii",p+4,p+8);
    const part=bytes.subarray(p+8,p+8+n);
    if(kind==="IHDR"){w=part.readUInt32BE(0);h=part.readUInt32BE(4);depth=part[8];color=part[9];}
    if(kind==="IDAT")compressed.push(part);
    p+=n+12;if(kind==="IEND")break;
  }
  assert.equal(w,512);assert.equal(h,512);assert.equal(depth,8);assert.equal(color,6);
  const raw=inflateSync(Buffer.concat(compressed));
  const stride=4*w;let off=0,prev=Buffer.alloc(stride),found=0,visible=0;
  for(let y=0;y<h;y++){
    const filter=raw[off++],row=Buffer.alloc(stride);
    for(let i=0;i<stride;i++){
      const a=i>=4?row[i-4]:0,b=prev[i],c=i>=4?prev[i-4]:0;
      let pred=0;
      if(filter===1)pred=a;
      else if(filter===2)pred=b;
      else if(filter===3)pred=Math.floor((a+b)/2);
      else if(filter===4){const p=a+b-c,A=Math.abs(p-a),B=Math.abs(p-b),C=Math.abs(p-c);pred=A<=B&&A<=C?a:B<=C?b:c;}
      else assert.equal(filter,0);
      row[i]=(raw[off++]+pred)&255;
    }
    for(let x=0;x<w;x++){
      const i=x*4,a=row[i+3];
      if(a<8)continue;visible++;
      const maximum=Math.max(row[i],row[i+1],row[i+2]);
      const minimum=Math.min(row[i],row[i+1],row[i+2]);
      if(maximum>=175 && (maximum-minimum)/maximum>=.88)found++;
    }
    prev=row;
  }
  return {found,visible};
}
test("earth eruption impact has no vivid red/yellow/green contamination, all 20 source frames",()=>{
  let total=0;
  for(let i=1;i<=20;i++){
    const path=new URL("../../assets/library/capture/sprites/skills/burrow_terrain/impact/frames/sprite_burrow_impact_"+String(i).padStart(2,"0")+".png",import.meta.url);
    const {found,visible}=visibleNeonPixels(readFileSync(path));total+=found;
    assert.ok(visible>1000,"eruption is not blank: frame "+i);
    assert.equal(found,0,"out-of-palette vivid neon RGB in actual impact frame "+i);
  }
  assert.equal(total,0);
});
