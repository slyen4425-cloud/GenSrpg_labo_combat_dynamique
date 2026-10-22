#!/usr/bin/env python3
"""Import strict, immuable des 12 frames vol + 12 attaque FACE de Braisombre.

Source réelle fournie par l'auteur via _incoming. Le modèle runtime, le moteur et la fiche créature ne sont jamais modifiés.
"""
from __future__ import annotations
import hashlib, json, pathlib, shutil, struct, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
NAME = "BRAISOMBRE_FACE_12_VOL_ATTAQUE_GITHUB_2026-10-22.zip"
SOURCE = ROOT / "_incoming" / NAME
SOURCE_SHA256 = "2a0637d1fcf81472076ed434de2c5a4eeeb14415f838c7f510dec16b8b0c2842"
BASE = ROOT / "assets/library/capture/creatures/braisombre/animations"
CATALOG = ROOT / "data/assets/catalog/global-visual-assets.v1.json"
TEST_TEMPLATE = ROOT / "scripts/braisombre-face12.test.template.mjs"
TEST_PATH = ROOT / "tests/unit/braisombre-face12-assets.test.mjs"
ACTIONS = {"movement": (90, "loop"), "attack": (100, "once")}
SOURCES = ("sources/braisombre_flight_first_tail_source.png", "sources/braisombre_attack_source.png")

def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def check_png(data: bytes, width: int | None = None, height: int | None = None) -> None:
    assert data[:8] == b"\x89PNG\r\n\x1a\n" and data[12:16] == b"IHDR", "not PNG"
    w,h,depth,color,*_ = struct.unpack(">IIBBBBB", data[16:29])
    assert depth == 8 and color == 6, "PNG not RGBA"
    if width is not None:
        assert (w,h) == (width,height), (w,h)

def check_webp(data: bytes) -> None:
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", "not WebP"

def main() -> None:
    assert SOURCE.is_file(), "Source ZIP absent: " + str(SOURCE)
    assert digest(SOURCE.read_bytes()) == SOURCE_SHA256, "Source ZIP hash mismatch"
    assert TEST_TEMPLATE.is_file() and not TEST_PATH.exists()
    catalog = json.loads(CATALOG.read_text(encoding="utf8"))
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    assert catalog["counts"]["assets"] == len(catalog["assets"])
    pending: dict[pathlib.Path, bytes] = {}
    added_assets = []
    expected = {"PACK_METADATA.json","README.md",*SOURCES}
    with zipfile.ZipFile(SOURCE) as z:
        assert z.testzip() is None, "ZIP CRC error"
        names=z.namelist()
        assert len(names)==38 and len(set(names))==38, "unexpected number of files"
        for path in names:
            pp=pathlib.PurePosixPath(path)
            assert not path.startswith("/") and ".." not in pp.parts and not path.endswith("/")
        for action,(ms,mode) in ACTIONS.items():
            prefix=action + "/"
            target=BASE / action / "face"
            manifest_name=prefix + action + ".manifest.json"
            expected.add(manifest_name)
            m=json.loads(z.read(manifest_name))
            asset_id="pack:capture:creature-braisombre-" + action + "-face-12-v1"
            assert not any(a["id"]==asset_id for a in catalog["assets"])
            assert m["schema"]=="capture-creature-animation-v1"
            assert (m["creatureId"],m["view"],m["action"])==("braisombre","face",action)
            assert m["assetId"]==asset_id
            assert m["frameCount"]==12 and m["frameSize"]==[512,512]
            assert (m["frameMs"],m["playbackMode"])==(ms,mode)
            assert m["authorApproved"] is True
            assert len(m["frames"])==12
            hashes=set()
            for i,frame in enumerate(m["frames"],1):
                relative="frames/braisombre_" + action + "_face_" + str(i).zfill(2) + ".png"
                expected.add(prefix+relative)
                assert frame["index"]==i-1 and frame["file"]==relative
                png=z.read(prefix + relative)
                check_png(png,512,512)
                assert digest(png)==frame["sha256"]
                assert len(frame["marginsLTRB"])==4 and min(frame["marginsLTRB"])>=48
                hashes.add(frame["sha256"])
                pending[target/relative]=png
            assert len(hashes)==12, "duplicate animation frames"
            atlas=m["atlas"]
            relative=atlas["file"]
            expected.add(prefix+relative)
            assert atlas["format"]=="sprite-strip" and atlas["frameCount"]==12
            assert [atlas["frameWidth"],atlas["frameHeight"]]==[384,384]
            data=z.read(prefix+relative)
            check_webp(data)
            assert digest(data)==atlas["sha256"]
            pending[target/relative]=data
            pr=m["previews"]
            assert m["preview"]==pr["gif"]
            for typ in ("gif","webp","planche"):
                relative=pr[typ]
                expected.add(prefix+relative)
                data=z.read(prefix+relative)
                if typ=="gif":
                    assert data[:6] in (b"GIF87a",b"GIF89a")
                elif typ=="webp":
                    check_webp(data)
                else:
                    check_png(data)
                pending[target/relative]=data
            source=m["sourceSpriteSheet"]
            assert source in SOURCES
            assert digest(z.read(source))==m["sourceSpriteSheetSha256"]
            pending[target / (action+".manifest.json")]=z.read(manifest_name)
            added_assets.append({
                "id":asset_id,
                "label":"Braisombre — "+("vol / déplacement" if action=="movement" else "attaque")+" face (12 frames)",
                "assetType":"sprite","mediaType":"image","category":"creature",
                "tags":["capture","creature","braisombre","dragon","fire",action,"animated","face"]+(["flight","flying"] if action=="movement" else []),
                "source":{"scope":"pack","packId":"capture","author":"GenSrpG / sprites auteur 2026-10-22","license":"project-internal"},
                "resource":{"file":"capture/creatures/braisombre/animations/"+action+"/face/"+atlas["file"],
                            "format":"sprite-strip","mime":"image/webp","frameCount":12,
                            "frameMs":ms,"playbackMode":mode},
                "compatibility":{"uses":["combat","capture","editor"]}
            })
        assert set(names)==expected, "ZIP contains missing or extra files: " + repr(set(names)^expected)
        for source in SOURCES:
            check_png(z.read(source))
        # Archive kept under _incoming, sources duplicated in the dedicated library for traceability.
        for source in SOURCES:
            pending[BASE/"sources"/pathlib.PurePosixPath(source).name]=z.read(source)
        pending[BASE/"BRAISOMBRE_FACE12_SOURCE_README.md"]=z.read("README.md")
    assert all(not p.exists() for p in pending), "One or more output paths already exist"
    assert len(pending)==37, "unexpected output media + provenance file count"
    catalog["assets"].extend(added_assets)
    catalog["counts"]["assets"]+=2
    catalog["counts"]["sprites"]+=2
    catalog["counts"]["creatures"]+=2
    assert len({a["id"] for a in catalog["assets"]}) == len(catalog["assets"])
    assert catalog["counts"]["assets"]==len(catalog["assets"])
    for destination,data in pending.items():
        destination.parent.mkdir(parents=True,exist_ok=True)
        destination.write_bytes(data)
    TEST_PATH.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(TEST_TEMPLATE,TEST_PATH)
    CATALOG.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print("BRAISOMBRE FACE 12: 24 distinct RGBA PNG, 2 atlas, 2 manifests, 6 previews, 2 sources; 2 new catalogue IDs.")

if __name__=="__main__":
    main()
