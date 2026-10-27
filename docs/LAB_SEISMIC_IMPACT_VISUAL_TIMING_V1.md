# Séisme — Moment de l'impact visuel et séquence rapide (11 octobre 2026)

## Diagnostic
Le moteur de combat lançait `impact`, le sprite d'impact et `feedback.impactFlash` au même instant que `feedback.cameraShake`. Dans Séisme primordial, le flash blanc semblait donc précéder les secousses et brouillait leur lecture.

## Règle et propriété des données
Le propriétaire reste `SkillPresentationBindingV4.feedback.cameraShake` (hérité de V5 à V10), sans modifier le résultat ni les événements Gameplay. Un nouveau champ **optionnel** `impactVisualTiming` peut avoir :
- `immediate` : effet visuel au même instant que la secousse (comportement antérieur ; omis à la sérialisation) ;
- `during` : effet au milieu de la durée réelle de toutes les secousses, pauses comprises ;
- `after` : effet à la fin de la durée réelle de toutes les secousses, pauses comprises.

Les durées des secousses et pauses proviennent uniquement de `feedback.cameraShake.sequence`, sinon de `durationMs` simple. Les valeurs non reconnues sont rejetées par le contrat. Aucun chronomètre additionnel, déplacement du Gameplay, réécriture des compétences existantes ou second système de caméra.

## Renderer
Le propriétaire `DomSkillFxRenderer` appelle la caméra native immédiatement et applique le décalage uniquement au sprite d'impact, son flash, ses particules de burst et sa fumée ; toutes les animations sont gérées par Web Animations et son timing `delay`, avec conservation du mode original à délai zéro. Les animations de sprite sont aussi décalées en interne pour éviter une dernière frame prématurée. Tous ces effets restent annulables lors de dispose, et l'ancien comportement de collision/projection de dégâts est intact.

## Éditeur
**Enrichissement FX → Réglages experts → Quand montrer l'impact visuel ?** : `Dès le début`, `Pendant les secousses`, `Après les secousses`.
**Préparer 4 secousses de séisme** crée des impulsions consécutives éditables : 
1. 4 px / 180 ms, pause 0 ;
2. 9 px / 220 ms, pause 90 ;
3. 16 px / 320 ms, pause 120 ;
4. 7 px / 210 ms, pause 130.

Le préréglage sélectionne `Après les secousses` et remplace les lignes de secousses **uniquement si l'utilisateur clique**, sans modifier les exports déjà enregistrés. Chacun des quatre réglages reste éditable et exportable.

## Gouvernance et tests
- Base : `gh-pages` `d6efed13c3b900a093e299c44be36d3491011341` ; `checkpoint/lab-start-seismic-impact-visual-timing-v1-2026-10-11`.
- Travail isolé : `work/lab-seismic-impact-visual-timing-v1-2026-10-11`.
- Sentinelle : `tests/unit/camera-impact-visual-timing-v1.test.mjs`, plus suites existantes `camera-shake-sequences-v1` et régressions UI/Gameplay.
- CI Foundation + smokes Chromium : nécessaire sur le SHA final avant checkpoint GREEN et fast-forward sous lease ; Pages+CI à recontrôler après publication.
- Validation artistique Android manuelle séparée : appliquer ce réglage à Séisme primordial et vérifier avec Moussados que le flash/sprite surviennent après les secousses ; le changement n'affecte pas l'instant des dégâts.
