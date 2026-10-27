#!/usr/bin/env python3
"""Replace only Voltige's player master, preserving all other creature assets."""
import json,pathlib,subprocess,tempfile,struct
def git(*args,cwd=None):
    return subprocess.check_output(["git",*args],cwd=cwd,text=True).strip()
git("fetch","origin","gh-pages","global-assets")
data=subprocess.check_output(["git","show","origin/gh-pages:voltige_joueur_nouveau_512.png"])
assert data[:8]==bytes.fromhex("89504e470d0a1a0a"),"Source must be PNG"
assert struct.unpack(">II",data[16:24])==(512,512),"Expected 512x512"
assert data[25]==6,"Expected RGBA PNG"
with tempfile.TemporaryDirectory() as temp:
    target=pathlib.Path(temp)/"library"
    git("worktree","add","--detach",str(target),"origin/global-assets")
    try:
        runtime=target/"assets/library/capture/creatures/voltige/runtime"
        assert (runtime/"voltige_player.webp").is_file()
        new=runtime/"voltige_player.png"
        assert not new.exists()
        new.write_bytes(data)
        meta_path=target/"assets/library/capture/creatures/voltige/voltige.meta.json"
        meta=json.loads(meta_path.read_text())
        assert meta["views"]["player"]=="runtime/voltige_player.webp"
        assert meta["runtimePreview"]["player"]=="runtime/voltige_player.webp"
        meta["views"]["player"]="runtime/voltige_player.png"
        meta["runtimePreview"]["player"]="runtime/voltige_player.png"
        meta["canvas"]["combat"]=[512,512]
        meta["visualRevision"]="player-user-approved-2026-10-27"
        meta_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n")
        catalog_path=target/"data/assets/catalog/global-visual-assets.v1.json"
        catalog=json.loads(catalog_path.read_text())
        matches=[a for a in catalog["assets"] if a["id"]=="pack:capture:creature-voltige-player-01"]
        assert len(matches)==1
        assert matches[0]["resource"]["file"]=="capture/creatures/voltige/runtime/voltige_player.webp"
        matches[0]["resource"]["file"]="capture/creatures/voltige/runtime/voltige_player.png"
        matches[0]["resource"]["mime"]="image/png"
        catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
        assert (target/"assets/library"/matches[0]["resource"]["file"]).read_bytes()==data
        git("config","user.name","github-actions[bot]",cwd=target)
        git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com",cwd=target)
        git("add",str(new.relative_to(target)),str(meta_path.relative_to(target)),str(catalog_path.relative_to(target)),cwd=target)
        git("diff","--cached","--check",cwd=target)
        git("commit","-m","assets(capture): replace Voltige player visual with approved PNG",cwd=target)
        git("push","origin","HEAD:global-assets",cwd=target)
        print("PUBLISHED",git("rev-parse","HEAD",cwd=target))
    finally:
        git("worktree","remove","--force",str(target))
