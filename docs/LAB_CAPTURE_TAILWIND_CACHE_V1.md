# LAB — Raccord cache de Vent arrière — Capture

Date : 2026-10-11.

- Autorité média : `global-assets` SHA `c262eeaf4bbdc242409728e680e50bfffab0e121` et CI assets SUCCESS (1 WebP réel `assets/library/capture/icons/skills/icon_skill_tailwind_feather_01.webp`, ID `pack:capture:icon-skill-tailwind-feather-01`, 135 assets dont 46 icônes).
- Branch consommateur : base `gh-pages` SHA `b804d02b31aafda55e500e311ca77512f1d62819`, checkpoint `checkpoint/lab-start-capture-tailwind-cache-v1-2026-10-11`, branche `work/lab-capture-tailwind-cache-v1-2026-10-11`.
- Périmètre : seule révision `GLOBAL_VISUAL_LIBRARY` `v27` -> `v28`, sentinelle Tailwind, maintien rétrocompatible de la sentinelle VFX Air, documentation. Aucun média copié côté client et aucun changement des créatures/capacités/règles/renderer/fichiers auteur.
- `src/assets/global-visual-library.js` reste propriétaire unique de l'URL et du paramètre `v`. Test dédié `tests/unit/capture-tailwind-icon-global-library-v1.test.mjs` vérifie le chemin de résolution, l'ID exact et la version. Test Air reste actif, mais n'impose plus l'ancienne chaîne exacte (minimum v27).
- Avant sortie : CI foundation + navigateur au SHA final, checkpoint GREEN exact, fast-forward non forcé de `gh-pages`, puis CI et déploiement Pages sur SHA publié. Test smartphone de l'utilisateur requis pour validation visuelle finale.
- L'icône est **disponible dans le catalogue** mais n'est **pas affectée automatiquement à la compétence Vent arrière** : l'utilisateur pourra la choisir dans la Bibliothèque GenSrpG du Human Editor. Cette séparation est voulue pour préserver les réglages auteur.
