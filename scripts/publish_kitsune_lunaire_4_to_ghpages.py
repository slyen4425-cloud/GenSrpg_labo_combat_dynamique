#!/usr/bin/env python3
"""Safely transplant only Kitsune Lunaire assets and bindings onto current gh-pages."""
import pathlib,json,subprocess
R=pathlib.Path(__file__).resolve().parents[1]
SRC="origin/work/kitsune-lunaire-3animations-raccord-2026-10-26"
ROOT="assets/library/capture/creatures/creature_lunaire/animations/"
def show(path):return subprocess.check_output(["git","show",f"{SRC}:{path}"],cwd=R)
def main():
 paths=subprocess.check_output(["git","ls-tree","-r","--name-only",SRC,"--",ROOT],cwd=R,text=True).splitlines()
 assert len(paths)>=35,len(paths)
 for path in paths:
  dest=R/path
  assert not dest.exists(),f"Refusing overwrite {path}"
  dest.parent.mkdir(parents=True,exist_ok=True)
  dest.write_bytes(show(path))
 source_showcase=json.loads(show("data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json"))
 target=R/"data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json"
 live=json.loads(target.read_text())
 v=live["draft"]["presentation"]["visual"]
 s=source_showcase["draft"]["presentation"]["visual"]
 for key in ("movement","movementBack","rangedAttack","rangedAttackBack","movementPlayback","rangedAttackPlayback"):
  v[key]=s[key]
 target.write_text(json.dumps(live,ensure_ascii=False,indent=2)+"\n")
 print("OK: Four Kitsune assets imported on current gh-pages base; all other files retained.")
if __name__=="__main__":main()
