import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCaptureHudLayoutV1,updateCaptureHudLayoutV1,resetCaptureHudProfileV1,validateCaptureHudGeometryV1,captureHudSkillRoleV1}
 from '../../src/contracts/capture-hud-layout-v1.js';
test('legacy layout is empty, opt-in independent profiles are frozen and reset does not affect other screens',()=>{
 const empty=normalizeCaptureHudLayoutV1();
 assert.deepEqual(empty.profiles,{});
 const pc=updateCaptureHudLayoutV1(empty,'desktop-1v1','dodge',{dx:2,dy:-1,scale:105});
 const both=updateCaptureHudLayoutV1(pc,'touch-2v2','command-dock',{dx:-2,dy:0,scale:100});
 assert.deepEqual(both.profiles['desktop-1v1'].dodge,{dx:2,dy:-1,scale:105});
 assert.equal(Object.isFrozen(both.profiles['touch-2v2']),true);
 assert.deepEqual(resetCaptureHudProfileV1(both,'touch-2v2'),pc);
 assert.deepEqual(updateCaptureHudLayoutV1(pc,'desktop-1v1','dodge',{dx:0,dy:0,scale:100}),empty);
 assert.throws(()=>updateCaptureHudLayoutV1(pc,'desktop-1v1','crea-loup',{dx:0,dy:0,scale:100}));
 assert.throws(()=>updateCaptureHudLayoutV1(pc,'desktop-1v1','dodge',{dx:51,dy:0,scale:100}));
 assert.throws(()=>updateCaptureHudLayoutV1(pc,'touch-1v1','dodge',{dx:0,dy:0,scale:50}));
 assert.throws(()=>normalizeCaptureHudLayoutV1({schema:'wrong',profiles:{}}));
});
const rect=(left,top,right,bottom,targets=[])=>({left,top,right,bottom,targets});
test('geometry preserves default placement and rejects overlap, center, arena exits, and tactile shrink',()=>{
 const baseline={local:rect(5,330,165,420),dodge:rect(350,360,402,415,[{width:52,height:55}]),dock:rect(430,295,740,420)};
 const check=(proposed,touch=true)=>validateCaptureHudGeometryV1({baseline,proposed,width:760,height:430,touch});
 assert.equal(check(baseline),null);
 assert.equal(check({...baseline,dodge:rect(360,360,412,415,[{width:52,height:55}])}),null);
 assert.match(check({...baseline,dodge:rect(450,360,502,415,[{width:52,height:55}])}),/Chevauchement/);
 assert.match(check({...baseline,dodge:rect(350,100,402,155,[{width:52,height:55}])}),/centrale/);
 assert.match(check({...baseline,dodge:rect(-10,360,42,415,[{width:52,height:55}])}),/Hors arène/);
 assert.match(check({...baseline,dodge:rect(350,360,385,395,[{width:35,height:35}])}),/tactile/);
});

test('logical skill slot is stable even with an empty previous slot, and layout preserves the ultimate separately',()=>{
 const slots=[{id:'slot-1',skillId:null},{id:'slot-2',skillId:'fire'},{id:'slot-ultimate',skillId:'end'}];
 assert.equal(captureHudSkillRoleV1(slots,'fire'),'skill-slot-2');
 assert.equal(captureHudSkillRoleV1(slots,'end'),'skill-slot-ultimate');
 assert.equal(captureHudSkillRoleV1(slots,'missing'),null);
 const layout=updateCaptureHudLayoutV1(undefined,'touch-2v2','skill-slot-2',{dx:1,dy:0,scale:100});
 assert.equal(layout.profiles['touch-2v2']['skill-slot-2'].dx,1);
});
test('individual skills may move inside their dock but cannot cover another skill or hide a clickable control',()=>{
 const base={dock:rect(400,300,750,420),a:{...rect(410,320,450,370,[{width:40,height:50,hit:true}]),parentRole:'dock'},b:{...rect(470,320,510,370),parentRole:'dock'}};
 const verify=proposed=>validateCaptureHudGeometryV1({baseline:base,proposed,width:800,height:450});
 assert.equal(verify({...base,a:{...base.a,left:415,right:455}}),null);
 assert.match(verify({...base,a:{...base.a,left:475,right:515}}),/Chevauchement/);
 assert.match(verify({...base,a:{...base.a,targets:[{width:40,height:50,hit:false}]}}),/recouverte/);
});

import {captureHudPointerValueV1} from '../../src/ui/capture-hud-visual-author-v1.js';
test('visual pointer edits write the same normalized offsets, nested skills compensate dock scale',()=>{
 const base={dx:0,dy:0,scale:100};
 const args={value:base,mode:'move',deltaX:80,deltaY:-45,width:800,height:450,elementWidth:50};
 assert.deepEqual(captureHudPointerValueV1(args),{dx:10,dy:-10,scale:100});
 assert.deepEqual(captureHudPointerValueV1({...args,parentScale:1.25}),{dx:8,dy:-8,scale:100});
 assert.equal(captureHudPointerValueV1({...args,deltaX:900}).dx,50);
 assert.equal(captureHudPointerValueV1({...args,mode:'resize',deltaX:100}).scale,125);
 assert.equal(captureHudPointerValueV1({...args,mode:'resize',deltaX:-100}).scale,85);
 const result=updateCaptureHudLayoutV1(undefined,'desktop-1v1','dodge',captureHudPointerValueV1(args));
 assert.deepEqual(normalizeCaptureHudLayoutV1(JSON.parse(JSON.stringify(result))),result);
});

import {editCaptureHudGroupV1,captureHudSkillPagesV1,captureHudRoleLabelV1} from '../../src/contracts/capture-hud-layout-v1.js';
import {captureHudGroupPointerValuesV1} from '../../src/ui/capture-hud-visual-author-v1.js';
test('named groups round trip in the same metadata, with profile isolation and stable generated ids',()=>{
 const empty=normalizeCaptureHudLayoutV1(),profile='touch-1v1';
 const first=editCaptureHudGroupV1(empty,profile,null,{label:' Attaques ',roles:['skill-slot-1','skill-slot-5'],foldable:true});
 assert.deepEqual(first.groups[profile][0],{id:'hud-group-1',label:'Attaques',roles:['skill-slot-1','skill-slot-5'],foldable:true});
 assert.equal(Object.isFrozen(first.groups[profile][0].roles),true);
 assert.deepEqual(normalizeCaptureHudLayoutV1(JSON.parse(JSON.stringify(first))),first);
 assert.throws(()=>editCaptureHudGroupV1(first,profile,null,{label:'Doublon',roles:['skill-slot-1'],foldable:false}));
 assert.throws(()=>editCaptureHudGroupV1(first,profile,null,{label:'PV masqués',roles:['local-status'],foldable:true}));
 assert.throws(()=>editCaptureHudGroupV1(first,profile,null,{label:'Double mouvement',roles:['command-dock','skill-slot-2'],foldable:false}));
 assert.equal(captureHudSkillRoleV1([{id:'slot-5',skillId:'new'}],'new'),'skill-slot-5');
 assert.equal(captureHudRoleLabelV1('skill-slot-5'),'Compétence 5');
 const offset=updateCaptureHudLayoutV1(first,profile,'skill-slot-5',{dx:1,dy:2,scale:100});
 assert.equal(offset.profiles[profile]['skill-slot-5'].dx,1);
 const second=editCaptureHudGroupV1(offset,'desktop-2v2',null,{label:'Défense',roles:['dodge'],foldable:false});
 assert.deepEqual(resetCaptureHudProfileV1(second,'desktop-2v2'),offset);
 assert.deepEqual(editCaptureHudGroupV1(first,profile,'hud-group-1',null),empty);
});
test('foldable and overflow views use all and only supplied native slots, without modifying progression',()=>{
 const slots=['skill-slot-1','skill-slot-2','skill-slot-3','skill-slot-4','skill-slot-ultimate'];
 assert.deepEqual(captureHudSkillPagesV1(slots),[]);
 const future=[...slots,'skill-slot-5','skill-slot-6','skill-slot-7'];
 const group={id:'hud-group-1',label:'Attaques',roles:['skill-slot-1','skill-slot-5','skill-slot-6','skill-slot-7','skill-slot-8'],foldable:true};
 const pages=captureHudSkillPagesV1(future,[group]);
 assert.equal(pages.filter(p=>p.groupId===group.id).length,2);
 assert.ok(pages.every(p=>p.roles.length<=3));
 assert.deepEqual(pages.flatMap(p=>p.roles).sort(),future.slice().sort());
 assert.equal(pages.flatMap(p=>p.roles).includes('skill-slot-8'),false);
 assert.deepEqual(captureHudSkillPagesV1(future).flatMap(p=>p.roles),future);
});
test('group gesture moves all roles as one in screen space and preserves relative scale bounds',()=>{
 const members=[{role:'dodge',value:{dx:2,dy:0,scale:100},parentScale:1},
  {role:'skill-slot-1',value:{dx:0,dy:0,scale:110},parentScale:1.25}];
 const args={members,width:800,height:450,elementWidth:160,deltaX:80,deltaY:-45};
 const moved=captureHudGroupPointerValuesV1({...args,mode:'move'});
 assert.deepEqual(moved.map(x=>x.value),[{dx:12,dy:-10,scale:100},{dx:8,dy:-8,scale:110}]);
 const scaled=captureHudGroupPointerValuesV1({...args,mode:'resize',deltaX:160});
 assert.equal(scaled[1].value.scale,125);assert.equal(scaled[0].value.scale,114);
});

// The legacy numeric editor must not be a second authoring surface.
import {readFile} from 'node:fs/promises';
test('only the visual HUD author remains reachable',async()=>{
 const html=await readFile(new URL('../../examples/dom-demo/capture-editor-v2.html',import.meta.url),'utf8');
 const source=await readFile(new URL('../../src/ui/capture-editor-human-v2.js',import.meta.url),'utf8');
 assert.match(html,/data-hud-layout-preview/);
 assert.doesNotMatch(html,/data-hud-layout-(?:profile|role|x|y|scale|reset-role|reset-profile)\b/);
 assert.doesNotMatch(source,/mountCaptureHudLayoutEditorV1|hudLayoutEditor/);
});

import {captureHudBoxFromRectsV1,captureHudBoxGestureV1} from '../../src/contracts/capture-hud-layout-v1.js';
test('real region dimensions are independent, bounded, and replace legacy transforms',()=>{
 const profile='touch-1v1';
 const before=updateCaptureHudLayoutV1(undefined,profile,'command-dock',{dx:1,dy:0,scale:110});
 const box=captureHudBoxFromRectsV1({left:400,top:260,width:200,height:100},{left:0,top:0,width:800,height:400});
 assert.deepEqual(box,{x:500,y:650,w:250,h:250});
 const args={box,width:800,height:400,deltaX:-80,deltaY:-40};
 assert.deepEqual(captureHudBoxGestureV1({...args,edge:'w'}),{x:400,y:650,w:350,h:250});
 assert.deepEqual(captureHudBoxGestureV1({...args,edge:'n'}),{x:500,y:550,w:250,h:350});
 const grown=captureHudBoxGestureV1({...args,edge:'nw'});
 assert.deepEqual(grown,{x:400,y:550,w:350,h:350});
 const after=updateCaptureHudLayoutV1(before,profile,'command-dock',{box:grown});
 assert.deepEqual(after.profiles[profile]['command-dock'],{box:grown});
 assert.deepEqual(normalizeCaptureHudLayoutV1(JSON.parse(JSON.stringify(after))),after);
 assert.throws(()=>updateCaptureHudLayoutV1(after,profile,'command-dock',{box:grown,scale:110}));
 assert.deepEqual(captureHudBoxGestureV1({...args,edge:'move',deltaX:999,deltaY:999}),{x:750,y:750,w:250,h:250});
});

test('authored grid capacity replaces fixed pagination without creating gameplay actions',()=>{
 const profile='desktop-1v1',box={x:500,y:600,w:490,h:390},grid={columns:4,slots:8};
 const layout=updateCaptureHudLayoutV1(undefined,profile,'command-dock',{box,grid});
 assert.deepEqual(normalizeCaptureHudLayoutV1(JSON.parse(JSON.stringify(layout))),layout);
 const skills=['skill-slot-1','skill-slot-2','skill-slot-3','skill-slot-4','skill-slot-ultimate'];
 assert.deepEqual(captureHudSkillPagesV1(skills,[],grid),[]);
 const group={id:'hud-group-1',label:'Attaques',roles:skills.slice(0,4),foldable:true};
 assert.equal(captureHudSkillPagesV1(skills,[group],grid).length,2);
 assert.deepEqual(captureHudSkillPagesV1(skills,[group],grid).flatMap(p=>p.roles).sort(),skills.slice().sort());
 assert.throws(()=>updateCaptureHudLayoutV1(layout,profile,'command-dock',{box,grid:{columns:0,slots:8}}));
});
