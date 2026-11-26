"""Read-only preview evidence for the four reserved idles, both views."""
from pathlib import Path
import hashlib
import sys
from PIL import Image, ImageDraw

ROOT = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
CASES = {
    "grainou": ("heriplante", "69a96bc9f44368da38ab1bffa4940b38ad3b8e5d", "dcf5f91682582443400916cf6858b1be19e8e8bc"),
    "gemmor": ("plante_carnivore", "2c9c371740809a65b3a447077fc18ab85967019d", "161996452b5ae67cb8cce8bd2691c9df4e1c8296"),
    "scarabacier": ("scarabacier", "ae80cf22d7abc4826b65dafbfc5fe67a290f4791", "f345503bf86fc107f7482ffcdbce2bab3ab4214b"),
    "voltige": ("voltige", "e5d80711d05b0b53ec98f3256f6eefd3c3e80955", "0215ec1f4452a958f39f7ee941c9f91eca7518b1"),
}
for name, (family, front, back) in CASES.items():
    for view, side, expected in (("face", "opponent", front), ("dos", "player", back)):
        path = ROOT / "assets/library/capture/creatures" / family / "animations/idle" / side / f"{name}_idle_{view}.gif"
        raw = path.read_bytes()
        actual = hashlib.sha1(f"blob {len(raw)}\0".encode() + raw).hexdigest()
        assert actual == expected, (name, view, actual, expected)
        with Image.open(path) as gif:
            assert gif.n_frames == 12, (name, view, gif.n_frames)
            sheet = Image.new("RGB", (4*264, 3*288), "#20242c")
            draw = ImageDraw.Draw(sheet)
            for i in range(gif.n_frames):
                gif.seek(i)
                frame = gif.convert("RGBA")
                assert frame.size == (512,512), (name, view, frame.size)
                frame.thumbnail((256,256), Image.Resampling.LANCZOS)
                x, y = (i%4)*264+4, (i//4)*288+4
                sheet.paste(frame, (x,y), frame)
                draw.text((x,y+259), f"{name} {view} {i+1:02d}", fill="white")
            sheet.save(OUT / f"{name}_{view}_contact.png")
        (OUT / path.name).write_bytes(raw)
        print(name, view, actual)
