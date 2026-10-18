# Import réel — Ombre + Drain de vie

Branche : work/lab-shadow-life-drain-vfx-2026-10-18
Importer, sans décompression, les deux ZIP EXACTS dans _incoming/ par Add file > Upload files :

- capture_shadow_spell_vfx_40frames.zip (13,56 MB)
- capture_life_drain_vfx_40frames.zip (14,70 MB)

Les deux fichiers doivent être présents pour déclencher l'import; leur SHA-256, les vrais PNG RGBA 512, les 4 atlas WebP, leur provenance et le catalogue sont validés AVANT publication. Le workflow vérifie npm run ci puis commite les 80 images, 4 atlas et 4 nouveaux IDs.

Ne pas déclarer GREEN tant que les octets binaires réels ne sont pas sur GitHub, CI vérifiée, puis catalogue et cache gh-pages publiés.
