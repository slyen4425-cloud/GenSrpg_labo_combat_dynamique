# LAB — Capture Skill Icons V2 — Assets

Date : 2026-10-11.

## Périmètre et ownership

Huit nouvelles icônes de capacités Monster Capture **uniquement visuelles**. Source unique : branche `global-assets`, catalogue `data/assets/catalog/global-visual-assets.v1.json`. Aucun changement de règles de combat, de compétences, de `configuredSkills`, du renderer, de l’éditeur ou de `main` ; les nouvelles icônes se choisissent explicitement dans l’éditeur, sans remplacement automatique.

- Base `global-assets` : `d39afa6b69de7abb830f9742a5daa4b02ab8239e`.
- Checkpoint départ : `checkpoint/global-assets-before-capture-skill-icons-v2-2026-10-11`.
- Branche de travail : `work/global-assets-capture-skill-icons-v2-2026-10-11`.
- Fichiers : `assets/library/capture/icons/skills/icon_skill_*_01.webp` et manifeste de provenance V2.
- Tests : `tests/unit/capture-skill-icons-v2.test.mjs` + CI complète.

## Inventaire

- Secousse sismique — `pack:capture:icon-skill-seismic-shock-01` — `icon_skill_seismic_shock_01.webp`.
- Fleuraison énergie — `pack:capture:icon-skill-energy-blossom-01` — `icon_skill_energy_blossom_01.webp`.
- Morsure brûlante — `pack:capture:icon-skill-burning-bite-01` — `icon_skill_burning_bite_01.webp`.
- Onde de soin — `pack:capture:icon-skill-healing-wave-01` — `icon_skill_healing_wave_01.webp`.
- Impact rocheux — `pack:capture:icon-skill-rock-impact-01` — `icon_skill_rock_impact_01.webp`.
- Charge tellurique — `pack:capture:icon-skill-earth-charge-01` — `icon_skill_earth_charge_01.webp`.
- Tempête de flammes — `pack:capture:icon-skill-flame-storm-01` — `icon_skill_flame_storm_01.webp`.
- Jet pressurisé — `pack:capture:icon-skill-pressurized-jet-01` — `icon_skill_pressurized_jet_01.webp`.

## Validation attendue

- 8 WebP réels de 128 × 128 (RGB, sans canal alpha, avec cadre doré), SHA-256 validés depuis le ZIP source ;
- 8 IDs uniques, conservation des 122 assets existants ; nouveau total de 130 assets dont 45 icônes ;
- aucun média runtime référencé via un chemin `work/` ni ZIP ;
- CI verte sur SHA exact avant checkpoint GREEN et fast-forward non forcé de `global-assets` ;
- raccord séparé côté `gh-pages` en modifiant seulement la révision du catalogue, avec sa CI.

## Limite

Le test visuel utilisateur sur téléphone reste requis pour constater l'affichage final dans l'éditeur. Aucune capacité ne reçoit automatiquement ces nouvelles icônes.
