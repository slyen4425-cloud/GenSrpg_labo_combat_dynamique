#!/usr/bin/env python3
"""Install the author's exact approved ZIP into global-assets, without overwrites."""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ZIP = ROOT / "GenSRPG_UI_Icons_V1_2026-11-09_READY.zip"
SHA = "0f19d0e96898ee954f0d8b774ee5b018a0d976090f6e53baaafeb49126f3c724"
PROV = ROOT / "assets/library/core/icons/ui/ui_icons_2026_11_09.provenance.json"

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

def main():
    raw = ZIP.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == SHA, "Approved ZIP changed"
    assert not PROV.exists(), "Already installed: refuse duplicate import"
    with zipfile.ZipFile(ZIP) as z:
        infos = z.infolist()
        assert z.testzip() is None and len(infos) == 44
        assert sum(i.file_size for i in infos) < 10000000
        assert len({i.filename for i in infos}) == len(infos)
        for i in infos:
            p = PurePosixPath(i.filename)
            assert not p.is_absolute() and ".." not in p.parts and not i.is_dir()
            assert not stat.S_ISLNK((i.external_attr >> 16) & 0xffff)
        with tempfile.TemporaryDirectory() as temp:
            z.extractall(temp)
            pack = Path(temp)
            # Validate original PNGs, WebPs, hashes, IDs and mappings.
            run(sys.executable, str(pack / "tests/check_pack.py"))
            run(sys.executable, str(pack / "tools_install_pack.py"), "--repo", str(ROOT))
            run(sys.executable, str(pack / "tools_install_pack.py"), "--repo", str(ROOT), "--apply")
            manifest = json.loads((pack / "catalog/ui-icon-manifest.v1.json").read_text(encoding="utf8"))
            assert len(manifest["assets"]) == 18
            assert len({v["assetId"] for v in manifest["assets"]}) == 18
            # The provenance is documentary; the existing catalog remains the only authority.
            PROV.parent.mkdir(parents=True, exist_ok=True)
            with PROV.open("x", encoding="utf8") as f:
                json.dump({"schema": "gensrpg-ui-icon-media-provenance-v1",
                           "owner": "global-assets", "sourceZip": ZIP.name,
                           "sourceZipSha256": SHA, "approvedOn": "2026-11-09",
                           "assets": manifest["assets"]}, f, ensure_ascii=False, indent=2)
                f.write("\n")
    print("OK: 18 approved UI icons, 36 PNG/WebP media and canonical catalog entries")

if __name__ == "__main__":
    main()
