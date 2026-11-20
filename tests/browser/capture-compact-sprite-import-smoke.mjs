// Real Chromium gate: no separate editor, true PNG multi-file picker,
// native scene asset session and the actual creature/skill dropdowns.
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,extname,sep,join} from 'node:path';
import {once} from 'node:events';
const root=process.cwd();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript',
 '.json':'application/json','.css':'text/css','.png':'image/png',
 '.webp':'image/webp','.svg':'image/svg+xml'};
const probe=`<script>
window.addEventListener('DOMContentLoaded',()=>{
 const report=text=>{document.documentElement.dataset.creatorBulkSmoke=text;};
 const delay=ms=>new Promise(done=>setTimeout(done,ms));
 async function until(check,label){
  for(let i=0;i<125;i++){const ok=check();if(ok)return ok;await delay(160);}
  const field=document.querySelector('[data-creature-visual-importer] [data-creator-visual-file]');
  const state=document.querySelector('[data-creature-visual-importer] [data-creator-visual-state]');
  throw Error('Timed out: '+label+
   ' state='+state?.textContent+
   ' disabled='+document.querySelector('[data-creature-visual-importer] [data-creator-visual-import]')?.disabled+
   ' files='+field?.files?.length+
   ' assetOptions='+document.querySelector('[data-creature-front-select]')?.options?.length+
   ' editor='+document.querySelector('[data-editor-status]')?.textContent+
   ' hasBitmap='+String(typeof createImageBitmap));
 }
 const assert=(cond,message)=>{if(!cond)throw Error(message);};
 async function png(name,color,w=32,h=32){
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,w,h);
  const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));
  return new File([blob],name,{type:'image/png'});
 }
 function injectFiles(input,files){
  const data=new DataTransfer();
  files.forEach(f=>data.items.add(f));
  input.files=data.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 async function run(){
  const author=await until(()=>{
    const creature=document.querySelector('[data-creature-visual-importer]');
    const skill=document.querySelector('[data-skill-visual-importer]');
    const types=document.querySelector('[data-creature-front-select]');
    if(creature&&skill&&types)return {creature,skill};
    return null;
  },'native Capture editor boot');
  await delay(2400); // Let the real native editor hydrate its single asset catalog.
  const previous=sessionStorage.getItem('creator-bulk-reload-ids');
  if(previous){
    const ids=JSON.parse(previous);
    const mov=document.querySelector('[data-creature-movement-visual]');
    const travel=document.querySelector('[data-asset-role="travel"]');
    await until(()=>[...mov.options].some(o=>o.value===ids.movement)&&
      [...travel.options].some(o=>o.value===ids.travel),
      'saved personal sprites must return with unchanged IDs after page reload');
    assert(!author.creature.open&&!author.skill.open,
      'saved assets must not open the two compact import panels');
    sessionStorage.removeItem('creator-bulk-reload-ids');
    report('pass:3f-creature-and-4f-projectile-restored-after-reload');
    return;
  }
  assert(!author.creature.open&&!author.skill.open,'import panels must be collapsed by default');
  const outer=author.creature.closest('[data-creature-appearance-group="imports"]');
  assert(outer&&!outer.open,'legacy creature visual library should remain folded');
  outer.open=true;author.creature.open=true;
  const c=author.creature,cr=c.querySelector('[data-creator-visual-role]');
  cr.value='movement';
  injectFiles(c.querySelector('[data-creator-visual-file]'),[
   await png('course_03.png','#0088cc'),
   await png('course_01.png','#ff0088'),
   await png('course_02.png','#00ff88')
  ]);
  await until(()=>!c.querySelector('[data-creator-visual-import]').disabled,'3-frame animated import preview');
  const preview=c.querySelector('[data-creator-visual-preview-wrap]');
  assert(!preview.hidden&&preview.textContent.includes('3 frame(s)'),
   'no real animation preview before importing');
  c.querySelector('[data-creator-visual-import]').click();
  const mov=document.querySelector('[data-creature-movement-visual]');
  await until(()=>[...mov.options].some(opt=>opt.value.startsWith('user:')),'personal animated movement in canonical selector');
  assert(mov.value.startsWith('user:'),'new movement not selected');
  assert(c.querySelector('[data-creator-visual-state]').textContent.includes('3 frame(s)'),
   'bulk count lost in editor');
  c.open=false;outer.open=false;

  // A pre-assembled 4-frame PNG strip is the second path, in the existing
  // COMPETENCE importer, without creating a parallel asset catalogue.
  const skill=author.skill;skill.open=true;
  skill.querySelector('[data-creator-visual-role]').value='travel';
  skill.querySelector('[data-creator-visual-frames]').value='4';
  skill.querySelector('[data-creator-visual-frames]').dispatchEvent(new Event('change',{bubbles:true}));
  injectFiles(skill.querySelector('[data-creator-visual-file]'),[
   await png('projectile_4f.png','#fabb00',128,32)
  ]);
  await until(()=>!skill.querySelector('[data-creator-visual-import]').disabled,'4-frame skill strip preview');
  skill.querySelector('[data-creator-visual-import]').click();
  const travel=document.querySelector('[data-asset-role="travel"]');
  await until(()=>[...travel.options].some(opt=>opt.value.startsWith('user:')),'personal projectile in shared skill selector');
  assert(travel.value.startsWith('user:'),'user skill projectile not selected');
  await until(()=>c.querySelector('[data-creator-visual-state]').textContent.startsWith('Sauvegardé'),
   'creature sprite committed in IndexedDB');
  await until(()=>skill.querySelector('[data-creator-visual-state]').textContent.startsWith('Sauvegardé'),
   'skill sprite committed in IndexedDB');
  sessionStorage.setItem('creator-bulk-reload-ids',JSON.stringify({
    movement:mov.value,travel:travel.value
  }));
  location.reload();
 }
 run().catch(err=>report('fail:'+String(err?.message??err)));
});
</script>`;
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const full=resolve(root,'.'+path);
  if(!full.startsWith(root+sep))return void res.writeHead(403).end('Forbidden');
  let body=await readFile(full);
  if(path.endsWith('/capture-editor-v2.html'))
   body=Buffer.from(body.toString('utf8').replace('</head>',probe+'</head>'));
  res.writeHead(200,{'Content-Type':mime[extname(full)]??'application/octet-stream',
   'Cache-Control':'no-store'}).end(body);
 }catch(e){res.writeHead(404).end(String(e));}
});
server.listen(0,'127.0.0.1');await once(server,'listening');
// IndexedDB commits are real I/O: Chromium's virtual-time-budget can fast-
// forward setTimeout while the disk transaction has not completed. Use a real
// DevTools session here; never fake/suppress the persistence assertion.
async function runWithCDP(chrome,width,height){
 const profile=await mkdtemp(join(tmpdir(),'gensrpg-creator-sprites-'));
 const url='http://127.0.0.1:'+server.address().port+
  '/examples/dom-demo/capture-editor-v2.html?tab=skills';
 const child=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--window-size='+width+','+height,
  '--force-device-scale-factor=1','--remote-allow-origins=*',
  '--remote-debugging-port=0','--user-data-dir='+profile,url
 ],{stdio:['ignore','ignore','pipe']});
 let ws=null,lastError='',finished=false;
 child.stderr.on('data',chunk=>{lastError=(lastError+chunk.toString()).slice(-2300)});
 const startAt=Date.now();
 const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
 try{
  let port;
  while(!port){
   try{
    const lines=(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split(/\r?\n/);
    port=Number(lines[0])||null;
   }catch{}
   if(!port){if(Date.now()-startAt>18000)throw Error('Chrome DevTools startup timeout '+lastError);await sleep(120);}
  }
  let target;
  while(!target){
   const res=await fetch('http://127.0.0.1:'+port+'/json/list');
   const pages=await res.json();
   target=pages.find(x=>x.type==='page'&&x.webSocketDebuggerUrl)??null;
   if(!target){if(Date.now()-startAt>18000)throw Error('Chrome page target timeout');await sleep(120);}
  }
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
   ws.addEventListener('open',resolve,{once:true});
   ws.addEventListener('error',()=>reject(Error('DevTools connection failed')),{once:true});
  });
  let sequence=0;
  const pending=new Map();
  ws.addEventListener('message',event=>{
   let frame;try{frame=JSON.parse(event.data)}catch{return;}
   if(frame.id===undefined)return;
   const item=pending.get(frame.id);
   if(!item)return;
   pending.delete(frame.id);clearTimeout(item.timer);
   if(frame.error)item.reject(Error(frame.error.message??'DevTools command failed'));
   else item.resolve(frame.result);
  });
  function command(method,params={}){
   return new Promise((resolve,reject)=>{
    const id=++sequence;
    const timer=setTimeout(()=>{
     pending.delete(id);reject(Error('DevTools command timeout '+method));
    },8000);
    pending.set(id,{resolve,reject,timer});
    ws.send(JSON.stringify({id,method,params}));
   });
  }
  let outcome='',lastSeen='';
  while(Date.now()-startAt<85000){
   try{
    const response=await command('Runtime.evaluate',{
     expression:"document.documentElement?.dataset?.creatorBulkSmoke ?? ''",
     returnByValue:true
    });
    outcome=String(response?.result?.value??'');
    if(outcome)lastSeen=outcome;
    if(outcome.startsWith('pass:')){
     finished=true;break;
    }
    if(outcome.startsWith('fail:'))throw Error('Capture import UI: '+outcome);
   }catch(error){
    if(String(error?.message).startsWith('Capture import UI:'))throw error;
    // During location.reload(), CDP drops the execution context briefly.
   }
   await sleep(220);
  }
  if(!finished)throw Error('Capture author recovery timeout '+width+'x'+height+
   ' lastStatus='+lastSeen+' '+lastError.slice(-500));
  console.log('PASS real-time Chromium IndexedDB SAVE/RELOAD '+width+'x'+height+' '+outcome);
 }finally{
  try{ws?.close()}catch{}
  child.kill('SIGKILL');
  await Promise.race([once(child,'close').catch(()=>{}),sleep(1200)]);
  await rm(profile,{recursive:true,force:true,maxRetries:3});
 }
}
try{
 const chrome=[process.env.CHROME_PATH,'google-chrome','google-chrome-stable','chromium','chromium-browser']
  .filter(Boolean).find(bin=>spawnSync('which',[bin]).status===0);
 if(!chrome)throw Error('Chromium required');
 for(const [w,h] of [[932,430],[1440,900]]){
  await runWithCDP(chrome,w,h);
 }
}finally{server.close();}
