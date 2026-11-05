#!/usr/bin/env python3
"""Read and import exactly the artist-approved Hériplante opponent-run ZIP; no other media."""
from __future__ import annotations
from pathlib import Path, PurePosixPath
from io import BytesIO
from zipfile import ZipFile
from hashlib import sha1,sha256
from PIL import Image
import json,stat

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/library/capture/creatures/heriplante'
SOURCE=BASE/'HERIPLANTE_COURSE_ADVERSAIRE_12F_READY.zip'
HASH='923a39bba4e72e89d297c0519fdcaf4d60598f663774e97cbde8fac8db3c1748'
GIT_BLOB='0de205c471e5b9661455fe052200513d992546ed'
MASTER_GIT_BLOB='3ab934a02586c9a15fdf713f4666594bcd6eb6ff'
PREFIX='HERIPLANTE_COURSE_ADVERSAIRE_12F/'
DEST=BASE/'animations/movement/opponent'
CATALOG=ROOT/'data/assets/catalog/global-visual-assets.v1.json'
ID='pack:capture:creature-heriplante-movement-opponent-12-v1'
def digest(b):return sha256(b).hexdigest()
def git_sha(b):return sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
def image(b,fmt,size):
    with Image.open(BytesIO(b)) as i:
        if (i.format,i.size,i.n_frames)!=(fmt,size,1):raise ValueError('Wrong image format/size/frame count')
        return i.convert('RGBA')
def visible_equivalent(a,b):
    if a.size!=b.size:return False
    pa=a.tobytes();pb=b.tobytes()
    for k in range(0,len(pa),4):
        if pa[k+3]!=pb[k+3]:return False
        if pa[k+3] and pa[k:k+3]!=pb[k:k+3]:return False
    return True
def normalize_hidden_rgb(img):
    # RGBA of alpha=0 is invisible; clear RGB only where alpha=0.
    out=img.copy()
    pixels=bytearray(out.tobytes())
    for k in range(0,len(pixels),4):
        if pixels[k+3]==0:pixels[k:k+3]=b'\0\0\0'
    return Image.frombytes('RGBA',out.size,bytes(pixels))
def png(img):
    dest=BytesIO();img.save(dest,format='PNG',optimize=True)
    return dest.getvalue()
def run():
    b=SOURCE.read_bytes()
    if digest(b)!=HASH or git_sha(b)!=GIT_BLOB:raise ValueError('Source archive differs from approved deposit')
    if DEST.exists():raise ValueError('Destination exists: refuse to overwrite')
    catalog=json.loads(CATALOG.read_text('utf8'))
    if catalog['storage']['branch']!='global-assets' or catalog['counts']['assets']!=len(catalog['assets']):
        raise ValueError('Wrong canonical catalog')
    ids=[i['id'] for i in catalog['assets']]
    for candidate in [ID,'pack:capture:creature-heriplante-player-01','pack:capture:creature-heriplante-opponent-01',
       'pack:capture:creature-heriplante-attack-player-12-v1',
       'pack:capture:creature-heriplante-attack-opponent-12-v1',
       'pack:capture:creature-heriplante-movement-player-12-v1']:
        if (candidate in ids)!=(candidate!=ID):raise ValueError('Missing peer asset or duplicate opponent movement: '+candidate)
    if len(set(ids))!=len(ids):raise ValueError('Duplicate existing IDs')
    master=(BASE/'runtime/heriplante_adversaire_face.png').read_bytes()
    if git_sha(master)!=MASTER_GIT_BLOB:raise ValueError('Unexpected official face master')
    with ZipFile(BytesIO(b)) as z:
        if z.testzip() is not None:raise ValueError('Bad archive CRC')
        infos=z.infolist()
        if len(infos)!=20 or len(set(i.filename for i in infos))!=len(infos) or sum(i.file_size for i in infos)>60_000_000:
            raise ValueError('Unexpected ZIP contents/size')
        for i in infos:
            path=PurePosixPath(i.filename)
            if i.is_dir() or '..' in path.parts or i.filename.startswith('/') or stat.S_ISLNK((i.external_attr>>16)&0xffff):
                raise ValueError('Unsafe ZIP member '+i.filename)
        author=json.loads(z.read(PREFIX+'movement.manifest.json'))
        expected={'schema':'capture-creature-animation-v1','creatureId':'heriplante','action':'movement',
          'variant':'run','view':'opponent','orientation':'left','frameCount':12,'frameSize':[512,512],
          'frameMs':115,'playbackMode':'loop','frame01MasterIdentical':True,
          'measuredMinMarginPx':18,'requiredMarginPx':42,'meets42PxMarginRule':False}
        for k,v in expected.items():
            if author.get(k)!=v:raise ValueError('Different user-approved metadata: '+k)
        if z.read(PREFIX+author['masterImage'])!=master:raise ValueError('Master does not equal official file')
        atlas_bytes=z.read(PREFIX+author['atlas']['file'])
        if digest(atlas_bytes)!=author['atlas']['sha256']:raise ValueError('Altered authored WebP atlas')
        atlas=image(atlas_bytes,'WEBP',(6144,512))
        frames=[];outputs={};images=[]
        if len(author['frames'])!=12:raise ValueError('Incorrect author frame count')
        for n,rec in enumerate(author['frames']):
            path=f'frames/heriplante_course_adversaire_{n+1:02d}.png'
            if rec['index']!=n or rec['file']!=path:raise ValueError('Frame order mismatch')
            dat=z.read(PREFIX+path)
            if digest(dat)!=rec['sha256']:raise ValueError('Changed source PNG: '+path)
            original=image(dat,'PNG',(512,512))
            expected_tile=atlas.crop((n*512,0,(n+1)*512,512))
            if not visible_equivalent(original,expected_tile):
                raise ValueError('Approved atlas does not match PNG alpha + visible colors '+path)
            if n==0:
                if not visible_equivalent(original,image(master,'PNG',(512,512))):
                    raise ValueError('First frame visible pixels differ from official face master')
                output_bytes=master  # makes frame 01 literally identical in decoded RGBA and source PNG
                output_img=image(master,'PNG',(512,512))
            else:
                output_img=normalize_hidden_rgb(original)
                output_bytes=png(output_img)
            alpha=output_img.getchannel('A')
            box=alpha.point(lambda p:255 if p>=8 else 0).getbbox()
            if box is None:raise ValueError('Empty frame')
            margins=[box[0],box[1],512-box[2],512-box[3]]
            if rec['marginsLTRB']!=margins or min(margins)<18:
                raise ValueError('Source margins changed or frame clipped: '+path)
            if any(output_img.getpixel(pos)[3]>0 for pos in [(0,0),(511,0),(0,511),(511,511)]):
                raise ValueError('Opaque corner')
            if not visible_equivalent(original,output_img):
                raise ValueError('Unintended visual pixel edit')
            frames.append({'index':n,'file':path,'sha256':digest(output_bytes),
                           'approvedSourceSha256':digest(dat),'marginsLTRB':margins})
            outputs[DEST/path]=output_bytes
            images.append(output_img)
        assert len({i['approvedSourceSha256'] for i in frames})==12,'Duplicated source frames'
        strip=Image.new('RGBA',(6144,512))
        for n,i in enumerate(images):strip.paste(i,(n*512,0))
        rebuilt=BytesIO();strip.save(rebuilt,format='WEBP',lossless=True,method=6)
        media=rebuilt.getvalue()
        rebuilt_image=image(media,'WEBP',(6144,512))
        for n,i in enumerate(images):
            tile=rebuilt_image.crop((n*512,0,(n+1)*512,512))
            if not visible_equivalent(i,tile):raise ValueError('Export atlas changed visible pixels or alpha')
        atlas_path='atlases/heriplante_movement_opponent_12f.webp'
        outputs[DEST/atlas_path]=media
        previews={}
        for label,source_path in [('animatedWebp','previews/heriplante_adversaire_course_preview_12f.webp'),
            ('gif','previews/heriplante_adversaire_course_preview_12f.gif'),
            ('contactSheet','previews/heriplante_adversaire_course_contact_12f.jpg')]:
            dat=z.read(PREFIX+source_path)
            outputs[DEST/source_path]=dat
            previews[label]=source_path
        outputs[DEST/'sources/heriplante_course_adversaire_approved_original_atlas.webp']=atlas_bytes
        manifest={'schema':'capture-creature-animation-v1','assetId':ID,'creatureId':'heriplante',
          'action':'movement','view':'opponent','variant':'run','orientation':'left','frameCount':12,
          'frameSize':[512,512],'frameMs':115,'frameDurationsMs':[115]*12,'playbackMode':'loop',
          'frames':frames,'atlas':{'file':atlas_path,'format':'sprite-strip','frameCount':12,
          'frameWidth':512,'frameHeight':512,'sha256':digest(media),'lossless':True},
          'previews':previews,'sourceArchive':SOURCE.name,'sourceArchiveSha256':HASH,'sourceGitBlob':GIT_BLOB,
          'sourceMasterFrame01Identical':True,'measuredMinMarginPx':18,'requiredMarginPx':42,
          'meetsStrictMarginRule':False,
          'notes':'Artist-approved 12 poses are preserved visually. Original frame 01 had only invisible RGB difference from master; exported frame01 uses exact official PNG, and other PNG/atlas preserve alpha and visible RGB. Original margin 18px violates strict 42px rule; no false strict GREEN.'}
        outputs[DEST/'movement.manifest.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
    for path,dat in outputs.items():
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_bytes(dat)
    catalog['assets'].append({
       'id':ID,'label':'Hériplante — course adversaire / face (12 frames)',
       'assetType':'sprite','mediaType':'image','category':'creature',
       'tags':['capture','creature','heriplante','nature','movement','animated','opponent','face','run'],
       'source':{'scope':'pack','packId':'capture','author':'GenSrpG / approuvé 2026-11-04','license':'project-internal'},
       'resource':{'file':'capture/creatures/heriplante/animations/movement/opponent/'+atlas_path,
         'format':'sprite-strip','mime':'image/webp','frameCount':12,'frameMs':115,'playbackMode':'loop'},
       'compatibility':{'uses':['combat','capture','editor']}
    })
    for k in ('assets','sprites','creatures'):catalog['counts'][k]+=1
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('PASS: source Git blob verified; 12 artist-approved frames + master exact; atlas 6144x512; catalog +1; no existing asset changed',flush=True)
    print('WARN: margin 18px < charte 42px; graphics accepted by author, not strict margin certified',flush=True)
if __name__=='__main__':run()
