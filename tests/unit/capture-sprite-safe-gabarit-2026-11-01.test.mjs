import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {inspectSpritePng,SAFE_MARGIN} from '../../scripts/validate-sprite-safe-margins.mjs';

const sig=Buffer.from('89504e470d0a1a0a','hex');
function chunk(type,bytes){
  const size=Buffer.alloc(4);size.writeUInt32BE(bytes.length);
  return Buffer.concat([size,Buffer.from(type),bytes,Buffer.alloc(4)]);
}
function png({points=[],width=512,height=512,rgba=true}={}){
  const channels=rgba?4:3,head=Buffer.alloc(13);
  head.writeUInt32BE(width,0);head.writeUInt32BE(height,4);head[8]=8;head[9]=rgba?6:2;
  const scanlines=Buffer.alloc((width*channels+1)*height);
  for(const [x,y] of points){
    const i=y*(width*channels+1)+1+x*channels;
    scanlines[i]=140;scanlines[i+1]=210;scanlines[i+2]=245;
    if(rgba)scanlines[i+3]=255;
  }
  return Buffer.concat([sig,chunk('IHDR',head),chunk('IDAT',deflateSync(scanlines)),chunk('IEND',Buffer.alloc(0))]);
}

test('contract: 30% improvement of old 32px safe margin => 42px',()=>{
  assert.equal(SAFE_MARGIN,42);
});
test('one framed sprite inside 42px safety zone passes',()=>{
  const r=inspectSpritePng(png({points:[[42,42],[469,469]]}));
  assert.deepEqual(r.margins,[42,42,42,42]);
});
test('41px at any edge is rejected, including tiny foreign neighbor',()=>{
  for(const pt of [[41,200],[470,200],[200,41],[200,470]]){
    assert.throws(()=>inspectSpritePng(png({points:[[256,256],pt]})),/safe border/);
  }
});
test('empty, incorrect-size or non-RGBA frames are refused',()=>{
  assert.throws(()=>inspectSpritePng(png()),/Empty frame/);
  assert.throws(()=>inspectSpritePng(png({width:256,height:256,points:[[100,100]]})),/Expected 512x512/);
  assert.throws(()=>inspectSpritePng(png({rgba:false,points:[[200,200]]})),/Expected 512x512/);
});
