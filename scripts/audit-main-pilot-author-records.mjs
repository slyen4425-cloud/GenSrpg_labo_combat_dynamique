#!/usr/bin/env node
// Non-mutating audit of historical assertions versus current author exports.
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(p,"utf8"));
const cases=[
["kitsune_lunaire","data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json","data/capture/source-exports/gensrpg-capture-creature-kitsune_lunaire-2026-10-22-r2.json"],
["crea_tox_2","data/capture/showcase/crea_tox_2.capture-creature-transfer-v1.json","data/capture/source-exports/crea_tox_2.author-export-2026-10-23.json"]
];
const report={audit:"author-record-regression",date:"2026-10-27",records:[]};
for(const [id,current,archive] of cases){
 const a=read(current),b=read(archive);
 report.records.push({id,current,archive,activePresentationVersion:a.draft.presentation.version,archivedPresentationVersion:b.draft.presentation.version,activeAnimations:Object.keys(a.draft.presentation.visual??{}).filter(x=>/anim|movement|attack/i.test(x)),archiveAnimations:Object.keys(b.draft.presentation.visual??{}).filter(x=>/anim|movement|attack/i.test(x)),sameRecord:JSON.stringify(a)===JSON.stringify(b)});
}
mkdirSync("artifacts",{recursive:true});
writeFileSync("artifacts/main-pilot-author-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
