# Bouclier de lumière — Cast et Barrière (40 images)

- Deux animations : `cast` (20 frames) et `barrier` (20 frames).
- Sources : deux grilles PNG RGBA 1402×1122 (5×4).
- Sorties : 40 PNG RGBA 512×512 (agrandissement des cases d’environ 280×280, **pas une résolution native 512**) et 2 atlas WebP alpha 7680×384 (20 cellules 384×384).
- Barrier frame 20 = shield fully formed; manifest states `hold_last_frame=true`, `hold_frame_index=19`, `playback_mode=once` (this is a presentation contract, actual runtime behavior must be verified separately).
- `assetId` cast: `pack:capture:sprite-light-shield-cast-01`; barrier: `pack:capture:sprite-light-shield-barrier-01`.
- FPS/size are defaults editable in skill editor; no combat rules/damage changes.
- `provenance.csv`: byte SHA-256 for each PNG and original source.
