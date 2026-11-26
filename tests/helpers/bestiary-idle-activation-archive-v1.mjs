// Test-only evidence of the exact pre-activation Showcase blobs at
// Combat main dcb464e5bd0f24e1eeeafcc8995822f601e5fd10.
// No second runtime authority or replacement of immutable author archives.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";

const baseline=new Map([
  ["Veldra_crea",[10,"9158915da27fa98e73c59a930e363340b79a2546",true]],
  ["Vipfer",[2,"d985e28edebfd17b26cba9f2a78e440d0cafe0f9",true]],
  ["crea-loup",[9,"6441a4209b14ad632ef3259f354634c1f707577e",true]],
  ["crea_ailevent",[2,"e0753591dbc7f31b6acb03b87cc50870497490c9",true]],
  ["crea_crys_2",[3,"ef32fb68748e5f970ee001b51d681cc7b3b3f7ac",true]],
  ["crea_dracendre",[11,"950b2f504eb5da0c6438a2b14e939355d01ff150",true]],
  ["crea_foudrillon",[10,"1e54114a18e3ad6d75f6a067e7acdd56e4b46f9a",false]],
  ["crea_lumilo",[2,"589170aeb1cef2872ccef23f38fdb270411f219e",false]],
  ["crea_maraileron",[9,"973fcc17755a5d0253e90dc635fc018cad40b83d",true]],
  ["crea_mer_3",[9,"8e9023fdc60c2232dded9e5add2918cc749a8d28",true]],
  ["crea_mossback",[9,"a35cce3f09d9b3353d56e3d1ccf51e97ede8e7f4",true]],
  ["crea_nat_1",[3,"0558908b7fe3ab875946af24d2ce86f009421fcf",true]],
  ["crea_ombre_2",[9,"300abe916e206311c96e4dc300e7d39e31f743e9",true]],
  ["crea_scar_2",[8,"e7fce7c604f990438ec1202cea1968e2b654e614",true]],
  ["crea_selachombre",[9,"f6c3e0d2085f8ac09d759a82cb851fc5e50fd989",true]],
  ["crea_sylvorne",[9,"f5f87f3abfaf54b54d110367160258ec48cc7982",true]],
  ["crea_tox_2",[9,"7f958d78281041ee8899a4cc106e98bac4b0ffbc",true]],
  ["crea_voltik",[2,"fa2a95df566e30338824879a2fce03487c6426f8",true]],
  ["crea_vyrame",[9,"4a531770df97e969fd47cf40cc4a1f4dfa3bc7c8",true]],
  ["gorice",[9,"cba678896aa490ed2b2d9e0c5d12a84bf8129b50",false]],
  ["kitsune_lunaire",[9,"23bb0b264b2461e3c9ee138ce9aad0fc0d627018",true]],
  ["polocendre",[9,"e0fcc434e68f619e28ab926d699be7f536489e7a",true]],
  ["raiiven",[9,"dc82ec79af48ef4b71b164d450bb8af1765d155e",true]],
  ["veuve-jaune",[10,"b037706f9dc1dc5eab67ecf14249802e5b653395",true]]
]);

export function beforeBestiaryIdleActivationBytesV1(raw) {
  const bytes=Buffer.from(raw);
  const record=JSON.parse(bytes.toString("utf8"));
  const prior=baseline.get(record?.draft?.id);
  if(!prior || record.schema!=="capture-creature-transfer-v1") return bytes;
  const [version,sha,newline]=prior;
  const p=record.draft.presentation;
  assert.equal(p.version,11);
  const idle=p.visual.idle;
  assert.equal(idle.mode,"both");
  assert.equal(idle.front.displayScale,1.2);
  assert.equal(idle.back.displayScale,1.2);
  assert.equal(idle.frontAssetId,p.visual.front.assetId.replace(/-opponent-(01|v1)$/,"-idle-opponent-gif-v1"));
  assert.equal(idle.backAssetId,p.visual.back.assetId.replace(/-player-(01|v1)$/,"-idle-player-gif-v1"));
  for(const view of ["front","back"]) {
    assert.deepEqual(idle[view],{displayScale:1.2,offsetX:0,offsetY:0,frameSpeedMultiplier:1});
  }
  p.version=version;
  if(record.draft.id==="crea_dracendre") {
    p.visual.idle={...idle,mode:"gif",front:{...idle.front,displayScale:1},back:{...idle.back,displayScale:1}};
  } else {
    delete p.visual.idle;
  }
  const restored=Buffer.from(JSON.stringify(record,null,2)+(newline?"\n":""),"utf8");
  const gitBlob=createHash("sha1").update("blob "+restored.length+"\0").update(restored).digest("hex");
  assert.equal(gitBlob,sha,record.draft.id+" changed outside the authorized idle migration");
  return restored;
}

export function beforeBestiaryIdleActivationV1(record) {
  return JSON.parse(beforeBestiaryIdleActivationBytesV1(JSON.stringify(record)).toString("utf8"));
}
