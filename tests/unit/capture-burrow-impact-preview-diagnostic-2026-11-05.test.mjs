import test from "node:test";
import {readFileSync} from "node:fs";
import {inflateSync,deflateSync} from "node:zlib";
const base=new URL("../../assets/library/capture/sprites/skills/burrow_terrain/impact/frames/",import.meta.url);
function decode(name){
 const bytes=readFileSync(new URL(name,base));
 let pos=8,width=0,height=0,depth=0,type=0;const parts=[];
 while(pos<bytes.length){
  const size=bytes.readUInt32BE(pos),tag=bytes.toString("ascii",pos+4,pos+8);
  const chunk=bytes.subarray(pos+8,pos+8+size);
  if(tag==="IHDR"){width=chunk.readUInt32BE(0);height=chunk.readUInt32BE(4);depth=chunk[8];type=chunk[9];}
  if(tag==="IDAT")parts.push(chunk);
  pos+=size+12;if(tag==="IEND")break;
 }
 if(width!==512||height!==512||depth!==8||type!==6)throw Error("expected RGBA512");
 const raw=inflateSync(Buffer.concat(parts));const stride=width*4;const pixels=Buffer.alloc(stride*height);
 let cursor=0;let before=Buffer.alloc(stride);
 for(let y=0;y<height;y++){
  const filter=raw[cursor++],row=Buffer.alloc(stride);
  for(let i=0;i<stride;i++){
   const a=i>=4?row[i-4]:0,b=before[i],c=i>=4?before[i-4]:0;
   let pred=filter===1?a:filter===2?b:filter===3?Math.floor((a+b)/2):0;
   if(filter===4){const p=a+b-c,A=Math.abs(p-a),B=Math.abs(p-b),C=Math.abs(p-c);pred=A<=B&&A<=C?a:B<=C?b:c;}
   if(![0,1,2,3,4].includes(filter))throw Error("PNG filter");
   row[i]=(raw[cursor++]+pred)&255;
  }
  row.copy(pixels,y*stride);before=row;
 }
 return pixels;
}
const table=new Uint32Array(256);for(let i=0;i<256;i++){let n=i;for(let j=0;j<8;j++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;table[i]=n>>>0;}
function crc(buf){let n=0xffffffff;for(const b of buf)n=table[(n^b)&255]^(n>>>8);return(n^0xffffffff)>>>0;}
function chunk(tag,data){const name=Buffer.from(tag),head=Buffer.alloc(4),tail=Buffer.alloc(4);head.writeUInt32BE(data.length);tail.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([head,name,data,tail]);}
function png(width,height,pixels){
 const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++){raw[y*(width*4+1)]=0;pixels.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);}
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([Buffer.from("89504e470d0a1a0a","hex"),chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw,{level:9})),chunk("IEND",Buffer.alloc(0))]);
}
test("diagnostic: actual impact animation RGBA 20-frame mosaic for inspection",()=>{
 const S=96,C=4,R=5,W=C*S,H=R*S,out=Buffer.alloc(W*H*4);
 for(let f=0;f<20;f++){
  const frame=decode("sprite_burrow_impact_"+String(f+1).padStart(2,"0")+".png");
  const ox=(f%C)*S,oy=Math.floor(f/C)*S;
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){
   const sx=Math.floor((x+.5)*512/S),sy=Math.floor((y+.5)*512/S);
   const i=(sy*512+sx)*4,j=((oy+y)*W+ox+x)*4;
   const alpha=frame[i+3]/255,bg=((Math.floor(x/12)+Math.floor(y/12))%2)?230:245;
   for(let c=0;c<3;c++)out[j+c]=Math.round(frame[i+c]*alpha+bg*(1-alpha));
   out[j+3]=255;
  }
 }
 const b64=png(W,H,out).toString("base64");
 for(let start=0,part=0;start<b64.length;start+=12000,part++)
   console.log("BURROW_IMPACT_PREVIEW_PART_"+String(part).padStart(3,"0")+"="+b64.slice(start,start+12000));
});
