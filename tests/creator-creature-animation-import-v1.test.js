import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateRawSync} from 'node:zlib';
import {
 readCreatureAnimationZipV1,orderCreatureAnimationFramesV1,
 buildCreatureAnimationStripV1
} from '../src/assets/creator-creature-animation-import-v1.js';

function crc32(bytes){
 let x=0xffffffff;for(const b of bytes){x^=b;for(let i=0;i<8;i++)x=(x>>>1)^((x&1)?0xedb88320:0);}
 return (x^0xffffffff)>>>0;
}
function zip(entries,{deflate=false,corrupt=false}={}){
 const pieces=[],table=[];let offset=0;
 for(const [name,rawData] of entries){
  const nm=Buffer.from(name),raw=Buffer.from(rawData);
  const compressed=deflate?deflateRawSync(raw):raw;
  const crc=crc32(raw);
  const local=Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);
  local.writeUInt16LE(deflate?8:0,8);
  local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);
  local.writeUInt32LE(raw.length,22);local.writeUInt16LE(nm.length,26);
  const central=Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50,0);
  central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);
  central.writeUInt16LE(deflate?8:0,10);
  central.writeUInt32LE(corrupt?(crc^1)>>>0:crc,16);
  central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(raw.length,24);
  central.writeUInt16LE(nm.length,28);central.writeUInt32LE(offset,42);
  pieces.push(local,nm,compressed);table.push(central,nm);
  offset+=local.length+nm.length+compressed.length;
 }
 const cd=Buffer.concat(table),end=Buffer.alloc(22);
 end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);
 end.writeUInt16LE(entries.length,10);
 end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
 return new File([Buffer.concat([...pieces,cd,end])],'frames.zip',{type:'application/zip'});
}
const frame=i=>Buffer.from([137,80,78,71,13,10,26,10,i]);
const order=[10,3,1,8,6,2,0,4,9,7,5,11];
test('ZIP normal : extrait 12 frames dans l ordre numérique sans limite de 6',async()=>{
 const parts=order.map(i=>['frames/f_'+i+'.png',frame(i)]);
 const output=await readCreatureAnimationZipV1(zip(parts));
 assert.equal(output.length,12);
 assert.deepEqual(output.map(f=>f.name),Array.from({length:12},(_,i)=>'f_'+i+'.png'));
 assert.equal(output[8].type,'image/png');
});
test('ZIP compressé, fichier annexe et dossier acceptés',async()=>{
 const parts=[['sprites/',Buffer.alloc(0)],['sprites/readme.txt',Buffer.from('ignored')],
  ...order.slice(0,8).map(i=>['sprites/f_'+i+'.png',frame(i)])];
 const output=await readCreatureAnimationZipV1(zip(parts,{deflate:true}));
 assert.deepEqual(output.map(f=>f.name),order.slice(0,8).sort((a,b)=>a-b).map(i=>'f_'+i+'.png'));
});
test('ZIP endommagé : CRC bloquant et chemin interdit',async()=>{
 await assert.rejects(readCreatureAnimationZipV1(zip([['f0.png',frame(0)]],{corrupt:true})),/CRC/);
 await assert.rejects(readCreatureAnimationZipV1(zip([['../evil.png',frame(0)]])),/Chemin ZIP/);
});
test('images individuelles : ordre naturel, doublon et MIME contrôlés',()=>{
 const files=[10,2,1].map(i=>new File([frame(i)],'frame_'+i+'.png',{type:'image/png'}));
 assert.deepEqual(orderCreatureAnimationFramesV1(files).map(f=>f.name),['frame_1.png','frame_2.png','frame_10.png']);
 assert.throws(()=>orderCreatureAnimationFramesV1([files[0],files[0]]),/répétés/);
 assert.throws(()=>orderCreatureAnimationFramesV1([new File(['x'],'bad.jpg',{type:'image/jpeg'})]),/PNG\/WebP/);
});
test('planche horizontale : chaque frame garde exactement son emplacement sans redimensionnement',async()=>{
 const files=[2,0,1].map(i=>new File([frame(i)],'frame_'+i+'.png',{type:'image/png'}));
 const draws=[];
 const canvas={width:0,height:0,getContext:()=>({
   clearRect:(...args)=>draws.push(['clear',...args]),
   drawImage:(im,x,y)=>draws.push(['draw',im.i,x,y])
 }),toBlob(cb){cb(new Blob([frame(0)],{type:'image/png'}));}};
 const out=await buildCreatureAnimationStripV1(files,{
  decode:async f=>({width:64,height:96,i:Number(f.name.match(/\d+/)[0]),close(){}}),
  createCanvas:()=>canvas
 });
 assert.equal(out.frames,3);
 assert.equal(out.frameWidth,64);assert.equal(out.frameHeight,96);
 assert.equal(canvas.width,192);assert.equal(canvas.height,96);
 assert.deepEqual(draws.filter(a=>a[0]==='draw'),[
  ['draw',0,0,0],['draw',1,64,0],['draw',2,128,0]
 ]);
 assert.equal(out.file.type,'image/png');
});
test('mobile : très grandes frames rejetées avant allocation de la planche',async()=>{
 const files=[0,1].map(i=>new File([frame(i)],'frame_'+i+'.png',{type:'image/png'}));
 const closed=[];
 await assert.rejects(buildCreatureAnimationStripV1(files,{
  decode:async f=>({width:4096,height:4096,close(){closed.push(f.name);}}),
  createCanvas:()=>{throw Error('Canvas ne doit pas être alloué');}
 }),/trop lourde pour mobile/);
 assert.equal(closed.length,1);
});
test('défaut de taille des canevas : aucune planche enregistrée',async()=>{
 const files=[0,1].map(i=>new File([frame(i)],'f_'+i+'.png',{type:'image/png'}));
 await assert.rejects(buildCreatureAnimationStripV1(files,{decode:async f=>({
  width:f.name.includes('_0')?48:64,height:64,close(){}
 })}),/mêmes dimensions/);
});
