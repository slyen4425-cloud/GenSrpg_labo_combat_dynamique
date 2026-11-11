// Read-only ZIP inventory: inspect the author's archive on the CI runner without
// extracting, rewriting or altering a single source pixel.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateRawSync} from 'node:zlib';
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
  result.push({name:filename,size:buffer.readUInt32LE(offset+24),compressedSize:buffer.readUInt32LE(offset+20),method:buffer.readUInt16LE(offset+10),localOffset:buffer.readUInt32LE(offset+42)});
  offset+=46+length+extra+comment;
 }
 return result;
}
test('the original snake/tree author archive is valid and its actual file inventory is inspectable',()=>{
 assert.ok(zip.length>100000,'original author archive should not be truncated');
 const files=entries(zip);assert.ok(files.length>0,'the original archive must have entries');
 console.log('SYLVORNE_AUTHOR_ZIP_ENTRIES',JSON.stringify(files));
});

function uncompressed(entry){
 const start=entry.localOffset;
 assert.equal(zip.readUInt32LE(start),0x04034b50,'local file signature');
 const payload=start+30+zip.readUInt16LE(start+26)+zip.readUInt16LE(start+28);
 const bytes=zip.subarray(payload,payload+entry.compressedSize);
 const result=entry.method===8?inflateRawSync(bytes):entry.method===0?bytes:null;
 assert.ok(result,'ZIP compression must be stored or deflated');
 assert.equal(result.length,entry.size,'ZIP file expanded size mismatch');
 return result;
}
test('author manifest and actual original tree PNG dimensions are inspected without altering pixels',()=>{
 const files=entries(zip);
 const manifest=files.find(x=>x.name==='manifest.json');
 assert.ok(manifest);
 console.log('SYLVORNE_AUTHOR_ZIP_MANIFEST',uncompressed(manifest).toString('utf8'));
 for(const entry of files.filter(x=>/\.png$/i.test(x.name))){
   const png=uncompressed(entry);
   assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','actual PNG signature');
   console.log('SYLVORNE_AUTHOR_PNG',JSON.stringify({name:entry.name,width:png.readUInt32BE(16),height:png.readUInt32BE(20),colorType:png[25],bytes:png.length}));
 }
});
