# Labo Combat — Intégration Graine sansue (28 octobre 2026)

## Sources utilisateur et identité

- `gensrpg-capture-skill-graine_sansue_cap(1).json` — SHA256 `b74b469b12c0f6206467ce7a1272eef1a5a0768643616e00a7eeefe6e12ef1da` ; archive originale `data/capture/source-exports/gensrpg-capture-skill-graine_sansue_cap-2026-10-28.json`.
- `gensrpg-marqueurs.json` — SHA256 `7f15ebda6c3cfb874ada2da952d3012ea0934cfcc7cb80aea34b9c0b68387a18` ; archive originale `data/capture/source-exports/gensrpg-marqueurs-2026-10-28.json`.
- Une source de vérité runtime par responsabilité : compétence `data/capture/showcase/graine_sansue_cap.capture-skill-transfer-v1.json`, listée une fois dans `src/catalogs/capture-showcase-skill-presets-v1.js` ; marqueurs `data/capture/showcase/markers.capture-markers-v1.json` et `captureMarkerSeedLibraryV1`. Les archives servent uniquement de provenance.

## Définition validée et portabilité

`graine_sansue_cap` : capacité de niveau 5 / élément Nature, énergie 5, préparation 900 ms, trajet 900 ms, recharge 45 s ; projectile avec sprites de cast Nature / projectile Terre / impact Nature tels que fournis. Le seul effet `apply_marker` ajoute 1 charge de `graine-sansue` sur la cible.

`graine-sansue` : négatif, durée 20 s, plafond 10 charges, icône `pack:capture:icon-skill-sangsue-01`, drain périodique `life_steal` avec dégâts de base 5 **par charge**, toutes les 3 s, calcul combat, canal Nature, soigne 100 % des **PV réellement retirés** à la cible grâce au propriétaire `StatusEffectRuntime` existant. Aucun moteur local, soin parallèle ni timer additionnel.

La bibliothèque reçue contient 5 IDs uniques : `poison`, `venin-static`, `eclat-spirituel`, `peste`, `graine-sansue`. Les trois définitions déjà présentes sont conservées exactement ; `poison` correspond aux deux compétences existantes `cap_poison_atk_2` et `cap_poison_atk_7`; le marqueur `graine-sansue` imbriqué dans la capacité est strictement identique à celui de la bibliothèque. Rien n'est associé automatiquement à une fiche créature.

## Livraison / validation

- START `gh-pages@ff1c92ec79940267db39df468518301e2de8ddea`, `checkpoint/lab-start-graine-sansue-marker-skill-2026-10-28` ; développement `work/lab-graine-sansue-marker-skill-2026-10-28`, PR #117.
- TDD RED : `tests/integration/capture-graine-sansue-author-transfer-2026-10-28.test.mjs` et ajout sentinelle du vrai éditeur dans `tests/browser/capture-creature-library-smoke.mjs` avant import.
- Tests d'immutabilité de l'archive historique actualisés pour valider l'ancienne **et** la nouvelle source. Interdit de masquer un conflit marqueur.
- Révision cohérente de la chaîne HTML → entry → UI → registre `graine-sansue-20261028`, conservant la version ESM canonique du propriétaire de bibliothèque de marqueurs. Aucun changement `global-assets` (tous les IDs de sprites/icônes référencés existent déjà dans son catalogue) ni `main`.
- Portes de publication : CI Foundation + 4 Chromium succès au même SHA ; checkpoint GREEN ; fusion PR vers gh-pages ; CI/Pages réussies au SHA fusionné ; test manuel Android pour confirmer le rendu.
