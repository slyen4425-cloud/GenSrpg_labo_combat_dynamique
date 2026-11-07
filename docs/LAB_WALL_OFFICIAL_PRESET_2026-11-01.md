# Mur de glace — reprise du preset officiel depuis l'export utilisateur (2026-11-01)

## Demande et base
- L'utilisateur a envoyé `gensrpg-capture-skill-mur_de_glace.json` puis a demandé que sa **configuration corrigée soit remplacée dans la bibliothèque officielle**, sans import manuel répétitif.
- Base officielle `gh-pages@f5586947930a9a06ef250256c0f66bfb26d05397` (CI et Pages post PR #181 : success).
- START `checkpoint/lab-start-wall-official-preset-2026-11-01`, work `work/lab-wall-official-preset-2026-11-01`.
- Autorité unique : `data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json` et **un seul** enregistrement `mur_de_glace` dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. Pas de duplication de compétence, d'ID ni de moteur.

## Contenu publié voulu
- Conserver l'identité `mur_de_glace`, type **défensif sur soi**, `approachMode: none`, cible `self`, niv. 10, coût énergie 5, préparation 900 ms, recharge 45 s, utilisation en Capture/Combat.
- Effet natif `summon_entity/barrier` : stat officielle `glace`, coefficient **1 PV par point**, interception `projectile`, `beam`, `contact`, sprite provisoire fourni **`pack:capture:sprite-status-stone-shell-01`**, scale 1 et offsets 0. L'ID existe dans le catalogue global-assets ; on ne copie ni ne duplique le média.
- La correction technique `form: self` remplace le choix ancien `contact`; pas de déplacement. `dodgeable: false` reprend l'export corrigé de l'utilisateur.
- Préserver le bloc `presentation` officiel (id/version/metadata, actuellement sans FX), car le sprite de mur est défini dans l'effet et la bibliothèque ne doit pas perdre son identité de présentation.
- Remplacer la description provisoire utilisateur par l'explication complète de la version corrigée (précondition Glace non nulle).
- Le catalogue historique source, `main`, GenSrpg et Exploration ne sont pas modifiés.

## Preuves TDD et publication
- Test RED `tests/unit/capture-wall-official-preset-2026-11-01.test.mjs` sur l'ancien preset, Foundation `41301148364` FAILURE attendu : niv. ancien 1 au lieu de 10 et coût 3 au lieu de 5.
- Modifier le preset officiel, actualiser la sentinelle de l'import précédente (`capture-wall-activation-feedback`), et vérifier en **vrai Chromium** via `capture-ice-barrier-editor-smoke` que le chargement automatique de la bibliothèque présente niv. 10, coût 5, préparation 900, forme self, et le sprite. Aucune réimportation.
- `hydrateCaptureShowcaseSkillPresetsV1` charge le fichier avec `fetch(cache: no-store)`, et `applyCaptureTransferBatchToEditorStateV1` remplace les presets à l'ouverture : ne pas fabriquer un second catalogue ou stockage.
- Attendre Foundation et quatre contrôles Chromium GREEN sur HEAD documentation final avant checkpoint GREEN exact, PR `gh-pages`, puis CI+Pages post fusion. Test Android utilisateur distinct.
