import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {inspectSpritePng} from "../../scripts/validate-sprite-safe-margins.mjs";
const pad=i=>String(i).padStart(2,"0");
test("audit 20 buried-emergence source PNGs: 42px safe margin on every edge",()=>{
 const marginFailures=[];
 for(let i=1;i<=20;i++){
   const file=new URL("../../assets/library/capture/sprites/skills/burrow_terrain/impact/frames/sprite_burrow_impact_"+pad(i)+".png",import.meta.url);
   const bytes=readFileSync(file);
   try{const result=inspectSpritePng(bytes,{size:512,margin:42});
       console.log("impact-frame-"+pad(i),JSON.stringify(result));
   }catch(err){marginFailures.push({frame:i,error:err.message});
       console.log("impact-frame-"+pad(i),"ALPHA-EDGE-DEFECT",err.message);}
 }
 assert.deepEqual(marginFailures,[],"Source sprite top/border artifacts must be corrected in the real frame and regenerated into WebP atlas");
});
