# Tempête de rouille — export auteur du 20 octobre 2026

- Source unique `gensrpg-capture-skill-tempete_rouille.json` SHA256 `e154956cbb52c957da5487ee8704d8a13112ed9787e172a9454316a5e5e7e8cf`.
- ID stable `tempete_rouille` ; ajout dans `configuredSkills` par le catalogue de presets existant ; archive de provenance non chargée.
- Paramètres originaux conservés : niveau 15, acier, contre, coût 6, cast 700ms, cooldown 40s, zone `zone` proche durant 20 secondes, tick de 20 chaque seconde, réactivation refresh, aura Tourbillon de rouille, icône Tourbillons de rouille.
- Le champ `tickEffect.channel` vaut **`acier`** dans l’export et n’est pas corrigé en `steel` : respect strict de la source utilisateur. La question de canonicalisation des éléments dans l’éditeur/Combat Rules est auditée séparément. Il est possible que le calcul moteur compare aujourd’hui deux identifiants distincts ; éviter de promettre une équivalence avant tests.
- Aucune compétence ni créature existante modifiée, pas de nouveau média, aucune règle de combat changée, pas de loadout ajouté.
- Sentinelle `tests/unit/capture-tempete-rouille-author-2026-10-20.test.mjs` ; CI du chemin réel, checkpoint GREEN et Pages exigés.
