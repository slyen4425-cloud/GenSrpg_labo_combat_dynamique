#!/usr/bin/env python3
"""Append-only, fail-closed import of six approved author ZIP triptychs.
Source archives remain untouched on Combat main; media live only on global-assets.
No gameplay presets, renderer or independent asset database are created.
"""
import argparse
from hashlib import sha256, sha1
import io
import json
from pathlib import Path
import re
import unicodedata
from zipfile import ZipFile
from PIL import Image, ImageDraw

SOURCES = {
    "vipfer": ("Vipfer", "vipfer_monster_capture.zip", "bf538f8b406ef23eaac6bb66a6dfeb6218d92c89"),
    "veuve_jaune": ("Veuve jaune", "veuve_jaune_monster_capture_corrige.zip", "4e636fcb5a342b5c07217d7695b94d7f68ace38a"),
    "carglasse": ("Carglasse", "carglasse_monster_capture_valide.zip", "179ec9f73b9cc593a181a09f15b2f8845279baee"),
    "ephemus": ("Éphémus", "ephemus_monster_capture_VALIDE.zip", "b1c9f6ed6f63967da9ffa5978e1c323d7250855a"),
    "raiiven": ("Raiiven", "raiiven_monster_capture_valide.zip", "4a98384e14b6b02741c07ed0972dc1c155cb8be4"),
    "veldra": ("Veldra", "veldra_monster_capture_valide.zip", "278f609e2fa11d261475411adc8493dda2d6a940"),
}
ROLE_ALIASES = {
    "face": {"face", "opponent", "adversaire"},
    "dos": {"dos", "back", "player", "joueur"},
    "icone": {"icone", "icon", "portrait"},
}
ROLE_NAME = {"face": "opponent", "dos": "player", "icone": "icon"}
SUFFIX = {"face": "face", "dos": "dos", "icone": "icone"}


def normalized(value):
    return "".join(c for c in unicodedata.normalize("NFKD", value.casefold()) if not unicodedata.combining(c))


def pick_source(zip_file, role):
    choices = []
    for path in zip_file.namelist():
        if not path.lower().endswith(".png") or path.endswith("/"):
            continue
        segments = [normalized(s) for s in Path(path).parts]
        base = Path(segments[-1]).stem
        words = set(re.split(r"[^a-z0-9]+", base))
        if not words.intersection(ROLE_ALIASES[role]):
            continue
        if any(word in words for word in ("preview","apercu","sheet","planche","atlas","sprite","candidat")):
            continue
        rank = 0 if "sources_hd" in segments else 1 if any("source" in s for s in segments) else 2
        # A source named simply face/dos/icone is stronger than a derived variant.
        rank += 0 if base in ROLE_ALIASES[role] else 1
        choices.append((rank,path))
    if not choices:
        raise AssertionError(f"Archive missing approved PNG for {role}; no visual invented")
    choices.sort()
    finalists = [name for rank,name in choices if rank == choices[0][0]]
    if len(finalists) != 1:
        raise AssertionError(f"Ambiguous {role} sources (blocked): {finalists}")
    return finalists[0]


def prepare_png(data, archive_name, source_name):
    original = Image.open(io.BytesIO(data))
    original.load()
    assert original.format == "PNG", (archive_name,source_name,"not PNG")
    rgba = original.convert("RGBA")
    alpha = rgba.getchannel("A")
    assert alpha.getextrema() == (0, 255), (archive_name,source_name,"not transparent RGBA artwork")
    bounds = alpha.getbbox()
    assert bounds, (archive_name,source_name,"blank image")
    # The approved archive is never rewritten. This is only a 512px runtime derivative.
    cropped = rgba.crop(bounds)
    cropped.thumbnail((416,416), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (512,512), (0,0,0,0))
    x = (512-cropped.width)//2
    y = (512-cropped.height)//2
    canvas.alpha_composite(cropped,(x,y))
    result = canvas.getchannel("A").getbbox()
    assert result and min(result[0],result[1],512-result[2],512-result[3])>=42,(archive_name,source_name,result)
    buffer = io.BytesIO()
    canvas.save(buffer,"PNG",optimize=True)
    return buffer.getvalue(), {
        "originalSize":[original.width,original.height],
        "originalRgbaSha256": sha256(rgba.tobytes()).hexdigest(),
        "originalAlphaBox":list(bounds),
        "runtimeAlphaBox":list(result),
        "runtimeSha256":sha256(buffer.getvalue()).hexdigest()
    }


def generate_preview(images, title):
    sheet=Image.new("RGB",(1536,550),(242,243,245))
    draw=ImageDraw.Draw(sheet)
    draw.text((16,6),title+" — auteur / triptyque réel",fill=(17,24,32))
    for i,(name,img) in enumerate(images.items()):
        picture=Image.open(io.BytesIO(img)).convert("RGBA")
        sheet.paste(picture,(i*512,28),picture)
        draw.text((16+i*512,532),name,fill=(17,24,32))
    buffer=io.BytesIO()
    sheet.save(buffer,"PNG",optimize=True)
    return buffer.getvalue()


def run(source_root,canonical):
    source_root=Path(source_root)
    canonical=Path(canonical)
    catalog_path=canonical/"data/assets/catalog/global-visual-assets.v1.json"
    assert catalog_path.is_file(),catalog_path
    catalog=json.loads(catalog_path.read_text(encoding="utf-8"))
    assert catalog["storage"]["branch"]=="global-assets"
    assert catalog["rules"]["bindingsUseAssetId"] is True
    assert len(catalog["assets"])==catalog["counts"]["assets"]
    existing={asset["id"] for asset in catalog["assets"]}
    assert len(existing)==len(catalog["assets"]), "duplicate asset IDs already in catalog"
    for slug,(name,archive,blob_sha) in SOURCES.items():
        zip_path=source_root/"data/capture/showcase"/archive
        assert zip_path.is_file(),zip_path
        zip_bytes=zip_path.read_bytes()
        git_blob=sha1(b"blob "+str(len(zip_bytes)).encode()+b"\\0"+zip_bytes).hexdigest()
        assert git_blob==blob_sha, f"Archive changed after author deposit: {archive} {git_blob}"
        target=canonical/"assets/library/capture/creatures"/slug
        assert not target.exists(), f"Target already exists: {target}; refusing to overwrite"
        generated={}
        trace={}
        selected_paths={}
        with ZipFile(zip_path) as z:
            assert z.testzip() is None, f"Bad ZIP CRC: {archive}"
            for source_role,role in ROLE_NAME.items():
                path=pick_source(z,source_role)
                assert path not in selected_paths.values(), f"Source wrongly shared between views: {archive} {path}"
                selected_paths[source_role]=path
                generated[source_role],trace[source_role]=prepare_png(z.read(path),archive,path)
                trace[source_role]["archiveMember"]=path
        ids={}
        records=[]
        for source_role,role in ROLE_NAME.items():
            asset_id=f"pack:capture:creature-{slug.replace('_','-')}-{role}-01"
            assert asset_id not in existing, ("asset id collision",asset_id)
            existing.add(asset_id)
            ids[role]=asset_id
            filename=f"{slug}_{SUFFIX[source_role]}.png"
            records.append({
                "id":asset_id,"label":f"{name} — {role}",
                "assetType":"portrait" if role=="icon" else "sprite",
                "mediaType":"image",
                "category":"ui" if role=="icon" else "creature",
                "tags":["capture","creature",slug,role],
                "source":{"scope":"pack","packId":"capture","author":"GenSRPG / archives visuelles auteur validées","license":"project-internal"},
                "resource":{"file":f"capture/creatures/{slug}/runtime/{filename}","mime":"image/png"},
                "compatibility":{"uses":["combat","capture","editor"]}
            })
        (target/"runtime").mkdir(parents=True,exist_ok=False)
        (target/"previews").mkdir(parents=True,exist_ok=False)
        for source_role, data in generated.items():
            (target/"runtime"/f"{slug}_{SUFFIX[source_role]}.png").write_bytes(data)
        (target/"previews"/f"{slug}_face_dos_icone.png").write_bytes(generate_preview(generated,name))
        meta={
            "id":slug,"name":name,
            "status":"approved-artwork-only-no-bestiary-creature",
            "views":{role:f"runtime/{slug}_{SUFFIX[src]}.png" for src,role in ROLE_NAME.items()},
            "assetIds":ids,
            "canvas":{"combat":[512,512],"icon":[512,512]},
            "source":{"archive":f"data/capture/showcase/{archive}","gitBlob":blob_sha,
                      "zipSha256":sha256(zip_path.read_bytes()).hexdigest()},
            "verification":trace,
            "notes":"Source auteur conservée; visuels réels seulement, aucune fiche gameplay ni capacité inventée. Preview revue séparée."
        }
        (target/(slug+".meta.json")).write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        catalog["assets"].extend(records)
        for kind,num in [("assets",3),("sprites",2),("portraits",1),("creatures",2)]:
            catalog["counts"][kind]+=num
        print(f"PASS {name}: ZIP {archive}, 3 vrais PNG 512px RGBA, 1 preview, IDs: {list(ids.values())}",flush=True)
    assert len(existing)==len(catalog["assets"])==catalog["counts"]["assets"]
    catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"PASS six author archives: 18 new canonical media, six meta, six review previews, one catalogue (only global-assets)",flush=True)


if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("source",help="official Combat main checkout")
    parser.add_argument("canonical",help="official global-assets checkout")
    args=parser.parse_args()
    run(args.source,args.canonical)
