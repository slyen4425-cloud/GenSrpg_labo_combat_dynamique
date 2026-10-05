from pathlib import Path
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ROOT = Path("assets/library/capture/sprites/skills/fireball_2")
FRAMES = ROOT / "frames"
ATLASES = ROOT / "atlases"
CATALOG = Path("data/assets/catalog/global-visual-assets.v1.json")
SIZE = 512
COUNT = 12

SOURCE_ORDER = [7, 8, 9, 10, 11, 12, 11, 10, 9, 8, 9, 10]

def alpha_scale(image, factor):
    image = image.copy()
    alpha = image.getchannel("A")
    alpha = alpha.point(lambda value: max(0, min(255, int(value * factor))))
    image.putalpha(alpha)
    return image

def flame_tail(frame_index, head_center):
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer, "RGBA")
    rng = np.random.default_rng(42000 + frame_index)
    cx, cy = head_center
    phase = frame_index / COUNT * math.tau

    specs = [
        (-50, 150, 21, (255, 72, 0, 205)),
        (-28, 188, 27, (255, 105, 0, 215)),
        (-7, 220, 31, (255, 145, 0, 225)),
        (15, 202, 27, (255, 102, 0, 210)),
        (38, 164, 21, (255, 66, 0, 190)),
    ]

    for index, (offset_y, length, width, color) in enumerate(specs):
        points = []
        for step in range(18):
            q = step / 17
            x = cx - 85 - length * q
            y = (
                cy
                + offset_y * (1 - q * 0.22)
                + math.sin(phase * 2.1 + index * 0.9 + q * 5.4)
                * (7 + 18 * q)
            )
            points.append((x, y))
        draw.line(points, fill=color, width=width, joint="curve")

    # bright inner streaks: discrete lines, no common translucent wedge
    for index in range(6):
        length = 105 + index * 17
        points = []
        for step in range(14):
            q = step / 13
            x = cx - 76 - length * q
            y = cy + (index - 2.5) * 11 + math.sin(
                phase * 2.8 + index + q * 6.2
            ) * (4 + 10 * q)
            points.append((x, y))
        draw.line(
            points,
            fill=(255, 198 if index % 2 else 154, 15, 205),
            width=7 + (index % 3) * 2,
            joint="curve",
        )

    # limited blur smooths strokes without recreating a broad underlayer
    layer = layer.filter(ImageFilter.GaussianBlur(2.2))

    # crisp flame filaments
    crisp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    crisp_draw = ImageDraw.Draw(crisp, "RGBA")
    for index in range(8):
        length = rng.uniform(75, 175)
        start_y = cy + rng.uniform(-64, 64)
        points = []
        for step in range(11):
            q = step / 10
            points.append(
                (
                    cx - 88 - length * q,
                    start_y
                    + math.sin(phase * 3 + index + q * 5)
                    * (3 + 8 * q),
                )
            )
        crisp_draw.line(
            points,
            fill=(255, int(rng.uniform(82, 185)), 0, int(rng.uniform(150, 225))),
            width=int(rng.integers(3, 7)),
            joint="curve",
        )

    layer = Image.alpha_composite(layer, crisp)

    # embers remain local to the tail
    embers = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ember_draw = ImageDraw.Draw(embers, "RGBA")
    for _ in range(34):
        x = cx - rng.uniform(95, 260)
        y = cy + rng.normal(0, 58)
        radius = rng.uniform(1.2, 4.5)
        ember_draw.ellipse(
            (x - radius, y - radius, x + radius, y + radius),
            fill=(
                255,
                int(rng.uniform(75, 180)),
                0,
                int(rng.uniform(90, 205)),
            ),
        )

    return Image.alpha_composite(layer, embers.filter(ImageFilter.GaussianBlur(0.45)))

def build_frame(index):
    source_index = SOURCE_ORDER[index]
    source = Image.open(
        FRAMES / f"sprite_skill_fireball_2_cast_{source_index:02d}.png"
    ).convert("RGBA")

    # Keep the native HD source; only downscale it into the projectile frame.
    source = ImageEnhance.Color(source).enhance(1.20)
    source = ImageEnhance.Contrast(source).enhance(1.16)
    source = ImageEnhance.Brightness(source).enhance(1.08)
    source = ImageEnhance.Sharpness(source).enhance(1.12)

    # 288 px head keeps detailed 512px cast texture while leaving space for tail.
    head = source.resize((288, 288), Image.Resampling.LANCZOS)
    head = head.rotate(
        math.sin(index / COUNT * math.tau) * 2.2,
        resample=Image.Resampling.BICUBIC,
        expand=False,
    )

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    head_x = 197
    head_y = 112
    head_center = (head_x + 144, head_y + 144)

    tail = flame_tail(index, head_center)
    canvas = Image.alpha_composite(canvas, tail)

    # tight orange/yellow glow around head only
    head_alpha = head.getchannel("A")
    for radius, opacity, color in [
        (5, 0.30, (255, 222, 90)),
        (12, 0.18, (255, 114, 0)),
        (22, 0.08, (220, 42, 0)),
    ]:
        glow_alpha = head_alpha.filter(ImageFilter.GaussianBlur(radius))
        glow = Image.new("RGBA", head.size, (*color, 0))
        glow.putalpha(
            glow_alpha.point(lambda value, factor=opacity: int(value * factor))
        )
        glow_canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
        glow_canvas.alpha_composite(glow, (head_x, head_y))
        canvas = Image.alpha_composite(canvas, glow_canvas)

    canvas.alpha_composite(head, (head_x, head_y))

    pixels = np.array(canvas)
    # Remove the residual low-alpha haze created by antialiasing/glow.
    # This keeps fire filaments while preventing another translucent veil.
    pixels[pixels[:, :, 3] < 14] = 0
    return Image.fromarray(pixels, "RGBA")

def metrics(image):
    alpha = np.asarray(image.getchannel("A"))
    visible = alpha > 0
    strong = alpha >= 32
    coverage = float(visible.mean())
    weak_ratio = float(((alpha > 0) & (alpha < 32)).sum()) / max(int(visible.sum()), 1)

    ys, xs = np.where(strong)
    strong_width = (xs.max() - xs.min() + 1) / SIZE
    strong_height = (ys.max() - ys.min() + 1) / SIZE
    return coverage, weak_ratio, strong_width, strong_height

def update_catalog():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    asset = next(
        asset
        for asset in catalog["assets"]
        if asset["id"] == "pack:capture:sprite-fireball-2-projectile-01"
    )
    resource = asset["resource"]
    resource["frameCount"] = 12
    resource["frameMs"] = 45
    resource["headingRad"] = 0
    resource["coreAnchor"] = {"x": 0.666, "y": 0.5}
    CATALOG.write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

def main():
    images = []
    for index in range(COUNT):
        image = build_frame(index)
        coverage, weak_ratio, strong_width, strong_height = metrics(image)
        assert 0.08 < coverage < 0.30, (index + 1, coverage)
        assert weak_ratio < 0.25, (index + 1, weak_ratio)
        assert strong_width >= 0.55, (index + 1, strong_width)
        assert strong_height >= 0.36, (index + 1, strong_height)

        path = FRAMES / f"sprite_skill_fireball_2_projectile_{index + 1:02d}.png"
        image.save(path, compress_level=6)
        images.append(image)

    atlas = Image.new("RGBA", (SIZE * COUNT, SIZE), (0, 0, 0, 0))
    for index, image in enumerate(images):
        atlas.alpha_composite(image, (index * SIZE, 0))
    atlas.save(
        ATLASES / "sprite_skill_fireball_2_projectile_atlas_01.webp",
        "WEBP",
        quality=92,
        method=6,
    )

    update_catalog()
    print("Fireball 2 projectile art V2: 12 HD frames + aligned coreAnchor")

if __name__ == "__main__":
    main()
