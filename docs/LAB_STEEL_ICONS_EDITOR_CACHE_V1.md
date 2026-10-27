# Raccord des 4 icônes Acier au labo combat — 20 octobre 2026
## Source réelle
`global-assets` commit `a989443b9985b3f444f5ea3b4c26f9c215ae04e4` : 4 vrais WebP RGB 128×128 et manifeste de provenance. Images validées depuis archive ZIP utilisateur par SHA-256, et conservées byte-for-byte via SHA blob Git original. Dossier canonique `assets/library/capture/icons/skills/`.
- `pack:capture:icon-skill-carapace-acier-01`
- `pack:capture:icon-skill-lame-acier-01`
- `pack:capture:icon-skill-tourbillons-rouille-01`
- `pack:capture:icon-skill-aile-acier-01`

## Éditeur / scope
`gh-pages` base `e1ffa2f3ad649d632308dcdbf7a8cbce437637cb`, travail `work/lab-steel-icons-editor-cache-2026-10-20`, checkpoint départ `checkpoint/lab-start-steel-icons-editor-cache-2026-10-20`. Module existant `src/assets/global-visual-library.js` charge toujours le catalogue et les médias depuis `global-assets`, révision cache `2026-10-20-v37-four-steel-skill-icons`. La sentinelle de résolution vérifie les 4 IDs et URLs. Pas de catalogue bis, fallback de médias, changement gameplay, compétence ou sérialisation.

Tests et validation : `npm run ci` + GitHub Actions et Pages au SHA publié, puis vérification utilisateur sur smartphone en sélectionnant les 4 icônes dans l'éditeur. GREEN technique ne signifie pas preview utilisateur validée.
