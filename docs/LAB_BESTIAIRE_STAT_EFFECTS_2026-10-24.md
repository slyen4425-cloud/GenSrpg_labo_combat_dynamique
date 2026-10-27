# Bestiaire — effets sous les statistiques (24 octobre 2026)

## Demande
Afficher sous chaque statistique de la fiche Bestiaire **exactement la description des effets de l'éditeur**, discrète et lisible sur smartphone.

## Diagnostic
L'éditeur possédait l'unique formatage auteur `humanStatEffectSummaryV1` dans `src/ui/capture-editor-human-v2.js`. Il utilise déjà `projectCaptureStatDefinitionEffectsV1` (propriétaire combat) et `normalizeCaptureStatRegistryV1` (contrat). Le Bestiaire n'avait que la paire libellé/valeur.

## Solution sans double autorité
- Extraction **à l'identique** du code de formatage `humanStatEffectSummaryV1` vers `src/ui/capture-stat-effect-summary-v1.js`, export `captureStatEffectSummaryV1`.
- L'éditeur conserve l'API publique `humanStatEffectSummaryV1` comme **alias** de la fonction partagée, sans copie du calcul.
- Le modèle Bestiaire utilise la **même fonction** et les définitions du registre déjà chargé : `effectSummary` est une donnée de présentation, pas une statistique supplémentaire.
- La vue affiche une légende `<small>` sous le libellé/valeur, faible contraste, retours à la ligne et disposition mobile.
- Définitions de stats inconnues : ne pas inventer d'effet ; aucune légende. Les définitions sans effets utilisent exactement « Aucun effet de combat configuré ».
- Les 5 compétences, le seul portrait face, l'unique loadout et la navigation des fiches restent inchangés.

## Gouvernance
Base `gh-pages@a422762cb7593344e5c60adbfdaca2fdfea151f2`.
Checkpoint de départ `checkpoint/lab-start-bestiary-stat-effects-2026-10-24`.
Branche `work/lab-bestiary-stat-effects-2026-10-24`.
Périmètre : `src/ui/capture-stat-effect-summary-v1.js` (propriétaire partagé), `src/ui/capture-editor-human-v2.js` (déplacement du code, non refonte), `src/ui/capture-bestiary-cards-v1.js`, `examples/dom-demo/bestiary.{js,css}`, tests de modèle et navigateur, docs. Aucune modification de la registry, des valeurs, gameplay, assets, `main` ou GenSrpG principal.

## Validation
Sentinelles unitaires : PV, temps de charge, poison dégâts/résistance, zéro effet, stat inconnue, preuve que l'éditeur importe le seul formateur partagé.
Test navigateur Chromium : valeurs de Venombre depuis le transfert publié et légendes sous les stats.
CI globale 5 jobs GREEN, puis checkpoint de fin et fusion en `gh-pages`. Validation graphique smartphone utilisateur distincte.
