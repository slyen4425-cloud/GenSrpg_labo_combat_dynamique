#!/usr/bin/env python3
"""Import approved Rigby2D archives already in global-assets, without changing a single RGBA pixel."""
import hashlib, io, json, re, sys
from pathlib import Path
from zipfile import ZipFile
from PIL import Image
ROOT='assets/library/capture/creatures/ephemus'
CAT='data/assets/catalog/global-visual-assets.v1.json'
SPECS=[
 ('Ephemus_IDLE_Rigby2D_FACE_DOS_12F.zip','c7072612f496d1e11bf8be4bfeb576b544af627bcaf69a0cb6196493a016deb6','idle','idle'),
 ('Ephemus_DEPLACEMENT_FACE_DOS_24F_VALIDE.zip','111a3ea1c0e0d53baf4d9332bc6fa71abae3f1071c6ca5c5f05864054051b353','movement','deplacement'),
 ('Ephemus_ATTAQUE_FACE_DOS_24F_VALIDE.zip','019f3367856fcf3a9426578667fe73d4169dcf1498199994d5f255480fc2f233','attack','attaque')]
MASTER={'face':'0e8120cd923d904a73f3348bd437d79ace2fd35aef65deaa50d64e8a42997743','dos':'cbc85ff6c50fdb0f69fef161e49dc9a246a0ba5089f7c6f9ea04746202fe6730'}
def sha(b): return hashlib.sha256(b).hexdigest()
def save(path,obj): path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
def run(root):
    catfile=root/CAT; cat=json.loads(catfile.read_text())
    assert cat['storage']['branch']=='global-assets'
    old_count=cat['counts']['assets']; old_sprites=cat['counts']['sprites']
    assert old_count==len(cat['assets'])
    known={x['id'] for x in cat['assets']}; files={x['resource']['file'] for x in cat['assets']}
    assert len(known)==old_count
    meta_file=root/ROOT/'ephemus.meta.json'; meta=json.loads(meta_file.read_text())
    views=meta['views'].copy(); ids=meta['assetIds'].copy()
    prov_file=root/ROOT/'ephemus.animations.provenance.json'
    # Idempotence is verified by rerunning all byte/pixel checks, never appending duplicates.
    previous=json.loads(prov_file.read_text()) if prov_file.exists() else None
    new=[]; records=[]
    for archive,hash_,action,slug in SPECS:
        data=(root/'_incoming'/archive).read_bytes()
        assert sha(data)==hash_,archive
        with ZipFile(io.BytesIO(data)) as z:
            assert z.testzip() is None,archive
            for side,view in [('face','opponent'),('dos','player')]:
                master=(root/ROOT/'runtime'/f'ephemus_{side}.png').read_bytes()
                assert sha(master)==MASTER[side]
                frames=[]; hashes=[]
                for index in range(1,13):
                    prefix=f'frames/{side}' if action=='idle' else f'{slug}/{side}/frames'
                    member=f'{prefix}/ephemus_{slug}_{side}_{index:02}.png'
                    raw=z.read(member)
                    if index==1: assert raw==master,(archive,member)
                    with Image.open(io.BytesIO(raw)) as im:
                        assert im.mode=='RGBA' and im.size==(512,512)
                        bb=im.getchannel('A').getbbox()
                        assert bb and min(bb[0],bb[1],512-bb[2],512-bb[3])>=42
                        frames.append(im.copy());hashes.append(sha(raw))
                assert len(set(hashes))==12,(archive,side)
                asset_id=f'pack:capture:creature-ephemus-{action}-{view}-12-v1'
                rel=f'capture/creatures/ephemus/animations/{action}/{view}/ephemus_{action}_{view}_12f.png'
                dest=root/'assets/library'/rel
                if not previous:
                    assert asset_id not in known and rel not in files and not dest.exists()
                    dest.parent.mkdir(parents=True,exist_ok=True)
                    strip=Image.new('RGBA',(6144,512))
                    for i,im in enumerate(frames): strip.paste(im,(512*i,0))
                    strip.save(dest,'PNG',optimize=True)
                with Image.open(dest) as strip:
                    assert strip.size==(6144,512) and strip.mode=='RGBA'
                    for i,im in enumerate(frames):
                        assert strip.crop((512*i,0,512*(i+1),512)).tobytes()==im.tobytes(),(archive,side,i)
                mode='once' if action=='attack' else 'loop'
                item={'id':asset_id,'label':f'Ephemus — {slug} {side} (12 frames)','assetType':'sprite','mediaType':'image','category':'creature','tags':['capture','creature','ephemus','animated',action,view,'author-approved-20261125'],'source':{'scope':'pack','packId':'capture','author':'GenSRPG / Rigby2D, visuels auteur validés','license':'project-internal'},'resource':{'file':rel,'format':'sprite-strip','mime':'image/png','frameCount':12,'frameMs':83,'playbackMode':mode},'compatibility':{'uses':['combat','capture','editor']}}
                if previous:
                    assert [a for a in cat['assets'] if a['id']==asset_id]==[item]
                else:
                    new.append(item);known.add(asset_id);files.add(rel)
                key=action+view.capitalize()
                if previous:
                    assert meta['assetIds'][key]==asset_id
                else:
                    assert key not in meta['assetIds']
                    meta['assetIds'][key]=asset_id
                    meta.setdefault('animations',{})[key]=dest.relative_to(root/ROOT).as_posix()
                record={'id':asset_id,'file':rel,'action':action,'view':view,'frameCount':12,'frameMs':83,'playbackMode':mode,'sourceArchive':archive,'sourceArchiveSha256':hash_,'sourceFrameSha256':hashes,'framesRgbaSha256':[sha(im.tobytes()) for im in frames],'atlasSha256':sha(dest.read_bytes()),'engine':'Rigby2D 0.6.1','runtimeBinding':'deferred-idle-contract' if action=='idle' else 'creature-presentation'}
                records.append(record)
                print('PASS',asset_id,'12 exact RGBA frames',flush=True)
    assert meta['views']==views and all(meta['assetIds'][k]==v for k,v in ids.items())
    prov={'schema':'capture-ephemus-rigby-animation-import-v1','sourceBranch':'global-assets','canonicalBranch':'global-assets','items':records,'authorValidation':'2026-11-25','idleRuntime':'deferred; media only'}
    if previous:
        assert previous==prov
        return
    assert len(new)==6
    cat['assets'].extend(new);cat['counts']['assets']+=6;cat['counts']['sprites']+=6
    assert cat['counts']['assets']==len(cat['assets'])==len(known)
    save(catfile,cat)
    meta['animationProvenance']='ephemus.animations.provenance.json'
    save(meta_file,meta);save(prov_file,prov)
    # Existing global-assets tests explicitly track the cumulative canonical counts.
    for path in ['tests/unit/capture-ephemus-media-assets-20261118.test.mjs','tests/unit/veldra-skill-media-assets-20261118.test.mjs','tests/unit/capture-cheval-de-feu-icon-catalog-20261121.test.mjs']:
        f=root/path
        if f.exists():
            old=f.read_text()
            new=re.sub(r'(catalog\.(?:counts\.assets|assets\.length)\s*,\s*)'+str(old_count)+r'\b',lambda m:m[1]+str(old_count+6),old)
            new=re.sub(r'(catalog\.counts\.sprites\s*,\s*)'+str(old_sprites)+r'\b',lambda m:m[1]+str(old_sprites+6),new)
            assert new!=old,path
            f.write_text(new)
    print('PASS six unique clips, 72 untouched frames, three archives preserved, idle media only')
if __name__=='__main__': run(Path(sys.argv[1]))
