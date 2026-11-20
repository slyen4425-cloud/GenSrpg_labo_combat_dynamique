// Shared importer input preparation: one still PNG/WebP/JPEG, a horizontal
// strip with explicit frame count, or several independent same-sized frames.
// Produces the existing ONE horizontal sprite strip understood by Combat.
// No second asset catalog, image editor or ZIP dependency.
export const CREATOR_IMPORT_MAX_FRAMES_V1=32;
const MAX_CANVAS_EDGE=16384,MAX_CANVAS_PIXELS=16000000;
const MIMES=new Set(['image/png','image/webp','image/jpeg']);
export function orderCreatorFramesV1(files){
  const collator=new Intl.Collator('fr',{numeric:true,sensitivity:'base'});
  return Object.freeze([...files].sort((a,b)=>collator.compare(a.name??'',b.name??'')));
}
function positiveFrames(value){
  const count=Number(value);
  if(!Number.isInteger(count)||count<1||count>CREATOR_IMPORT_MAX_FRAMES_V1)
    throw Error('Nombre de frames invalide (1 à '+CREATOR_IMPORT_MAX_FRAMES_V1+').');
  return count;
}
function sizeGuard(width,height,frames){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1)
  throw Error('Dimensions du sprite invalides.');
 if(width*frames>MAX_CANVAS_EDGE||height>MAX_CANVAS_EDGE||
    width*frames*height>MAX_CANVAS_PIXELS)
  throw Error('Planche trop grande pour mobile : réduis les images ou le nombre de frames.');
}
export async function prepareCreatorVisualImportV1({
 files,stripFrames=1,
 decode=file=>createImageBitmap(file),
 canvasFactory=()=>document.createElement('canvas')
}={}){
 const chosen=Array.from(files??[]);
 if(!chosen.length)throw Error('Choisis une image ou plusieurs frames PNG, WebP, JPEG.');
 if(chosen.length>CREATOR_IMPORT_MAX_FRAMES_V1)
  throw Error('32 frames maximum par animation.');
 for(const f of chosen){
  if(!MIMES.has(f?.type)||!f?.size)
   throw Error('Les fichiers doivent être des images PNG, WebP ou JPEG non vides.');
 }
 const ordered=chosen.length>1?orderCreatorFramesV1(chosen):chosen;
 const bitmaps=[];
 try{
  for(const f of ordered){
   const bitmap=await decode(f);
   bitmaps.push(bitmap);
  }
  const width=bitmaps[0].width,height=bitmaps[0].height;
  if(chosen.length===1){
   const frameCount=positiveFrames(stripFrames);
   if(width%frameCount!==0)
    throw Error('La largeur de la planche doit être divisible par le nombre de frames.');
   const frameWidth=width/frameCount;
   sizeGuard(frameWidth,height,frameCount);
   return Object.freeze({
    file:chosen[0],frameCount,frameWidth,frameHeight:height,
    source:'sheet'
   });
  }
  for(let i=1;i<bitmaps.length;i++){
   if(bitmaps[i].width!==width||bitmaps[i].height!==height)
    throw Error('Toutes les frames doivent avoir la même largeur et hauteur.');
  }
  sizeGuard(width,height,bitmaps.length);
  const canvas=canvasFactory();
  canvas.width=width*bitmaps.length;canvas.height=height;
  const ctx=canvas.getContext?.('2d');
  if(!ctx)throw Error('Canvas indisponible pour assembler les frames.');
  for(const [i,bitmap] of bitmaps.entries())
   ctx.drawImage(bitmap,i*width,0);
  const blob=await new Promise((ok,fail)=>{
   canvas.toBlob?.(out=>out?ok(out):fail(Error('Encodage PNG impossible.')),'image/png');
   if(!canvas.toBlob)fail(Error('Encodage Canvas indisponible.'));
  });
  const filename=(ordered[0].name??'animation').replace(/\.[^.]+$/,'')+'-'+bitmaps.length+'f.png';
  const result=typeof File==='function'?
   new File([blob],filename,{type:'image/png'}):
   Object.assign(blob,{name:filename});
  return Object.freeze({
   file:result,frameCount:bitmaps.length,frameWidth:width,frameHeight:height,
   source:'frames'
  });
 }finally{
  for(const bmp of bitmaps)bmp.close?.();
 }
}
