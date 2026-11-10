// Read-only ZIP inventory: inspect the author's archive on the CI runner without
// extracting, rewriting or altering a single source pixel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const zip=await readFile(new URL('../../gensrpg_serpent_arbre_icones_modeles.zip',import.meta.url));
function entries(buffer){
 let tail=-1;
 for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--){
  if(buffer.readUInt32LE(i)===0x06054b50){tail=i;break;}
 }
 if(tail<0)throw new Error('ZIP End of Central Directory missing');
 const count=buffer.readUInt16LE(tail+10),start=buffer.readUInt32LE(tail+16);
 let offset=start;const result=[];
 for(let i=0;i<count;i++){
  assert.equal(buffer.readUInt32LE(offset),0x02014b50,'central file header signature');
  const length=buffer.readUInt16LE(offset+28);
  const extra=buffer.readUInt16LE(offset+30);
  const comment=buffer.readUInt16LE(offset+32);
  const filename=buffer.subarray(offset+46,offset+46+length).toString('utf8');
  assert.ok(!filename.startsWith('/')&&!filename.includes('../'),'archive may not escape its directory');
  result.push({name:filename,size:buffer.readUInt32LE(offset+24)});
  offset+=46+length+extra+comment;
 }
 return result;
}
test('the original snake/tree author archive is valid and its actual file inventory is inspectable',()=>{
 assert.ok(zip.length>100000,'original author archive should not be truncated');
 const files=entries(zip);assert.ok(files.length>0,'the original archive must have entries');
 console.log('SYLVORNE_AUTHOR_ZIP_ENTRIES',JSON.stringify(files));
});
