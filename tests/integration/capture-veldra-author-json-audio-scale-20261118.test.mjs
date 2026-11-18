import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {normalizeCaptureSkillTransferV1} from "../../src/contracts/capture-skill-transfer-v1.js";
import {createCaptureSkillPresentationAssetsV2} from "../../src/adapters/renderer/capture-skill-presentation-assets-v2.js";

const repoUrl=path=>new URL("../../"+path,import.meta.url);
const readJson=path=>JSON.parse(readFileSync(repoUrl(path),"utf8"));
const ids=[
  "veldra-plume-solaire","veldra-percee-aurore","veldra-egide-zenith",
  "veldra-rayon-cardinal","veldra-releve-celeste"
];
const skills=Object.fromEntries(ids.map(id=>[id,normalizeCaptureSkillTransferV1(
  readJson("data/capture/showcase/"+id+".capture-skill-transfer-v1.json")
).draft]));
const runtime=readJson("data/presentation/audio/private-audio-runtime.v1.json");
const available=new Map(runtime.entries.map(x=>[x.assetId,x]));
const sound=(id,role)=>skills[id].presentation.audio[role];
const visual=(id,slot)=>skills[id].presentation.visual[slot];

test("Author's uploaded Veldra Plume and Égide scale, offset, opacity and timings survive native V9 presentation",()=>{
  assert.equal(skills["veldra-plume-solaire"].definition.travelMs,700);
  assert.equal(skills["veldra-plume-solaire"].definition.recoveryMs,0);
  assert.equal(skills["veldra-plume-solaire"].presentation.version,9);
  assert.equal(visual("veldra-plume-solaire","travel").displayScale,1.5);
  assert.equal(visual("veldra-plume-solaire","travel").anchor,"mouth");
  assert.equal(skills["veldra-egide-zenith"].presentation.version,9);
  assert.equal(visual("veldra-egide-zenith","cast").displayScale,2);
  assert.equal(visual("veldra-egide-zenith","cast").offsetY,30);
  assert.equal(visual("veldra-egide-zenith","cast").opacity,0.5);
  assert.equal(visual("veldra-egide-zenith","cast").offsetMode,"same");
  assert.deepEqual(visual("veldra-egide-zenith","cast").layerByView,{player:"front",opponent:"front"});
  assert.equal(skills["veldra-egide-zenith"].definition.effects[0].amount,25);
  assert.equal(skills["veldra-egide-zenith"].definition.effects[1].status.deltaPoints,200);
  assert.equal(skills["veldra-egide-zenith"].definition.effects[2].slowOnly,true);
});

test("Both user-supplied sound IDs and the authored travel looping rule are preserved",()=>{
  assert.deepEqual(sound("veldra-egide-zenith","cast"),{
    assetId:"gensrpg:sound:genrpg-pack2-34855cd9",volume:1,loop:false
  });
  assert.deepEqual(sound("veldra-plume-solaire","travel"),{
    assetId:"gensrpg:sound:genrpg-pack2-9291c6e4",volume:1,loop:true
  });
});

test("Veldra's five skill bindings have audible runtime assets and legible effect scales",()=>{
  for(const id of ids){
    const s=skills[id];
    assert.equal(s.definition.id,id);
    assert.ok(s.presentation.visual.icon?.assetId,"missing icon "+id);
    const sounds=Object.entries(s.presentation.audio);
    assert.ok(sounds.length>0,"silent Veldra ability: "+id);
    for(const [role,entry] of sounds){
      const item=available.get(entry.assetId);
      assert.ok(item,"unknown runtime audio: "+id+" "+role+" "+entry.assetId);
      assert.ok(existsSync(repoUrl("assets/runtime/audio/"+item.runtimeFile)),
        "missing real audio file "+id+" "+entry.assetId);
      assert.ok(["cast","release","travel","impact","aura"].includes(role),id);
      assert.ok(Number(entry.volume)>0 && Number(entry.volume)<=1,id);
    }
  }
  assert.ok(visual("veldra-percee-aurore","impact").displayScale>1);
  assert.ok(visual("veldra-rayon-cardinal","impact").displayScale>1);
  assert.ok(visual("veldra-releve-celeste","cast").displayScale>1);
});

test("Official presentation adapter resolves the exact five skill visuals and sounds from a single catalog",()=>{
  const presentations=Object.fromEntries(ids.map(id=>[id,skills[id].presentation]));
  const factory=createCaptureSkillPresentationAssetsV2({
    skillPresentations:presentations,
    assetForId:assetId=>({assetId,url:"https://assets.invalid/"+encodeURIComponent(assetId)+".webp",frameCount:16,frameMs:90}),
    audioAssetForId:assetId=>available.has(assetId)?{assetId,url:"https://assets.invalid/"+available.get(assetId).runtimeFile}:null
  });
  for(const id of ids){
    const live=factory.presentationForSkill(id,{sourceView:"player",targetView:"opponent"});
    const authored=skills[id].presentation;
    for(const role of ["cast","travel","impact","aura"]){
      if(authored.audio?.[role]) assert.equal(live[role+"Sound"]?.assetId,authored.audio[role].assetId);
    }
    assert.ok(live.icon?.url);
  }
});
