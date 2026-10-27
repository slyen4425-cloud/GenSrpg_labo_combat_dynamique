# Raccord d'icônes Air Capture — 13 octobre 2026

Base `gh-pages` : `ffd0318fb7b45ae1fd2a1caab6c9711e12d6c818`. Checkpoint de départ `checkpoint/lab-start-capture-air-icon-bindings-v1-2026-10-13` ; branche travail `work/lab-capture-air-icon-bindings-v1-2026-10-13`.

Bibliothèque canonique `global-assets` publiée sur `6f0b006693d672c20a79d93d32582205fa3eed64`, CI assets `38336144478` SUCCESS et checkpoint `checkpoint/global-assets-capture-air-icons-v1-green-2026-10-13`.

Cette évolution change **seulement l'icône de présentation** des deux compétences existantes :

- `lib_gust` (Rafale) : `pack:capture:icon-skill-rafale-01`.
- `cap_air_atk_3` (Charge aérienne) : `pack:capture:icon-skill-aerial-attack-01`.
- `pack:capture:icon-skill-souffle-01` est disponible dans l'éditeur, non affectée automatiquement car il n'y a pas de skill actif homonyme.

Le cache de bibliothèque passe à `2026-10-13-v29-capture-air-icons`, sans second résolveur ni duplicata de catalogue. Les JSON restent des exports auteurs, avec une seule modification de `presentation.visual.icon.assetId` ; les coûts, effets, sprites, sons, mouvement, portée, cooldowns et FX existants sont inchangés.

Fichiers : les 2 JSON, `src/assets/global-visual-library.js`, sentinelle neuve, sentinelle historique Tailwind (revision >=v28), `docs/LAB_CURRENT_WORK.md`, présent rapport.

Critères GREEN technique : tests unité et chemin transfert → présentateur → résolution `assetId` → URL de bibliothèque, CI Node/Chromium de vrai repo sur SHA exact, checkpoint puis FF `gh-pages`. Validation visuelle Android utilisateur séparée, non présumée.

Interdits : `main`, `Zombicide-40k`, laboratoire Exploration, Combat Rules, FX Core, editor DOM, changement de n'importe quelle autre compétence, nouvelle API d'asset.
