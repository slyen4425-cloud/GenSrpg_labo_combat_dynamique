from pathlib import Path
import shutil,json
root=Path("assets/library/capture/creatures/scorpion")
assert root.exists()
assert (root/"animations").exists()
shutil.rmtree(root)
cat=json.loads(Path("data/assets/catalog/global-visual-assets.v1.json").read_text())
assert not any(a["id"].startswith("pack:capture:scorpion-") for a in cat["assets"])
assert Path("scorpion_2_animations_validees_8_frames.zip").exists()
assert Path("scorpion_course_corrigee_8_frames_depot.zip").exists()
print("CLEAN: scorpion wrongly classified runtime files removed; source ZIPs preserved")
