# Capture — Reconnaissance du préréglage FX au rechargement V1

Date : 13 octobre 2026.

## Problème confirmé et cause
Après avoir choisi l'intensité la plus haute (« Spectaculaire ») et enregistré sa capacité, l'auteur revient dans l'éditeur et voit « Conserver mes réglages actuels », ce qui laisse croire que le preset n'a pas été enregistré.
- `writeSkillFeedbackControlsV1` charge pourtant depuis la source les vraies valeurs de `presentation.feedback` (Glow, cast, trail, burst, smoke, secousse).
- La fonction appelée ensuite `refreshSkillFxQuickControlStateV1(root,{resetSelection:true})` remplaçait **toujours** le choix d'intensité par `current`. C'était une régression de présentation, pas la preuve d'un effacement des valeurs d'auteur.
- Le sélecteur spécifique « Présence du glow » reconnaissait déjà correctement ses valeurs numériques. Pas de besoin d'un second champ sauvegardé.

## Correctif minimal
- `src/ui/capture-fx-quick-mode-v1.js` : helper pur `captureFxQuickProfileIdForValuesV1` à partir des mêmes signatures de Glow et particules déjà possédées par `capture-fx-glow-presets-v1` et `capture-fx-particle-presets-v1`, plus la secousse. Reconnaît seulement la correspondance exacte des 3 presets et sinon `current`.
- `src/ui/capture-editor-human-v2.js` : lors du rechargement des champs FX, dériver l'intensité affichée des valeurs numériques déjà chargées, plutôt que forcer `current`. Sur sélection de preview, le contenu source ne change pas ; bouton « Appliquer » requis pour réécrire les champs, puis l'enregistrement existant de la capacité. Si déjà appliqué à l'identique, bouton désactivé et texte explicite.
- Ne pas modifier les paramètres auteur, les presets définis, le moteur, le stockage, les visuels ou un fichier de capacité.

## Régression réelle
- La nouvelle fiche Arc électrique `lib_chain_lightning` contient effectivement `glow strength=.85 radius=32`, la signature complète des particules « intense » et `impactShakeAmplitude=9` : le choix « Spectaculaire » doit réapparaître à la réouverture.
- Des valeurs personnalisées restent « Conserver mes réglages actuels » et le bouton « Appliquer » demeure obligatoire sur un nouveau choix.
- Sentinelle RED préalable : `tests/unit/capture-fx-quick-reload-v1.test.mjs`, commit `a6c94079cac6a645df310142230c521e368ba1ef`; compare le vrai transfert Showcase, toutes les signatures numériques, isolation des champs source, et garde contre application implicite.

## Protocole
- Base LIVE `gh-pages@2ceb7aabc01ec47233dfea63ebc0e26609d6a122` CI `38459071974` SUCCESS, Pages `38459071845` SUCCESS ; checkpoint départ `checkpoint/lab-start-fx-quick-preset-reload-v1-2026-10-13`, branche dédiée `work/lab-fx-quick-preset-reload-v1-2026-10-13`.
- Un propriétaire existant (éditeur) + helper UI pur, aucun code Core/Combat ni effet sur 1v1/2v2, 103 créatures, assets, audio, data Showcase, `main`, `global-assets`, GenSrpG principal, Exploration.
- Foundation + 2 suites Chromium requises au SHA documentaire final ; checkpoint GREEN sur ce SHA, lease FF production et postpublication CI/Pages. La reconnaissance sur Android paysage reste à confirmer par l'auteur.

## Immobilisation — diagnostic indépendant (pas de changement gameplay dans ce lot)
La branche Gameplay `resolveMovement` rejette un déplacement volontaire sous `immobilize`. `resolveSkillStart` ne bloque en revanche que `stun` et `silence` ; l'animation d'approche d'une attaque de contact reste autorisée. Le mode de jeu automatique ne propose pas nécessairement un mouvement volontaire à observer : effet perçu « ne fonctionne pas ». Le contrat distinct de Stun doit être clarifié avant de changer les règles du moteur.
