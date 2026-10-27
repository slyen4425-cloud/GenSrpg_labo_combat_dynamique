#!/usr/bin/env python3
"""Categorize existing creature visuals by their authoritative element without changing IDs."""
import json, pathlib, subprocess, tempfile
def git(*args,cwd=None):
    return subprocess.check_output(["git",*args],cwd=cwd,text=True).strip()
git("fetch","origin","global-assets")
with tempfile.TemporaryDirectory() as td:
    root=pathlib.Path(td)/"assets"
    git("worktree","add","--detach",str(root),"origin/global-assets")
    try:
        path=root/"data/assets/catalog/global-visual-assets.v1.json"
        catalog=json.loads(path.read_text())
        expected={"venombre":"poison","gorille-des-glaces":"ice","maraileron":"water"}
        seen={key:0 for key in expected}
        seen["kitsune-lunaire"]=0
        for asset in catalog["assets"]:
            aid=asset["id"]
            label=asset.get("label","").lower()
            key=next((k for k in expected if (k in aid or (k=="maraileron" and "maraileron" in label))),None)
            if key is None and (aid.startswith("pack:capture:creature-lunaire-") or "kitsune lunaire" in label):
                key="kitsune-lunaire"
            if key is None:
                continue
            if key=="kitsune-lunaire" and not (aid.startswith("pack:capture:creature-lunaire-") or aid.startswith("pack:capture:creature-renard-lunaire-")):
                continue
            element="spirit" if key=="kitsune-lunaire" else expected[key]
            tags=asset.setdefault("tags",[])
            if element not in tags: tags.append(element)
            if key=="kitsune-lunaire" and "kitsune-lunaire" not in tags: tags.append("kitsune-lunaire")
            seen[key]+=1
        assert all(n>=3 for n in seen.values()),seen
        path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n")
        git("config","user.name","github-actions[bot]",cwd=root)
        git("config","user.email","41898282+github-actions[bot]@users.noreply.github.com",cwd=root)
        git("add",str(path.relative_to(root)),cwd=root)
        git("diff","--cached","--check",cwd=root)
        git("commit","-m","assets: categorize Venombre, ice gorilla, Kitsune and Maraileron",cwd=root)
        git("push","origin","HEAD:global-assets",cwd=root)
        print("Categorized:",seen,"SHA:",git("rev-parse","HEAD",cwd=root))
    finally:
        git("worktree","remove","--force",str(root))
