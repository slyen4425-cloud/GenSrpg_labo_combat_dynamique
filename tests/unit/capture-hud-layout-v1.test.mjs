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
