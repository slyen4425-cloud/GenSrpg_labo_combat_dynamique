# Bestiaire officiel — 19 portraits enrichis (17/11/2026)

- Dépôt propriétaire : Labo Combat `main`, base `d4a1fa607db7c6c4088f7361fdb8ef80d2878a92`.
- Checkpoint avant changement : `checkpoint/lab-start-bestiary-19-portraits-20261117` ; branche temporaire `work/lab-bestiary-19-portraits-20261117`.
- Audit des 22 transferts Showcase de `capture-showcase-creature-presets-v1.js`. Les 22 fiches ont leurs vues front/back/icône résolubles dans `global-assets`.
- Règle éditoriale : enrichir les descriptions de moins de 110 caractères (ou les marqueurs `Na`), pour des portraits français de deux phrases minimum, cohérents avec nom, élément, morphologie et traits déjà renseignés. Aucune mécanique nouvelle, compétence, habitat officiel, statut ou source de données ajoutés.
- Les trois descriptions existantes Sylvorne, Sélachombre et Vyrâme, déjà détaillées, restent strictement intactes.
- 19 seuls champs modifiés : `draft.description` dans les 19 transferts canoniques du Showcase. `captureBestiaryCardsV1` continue sa projection directe sans changement.
- Protégés et non modifiés : illustrations, assetId, types, rareté, stats, résistances, slots, capacités, réactions, données de sauvegardes, catalogue global, animations, autres modules et PWA principale. Percée d'aurore conserve son attaque aérienne sans sprite supplémentaire, selon validation auteur.
- Sentinelle `tests/integration/capture-bestiary-published-portraits-20261117.test.mjs` : les 22 fiches ont des descriptions riches et uniques, et la projection native les affiche sans catalogue secondaire.
- Gates requis : même SHA CI 5/5, Pages `main` déployées, contrôle HTTPS et PC/mobile avant checkpoint GREEN.

Modifications éditoriales : Grainou, Moussados, Venombre, Kitsune Lunaire, Loup volcanique, Gorice, Gemmor, Maraileron, Ailevent, Voltige, Dracendre, Freclairions, Lumilo, Noctigriffe, Scarabacier, Krakenor, Veuve jaune, Ephemus, Veldra.
