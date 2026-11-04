#!/usr/bin/env python3
"""Strict import of the REAL artist-approved Heriplante opponent attack archive."""
from __future__ import annotations
import hashlib,json,stat,zipfile
from pathlib import Path,PurePosixPath
from io import BytesIO
from PIL import Image,ImageChops

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/library/capture/creatures/heriplante'
SOURCE=BASE/'heriplante_attaque_adversaire_face_12f.zip'
PREFIX='heriplante_attaque_adversaire_face_12f/'
SOURCE_HASH='4c75a378213bee7168ab9cc6d3104508c863ddb5127353b916faff42781c4402'
GIT_BLOB='da8a87a84c8f17a129cb64e9e101a7fb453ed408'
ID='pack:capture:creature-heriplante-attack-opponent-12-v1'
OUT=BASE/'animations/attack/opponent'
CATALOG=ROOT/'data/assets/catalog/global-visual-assets.v1.json'
PREFIX_FRAME='heriplante_attack_opponent'
def digest(data):return hashlib.sha256(data).hexdigest()
def load(data,kind,size,frames=1):
    with Image.open(BytesIO(data)) as image:
        if image.format!=kind or image.size!=size or image.n_frames!=frames:
            raise ValueError('Unexpected source image type '+str((image.format,image.size,image.n_frames)))
        return image.convert('RGBA')
def main():
    data=SOURCE.read_bytes()
    if digest(data)!=SOURCE_HASH:raise ValueError('Unapproved attack ZIP SHA256')
    if hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()!=GIT_BLOB:
        raise ValueError('Wrong uploaded Git blob')
    if OUT.exists():raise ValueError('Refuse unreviewed overwrite')
    catalog=json.loads(CATALOG.read_text(encoding='utf8'))
    if catalog['storage']['branch']!='global-assets' or len(catalog['assets'])!=catalog['counts']['assets']:
        raise ValueError('Not official single-authority catalog')
    ids=[a['id'] for a in catalog['assets']]
    if len(set(ids))!=len(ids) or ID in ids:raise ValueError('Duplicate catalog ID')
    for stable in ['pack:capture:creature-heriplante-opponent-01',
                   'pack:capture:creature-heriplante-attack-player-12-v1',
                   'pack:capture:creature-heriplante-movement-player-12-v1']:
        if stable not in ids:raise ValueError('Existing Heriplante master/player media missing')
    outputs={}
    with zipfile.ZipFile(BytesIO(data)) as zipdata:
        infos=zipdata.infolist()
        if zipdata.testzip() or len(infos)!=22 or len(set(i.filename for i in infos))!=22:
            raise ValueError('Source ZIP unexpected members or CRC')
        if sum(i.file_size for i in infos)>90000000:raise ValueError('Unsafe ZIP size')
        for info in infos:
            path=PurePosixPath(info.filename)
            if info.is_dir() or '..' in path.parts or info.filename.startswith('/') or stat.S_ISLNK((info.external_attr>>16)&0xffff):
                raise ValueError('Unsafe ZIP path '+info.filename)
        author=json.loads(zipdata.read(PREFIX+'manifest.json'))
        expected={'schema':'gensrpg-artistic-animation-bundle-v1','creatureSlug':'heriplante',
          'action':'attack','view':'opponent_face','frameCount':12,'frameSize':[512,512],
          'frameDurationMs':130,'playbackMode':'once','orientation':'left',
          'frame01MasterExactRGBA':True,'minimumMeasuredMargin':18,'margins42ContractSatisfied':False}
        for k,v in expected.items():
            if author.get(k)!=v:raise ValueError('Author source differs: '+k)
        hashes={row['path']:row['sha256'] for row in author['files']}
        frames=[];images=[]
        for i in range(1,13):
            filename=f'frames/{PREFIX_FRAME}_{i:02d}.png'
            source=zipdata.read(PREFIX+filename)
            if digest(source)!=hashes[filename]:raise ValueError('PNG differs from approved source '+filename)
            image=load(source,'PNG',(512,512))
            bbox=image.getchannel('A').point(lambda a:255 if a>=8 else 0).getbbox()
            if not bbox:raise ValueError('Empty frame')
            margin=[bbox[0],bbox[1],512-bbox[2],512-bbox[3]]
            if min(margin)<18:raise ValueError('Unexpected frame crop')
            if any(image.getpixel(c)[3]!=0 for c in [(0,0),(511,0),(0,511),(511,511)]):
                raise ValueError('Opaque frame corner')
            frames.append({'index':i-1,'file':filename,'sha256':digest(source),'marginsLTRB':margin})
            images.append(image)
            outputs[OUT/filename]=source
        if len({f['sha256'] for f in frames})!=12:raise ValueError('Duplicated artist frames')
        master=zipdata.read(PREFIX+'reference/heriplante_adversaire_face_master.png')
        if master!=zipdata.read(PREFIX+'frames/'+PREFIX_FRAME+'_01.png') or master!=(BASE/'runtime/heriplante_adversaire_face.png').read_bytes():
            raise ValueError('Frame 1 must be exact official adversary model')
        atlas_path='atlases/heriplante_attack_opponent_12f_strip.webp'
        atlas_bytes=zipdata.read(PREFIX+atlas_path)
        if digest(atlas_bytes)!=hashes[atlas_path]:raise ValueError('Approved atlas SHA mismatch')
        atlas=load(atlas_bytes,'WEBP',(6144,512))
        for idx,frame in enumerate(images):
            if ImageChops.difference(frame,atlas.crop((idx*512,0,(idx+1)*512,512))).getbbox():
                raise ValueError('Atlas differs from approved PNG '+str(idx))
        outputs[OUT/atlas_path]=atlas_bytes
        previews={}
        for field,file in [('animatedWebp','previews/heriplante_adversaire_attaque_preview_12f.webp'),
                           ('gif','previews/heriplante_adversaire_attaque_preview_12f.gif'),
                           ('contactSheet','previews/heriplante_adversaire_attaque_planche_preview_12f.jpg')]:
            value=zipdata.read(PREFIX+file)
            if digest(value)!=hashes[file]:raise ValueError('Approved preview changed')
            if field=='animatedWebp':load(value,'WEBP',(512,512),12)
            outputs[OUT/file]=value
            previews[field]=file
        manifest={'schema':'capture-creature-animation-v1','assetId':ID,
          'creatureId':'heriplante','action':'attack','view':'opponent','orientation':'left',
          'frameCount':12,'frameSize':[512,512],'frameMs':130,'frameDurationsMs':[130]*12,
          'playbackMode':'once','returnToIdle':True,'holdLastFrame':False,'frames':frames,
          'measuredMinMarginPx':18,'requiredMarginPx':42,'meetsStrictMarginRule':False,
          'frame01MasterIdentical':True,
          'atlas':{'file':atlas_path,'format':'sprite-strip','frameCount':12,
                   'frameWidth':512,'frameHeight':512,'sha256':digest(atlas_bytes),'lossless':True},
          'previews':previews,'sourceArchive':SOURCE.name,'sourceArchiveSha256':SOURCE_HASH,
          'sourceGitBlob':GIT_BLOB,
          'notes':'Approved attack, unchanged. Original master has 18px margin < strict 42px; media not certified for strict margin. Independent opponent view. Course opponent ZIP not yet found.'}
        outputs[OUT/'attack.manifest.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
    for path,value in outputs.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(value)
    catalog['assets'].append({'id':ID,
      'label':'Hériplante — attaque des lianes adversaire / face (12 frames)',
      'assetType':'sprite','mediaType':'image','category':'creature',
      'tags':['capture','creature','heriplante','nature','attack','animated','opponent','face'],
      'source':{'scope':'pack','packId':'capture','author':'GenSrpG / approuvé 2026-11-04','license':'project-internal'},
      'resource':{'file':'capture/creatures/heriplante/animations/attack/opponent/'+atlas_path,
                  'format':'sprite-strip','mime':'image/webp','frameCount':12,'frameMs':130,'playbackMode':'once'},
      'compatibility':{'uses':['combat','capture','editor']}})
    for kind in ('assets','sprites','creatures'):catalog['counts'][kind]+=1
    CATALOG.write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    print('PASS approved Heriplante opponent ATTACK: 12 original PNG, master identical, WebP 6144x512, previews, canonical catalog')
    print('WARN 18px master margin below required 42px, no fake strict media GREEN')
    print('PENDING opponent COURSE: no source ZIP found on GitHub global-assets')
if __name__=='__main__':main()
