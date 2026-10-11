# Labo Combat — FX Capture : parcours unique Style → Intensité → Personnaliser

Date : 11 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Objectif

L'utilisateur a relevé la juxtaposition de deux « modes simples » et de plusieurs préréglages (pack de style, intensité globale, Glow et Particules). Ces commandes ne constituent pas deux moteurs, mais des vues sur les mêmes valeurs de présentation. Le problème est **la concurrence apparente dans l'interface**, et non une deuxième autorité runtime.

## Modification

Une seule section `data-skill-fx-unified-flow`, dans l'onglet « Effets visuels » :

1. **Choisir un style** : bibliothèque préexistante `CAPTURE_FX_STARTER_PROFILES_V1` (feu, eau, électricité, soin, etc.), bouton `Appliquer ce style`. Un style sur une compétence déjà équipée conserve ses médias d'auteur ; sur une nouvelle compétence vide, peut amorcer Cast/Projectile/Impact.
2. **Choisir l'intensité** : Discret, Équilibré, Spectaculaire ; aperçu indicatif et bouton `Appliquer cette intensité`. La sélection seule ne modifie aucune valeur, l'application utilise les mêmes propriétaires Glow/Particules V1, plus secousse simple.
3. **Personnaliser** : panneau `details` replié initialement, avec les anciens menus Glow et Particules conservés à l'identique. L'ensemble des réglages avancés chiffrés, des sons, médias, sockets et trajectoires reste en dessous dans son propre panneau expert.

L'ordre et le nom des étapes clarifient la différence entre une **base graphique** et un **niveau d'effets**. Il n'y a ni second catalogue ni nouvel FX Engine. Les imports de sprites, le test de combat et le sélecteur de capacités existants restent accessibles.

## Sécurité et portée

- Aucun preset auteur de `data/capture/showcase` changé.
- Aucun core/renderer, contrat, catalogue FX, media, comportement de combat, ou créature modifié.
- Changer la liste Style/Intensité n'applique rien sans clic ; en ouvrant une compétence, l'intensité retourne à « Réglages actuels ».
- Le choix de Glow ou Particules dans la personnalisation ajuste uniquement les champs du propriétaire concerné ; les valeurs individuelles non couvertes restent disponibles dans les réglages avancés.
- Aucun stockage de doublon d'état/preset, aucune modification des exports/imports.
- Il est toujours possible d'appliquer successivement Style puis Intensité : la seconde action ajuste Glow/Particules/secousse, ce qui est désormais annoncé explicitement comme un ordre de travail.

## Gouvernance et tests

- Base exacte `gh-pages` : `1819aa821ec2519a4f6c519bddf31b4760e098db`.
- Checkpoint de départ : `checkpoint/lab-start-capture-fx-unified-flow-v1-2026-10-11`.
- Branche `work/lab-capture-fx-unified-flow-v1-2026-10-11`.
- Test RED `tests/unit/capture-fx-unified-flow-v1.test.mjs` commit `0c418132983d2e844d58cc6f67c84902c2b7922d`, CI `38157473496` FAILURE attendue.
- Test du DOM réel dans `tests/browser/capture-creature-library-smoke.mjs` : ordre des trois étapes, aucun écrasement à la simple sélection, détails fermés par défaut, réutilisation du propriétaire Glow, maintien de l'asset roche et de la trajectoire skyfall, test original 103 créatures.
- Les tests historiques sur d'anciens libellés ont été mis à jour, sans amoindrir les assertions de présence réelle des contrôles.
- CI complète (foundation, firestorm Chromium, bibliothèque créatures Chromium), checkpoint GREEN à SHA final, FF `gh-pages` sous lease, GitHub Pages SUCCESS requis pour diffusion.
- La validation finale du confort smartphone / Android reste une étape utilisateur, distincte de la CI.

## Résultat des contrôles techniques

La CI `38157846259` est **SUCCESS** à `914541311a8fac747f06f8eba5d3f86a559dd911`, avec `foundation`, `firestorm-zone-growth-browser` et `creature-library-browser` GREEN. Les assertions tests couvrent les trois étapes en DOM réel, l'absence de modification à la sélection et le propriétaire de Glow réel après ouverture de la personnalisation ; les 103 créatures restent chargées. La clôture documentaire nécessite une CI finale sur le dernier SHA, une branche checkpoint GREEN identique et les workflows `gh-pages` / Pages.
