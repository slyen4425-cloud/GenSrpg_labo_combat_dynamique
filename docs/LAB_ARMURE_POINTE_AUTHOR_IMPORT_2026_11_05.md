# Intégration auteur — Armure de pointe (05-11-2026)

## Diagnostic
Le fichier source utilisateur `gensrpg-capture-skill-armure-de-pointe.json` existe (SHA-256 `5c7e28002d2beed3e5e1e0f087995fa3baab1583f0ed65b6fb99cffa0f3710dc`), mais aucun preset `armure-de-pointe` n'est présent dans `data/capture/showcase/` ni dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. D'où son absence de la bibliothèque active `configuredSkills`.

## Contrat de fidélité, art. 33 de la charte
- Publication une fois à `data/capture/showcase/armure-de-pointe.capture-skill-transfer-v1.json` en reproduisant octet pour octet l'export auteur. Aucun auto-équipement.
- Conserver exacts : ID `armure-de-pointe`, niveau 5, Nature, catégorie `counter`, coût 3, préparation 700ms, CD 30000ms, renvoi 100% **contact** pendant 10000ms, statut `damage_reflection` avec polarité `detrimental` telle que fournie ; icône et sprite DOS officiel `hold-last` X+19, échelle 1.01. Ne pas inventer de sprite adversaire : réglage facultatif déjà publié, modification future par auteur.
- Aucun ancien preset remplacé et pas de seconde autorité/catalogue. Entrée unique dans le manifeste natif. Tous les autres fichiers de compétences et créatures restent immuables.
- Chaîne de version ESM de l'éditeur rafraîchie (HTML, entrée, Human Editor, previews) pour qu'un client déjà ouvert ne garde pas l'ancien manifeste en cache. Aucun registre ajouté et pas de changement du chargement des médias.
- IDs graphiques vérifiés dans l'unique catalogue `global-assets`, aucune création de média.
- Tests : intégrité SHA-256, cohérence ID, schémas, présence unique dans le manifeste, absence de doublon avec autres exports, import/export via adaptateur, liste réelle de l'éditeur Chromium et choix de l'entrée, non-régression complète.

## Gouvernance
- BASE `gh-pages@f53725e1064f9d2947bbefce6fc5f77cb82b008f`
- START `checkpoint/lab-start-armure-pointe-import-2026-11-05`
- WORK `work/lab-armure-pointe-import-2026-11-05`
- Fichiers autorisés : nouveau JSON, `src/catalogs/capture-showcase-skill-presets-v1.js`, tests `tests/unit/capture-armure-pointe-author-import-2026-11-05.test.mjs` et éventuellement navigateur dédié + ligne CI, `docs/LAB_CURRENT_WORK.md` et le présent rapport. Aucun renderer, runtime, codec ni autre dépôt modifié.
- Gate : TDD RED sur la base, puis Foundation + tous les jobs Chromium, checkpoint GREEN du SHA exact, PR `gh-pages`, CI PR / fusion et Pages. Test utilisateur physique distinct.
