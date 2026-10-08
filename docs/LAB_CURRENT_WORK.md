# Point de reprise courant — 2026-10-08

## Lot techniquement GREEN

Creature Library Browser Startup Regression V1

Branche :
`work/lab-creature-library-browser-startup-regression-v1-2026-10-08`

Checkpoint de départ :
`checkpoint/lab-start-creature-library-browser-startup-regression-v1-2026-10-08`

Base :
`181cada1bf19f919961fcc546b9eee5bebb7c5bc`

## Retour utilisateur

La preview smartphone affichait une bibliothèque de créatures vide.

Ce retour invalide le GREEN utilisateur du lot précédent sur ce point.

## Cause architecturale corrigée

Le vrai point d'entrée navigateur chargeait statiquement des modules uniquement nécessaires à la preview combat :

- `capture-combat-preview-v1.js` ;
- `capture-export-to-native-visual-source-v1.js`.

Le lot Dodge Appearance avait ajouté derrière ces modules de nouvelles dépendances de présentation/renderer.

Un échec dans cette branche preview pouvait donc empêcher le bootstrap complet de l'éditeur avant l'hydratation de la bibliothèque.

## Correction

Nouveau chemin :

`Editor bootstrap -> editor.ready -> lazy Preview Runtime`

Nouveau loader :
`src/ui/capture-editor-preview-runtime-loader-v1.js`

La vraie entrée navigateur n'importe plus statiquement :
- le combat preview ;
- l'adaptateur visuel de preview.

La preview combat reste optionnelle et ne possède plus le démarrage de la bibliothèque de créatures.

## TDD

RED :
- `fbcc44937d0c8a2089b30b525790765003f9a476`
- CI `37696130792`
- 1256 / 1257 PASS.

Implémentation :
- loader `c87c15b0a92bdfeaa8683ce59470e4835524dbac`
- isolation entrée navigateur `06632d74978e37274b22edc8e98f7a105de37a9a`
- sentinelle retry alignée `0746053d366f608bc1f0e2980a687759d7bea8b9`

GREEN :
- CI `37696439236`
- 1257 / 1257 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Anti-régression

La même CI vérifie maintenant :
- entrée navigateur sans import statique du runtime preview ;
- 103 créatures actives après bootstrap de données + showcase ;
- conservation des IDs historiques ;
- retry du test combat après erreur.

Rapport :
`docs/LAB_CREATURE_LIBRARY_BROWSER_STARTUP_REGRESSION_V1.md`

## Domaines protégés

Inchangés :
- données créatures ;
- `configuredCreatures` comme owner ;
- Creature Dodge Appearance FX ;
- Combat Runtime / Rules ;
- Dodge gameplay ;
- Projectile Clash ;
- Fireball / Goutte / Cendre ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action protocolaire

- CI documentaire finale ;
- checkpoint `checkpoint/lab-creature-library-browser-startup-regression-v1-green-2026-10-08` ;
- preview `preview/lab-creature-library-browser-startup-regression-v1-2026-10-08` ;
- validation smartphone utilisateur.


## 2026-10-08 — Creature Library Browser Real Smoke V1 (en cours)

- Incident : bibliothèque de créatures vide sur smartphone malgré les tests de données GREEN.
- Propriétaire : démarrage navigateur de l'éditeur Capture et sentinelle du sélecteur DOM réel ; `configuredCreatures` reste seul propriétaire des données.
- SHA de base vérifié : `cbcb081e88661d0b2c09acae40923146d7ccc3bf` (correctif précédent + diagnostic explicite d'hydratation).
- Checkpoint de départ : `checkpoint/lab-start-creature-library-browser-real-smoke-v1-2026-10-08`.
- Branche : `work/lab-creature-library-browser-real-smoke-v1-2026-10-08`.
- Fichiers autorisés : tests navigateur dédiés, workflow CI, puis exclusivement point d'entrée / chargement des ressources de bibliothèque s'il existe un défaut réellement reproduit ; documentation.
- Protégés : données catalogue historique, IDs et presets créature, `configuredCreatures`, combat/FX/esquive, moteur audio, `main`, `Zombicide-40k`, Exploration.
- Plan TDD : ouvrir `examples/dom-demo/capture-editor-v2.html` dans un vrai Chromium servi sur HTTP depuis le dépôt, attendre la vraie hydratation, vérifier 103 identifiants actifs et Maraileron/Moussados/Loup dans le `select`; tester un échec des ressources de présentation sans perte de bibliothèque ; CI complète ; seulement ensuite GREEN.
- Risque : import statique / erreur de chargement navigateur avant initialisation ; attente indéfinie de ressources non essentielles ; faux GREEN de tests isolés.
- Critère final : CI unitaire + navigateur verts, échec reproductible identifié si présent, preview dédiée, vérification smartphone requise avant GREEN utilisateur.

### Creature Library Browser Real Smoke V1 — clôture technique provisoire

- RED `653fcc2d28261f0aa17cfd037d35222b2acb1895` / CI `37744006241` : échec ciblé sur requête optionnelle en attente.
- Correction `3366eca53186e5210395673ce6eba6aebc7d00b9` : attente optionnelle bornée à 6000 ms, erreur visible, données obligatoires inchangées.
- Browser smoke `212fabdf3bc258652839e41844cdd12872e33653` / CI `37744147049` : SUCCESS.
- 1258 / 1258 tests Node ; 3 vrais scénarios Chromium (normal, serveur visuel indisponible, requête visuelle suspendue), **103 créatures visibles** dans chaque scénario.
- Rapport : `docs/LAB_CREATURE_LIBRARY_BROWSER_REAL_SMOKE_V1.md`.
- Reste : CI documentaire finale, checkpoint GREEN exact, preview figée `rawcdn.githack.com`, validation Android. Aucun GREEN utilisateur avant retour réel.


## 2026-10-08 — Creature Library GitHub Pages Delivery V1

- Incident utilisateur : URL rawcdn.githack.com affiche HTTP 429 sur Android ; erreur du CDN de preview, indépendante de l'état des créatures.
- Objectif : publier la preview Creature Library Real Browser Smoke V1 sur l'hébergeur GitHub Pages déjà actif, sans tiers rawcdn.
- Propriétaire : publication statique `gh-pages` uniquement ; aucune modification moteur/éditeur/données.
- Base de publication vérifiée : `e62c513a9f74ef408c45694fe58970b91f6b527f` (`gh-pages`).
- Checkpoint de départ : `checkpoint/lab-start-pages-creature-library-delivery-v1-2026-10-08`.
- Branche du lot : `work/lab-pages-creature-library-delivery-v1-2026-10-08`.
- Source fonctionnelle : `479d14c3a7a47ed5681eb902b6209f4db583e073` (`preview/lab-creature-library-browser-real-smoke-v1-2026-10-08`, CI 37744379527 SUCCESS : 1258 tests Node + 3 vrais scénarios Chromium).
- Périmètre autorisé : synchronisation exacte du snapshot testé vers publication, conservation `index.html` et `.nojekyll`, documentation de la livraison, vérification des CI et du site Pages.
- Protégés : `main`, les autres laboratoires, `Zombicide-40k`, données et moteur Capture, branches de preview parallèles, contenus spécifiques de `gh-pages`.
- Critères : comparaison de l'arbre (uniquement changements déjà testés), tests unitaires/Chromium sur la branche de livraison, checkout Pages, CI Pages SUCCESS, puis validation Android utilisateur.
- Ne pas appeler GREEN utilisateur tant que l'ouverture depuis le smartphone n'est pas confirmée ; tout commit `gh-pages` doit conserver une parenté directe et un rollback possible.
- URL cible (après publication réussie) : https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/capture-editor-v2.html


### Résultat de la préparation Pages (technique)

- SHA exact du snapshot contrôlé : `db35c3af32e4f8cc88fd66ebf376761750da6138` ; contenu fonctionnel identique au GREEN `479d14c3a7a47ed5681eb902b6209f4db583e073` (arbres `assets/`, `data/`, `examples/`, `src/`, `tests/` identiques).
- Deux blobs spécifiques `gh-pages` conservés : `index.html` et `.nojekyll`.
- CI laboratoire du snapshot de livraison : https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37754363632 — SUCCESS, foundation + creature-library-browser.
- Cause HTTP 429 visible sur la capture utilisateur : hébergement tiers rawcdn.githack.com ; ce code ne prouve pas un échec du catalogue lui-même.
- Ancien HEAD déployé/rollback : `e62c513a9f74ef408c45694fe58970b91f6b527f`.
- Le nouveau lien utilisateur doit employer le domaine officiel `slyen4425-cloud.github.io` après publication `gh-pages` et réussite du job `pages build and deployment`.
- Vérification Android utilisateur encore requise, donc **pas de GREEN utilisateur**.
