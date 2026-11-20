#!/usr/bin/env python3
"""Vérification de copies binaires et vraies animations Gorice, aucune écriture."""
from pathlib import Path
import hashlib
import json
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
FILE = ROOT / "atelier-animations/styles/gorille/references/gorice/manifest.json"

def git_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()

def main():
    info = json.loads(FILE.read_text(encoding="utf8"))
    assert info["styleId"] == "gorille" and info["referenceCreature"] == "gorice"
    assert len(info["assets"]) == 16
    assert len({item["copyPath"] for item in info["assets"]}) == 16
    count = {"atlas": 0, "preview": 0, "gif": 0, "contact-sheet": 0, "source-manifest": 0}
    original = {}
    for item in info["assets"]:
        f = ROOT / item["copyPath"]
        assert f.is_file(), f"Fichier manquant: {f}"
        raw = f.read_bytes()
        assert git_sha(raw) == item["sourceGitBlobSha"], f"Copie différente du blob officiel: {f}"
        count[item["kind"]] += 1
        if item["kind"] == "source-manifest":
            data = json.loads(raw)
            assert data["creatureId"] == "gorille_des_glaces"
            assert data["frameCount"] == 12 and data["frameSize"] == [512, 512]
            original[(item["action"],item["view"])] = data
        else:
            with Image.open(f) as im:
                assert im.format == ("GIF" if item["kind"] == "gif" else "PNG" if item["kind"] == "contact-sheet" else "WEBP"), f
                expected = (6144,512) if item["kind"] == "atlas" else (2768,2096) if item["kind"] == "contact-sheet" else (512,512)
                assert im.size == expected, (f,im.size,expected)
                if item["kind"] in ("preview", "gif"):
                    assert getattr(im,"n_frames",1)==12, (f,im.n_frames)
                    for n in range(12):
                        im.seek(n); im.load()
                if item["kind"] == "atlas":
                    assert getattr(im,"n_frames",1)==1
                    assert im.mode in ("RGBA","RGB"), (f,im.mode)
    assert count == {"atlas":4, "preview":4, "gif":2, "contact-sheet":2, "source-manifest":4}, count
    assert set(original) == {("movement","dos"),("movement","face"),("attack-charge","dos"),("attack-charge","face")}, original.keys()
    for key,data in original.items():
        assert len(data["frames"])==12 and len(data["frameDurationsMs"])==12
        if key[0]=="movement":
            assert data["playbackMode"]=="loop" and data["approval"]=="artist-approved 2026-11-03"
        else:
            assert data["holdLastFrame"] and data["persistentFrameIndex"]==11 and data["playbackMode"]=="once"
    assert original[("movement","dos")]["frameDurationsMs"]==[130]*11+[400]
    assert original[("movement","face")]["frameDurationsMs"]==[110]*12
    print("PASS GORILLE: 16 copies binaires exactes, 4 atlas 6144x512, 4 aperçus WebP réellement animés (12 images)")
    print("PASS: 2 GIF, 2 planches, 4 manifestes source, durées/lecture, et distinction boucle/maintien finale")
    print("REFERENCES SEULEMENT: les sources historiques ne sont pas toutes conformes aux critères futurs de frame01/marges 42 px")

if __name__ == "__main__":
    main()
