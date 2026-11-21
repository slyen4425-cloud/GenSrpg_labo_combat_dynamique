// A creature animation is imported as one horizontal PNG strip and registered
// through the existing CreatorVisualAssetSession; this is NOT an asset library.
const MAX_ARCHIVE=64*1024*1024;
const MAX_FRAME=8*1024*1024;
const MAX_FRAMES=32;
const MAX_CANVAS_WIDTH=16384;
const PNG_HEADER=Uint8Array.of(137,80,78,71,13,10,26,10);
const u16=(d,p)=>{if(p<0||p+2>d.byteLength)throw Error('Archive ZIP tronquée');return d.getUint16(p,true);};
const u32=(d,p)=>{if(p<0||p+4>d.byteLength)throw Error('Archive ZIP tronquée');return d.getUint32(p,true);};
function crc32(bytes){
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
function imageMime(name){
 return /\.png$/i.test(name)?'image/png':/\.webp$/i.test(name)?'image/webp':null;
}
function checkImageMagic(bytes,mime){
 if(mime==='image/png'&&PNG_HEADER.every((v,i)=>v===bytes[i]))return;
 if(mime==='image/webp'&&bytes.length>=12&&
    String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&
    String.fromCharCode(...bytes.subarray(8,12))==='WEBP')return;
 throw Error('Image PNG/WebP invalide ou corrompue');
}
function validatePath(path){
 if(!path||path.startsWith('/')||path.includes('\\')||path.includes('\0')||
    path.split('/').some(p=>p==='..'||p==='.'||p===''))throw Error('Chemin ZIP non autorisé');
 return path;
}
async function inflateFrame(bytes,expectedSize){
 if(typeof DecompressionStream!=='function')
  throw Error('Ce navigateur ne prend pas en charge les ZIP compressés');
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
 const reader=stream.getReader(),parts=[];let total=0;
 try{
  for(;;){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   if(total>expectedSize||total>MAX_FRAME)throw Error('Image ZIP trop volumineuse');
   parts.push(value);
  }
 }catch(err){await reader.cancel().catch(()=>{});throw err;}
 if(total!==expectedSize)throw Error('Taille ZIP décompressée invalide');
 const out=new Uint8Array(total);let offset=0;
 for(const p of parts){out.set(p,offset);offset+=p.byteLength;}
 return out;
}
export async function readCreatureAnimationZipV1(archive){
 if(!(archive instanceof Blob)||!(/\.zip$/i.test(archive.name??''))||
    archive.size<22||archive.size>MAX_ARCHIVE)
  throw RangeError('ZIP valide de 64 Mo maximum requis');
 const bytes=new Uint8Array(await archive.arrayBuffer());
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 let eocd=-1;
 for(let p=bytes.length-22;p>=Math.max(0,bytes.length-65557);p--){
  if(u32(view,p)===0x06054b50&&p+22+u16(view,p+20)===bytes.length){eocd=p;break;}
 }
 if(eocd<0||u16(view,eocd+4)!==0||u16(view,eocd+6)!==0||
    u16(view,eocd+8)!==u16(view,eocd+10))throw Error('ZIP absent, tronqué ou multivolume');
 const count=u16(view,eocd+10),size=u32(view,eocd+12),central=u32(view,eocd+16);
 if(count<1||count>256||central+size>eocd)throw Error('Catalogue ZIP invalide');
 const entries=[],names=new Set();let cursor=central,totalSize=0;
 for(let i=0;i<count;i++){
  if(cursor+46>central+size||u32(view,cursor)!==0x02014b50)
   throw Error('Entrée ZIP tronquée');
  const flags=u16(view,cursor+8),method=u16(view,cursor+10);
  const crc=u32(view,cursor+16),packed=u32(view,cursor+20),unpacked=u32(view,cursor+24);
  const nameLength=u16(view,cursor+28),extra=u16(view,cursor+30),comment=u16(view,cursor+32);
  const offset=u32(view,cursor+42),end=cursor+46+nameLength+extra+comment;
  if(end>central+size)throw Error('Chemin ZIP tronqué');
  const path=validatePath(new TextDecoder('utf-8',{fatal:true}).decode(bytes.subarray(cursor+46,cursor+46+nameLength)));
  cursor=end;
  if(path.endsWith('/')||path.startsWith('__MACOSX/')||path.endsWith('.DS_Store'))continue;
  const mime=imageMime(path);
  if(!mime)continue; // Other files in creative-tool exports, e.g. manifests.
  if((flags&1)||![0,8].includes(method)||unpacked<1||unpacked>MAX_FRAME)
   throw Error('Image ZIP compressée ou chiffrée non prise en charge : '+path);
  if(names.has(path.toLowerCase()))throw Error('Nom de frame dupliqué : '+path);
  names.add(path.toLowerCase());
  totalSize+=unpacked;
  if(totalSize>MAX_ARCHIVE)throw Error('ZIP décompressé trop volumineux');
  entries.push({path,mime,method,packed,unpacked,crc,offset});
 }
 if(cursor!==central+size||entries.length<1||entries.length>MAX_FRAMES)
  throw RangeError('Le ZIP doit contenir de 1 à '+MAX_FRAMES+' PNG/WebP');
 entries.sort((a,b)=>a.path.localeCompare(b.path,'fr',{numeric:true,sensitivity:'base'}));
 const result=[];
 for(const entry of entries){
  if(entry.offset+30>central||u32(view,entry.offset)!==0x04034b50||
     u16(view,entry.offset+8)!==entry.method)
   throw Error('Entête ZIP invalide : '+entry.path);
  const start=entry.offset+30+u16(view,entry.offset+26)+u16(view,entry.offset+28);
  if(start+entry.packed>central)throw Error('Image ZIP hors limites');
  const packed=bytes.subarray(start,start+entry.packed);
  const raw=entry.method===0?packed:await inflateFrame(packed,entry.unpacked);
  if(raw.length!==entry.unpacked||crc32(raw)!==entry.crc)
   throw Error('Contrôle CRC échoué : '+entry.path);
  checkImageMagic(raw,entry.mime);
  result.push(new File([raw],entry.path.split('/').at(-1),{type:entry.mime}));
 }
 return Object.freeze(result);
}
export function orderCreatureAnimationFramesV1(files){
 const items=Array.from(files??[]);
 if(items.length<1||items.length>MAX_FRAMES)throw RangeError('Entre 1 et 32 images par animation');
 const names=new Set();
 for(const file of items){
  if(!(file instanceof Blob)||!imageMime(file.name??'')||
     !['image/png','image/webp'].includes(file.type)||file.size<1||file.size>MAX_FRAME)
   throw Error('Chaque frame doit être une image PNG/WebP de 8 Mo maximum');
  const key=file.name.toLowerCase();
  if(names.has(key))throw Error('Noms de frames répétés');
  names.add(key);
 }
 return Object.freeze(items.sort((a,b)=>
  a.name.localeCompare(b.name,'fr',{numeric:true,sensitivity:'base'})));
}
export async function buildCreatureAnimationStripV1(files,{
 decode=async file=>createImageBitmap(file),
 createCanvas=()=>document.createElement('canvas')
}={}){
 const ordered=orderCreatureAnimationFramesV1(files);
 const decoded=[];
 try{
  for(const file of ordered){
   const frame=await decode(file);
   if(!frame||!Number.isInteger(frame.width)||!Number.isInteger(frame.height)||
      frame.width<16||frame.height<16||frame.width>4096||frame.height>4096)
    throw Error('Dimensions de frame invalides');
   if(decoded.length&&(frame.width!==decoded[0].width||
      frame.height!==decoded[0].height))throw Error('Toutes les frames doivent avoir les mêmes dimensions');
   decoded.push(frame);
  }
  const {width,height}=decoded[0];
  if(width*decoded.length>MAX_CANVAS_WIDTH||height>4096)
   throw RangeError('Planche animée trop large : réduit la taille des frames');
  const canvas=createCanvas();canvas.width=width*decoded.length;canvas.height=height;
  const context=canvas.getContext('2d');
  if(!context)throw Error('Canvas 2D non disponible');
  context.clearRect(0,0,canvas.width,canvas.height);
  decoded.forEach((frame,i)=>context.drawImage(frame,i*width,0));
  const blob=await new Promise((ok,fail)=>
   canvas.toBlob(b=>b?ok(b):fail(Error('Impossible de produire la planche PNG')),'image/png'));
  if(blob.size>MAX_FRAME)throw RangeError('Planche supérieure à 8 Mo : réduire les images');
  return Object.freeze({file:new File([blob],'animation-creature-'+ordered.length+'-frames.png',{type:'image/png'}),
   frames:ordered.length,frameWidth:width,frameHeight:height});
 }finally{for(const frame of decoded)frame.close?.();}
}
