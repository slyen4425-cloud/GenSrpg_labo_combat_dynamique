#!/usr/bin/env python3
"""Import only four validated lunar animation assets to the real global-assets catalog."""
import pathlib,subprocess,json
R=pathlib.Path(__file__).resolve().parents[1]
SRC="origin/gh-pages"
ROOT="assets/library/capture/creatures/creature_lunaire/animations/"
def show(path):return subprocess.check_output(["git","show",f"{SRC}:{path}"],cwd=R)
def main():
 paths=subprocess.check_output(["git","ls-tree","-r","--name-only",SRC,"--",ROOT],cwd=R,text=True).splitlines()
 assert len(paths)>=35,len(paths)
 for path in paths:
  dest=R/path
  assert not dest.exists(),path
  dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_bytes(show(path))
 catpath=R/"data/assets/catalog/global-visual-assets.v1.json"
 cat=json.loads(catpath.read_text())
 ids={a["id"] for a in cat["assets"]}
 entries=[]
 for action,view,count,mode in [("movement","opponent",8,"loop"),("attack","opponent",8,"once"),("movement","player",8,"loop"),("attack","player",7,"once")]:
  aid=f"pack:capture:creature-lunaire-{action}-{view}-{count}-v1"
  assert aid not in ids,aid
  entries.append({"id":aid,"label":f"Kitsune Lunaire — {'Course' if action=='movement' else 'Attaque'} {'face' if view=='opponent' else 'dos'} ({count} frames)","assetType":"sprite","mediaType":"image","category":"creature","tags":["capture","creature","lunaire","animated",view,action],"source":{"scope":"pack","packId":"capture","author":"GenSrpG","license":"project-internal"},"resource":{"file":f"capture/creatures/creature_lunaire/animations/{action}/{view}/atlases/creature_lunaire_{action}_{view}_{count}_atlas.webp","format":"sprite-strip","mime":"image/webp","frameCount":count,"frameMs":110,"playbackMode":mode},"compatibility":{"uses":["combat","capture","editor"]}})
 cat["assets"].extend(entries)
 for k in ("assets","sprites","creatures"):cat["counts"][k]+=4
 catpath.write_text(json.dumps(cat,ensure_ascii=False,indent=2)+"\n")
 print("Four animations registered in actual global-assets library")
if __name__=="__main__":main()
