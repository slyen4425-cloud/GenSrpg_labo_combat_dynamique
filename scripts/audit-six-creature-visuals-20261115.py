#!/usr/bin/env python3
"""Read-only audit of six uploaded author archives; no media or catalog mutation."""
from pathlib import Path
from zipfile import ZipFile
from hashlib import sha256
import io
from PIL import Image

root = Path("data/capture/showcase")
archives = [
    "vipfer_monster_capture.zip",
    "veuve_jaune_monster_capture_corrige.zip",
    "carglasse_monster_capture_valide.zip",
    "ephemus_monster_capture_VALIDE.zip",
    "raiiven_monster_capture_valide.zip",
    "veldra_monster_capture_valide.zip",
]
for name in archives:
    path = root / name
    assert path.is_file(), f"Original author archive missing: {path}"
    print(f"\n=== ARCHIVE {name} bytes={path.stat().st_size} sha256={sha256(path.read_bytes()).hexdigest()} ===", flush=True)
    with ZipFile(path) as bundle:
        entries = [i for i in bundle.infolist() if not i.is_dir()]
        assert entries, f"Empty author archive: {path}"
        print(f"entries={len(entries)}", flush=True)
        for e in entries[:90]:
            ext = Path(e.filename).suffix.lower()
            line = f"  {e.filename} bytes={e.file_size}"
            if ext in {".png",".webp",".jpg",".jpeg"}:
                try:
                    data = bundle.read(e)
                    im = Image.open(io.BytesIO(data))
                    line += f" format={im.format} size={im.width}x{im.height} mode={im.mode}"
                    rgba=im.convert("RGBA")
                    bounds=rgba.getchannel("A").getbbox()
                    line += f" alpha-range={rgba.getchannel('A').getextrema()} bbox={bounds}"
                except Exception as error:
                    line += f" READ_ERROR={type(error).__name__}: {error}"
            print(line, flush=True)
        if len(entries) > 90:
            print(f"  ... {len(entries)-90} more files", flush=True)
print("\nPASS: all six original ZIPs opened, inventoried read-only", flush=True)
