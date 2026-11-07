// CI/release gate for artist-exported PNG RGBA frames. No third-party modules.
// Usage: node scripts/validate-sprite-safe-margins.mjs path/to/frame*.png
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';

export const FRAME_SIZE=512;
export const SAFE_MARGIN=Math.ceil(32*1.30); // 42 px, charter 2026-11-01

export function inspectSpritePng(buffer,{size=FRAME_SIZE,margin=SAFE_MARGIN,alphaThreshold=8}={}){
  if(!Buffer.isBuffer(buffer)||buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')
    throw new Error('PNG signature required');
  let ptr=8,width=0,height=0,depth=0,color=0,interlace=0,seenHeader=false;
  const chunks=[];
  while(ptr+12<=buffer.length){
    const length=buffer.readUInt32BE(ptr),type=buffer.toString('ascii',ptr+4,ptr+8);
    if(ptr+12+length>buffer.length)throw new Error('Truncated PNG chunk');
    const bytes=buffer.subarray(ptr+8,ptr+8+length);
    if(type==='IHDR'){
      if(seenHeader||length!==13)throw new Error('Invalid IHDR');
      width=bytes.readUInt32BE(0);height=bytes.readUInt32BE(4);
      depth=bytes[8];color=bytes[9];interlace=bytes[12];seenHeader=true;
    }
    if(type==='IDAT')chunks.push(bytes);
    ptr+=length+12;
    if(type==='IEND')break;
  }
  if(width!==size||height!==size||depth!==8||color!==6||interlace!==0)
    throw new Error('Expected '+size+'x'+size+' 8-bit RGBA, non-interlaced PNG');
  if(chunks.length===0)throw new Error('Missing PNG image data');
  const src=inflateSync(Buffer.concat(chunks)),stride=width*4;
  if(src.length!==(stride+1)*height)throw new Error('PNG scanline byte length mismatch');
  let off=0,prev=Buffer.alloc(stride),minX=width,minY=height,maxX=-1,maxY=-1,count=0;
  for(let y=0;y<height;y++){
    const filter=src[off++],row=Buffer.alloc(stride);
    for(let j=0;j<stride;j++){
      const left=j>=4?row[j-4]:0,above=prev[j],upperLeft=j>=4?prev[j-4]:0;
      let predict=0;
      if(filter===1)predict=left;
      else if(filter===2)predict=above;
      else if(filter===3)predict=Math.floor((left+above)/2);
      else if(filter===4){
        const p=left+above-upperLeft,a=Math.abs(p-left),b=Math.abs(p-above),c=Math.abs(p-upperLeft);
        predict=(a<=b&&a<=c)?left:(b<=c?above:upperLeft);
      } else if(filter!==0)throw new Error('Unsupported PNG filter '+filter);
      row[j]=(src[off++]+predict)&255;
    }
    for(let x=0;x<width;x++)if(row[x*4+3]>=alphaThreshold){
      count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
      minY=Math.min(minY,y);maxY=Math.max(maxY,y);
    }
    prev=row;
  }
  if(!count)throw new Error('Empty frame or transparent sprite');
  const margins=[minX,minY,width-1-maxX,height-1-maxY];
  if(margins.some(n=>n<margin))throw new Error(
    'Sprite enters '+margin+'px safe border: left/top/right/bottom '+margins.join('/'));
  return Object.freeze({width,height,visiblePixels:count,bbox:[minX,minY,maxX+1,maxY+1],margins});
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const files=process.argv.slice(2);
  if(!files.length)throw new Error('Provide one or more PNG frame paths');
  for(const file of files){
    const r=inspectSpritePng(readFileSync(file));
    console.log('PASS',file,'margins',r.margins.join('/'),'visible',r.visiblePixels);
  }
}
