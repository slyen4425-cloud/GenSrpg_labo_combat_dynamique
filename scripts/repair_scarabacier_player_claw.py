#!/usr/bin/env python3
"""Remove the detached clipped claw fragment from Scarabacier's PLAYER rear view.

Only the confirmed artifact at lower-left is modified; all other assets and
catalog IDs are left untouched. Fails closed on unexpected source bytes.
"""
from __future__ import annotations

from hashlib import sha256
from pathlib import Path
import sys

from PIL import Image, ImageDraw, ImageFilter
import numpy as np

IMAGE = Path("assets/library/capture/creatures/scarabacier/runtime/scarabacier_player.webp")
EXPECTED_SHA256 = "1a36c39c1af33d649fba0e5f8ee4753bf011be3f2b0cbd76e6035ef9868b7c0d"
if not IMAGE.is_file():
    raise SystemExit("Missing real Scarabacier player WebP")
source = IMAGE.read_bytes()
digest = sha256(source).hexdigest()
if digest != EXPECTED_SHA256:
    raise SystemExit(f"Refusing unreviewed source SHA256: {digest}")
before = Image.open(IMAGE).convert("RGBA")
if before.size != (1024, 1024):
    raise SystemExit("Unexpected image dimensions")
arr = np.array(before)
if not ((arr[785:822, 175:211, 3] > 20).sum() > 150):
    raise SystemExit("Expected damaged claw fragment is not present")

# Mask ONLY the unattached, truncated gold toe below/left of rear paw.
mask = Image.new("L", before.size, 0)
draw = ImageDraw.Draw(mask)
draw.polygon([(166, 761), (182, 761), (195, 771), (211, 789),
              (214, 823), (169, 829)], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(1.0))
m = np.asarray(mask, dtype=np.float32) / 255.0
arr[:, :, 3] = (arr[:, :, 3] * (1.0 - m)).astype(np.uint8)
after = Image.fromarray(arr, "RGBA")
# Regenerate the physical WebP with a true alpha channel, preserving fidelity.
after.save(IMAGE, "WEBP", quality=91, method=6, exact=True)
check = Image.open(IMAGE).convert("RGBA")
if check.size != (1024, 1024):
    raise SystemExit("Bad exported dimensions")
alpha = np.asarray(check.getchannel("A"))
if np.count_nonzero(alpha[786:825, 173:214] > 20):
    raise SystemExit("Floating claw fragment remains")
if np.count_nonzero(alpha[704:770, 184:315] > 20) < 3500:
    raise SystemExit("Leg appears damaged by repair")
if alpha[0, 0] != 0 or alpha[1023, 1023] != 0:
    raise SystemExit("Loss of transparent background")
print("Scarabacier rear-claw cleanup OK")
print("Artifact:", IMAGE)
print("SHA256:", sha256(IMAGE.read_bytes()).hexdigest())
print("Size:", IMAGE.stat().st_size)
