# Mise à jour auteur — Gemmor / Coupe feuille (2026-11-04)

## Provenance et périmètre
- Demande « place ceci » accompagnée de deux exports de l'éditeur officiel, fournis directement par l'auteur :
  - `gensrpg-capture-creature-crea_crys_2(1).json`, schéma `capture-creature-transfer-v1`, ID `crea_crys_2`/nom actuel `Gemmor`.
  - `gensrpg-capture-skill-coupe_feuille(2).json`, schéma `capture-skill-transfer-v1`, ID `coupe_feuille`.
- Aucun enregistrement ajouté : les deux fichiers source autoritaires du Showcase étaient déjà présents et déclarés **une seule fois** dans les listes officielles de presets.
- Base `gh-pages@52a06768b7bbfb4733b29e393873d02cf2b7c888`. START `checkpoint/lab-start-gemmor-coupe-feuille-author-2026-11-04` ; WORK `work/lab-gemmor-coupe-feuille-author-2026-11-04`.

## Comparaison exacte des documents complets
Un diff structurel récursif `JSON.parse` entre chaque export joint et son fichier `data/capture/showcase` a identifié **exactement trois différences de valeur**, vérifiées avant toute écriture :
1. `crea_crys_2.draft.presentation.viewOverrides.player.displayScale` : `1.7 → 1.4`.
2. `crea_crys_2.draft.presentation.viewOverrides.opponent.displayScale` : `1 → 0.7`.
3. `coupe_feuille.draft.definition.projectileClash.power` : `0 → 1`.

Tous les autres champs des deux documents sont identiques : espèce/noms tels que saisis, niveau, statistiques, compétences, loadout, timing, dégâts, 30% `ignoreResistancePct`, 30% `ignoreDamageReductionPct`, paramètres d'animation, ID/refs des sprites. La fiche `Gemmor` comporte déjà un visuel `creature-plante-carnivore` : il **précédait** les exports et demeure volontairement inchangé ; ne pas « corriger » silencieusement la créature.

## Livraison et tests
- Modifications limitées aux **deux JSON autoritaires existants** dans `data/capture/showcase/`, au test sentinelle et aux documents de chantier. Pas de deuxième version, pas de renumérotation, pas de mutation des sauvegardes locales.
- `tests/unit/capture-gemmor-coupe-feuille-author-2026-11-04.test.mjs` : en base RED car échelles `1.7/1` et clash power `0` ; après mise à jour attendu GREEN : identifiants, schémas, échelles `1.4/0.7`, puissance `1`, skills, loadout et assignation visuelle, listes officielles sans doublon.
- Le client `hydrateCaptureShowcaseSkillPresetsV1` / `hydrateCaptureShowcaseCreaturePresetsV1` lit ces mêmes chemins par `fetch(...,{cache:"no-store"})` ; aucune nouvelle source ni cache à invalider.
- Gates : CI Foundation + 4 navigateurs sur SHA final, checkpoint GREEN exact, PR puis fusion `gh-pages`. La diffusion GitHub Pages et la vérification sur les appareils de l'auteur restent distinctes. `main` et autres labos ne sont pas modifiés par ce lot.
