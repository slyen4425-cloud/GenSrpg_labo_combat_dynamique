from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path("assets/library/capture/sprites/skills/fireball_2")
FRAMES = ROOT / "frames"
ATLASES = ROOT / "atlases"
SIZE = 512
COUNT = 12
Y, X = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)

def rgba_from_masks(alpha, heat):
    alpha = np.clip(alpha, 0, 1)
    heat = np.clip(heat, 0, 1.6)
    rr = np.clip(heat * 1.7, 0, 1)
    gg = np.clip((heat - 0.10) * 1.42, 0, 1)
    bb = np.clip((heat - 0.75) * 1.6, 0, 1)
    white = np.clip((heat - 0.92) * 3.0, 0, 1)
    rr = np.maximum(rr, white)
    gg = np.maximum(gg, white * 0.99)
    bb = np.maximum(bb, white * 0.94)
    return Image.fromarray(
        (np.dstack([rr, gg, bb, alpha]) * 255).astype(np.uint8),
        "RGBA",
    )

def ribbon_mask(points, width, blur_radius=2.0):
    image = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(image)
    draw.line(points, fill=255, width=width, joint="curve")
    if blur_radius:
        image = image.filter(ImageFilter.GaussianBlur(blur_radius))
    return np.asarray(image, dtype=np.float32) / 255.0

def projectile_frame(index):
    t = index / COUNT
    phase = 2 * math.pi * t
    cx = 300 + 4 * math.sin(phase)
    cy = 256 + 3 * math.sin(phase * 1.7)
    xx = X - cx
    yy = Y - cy
    radius = np.sqrt((xx / 58) ** 2 + (yy / 48) ** 2)

    orb = np.exp(-(radius ** 2) * 2.3)
    core = np.exp(-(((xx / 28) ** 2) + ((yy / 22) ** 2)) * 3.5)
    rim = np.exp(-((radius - 0.86) / 0.18) ** 2) * (
        0.70 + 0.30 * np.cos(np.arctan2(yy, xx) * 4 - phase * 2.4)
    )

    alpha = np.clip(0.92 * orb + 0.25 * rim + 0.98 * core, 0, 1)
    heat = 1.05 * orb + 0.35 * rim + 1.45 * core

    # Narrow, independent flame ribbons. There is deliberately no shared
    # translucent triangular/tapered base layer behind the projectile.
    specs = [
        (-18, 10, 145, 17),
        (-7, 14, 122, 13),
        (5, 16, 132, 15),
        (17, 10, 108, 11),
        (-28, 7, 92, 9),
        (28, 7, 88, 9),
    ]
    for ribbon_index, (dy, amp, length, width) in enumerate(specs):
        points = []
        wobble = phase * (1.8 + ribbon_index * 0.13) + ribbon_index * 0.9
        for step in range(28):
            q = step / 27
            px = cx - 20 - length * q
            py = cy + dy * (1 - q * 0.15) + amp * math.sin(wobble + q * 5.2) * (q ** 0.85)
            points.append((int(px), int(py)))

        mask = ribbon_mask(points, width, 1.6)
        qfield = np.clip((cx - X - 10) / max(length, 1), 0, 1)
        fade = np.clip(1 - qfield * 0.88, 0.10, 1)
        mask *= fade
        alpha = np.maximum(alpha, mask * (0.72 if ribbon_index < 4 else 0.55))
        heat = np.maximum(heat, mask * (0.98 if ribbon_index < 4 else 0.72))

    for tongue_index, base_angle in enumerate([2.55, 2.82, 3.10, 3.35, 3.62]):
        angle = base_angle + 0.13 * math.sin(phase * 2 + tongue_index)
        start_x = cx + math.cos(angle) * 52
        start_y = cy + math.sin(angle) * 44
        end_x = cx + math.cos(angle) * (90 + 10 * math.sin(phase + tongue_index))
        end_y = cy + math.sin(angle) * (70 + 8 * math.cos(phase * 1.4 + tongue_index))
        mask = ribbon_mask(
            [
                (int(start_x), int(start_y)),
                (int((start_x + end_x) / 2), int((start_y + end_y) / 2)),
                (int(end_x), int(end_y)),
            ],
            7,
            1.2,
        )
        alpha = np.maximum(alpha, mask * 0.58)
        heat = np.maximum(heat, mask * 0.80)

    alpha = np.where(alpha < 0.035, 0, alpha)
    image = rgba_from_masks(alpha, heat)

    # Tight glow only around real visible alpha; no broad underlayer.
    glow_alpha = image.getchannel("A").filter(ImageFilter.GaussianBlur(7))
    glow = Image.new("RGBA", (SIZE, SIZE), (255, 115, 0, 0))
    glow.putalpha(glow_alpha.point(lambda value: int(value * 0.30)))
    image = Image.alpha_composite(glow, image)

    sparks = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sparks, "RGBA")
    rng = np.random.default_rng(7500 + index)
    for _ in range(24):
        spark_x = cx - rng.uniform(35, 165)
        spark_y = cy + rng.normal(0, 24)
        radius = rng.uniform(1.2, 3.7)
        draw.ellipse(
            (spark_x - radius, spark_y - radius, spark_x + radius, spark_y + radius),
            fill=(255, int(rng.uniform(115, 195)), 0, int(rng.uniform(90, 200))),
        )
    image = Image.alpha_composite(image, sparks.filter(ImageFilter.GaussianBlur(0.5)))

    pixels = np.array(image)
    pixels[pixels[:, :, 3] < 4] = 0
    return Image.fromarray(pixels, "RGBA")

def validate(images):
    for index, image in enumerate(images, 1):
        assert image.size == (512, 512)
        assert image.mode == "RGBA"
        alpha = np.asarray(image.getchannel("A"))
        visible = int((alpha > 0).sum())
        weak = int(((alpha > 0) & (alpha < 32)).sum())
        coverage = visible / float(SIZE * SIZE)
        weak_ratio = weak / float(max(visible, 1))
        assert coverage < 0.15, (index, coverage)
        assert weak_ratio < 0.35, (index, weak_ratio)

def main():
    FRAMES.mkdir(parents=True, exist_ok=True)
    ATLASES.mkdir(parents=True, exist_ok=True)
    images = []

    for index in range(COUNT):
        image = projectile_frame(index)
        path = FRAMES / f"sprite_skill_fireball_2_projectile_{index + 1:02d}.png"
        image.save(path, compress_level=6)
        images.append(image)

    validate(images)

    atlas = Image.new("RGBA", (SIZE * COUNT, SIZE), (0, 0, 0, 0))
    for index, image in enumerate(images):
        atlas.alpha_composite(image, (index * SIZE, 0))
    atlas.save(
        ATLASES / "sprite_skill_fireball_2_projectile_atlas_01.webp",
        "WEBP",
        quality=92,
        method=6,
    )
    assert atlas.size == (6144, 512)
    print("Fireball 2 projectile alpha cleanup GREEN: 12x 512 RGBA + atlas")

if __name__ == "__main__":
    main()
