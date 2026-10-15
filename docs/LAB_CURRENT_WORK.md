## 2026-10-15 — Correction structurelle : afficher la véritable vue Capture dans Exploration

- Signalement auteur confirmé sur Pixel : le raccord publié affichait une page de démonstration avec panneaux massifs et bannière couvrant l'arène, très différente de l'éditeur Combat récent. Ce défaut n'est **pas** causé par les sprites provisoires ; l'auteur accepte explicitement les silhouettes génériques des créatures encore non créées.
- Base de production lue : `gh-pages@dc668f34eecc392cfc2f00d1ccc68fa8891932b4`. Checkpoint `checkpoint/lab-start-exploration-native-view-2026-10-15` ; branche `work/lab-exploration-native-view-2026-10-15`. Source ancien bridge `c61798e78fa6cc454aeb5f25294e997e398729f7` réintégrée dans le code récent **sans remplacer les moteurs existants**.
- Propriété de la vue : `capture-editor-v2.html > [data-capture-preview-template]` et `capture-editor-v2.css` restent source de vérité du HUD, orientation paysage, positionnement 16:9 et commandes. `exploration-encounter.html` n'a **plus de seconde copie** de l'interface ; `exploration-encounter.js` charge le template officiel et adapte uniquement les identifiants DOM `opponent-1/2` vers `enemy-1/2` du snapshot.
- Le moteur `mountCoop2v2Test` de la base actuelle fournit le résultat natif `onBattleEnd` (déclenchement unique, roster/KO), connecté au `CaptureCombatResult` et retour Exploration. Les créatures inachevées peuvent utiliser le fallback visuel existant ; binding Loup conservé.
- Correction sur branche : `85f5bc607266bfefdad233dcac50ff94797dfa18`. CI laboratoire `38790911605` **SUCCESS** (foundation, bibliothèque en vrai navigateur, Firestorm Chromium). La CI de l'Exploration épingle ce commit.
- Validation inter-dépôts : `work/exploration-native-combat-view-2026-10-15` ; CI `38791457656` et `38791457834` **SUCCESS** au SHA `535b6d10b4b995edbc3e31ab2461d1dfd5a28ff0`, dont vrai Chromium géométrique plein écran, audit propriétaire, Builder et entrée Encounter.
- Strictement protégés : `gh-pages` production Combat, `main`, dépôt GenSrpG, game rules, compétences, médias utilisateur. Aucune publication Combat effectuée depuis ce lot. Validation utilisateur Pixel et vrai combat complet/retour requis avant GREEN FINAL.

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


## 2026-10-08 — Dodge Default 250ms V1

- Retour utilisateur : bibliothèque de créatures validée sur Android, désormais sentinelle protégée ; la durée active Esquive par défaut doit passer de 0,50 s à 0,25 s.
- Base vérifiée : `f4d92445071bc82204dc9ea5c6f10bd76e369f39` (GitHub Pages GREEN + Chromium 103 créatures).
- Checkpoint de départ : `checkpoint/lab-start-dodge-default-250ms-v1-2026-10-08` ; branche : `work/lab-dodge-default-250ms-v1-2026-10-08`.
- Propriétaire : `CaptureGameOptionsV1` (durée native en ms) ; Human Editor (valeur affichée en s), aucun nouveau timer ni override de session.
- Périmètre : `src/contracts/capture-game-options-v1.js`, `examples/dom-demo/capture-editor-v2.html`, tests unitaires existants d'Esquive, documentation.
- Protégés : fenêtre Runtime, esquive/FX par créature (déjà en Apparence via `CreaturePresentationBindingV3`), données et chargement des 103 créatures, gameplay, combat, export des anciennes options explicites, `main`, `Zombicide-40k`, Exploration.
- TDD : test RED durée défaut/HTML, 250 ms dans l'éditeur et le contrat, 500 ms explicites préservés ; CI complète et Chromium réel 103 créatures.
- Critère GREEN technique : tests et CI sans régression, checkpoint exact ; smartphone utilisateur requis pour GREEN produit.
- Suivant distinct : réglage d'attaque ignorant 0–100% des résistances dans `Combat Rules` via `SkillEffectV1`, après audit de tous les vrais chemins de dégâts. Ne pas inclure dans ce lot.


### Dodge Default 250ms V1 — clôture technique

- RED CI 37757666184 (durée/HTML attendus 250 vs ancien 500).
- Code : contrat 250 ms + affichage UI 0,25 s par pas de 0,05 s ; durées explicites, moteur et présentation inchangés.
- GREEN initial `53fecc90e96243e42ad385d48f513496d277549f` / CI `37757822001` SUCCESS (foundation + Chromium réel 103 créatures).
- Rapport : `docs/LAB_DODGE_DEFAULT_250MS_V1.md`.
- GREEN final subordonné à la CI documentaire, checkpoint exact et validation smartphone pour GREEN utilisateur.


## 2026-10-08 — Damage Penetration V1

- Demande utilisateur : chaque effet d'attaque `damage` doit pouvoir ignorer entre 0 et 100% de la résistance élémentaire et/ou de la réduction globale des dégâts (« défense »), indépendamment, avec 0% par défaut.
- Base exacte : `2586766d8f1261572efdc6dc5834c9913f08dc24` (GREEN Dodge 250 ms ; 103 créatures valides).
- Départ : `checkpoint/lab-start-damage-penetration-v1-2026-10-08` ; branche : `work/lab-damage-penetration-v1-2026-10-08`.
- Owners : `SkillEffectV1` pour valeurs de la capacité ; `CombatDamageV1` seul calculateur ; `Human Editor` pour lecture/écriture et présentation.
- Champs additifs : `ignoreResistancePct` (ignore uniquement valeur de résistance positive au canal de dégâts) ; `ignoreDamageReductionPct` (ignore partiellement la réduction globale). Bornes 0..100%, défaut implicite 0% et champs absents conservés lors de l'import des anciens skills.
- Périmètre autorisé : `src/contracts/skill-effect-v1.js`, `src/core/combat/combat-damage-v1.js`, `src/core/combat/immediate-tactical-effects-v1.js`, `src/ui/capture-editor-human-v2.js`, leurs tests et documentation. Les effets `damage` imbriqués reçoivent le même contrat ; pas de seconde formule de dégâts.
- Protégés : `configuredCreatures` (103 entrées), Combat Runtime/Session timing, statuses/invulnérabilité, bouclier, Dodge 250ms et sprite, mouvement, assets, `gh-pages`, `main`, `Zombicide-40k`, Exploration.
- TDD : contrats 0/50/100%, valeurs invalides, faiblesse négative, calcul direct, vraie chaîne `normalizeSkillDefinition -> CombatSession -> CombatDamageV1 -> HP`, roundtrip Human Editor ; CI générale/Chromium. Pas de GREEN avant vrais tests.
- Critère final : CI complète GREEN, rapport, checkpoint exact, preview, validation sur Android avant GREEN utilisateur.


### Damage Penetration V1 — clôture technique provisoire

- RED : CI `37758108754` FAILURE ciblé de la nouvelle exigence.
- GREEN : CI `37758255277` SUCCESS (tous les tests actuels + navigateur).
- Smoke UI réel complémentaire : commit `38338f8d5311b93b513366beea740fb1d1fc7244`, CI `37758326580` SUCCESS ; les deux champs existent dans le DOM navigateur et les 103 créatures restent visibles.
- Séparation conservée : `SkillEffectV1` possède le contrat ; `CombatDamageV1` possède l’unique formule ; `Human Editor` expose les options sans logique métier.
- Résultat : `ignoreResistancePct` et `ignoreDamageReductionPct` 0..100% par attaque directe, valeurs absentes des anciens effets traitées comme 0% ; résistance négative inchangée.
- Rapport : `docs/LAB_DAMAGE_PENETRATION_V1.md`.
- Pour GREEN technique final : CI documentaire, checkpoint exact, preview figée. Ne pas merger `main` sans validation ; validation smartphone requise pour GREEN utilisateur.


## 2026-10-08 — Dodge Sprite Visual Duration V1

- Retour Android : sprite d'esquive visible mais trop rapide, possibilité de régler séparément sa durée d'animation.
- Base exacte `de3cd80d30734bcf9cc02b0a31a39c49d3ca2c74` (gh-pages publié, bibliothèque 103, Dodge 250ms, Penetration V1 GREEN technique).
- Checkpoint de départ `checkpoint/lab-start-dodge-sprite-visual-duration-v1-2026-10-08`, branche `work/lab-dodge-sprite-visual-duration-v1-2026-10-08`.
- Owners : `CreaturePresentationBindingV3` sur `visual.dodge.durationMs` (optionnel); Human Editor pour lecture/saisie; adaptateur visuel pour transport; `demo-app` visual controller pour choisir la durée de présentation. Combat Runtime reste seul owner de la fenêtre d'esquive (250 ms).
- Fichiers autorisés : contrat de présentation, export visuel, formulaire HTML + Human Editor, visual controller, tests existants et doc. Renderer purement consommateur ; pas de nouvelle horloge / timer.
- Comportement : durée visuelle par défaut 700ms pour les sprites, indépendante de 250ms d'esquive. Les anciennes créatures sans `durationMs` restent valides et bénéficient du défaut visuel ; les créatures sans sprite restent sans FX.
- Protégés : `configuredCreatures` 103, data/showcase, SkillEffect/dégâts, Combat Runtime et règles, autres modes, `main`, Zombicide-40k, Exploration.
- RED puis GREEN : durée séparable 250/700, auteur 1000, export/roundtrip, ancienne version V3 sans durée, suppression/cancel, 103 créatures Chromium, CI ; checkpoint exact et preview isolée.
- Chantier distinct en attente : audit Cendre aveuglante et ergonomie pénétration générale ; ne pas mélanger avec ce micro-lot.


## 2026-10-08 — Cendre aveuglante damage debuff audit V1

- Demande utilisateur corrigée (transcription) : auditer la vraie capacité `Cendre aveuglante` `cap_fire_special_1` car après debuff il semble parfois recevoir moins de dégâts.
- Base : `d1e677fc40e60c12c2715f0fe71a3bd1f32a283b` (Dodge sprite duration technique GREEN); checkpoint départ `checkpoint/lab-start-cendre-debuff-damage-audit-v1-2026-10-08` ; branche `work/lab-cendre-debuff-damage-audit-v1-2026-10-08`.
- Owners : `SkillEffectV1` et les données Showcase de l'auteur pour les effets de la compétence ; `StatusEffectProjectionV1` pour statuts ; `CombatDamageV1` pour dégâts. Pas de réécriture ni changement silencieux de la compétence.
- Périmètre : nouveau test de non-régression vrai calcul avant/après, rapport explicatif, documentation ; aucun changement métier sans reproduction prouvée.
- Observation initiale : Cendre applique 20 secondes `speed -50 points` et `physical -50 points` (effet vitesse + bonus/attaque et résistance au canal physique), pas un malus général de résistance de tous les éléments ni de défense globale.
- Critère : sur la cible debuffée, attaque physique reçue fait des dégâts supérieurs ou égaux à ceux sans Cendre, élément Feu inchangé ; ses propres dégâts physiques sortants diminuent ; tester durée et chargement Showcase ; CI complète/Chromium 103 créatures ; ne jamais modifier les données auteur à partir d'une simple supposition.
- Protégés : Combat Runtime, données Showcase, 103 créatures, Dodge sprite, penetration, main, Zombicide-40k, Exploration.


## 2026-10-08 — Unified Penetration Editor V1

- Retour utilisateur : « une attaque qui ignore les résistances devrait passer à travers toutes les résistances, élémentaires ou non » ; actuellement deux champs indépendants sont peu explicites.
- Base exacte : `bfb0cbd3080a6e92794e5c8c2b65c0a085f83836`, Cendre audit GREEN + Dodge FX duration GREEN + bibliothèque 103.
- Départ : `checkpoint/lab-start-unified-penetration-editor-v1-2026-10-08`; branche `work/lab-unified-penetration-editor-v1-2026-10-08`.
- Owner : `SkillEffectV1` conserve exclusivement les deux paramètres existants `ignoreResistancePct` (canal élémentaire OU physique) et `ignoreDamageReductionPct` (défense globale) ; `CombatDamageV1` reste seul calculateur.
- Scope : UX uniquement dans `src/ui/capture-editor-human-v2.js` + tests + docs. Ajouter un champ auteur unique « Ignorer toutes les résistances (%) », qui synchronise les deux paramètres existants sur l'attaque directe, sans stocker un troisième paramètre ni supprimer les deux options avancées. Préserver sans changement les compétences anciennes ayant des valeurs différentes (afficher Personnalisé / advanced).
- Ce contrôle ignore toutes les mitigations ordinaires du moteur (résistance du canal concerné y compris physique/élémentaire, défense globale), **pas** les boucliers et les immunités. Une future propriété « non-pénétrable » est un chantier à décider distinctement, pas une autorité ajoutée.
- Test RED puis GREEN : UI DOM/rond-trip de valeurs synchronisées 0/50/100 et legacy différencié, 100% traverse physique + feu + défense dans la chaîne de dégâts, 103 créatures Chromium, CI, preview. Garder Cendre inchangée.
- Protégés : 103 créatures, Cendre Showcase, Dodge FX, moteur, statuts, Runtime, `gh-pages`, `main`, Zombicide-40k, Exploration.


## 2026-10-08 — Deux mises à jour auteur Eau : Goutte vive / Morsure de marée

- Sources utilisateur vérifiées : `gensrpg-capture-skill-cap_water_atk_1(2).json` (ID `cap_water_atk_1`) et `gensrpg-capture-skill-cap_water_atk_2(1).json` (ID `cap_water_atk_2`), tous deux `capture-skill-transfer-v1`, version 1, présentation V9.
- Base exacte : `8f38faadf4d0c64604db5a1287f5cf091f0a8684` (GitHub Pages publié, CI/Chromium 103 créatures GREEN).
- Checkpoint départ : `checkpoint/lab-start-water-skills-author-updates-v1-2026-10-08`; branche isolée : `work/lab-water-skills-author-updates-v1-2026-10-08`.
- Owners : presets Showcase existants `data/capture/showcase/cap_water_atk_{1,2}.capture-skill-transfer-v1.json`, déjà déclarés chacun UNE fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` ; ingestion via `applyCaptureTransferBatchToEditorStateV1` / `configuredSkills`.
- Périmètre strict : remplacement fidèle des 2 JSON auteur, sentinelles de tests unitaires/roundtrip/chargement, docs; aucun code runtime ni catalogage supplémentaire si asset IDs présents.
- Chaîne obligatoire : import du vrai transfer -> normalisation et export -> batch atomique `replace-skill` sans modification taille/IDs; vrai Combat Session pour les dégâts/drain, visual catalog asset references et formats autorisés. CI foundation + Chromium 103 créatures avant statut GREEN technique.
- Source visuelle globale contrôlée : `global-assets/data/assets/catalog/global-visual-assets.v1.json` contient les 6 assetIds attendus ; audio `data/presentation/audio/private-audio-catalog.v1.json` contient les 4 IDs de son. L'existence d'une entrée de catalogue ne prouve pas seule la lecture effective des médias.
- Protéger : 103 `configuredCreatures`, toutes autres compétences et presets, dossiers source assets/audio, moteur, Combat Runtime, main, Zombicide-40k, Exploration. Pas de mise à jour silencieuse des valeurs auteur (notamment secousse 120 px Morsure).
- Comparaison sémantique canonique à préserver (JSON objet source, UTF-8, clés dans l'ordre) : `cap_water_atk_1` SHA256 `3ab36b051d390bdb24b37f80a8a6c04ad02877299f1982a473dba499911c7098` ; `cap_water_atk_2` SHA256 `0a7fba75a4f918e75f39f9be2d9dc09522758a271e8072442eed2be7ea89c791`.
- Validation Android utilisateur nécessaire avant GREEN utilisateur. Si preview actualisée sur `gh-pages`, garantir QA + GitHub Pages SUCCESS et rollback.


### Water Skills Author Updates V1 — clôture technique

- Deux fichiers Showcase existants remplacés par les deux exports de l'auteur, SHA-256 sémantiques exactement correspondants, aucun ajout ou retrait d'identifiant de compétence.
- 6 visuels WebP déjà présents sur `global-assets` ; 4 sons MP3 déjà présents sur `gh-pages` ; aucun nouveau fichier média déposé.
- RED CI `37782503619` (sources anciennes), GREEN initial `37782866381` (1272/1272 Node PASS + Chromium 103 créatures).
- Régression de test historique Maraileron traitée par changement d'attendu de l'icône auteur (pas de donnée Maraileron modifiée).
- Sentinelle vraie Combat Session : dégâts 10 (Goutte vive) et dégâts 20 + drain énergie 3 (Morsure de marée), roundtrip Transfer et batch atomique.
- Rapport : `docs/LAB_WATER_SKILLS_AUTHOR_UPDATES_V1.md` ; GREEN technique final conditionné au dernier CI documentaire et à la publication Pages. Le rendu réel des FX/sons (notamment secousse 120 px) reste en attente de validation Android.


## 2026-10-08 — Pressurized Jet Beam V1 — reprise sur dernier GREEN eau

- Base effective : `8f8d2f66104220054f939c9500e36e2653206e37` (`checkpoint/lab-water-skills-author-updates-v1-green-2026-10-08`).
- Branche : `work/lab-pressurized-jet-beam-v1-from-water-green-2026-10-08`.
- Checkpoint départ : `checkpoint/lab-start-pressurized-jet-beam-v1-from-water-green-2026-10-08`.
- Le lot précédent `8f38faad...` n'est plus utilisé comme base de travail ; ses changements beam ont été reportés au-dessus du dernier GREEN eau après comparaison de fichiers.
- Aucun conflit moteur détecté avec le lot eau : les changements récents concernaient les exports compétences eau, tests auteur et documentation, pas les owners `SkillFxPlan` / `DomSkillFxRenderer` / `skill-fx.test.mjs`.
- Owners conservés : `SkillDefinition.form=beam` pour la sémantique, `SkillFxPlan` pour la planification FX, `DomSkillFxRenderer` pour la géométrie/rendu, `SkillPresentationBinding.visual.travel` pour l'asset de trajet.
- Objectif : beam générique continu source→cible ; aucune branche spéciale selon l'ID « Jet pressurisé », aucun second moteur, aucune seconde horloge.
- État : code beam reporté ; tests dédiés reportés ; assets/raccord catalogue/CI complète encore à finaliser avant GREEN.


### Pressurized Jet Beam V1 — clôture technique

- Base effective conservée : `8f8d2f66104220054f939c9500e36e2653206e37` (dernier GREEN eau au départ du lot).
- Assets GREEN : `74ac3314f2d20eeadad77b439d5f229f5dacee3e`, checkpoint `checkpoint/global-assets-pressurized-jet-vfx-v1-green-2026-10-08`.
- `global-assets` expose les 4 IDs Jet pressurisé et `GLOBAL_VISUAL_LIBRARY.revision` vaut `2026-10-08-v19-pressurized-jet-vfx-v1`.
- Pack réel : 56 PNG RGBA 512×512 + 4 atlas WebP + 4 sources WebP de traçabilité ; corps du rayon inspecté visuellement, horizontal, animé, alpha réel, non-placeholder.
- Raccord moteur : `beam` est planifié depuis la forme canonique, rendu comme un seul visuel source→cible, orienté et dimensionné sans trajectoire mobile de projectile ; teardown conservé dans le propriétaire FX existant.
- `beam_start` reste un asset distinct catalogué. Aucun slot caché ni contrat parallèle n'a été ajouté ; l'ajout d'un second slot de départ est hors de ce lot.
- CI labo validée sur `ac66ea9f356430df1b3f32e794350570db3967ec` : run `37792303017`, 1279/1279 PASS, 0 FAIL, structure OK, Chromium Creature Library SUCCESS / 103 créatures protégées.
- Rapport : `docs/LAB_PRESSURIZED_JET_BEAM_V1.md`.
- CI documentaire `37793685931` : SUCCESS sur `1ea2d40ba487651ef893efaeca282e6dff2d3c73`.\n- Statut : GREEN technique ; checkpoint final `checkpoint/lab-pressurized-jet-beam-v1-green-2026-10-08` à figer sur le SHA documentaire final après cette synchronisation. Validation smartphone requise avant GREEN produit. Aucun merge `main` / `gh-pages`.


## 2026-10-08 — Pressurized Jet Preview Routing V1

- Base exacte : `78de0026f01f26d51fd3d4a0616c853a53851b79` (`checkpoint/lab-pressurized-jet-beam-v1-green-2026-10-08`).
- Checkpoint départ : `checkpoint/lab-start-pressurized-jet-preview-routing-v1-2026-10-08`.
- Branche : `work/lab-pressurized-jet-preview-routing-v1-2026-10-08`.
- Objectif : raccorder les 4 IDs Jet pressurisé au vrai résolveur de présentation utilisé par la preview/éditeur et prouver le chemin `assetId -> presentation -> DomSkillFxRenderer beam` sans créer de seconde autorité.
- Owner visuel : `demoPresentationAssets.asset()` / registre de présentation de la démo ; owner de binding : `SkillPresentationBinding`; owner rendu : `DomSkillFxRenderer`.
- Fichiers autorisés : registre assets de démo, tests de présentation/renderer, documentation ; uniquement les fichiers strictement nécessaires au raccord de preview.
- Protégés : SkillDefinition gameplay, dégâts, énergie, cooldowns, résistances/pénétration, 103 créatures, exports auteur eau, global-assets déjà GREEN, main, gh-pages, Zombicide-40k, Exploration.
- TDD : test RED d'un vrai binding V9 utilisant cast/travel/impact Jet pressurisé via le résolveur de démo ; le renderer doit produire un `beam` continu avec l'asset réel ; CI complète + smoke Chromium 103 créatures.
- Aucun nouveau skill gameplay ne sera inventé : le test utilisera un binding fixture uniquement. Aucun auto-bind aux compétences existantes sans export auteur explicite.
- Critère GREEN : 4 IDs résolus par le registre de preview, vrai chemin testé, CI verte, checkpoint exact ; preview utilisateur seulement ensuite.
- Statut : EN COURS.


### Pressurized Jet Preview Routing V1 — clôture technique

- Registre preview : 4 IDs Jet pressurisé résolus depuis `GLOBAL_VISUAL_LIBRARY` / `global-assets`.
- Vrai chemin testé : `assetId -> demoPresentationAssets -> SkillPresentationBinding V9 -> DomSkillFxRenderer beam`.
- Aucun skill gameplay permanent ajouté ; aucun auto-bind aux compétences existantes.
- CI `37795485943` : SUCCESS, 1281/1281 Node PASS, 0 FAIL, Chromium Creature Library SUCCESS, 103 créatures protégées.
- Rapport : `docs/LAB_PRESSURIZED_JET_PREVIEW_ROUTING_V1.md`.
- Statut : GREEN technique candidat après CI documentaire finale + checkpoint exact ; test smartphone artistique encore requis.


## 2026-10-08 — Publication Pages Jet pressurisé Preview V1

- Base de publication exacte : `d1e9978a738db2d48d90145a5d5c857b71fb5f9d` (`gh-pages` au début de ce micro-lot).
- Branche : `work/lab-pages-pressurized-jet-preview-v1-2026-10-08`.
- Source fonctionnelle : `checkpoint/lab-pressurized-jet-preview-page-v1-green-2026-10-08` / SHA `8600024337463afb0624cd2c2069bc9d783f9b57`, CI `37800159446` SUCCESS.
- Publication additive uniquement de : `examples/dom-demo/pressurized-jet-preview.html`, `examples/dom-demo/pressurized-jet-preview.js`, `src/assets/global-presentation-asset-resolver-v1.js`.
- `index.html`, `.nojekyll`, le reste du snapshot Pages et les owners gameplay restent inchangés.
- La page charge le catalogue autoritaire `global-assets`, construit un binding V9 de test local à la preview, puis utilise `DomSkillFxRenderer` pour charge -> beam continu -> impact.
- Aucun auto-bind d'une compétence auteur, aucun changement de dégâts/énergie/cooldown/résistances, aucune modification de `main` ou `Zombicide-40k`.
- Critère : CI de la branche de publication verte, puis déplacement de `gh-pages` avec lease depuis le SHA de base exact, puis GitHub Pages SUCCESS et validation smartphone utilisateur.
- Statut : EN COURS.


## 2026-10-08 — Jet pressurisé : import fidèle de l'export utilisateur

- Source : pièce jointe `gensrpg-capture-skill-cap_water_atk_3.json`, `capture-skill-transfer-v1`, skill ID `cap_water_atk_3`, `Jet pressurisé`, présentation V9, niveau 10.
- Base de reprise effective : `ed647100c4eacc6317ddcb4578b1568e3639895f` (`gh-pages` déjà déployé et validé techniquement, incluant les travaux du rayon et les deux dernières compétences Eau).
- Checkpoint départ : `checkpoint/lab-start-water-atk3-author-import-v1-2026-10-08` ; branche : `work/lab-water-atk3-author-import-v1-2026-10-08`.
- Périmètre : créer `data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json` depuis l'export exact et le référencer une seule fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` ; tests contrat/roundtrip/batch, vrai Combat Session, bibliothèque 103 créatures, documentation.
- Propriétaires : fichiers Showcase pour les définitions auteur ; `CaptureTransferV1` pour l'import ; `configuredSkills` pour le seul état des capacités ; `CombatDamageV1` pour pénétration ; présentation V9 existante pour FX.
- L'export auteur contient `definition.form="projectile"` et `presentation.visual.travel.assetId="pack:capture:sprite-frost-bolt-projectile-01"`. Ce n'est PAS le `beam` continu récemment développé. Ne pas le convertir silencieusement en `beam` ni remplacer ses assets sans nouvelle version auteur ou accord explicite.
- Valeurs protégées : 25 dégâts eau, `ignoreResistancePct=100`, `ignoreDamageReductionPct=100`, `energyCost=6`, préparation 2500 ms, trajet 900 ms, cooldown 30000 ms, clash power 3, cast eau scale 1.5, travel givre scale 2.5, impact eau scale 1.7 et 500 ms, absence audio.
- Sentinel assets : références `frost-bolt-projectile`, `sprite-cast-water`, `sprite-impact-water`, `core:icon-skill-aqua-dash` résolues par le catalogue existant. Aucun média créé ni modifié.
- Protections : moteur rayon, 4 assets Jet pressurisé, 103 créatures, deux skills eau précédents, toutes les autres skills, source `global-assets`, `main`, `Zombicide-40k`, Exploration.
- TDD : RED (capacité absente du catalogue), GREEN (contenu auteur exact, import roundtrip, remplacement canonique d'un historique s'il existe sinon insertion stable, fonctionnement dégâts et pénétration, vrai navigateur avec 103 créatures).
- Publication sur `gh-pages` uniquement par déplacement fast-forward protégé depuis la base exacte après tests et checkpoint GREEN. Validation visuelle Android requise.


### Jet pressurisé import auteur — clôture technique

- TDD RED `37803851479` (fichier/entrée catalogue encore absents).
- GREEN initial `37803913427` : 1285 tests Node PASS, 0 FAIL, Chromium 103 créatures PASS.
- Ajout au seul owner Showcase de `cap_water_atk_3`; fichier auteur de 4133 octets reproduit sémantiquement à l'identique, SHA-256 `d799c2f54712f93982a2f8d135785aa163b4cd43234983f83b451ba75d304f55`.
- Le paramétrage reste `projectile` avec atlas `frost-bolt-projectile` comme dans la source utilisateur ; aucun auto-basculement vers `beam` et les quatre assets rayon existants ne sont pas altérés.
- Réel Combat Session : 25 dégâts eau avec pénétration 100 % de la résistance eau et de la défense.
- Les 103 créatures et les compétences Eau déjà intégrées sont inchangées ; pas de code gameplay/renderer modifié.
- Rapport : `docs/LAB_WATER_ATK3_AUTHOR_IMPORT_V1.md`. Dernière CI documentaire, checkpoint et publication `gh-pages` à effectuer ; validation Android toujours nécessaire pour GREEN utilisateur.


## 2026-10-08 — Rayon unifié : départ / corps / arrivée et UX guidée V1

- Retour utilisateur Android : sélectionner Style=Rayon laisse 3 composantes visuelles dissociées, et l'authoring est laborieux.
- Base GitHub Pages exact : `01e44318a2337f4bffddc29cc712ad6f560dd1fc` (CI et Pages SUCCESS, Jet pressurisé `cap_water_atk_3` déjà importé comme projectile d'après le JSON auteur).
- Checkpoint départ : `checkpoint/lab-start-beam-linked-fx-ui-v1-2026-10-08`, branche : `work/lab-beam-linked-fx-ui-v1-2026-10-08`.
- Cause démontrée : `DomSkillFxRenderer` ne rend que `presentation.travel` durant `type=beam`; le sprite de départ est catalogué mais sans slot, tandis que l'impact s'affiche en événement séparé. Il manque une autorité de placement commun pour les 3 phases visibles pendant le rayon.
- Owners : `SkillPresentationBinding.visual` pour les visuels (ajout optionnel `beamStart`), `CaptureSkillPresentationAssetsV2` pour résoudre les IDs, `DomSkillFxRenderer` pour rendre départ/corps/extrémité cible dans un unique record et géométrie commune; Human Editor pour la sélection et un pack de rayons appliqué sur action explicite.
- Intention : Cast (préparation) séparé; pendant `beam`, un ensemble synchronisé **départ + corps continu + extrémité cible** (visuel Impact), ancré à la source et à la cible; à l'impact gameplay, animation Impact existante conservée. Pas de timers gameplay, aucun changement à CombatSession.
- Ergonomie : bouton « Configurer le rayon Jet pressurisé » dans Effets visuels qui choisit le Style Rayon et les 4 visuels canonique (cast, départ, corps, impact) avec un seul clic ; choix avancé `Départ du rayon` pour les autres effets. Ne modifie ni capacités enregistrées ni dégâts tant que l'auteur n'enregistre pas.
- Protection : import auteur `cap_water_atk_3` demeure **projectile de givre** dans Showcase, autres compétences, 103 créatures, `global-assets`, `main`, Zombicide-40k et Exploration inchangés.
- TDD : tests RED (résolution `beamStart`, trio visuel synchro), tests GREEN avec vrai binding, navigateur Chromium 103 créatures, rollbacks/checkpoints; déploiement Pages seulement après CI. Aucun faux GREEN avant validation Android.


### Rayon lié V1 — état d'implémentation

- Implémenté sur la branche isolée : nouveau slot optionnel `beamStart` reconnu par SkillPresentationBinding V9, résolu par le seul Presentation Adapter ; rendu lié départ/corps/cible dans un seul owner DOM FX avec relecture des sockets source et cible durant le beam et cleanup par le même record.
- UI : bouton « Configurer le rayon Jet pressurisé » en section Effets visuels, 4 assets réels renseignés ensemble (cast + 3 parties du rayon), champs avancés pour départ / taille, sans altérer les dégâts ni la compétence auteur enregistrée avant l'action « Mettre à jour ».
- CI moteur/roundtrip : `37809784765` SUCCESS (dont suivi cible mobile, 103 créatures Chromium). Test navigateur mis à jour pour garantir l'apparition des nouveaux contrôles ; CI finale de smoke à contrôler.
- Médias : 0 fichier ajouté ou remplacé ; IDs existants inchangés dans le pack canonique `global-assets`.
- Rapport `docs/LAB_BEAM_LINKED_FX_UI_V1.md`. Ne déclarer GREEN technique final qu'après CI documentaire + checkpoint exact + déploiement Pages. Test Android toujours nécessaire pour juger la continuité artistique.


## 2026-10-08 — Démo Rayon : alignement 3 parties (suivi)

- Base exacte déjà publiée `5e902634792b6a3396f17a3fd15e431ff0f50d8a` (GREEN technique `Rayon lié`), protégé par `checkpoint/lab-beam-linked-fx-ui-v1-green-2026-10-08`.
- Départ : `checkpoint/lab-start-beam-preview-three-parts-v1-2026-10-08`, branche : `work/lab-beam-preview-three-parts-v1-2026-10-08`.
- La page de démo `pressurized-jet-preview.js` utilisait encore un binding local test avec cast/body/impact mais sans `beamStart`. Son visuel restait incomplet, même après la correction générique du moteur.
- Périmètre : rattacher l'ID `pack:capture:sprite-pressurized-jet-beam-start-01` au binding V9 de démonstration, écrire une sentinelle dédiée, lancer CI Node+Chromium/103, mettre à jour la documentation. Aucun autre changement moteur, skill auteur, médias, main ni autres dépôts.
- La démo reste une illustration, ne devient pas un deuxième moteur ni une compétence gameplay.


### Démo Rayon 3 parties — clôture technique candidate

- Preview autonome raccordée aux trois assets réels via un unique binding V9 : départ `beamStart`, corps `travel`, cible `impact`, sans changer la compétence Gameplay/Showcase.
- Sentinelle dédiée RED puis GREEN et CI intégrale Node/Chromium 103 créatures exigées.
- 0 média nouveau ; statuts Android et continuité esthétique finale à valider manuellement.
- Rapport existant actualisé : `docs/LAB_BEAM_LINKED_FX_UI_V1.md`.


## 2026-10-08 — Ergonomie Rayon : 4 étapes côte à côte, près de la zone persistante

- Retour utilisateur : la configuration rayon est mal placée et confuse. Exigence : les **quatre composants** du pouvoir (1 Charge, 2 Départ de rayon, 3 Corps de rayon, 4 Impact) configurables ensemble près de la section effets tactiques/aura au sol, pas 3 composants ni un bouton sans explication.
- Base publique exacte : `4e9083570561a284838888d1d5e23a6b6a915369` (GitHub Pages + CI SUCCESS; démo Rayon 3 parties publiée). Checkpoint `checkpoint/lab-start-beam-editor-four-stages-v1-2026-10-08`; branche `work/lab-beam-editor-four-stages-v1-2026-10-08`.
- Audit : `src/ui/capture-editor-human-v2.js` dispose déjà des champs canoniques Cast, BeamStart, Travel, Impact dans `data-skill-fx-advanced`; un bouton pack au début de la section #7 configure le Style Rayon et les 4 assets, mais les champs sont dispersés. Les trois sous-images du beam FX partagent déjà les points d'ancrage dans `DomSkillFxRenderer` et suivent les sources/cibles mobiles.
- Périmètre : réordonner le seul éditeur de présentation via **déplacement des vrais contrôles DOM** vers une carte « Rayon continu — 4 étapes » après la section 4 zone persistante. Pas de second jeu de champs, pas de double source de vérité. Si Style != Rayon, remettre les mêmes contrôles dans Personnaliser les sprites pour les projectiles normaux. Bouton pack dans le nouveau panneau, retour utilisateur explicitement « 4 étapes ». Préserver le socket de sortie pour alignment.
- Tests : TDD RED/GREEN sur DOM, une seule copie par champ, réversibilité du passage Rayon/Projectile, persistance roundtrip, CI Node, véritable smoke Chromium 103 créatures, publication Pages après checkpoint technique. Test esthétique Android obligatoire.
- Fichiers prévus : `examples/dom-demo/capture-editor-v2.html`, `src/ui/capture-editor-human-v2.js`, nouveau petit `src/ui/capture-editor-beam-stage-layout-v1.js` (uniquement présentation UI), sentinelles tests, docs. Aucun changement aux contrats, moteurs, assets, données Showcase ou `main`.


### Rayon 4 étapes — clôture technique candidate

- Nouveau panneau situé immédiatement après « 4 — Effets tactiques » / zone persistante, avant Mouvement.
- Quatre étapes sont enfin affichées ensemble : (1) charge/point de sortie, (2) départ du rayon, (3) corps continu, (4) extrémité et impact ; action « Utiliser les 4 sprites Jet pressurisé » au même endroit.
- `capture-editor-beam-stage-layout-v1.js` déplace les **douze labels canoniques** depuis le panneau avancé vers les quatre étapes lors de Style=Rayon (4/2/3/3), et les rétablit dans leur emplacement d'origine pour les autres styles/au dispose. Aucune nouvelle autorité ni duplication de valeurs.
- Protection de l'ancien chemin `Style=Projectile` : champs, données de combat, présentation V9, moteur beam, assets, 103 créatures inchangés. Correction CSS width-only préservant l'ancien test paysage.
- Tests RED `37813264628` ; GREEN Node + vrai Chromium 103 créatures + injection DOM réelle contrôlant les quatre étapes : CI `37813820439` SUCCESS, 0 régression.
- Documentation : `docs/LAB_BEAM_EDITOR_FOUR_STAGES_V1.md`. CI documentaire finale, checkpoint technique, publication Pages et test tactile Android encore requis.


## 2026-10-08 — Rayon générique, préparation bouche et annulation du préréglage

- Retour utilisateur : ne pas nommer le réglage visuel d'après la capacité « Jet pressurisé », trois phases cohérentes (départ/charge bouche → corps continu → impact), ne pas imposer un cast supplémentaire, bouton réversible. Proximité des réglages de zone conservée.
- Base exacte `95485f318c1593aa2b369afa3faf9c7057000a91` (GitHub Pages + CI success). Checkpoint de départ `checkpoint/lab-start-beam-simplified-reversible-ui-v1-2026-10-08` ; branche `work/lab-beam-simplified-reversible-ui-v1-2026-10-08`.
- Propriétaires uniques conservés : formulaire Human Editor et ses champs DOM canoniques, `CaptureBeamStageLayoutV1` simple relocalisation des labels, `CaptureBeamVisualPackV1` valeurs du pack, `DomSkillFxRenderer` rendu existant. Pas de nouvel owner FX / timing / dégâts.
- Périmètre : renommer UI en « Rayon continu », afficher 3 phases au lieu de 4 (rassembler contrôles du cast et du départ dans la phase 1 sans les dupliquer), preset générique d'eau qui utilise le sprite `beam-start` comme visuel de préparation **et** de départ à la bouche (aucune charge additionnelle imposée), vrai bouton `Annuler le modèle` qui restaure précisément les valeurs des champs visuels et du Style telles qu'elles étaient avant l'application; preview dédiée à aligner. Les assets `pack:capture:sprite-pressurized-jet-*` déjà validés sont réutilisés sans transfert binaire.
- Aucun changement de `cap_water_atk_3` sauvegardé automatiquement : le fichier auteur reste `projectile` tant que l'utilisateur ne valide pas explicitement une mise à jour. Aucun effet sur dégâts/coûts/énergie/cooldowns, autres compétences, 103 créatures, `main`, `global-assets`, Zombicide-40k ou Exploration.
- TDD RED→GREEN, maintien de roundtrip source, vrai smoke Chromium 103 créatures, revue diff, checkpoint final, publication Pages seulement après CI. Validation Android requise pour l'alignement artistique.


### Rayon générique à trois phases — clôture technique candidate

- UI visible : Rayon continu 3 phases immédiatement après les effets tactiques / zone persistante, douze champs canoniques (6/3/3), ancien placement restauré pour les styles non-rayon et lors du dispose.
- Pack de démonstration `Rayon d’eau` : phase départ animée à la bouche pendant la préparation ET à l’émission; le sprite cast supplémentaire n'est plus imposé; corps continu et extrémité cible conservés dans un seul FX owner.
- Action utilisateur : `Appliquer le modèle de rayon d’eau`, accompagnée de `Annuler le modèle — retrouver mes réglages` (retour exact au style, sprites, offsets et tailles précédents avant sauvegarde). Aucune mutation des capacités enregistrées.
- Test RED CI `37817811130`; test GREEN initial `37818320673` : foundation 1293/1293, Chromium réel PASS sur regroupement 6+3+3 et 103 créatures. Sentinelle additionnelle du socket bouche du vrai `cap_water_atk_3` ajoutée ensuite.
- 0 média ajouté/remplacé. Rapport : `docs/LAB_BEAM_SIMPLIFIED_REVERSIBLE_UI_V1.md`; attente de la CI documentaire finale, checkpoint GREEN et Pages SUCCESS. Validation tactile/esthétique Android séparée.


## 2026-10-08 — Continuité rayon : audio de trajet et raccord des offsets

- Reprise depuis `gh-pages` SHA `76524b596d6e421de1a0e7563ddb615e3a0024f9` GREEN (CI + Pages), sur checkpoint préexistant `checkpoint/lab-start-beam-continuity-sound-offsets-v1-2026-10-08` et branche préexistante `work/lab-beam-continuity-sound-offsets-v1-2026-10-08`. La branche n'avait aucun delta avant reprise.
- Retour utilisateur : mieux relier départ bouche → rayon → impact, pas de charge supplémentaire; conserver panneau générique 3 phases près zone et Undo du préréglage. Ne rien dupliquer dans l'UI.
- Audit causal : `CombatResolutionPresenter.presentRelease` démarre l'audio `travel` uniquement si `form===projectile`, alors que le plan FX reconnaît `beam`. `presentOutcome` n'annule le visuel de trajet qu'en cas de `projectile`, alors que `cancelProjectileFor` du renderer possède déjà le nettoyage `beam`. Les deux exclusions créent une discontinuité sonore/visuelle à la résolution.
- Autre défaut : `DomSkillFxRenderer.positionBeam` relie les centres géométriques source/cible sans les offsets V9 de cast/impact, pourtant l'éditeur expose des décalages; le cast peut être décentré du départ et le corps ne finit plus sur l'impact.
- Périmètre micro-lot : étendre le **même presenter audio/FX** à `beam` (comme `projectile`), et faire relier le **même renderer** à la position du cast à la source et à l'offset d'impact cible; suivi dynamique pendant l'action. Pas de moteur/binding ou horloge bis. Conserver l'animation de contact et le traitement immunité/esquive.
- Fichiers attendus : `src/adapters/renderer/combat-resolution-presenter.js`, `src/adapters/renderer/dom-skill-fx.js`, tests unitaires et docs. Rien de plus sans nécessité prouvée.
- TDD RED : reproduire le défaut de son travel absent et de non-annulation à l'impact pour `beam`; démontrer que le rayon suit le cast/impact malgré offsets et cible mouvante. GREEN : Node, CI structure, Chromium 103 créatures, publication uniquement avec lease et checkpoint.
- Protégés : 103 créatures, `cap_water_atk_{1,2,3}` et ses JSON auteur, FX/médias globaux, dégâts, énergie, timings, réglages UI de rayon existants, `main`, `Zombicide-40k`, Exploration.
- La conformité artistique réelle et les sons entendus sur Android demeurent une validation utilisateur distincte.


### Rayon continuité audio / offsets — clôture technique candidate

- Causes corrigées dans les propriétaires existants : `CombatResolutionPresenter` (beam audio travel, stop à impact + nettoyage FX) ; `DomSkillFxRenderer` (origine rayon = point cast avec offsets, extrémité = impact avec offsets, suivi de cible) ; `CaptureSkillPresentationAssetsV2` (embout d'impact résolu dans la vue de la cible, pas du lanceur).
- Tests RED `37827929958` et `37828136771`, GREEN `37828213599` : **1296 Node PASS, 0 FAIL**, Chromium 103 créatures PASS.
- Rapport : `docs/LAB_BEAM_CONTINUITY_SOUND_OFFSETS_V1.md`. 0 média ajouté, aucune modification de skill auteur, modèle rayon UI ni moteur de dégâts/timing.
- Reste : CI du dernier commit documentaire, checkpoint GREEN exact et preview, déplacement Pages protégé sur base `76524b596d6e421de1a0e7563ddb615e3a0024f9`, Pages SUCCESS. Validation artistique Android distincte.


## 2026-10-08 — Beam Seam & Audio Editor V1

- Retour utilisateur : pas de choix de son visible dans les trois phases de Rayon ; vide visuel entre le départ à la bouche et le corps pendant le tir.
- Base exacte déployée : `0c2386aa8526bb74867259ee8a14a803a8cb9a9e` (Beam Continuity Sound Offsets V1, CI Node/Chromium et Pages GREEN).
- Checkpoint départ : `checkpoint/lab-start-beam-seam-audio-editor-v1-2026-10-08` ; branche isolée : `work/lab-beam-seam-audio-editor-v1-2026-10-08`.
- Propriétaires : `CaptureBeamStageLayoutV1` = déplacement UI des *mêmes* trois champs audio canonique cast/travel/impact dans leurs phases ; `DomSkillFxRenderer` = géométrie du *même* corps de rayon et raccords des deux embouts. `CombatResolutionPresenter` et catalogue audio déjà GREEN : protégés, inchangés.
- Périmètre autorisé : `src/ui/capture-editor-beam-stage-layout-v1.js`, `src/adapters/renderer/dom-skill-fx.js`, le libellé dans `examples/dom-demo/capture-editor-v2.html`, tests de layout et de continuité, docs.
- Invariants : 1 seul sélecteur par son/phase (pas de nouvelle authority), choix audio et boutons Écouter inchangés, réversibilité de l'UI au changement de style et au dispose, source fixe sur socket bouche, longueur/angle dynamiques, dégâts/contact/temps et suivi de cible inchangés, protection 103 créatures et autres capacités.
- Plan TDD : RED sur trois sélecteurs audio non déplacés et recouvrement de corps absent ; GREEN sur correctif minimum et CI Node + browser réel 103 créatures ; checkpoint exact après CI, publication Pages contrôlée et validation esthétique Android séparée.
- Protégés : les assets d'origine, capacités auteur Eau, modes non-Beam, Combat Runtime, 103 créatures, `main`, `global-assets`, `Zombicide-40k`, Exploration.


### Beam Seam & Audio Editor V1 — clôture technique candidate

- Régression reproduite : absence des trois sélecteurs son du panneau Beam et corps visuel sans recouvrement sous ses deux embouts.
- Correction : 15 contrôles canoniques (7 départ + 4 corps + 4 impact), mêmes rôles Audio et mêmes boutons Écouter, sans duplication ; `DomSkillFxRenderer` prolonge la même image du corps sous les deux embouts sur les ancres autoritaires (35 % du diamètre de cap, borné pour les petites distances). Rayon ancien sans cap inchangé.
- Test RED : `37830555903`, `37830560916` ; navigateur RED intermédiaire `37830679214` uniquement sur ancienne cardinalité attendue 12, sentinelle recalée à 15.
- GREEN avant doc : CI `37830808315`, 1296 / 1296 Node PASS et Chromium 103 créatures PASS en 4 scénarios, dont CDN inaccessible/suspendu.
- Rapport : `docs/LAB_BEAM_SEAM_AUDIO_EDITOR_V1.md`.
- Suite : CI du commit documentaire final, checkpoint GREEN exact, preview et déploiement gh-pages avec protection du SHA, validation Android utilisateur. Aucun GREEN artistique avant confirmation tactile.


## 2026-10-08 — Jet pressurisé : remplacement exact du preset auteur Beam V1 (en cours)

- Demande utilisateur : remplacer le preset vitrine de `cap_water_atk_3` par l'export `capture-skill-transfer-v1` joint au message, sans reconfigurer silencieusement les champs.
- Source de vérité : export `gensrpg-capture-skill-cap_water_atk_3(1).json` (ID `cap_water_atk_3`, forme `beam`, effets/FX/sons auteur). Le fichier Showcase préexistant est actuellement `projectile`.
- Base exacte : `de8afdce8a3944ecf19e52176b5dfa8e86c756d0` (`gh-pages` techniquement GREEN).
- Checkpoint départ : `checkpoint/lab-start-water-atk3-beam-author-update-v1-2026-10-08`.
- Branche de travail : `work/lab-water-atk3-beam-author-update-v1-2026-10-08`.
- Propriétaire autoritaire inchangé : `configuredSkills` ; intégration depuis `data/capture/showcase/cap_water_atk_3.capture-skill-transfer-v1.json` déjà déclaré par le catalogue Showcase. Pas de nouvelle copie.
- Périmètre : JSON auteur existant, tests ciblés de chargement/round-trip/runtime/son/loadout et sentinelles déjà liées à l'ancien fichier, documentation de rapport et présente ligne de reprise.
- Protégés : autres presets, 103 créatures et leurs loadouts, combat gameplay et FX, moteurs, bibliothèques assets, `main`, `global-assets`, dépôts GenSrpG et Exploration.
- Audit initial : ancien chantier `work/lab-water-atk3-author-after-beam-v1-2026-10-08` divergé et déjà clos, ne contient pas le Beam actuel ; les assets de départ/corps et les deux sons existent dans les catalogues actuels.
- TDD : RED sur mismatch ancien preset (`projectile`) versus auteur (`beam`) et valeurs précises ; GREEN sur import `capture-skill-transfer-v1`, identifiant unique dans `configuredSkills`, non-mutation des loadouts et tests Node + Chromium; création checkpoint GREEN uniquement après CI ; Pages sous lease et validation Android utilisateur séparée.

### Jet pressurisé Beam auteur — clôture technique candidate

- Export auteur intégré **sans mutation** : empreinte SHA-256 sémantique `d17d57096c9e694023fca2727ff24f35bb9abb05421954a34c83d7727be1b6df`, version du fichier Showcase inchangée (`capture-skill-transfer-v1`, v1).
- La forme historique `projectile` devient exactement `beam` avec `power: 0`, 3 phases visuelles de l'export, deux sons ID stables, timings/dégâts/prérequis conservés.
- Le catalogue vitrine référence déjà le fichier une seule fois ; l'import canonique remplace `configuredSkills` sous le même ID ; Maraileron garde `cap_water_atk_3` dans `slot-3`. Pas de nouveau propriétaire.
- Tests RED : `37838171203`; anciens attendus désuets RED `37838220805` / `37838237222`, alignés sans neutraliser les sentinelles.
- Code GREEN : CI `37838330911` SUCCESS — **1298/1298 Node PASS, 0 FAIL** ; vrai Chromium creature-library-browser SUCCESS (103 créatures).
- Documentation : `docs/LAB_WATER_ATK3_BEAM_AUTHOR_UPDATE_V1.md`.
- Avant checkpoint GREEN : CI du commit documentaire final, comparaison du delta et branche publiée avec lease. GREEN utilisateur uniquement après validation smartphone du Beam et de l'audio.


## 2026-10-09 — Ciblage soin et confirmation PV V1 (en cours)

- Retour smartphone : compétence de soin perçue comme indisponible (icône grise sur cible ennemie initiale), découverte fortuite du ciblage sur soi ; absence de confirmation claire après soin.
- Base exacte `gh-pages` : `b13aeb6616bc94f9b01c4b4ef8551debc4c7a9f6` (CI Node, Chromium et Pages SUCCESS).
- Checkpoint de départ : `checkpoint/lab-start-heal-target-clarity-v1-2026-10-09` ; branche : `work/lab-heal-target-clarity-v1-2026-10-09`.
- Propriétaires : `src/ui/combat-2v2-test-ui.js` seul propriétaire du ciblage HUD et de l'indication des candidats ; `CombatSession.previewSkill` et `isSkillTargetAllowed` restent seuls arbitres de faisabilité ; `CombatRuntime.onHealthDelta` propriétaire des deltas de PV effectivement constatés ; renderer `DomSkillFxRenderer` propriétaire du nombre flottant.
- Causes auditées : `initialTargetId` est un ennemi ; `renderAvailability` désactive une compétence si ce seul ennemi n'est pas admissible, sans offrir le ciblage ; `onHealthDelta` des deux UIs ignore explicitement `heal`, bien que `applyImmediateTacticalEffectsV1` augmente déjà les PV et émette `heal` ; au plafond PV il n'y a aucun delta et aucun retour.
- Périmètre : commandes UI 2v2/HUD de ciblage et indicateurs CSS `examples/dom-demo/demo.css` ; projection de `heal` dans les deux consommateurs runtime santé sans recalcul ; FX flottant générique `dom-skill-fx.js` ; message du résultat (incl. soin à 0 effectif) dans UI 2v2 ; tests unitaires/integration + documentation. Modifier le presenter uniquement si le faux hit visuel sur soin est reproduit par sentinelle.
- Protégés : calculs de soins/dégâts, Combat Rules/Runtime/Session, `configuredSkills`, bibliothèques assets/audio, 103 créatures, loadouts, Jet pressurisé, `main`, `Zombicide-40k`, Exploration.
- TDD RED : soigneur ne peut activer tant que cible ennemie initiale ; aucune cible conseillée ; soin de PV ne produit pas de feedback `+X` ; soin 0 PV n'affiche pas plafond ; revue de l'ancien coup reçu au lieu de soin. GREEN : libérer les boutons si au moins une cible légale peut recevoir l'action ; armer/mettre en évidence les candidats et confirmer sur cible ; message d'usage ; positif exact basé sur `health-delta`; aucune mutation de données ni nouveau moteur ; CI Node, vrai navigateur Chromium 103 créatures, Pages après lease et validation Android distincte.

### Recadrage protocolaire après RED du vrai chemin métier

- Nouveau défaut **reproduit**, non présumé : test `tests/unit/combat-heal-target-clarity-v1.test.mjs`, CI RED `37911752242` : `createCombatSession.useSkill()` applique le soin V1 `effects: [{kind:"heal", ...}]`, mais n'applique **aucun soin** pour le champ historique d'éditeur `effect.heal: 25` (40 PV restent 40 au lieu de 65).
- Extension ciblée des fichiers autorisés **avant correction** : `src/core/combat/immediate-tactical-effects-v1.js`, propriétaire existant de l'application de soin ; seul le chemin d'adaptation local de `effect.heal` au même calcul V1 est autorisé, jamais un moteur parallèle. `src/adapters/renderer/combat-resolution-presenter.js` autorisé uniquement à éviter une fausse animation de coup subi lorsque l'action ne fait que soigner, avec sentinelle.
- Invariants : `normalizeSkillDefinition` interdit déjà de cumuler un soin historique positif et un effet tactique de soin sur la même compétence ; zéro duplication possible. Soin appliqué à la cible de l'action, avec plafond PV centralisé `withFighterHp`, événement `heal` existant. Pas de modification du contrat sauvegardé, des loadouts ni de la résolution de dégâts.

### Soin ciblage / Runtime — clôture technique candidate

- RED UI `37911211779`; RED vrai Combat Session `37911752242` (legacy `effect.heal:25` donne 40 PV au lieu de 65, effet moderne exact); RED animation faux `hit` `37911881310`.
- Corrigé : éligibilité du bouton par candidats vivants autorisés `isSkillTargetAllowed` + `session.previewSkill` (sans double autorité) ; un clic sur l'icône arme la compétence et révèle visuellement les cibles valides, un clic sur le monstre exécute le sort ; clic direct conservé quand cible déjà compatible. Signal ciblage annulable/changement de roster/action.
- Corrigé : `effect.heal` legacy est acheminé une seule fois par `applyImmediateTacticalEffectsV1` vers `withFighterHp` ; aucun second calcul. `heal` et `damage` visibles depuis `CombatRuntime.onHealthDelta` sur les deux clients, vert `+PV`, sans faux flash de dégâts et sans recul `hit` lorsque le soin pur ne retire aucun PV ; message si PV déjà maximum.
- CI code `37911958753` SUCCESS : **1304 Node PASS, 0 FAIL**, vrai Chromium (103 créatures) SUCCESS. Rapport `docs/LAB_HEAL_TARGET_CLARITY_V1.md`.
- Encore nécessaire : CI finale sur SHA exact du rapport, revue du diff, checkpoint GREEN technique, preview et Pages déployée avec lease; validation smartphone utilisateur distincte.

### Soin / ciblage — code GREEN après revue finale

- Dernière CI code `37912170724` SUCCESS : **1304 / 1304 Node PASS**, 0 FAIL et **vrai Chromium creature-library-browser SUCCESS** (103 créatures, quatre scénarios dont réseau média dégradé).
- Revue additionnelle : le client combat 1v1 ne doit jamais flasher une animation de dégât sur un `heal`; garde `damageFeedback.flash` uniquement si `feedback.kind === "damage"`.
- 0 assets ajoutés/modifiés ; aucune capacité ou créature modifiée ; aucune dépendance runtime à `Zombicide-40k`.
- Prévu une fois CI de clôture GREEN : `checkpoint/lab-heal-target-clarity-v1-green-2026-10-09`, `preview/lab-heal-target-clarity-v1-2026-10-09`, `gh-pages` par fast-forward protégé et validation Android ultérieure.


## 2026-10-09 — Onde régénérante : intégration exacte de l'export auteur V1 (en cours)

- Retour utilisateur : avant de tester la nouvelle UX des soins, intégrer/remplacer sa capacité exportée `gensrpg-capture-skill-lib_aqua_heal(1).json`.
- Source de vérité : export joint `capture-skill-transfer-v1`, ID `lib_aqua_heal`, nom `Onde régénérante`.
- SHA de base exact publié `df45bd9a7c87213e6bb4b90034b7559f0cc78549` (lot Heal Target Clarity V1, CI Chromium + Pages SUCCESS).
- Checkpoint de départ `checkpoint/lab-start-aqua-heal-author-preset-v1-2026-10-09` ; branche isolée `work/lab-aqua-heal-author-preset-v1-2026-10-09`.
- Propriétaire : `configuredSkills`, alimenté exclusivement par `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` et le pipeline `importCaptureTransferJsonV1` / `applyCaptureTransferBatchToEditorStateV1` en mode `replace`.
- Périmètre : un JSON auteur dans `data/capture/showcase/`, une entrée canonique au registre de presets existant, nouveaux tests sentinelles et rapport de reprise ; pas de modification runtime ni donnée créature.
- Protégés : toutes les autres capacités, les 103 créatures, loadouts, règles de combat, FX, son, `main`, `global-assets`, `Zombicide-40k`, Exploration et leurs branches parallèles.
- Audit ID : `lib_aqua_heal` ne figure pas dans les catalogues de compétences native/vitrine publiés : insertion initiale dans le Showcase ; toute fiche locale préexistante du même ID est remplacée, jamais dupliquée.
- **Avertissement auteur critique** : l'export a `effect.heal = 0`, `effects = []` et `presentation = null`, donc ne produit aucun gain de PV et ne possède aucun FX auteur. Sa description promet une cible alliée, mais `targetRelations = [\"self\"]` / `form = \"self\"` limite réellement au lanceur. `requiredLevel = 15`. Ces valeurs seront préservées sans correction silencieuse.
- TDD : RED sur preset/catégorie absent, GREEN sur import exact, round-trip, sélection `configuredSkills`, non-duplication/replacement, préservation des 103 créatures/loadouts, test réel de 0 gain PV conforme à l'export, CI complète Node + Chromium et Pages uniquement avec lease. Aucun GREEN d'efficacité de soin ni validation Android avant export valide doté d'un soin positif et test smartphone.

### Onde régénérante — transfert auteur importé / code GREEN

- Source utilisateur `lib_aqua_heal` importée sans réécriture : SHA-256 sémantique `05e90de6436a45288b33ce172f65ad3a94f8a77726abb3e821bb6f0b055af13a` (v1, ID stable, niveau 15, cible self, coût 8, 2500 ms, 30000 ms cooldown, `heal=0`, `effects=[]`, `presentation=null`).
- Un seul nouveau fichier `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json`, une déclaration dans `capture-showcase-skill-presets-v1.js`; réutilisation de `configuredSkills` et de l'import batch atomique `mode:replace`, sans toucher aux loadouts des 103 créatures ni au Runtime.
- TDD RED `37914000943` (nouvelle entrée et fichier auteur absents). CI `37914060477` SUCCESS (1308 Node PASS, 0 FAIL, navigateur des 103 créatures PASS).
- La sentinelle Chromium étendue a d'abord échoué à compiler à cause de sa regex de test (`37914191826`), puis corrigée par un parseur de sélection sans ambiguïté.
- CI dernier code `37914308875` SUCCESS : **1308 Node PASS, 0 FAIL** ; **Chromium réel PASS**, 103 créatures et 112 capacités actives ; `lib_aqua_heal` exactement 1 fois, `cap_water_atk_3` toujours présent ; réseau visuel bloqué/suspendu vérifié.
- Rapport `docs/LAB_AQUA_HEAL_AUTHOR_PRESET_V1.md`. Aucun asset ajouté (0 média).
- Limite explicite : cet export ne soigne réellement **aucun PV**. L'intégration du preset peut être GREEN technique, mais pas la fonction de guérison; un nouvel export avec effet heal positif est nécessaire pour ce test fonctionnel. Description alliée et ciblage self contradictoires tels qu'exportés : aucune correction silencieuse.
- Suite : CI du dernier commit documentaire, revue du diff exact, checkpoint GREEN, preview, promotion `gh-pages` sous lease et contrôle du Pages SUCCESS; validation tactile utilisateur séparée.


## 2026-10-09 — Audit perte déclarée du soin périodique à l'export : traçabilité et avertissement

- Source utilisateur : `lib_aqua_heal` devait contenir un soin périodique mais export joint `effects=[]`, `effect.heal=0`, `presentation=null`. Ne pas prétendre que l'utilisateur n'avait jamais configuré son soin. Ne pas inventer montant/durée.
- Base `gh-pages` : `c631699d5d4e0de5a3fee27d59cb0576c10bc0ec`. Checkpoint départ `checkpoint/lab-start-hot-editor-export-audit-v1-2026-10-09`. Branche : `work/lab-hot-editor-export-audit-v1-2026-10-09`.
- Propriétaires : `readHumanSkillEffectsV1` -> `buildHumanSkillDraftV1` -> `exportCaptureSkillTransferJsonV1` (inchangés), avertissement uniquement présentation dans `src/ui/capture-editor-human-v2.js`.
- Reproduction vrai navigateur : ajout HoT 7 PV / 1,5 s / durée 6 s, sauvegarde Mise à jour puis export JSON Blob ; **toutes les valeurs préservées**. CI `37918935392` SUCCESS. Le parcours testé ne démontre pas de défaut d'export ; cause de la perte d'origine inconnue.
- Correctif préventif minimal : catégorie `heal` sans soin réel positif, le message d'export annonce clairement `aucun effet de récupération de PV` ; le fichier auteur non modifié reste téléchargeable, aucun moteur/règle/timing bis. Sentinelles Node et Chromium dédiées.
- TDD RED `37919156484` : UI n'avertissait pas ; GREEN `37919247696` : **1312/1312 Node PASS** et Chromium réel PASS avec mise à jour + export HoT + avertissement sur brouillon sans soin + 103 créatures et Jet pressurisé.
- Rapport : `docs/LAB_HOT_EDITOR_EXPORT_AUDIT_V1.md`.
- Protégés : preset `lib_aqua_heal` source, les autres skills, 103 créatures et leurs loadouts, FX, sons, Combat Runtime, `main`, `global-assets`, `Zombicide-40k` et Exploration.
- Suite : CI documentaire finale sur SHA exact, checkpoint GREEN et preview, promotion `gh-pages` par fast-forward lease, CI + déploiement Pages, test tactile Android. Ne pas annoncer correction d'une perte historique non reproduite.


## 2026-10-09 — Onde régénérante, soin immédiat et soin périodique configurés à la demande (en cours)

- Instruction explicite utilisateur : remplacer la fiche existante `lib_aqua_heal` avec **5 PV immédiatement lorsque le sort se résout**, puis un statut de soin sur **20 s** de **5 PV toutes les 3 s** ; garder tous les autres paramètres (dont `self`, niveau 15, coût 8, prépa 2500 ms, cooldown 30000 ms, identité).
- Base exact `gh-pages` : `de6ec3eb1caf524475ef9c8256b6bd085bacee72` (dernier GREEN audit export HoT). Checkpoint : `checkpoint/lab-start-aqua-heal-five-plus-hot-v1-2026-10-09`. Work : `work/lab-aqua-heal-five-plus-hot-v1-2026-10-09`.
- Autorité : seul transfert `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json`, consommé par `configuredSkills` déjà existant, remplacement par ID, aucun autre catalogue ni variante spéciale.
- Représentation canonique souhaitée : `definition.effect.heal=0` car effets tactiques actifs ; `definition.effects=[{kind:"heal",targetScope:"self",amount:5},{kind:"apply_status",targetScope:"self",status:{id:"lib_aqua_heal_regeneration",kind:"heal_over_time",polarity:"beneficial",durationMs:20000,stacking:"refresh",amount:5,tickIntervalMs:3000,tags:[]}}]`.
- 6 ticks complets à t=3,6,9,12,15,18 s depuis l'application, théoriquement +5 immédiat +30 en 20 s (cap PV appliqué).
- TDD RED : corriger sentinelle historique de preset zéro soin en sentinelle de soins demandés, test réel CombatSession à instant puis ticks exacts, non-duplication, round-trip éditeur et retour à la bibliothèque, navigateur 103 créatures, autres capacités & loadouts intacts.
- Protégés : nom, description, forme, cible `self`, tous timings/coûts hors effet, `presentation=null`, 103 créatures et loadouts, autres capacités, moteur/FX/assets, `main`, `Zombicide-40k`, labo exploration.
- GREEN technique uniquement après CI Node + Chromium du SHA exact, checkpoint et revue diff, publication `gh-pages` par fast-forward protégé avec lease, Pages SUCCESS. Validation smartphone distincte.

### Onde régénérante +5 immédiat et +5/3 s pendant 20 s — code GREEN

- À la demande expresse de l'utilisateur, remplacement ciblé des effets vides de `lib_aqua_heal` uniquement; tous les paramètres antérieurs conservés, dont soin sur soi, niveau 15, coût 8, préparation 2500 ms, cooldown 30000 ms.
- Deux effets tactiques dans la fiche active `configuredSkills` issue du transfert canonique : `heal amount=5 targetScope=self` puis `apply_status heal_over_time amount=5 tickIntervalMs=3000 durationMs=20000 targetScope=self`. Le legacy `effect.heal=0` évite le double comptage.
- Ticks exacts à 3/6/9/12/15/18 s, statut expiré à 20 s ; jusqu'à 35 PV au total (si manque de PV suffisant), avec plafond PV autoritaire.
- RED sur l'ancien export non soignant : CI `37921315324` FAILURE attendu.
- Code GREEN CI `37921721141` **SUCCESS : 1315 Node PASS, 0 FAIL** ; vrai Chromium SUCCESS, 103 créatures conservées, lib_aqua_heal une seule fois parmi 112 capacités, Jet pressurisé intact, éditeur recharge les 2 effets et permet un 3e HoT édité/exporté sans perdre les deux existants.
- Sentinelles anciennes réconciliées avec la nouvelle intention utilisateur ; avertissement export sans soin reste testé sur un brouillon explicitement vide, sans perdre cette protection.
- Documentation : `docs/LAB_AQUA_HEAL_FIVE_PLUS_HOT_V1.md`. Aucun changement moteur, FX, asset, audio, catalogue, ni loadout ; seul JSON preset + tests + documentation.
- Suite : CI du commit doc final exact, revue diff, checkpoint/preview et `gh-pages` par mise à jour sous lease, Pages et CI de branche publiées GREEN ; vérification tactile Android ultérieure.


## 2026-10-09 — Réglage opacité des sprites de capacité V1 (en cours)

- Demande utilisateur : une aura de soin peut cacher intégralement la créature en layer front et disparaître en layer behind ; proposer une transparence réglable sur cast, aura/zone et aura de buff/debuff ; conserver indépendance du calque et des offsets.
- Base publiée GREEN : `176bd50b528364dd5507f50b824e32d610c4991f` ; checkpoint de départ `checkpoint/lab-start-sprite-opacity-controls-v1-2026-10-09` ; branche `work/lab-sprite-opacity-controls-v1-2026-10-09`.
- Autorité UNIQUE : propriété `opacity` existante (0..1) dans SkillPresentationBindingV1/V9, résolue par `capture-skill-presentation-assets-v2`, appliquée par le renderer DOM. Le Human Editor propose un pourcentage 0..100 (100 par défaut pour les nouveaux cast/zone ; retour fidèle des sprites existants) puis le convertit à la frontière input/output, sans contrat gameplay ni moteur d'opacité bis.
- État de référence : `dom-skill-fx` applique déjà `persistentZone.opacity` et `dom-status-fx` applique `sprite.opacity`. En revanche les keyframes cast forcent 0.35 -> 1 -> 1 ; le Human Editor n'expose pas la propriété pour cast/zone ; le sprite de statut expose actuellement l'opacité en fraction peu intuitive 0.05..1.
- Périmètre : `src/ui/capture-editor-sprite-controls-v1.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, `src/adapters/renderer/dom-skill-fx.js`, tests ciblés de contrat/éditeur/export/renderer + navigateur, rapport `docs/LAB_SPRITE_OPACITY_CONTROLS_V1.md`, et ce registre. Ajuster le mapping sprite status uniquement dans le Human Editor existant.
- Protection absolue : conserver les 103 créatures, toute la bibliothèque configurée, Onde régénérante +5 immédiat +5/3s 20s, Jet pressurisé et ses trois phases, beam, cast burst/particles (pas de modification de leur intensité), zone hit/ticks, effets status, chemins audio/FX, `main`, dépôt GenSrpG et Exploration.
- Tests RED→GREEN : réglages cast 45% / zone 30% / statut 40% depuis les vrais champs, round-trip exact draft/export/import/editor, valeurs par défaut inchangées, validation 0/100, application aux keyframes cast sans altérer le mode de playback, zones/status natifs, vérification du vrai éditeur Chromium et bibliothèque 103 créatures. Aucune seconde autorité ni nouveau catalogue.
- Publication : CI Node + Chromium GREEN sur SHA exact, diff revu, checkpoint GREEN et preview, promotion `gh-pages` par fast-forward sous lease, Pages CI SUCCESS ; validation du rendu sur smartphone utilisateur distincte.


### Opacité des sprites — candidat GREEN avec vrai navigateur

- Contrat conservé : `opacity` V9 déjà existant, en unité 0..1. UI 0..100 % pour cast/zone et sprite de statut ; 100 % par défaut pour anciens cast/zone, statut ancien `0.85` projeté en `85 %`.
- Défaillance reproduite : `visualSlot` forçait `opacity:1` même lorsque le translator avait lu 40 % ; animations cast ignoraient également le pourcentage. Correction dans leurs propriétaires existants, pas de double système.
- RED `37934285797` : nouvelles sentinelles de mapping, rendu, export, UI échouaient avant implémentation. Correctifs progressifs ; la CI `37934561893` ne restait rouge que par comparaison flottante strictement exacte 0.13999999999 contre 0.14, sentinelle ajustée à une tolérance numérique.
- Code + vraie interface Chromium **SUCCESS**, run `37935175618` sur SHA `5b9838a08a0abf402b5c814e7a979db81a3fce2b` : **1320/1320 Node PASS, 0 FAIL** ; vrai navigateur 103 créatures PASS ; échange Beam intègre ; auteur `lib_aqua_heal` et HoT conservés ; édition/sauvegarde/export depuis le vrai navigateur **cast 40 % / zone 25 % / aura de statut 35 %** conservés dans le fichier exporté.
- Exécution intermédiaire `37934960758` : timeout ponctuel Chromium 50 secondes lors du nouveau scénario sans échec Node ; même scénario passé en `37935175618` sans changement de son code. Pas de preuve de régression fonctionnelle, mais le timeout ponctuel reste documenté.
- Rapport `docs/LAB_SPRITE_OPACITY_CONTROLS_V1.md` ; 0 asset modifié, 0 capacité modifiée, aucune dépendance GenSrpG.
- À faire : CI finale du SHA exact après la documentation, revue de branche, checkpoint et preview, promotion sous lease `gh-pages`, CI + Pages SUCCESS, validation smartphone sur vrai rendu ensuite.


## 2026-10-09 — Progression cinq capacités et niveau de combat de test isolé (en cours)

- Instruction utilisateur : déblocage de 1 capacité niveau 1, 2 niveau 5, 3 niveau 10, 4 niveau 15, 5 niveau 20. Le loadout canonique dispose déjà de **quatre slots standards + un slot Ultime**. Le cinquième palier déverrouille l'Ultime, jamais un cinquième standard fictif.
- Instruction utilisateur : pouvoir tester sans éditer chaque créature ; le combat de test de l'éditeur applique niveau 20 (modifiable depuis les options de test) à toutes les occurrences engagées et de réserve, sans mutation des fiches enregistrées, loadouts, stats ni progression d'une vraie partie. Une nouvelle créature conserve son niveau de départ 1 ; les fiches existantes ne sont pas réécrites arbitrairement.
- Base `gh-pages` exacte `ac418d9a92ee3e53434bafebd9584830e191487a` ; checkpoint départ `checkpoint/lab-start-progression-preview-level-v1-2026-10-09` ; travail `work/lab-progression-preview-level-v1-2026-10-09`.
- Propriétaire unique progression : `data/capture/monster-capture-progression-rules.v1.json` -> `capture-progression-rules-v1` -> `capture-planned-loadout-to-combat-v1`. Propriétaire test : `buildCaptureEditorCombatTestV1` qui projette les drafts dans `exportCaptureEditorDraftsToCombatExportV3`, aucun stockage de niveau de test dans `configuredCreatures`.
- Périmètre : fichier JSON progression, `src/adapters/input/capture/capture-planned-loadout-to-combat-v1.js`, `src/contracts/capture-progression-rules-v1.js` si nécessaire, `src/ui/capture-editor-human-v2.js` (UI progression + test level), `src/ui/capture-editor-combat-test-v1.js`, `examples/dom-demo/capture-editor-v2.html`, tests unitaires + vrai navigateur, documentation.
- Protections : pas de modification de presets créatures ni auteur `lib_aqua_heal`, ses +5 PV et HoT, aucune capacité Jet/Beam, 103 créatures, 112 capacités, FX/sons/renderer, `main`, `Zombicide-40k`, Exploration. Aucun changement du niveau de la fiche lors des exports de base/imports/jeu ni des choix de loadout futurs.
- TDD : défauts RED du calendrier et de l'accès prématuré à l'ultime, projection du niveau test, absence de mutation, UI visible 20 et export réel Chromium, CI Node+Chromium, checkpoint GREEN + preview + promotion gh-pages par fast-forward lease et Pages success. Niveau utilisateur smartphone à valider.
- Capacité export annoncée par l'utilisateur : aucune pièce jointe nouvelle dans ce message ; vérifier dès réception, ne pas substituer la précédente au nouveau fichier.


### Progression cinq capacités + test niveau 20 — candidat GREEN

- Implémenté : règle 1/5/10/15/20 → 1/2/3/4/5 depuis le fichier propriétaire ; cinquième slot = Ultime existant, quatre standards inchangés ; règles custom legacy quatre places préservées.
- Le Human Editor affiche les cinq étapes et propose niveau 20 (sélecteur de niveau de test 1..100). `buildCaptureEditorCombatTestV1` projette le niveau seulement sur des drafts éphémères de l'export Combat ; aucune mutation de `configuredCreatures`, aucune réécriture de `level` dans la base ou les imports.
- CI `37938743309` SHA `69ecdf6d37dbe04e1c95c31edfaedaf8c1b4b65b` **SUCCESS : 1324 Node PASS, 0 FAIL, navigateur Chromium réel PASS** ; 103 créatures, 112 compétences, Onde régénérante et ses effets précédemment publiés, Jet Beam et réglages opacité intacts.
- Rapport `docs/LAB_PROGRESSION_PREVIEW_LEVEL_V1.md`. Le nouvel export de soin joint présente 3 PV périodiques, différent des 5 PV précédemment demandés : ne pas écraser la capacité durant ce lot non lié.
- À faire : CI sur SHA documentaire, revue diff exacte, checkpoint GREEN, preview et promotion Pages sous lease ; validation utilisateur smartphone distincte.


## 2026-10-09 — Bulle de soin aquatique : raccord au catalogue du labo

- Source canonique média publiée : branche `global-assets`, SHA `b4dd093f9e449c3a9b2e2563b1f9a87cda6eaf62`, CI `37940236407` SUCCESS ; 20 WebP 512×512 + atlas 20×384, unique ID `pack:capture:sprite-water-healing-bubble-01` dans le catalogue (119 assets/66 sprites).
- Base labo `gh-pages` `ac8cef7e01159d28c42cc9cd54e0c24f62951890`, checkpoint `checkpoint/lab-start-water-healing-bubble-library-refresh-v1-2026-10-09`, branche isolée `work/lab-water-healing-bubble-library-refresh-v1-2026-10-09`.
- Unique modification runtime : augmenter `GLOBAL_VISUAL_LIBRARY.revision` à `2026-10-09-v20-water-healing-bubble` pour rafraîchir la bibliothèque visuelle existante sans doubler résolveur, index ou ownership.
- Test : vérifier `catalogUrl`, branche et URL de l'atlas ainsi que le cache-buster et la CI complète. Éditeur choisira cet asset par identifiant, sans affectation forcée à `lib_aqua_heal` : conserver exactement son `presentation=null` et ses deux effets tactiques actuels.
- Protégés : les 103 créatures, 112 compétences, slots progression, assets historiques soin, `main`, moteur/soins/Beam, `Zombicide-40k`, Exploration.
- Attendre CI GREEN avant checkpoint final, preview et éventuelle publication `gh-pages` par lease ; validation utilisateur mobile séparée.


### Bulle de soin aquatique — code GREEN, validation technique du 2026-10-09

- Assets officiellement publiés sur `global-assets` SHA `b4dd093f9e449c3a9b2e2563b1f9a87cda6eaf62`, CI assets `37940236407` SUCCESS.
- Dans le labo, seul le cache-buster de la bibliothèque visuelle canonique évolue vers `2026-10-09-v20-water-healing-bubble` ; le nouvel identifiant reste `pack:capture:sprite-water-healing-bubble-01`. Aucun composant propriétaire doublé.
- RED initial `37940678898` : deux anciennes sentinelles imposaient un numéro de catalogue périmé. Assertions d'origine (IDs et chemins du catalogue, Jet pressurisé) préservées, seule la révision attendue mise à jour.
- GREEN `37940962875` sur SHA `491f5a94abc50e05b67cfe54d7ae7a66ddf9b421` : **1325 tests Node réussis, 0 échec, vrai Chromium réussi**.
- Conserve `lib_aqua_heal`, les 103 créatures et leurs fiches, la progression 1/5/10/15/20, le Beam et ses visuels, les FX et sons, et `main`. Le sprite n'a aucune autorité sur les soins.
- Restent la CI finale de ce rapport, le checkpoint GREEN sur le SHA exact, la promotion `gh-pages` sous lease et le contrôle Pages, puis validation manuelle Android utilisateur.

## 2026-10-09 — Fidélité totale du nouvel export Onde régénérante (en cours)

- Signalement utilisateur : l'export contient une icône et une aura de régénération, mais la fiche publiée `lib_aqua_heal` ne les présente pas. Audit reproduit : `presentation:null` dans le preset publié alors que le dernier fichier auteur `gensrpg-capture-skill-lib_aqua_heal(2).json` comporte `presentation.visual.icon.assetId="core:icon-skill-recall-01"` et `presentation.statusVisuals.lib_aqua_heal_regeneration.sprite` avec assetId `pack:capture:sprite-status-healing-aura-01`, displayScale 1.7, opacity 0.45.
- **Attention source auteur** : dernier fichier enregistré `effect.heal=0`, effet tactique immédiat +5, HoT **3 PV/3 s pendant 20 s**, versus 5 PV/tick dans le preset publié. La valeur 3 est conservée conformément à la source auteur, sans ajustement silencieux.
- Base GREEN publiée (jalon progression indépendant déjà promu) `ac8cef7e01159d28c42cc9cd54e0c24f62951890`. Checkpoint de départ `checkpoint/lab-start-aqua-heal-visual-fidelity-v1-2026-10-09` ; branche isolée `work/lab-aqua-heal-visual-fidelity-v1-2026-10-09`.
- Autorité : un unique transfert auteur dans `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json`, enregistré une fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, remplacement via `configuredSkills` sans autre source de capacité.
- Asset source validée dans branche `global-assets` : l'icône `core:icon-skill-recall-01` et l'aura `pack:capture:sprite-status-healing-aura-01` se résolvent chacune dans `data/assets/catalog/global-visual-assets.v1.json` vers des fichiers physiques : `core/icons/skills/icon_skill_recall_01.webp` et `capture/sprites/statuses/healing_aura/atlases/sprite_status_healing_aura_atlas_01.webp` (8 frames à 90 ms) sous `assets/library/`.
- Périmètre : remplacement **exact** du seul transfert `lib_aqua_heal`, tests de non-perte auteur dans les sentinelles Aqua Heal, vérification sur vrai éditeur Chromium du rechargement et de l'export avec le bon visuel, une vérification du rendu statut par le resolver et renderer natifs, rapport dédié. Ajuster les anciennes sentinelles `5 PV/tick` et `presentation:null` pour refléter l'export actuel, sans altérer les règles moteur.
- Protégés : toutes les autres capacités, les 103 créatures et loadouts, la progression 1/5/10/15/20 et le niveau 20 *uniquement pour le combat de test*, les trois parties Beam, FX/moteur/réactions, audio, `main`, `global-assets`, GenSrpG et labo exploration.
- TDD : RED avant remplacement de la fiche, GREEN uniquement après tests unitaires 0 fail + Chromium réel vérifiant attributs 100 % du preset et DOM après sélection, véritable export JSON, statut sourceSkillId et rendu d'opacité 45 %. Checkpoint GREEN et preview sur SHA exact, publication `gh-pages` sous lease et CI + Pages SUCCESS. Validation visuelle smartphone ultérieure distincte.

### Reprise après publication concurrente

- Le lot indépendant de catalogue de sprites d'aura a été promu sur `gh-pages` jusqu'à `dcaaba356e8e39257f221531123797d1dc3e7c7b` pendant ce chantier. L'ancienne branche ne peut plus être promue par fast-forward.
- Reprise sur la nouvelle base : checkpoint `checkpoint/lab-resume-aqua-heal-visual-fidelity-latest-v1-2026-10-09`, branche `work/lab-aqua-heal-visual-fidelity-release-v1-2026-10-09`. Le nouveau catalogue, ses tests, et les autres travaux sont préservés ; seuls le transfert auteur, les sentinelles et le rapport sont portés.


## 2026-10-09 — Identité niveau 1 + nouvelle aura soin + zone feu semi-transparente

- Demande expresse : enregistrer le niveau **1** dans l'identité des créatures du catalogue Capture (dont les presets vitrine), sans modifier le niveau **20** déjà propre au *combat de test* ; utiliser le nouvel asset `pack:capture:sprite-water-healing-bubble-01` comme sprite de statut de `lib_aqua_heal` à la place de l'ancienne aura ; fixer l'opacité `visual.aura.opacity` à **0.5** pour l'ultime de feu `cap_fire_atk_6` (nom réel **Tempête de flammes**, niveau requis 20).
- Base exacte GREEN `gh-pages` : `e90eee467d0420de2775a128608df0ac8c8382d9`, CI `37942368913` et Pages `37942367799` SUCCESS ; checkpoint `checkpoint/lab-start-author-defaults-heal-fire-v1-2026-10-09` ; travail isolé `work/lab-author-defaults-heal-fire-v1-2026-10-09`.
- Autorités : données catalogue `data/capture/monster-capture-creatures.v1.json` (110 lignes historiques, 102 identités canoniques) et transferts auteurs vitrine `data/capture/showcase/crea*.capture-creature-transfer-v1.json` (3, dont 1 nouveau Loup) ; `configuredCreatures` reste seul propriétaire au montage ; le combat test projette le niveau 20 sur une copie de draft dans `buildCaptureEditorCombatTestV1`. Aucune écriture dans les données GenSrpG originales ni autre dépôt.
- Risque démontré : l'amorce de loadout historique sélectionne ses 4 capacités sur la base du niveau auteur ; passer les 110 niveaux à 1 ne doit **pas** effacer les choix futurs du loadout planifié. Prévoir une sélection de planification explicite dans l'autorité existante `buildCaptureCreatureHistoricalLoadoutV1` utilisée pour l'initialisation, puis laisser `projectCapturePlannedLoadoutsToCombatV1` appliquer seuls les verrous de niveau pour les combats réels/test.
- Propriétaires visuels : transfert unique `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json` et `data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json`, lus par `configuredSkills` ; garder les effets de soin tels que publiés (**+5 immédiat et +3/3 s pendant 20 s** dans dernier fichier auteur), niveau requis, échelle 1.7, opacité statut 45 % et tous les autres paramètres ; changer seulement l'assetId du sprite soin ; seul changement zone feu = `opacity:0.5`.
- Source bulle publiée `global-assets` : `pack:capture:sprite-water-healing-bubble-01`, atlas WebP 20 frames × 70 ms sous `capture/sprites/skills/water_healing_bubble/atlases/sprite_heal_water_bubble_atlas_20f_384.webp`, bibliothèque visuelle déjà rafraîchie dans le labo ; vérifier ce raccord, sans créer de média supplémentaire.
- Fichiers autorisés : sources catalogue et transferts vitrine listés, `src/catalogs/capture-creature-historical-loadout-v1.js` et seul appel à sa planification dans `src/ui/capture-editor-human-v2.js` si confirmé nécessaire, tests Node + navigateur et ce rapport. Protéger 103 identités canoniques, leurs statistiques, résistances, évolutions, visuels, capacités planifiées, modes 1v1/2v2, Beam, audio, FX, gameplay, `main`, `global-assets`, `Zombicide-40k`, Exploration.
- RED→GREEN : démontrer catalogues niveau 1, loadouts futurs complets en base niveau 1, vraie projection gameplay niveau 1 versus test niveau 20, guérison statut 20 frames & opacité 45 %, Tempête de flammes 50 %, round-trip import/export, tests Chromium ouvrant l'éditeur, 103 créatures, bibliothèques intactes. GREEN seulement après vraie CI + navigateur, revue du diff, checkpoint et preview, promotion `gh-pages` sous lease et Pages SUCCESS ; validation Android utilisateur distincte.


### Identités niveau 1, bulle de soin, opacité feu — candidat GREEN technique

- Source permanente : 110 entrées historiques (102 créatures canoniques après alias) + 3 transferts vitrine à level 1, soit 103 IDs visibles après les deux remplacements vitrine et l'ajout Loup. **Seul le combat test monte temporairement les acteurs à level 20** ; aucune donnée de création/jeu projetée au niveau 20.
- Correctif préventif au propriétaire du loadout historique : sélection `selectionMode:"planned"` uniquement lors de son amorce dans l'éditeur ; l'ancien `unlocked` reste intact. Les quatre capacités prévues restent dans les slots même si la fiche est de niveau 1 ; disponibilité effective traitée par les règles de progression actuelles 1/5/10/15/20.
- `lib_aqua_heal` : remplacement du seul sprite de statut vers `pack:capture:sprite-water-healing-bubble-01`, WebP atlas réel 20 frames, opacité 45 %, scale 1.7, gameplay strictement inchangé (+5 immédiat et +3/3s 20s dans dernier auteur).
- `cap_fire_atk_6` Tempête de flammes (ultime niveau 20) : `visual.aura.opacity=0.5`, aucune modification du sprite, tick ou rayon.
- TDD RED puis CI GREEN `37951425527` (1332/1332 Node, navigateur PASS) ; sentinelle vrai navigateur étendue pour identité level 1 sur quatre créatures (Aquafin, Maraileron, Moussados, Loup), test level 20, zone ult 50 %, bulles sur save/export, 103 créatures, rayon/HoT préservés. CI `37951515670` au SHA `6cd0df795ea7aaa6f4e3a150ffaafbd5166175e9` **SUCCESS**, 1332 tests Node, 0 FAIL + Chromium SUCCESS.
- Rapport `docs/LAB_AUTHOR_DEFAULTS_HEAL_BUBBLE_FIRE_ZONE_V1.md`. Aucun nouveau média ni modification de `global-assets`, moteur et autres labos préservés. Finaliser CI sur le SHA du rapport, revue, checkpoints GREEN + preview, promotion Pages sous lease et CI/Pages GREEN avant de revendiquer une livraison. Vérification mobile utilisateur distincte.


## 2026-10-09 — Audit Tempête de flammes croissance joueur vs IA V1 (EN COURS)

- **Objectif prioritaire** : reproduire et expliquer l'agrandissement parfois absent côté joueur, en comparant les vrais chemins joueur/IA et 1v1/2v2, puis réparer uniquement le propriétaire démontré fautif. Ne pas assimiler une expiration 7000 ms, un cooldown 3500 ms ou une préparation 2000 ms à une régression sans preuve.
- **Base vérifiée** : `gh-pages` `a1ba2b255aac28bd4fbbf71b8fd4d16ce66f0e3d`, CI `37951890492` SUCCESS, GitHub Pages `37951889696` SUCCESS (1332 tests Node + Chromium).
- **Checkpoint de départ** : `checkpoint/lab-start-firestorm-player-growth-audit-v1-2026-10-09`, créée sur le SHA exact. **Branche isolée** : `work/lab-firestorm-player-growth-audit-v1-2026-10-09`. Aucun développement sur `main` ou `gh-pages`.
- **Capacité exacte vérifiée** : `cap_fire_atk_6`, Tempête de flammes ; `persistent_zone`, `zoneId=zone`, `short → medium → long`, `reinforce`, `maxActivations=3`, `radiusGrowthSteps=1`, 7000 ms, tick 1000 ms, 5 dégâts, preparation 2000 ms, cooldown 3500 ms, délai 25000 ms, niveau 20, opacité 0.5.
- **Propriétaires candidats à départager** : `Combat Runtime/Combat Session/Persistent Zone Runtime` (autorité zone, horloge, identité, activation), `DomSkillFxRenderer` (projection du même état), `combat-2v2-test-ui` (commande joueur), `BattleActorAiController` (planification IA, sans autorité sur la zone). La preview officielle 1v1/2v2 utilise `mountCoop2v2Test`.
- **Fichiers autorisés** : tests sentinelles dans `tests/unit/` (notamment nouveau test de scénario), propriétaire réellement fautif parmi `src/core/combat/persistent-zone-runtime-v1.js`, `src/core/combat/combat-runtime.js`, `src/core/combat/combat-session.js`, `src/core/combat/action-resolver.js`, `src/adapters/renderer/dom-skill-fx.js`, `src/ui/combat-2v2-test-ui.js` uniquement si démontré ; `docs/LAB_CURRENT_WORK.md` et rapport dédié. Ne pas modifier tous ces fichiers par défaut.
- **Protégés** : 103 créatures, loadouts et niveaux auteur 1/combat test 20, 112 compétences et progression 1/5/10/15/20, `lib_aqua_heal` (+5 et HoT +3/3s 20s), opacités, 3 pièces Beam, toutes les zones et ticks, rappel/invocation, sons, assets, `global-assets`, `Zombicide-40k`, Exploration, `main`.
- **TDD prévu** : sentinelle reproductible joueur vs IA sur **la même fiche Showcase** ; état moteur activations 1/2/3 et rayon short/medium/long, projection renderer (transform + `data-zone-radius`), expiration puis nouvelle activation short, cadence tick, commandes et refus (cooldown/énergie/requirements) ; 1v1, puis 2v2 pour l'identité zone par acteur. RED ciblé obligatoire **avant** toute correction comportementale ; pas de correction fictive si les tests ne reproduisent pas la panne.
- **Fin du lot** : diagnostic chiffré, RED→GREEN si défaut démontré, Node suite complète, vraie preview Chromium avec activations, diff revu, checkpoint GREEN uniquement si chaîne réelle validée, preview figée, promotion Pages via lease après relecture du HEAD et CI finale ; contrôle manuel Android séparé.

- **Diagnostic RED confirmé** : CI `37965720923`, SHA `540a123d697d39823ce4c1c6b46cb2b674415926`, 1333 PASS / 1 FAIL ciblé (« short » au lieu de « medium »). Joueur : première zone à t=27000 (expire 34000), réactivation **acceptée** à t=33000, première zone supprimée à t=34001, deuxième résolution à t=35000 redémarre à short. Propriétaire concerné : `Persistent Zone Runtime` récupère les activations uniquement de `state.persistentZones` à la résolution alors que l'action a été acceptée avant l'expiration ; `Action Resolver` est le point de transfert natif de l'intention validée au démarrage. Autorisation de son fichier ajoutée avant modification fonctionnelle. Ne pas maintenir de tick après expiration, ne pas prolonger l'ancienne zone avant résolution, ne pas reconstruire le sprite dans l'UI.

- **GREEN moteur provisoire** : CI `37966038847` SHA `a77b22852c76b2ea75c7b98de040c8c202e55970` : 1334/1334 Node PASS, Chromium bibliothèque SUCCESS. Reproduction RED devenue GREEN, même propriétaire `Persistent Zone Runtime` après passage d'une métadonnée d'action acceptée via `Action Resolver`; ticks et expiration inchangés.
- **Extension limitée au navigateur** : autoriser `tests/browser/firestorm-zone-growth-smoke.mjs` et `.github/workflows/ci.yml` pour exécuter dans Chromium une vraie scène DOM et le vrai `CombatRuntime -> PersistentZoneRuntime -> DomSkillFxRenderer`, y compris activation par clic sur bouton de test et même compétence côté IA. Cette sentinelle s'ajoute sans remplacer la sentinelle 103 créatures ni prétendre valider à elle seule tout le parcours de l'éditeur ou un smartphone physique.

- **Chaîne Chromium navigateur validée** : CI `37966331616` SHA `ef5ee88aed64840fc6ede922e8e13a4c69074991` SUCCESS : foundation 1334/1334 Node PASS, browser bibliothèque 103 SUCCESS, nouveau Chromium Firestorm 8/8 scénarios avec mesure réelle DOM. Scénarios détaillés : joueur/IA × 1v1/2v2 × cadence normale/expiration pendant préparation. Ce navigateur exerce la chaîne native CombatSession/Runtime→PersistentZone→DomSkillFxRenderer depuis un bouton de test DOM ou le vrai contrôleur IA, sans prétendre valider le bouton exact de l'éditeur.
- **Diff relu** : base `a1ba2b255aac28bd4fbbf71b8fd4d16ce66f0e3d` → SHA `ef5ee88aed64840fc6ede922e8e13a4c69074991` : 9 commits, 0 commit de retard, 6 fichiers (2 production, 2 tests, 1 workflow, 1 doc). Le rapport final `docs/LAB_FIRESTORM_PLAYER_GROWTH_EXPIRY_V1.md` complète le périmètre documentaire ; aucune donnée d'auteur, autre créature, asset ou son retouché.
- **Fin technique subordonnée** : CI du SHA documentaire final, comparaison branche publiée (lease), checkpoint/preview GREEN exacts, déploiement Pages SUCCESS. GREEN produit dépend d'un contrôle smartphone.


## 2026-10-09 — Tempête de flammes : durée de zone 15 s (micro-lot isolé)

- **Demande utilisateur explicite** : augmenter uniquement la durée de la zone persistante de `cap_fire_atk_6` / Tempête de flammes de **7000 à 15000 ms**. Conserver `tickIntervalMs=1000`, `tickEffect.amount=5`, `reactivation=reinforce`, `maxActivations=3`, `radiusGrowthSteps=1`, préparation 2000 ms, cooldown 3500 ms, opacité 0.5, rayon short/medium/long, équipe joueur et IA.
- **Base GREEN publiée vérifiée** : `gh-pages` 91d087566380324a0c1b29eb5fa95b4671881831, Laboratory CI `37966746233` SUCCESS, Pages `37966744995` SUCCESS. Préserver la correction récente `firestorm-player-growth-audit-v1` contre expiration pendant préparation ; ne modifier aucun moteur.
- **Checkpoint de départ** : `checkpoint/lab-start-firestorm-zone-duration-15s-v1-2026-10-09` ; **branche de travail** : `work/lab-firestorm-zone-duration-15s-v1-2026-10-09`, depuis exactement le SHA de base.
- **Propriétaire unique** : preset auteur `data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json`, chargé dans le propriétaire `configuredSkills`. Aucune durée parallèle en UI, renderer, données de créatures ou moteur.
- **Fichiers autorisés** : uniquement le transfert auteur Firestorm, `tests/unit/firestorm-real-runtime-sequence-v1.test.mjs`, `tests/unit/firestorm-reinforce-cadence-regression-v1.test.mjs`, `tests/unit/capture-author-defaults-heal-bubble-fire-zone-v1.test.mjs`, `tests/unit/capture-showcase-skill-presets-v1.test.mjs`, `tests/unit/zone-idle-recall-fx-v1.test.mjs`, `tests/browser/firestorm-zone-growth-smoke.mjs`, cette section et un nouveau rapport `docs/LAB_FIRESTORM_ZONE_DURATION_15S_V1.md`.
- **TDD** : tests RED de la valeur 15000 et des dates d'expiration sur l'unique source auteur ; vérifier que les ticks déjà planifiés ne sont pas repoussés par renforcement et que l'expiration après renforcement est 15 s après sa résolution. Mettre à jour les timings des sentinelles runtime et Chromium joueur/IA 1v1/2v2, y compris le cas où l'activation est acceptée avant expiration mais résolue après celle-ci. Puis un seul changement `durationMs` dans le preset. Suite Node entière, navigateur bibliothèque 103 créatures et navigateur Firestorm 8 scénarios, exact SHA / diff, checkpoint GREEN et preview ; publication gh-pages uniquement par lease si HEAD inchangé, et CI/Pages SUCCESS.
- **Protégés** : 103 créatures/loadouts, identités niveau 1 et test 20, progression 1/5/10/15/20, capacités existantes, Onde régénérante +5 puis +3/3s 20s, Beam 3 parties, opacités, sprites/sons, autres zones persistantes et leurs ticks, rappel/invocation, dépôts GenSrpG / Exploration / global-assets, branche `main`.
- **Critère de fin** : durée 15 s vérifiée depuis la capacité réelle sur les deux camps, suite CI complète et Chromium SUCCESS sur SHA final, diff strict, checkpoint GREEN, preview et publication Pages contrôlées. Validation tactile sur Android physique distincte.

- **Sentinelles historiques détectées par la première CI GREEN candidate** : CI `37980795445`, 1332 PASS / 2 FAIL (deux assertions historiques restées à 7000 ms : `capture-showcase-skill-presets-v1` et `zone-idle-recall-fx-v1`), Chromium Firestorm SUCCESS ; les deux fichiers de tests sont autorisés ci-dessus **avant** leur adaptation. Aucun nouveau comportement moteur à modifier, seul l'instant d'expiration attendu passe de 7 à 15 s.

### Durée 15s — GREEN fonctionnel et livraison documentaire

- **TDD RED** SHA `af524aab8eb90ca13ab5458afd0e1ca3eec5ff12`, CI `37980669164`, six assertions Node attendent 15000 contre 7000 et navigateur Firestorm échoue sur la durée (avant modification).
- **Donnée source** commit `ed96b44c67b4b9dcd2328c9b98d293fef58a6323` : un seul champ `durationMs` de la zone de `cap_fire_atk_6` : 7000 -> 15000. Aucune modification des règles moteur ni autre paramètre auteur.
- Deux anciens tests à durée figée révélés dans la première CI candidate `37980795445`, adaptés après déclaration d'extension du scope ; pas de correctif hors tests.
- **GREEN fonctionnel** SHA `df6c5419f9b051be53bfb3914a5e002a056f339e` ; CI `37980914120` **SUCCESS**, 1334/1334 Node PASS, navigateur bibliothèque 103 SUCCESS, vrai Chromium Firestorm **8/8** (joueur/IA × 1v1/2v2 × normal/expiration durant préparation).
- Rapport `docs/LAB_FIRESTORM_ZONE_DURATION_15S_V1.md` ; publication conditionnée à la CI **du SHA documentaire**, revue diff, checkpoint et preview exacts, lease `gh-pages`, GitHub Pages SUCCESS. Validation Android physique reste séparée.


## 2026-10-09 — Aides contextuelles éditeur Capture V1 (micro-lot UX)

- **Demande** : permettre aux créateurs de comprendre simplement stats et capacités sur mobile par de petits « ⓘ » ouvrables au toucher. Les descriptions des capacités doivent refléter les **réglages actuellement sélectionnés**, pas une table statique par ID. Aides non autoritaires, non persistées, sans timer métier, sans effet sur l'export ou le gameplay.
- **Base GREEN publiée** : `gh-pages` `16b2fca0ea65baac83ee132502c8baac6dfa62c8`, CI `37981275797` et Pages `37981275764` SUCCESS. Checkpoint de départ `checkpoint/lab-start-contextual-editor-help-v1-2026-10-09` ; branche isolée `work/lab-contextual-editor-help-v1-2026-10-09`.
- **Défense** : source unique `data/capture/monster-capture-stat-registry.v1.json`, valeur proposée **0,20 % de réduction de tous les dégâts par point** (5 points = 1 %), au lieu de 1. Coefficient strictement **personnalisable par jeu**, la stat `defense` peut être **supprimée**, aucune hypothèse hardcodée dans l'aide et aucune réinsertion automatique si absente. Le contrat/existant autorise la modification et le retrait ; auditer et ajouter des sentinelles d'import/export pour confirmer. Les fiches et coefficients déjà personnalisés ne doivent pas être écrasés par le défaut.
- **Périmètre V1 réaliste** : regrouper une aide tactile compacte pour le registre des stats et les sections principales de capacité (type/élément/énergie/niveau, conditions, effets, mouvement, timing, FX) ; fournir une lecture vivante du brouillon sélectionné (dégâts de base, soin, zone et réactivation, cadence, statut/buff, coût, temps et limite). Une première couche extensible, pas une prétention de couvrir exhaustivement tous les 150+ réglages techniques ; décrire dans la roadmap du rapport ce qui reste à documenter.
- **Propriétaires** : règles de stats dans le registre existant, `projectCaptureStatEffectsV1` et `CombatDamageV1` inchangés ; explication en lecture seule des contrôles actuels du Human Editor par un module de présentation isolé, réutilisant les `data-*` existants. Ne pas créer de seconde définition de Skill ou stat, pas de branchement sur nom/ID de compétence pour décrire l'effet. Les aides s'ouvrent au tap/clavier, sans popup masquant les champs.
- **Fichiers autorisés** : `data/capture/monster-capture-stat-registry.v1.json`, `src/ui/capture-editor-contextual-help-v1.js` (nouveau), raccord minimal `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, tests Node dédiés `tests/unit/capture-contextual-editor-help-v1.test.mjs` (nouveau), `tests/unit/capture-legacy-status-semantics-v1.test.mjs` (sentinelle ancienne valeur 1% découverte par CI), et test navigateur réel `tests/browser/capture-creature-library-smoke.mjs`, cette doc et `docs/LAB_CONTEXTUAL_EDITOR_HELP_V1.md`. Aucun autre fichier par défaut.
- **TDD RED→GREEN** : défendre 0.2 et projet 5 points=1%, autonomie suppression/changement de coefficient, aides calculées de stats custom et capacités contenant plusieurs effets (ultime Firestorm 15s, soin + HoT, projectiles), changement de capacité et d'inputs sans sauvegarde, absence de fuite dans les JSON exports. Node complet et vrai Chromium sur l'éditeur avec 103 créatures et switch de skill. Revue diff, checkpoint GREEN, preview, publication via lease quand CI finale du SHA documentaire réussie ; validation Android physique distincte.
- **Protégés** : identité de toutes les autres stats, compétences existantes (dont Firestorm 15s / Heal +5/+3), 103 créatures, assets/audio/FX/Beam et import/export, Combat Runtime, autres laboratoires, `main` et toutes les branches parallèles.

- **Extension justifiée par CI avant modification** : SHA `1140f9759b420fdea6dfc38f80161755be9d1364` CI `37988221824` : deux échecs Node ciblés, un test nouveau vérifie le bouton `Retirer` via la convention DOM `dataset.statDefinitionRemove` (pas l'attribut source), et ancienne sentinelle `capture-legacy-status-semantics-v1` attend encore le coefficient système 1 au lieu de 0.2. Modifier seulement ces assertions, vérifier que les tests d'aliases (`armor`, `defense`) et le moteur restent inchangés.

### Contextual Editor Help V1 — GREEN fonctionnel, clôture documentaire

- TDD : test RED avant source de données, SHA `da001037897a7987469292c7f5d3abd0a01bf848`, CI `37987922817` (nouveau module non encore présent, défaut de défense ancien). Révisions applicatives sur branche unique ; échecs historiques attendus de sentinelles mentionnés et réconciliés avant GREEN.
- Défense système `damageReductionPctPerPoint: 1 -> 0.2` dans l'unique registre canonique. Rien de forcé côté source importée, chaque créateur peut garder son coefficient personnel, saisir 0/0.5/autre, retirer la stat via le propriétaire existant ; `CombatDamageV1` inchangé.
- Aide visuelle `ⓘ` native `details/summary` : tap mobile, clavier, compacte, refermable et 8 sections principales. Description de capacité résolue depuis les contrôles actuels et ses `effects[]` (pas de catalogue parallèle de capacités), mise à jour sur `input/change/click`. Le seul état UI est l'ouverture du panneau ; aucune sauvegarde/compétence altérée.
- CI GREEN fonctionnelle `37988365397` au SHA `3e739f326936fbbc2ab5be9a98cf785f917b42af` : **1338/1338 tests Node PASS, 0 FAIL**, navigateur bibliothèque 103 SUCCESS, vrai navigateur Smoke UX (défense 0.2, 5 pts=1%, coefficient personnel 0.5, suppression, Firestorm 15 s→13 s dans le brouillon, bascule soin +5/+3), Chromium Firestorm joueur/IA 8/8 SUCCESS.
- Diff vs base publiée `16b2fca0ea65baac83ee132502c8baac6dfa62c8` : 11 commits, 0 behind, 9 fichiers avant rapport. Source unique 1 ligne, un nouveau module de **présentation** (168 lignes), liaison Human Editor 9 lignes, HTML/CSS, nouveaux tests + une ancienne sentinelle de valeur par défaut, `LAB_CURRENT_WORK` ; moteur, skills, audio, assets et 103 créatures intacts.
- Rapport `docs/LAB_CONTEXTUAL_EDITOR_HELP_V1.md`. Prochaine couverture UX : les nombreux sous-réglages avancés (visuels par camp, collisions, statuts spécialisés et options générales) doivent recevoir des « ⓘ » individuels dans de futurs micro-lots, sans répéter de valeurs fixes et sans alourdir les panneaux repliés.
- À finir : CI documentaire finale du SHA exact, checkpoint GREEN et preview, promotion `gh-pages` lease si base identique, CI+Pages après publication. Test manuel tactile Android non revendiqué.


## 2026-10-09 — Classement élémentaire des bibliothèques et audit non destructif des doublons

- **Demande** : classer les créatures configurées par élément (élément primaire, multi-élément indiqué), garder le classement de capacités déjà présent, et classer les sprites/icônes/portraits par élément au sein de « Bibliothèque GenSrpG » / « Mes assets ». Pour les assets sans élément prouvé, catégorie « Autres / non classés ». Déduire les futurs labels « sprite feu/eau/... » uniquement des métadonnées et noms sans changer les définitions d'assets. Ne pas modifier les aides ⓘ pendant ce lot.
- **Base GREEN publiée** : `gh-pages` `1f2291c4314d55876f0c36da4c28fe052cf9fe4f`, Laboratory CI `37988644021` SUCCESS et Pages `37988644671` SUCCESS. Départ `checkpoint/lab-start-element-library-tidy-v1-2026-10-09` et travail `work/lab-element-library-tidy-v1-2026-10-09` au SHA exact.
- **Autorité** : les menus lisent exclusivement `configuredCreatures`, `configuredSkills` et le catalogue d'assets déjà chargé + `creatorVisualAssets`. Les groupements ne sont que projections UI et ne réécrivent aucune fiche ni ne migrent de clé.
- **Pré-audit** : source historique créatures 110 identités, 8 alias de nom explicitement éliminés par le propriétaire `canonicalCaptureCreatureRecordsV1` (102 canoniques + 1 vitrine = 103 actifs). Source `capture-used-ability-catalog-v2` : 103 IDs uniques, 7 paires de noms de capacités identiques sous IDs différents, toutes référencées dans des fiches historiques, et pour certaines comportements différents ; aucune suppression automatique sans preuve d'absence de référencement/paramètres configurés. `global-assets` : 119 IDs uniques, 0 doublon exact d'ID ou de libellé dans le catalogue consulté. Afficher/désambiguïser, ne rien effacer.
- **Périmètre micro-lot** : `src/ui/capture-editor-human-v2.js` uniquement pour projection/menus, nouveaux tests `tests/unit/capture-element-library-tidy-v1.test.mjs`, extension autorisée `tests/browser/capture-creature-library-smoke.mjs` pour vrai navigateur, `docs/LAB_CURRENT_WORK.md` et nouveau rapport `docs/LAB_ELEMENT_LIBRARY_TIDY_V1.md`. Si un second catalogue élémentaire est nécessaire, le dériver de la constante d'éléments *déjà* présente dans Human Editor ; aucun mapping de compétence parallèle.
- **Tests RED→GREEN** : conservations 103 créatures, 112+ capacités et IDs stables, exactement un choix par ID dans le menu actif, groupes élémentaires créatures mono/multi/neutre et assets canon/creator via tags/labels (dont « sprite feu »), préservation des filtres par rôle et valeurs sélectionnées, doublons seulement désambiguïsés par ID sans suppression ; vrai Chromium boot editor et aller-retour sélection par ID ; suite Node, navigateur bibliothèque, navigateur Firestorm 8/8. CI vérifiée sur SHA exact, revue diff puis checkpoint/preview GREEN, gh-pages uniquement fast-forward avec lease si HEAD inchangé.
- **Protégés** : aucun fichier de catalogue (110 sources créatures, 103 capacités historiques, données vitrine, 119 assets), aucune suppression/renommage des 103 créatures et 112+ capacités, leurs loadouts, sons, sprites, métadonnées, imports/exports, gameplay/règles, UI d'aide précédente, `main`, `global-assets`, `Zombicide-40k`, Exploration. Validation tactile Android par utilisateur distincte.

### Classement bibliothèques élémentaires V1 — GREEN fonctionnel

- **TDD RED** `6546f51b28e44f19e4fe71111b75d6b54b75a346` / CI `37992696640` FAILED attendue (helpers encore absents).
- **GREEN fonctionnel** `7d8dd81ee1b6d8b5a6e27a9f8c955e3d71be3243` / CI `37992874566` **SUCCESS** : 1344/1344 tests Node, Chromium créatures 103 IDs / capacités 112, classes Feu/Eau/Air, multi-élément, homonymes conservés et distingués, sections actifs/assets ; Chromium Firestorm 8/8. Browser startup aide ⓘ fiabilisée en attendant le chargement natif des **3 modèles vitrine**, sans changement d'éditeur.
- **Audit doublons** : 110 sources créatures, 8 alias historiques déjà exclus du pool canonique actif (102 + Loup = 103) ; 7 paires homonymes capacités historiques aux **14 IDs utilisés** par des créatures et, pour plusieurs, comportements différents ; 119 assets global-assets, 119 IDs uniques. Rien de supprimé / fusionné : préserver les fiches personnalisées est prioritaire.
- Diff produit limité à la **projection du Human Editor** ; test Node dédié + vrai navigateur étendu, aucune donnée source, moteur ou asset modifié. Rapport `docs/LAB_ELEMENT_LIBRARY_TIDY_V1.md`.
- Restant protocolaire : CI exacte du SHA documentaire, revue HEAD/diff, checkpoint GREEN et preview, promotion `gh-pages` sous lease si base inchangée et Pages + CI du SHA public SUCCESS. Contrôle tactile Android réel séparé.


## 2026-10-09 — Réactions de dégâts et zones de statut : décision utilisateur / micro-lot 1

- **Décision utilisateur / objectif produit** : les zones doivent pouvoir appliquer divers buffs/malus (défense, poison au contact, protections et futurs effets), persister optionnellement au changement de membre actif, et potentiellement protéger ou renvoyer un pourcentage configurable des dégâts (« Voile brumeux », « Miroir destructeur »). Un effet de renvoi doit aussi fonctionner sans zone sur une créature. Ne pas simuler des zones via un simple sprite + buff instantané.
- **Séparation obligatoire** : plusieurs propriétaires et des risques critiques (réaction aux dégâts, statut, zone, spatialisation, cycle de rappel, UI) interdisent un patch global. **Micro-lot 1 = renvoi de dégâts des statuts ordinaires seulement**. Les zones de statut et leur persistance au rappel seront des lots distincts, après contrat explicite d'ownership et tests 1v1/2v2. En aucun cas annoncer les zones de soutien comme livrées à la clôture du lot 1.
- **Base publiée** `gh-pages` `9a1ce6b2ad0f5194a3b6adf53154b5b78abbe984`, GitHub Actions CI `37993143648` SUCCESS, Pages `37993144526` SUCCESS ; checkpoint `checkpoint/lab-start-damage-reflection-v1-2026-10-09`, branche `work/lab-damage-reflection-v1-2026-10-09` depuis SHA exact.
- **Autorités** : `StatusEffectV1` définit un type `damage_reflection`, `Status Runtime` possède la durée / empilement, **Combat Damage Application** seul applique et crédite des dégâts HP et des dégâts renvoyés ; UI Human Editor enregistre des réglages sans introduire d'autorité ; future zone `Persistent Zone Runtime` devra consulter les statuts natifs, jamais calculer les dégâts via renderer.
- **Contrat lot 1** : statut `damage_reflection` positif (pourcentage 0..100, durée et stacks statut natifs), cible de protection = porteur du statut ; sur HP réellement perdus par celui-ci, retourne ce pourcentage à l'agresseur encore vivant ; immunités et boucliers de l'agresseur restent effectifs. Dégâts entièrement absorbés, immunisés ou autos infligés = aucun renvoi. Un renvoi ne déclenche jamais un nouveau renvoi, même si les deux adversaires sont protégés ; calcul 2 décimales, total des renvois borné à 100% par coup. Les impacts de DoT utilisent la même application native ; KO dû à un renvoi crédité au porteur du statut. Expiration et retrait gérés par Status Runtime.
- **Fichiers autorisés lot 1** : `src/contracts/status-effect-v1.js`, `src/core/combat/combat-damage-application-v1.js`, `src/ui/capture-editor-human-v2.js` (sélecteur statut + champ %, pas de second système), `src/adapters/renderer/status-effect-info-v1.js` (notice visible), `src/ui/capture-editor-contextual-help-v1.js` (aide calculée depuis le champ), `tests/unit/capture-damage-reflection-v1.test.mjs` (nouveau), `tests/browser/capture-creature-library-smoke.mjs` seulement si nécessaire, `docs/LAB_CURRENT_WORK.md` et `docs/LAB_REACTIVE_ZONES_REFLECTION_V1.md` (rapport + lots suivants). Aucun fichier contenu auteur, média, combat/action resolver, roster, zones ou Zombicide-40k dans ce micro-lot.
- **TDD RED→GREEN** : contrat validation, attaque via vraie Combat Session, bouclier/immunité, DoT, évitement retour en boucle, expiration, crédits KO, export de skill Human Editor, maintien 103 créatures et 112 capacités, Node complet + vrais navigateurs Chromium bibliothèque et ultime feu, puis checkpoint GREEN et preview ; publication `gh-pages` uniquement si tous tests et lease bons. Pas de validation tactile physique revendiquée.
- **Lots suivants non engagés** : (2) zone buff/malus V1 sur entrer/rester/sortir et expiration, sans buff fantôme et sans confusion source stat; (3) zone indépendante du lanceur en rappel, propriétaire d'origine immutable avec anchor terrain (réserve/KO/2v2/expiration), donc le nouveau membre ne reçoit pas les anciennes responsabilités ; (4) renvoi de dégâts attaché à une zone native et FX « Miroir destructeur », avec vrai navigateur, export/import et réglages UI. Chaque lot = branche, checkpoint, RED/GREEN, CI, tests vrai chemin, publication indépendante.


### Reflet de dégâts V1 — GREEN fonctionnel (sans zone)

- TDD RED : `566d6e7a57f1f380c68e65863c0ff10b67ecaa19`, CI `37995395397` FAILURE attendue (nouveau contrat / UI non présents). Implémentation native : `f928a85d290325e47f521f4e2d719fbfde31b70a` CI `37995536906` SUCCESS (1350 tests Node 0 fail, Chromium bibliothèque + Firestorm). Test navigateur vrai parcours auteur `738fefadad6e07079552dd4740fe3ea201242247`, CI `37995645963` SUCCESS (Node, navigateur bibliothèque : choix du statut renvoi 35 % / 12 s, sauvegarde + export réel, 103 créatures toujours disponibles ; Firestorm Chromium 8/8).
- Fonctionnalité livrable ciblée : statut bénéficiaire `damage_reflection` paramétrable en % dans les capacités, 0..100, actif seulement pendant la durée du statut, renvoie sur PV réellement perdus après boucliers, plafonnement cumulé à 100 %, absence de ping-pong, immunités/boucliers de l'agresseur respectés, KO crédité au porteur. Les autres statuts et compétences gardent leur forme ; visuel/description de statut raccordés à l'affichage existant.
- Revue diff depuis la base exacte : 4 commits, zéro behind, fichiers = contrat statut + Combat Damage Application + projection/éditeur + aide + tests Node/browser + 2 documents ; aucun asset, preset auteur, catalogue, Combat Renderer, `main`, `global-assets`, autre laboratoire modifié.
- **Non livré / à ne pas confondre** : zones buffs/malus et déclenchement poison sur entrée, champ persistance rappel, zone miroir autonome, feedback d'impact de renvoi spécifique. Ces fonctionnalités sont décrites et séparées dans `docs/LAB_REACTIVE_ZONES_REFLECTION_V1.md`, exigent chacune un vrai micro-lot, des tests et une validation, et ne sont pas simulées par UI.
- **À clôturer** : CI du SHA documentaire final, checkpoint GREEN + branche preview, publication avec lease sur `gh-pages` si HEAD inchangé, CI + Pages du SHA publié ; aucun test tactile Android physique revendiqué.


## 2026-10-10 — Zone à statuts natifs V1 (lot 2/4)

- **Objectif** : permettre à une `persistent_zone` d'appliquer un statut natif défini par le créateur (`apply_status`) aux occupants du bon camp et rayon, avec deux modes : `while_inside` (bonus/malus révocable à la sortie/expiration) et `on_enter` (poison/stun appliqué une fois à l'entrée, durée native qui subsiste après la sortie). Inclut la saisie dans Human Editor pour la configuration initiale ; jamais d'effet fictif porté par un sprite.
- **Base GREEN publiée** : `gh-pages` `1d44b86ce667e1e61245dfbc407c86a6068ce424`, CI `37995883870` SUCCESS, Pages `37995883688` SUCCESS ; checkpoint `checkpoint/lab-start-zone-status-effects-v1-2026-10-10` et branche `work/lab-zone-status-effects-v1-2026-10-10`, tous deux sur SHA exact. Aucun autre chantier parallèle revendiqué sur le même périmètre au contrôle initial.
- **Autorités** : `SkillEffectV1` pour le contrat, `CombatState.persistentZones` / `persistent-zone-runtime-v1.js` pour rayon, horloge, présence et statut lié à une zone, `Status Runtime` pour application, immunité et durée, `Combat Damage` pour dégâts (ne pas toucher). `Combat Session` peut orchestrer le nettoyage au cycle existant. Le renderer n'applique aucun gameplay.
- **Périmètre fichiers** : `src/contracts/skill-effect-v1.js`, `src/core/combat/persistent-zone-runtime-v1.js`, `src/core/combat/combat-session.js` (ordre/teardown seulement si indispensable), `src/ui/capture-editor-human-v2.js`, `src/ui/capture-editor-contextual-help-v1.js`, nouveaux tests `tests/unit/persistent-zone-status-effects-v1.test.mjs`, extension navigateur `tests/browser/capture-creature-library-smoke.mjs` si pertinente, présent `docs/LAB_CURRENT_WORK.md`, rapport `docs/LAB_ZONE_STATUS_EFFECTS_V1.md`. Pas d'actifs, pas de modification des créatures/skills configurés, pas de changement du contrat `StatusEffectV1`, aucun nouveau catalogue, aucun `main`/`global-assets`/`Zombicide-40k`/Exploration.
- **Invariants** : dégâts des anciennes zones inchangés ; statut de zone isolé par ID d'instance différent d'un statut identique appliqué indépendamment ; pas d'empilement par frame ; statut `while_inside` nettoyé à la sortie, à expiration et à suppression de zone après rappel ; `on_enter` appliqué une fois par entrée et reste selon sa propre durée ; protections natives conservées ; vrais tests 1v1/2v2 + spatial + UI export ; pas de duplication des propriétaires ; éviter les ticks de statut après départ de zone.
- **Hors lot** : `persistAfterRecall:true` (lot 3), zone renvoyant automatiquement des dégâts (lot 4), animation/son nouveaux, effets à la sortie, app principale. La zone créée reste supprimée au rappel comme aujourd'hui par défaut. Réaliser TDD RED, CI Node complète + Chromium bibliothèques + Firestorm, checkpoint GREEN et publication seulement si le SHA est vérifié.


### Zone à statuts V1 — GREEN fonctionnel, lot 2/4

- **TDD RED** : `6981a75293ad1e29b170a8bdaf3d409d98f4ceaa`, première CI rouge attendue ; ensuite contrats, statut de zone, nettoyage, UI et tests sentinelles.
- **GREEN code et vrai parcours** : `bb389d2e11e5d2fc8036e34d473bca39e2892b7a`, Laboratory CI `37998951321` SUCCESS : 1360/1360 Node, Chromium bibliothèque 103 créatures, sauvegarde/export via Human Editor de deux zones nouvelles (+25 Défense `while_inside`, Poison 4/tick `on_enter`), Chromium Firestorm SUCCESS.
- Contrat `persistent_zone.tickEffect.kind=apply_status`, `statusBehavior=while_inside|on_enter`. Statuts natifs instanciés de façon isolée par zone, durée et protections conservées, présence/horloge possédées par Persistent Zone Runtime, suppression de buff à sortie/expiration/rappel, pas de ticks DoT hors zone, pas d'empilement répété, réserve snapshot nettoyée lors du retour. Anciennes zones damage préservées. Pas de nouveau média, ni catalogue, ni changement de preset auteur.
- **Rapport** : `docs/LAB_ZONE_STATUS_EFFECTS_V1.md`. Le prochain lot 3 porte exclusivement sur la persistance après rappel avec propriétaire de zone distinct du slot remplaçable ; cette option n'est pas livrée par le lot 2. Le renvoi de zone autonome reste lot 4.
- **À clôturer** : dernière CI documentaire au SHA exact, revue diff et HEAD, checkpoint GREEN, branche preview et publication `gh-pages` sous lease si base inchangée ; CI+Pages publics. Aucune validation tactile Android physique revendiquée.

- Consolidation du lot 2 : statut de zone ignoré sans planter lorsqu’une cible ne dispose pas de la statistique personnalisée demandée ; test 2v2 des entrées/sorties spatiales, purge DoT avant tick après sortie, sauvegarde de rappel et retour en jeu. Source `bb389d2e11e5d2fc8036e34d473bca39e2892b7a` ; CI `37998951321` SUCCESS, 1360/1360.


## 2026-10-10 — Zones persistantes après rappel V1 (lot 3/4)

- **Objectif** : permettre explicitement à un créateur de conserver une zone sur le terrain après le changement ou rappel de créature, pour qu'un remplaçant bénéficie d'une zone `while_inside` (Voile brumeux), puisse déclencher `on_enter`, et que la zone expire sur l'horloge native indépendamment du lanceur. `persistAfterRecall` optionnelle, **false par défaut** pour préserver toutes les zones historiques et Firestorm.
- **Base publique GREEN** : `gh-pages` `ae1175dc82866562b4d958610f57e5430609c98d`, CI `37999217877` SUCCESS, Pages `37999217383` SUCCESS ; checkpoint `checkpoint/lab-start-zone-recall-persistence-v1-2026-10-10`, branche `work/lab-zone-recall-persistence-v1-2026-10-10` sur ce SHA.
- **Autorités uniques** : `SkillEffectV1` possède le booléen, `CombatState.persistentZones` et `Persistent Zone Runtime` seuls possèdent l'instance + présence ; `Roster Session` seul connaît l'identité du membre sortant/entrant et alimente le changement ; `Combat Session` ne fait qu'orchestrer ; Renderer affiche seulement l'ancre figée de la zone détachée, jamais de gameplay dans UI.
- **Domaines et fichiers autorisés** : `src/contracts/skill-effect-v1.js`, `src/core/combat/persistent-zone-runtime-v1.js`, `src/core/combat/combat-session.js`, `src/core/combat/roster-session.js`, `src/ui/capture-editor-human-v2.js`, `src/ui/capture-editor-contextual-help-v1.js`, éventuellement `src/adapters/renderer/dom-skill-fx.js` pour ancrage **visuel seulement** ; tests `tests/unit/persistent-zone-recall-persistence-v1.test.mjs` (nouveau), éventuellement `tests/browser/capture-creature-library-smoke.mjs`, `docs/LAB_CURRENT_WORK.md` et rapport `docs/LAB_ZONE_RECALL_PERSISTENCE_V1.md`. Élargissement de fichiers => documenter impérativement. Interdit : source de créatures, skills, assets, `main`, `global-assets`, `Zombicide-40k`.
- **Protections/règles** : anciens JSON sans propriété restent valides ; zone non persistante retirée à remplacement, recall/KO ; zone persistante garde id/équipe d'origine et coordonnées sur le terrain, ne transmet pas ses attributs ou références de capacité au membre entrant ; les statuses `while_inside` du sortant doivent être nettoyés du snapshot, `on_enter` du remplaçant déclenché une seule fois même si slot identique. Pas de double réactivation de zone appartenant à une autre créature ayant même skillId. Après expiration, aucun bonus, aucune zone orpheline. Défenses/Poison/renvoi et Firestorm sentinelles ; 1v1/2v2, vrai éditeur, Node+Chromium.
- **Découpage prudent** : la reprise de dégâts post-rappel, les crédits de KO de l'ancien lanceur et l'illusion d'une nouvelle créature héritant des statistiques d'attaque sont risques critiques ; ne pas proclamer l'ensemble GREEN si ces protections ne sont pas couvertes. Pas de nouvelle formule de dégâts ni de deuxième source d'autorité. Le miroir autonome au déclencheur `damage_taken` reste lot 4.


### Lot 3 — Extension de périmètre AI avant GREEN

L'audit du vrai consommateur `src/core/combat/battle-actor-ai-controller.js` révèle une dépendance légitime au champ `persistentZones.sourceActorId` : l'IA prendrait une zone détachée pour sa propre zone renforçable en cas de changement de membre sur le même slot. Ce cas brise l'ownership même si le moteur refuse le renforcement. **Extension autorisée** : un filtre de projection `detachedFromSource !== true` dans ce seul consommateur et sentinelle dans `tests/unit/persistent-zone-recall-persistence-v1.test.mjs`. Aucun changement de politique IA, cooldown, économie d'énergie ou zone propriétaire en dehors de ce garde. TDD RED→GREEN puis CI et browser.


### Lot 3 — Cas limite de rappel sans invocation immédiate

Le rappel `recall` laisse momentanément un slot Combat existant alors que Roster Session signale qu'il est vide. Le propriétaire Zone Runtime doit traiter ce slot comme **absent** de ses effets, en projetant uniquement dans les instances de zone courantes le signal de départ transmis par Roster ; à l'invocation, le nouvel occupant n'hérite d'aucun statut et redevient éligible. Fichiers déjà autorisés : `persistent-zone-runtime-v1.js`, `combat-session.js`, test du lot. Ce signal ne devient pas une deuxième autorité du roster, ne modifie pas HP/KO ni les anciens tick rates, et ne doit pas propager de buff dans la réserve. RED→GREEN dédié obligatoire.


### Zones après rappel V1 — GREEN source et vrai chemin, lot 3/4

- Nouvelle option `persistAfterRecall:true` dans `SkillEffectV1.persistent_zone` uniquement pour `tickEffect.apply_status` (les dégâts de zone post-rappel sont refusés, pour ne pas attribuer ceux de l'ancien lanceur au remplaçant). Absence du champ = contrat historique préservé. Human Editor + aide exposent la case et conservent le JSON auteur.
- Roster Session fournit seul `departingMemberId` au propriétaire via Combat Session ; `persistentZones` conserve le propriétaire `originRosterMemberId` et `detachedFromSource`, identité de générations isolée si deux membres possèdent même skill ID, runtime et renderer conservent respectivement gameplay et sprite fixé au sol. `on_enter` est recalculé pour le nouvel occupant du même slot ; `while_inside` est restauré sans double buff ; extinction/expiration natives. Relevé K.O., 1v1, 2v2, recall puis summon testés.
- Sentinelle AI : l'IA n'essaie plus de renforcer une zone détachée qui appartient au membre précédemment présent sur le même slot. Sentinelle rappel séparé : un slot Roster absent ne reçoit pas de buff/tick depuis une zone déjà existante ; les autres alliés conservent leur protection, à l'invocation le slot est rééligible.
- TDD RED initial `0728b255b1f96bb26b2262f3c83a4b65b3cf9816`, AI RED `8cc2ee7ca6ec816c7aae6296527e24e36182a25a`, rappel-vide RED `4e86427f5f12400670ae7ece78540eb8ae422b16`. **CI source GREEN `38001325454`** SHA `fd658f94b107a2adda6b4a63e93d29809098e064`, **1372 tests Node / 0 FAIL**, Chromium `creature-library-browser` et `firestorm-zone-growth-browser` SUCCESS. Source `e0ed2c8174c26d287877fba88c958fc1f6141a39` ajoute test contrat damage-zone invalid; rapport `docs/LAB_ZONE_RECALL_PERSISTENCE_V1.md`.
- Limites véridiques : aucune zone de dégâts directs ne peut être marquée persistante dans cette V1, car l'ownership des crédits de dégâts/KO au membre rappelé n'est pas encore transporté ; une zone nouvellement créée pendant un slot entièrement vide est une lacune restante du ciblage global et devra être traitée avant une promesse de couverture de toutes les situations de rappel. FX encore sans validation tactile physique. Lot 4 miroir déclencheur autonome non engagé.
- À clôturer : CI du SHA de documentation final, revue diff public/work, checkpoint GREEN, branche preview, fast-forward `gh-pages` sous lease exact, CI et Pages publics ; aucun changement de main ou des assets.

 
## 2026-10-10 — Clarification UI zones Capture V1 (retour utilisateur)

- **Bogue constaté** : dans `src/ui/capture-editor-human-v2.js`, le changement du sélecteur `[data-skill-zone-effect-kind]` et du sélecteur `[data-skill-zone-status-kind]` ne sont pas écoutés par le délégateur `change`. `syncHumanSkillEffectRowV1` sait déjà montrer/cacher les sous-groupes, mais n'est jamais invoqué au bon moment ; les champs dégâts restent visibles et `[data-skill-zone-status-behavior]` reste disabled alors que l'utilisateur a choisi statut. Bug indépendant des contrats et du moteur.
- **Demande produit** : rendre le choix `Dégâts périodiques` vs `Bonus / Malus / Statut` clair et mutuellement exclusif ; placer le comportement `Actif dans la zone` / `À l'entrée` et la persistance après rappel seulement dans le panneau de statut, éviter de mélanger les champs des effets indépendants et des zones. Toute lecture et export auteur doit rester identique. Afficher seulement les paramètres spécifiques au statut choisi.
- **Base** : `gh-pages` `9920649fcf6a7597146e10c669a9722f0cd2c1ec` (CI `38001585194`, Pages `38001585132` SUCCESS). Checkpoint départ `checkpoint/lab-start-zone-editor-clarity-v1-2026-10-10` et branche `work/lab-zone-editor-clarity-v1-2026-10-10` sur ce SHA.
- **Autorité** : `Human Editor` seul propriétaire de la projection UI ; contrats `SkillEffectV1`, `StatusEffectV1`, runtime de zones, stats, rappel, assets et fiches configurées **protégés**.
- **Fichiers autorisés** : `src/ui/capture-editor-human-v2.js` pour groupes et écouteurs, `tests/browser/capture-creature-library-smoke.mjs` pour sentinelle DOM réelle, éventuellement `tests/unit/persistent-zone-recall-persistence-v1.test.mjs` pour structure/lecture, `docs/LAB_CURRENT_WORK.md` et nouveau rapport `docs/LAB_ZONE_EDITOR_CLARITY_V1.md`. Aucun CSS sauf démonstration d'une réelle nécessité après contrôle ; pas de nouveau moteur.
- **TDD RED/GREEN** : ajouter une sentinelle Chromium qui bascule une zone existante dégâts -> statut : champs dégâts hidden, comportement status enabled et liste ouverte par DOM `select` normale, choix `on_enter` reconnu, sous-paramètres statut correspondent au kind, persistAfterRecall accessible ; inverse statut -> dégâts masque statut et réinitialise seulement l'état présentation sans écraser les données enregistrées avant sauvegarde. Tester une zone legacy et un effet buff indépendant. Garder au moins 103 créatures ; suite Node et Chromium library + Firestorm ; diff review, checkpoint GREEN sur SHA CI complet, publication lease `gh-pages` seulement si stable.

### Zone Editor Clarity V1 — correction UI de la sélection de zone

- **Diagnostic à la source** : les sélecteurs `data-skill-zone-effect-kind`, `data-skill-zone-status-kind` et `data-skill-zone-status-stacking` manquaient dans le délégué `change` de Human Editor. Le `syncHumanSkillEffectRowV1` existant n'était donc pas rappelé après une interaction du créateur. Conséquences : groupe dégâts encore visible, groupe statut masqué, sélecteur `while_inside|on_enter` disabled. Les tests antérieurs écrivaient déjà la valeur cachée avant export sans vérifier son accessibilité native.
- **Solution minimale** : prolonger le délégué existant ; réunir mode de comportement et persistance dans le groupe « Effet de zone = Statut » ; exposer les seuls champs du type de statut actif (notamment « Stacks max » si empilement), et conserver le choix séparé « Dégâts » sans effacer les réglages en cours. Restaurer la phrase d'aide protégée `Toute réactivation renouvelle la durée` après sentinelle legacy. Aucune nouvelle autorité/moteur ni donnée auteur modifiée.
- **TDD RED** : `ef5ec45efe48f10cc41f01bea26bf8c1e612583b`, browser smoke inspecte réellement `hidden`, `disabled`, options de statut et `on_enter` avant de sauvegarder/exporter deux zones natives. **Source corrigée** : `04f0e654a28132a70422f6bc3b2643f218004890`. Le premier commit intermédiaire `436a3086801224fafb09bd5963e613a4d102c719` a une CI Foundation rouge due à la phrase d'aide supprimée ; la sentinelle a été conservée et corrigée, aucun GREEN anticipé.
- **Tests attendus** : 1372 Node et navigateurs créatures/Firestorm, vrai éditeur et export DéF/Pois, sauvegardes, 103 créatures, aucune modification des zones de combat. Revue HEAD/diff, CI documentaire finale du SHA exact, checkpoint GREEN et preview, publication lease seulement si CI complète SUCCESS. Vérification tactile Android physique encore ouverte.


## 2026-10-10 — Voile aqueux auteur / ultime / durée de buff de zone / icône (reprise utilisateur)

- **Source utilisateur immuable** : fichier fourni `gensrpg-capture-skill-cap_water_special_2.json`, SHA-256 brut `aec01c4df6299e29964f2ffd6920e8945cc20c47bb39fd15353943530e550a19`. ID `cap_water_special_2`, nom `Voile aqueux`, `loadoutSlot:ultimate`, `requiredLevel:20`, `persistAfterRecall:true`, zone `60000ms`, statut `10000ms`, `statId:defense`, `deltaPoints:100`, icône `core:icon-skill-barrier-dome-01`, aura `pack:capture:sprite-status-energy-shield-01`. La description dit « niveau 28 » mais la donnée requise dit **20** : ne pas modifier la source sans consentement.
- **Diagnostic** : dans la fiche native, `statusBehavior:while_inside` prolonge effectivement le statut de zone jusqu'à l'expiration dans le propriétaire zone, et le purge sortie/expiration ; la durée de statut `10000ms` doit rester transportée pour un éventuel `on_enter`, mais ne doit pas tromper l'éditeur quand `while_inside` est sélectionné. L'ultime n'est pas enregistré au catalogue vitrine de démarrage, donc absent du sélecteur des ultimes si l'auteur ne l'a pas explicitement sauvegardé/importé ; le filtre prend seulement `configuredSkills`. Le renderer `dom-status-fx` possède déjà le HUD d'icône et l'icône source via `sourceSkillId` ; valider le véritable chemin avec la zone et la capacité user avant de changer le renderer.
- **Base publiée GREEN** : `gh-pages` `bebf2eb8b918df5adf99884280188db933e35a78` (CI `38023525765`, Pages `38023524932` SUCCESS), checkpoint départ `checkpoint/lab-start-water-veil-ultimate-v1-2026-10-10`, travail `work/lab-water-veil-ultimate-v1-2026-10-10` depuis SHA exact. Branches concurrentes consultées via les derniers runs, pas de chantier actuel observé couvrant l'import de ce nouvel ID.
- **Objectif micro-lots atomiques** : (A) enregistrer l'export auteur intact dans le catalogue Showcase existant ; vérifier `configuredSkills` et `slot-ultimate` et import/export réel ; (B) dans le seul Human Editor, pour `while_inside` masquer la saisie de durée indépendante et afficher une aide explicite « jusqu'à sortie / fin de zone », conserver physiquement `durationMs` source pour `on_enter` et l'export ; (C) prouver avec un test Core->Status Runtime->DomStatusFxRenderer que le bénéficiaire dispose de la même icône de capacité sous son modèle, y compris nouveau membre. Ne modifier le renderer que si défaut démontré, avec extension de périmètre documentée avant.
- **Fichiers autorisés** : `data/capture/showcase/cap_water_special_2.capture-skill-transfer-v1.json` (source 1), `src/catalogs/capture-showcase-skill-presets-v1.js` (inscription unique), `src/ui/capture-editor-human-v2.js` (information durée seulement), `tests/unit/capture-water-veil-author-preset-v1.test.mjs` (nouveau), `tests/browser/capture-creature-library-smoke.mjs` (vrai UI) si nécessaire, `docs/LAB_CURRENT_WORK.md`, `docs/LAB_WATER_VEIL_AUTHOR_ULTIMATE_V1.md`. Si l'audit prouve un problème de rendu, autoriser `src/adapters/renderer/dom-status-fx.js` seulement après rapport explicitant la cause. Gameplay Status/Zone/Combat State/Roster, export canonique, bibliothèques et fiches auteurs existantes **protégés**.
- **RED/GREEN** : tests source SHA stable, export/import exact, 1 seule occurrence dans catalogue, véritable option Ultime et liste de loadout, simulation avec +100 defense pendant la zone puis expiration et rappel, icône HUD source résolue pour ce statut, sélecteur durée désactivé/masqué pour `while_inside` puis réactivé pour `on_enter` sans modification JSON; Node complet + Chromium bibliothèque 103+ créatures, Firestorm 8/8, comparaison diff, checkpoint GREEN, publication uniquement sous lease SHA public inchangé et CI+Pages success. Ne jamais modifier `main`, `global-assets`, `Zombicide-40k` ou Exploration.


### Voile aqueux auteur — GREEN source (rapport exact)

- TDD RED `3940deefe3487059da140a5f771b66c4401b6a43` / CI `38024674783` FAILURE attendue : capacité absente du catalogue. Source intégrée `f36388cfac8a8cd0dcbf58f0d60a124921d49157`, CI `38024723277` SUCCESS (Node + Chromium + Firestorm).
- Nouveau test Chromium RED `b3f6c33ea2cec9cec87c00631043ea707350eda0` / CI `38024769329` : l'éditeur ne resynchronisait pas les champs de durée quand on changeait le mode `while_inside` ↔ `on_enter`. Cause corrigée dans **le délégué natif de changement** `bb2743893a6766ebf7815d2f24ca31e17bb1291e` ; `Laboratory CI 38024833766` **SUCCESS** : **1375/1375 tests Node**, 0 échec, Chromium bibliothèque+ultime réel+filtres durée, 103 créatures, Firestorm régression SUCCESS.
- La source JSON est byte-for-byte conservée, SHA-256 `aec01c4df6299e29964f2ffd6920e8945cc20c47bb39fd15353943530e550a19`. L'option Ultime est visible sur un vrai navigateur, sans assignation automatique aux créatures ; le statut natif `while_inside` reste jusqu'à disparition de sa zone, l'icône HUD provient de `sourceSkillId` et du binding d'icône auteur (test Core → Status Renderer réussi). Le bouton « à l'entrée » révèle le `10s` original sans réinitialisation.
- Aucun asset ajouté, aucune fiche existante réécrite, `main`, `global-assets`, `Zombicide-40k` et exploration intacts. Revue diff : 1 fichier source JSON + 1 déclaration catalogue + 1 fichier UI + 2 tests + 2 docs. À clôturer : CI documentaire exact SHA, checkpoint GREEN, preview, promotion `gh-pages` sous lease, CI+Pages du SHA public. Validation tactile Android physique ouverte.


## 2026-10-10 — Ancrage au sol de zones et réimport auteur Voile aqueux / Maraileron V1

- **Demande** : la zone « Voile aqueux / brume » ne doit pas suivre la créature après activation ; contrairement à Tempête/Vague de flammes qui continuent de suivre l'acteur. Deux transferts utilisateur fournis : `gensrpg-capture-skill-cap_water_special_2(1).json` SHA-256 `209d8a097c11ae54e094493fbdc09a2693231b6591e03cc7cb7257a2d6ec7f7d` et `gensrpg-capture-creature-crea_maraileron(1).json` SHA-256 `33ef7cc11487f6ec40841ebfc07da7018039fd6b14fc1e2ce4684457086421f8`. Les données restent auteur ; modification explicite autorisée de `visual.aura.attachment` uniquement vers le mode existant `fixed-source` pour ce voile. Toutes les autres valeurs des deux imports doivent être conservées.
- **Base GREEN** : `gh-pages` `e5fd873e0b0a98c4d062471267cee884130aec87`, CI `38024964167` SUCCESS et Pages `38024963381` SUCCESS. Checkpoint départ `checkpoint/lab-start-zone-ground-anchor-author-refresh-v1-2026-10-10` et branche `work/lab-zone-ground-anchor-author-refresh-v1-2026-10-10` depuis SHA exact.
- **Propriétaires** : `SkillPresentationBindingV1/V9` définit déjà `attachment:source|fixed-source` ; `capture-skill-presentation-assets-v2` traduit le binding sans inventer de second état ; `DomSkillFxRenderer` est seul propriétaire de la position visuelle du nœud par zoneId ; `Human Editor` propose un choix auteur et en assure l'aller-retour JSON. `CombatState.persistentZones` reste la seule autorité de la présence spatiale et de la durée ; le renderer ne calcule pas les dégâts ni les buffs. `capture-showcase-skill-presets`/`capture-showcase-creature-presets` sont déjà les listes canoniques et conservent leurs identités.
- **Fichiers autorisés** : `data/capture/showcase/cap_water_special_2.capture-skill-transfer-v1.json`, `data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json`, `src/adapters/renderer/capture-skill-presentation-assets-v2.js`, `src/adapters/renderer/dom-skill-fx.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, `tests/unit/capture-water-veil-author-preset-v1.test.mjs`, `tests/unit/persistent-zone-recall-persistence-v1.test.mjs` ou nouveau `tests/unit/persistent-zone-anchor-author-v1.test.mjs`, éventuellement `tests/browser/capture-creature-library-smoke.mjs` pour vrai roundtrip, `docs/LAB_CURRENT_WORK.md` et rapport `docs/LAB_ZONE_GROUND_ANCHOR_AUTHOR_REFRESH_V1.md`.
- **Protéger** : toutes les capacités/créatures autres que les deux IDs de l'auteur ; base de données auteur et bibliothèques autres ; pas de migration globale ni d'ajout d'assets ; laisser `source` suivre le lanceur, `fixed-source` figer au sol dès le premier frame de zone, y compris avant rappel, puis demeurer figé après rappel ; ne pas confondre ancrage visuel et gameplay ; aucun changement de `src/core/combat/`, `global-assets`, `main`, `Zombicide-40k`.
- **Tests RED→GREEN** : nouvelle preuve régression : même nœud zone `source` suit le changement de rectangle, zone `fixed-source` conserve sa position sans départ du lanceur, `fixed-source` après rappel même owner, disparition propre ; les 2 fichiers sont normalisables et fidèles (nom, prep 2s, max 1, scale 4, offsetY -35, Défense +100 et 60s ; Maraileron stats, résistance, skillIDs lib_aqua_heal, slots 1..4 et ultime), `fixed-source` conservé via vrai Human Editor et export/import, 103 créatures et Firestorm inchangés. Suite complète Node/Chromium et checkpoint GREEN exact avant publication.

### Extension de périmètre sentinelles après première CI RED — 2026-10-10

- Première implantation `99254509411a4221a159c7003469f08d107e523e`, CI `38033133369` : les deux vrais navigateurs (bibliothèque et Firestorm) sont verts, mais Foundation rouge sur **trois sentinelles historiques** désormais en contradiction avec deux changements expressément fournis par l'auteur, pas sur l'ancrage visuel.
- **Extension autorisée de tests seulement** : `tests/unit/maraileron-author-export-v1.test.mjs` (ancien slot4 et ultime vide remplacés volontairement par `lib_aqua_heal` et `cap_water_special_2`), `tests/integration/goutte-projectile-power-regression-v1.test.mjs` (fixture native historique `cap_water_special_2` encore standard : intégrer dans `configuredSkills` les versions ultimes et soin issues des fiches showcase *avant* d'exporter la fiche Maraileron de test, sans changer le catalogue runtime), `tests/unit/capture-water-veil-author-preset-v1.test.mjs` (expiry à `zone.expiresAtMs` au lieu de supposer une préparation nulle). Étendre `tests/browser/capture-creature-library-smoke.mjs` pour vérifier le nouveau mode d'ancrage via la vraie UI, ainsi que la nouvelle sélection ultime depuis la fiche Maraileron si le parcours le permet. Ne pas affaiblir les autres assertions Goutte, sockets, dégâts ou bindings.
- Aucun changement de scope moteur, protocole ou données auteur hors les deux exports explicitement demandés.

### Ancrage au sol auteur — preuve GREEN avant publication

- **Implémentation** `99254509411a4221a159c7003469f08d107e523e` : les deux imports auteur sont remplacés en Showcase, Voile conserve uniquement l'adaptation `attachment=fixed-source` explicitement demandée ; support du champ de présentation visuelle de zone jusqu'au renderer, sélecteur de l'éditeur avec roundtrip. Le mode `source` historique est inchangé pour Firestorm/Vague de flammes. Documentation de l'identité des deux transferts et des valeurs conservées dans `docs/LAB_ZONE_GROUND_ANCHOR_AUTHOR_REFRESH_V1.md`.
- **RED sentinelles voulues** : `89c09e3a35922812663c78805519c50bd4c000e9` sans fonctionnalité (CI `38033001587` FAILED) ; première CI fonctionnelle `38033133369` en échec sur *trois tests historiques* encore basés sur l'ancien loadout / timing du sort : aucun détour de moteur ni rollback de données utilisateur. Après extension de périmètre documentée, les fixtures Goutte et Maraileron lisent les nouvelles capacités autoritaires et l'expiration est évaluée depuis `zone.expiresAtMs`.
- **GREEN source avec test vrai navigateur** : `1e102e1155e027c9695c910041c061a9b00c00c4`, **CI `38033316529` SUCCESS**, Foundation **1379/1379 Node**, `creature-library-browser` SUCCESS (l'éditeur natif charge Voile, mode fixe, sauvegarde et Maraileron au slot Ultime), `firestorm-zone-growth-browser` SUCCESS. 13 fichiers touchés (tests/docs inclus), zéro behind depuis base publiée `e5fd873e0b0a98c4d062471267cee884130aec87` ; pas de source de vérité parallèle, aucune mutation des autres créatures/skills, aucun asset créé.
- **Publication** : effectuer sur le SHA documentaire exact seulement après CI du commit final ; checkpoint GREEN et preview, puis fast-forward public avec lease si base identique, puis vérifier les deux jobs publiés. Test tactile Android physique demeure ouvert.


## 2026-10-10 — Orbes d'énergie HUD Combat Capture V1

- **Demande** : rendre l'énergie plus visible avec des ronds qui se remplissent pendant le combat, lisibles sur smartphone paysage. Le nombre exact courant / maximum reste visible ; une recharge actualise automatiquement l'affichage à partir du snapshot du Combat State, sans faux compteur ou animation temporelle distincte.
- **Base GREEN publiée** : `gh-pages` `d30cc8ebedca16ac8c20bf2561b63ab2ae324c83` ; CI + Pages success des deux runs publics récents. Départ `checkpoint/lab-start-combat-energy-orbs-v1-2026-10-10`, travail `work/lab-combat-energy-orbs-v1-2026-10-10`, tous deux au SHA exact. Aucun travail concurrent repéré sur HUD énergie lors de l'audit des HEAD récents.
- **Owner** : Combat Session / State détient `fighter.energy/maxEnergy` et ses recharges, `src/ui/combat-2v2-test-ui.js` est seulement consommateur de snapshot et pilote la vue existante `[data-combat-energy]`; `src/adapters/renderer/combat-energy-orbs-v1.js` fournit la projection DOM visuelle sans état de jeu ni timers; CSS Capture du HUD seulement. Ne pas créer de deuxième charge, coût, compteur, timer, observer ni fuite de listeners.
- **Fichiers autorisés** : `src/adapters/renderer/combat-energy-orbs-v1.js` (nouveau composant purement présentational), `src/ui/combat-2v2-test-ui.js` (appel direct), `examples/dom-demo/capture-editor-v2.html` (slot DOM sémantique), `examples/dom-demo/demo.css` (style HUD), `examples/dom-demo/capture-editor-v2.css` (règles paysage seulement si indispensable), `tests/unit/capture-combat-energy-orbs-v1.test.mjs` (nouveaux tests calcul/DOM), `tests/browser/capture-creature-library-smoke.mjs` (vrai combat navigateur si compatible avec suite), `docs/LAB_CURRENT_WORK.md`, `docs/LAB_COMBAT_ENERGY_ORBS_V1.md` (rapport). Aucun changement de Core, Battle Setup, réglages Game, capacités, roster, assets, auteur, autres laboratoires, main, global-assets, Zombicide.
- **Contrat visuel** : jusqu'à 12 ronds, une unité d'énergie chacun lorsque max <= 12 ; au-delà, 12 segments visuels proportionnels représentant toute la réserve, compteur numérique impératif. Un rond est vide, partiellement rempli ou plein selon le ratio réellement issu du moteur ; progression de remplissage CSS uniquement lors d'une mise à jour native, sans interpolation mensongère de la recharge. Supports 0/max=0, grands maxima, décimales, switch membre et remontage du HUD, contraste accessible, éléments décoratifs `aria-hidden` et annonce résumée par le vrai nombre.
- **TDD / validations** : test RED → implémentation minimale → vrais snapshots du HUD + taille max, zéro, fractions / au-delà de 12 / switch et absence de duplication de nœuds ; tests Node complets + navigateur Chromium bibliothèques 103 créatures + Firestorm, revue responsive 390/430/paysage, puis SHA final + CI, checkpoint GREEN et Pages via lease public inchangé. Validation tactile smartphone physique distincte.


### Orbes d'énergie V1 — GREEN fonctionnel initial

- RED `47c57d4f607b210b60e6510e85d3f5f1e74a4cc7` CI `38041983196` FAILURE attendue ; implémentation `f6d809fc904af4321051dfdbceecce70bc51d956` CI `38042074133` SUCCESS sur Foundation, Chromium bibliothèque et Chromium Firestorm.
- 12 orbes maximum représentant `energy/maxEnergy` du Combat State, remplissage à chaque variation du snapshot, exactitude du nombre numérique préservée, pas d'horloge ou état concurrent. L'ancien progress reste technique/masqué, `role=img` avec libellé accessible, `prefers-reduced-motion` respecté, nodes DOM réutilisés.
- Test Chromium complémentaire sur largeur 180px et énergie partielle ajouté `ad3cad0cc9ab30aa9f58ee7cabffda521d513ffb` ; rapport `docs/LAB_COMBAT_ENERGY_ORBS_V1.md`.
- **Restant avant livraison** : CI SHA exact final puis checkpoint/preview/GH Pages et confirmation jobs publics ; validation tactile smartphone physique distincte.

## 2026-10-10 — Lisibilité de la préparation des capacités V1 (lot 1)

- **Demande** : rendre la barre de chargement des capacités nettement plus visible, détaillée et agréable sur smartphone paysage, sans changer la durée de préparation ni les cooldowns.
- **Base GREEN publique exacte** : `gh-pages` `58805434d866cbf8376527ba6ed268a72f41d381`, CI `38042301939` et Pages `38042302408` SUCCESS ; checkpoint de départ `checkpoint/lab-start-combat-cast-charge-visibility-v1-2026-10-10` au même SHA ; branche `work/lab-combat-cast-charge-visibility-v1-2026-10-10`.
- **Owner unique** : Combat Runtime possède la phase `preparation`, `chargeProgress` et `remainingPreparationMs` ; le nouvel adaptateur visuel `CombatCastChargePresenterV1` ne fait que projeter ces snapshots sur le `progress` existant et un libellé associé. Aucune horloge, durée ou état métier supplémentaire.
- **Autorisé** : `src/adapters/renderer/combat-cast-charge-presentation-v1.js` (nouveau), `src/ui/combat-2v2-test-ui.js` (raccord aux événements existants), `examples/dom-demo/demo.css` (CSS natif `progress` et lisibilité), `tests/unit/combat-cast-charge-presentation-v1.test.mjs` (contrat, vrai rappel du délégué, reset, 1v1/2v2), `docs/LAB_CURRENT_WORK.md` et rapport dédié. Aucun remaniement HTML requis.
- **Protégés** : `Combat Session/Rules`, `Combat Runtime`, `statusEffect`, statuts buff/debuff, `SkillEffect` et toutes les données auteur, 103 créatures, orbes énergie, assets, `global-assets`, `main`, `Zombicide-40k`, Exploration. L'ergonomie des statuts du joueur sera un **lot 2 distinct**, branché sur le GREEN du présent lot.
- **TDD** : test RED avant module ; projection réelle du snapshot en pourcentage / secondes restantes ; libellé masqué hors préparation ; changement de cible ou combat n'introduit pas d'horloge ; tests Node complets et navigateurs existants (103 créatures, Firestorm), revue et checkpoint GREEN exact. CSS doit rester lisible avec `prefers-reduced-motion`.
- **Livraison** : preview dédiée et publication `gh-pages` uniquement avec CI réussie et lease inchangé ; la validation tactile utilisateur reste distincte.

## 2026-10-10 — Visibilité des buffs/debuffs côté joueur V1 (lot 2)

- **Retour utilisateur** : l'information d'un statut paraît correcte côté adversaire, mais n'est pas consultable correctement sur sa propre créature. Conserver l'affichage et le gameplay ennemis.
- **Diagnostic initial du vrai chemin** : les quatre acteurs possèdent déjà `data-combat-status-icons` et sont servis par le même `DomStatusFxRenderer.sync(CombatState)`. La fiche `.status-icon__details` s'ouvre systématiquement **en dessous** de son icône. Or la carte du joueur est `bottom:0.45rem` dans `.arena { overflow:hidden }` et ses premières icônes sont très près du bord gauche. La fenêtre d'information du joueur est donc hors cadre ; côté ennemi (carte en haut) elle est visible. Même risque pour l'allié dans le HUD bas/droite.
- **Base GREEN exacte** : `gh-pages` `8950b339629e1484c096db4e8a0f1bae38397766` (barre de préparation), CI `38043940129` SUCCESS ; checkpoint `checkpoint/lab-start-player-status-hud-readability-v1-2026-10-10` et branche `work/lab-player-status-hud-readability-v1-2026-10-10` au SHA exact.
- **Owner** : `DomStatusFxRenderer` affiche les instances du `CombatState` ; `demo.css` est seul propriétaire du placement des fiches du HUD. Corriger la géométrie CSS sans réimplémenter les instances, la durée ou le calcul des statuts, et sans dupliquer le renderer.
- **Fichiers autorisés** : `examples/dom-demo/demo.css` pour la position verticale/horizontale des infobulles dans les cartes du bas ; `tests/unit/player-status-hud-readability-v1.test.mjs` pour la sentinelle DOM/CSS ; optionnellement `tests/unit/status-info-card-v1.test.mjs` pour le vrai renderer sur player + enemy, `docs/LAB_CURRENT_WORK.md` et `docs/LAB_PLAYER_STATUS_HUD_READABILITY_V1.md`. Le CSS paysage `capture-editor-v2.css` seulement si les tests prouvent une nécessité.
- **Protégés** : `CombatState`, `Status Runtime`, `Zone Runtime`, données créature/capacité auteur, `src/adapters/renderer/dom-status-fx.js` (sauf bug réel démontré), `Combat 2v2` action/cooldown, barre de préparation précédente, 103 créatures, `main`, `Zombicide-40k`, exploration, assets.
- **TDD** : RED CSS local bas -> ancrage de fiche au-dessus, alignement à gauche pour joueur, au bord droit pour allié afin de garder l'ensemble dans la zone visible ; adversaire conserve son ancrage en dessous. Test même renderer sur player/enemy pour vraie instance status et disparition native ; Node + Chromium bibliothèque 103 créatures et Firestorm ; revue/CI SHA exact, checkpoint GREEN, preview, livraison `gh-pages` sous lease, test Android utilisateur distinct.


## 2026-10-10 — Délai entre changements volontaires de créature V1 (EN COURS)
- **Demande** : empêcher le spam de rappels/échanges volontaires par un verrou configurable, **45 secondes par défaut**, avec **0 seconde** autorisée ; KO et relève automatique sont totalement exemptés.
- **Base exacte** : `gh-pages` `c65b5d370815c3ab5744f121729bdad89d9d7da2` ; checkpoint de départ `checkpoint/lab-start-voluntary-recall-cooldown-v1-2026-10-10` ; branche `work/lab-voluntary-recall-cooldown-v1-2026-10-10`.
- **Unique propriétaire** : `Roster Session` stocke le prochain instant d'échange volontaire autorisé par slot, sur `Combat Session.snapshot().elapsedMs`. `CaptureGameOptionsV1` valide la durée, l'éditeur la saisit et le panneau affiche le reste sans posséder d'horloge.
- **Autorisé** : `src/contracts/roster-switch-policy-v1.js`, `src/contracts/capture-game-options-v1.js`, `src/core/combat/roster-session.js`, `src/ui/capture-combat-roster-controller-v1.js`, `src/ui/combat-2v2-test-ui.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, tests ciblés, ce document et rapport du lot.
- **Protégés** : commandes de préparation 2 s et coût nul, `Combat Runtime` et combat/FX, `Combat Session` et effets, `replaceKnockedOut` et relève instantanée, bibliothèque 103 créatures, exports anciens, `main`, `Zombicide-40k`, Exploration.
- **TDD** : RED normalisation (45 000 / 0 / 60 000), refus preview et completion pendant le verrou, horloge simulée via `session.advanceMs`, exemption KO, durée par slot et remise à zéro au nouveau combat, éditeur/HTML, vrais exports et tests Node + Chromium existants.
- **Fin** : CI verte SHA exact, rapport, checkpoint GREEN, preview et publication `gh-pages` sous lease ; validation smartphone physique distincte.

### Délai de rappel volontaire V1 — validation en cours
- RED ciblé CI `38045491255` ; implémentation et sentinelles en branche, CI `38045663599` SUCCESS (Foundation et navigateurs) avant ajout du test UI/contrôleur complémentaire.
- Rapport : `docs/LAB_VOLUNTARY_RECALL_COOLDOWN_V1.md`.
- Exiger la réussite CI au SHA final avant tout checkpoint GREEN ou publication. La validation smartphone de Sylvain reste distincte.


## 2026-10-10 — Compteur discret près du rappel en combat V1
- **Retour smartphone validé** : le délai 45 s fonctionne ; le temps restant actuellement annoncé dans le long paragraphe `[data-combat-recall-note]` requiert le défilement du panneau déroulant et occupe trop d'espace.
- **Base GREEN publique exacte** : `f08f2cea84ac309ee6245c424dbfa4217d895c6a`, CI `38045812501` SUCCESS, Pages `38045812328` SUCCESS, checkpoint `checkpoint/lab-voluntary-recall-cooldown-v1-green-2026-10-10`.
- **Checkpoint départ** : `checkpoint/lab-start-compact-recall-countdown-hud-v1-2026-10-10` ; branche `work/lab-compact-recall-countdown-hud-v1-2026-10-10`.
- **Propriétaire** : `Roster Session` garde `voluntarySwitchCooldownRemainingMs` ; `CaptureCombatRosterPanelV1` affiche ce snapshot dans un badge compact situé **dans l'en-tête permanent du rappel**, hors popup scrollable, sans ajouter de timer, sans changer les blocages.
- **Fichiers autorisés** : `src/ui/capture-combat-roster-controller-v1.js`, `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, `tests/unit/compact-recall-countdown-hud-v1.test.mjs`, documentation du lot et présent registre.
- **Protégés** : `Roster Session`, `Combat Runtime`, `CaptureGameOptionsV1`, combat timing et commandes, les buffs et leurs widgets, les 103 créatures, le stockage et l'éditeur des capacités, `main`, GenSrpG et Exploration.
- **TDD** : badge statique dans le `summary` toujours visible lorsque `details` est fermé, texte compact et masquage à zéro, aucune duplication/reflow continu, test lecture du vrai snapshot, progression via `onClock` natif, assertions CSS paysage 390/430 et clavier; toutes suites Node/Chromium.
- **GREEN technique** : CI du SHA final + revue/rapport + checkpoint exact + publication lease ; approbation visuelle réelle par l'utilisateur distincte.


### Compteur compact Rappel — état technique
- TDD RED sur `tests/unit/compact-recall-countdown-hud-v1.test.mjs` avant modifications HTML/CSS/UI ; pas de nouvelle autorité.
- UI : `summary` du menu Équipe/Rappel montre toujours le compteur, qu'il soit ouvert ou fermé. L'ancien message de décompte dans la popup est supprimé ; la description statique est préservée.
- Rapport : `docs/LAB_COMPACT_RECALL_COUNTDOWN_HUD_V1.md`.
- Dernier contrôle requis : réussite CI au SHA exact final, puis checkpoint GREEN/preview/publication lease ; confirmation visuelle par Sylvain ensuite.


## 2026-10-10 — Correction sémantique des descriptions de défense + deux capacités Terre
- **Retour utilisateur** : Carapace minérale réduit effectivement les dégâts reçus de 40 %, mais la carte de buff écrit l'inverse. Deux exports de capacités joints : `lib_earth_guard` (Carapace minérale), `cap_earth_atk_2` (Coup minéral).
- **Base GREEN publique** : `70af0686fafa3c2ffd4e1e9dd2cdcc6d8d8f5fed`, CI `38047065872` SUCCESS, Pages `38047065644` SUCCESS. Départ `checkpoint/lab-start-defense-buff-description-v1-2026-10-10`, branche `work/lab-defense-buff-description-v1-2026-10-10`.
- **Cause prouvée** : `projectStatusStatEffectsV1` produit `damageReductionPct>0` pour +200 défense x coefficient standard 0.2 = 40 % de dégâts reçus réduits, mais `status-effect-info-v1.js` emploie par défaut un libellé `augmentés` lorsqu'il est positif. L'éditeur affiche déjà correctement `-40 % dégâts reçus`.
- **Autorité** : règles et statut dans `Combat Session` et `Status Effect Projection` intacts ; seul `status-effect-info-v1.js` change les mots. Les presets exportés sont fidèlement sauvegardés et référencés par `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, leur hydratation utilise le propriétaire `configuredSkills`.
- **Périmètre** : `src/adapters/renderer/status-effect-info-v1.js`, `src/catalogs/capture-showcase-skill-presets-v1.js`, deux `data/capture/showcase/*.json`, `tests/unit/defense-buff-description-author-presets-v1.test.mjs`, ce document et rapport.
- **Protégés** : formules combat et taux de défense, tous les autres status/FX, loadouts, fiches créatures, progression, modèles, `main`, GenSrpG et Exploration.
- **TDD** : test RED +40 % devient « dégâts reçus réduits de 40 % », -20 % devient « dégâts reçus augmentés de 20 % », ligne physique résistances inchangée, 0 % sans ligne, import/roundtrip des deux transferts, paramètres auteurs inchangés, `assetId` réellement répertoriés, test CI Node/Chromium. GREEN et publication uniquement après CI réussie au SHA exact, checkpoint, compare+lease.
- **Validation visuelle smartphone** : ultérieure, distincte du GREEN technique.

### Défense Carapace / capacités Terre — vérification GREEN de code
- TDD RED `38051562513` (échec attendu), après correction et import des deux fichiers source, `38051736579` SUCCESS à `331ef37b21a2022551db234c545e41998fd97f0e` (Foundation + Chromium bibliothèque + Firestorm 1v1/2v2).
- Code : seule la formulation de `damageReductionPct` a changé ; +40 % de réduction = dégâts reçus **réduits de 40 %**, -20 % = **augmentés de 20 %**.
- Deux presets Terra authored `lib_earth_guard` et `cap_earth_atk_2` conservés tels quels, assets réels trouvés dans `global-assets`, registre unique `configuredSkills` et test d'import/remplacement, aucun autre loadout modifié.
- Rapport : `docs/LAB_DEFENSE_BUFF_DESCRIPTION_EARTH_AUTHOR_PRESETS_V1.md`. GREEN final soumis à CI sur dernière édition documentaire, checkpoint puis lease de `gh-pages` ; la validation manuelle smartphone reste distincte.


## 2026-10-10 — Audio de trajet calé sur les pas / rebonds lors d'une attaque contact V1
- **Demande** : réutiliser le son `travel` (« Son du trajet ») d'une capacité de contact, déclenché une fois par appui/rebond du mouvement : 4 contacts = 4 lectures, 2 = 2 ; profils sans contact (volant, serpentin, téléportation, approche sous-sol) = un seul déclenchement au départ. Le son d'impact reste distinct.
- **Base publique exacte** : `gh-pages` `9718da7947481e639e0350c5ba10dea436fe05b2` CI/Pages SUCCESS. Checkpoint `checkpoint/lab-start-contact-approach-footstep-audio-v1-2026-10-10`, branche `work/lab-contact-approach-footstep-audio-v1-2026-10-10`.
- **Diagnostic** : Animation Core publie déjà `plan.cues` avec `type:"footfall"` aux contacts de la locomotion; `src/ui/demo-app.js` distribue déjà ces cues vers FX Core et le camera shake. Le `CombatResolutionPresenter` ne joue actuellement `audio.travel` que pour `projectile` et `beam`. L'audio reçoit `travelSound` dans `DomCombatAudio` et doit être joué en **one-shot** même si le son pour projectile est paramétré en loop.
- **Propriétaires** : Animation Core reste seul maître du timing des appuis, `demo-app.js` relaye le même cue préexistant, `CombatResolutionPresenter` traduit seulement pour attaques `form:"contact"`, `DomCombatAudio` joue le son sur le même assetId en one-shot, aucun horloge audio en plus.
- **Périmètre** : `src/ui/demo-app.js` (callback facultatif sur cue), `src/adapters/renderer/combat-resolution-presenter.js` (routage et gestion des handles), `src/adapters/audio/dom-combat-audio.js` (override loop explicit), `examples/dom-demo/capture-editor-v2.html` (libellé exact), nouveaux tests ciblés + docs.
- **Protégés** : profils et leurs contacts, Animation Core, le FX caméra/shake, toutes les règles et timings du combat, audio `projectile`/`beam` boucle et fin, statut, bibliothèque des 103 créatures, presets, assets, `main`, Zombicide-40k et Exploration.
- **TDD** : RED profil 4/2/3 appuis / flying et serpentine 0 ; s'assurer que les cues réels passent sans replanification ; presenter déclenche les 4/2 et 1 sans-cue, et uniquement pour contact (ni projectile, beam, ni move générique); option loop=false systématique malgré settings; interruption et dispose nettoient les sons actifs; CI Node et Chromium, checkpoint GREEN et publication sous lease, validation Android séparée.


## 2026-10-10 — Déplacer l’audio des appuis vers la fiche créature V1
- **Demande** : un son de pas lourd sur une capacité réutilisée par une créature légère est incohérent ; les pas / rebonds / vol doivent utiliser le son configuré sur **la créature actuelle**, jamais `skill.audio.travel`. La synchronisation 4/2/3/1 des cues de locomotion validée précédemment est conservée.
- **Base publique vérifiée** : `e4fe6368a276411033deed40712c10b9079292c9` (Laboratory CI + Pages SUCCESS). Checkpoint départ `checkpoint/lab-start-creature-owned-movement-audio-v1-2026-10-10`, branche isolée `work/lab-creature-owned-movement-audio-v1-2026-10-10`.
- **Source canonique** : `CreaturePresentationBinding.audio.movement` (assetId, volume), édité dans « Sons de la créature » et sauvegardé/chargé via le draft V3 et l’export Capture Transfer; `configuredCreatures` seul propriétaire. La source visuelle native expose uniquement cette audio de la créature chargée par slot ; `DomCombatAudio` la résout au moment du cue, sans nom, espèce, mock ou fallback vers la capacité.
- **Chemin** : `Animation Core plan.cues -> Demo Visual Controller onFootfall -> CombatResolutionPresenter(type movement) -> DomCombatAudio.presentationForCreature(actorSlot) -> slot.creatureMeta.audio.movement`. Sans fichier configuré : silencieux. Pas de nouveau timer.
- **UI** : ajouter la sélection Son des pas / déplacement + écouter/importer rôle movement dans panneau créature, changer le texte de Son du trajet de la capacité en « projectile / rayon » et enlever la revendication « contact ».
- **Invariants** : aucune migration inventée de skill vers créature ; sound release/impact/zone et projectile/beam inchangés ; compatibilité anciens exports V2/V3 sans son ; tous les profils et timings, capacités, 103 créatures, loadouts et gameplay inchangés ; pas d’asset généré ; main, GenSrpG principal et Exploration non touchés.
- **Protocole** : RED tests vrais profils (4/2/3/1), 2 créatures différentes et même skill, auteur transfer JSON roundtrip/export-reimport, save/restore éditeur, absence de fallback, switch de slot, projection visuelle native, audio adapter distinct, CI Node + Chromium, checkpoint GREEN + lease seulement si tests verts. Validation auditive Android distincte.


## 2026-10-10 — Sprite de statut : apparition puis image finale figée V1
- **Demande** : armure de pierre visuelle : lire ses frames une seule fois à vitesse native, puis garder la dernière image visible durant tout le buff, et retirer la couche exactement à la disparition du statut. Ni boucle, ni étalement sur toute la durée (qui « devient blanc »).
- **Base** : `gh-pages` `c8603fca6ed4e054bbf0c16d188dfb33db25fbe5`, CI/Pages SUCCESS. Checkpoint `checkpoint/lab-start-status-sprite-hold-last-v1-2026-10-10`, branche `work/lab-status-sprite-hold-last-v1-2026-10-10`.
- **Autorité** : `SkillPresentationBindingV3.statusVisuals[statusId].sprite.playbackMode = "hold-last"` pour le statut seulement, via les contrôles canoniques `capture-editor-sprite-controls-v1.js`. Le même `applySpriteVisual` sait jouer le strip atlas ou les frames séparées jusqu’à la dernière frame avec `fill:forwards`. Le même `DomStatusFxRenderer` conserve le nœud tant que l'instance réelle est présente et le supprime à expiry/dispel ; pas de logique de durée gameplay ni ticker supplémentaire.
- **Diagnostic** : `stretch` allonge l'animation entière jusqu'à la fin du statut, ce qui ne correspond pas au gel demandé ; la lecture `frames[]` non-loop est pilotée par `backgroundImage` WAAPI (transition d'URL peu fiable selon moteurs), tandis que le mode loop emploie déjà des images superposées. Une lecture unique par images superposées pour hold-last évite cette dépendance.
- **Portée** : contrat `skill-presentation-binding-v3.js`, sélecteur de statut du Human Editor, sprite core DOM `dom-skill-fx.js` et tests. Pas de modification des contrats `StatusEffectV1`, durée/expirations, animation `once/loop/stretch` des autres usages, sprites auteur, 103 créatures, GenSrpG principal, Exploration, ou `global-assets`.
- **Tests** : RED mode valide uniquement dans visuel statut et préservé dans export/retour UI ; atlas 8 frames tempo natif, figé sur 100% image 8 ; `frames[]` non-loop avec dernière image persistante sans interpolation de `backgroundImage`; refresh/reinforcement même nœud ; suppression quand status absent ; ancienne boucle et stretch inchangés ; CI Foundation + Chromium, checkpoint GREEN et publication lease après succès SHA final. Vérification visuelle Android reste utilisateur.


## 2026-10-10 — Carapace de pierre : correction atlas 12 frames et cache Labo Combat
- **Utilisateur** : en mode « joue puis garde dernière frame », le sprite de carapace se désassemble dans ses dernières images. Inspection directe GitHub des PNG de la véritable aura : les images 13 à 16 représentent la rétractation et la frame 12 est la dernière carapace entière.
- **Asset unique corrigé** : `pack:capture:sprite-stone-carapace-aura-01` dans la branche `global-assets`, SHA `23d978a46b6ec7b4c1529d09fc231b312957567c`, CI SUCCESS. Les 12 premiers PNG d'origine restent strictement intacts ; nouvel atlas lossless 6144×512, 12 frames à 90 ms/frame, `frameCount=12` dans le catalogue, manifeste et provenance cohérents, 4 PNG finaux 13–16 supprimés ; la source originale 16 frames est conservée en archive. L’animation cast de 16 frames reste inchangée.
- **Source propriétaire runtime** : seule `src/assets/global-visual-library.js` avance sa `REVISION` à `2026-10-10-v21-stone-carapace-aura-12-frame`. Ainsi URLs catalogue ET fichier WebP sont cache-bustées en conservant l'assetId existant. Aucun duplicat de catalogue, pas de changement au renderer, au mode `hold-last` déjà intégré, à la présentation auteur, au Runtime, à la charte, aux 103 créatures ou aux presets.
- **Base Labo** : `gh-pages` SHA `0936191339c87dd52afc7929344f0556cf966c54`, checkpoint `checkpoint/lab-start-stone-carapace-12frame-asset-refresh-2026-10-10`, travail `work/lab-stone-carapace-12frame-asset-refresh-2026-10-10`.
- **Validation** : sentinelle URL cache et CI Node/Chromium au SHA final avant checkpoint GREEN et publication gh-pages par fast-forward sous lease ; vérification visuelle sur smartphone reste manuelle, distincte de GREEN technique.

## 2026-10-10 — Carapace minérale : remplacement auteur HD hold-last (lot circonscrit)

- **Validation utilisateur** : correction de l'atlas HD à 12 frames vérifiée sur Android ; ne pas la refaire.
- **Source auteur** : fichier transmis `gensrpg-capture-skill-lib_earth_guard(1).json`, transfert `capture-skill-transfer-v1`, ID inchangé `lib_earth_guard`. La fiche déjà publiée utilise l'ancien `sprite-status-stone-shell-01` (8 frames, opacité 0.6).
- **Base publique exacte** : `gh-pages` `5276806ed6c1526d768284543ef1957de7a2b8ff`, Laboratory CI `38068225543` SUCCESS, Pages `38068225475` SUCCESS. Asset canonique HD : `global-assets` `23d978a46b6ec7b4c1529d09fc231b312957567c`, checkpoint GREEN préexistant.
- **Checkpoint départ** : `checkpoint/lab-start-earth-guard-hd-hold-last-author-refresh-2026-10-10`. **Branche** : `work/lab-earth-guard-hd-hold-last-author-refresh-2026-10-10`.
- **Owner unique** : `data/capture/showcase/lib_earth_guard.capture-skill-transfer-v1.json` hydraté par `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` dans `configuredSkills`, sans doublon et sans ajuster les données de l'auteur.
- **Changement exact** : remplacer seulement la fiche `lib_earth_guard` par l'export utilisateur complet : `statusVisuals['lib_earth_guard:0'].sprite.playbackMode='hold-last'`, `assetId='pack:capture:sprite-stone-carapace-aura-01'`, `opacity=0.75`, `displayScale=1.6`. Tous les paramètres gameplay/statut/identité restent identiques.
- **Périmètre** : JSON auteur de Carapace, test de transfert/raccord `tests/unit/defense-buff-description-author-presets-v1.test.mjs`, ce journal et rapport dédié. Aucun nouveau catalogue, média, moteur ou logique d'animation.
- **Protégés** : `cap_earth_atk_2` et autres skills, créatures 103 et loadouts, statuts/Combat Runtime/FX, atlas et catalogue de `global-assets`, `main`, GenSrpG et Exploration.
- **Tests** : RED de fidélité export par assetId/playback/opacity et non-régression; GREEN par transfert strict, roundtrip et remplacement ID, maintien vrai statut + suppression, vérification URL atlas 12 frames, Node/Chromium en CI ; checkpoint GREEN SHA exact et publication Pages par fast-forward avec lease ; validation smartphone de la nouvelle fiche distincte.

### État code — transfert auteur Carapace HD
- RED `8a83a47bbb24715c608d1dc003c9960b6f034c5c` / CI `38071060538` FAILURE attendu sur la sentinelle de nouveau sprite.
- Remplacement de l'unique preset existant `lib_earth_guard` : `b42396aee7effc8aca011b1c03ed8f12e1f82bb2`. Seuls le nouvel `assetId` HD, le `playbackMode='hold-last'` et `opacity=0.75` changent ; `displayScale=1.6` inchangé.
- Sentinelle de fidélité auteur mise à jour ; identité, buff +200 pendant 25 s, paramètres coût/niveau/cooldown, icône et autres réglages strictement conservés. Catalogue natif et registre `configuredSkills` non modifiés.
- Rapport `docs/LAB_EARTH_GUARD_HD_HOLD_LAST_AUTHOR_REFRESH_V1.md`.
- Avant GREEN : CI sur ce SHA documentaire, checkpoint exact, promotion en fast-forward sous lease, CI + Pages sur `gh-pages`, validation smartphone utilisateur distincte.

## 2026-10-10 — Combat Capture : résolution implicite d'une cible unique
- **Demande utilisateur** : éviter le clic manuel de cible pour une capacité sur soi ou un ennemi unique (notamment après changement de type de capacité en 1v1). Conserver un choix explicite en 2v2 lorsque plusieurs ennemis/alliés sont possibles et pour les capacités de soutien ciblant les alliés.
- **Base publique GREEN** : `gh-pages` `1dfac0e56c5cff40dc81c2ccfa29f9ce43285578`, Laboratory CI `38071188272` SUCCESS, Pages `38071187909` SUCCESS.
- **Checkpoint départ** : `checkpoint/lab-start-implicit-single-target-combat-ui-v1-2026-10-10`. **Branche** : `work/lab-implicit-single-target-combat-ui-v1-2026-10-10`.
- **Owner** : `src/ui/combat-2v2-test-ui.js` décide seulement de l'ergonomie de sélection ; `combatSkillTargetOptionsV1` relaie les permissions et previews de Combat Rules / Combat Session ; `runtime.startSkill` reste seul à lancer la compétence.
- **Comportement** : self-only applique sur le lanceur automatiquement ; enemy-only applique directement quand une seule cible admissible et disponible existe (1v1 ou fin 2v2), même après sélection d'un allié. En 2v2, si plusieurs ennemis sont disponibles, la sélection manuelle déjà active reste pertinente et l'absence d'ennemi sélectionné demande une cible ; les capacités ally/self+ally préservent leur ciblage explicite, sans auto-détournement. Le bouton et ses indicateurs d'obligation ciblage utilisent le même résolveur.
- **Périmètre** : `src/ui/combat-2v2-test-ui.js`, nouveau test dédié d'intention UI/permissions et ce journal/rapport. Aucune modification des contrats `targetRelations`, des capacités, du moteur, de la sélection des réserves, de `configuredSkills`, des 103 créatures, de leurs loadouts, de l'audio, des FX ni de `global-assets`, `main`, GenSrpG principal, Exploration.
- **TDD** : RED sur choix implicite self, enemy unique après self, multi-enemy et ally explicites ; GREEN par résolveur pur et même chemin de clic; vérifier qu'un KO, invulnérabilité/présence ou cooldown ne provoque pas de ciblage fantôme, CI Node + navigateurs existants ; checkpoint GREEN exact, promotion fast-forward sous lease puis CI + Pages. Validation smartphone utilisateur distincte.

### Ciblage implicite — RED et correctif
- Test RED `c056582c953bc537d9c978de32aa0b5990553403` / Laboratory CI `38072023923` FAILURE attendu avant implémentation du résolveur.
- Correctif UI `3cb3d6362f6b3d0d89e7ad44d86e98bc0a72bd82` : résolveur pur d'une cible uniquement self ou ennemie unique, utilisé par le clic de capacité et l'indicateur `target-required`, sans modifier les règles de combat. Le choix de cible alliée et des deux ennemis en 2v2 reste explicite lorsqu'il y a plusieurs cibles.
- Rapport `docs/LAB_IMPLICIT_SINGLE_TARGET_COMBAT_UI_V1.md` ; tests `tests/unit/combat-implicit-single-target-ui-v1.test.mjs`.
- Attendre CI sur SHA final, checkpoint GREEN exact, promotion sous lease et Pages SUCCESS ; vérification smartphone distincte.

## 2026-10-10 — Capture : projectile « Chute du ciel » V1
- **Demande** : permettre à l'auteur de créer « Chute de pierre » avec un projectile descendant du ciel sur la cible, au lieu d'un trajet lanceur→cible, personnalisable dans l'éditeur.
- **Base publique** : `gh-pages` `0a8eb1669cc8a9915acd79bf0099a99361ee2f64` (CI + Pages SUCCESS). **Checkpoint départ** : `checkpoint/lab-start-skyfall-projectile-v1-2026-10-10`. **Branche** : `work/lab-skyfall-projectile-v1-2026-10-10`.
- **Owners** : `SkillPresentationBindingV10.visual.travel` pour `trajectoryMode: "skyfall"`, `fallHeightPx`, `fallOffsetXPx` ; Human Capture Editor écrit/lit les champs ; `CaptureSkillPresentationAssetsV2` transporte le binding au moteur FX ; `DomSkillFxRenderer` est propriétaire de la géométrie descendante. Aucun nouveau type de dégâts ou timer.
- **Périmètre** : nouveau contrat V10 + routeur versionné, `src/ui/capture-editor-human-v2.js`, HTML éditeur, `src/adapters/renderer/capture-skill-presentation-assets-v2.js`, `src/adapters/renderer/dom-skill-fx.js`, tests dédiés, présent journal et rapport.
- **Invariants** : skills historiques V1–V9, projectiles source→cible, beam, contact masque, timing runtime, impact, audio, multi-cibles et collision/clash restent inchangés. Pas de nouvelle fiche skill ni média automatiquement, aucune modification des 103 créatures, loadouts, `global-assets`, `main`, GenSrpG, Exploration.
- **Validation** : TDD RED→GREEN ; sauvegarde, normalisation, roundtrip de transfert, rendu descendant avec origine indépendante du lanceur, scale et animation inchangés, absence d'autotouch si cible indisponible, tests Node/Chromium, checkpoint SHA exact puis fast-forward Pages sous lease et CI sur version publiée. Validation visuelle Android séparée.

### Chute du ciel V1 — code et sentinelles
- RED `3c34d61597a51747cf25e946b160e059f7adc2ce` : test de mode vertical absent, échecs attendus avant implémentation.
- Contrat versionné V10 `src/contracts/skill-presentation-binding-v10.js` et routage strict V1–V9 conservé ; transport des métadonnées par le seul adaptateur de présentation ; géométrie dans `DomSkillFxRenderer` existant. Aucun changement aux règles, au contact natif, ni à l'horloge.
- Éditeur Capture : sélecteur classique/chute, hauteur 1–1400 px, décalage -700…+700 px, nouveau skill/réédition/import et export préservant les réglages. Pas de skill ou sprite « Chute de pierre » injecté à la place de la création auteur.
- Nouveau test `tests/unit/capture-skyfall-projectile-v1.test.mjs` : validation V10, aller-retour JSON, asset projection, trajectoire verticale vs classique, vrai constructeur `buildHumanSkillDraftV1` puis rechargement `humanSkillEditorFieldsFromDraftV1`, sentinelles UI.
- Première CI complète GREEN au SHA `aa9949e8da76552d197f31f50d27363c2c07bc8d`, run `38075658453` SUCCESS (Foundation + deux suites navigateurs). Rapport `docs/LAB_SKYFALL_PROJECTILE_V1.md`.
- Validation finale : CI sur SHA documentaire exact, checkpoint GREEN, fast-forward `gh-pages` sous lease, CI et Pages SUCCESS sur SHA publié ; essai tactile Android utilisateur distinct.

## 2026-10-10 — Impact rocheux auteur Skyfall : remplacement et retrait de doublon

- **Demande** : intégrer l'export exact `cap_earth_atk_4` (nom auteur « Impact rocheux », présentation V10 `skyfall`), en remplacement de la capacité native historique de même ID, et supprimer le doublon distinct `lib_rock_slam` de la bibliothèque active.
- **Base publiée** : `gh-pages` `6eb8738caa5f5bb5976582a7f6d52b8e3120ca51`, CI `38075813249` SUCCESS, Pages `38075812466` SUCCESS.
- **Checkpoint de départ** : `checkpoint/lab-start-impact-rocheux-author-replace-retire-2026-10-10`. **Branche de travail** : `work/lab-impact-rocheux-author-replace-retire-2026-10-10`.
- **Autorités** : export utilisateur `cap_earth_atk_4` comme unique preset vitrine par ID dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, remplacé depuis `configuredSkills` ; retrait natif explicite de `lib_rock_slam` à l'hydratation, sans altérer le catalogue historique de provenance.
- **Collision confirmée** : les deux ID historiques ont exactement le nom « Impact rocheux » ; le doublon `lib_rock_slam` est référencé par `crea_mossback`/Moussados et `crea_rockhorn`/Rocorne. Le retrait nécessite suppression ciblée des seules références à cet ID des données d'espèces, et du skillId + slot équipé dans la vitrine Moussados, sans inventer une capacité de remplacement.
- **Périmètre** : preset JSON auteur + registre, politique de retrait active dans le même registre, initialisation unique `src/ui/capture-editor-human-v2.js`, références historiques ciblées dans `data/capture/monster-capture-creatures.v1.json` et vitrine Moussados, tests correspondants, présent journal et rapport dédié.
- **Protégés** : toutes les autres capacités/skills, toutes les autres créatures et leurs loadouts, moteur Rules/FX/renderer, `global-assets`, `main`, GenSrpG principal, Exploration ; identifiants et valeurs de l'auteur strictement inchangés, même si la description export mentionne toujours « niveau 16 » alors que `requiredLevel=10`.
- **Plan RED/GREEN** : tests de fidélité du transfert V10 et champs auteur, remplacement ID sans doublon, refus d'entrée active `lib_rock_slam`, absence de références équipées orphelines, vrai éditeur/loadout/combat, autres fiches conservées et roundtrip ; RED avant les modifications, CI Node/Chromium ; checkpoint GREEN exact, promotion fast-forward sous lease seulement après CI SUCCESS, Pages SUCCESS ; essai tactile Android utilisateur distinct.

### Impact rocheux — intégration réalisée, contrôle final
- RED `2c553556a98de0588bd8eda8722ae1a994a8bb1b` / CI `38080185765` FAILURE attendu : aucun preset auteur, aucune déclaration de retraite.
- Preset utilisateur exact de 4834 caractères placé sans modification dans `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json`. Enregistré **une seule fois** dans l'unique registre de vitrine, et remplacé par ID via le chemin de transfert existant ; aucun nouvel ID.
- Retraite explicite de `lib_rock_slam` uniquement de l'hydratation native vers `configuredSkills` ; catalogue historique utilisé comme provenance conservé. Les références obsolètes sont supprimées seulement de Moussados et Rocorne (données d'espèces), et Moussados perd son ancien slot-4 sans auto-équiper un autre sort.
- Contrôle de présence physique `global-assets` pour les quatre médias de l'export : PASS.
- Nouveau test RED/CI puis correction de l'oubli `statRegistry` dans le test ; sur commit `4b3279ec49fff18b81c0c348feddd4c610ef1055` : Laboratory CI `38080310397` **SUCCESS**, Foundation + Firestorm navigateur + Creature Library navigateur.
- Rapport `docs/LAB_IMPACT_ROCHEUX_AUTHOR_REPLACE_RETIRE_V1.md`. Étape finale : rerun CI après documentation sur SHA exact, checkpoint GREEN et promotion Pages sans force, CI et Pages publics ; validation tactile Android distincte.

## 2026-10-10 — Raccord bibliothèque Capture : sprites roche skyfall / impact (lot isolé)

- Source visuelle officielle : `global-assets` SHA `268fa5fb09d09ad9f361792e66814f70a13e3310`, CI du work source `38080565947` SUCCESS, checkpoint `checkpoint/global-assets-rock-skyfall-dual-vfx-v1-green-2026-10-10`. Deux IDs disponibles : `pack:capture:sprite-falling-rock-skyfall-01` (travel 20f) et `pack:capture:sprite-rock-impact-upward-01` (impact 16f).
- Base labo exacte : `gh-pages` `651a884677b8cea902ed512d0834ebe796074e7d`. Checkpoint de départ `checkpoint/lab-start-rock-skyfall-assets-refresh-v1-2026-10-10`. Branche `work/lab-rock-skyfall-assets-refresh-v1-2026-10-10`.
- Propriétaire : bibliothèque visuelle préexistante `GLOBAL_VISUAL_LIBRARY` (branche et catalogue immuables) ; seul le cache-buster `src/assets/global-visual-library.js` change. Aucun nouvel asset resolver, aucune nouvelle UI ni nouvelle mécanique de projectile.
- Périmètre autorisé : mise à jour de `GLOBAL_VISUAL_LIBRARY.revision`, tests sentinelles adéquats, présent journal, rapport. Ne jamais affecter de force les deux sprites à `cap_earth_atk_4` ou à une autre compétence, puisque l'assetId est choisi par l'auteur dans son presentation binding existant.
- Protégés : `main`, `global-assets` après publication, moteur skyfall V10, renderer, 103 créatures, tous les presets/skills et loadouts, sons/FX, soins, Jet Beam, Zombicide-40k, Exploration et branches parallèles.
- Validation : catalogue/URLs des deux nouveaux IDs, maintient de l'ancien catalogue et du cache, CI Node + vrai Chromium sur SHA final, checkpoint GREEN, publication `gh-pages` fast-forward avec lease, CI Pages et contrôle utilisateur Android à part.

## 2026-10-10 — Moussados + Impact rocheux (exports auteur) et opacité visuelle de l'impact

- **Mission** : remplacement fidèle des exports fournis de `crea_mossback` et `cap_earth_atk_4` dans les presets de la vitrine Capture et ajout d'un contrôle d'opacité (%) sur les sprites d'impact, indépendant des dégâts.
- **Base** : `gh-pages` `148bb7ff29ae8911cb585c398ca83bc058799d12` ; checkpoint exact `checkpoint/lab-start-impact-opacity-mossback-author-refresh-2026-10-10` ; travail `work/lab-impact-opacity-mossback-author-refresh-2026-10-10`.
- **Source auteur** : fichiers joints `gensrpg-capture-creature-crea_mossback.json` (ID `crea_mossback`) et `gensrpg-capture-skill-cap_earth_atk_4(1).json` (ID `cap_earth_atk_4`). Leurs valeurs de gameplay, IDs, niveaux, stats, sons, slots, FX et texte restent strictement inchangés.
- **Diff de la créature** : ajout `approachTimeModifierPct=25`, `cap_earth_atk_2` et `cap_earth_atk_4` dans skillIds, son de déplacement auteur, loadout slot1/2/3 auteur et ultimate nul. **Diff de la compétence** : sprites chute du ciel / impact montant, impact scale1, offsetY -25, durée visuelle 750ms, deux sons ; dégâts et timing du combat conservés.
- **Propriétaires** : `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json` + `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json` restent les uniques transferts d'auteur ; le composant UI `src/ui/capture-editor-sprite-controls-v1.js` est le seul propriétaire de lecture/écriture du champ `impactOpacityPct` et `examples/dom-demo/capture-editor-v2.html` en propose le champ. Le contrat `SkillPresentationBindingV10.visual.impact.opacity` et `CaptureSkillPresentationAssetsV2` existent déjà, aucun nouveau moteur.
- **Autorisés** : ces deux JSON de vitrine, ces deux fichiers de UI, tests stricts existants Moussados/Impact rocheux, nouveau test roundtrip opacité et fidélité auteur, présent journal et rapport de chantier. Aucun changement sur catalogue assets, `main`, `global-assets`, autre compétence, Combat Rules/FX, moteur skyfall, bibliothèque créatures historique, exploration, GenSrpG principal.
- **Tests** : sentinelles RED auteur/opacité avant implémentation, validité des deux transferts, sauvegarde/relecture du champ 0..100, valeurs 0/35/100, validation hors limites, conservation renderer `opacity`, aller-retour exact des exports et autres réglages ; tests unitaires et navigateur Chromium CI sur SHA documentaire final. Checkpoint GREEN et publication `gh-pages` seulement après CI SUCCESS, fast-forward avec lease, puis CI + Pages publics. Inspection Android utilisateur séparée.

## 2026-10-10 — Statut de compétence : modification temporaire de la régénération d'énergie

- Demande : permettre d'appliquer un buff/debuff temporaire à la **régénération d'énergie en combat**, sans modifier les options de base pré-combat. Aucun nouveau sort/preset imposé ; le créateur compose ses capacités via l'unique éditeur des effets tactiques.
- Base immuable `gh-pages` : `dbdb5fd08b03c9e89df777582bf6d1c2176bb974`, checkpoint `checkpoint/lab-start-energy-regen-status-v1-2026-10-10`, travail `work/lab-energy-regen-status-v1-2026-10-10`.
- Contrat additionnel : `StatusEffectV1.kind="energy_regen_modifier"`, propriété `modifierPct` finie et signée ; +100 double l'énergie récupérée *par tick*, −50 la réduit de moitié. Clamp final à 0 pour les malus <= −100 %, pas de modification du nombre de ticks, de l'énergie maximale ni du réglage de base.
- Propriétés existantes réutilisées : polarité, durée en ms, stacking, refresh/replace, cleanse/dispel, visuels des statuts, zones `apply_status`, export/import des compétences.
- Propriétaires : `src/contracts/status-effect-v1.js`, `src/core/combat/combat-timing.js` (calcul par timestamp), `src/core/combat/combat-state.js` (projection des gains), `src/core/combat/combat-session.js` (ordre tick/status expirés), `src/ui/capture-editor-human-v2.js` (formulaire/transformations uniquement), tests dédiés, ce journal et rapport.
- Frontières protégées : `main`, `global-assets`, trois domaines hors labo, skills/presets et créatures auteur, Combat Rules dégâts, chrono skill, autres statuts et tous les catalogues historiques. Aucune dépendance GenSrpG principal, aucun second moteur de régénération, aucun effet automatique sur tous les skills.
- Tests TDD RED avant implementation : contrat/validation, buff et malus, progress ticks exacts même si durée expire dans un gros pas, zéro énergie, saturation, refresh/stack/dispel, conversion UI/skill transfer roundtrip, ciblage allié/soi et regression baseline ; CI foundation+Chromium sur SHA final ; checkpoint GREEN puis fast-forward lease vers `gh-pages` et Pages CI. Validation tactile Android séparée.

## 2026-10-11 — Statut temporaire de vitesse de recharge des compétences

- Demande utilisateur : comme le buff de régénération d'énergie, ajouter aux compétences un buff/debuff temporaire qui accélère/ralentit la récupération des **cooldowns de compétences**, notamment celles déjà en recharge, avec durée, cible, stacking, nettoyage/dissipation. Ne pas confondre avec le système distinct de charges d'esquive ou d'action rechargeable.
- Base `gh-pages` : `cbaddef299344afb6decb74562cba329a3bcf45d` ; checkpoint `checkpoint/lab-start-skill-cooldown-regen-status-v1-2026-10-11` ; travail `work/lab-skill-cooldown-regen-status-v1-2026-10-11`.
- Sémantique proposée : `StatusEffectV1.kind="skill_cooldown_rate_modifier"` et `modifierPct` signé : +100 % fait progresser une recharge 2x plus vite pendant le buff, −50 % à 0,5x ; ≤−100 % pause le cooldown (sans l'allonger artificiellement) ; 0 % inchangé. À expiration retour à la vitesse normale, en préservant le progrès gagné. Une capacité prête reste prête. Aucun changement permanent au `cooldownMs` authoré, coût énergie, dégâts, usages, charges ou autre règle.
- Autorité : `src/core/combat/combat-state.js` unique propriétaire du stockage `fighter.skillCooldowns` (deadline) et de l'avancement ; `src/core/combat/combat-session.js` garantit les expirations à l'intérieur de pas de temps ; `src/contracts/status-effect-v1.js` contrat ; `src/ui/capture-editor-human-v2.js` conversion et widgets buff/zone existants. Aucun second état de cooldown ni timer parallèle.
- Périmètre : ces quatre fichiers, tests RED/GREEN ciblés cooldown, status, UI/transfert, tests navigateur et documentation. Protection : pas de modification de `main`, `global-assets`, fichiers auteur, bibliothèques créatures, moteur de visuels/FX, règles de dommages/énergie, GenSrpG principal, labo Exploration.
- Critères : baseline inchangée ; buff pendant cooldown déjà engagé ; activation/debuff/expiration au milieu d'un grand pas; split vs gros pas; stack/refresh/cleanse; plusieurs compétences; clamps et pas de délai négatif; self/alliés/zone; roundtrip; UI affichage du cooldown; CI complète et deux Chrome smoke, checkpoint GREEN, publication `gh-pages` lease, CI+Pages publics, tactile Android séparé.

## 2026-10-11 — Import auteur « Charge tellurique » dans la bibliothèque active Capture

- **Demande** : insérer l'export utilisateur `gensrpg-capture-skill-cap_earth_atk_3.json` dans le laboratoire Capture avec remplacement ciblé de l'ID `cap_earth_atk_3`, sans doublon, sans modifier les données de compétence de l'auteur.
- **Base** : `gh-pages` `b367aeb87f325d6c457d8dd9b3b23ffbee699428` (CI + Pages SUCCESS). Checkpoint départ `checkpoint/lab-start-charge-tellurique-author-v1-2026-10-11`. Branche isolée `work/lab-charge-tellurique-author-v1-2026-10-11`. Aucune interférence avec le lot vitesse de cooldown désormais publié.
- **Autorités** : transfert canonique `data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json` et unique registre de vitrine `src/catalogs/capture-showcase-skill-presets-v1.js`. Hydratation par l'import `CaptureTransferV1` existant avec remplacement par ID, avant les créatures. Aucun autre catalogue de skill ni runtime dupliqué.
- **Fidélité auteur** : `Charge tellurique` niveau 15, catégorie buff/debuff, élément terre, aura, coût 3, préparation 2 s, cooldown 60 s, cible soi. Zone personnelle `short`, 30 s, tick 1 s, `persistAfterRecall: true`, `statusBehavior: while_inside`. Effet `energy_regen_modifier` +50 %, statut aura durée 3 s, stacking `stack` max1 ; visuels/alpha V9, champ `dodgeable` et autres réglages tels quels. Ne pas « corriger » le contenu authoré.
- **Assets** : `core:icon-skill-thorn-vines-01` et `pack:capture:sprite-cast-nature-01` vérifiés par ID dans l'unique catalogue `global-assets` ; aucun média ajouté/remplacé dans ce lot.
- **Périmètre autorisé** : nouveau JSON authoré inchangé, ligne unique de registre, tests de fidélité et de vrai chargement/roundtrip/Runtime, rapport dédié et présent journal. **Interdits** : `main`, `global-assets`, nouveaux assets, autre skill/creature, zones/status/Combat Rules, cooldown engine, Zombicide-40k, Exploration.
- **Tests / publication** : TDD sentinelle RED sur preset absent, import/export strict, unicité de l'ID historique et remplacement runtime dans editor, test de compétence réelle déclenchant le statut si possible, Node CI + navigateurs, checkpoint GREEN puis fast-forward sous lease de `gh-pages` seulement si CI SUCCESS ; Pages SUCCESS, essai visuel Android utilisateur séparé.

### Charge tellurique — implémentation et premier contrôle
- Source auteur `gensrpg-capture-skill-cap_earth_atk_3.json` conservée avec **égalité complète des données structurées** dans `data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json`.
- Un seul ajout dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, remplacement par ID historique via l'unique transfert d'éditeur ; aucune modification du runtime ou des autres capacités.
- Test dédié `tests/unit/capture-charge-tellurique-author-v1.test.mjs` : valeurs auteur, roundtrip, anti-doublon, remplacement sans perte et vraie activation de l'aura `energy_regen_modifier`.
- CI du code `48399a7ab3da6933ca016d9e579f77aff1508491` : run `38092200377` **SUCCESS** (foundation, Firestorm navigateur, bibliothèque créatures navigateur). Deux IDs de média existants et vérifiés ; **aucun média à livrer**.
- Rapport `docs/LAB_CHARGE_TELLURIQUE_AUTHOR_V1.md`. Recontrôle CI sur SHA documentaire final puis checkpoint GREEN et publication gh-pages ; validation visuelle Android reste utilisateur.


## 2026-10-11 — Descriptions HUD des statuts de récupération

- **Incident** : les cartes des statuts actifs n'affichent aucune ligne d'effet pour `energy_regen_modifier` et `skill_cooldown_rate_modifier`; un ID auteur auto-généré est affiché à la place d'un nom métier compréhensible.
- **Base exacte GREEN** : `gh-pages` `72576fc465e0d5cb819d9126e798b900c2998163` (Laboratory CI `38092349490` SUCCESS, Pages `38092348817` SUCCESS). Checkpoint départ `checkpoint/lab-start-status-recovery-descriptions-v1-2026-10-11`; branche `work/lab-status-recovery-descriptions-v1-2026-10-11`.
- **Owner unique** : `src/adapters/renderer/status-effect-info-v1.js` pour les textes des cartes HUD ; les contrats, durées, ticks et cooldowns du moteur restent intacts.
- **Périmètre** : ce module de projection, `tests/unit/status-info-card-v1.test.mjs`, présent journal, rapport. Tests RED puis GREEN sur les deux nouveaux kind, buff +, debuff −, pause à ≤−100 %, stacks, source auteur, ancien statut inchangé, affichage via même renderer. CI complète et navigateurs sur SHA final avant checkpoint GREEN, publication `gh-pages` seulement sous lease et CI SUCCESS. Android utilisateur reste distinct.
- **Protégés** : gameplay, Combat Runtime/State/Session/Timing, skill authorés, catalogue 103 créatures, sprites/FX, skyfall, burrow, `global-assets`, `main`, GenSrpG principal et Exploration.
- **Critère de fin** : descriptions françaises exactes, sans seconde source de calcul, sentinelles tests et CI green, preview reproductible. Le correctif gameplay projectile/souterrain fera un **lot distinct** depuis le dernier HEAD publié validé.


## 2026-10-11 — Esquive souterraine implicite des attaques de surface

- **Défaut observé** : une cible en phase de voyage `burrow` possède `presence=underground` mais les attaques offensives historiques sans `hitPresenceStates` la touchent ; ce champ null signifie actuellement « toute présence ». Les attaques explicitement `[surface]` esquivent correctement.
- **Base immuable** : `gh-pages` `bead0d0c70ed03dd5fe5f3dcf9cec916255ca1cf`, checkpoint `checkpoint/lab-start-burrow-implicit-surface-evasion-v1-2026-10-11`, branche `work/lab-burrow-implicit-surface-evasion-v1-2026-10-11`.
- **Autorité** : `CombatPresenceV1` décide uniquement la portée par présence, `ActionResolver` traduit un échec de portée en `evaded`. Seules les attaques `category=offensive` non configurées sont réputées toucher la surface, pas un acteur sous terre. Une compétence explicitement autorisée à atteindre `underground` conserve cette possibilité ; soin/soutien sans reach explicite inchangé ; autre état `airborne` inchangé.
- **Périmètre** : `src/core/combat/combat-presence-v1.js`, `src/core/combat/action-resolver.js`, test de vraie chaîne `tests/integration/combat-presence-reach-v1.test.mjs`, ce journal et rapport. Test RED en vrai Runtime, puis GREEN, CI foundation, navigateur et checkpoint sur SHA final. Publication Pages lease si CI verte et pas d'autre owner concurrent.
- **Protégés** : trajectoires/projectiles FX et leurs impacts, animations burrow, statut énergie/cooldown, toutes les compétences auteurs et `configuredSkills`, Combat Runtime/Session, autres esquives, dodge HUD, `main`, `global-assets`, GenSrpG et Exploration.
- **Critère** : projectile/attaque offensive sans restriction passe à `evaded` durant le burrow, au retour en surface touche normalement ; attaque anti-souterraine déclarée continue de toucher. Aucun changement hors phase underground. Les impacts skyfall/mouvements du cible nécessitent un lot dédié.


## 2026-10-11 — Projectile contre une cible en déplacement actif : esquive native

- **Incident** : `DomSkillFxRenderer` fige la destination du projectile `skyfall` au départ, mais `CombatRuntime` déclenche également la résolution à la durée nominale ; la résolution offensive autorise `hit` si l'acteur cible effectue un déplacement de compétence dont `evasion.incomingForms` ne contient pas `projectile`. Cela montre un impact/dégât « suiveur » malgré la position visuelle fixe du projectile.
- **Base GREEN** : `gh-pages` `58b07daaf8d71ec65bdecd30036384bc944230cf` ; départ `checkpoint/lab-start-moving-target-projectile-evasion-v1-2026-10-11` ; branche `work/lab-moving-target-projectile-evasion-v1-2026-10-11`.
- **Règle minimale** : durant le trajet d'une action de mouvement active (`ground`, `aerial`, `teleport`, `burrow`), un projectile offensif non doté d'une portée explicite `hitPresenceStates` doit rater plutôt que de valider un contact fantôme. Les attaques avec atteinte explicite, les compétences non-projectiles, une cible immobile, la fin du trajet et l'esquive aérienne/souterraine existantes sont préservées. Le gameplay reste autorité dans `ActionResolver` ; aucune lecture du DOM/FX dans le core.
- **Périmètre** : `src/core/combat/action-resolver.js`, tests d'intégration Runtime dans `tests/integration/combat-presence-reach-v1.test.mjs`, présent journal/rapport. TDD RED/GREEN, CI Node et vrais navigateurs, checkpoint final, fast-forward lease `gh-pages` puis CI Pages ; test Android utilisateur distinct.
- **Protection** : `main`, `global-assets`, `SkillPresentationBindingV10`, animation skyfall, contact opaque, collision/projectile clash, burrow, autres compétences, stats/status, assets historiques, GenSrpG et Exploration. Le contact *géométrique* d'un sprite qui bouge indépendamment des actions n'est pas suivi dans le Core par cette règle ; requiert contrat d'impact spatial distinct, non simulé dans cette modification.


## 2026-10-11 — Régression ciblage implicite soutien : unique allié disponible

- Signalement : Charge tellurique et compétences positives demandent encore une sélection manuelle malgré une seule cible de soutien possible.
- Base : gh-pages `37febdf150aa027f213124945637a4d46dc25387`, checkpoint `checkpoint/lab-start-single-support-target-ui-regression-v1-2026-10-11`, branche `work/lab-single-support-target-ui-regression-v1-2026-10-11`.
- Owner : `Combat UI` seul résout le clic implicite après `Combat Rules` ; `Combat Rules` reste propriétaire des cibles permises et de leur disponibilité. Si une seule cible est réellement admissible ET disponible, clic direct quel que soit le type de compétence ; plusieurs alliés possibles exigent une sélection.
- Autorisés : `src/ui/combat-2v2-test-ui.js`, `tests/unit/combat-implicit-single-target-ui-v1.test.mjs`, présent journal et rapport. Aucun changement sur les données auteur de Charge tellurique, le gameplay, les presets/103 créatures, la zone, les FX, global-assets, main, GenSrpG ni Exploration.
- TDD : reproduire RED les compétences mixtes soi+allié en 1v1 et dernier allié disponible en 2v2, et tester la vraie définition importée `cap_earth_atk_3` ; conserver le choix explicite quand deux alliés sont disponibles. CI complète avant checkpoint GREEN et publication sous lease, validation Android séparée.


## 2026-10-11 — Dernière image figée des zones persistantes

- Demande : l'option « Jouer une fois puis garder la dernière image » n'est disponible que dans l'éditeur de sprites de statuts ; le sprite de zone (aura) manque cette option bien que `applySpriteVisual` la supporte déjà.
- Base exacte `gh-pages` : `1720efbc90339962fd176e486ca43ba2c378265b`, checkpoint `checkpoint/lab-start-persistent-zone-hold-last-v1-2026-10-11`, branche `work/lab-persistent-zone-hold-last-v1-2026-10-11`.
- Propriétaires : `SkillPresentationBindingV1` valide le champ visuel aura (toutes versions V1..V10 passant par lui) ; `capture-editor-v2.html` offre seulement le choix ; `DomSkillFxRenderer` existant conserve la dernière frame jusqu'à la suppression native de zone. Aucune seconde animation ni timer.
- Fichiers autorisés : `src/contracts/skill-presentation-binding-v1.js`, `examples/dom-demo/capture-editor-v2.html`, `tests/unit/unified-sprite-controls-v1.test.mjs`, présent journal et rapport. Aucun changement de gameplay, statuts, vitesse, recettes de sprites, Charge tellurique auteur, 103 créatures, autres animations, `main`, `global-assets`, GenSrpG ou Exploration.
- TDD : test RED option UI et `visual.aura.playbackMode=hold-last` au vrai chemin éditeur->draft->export/import->resolver->renderer; test que le visuel reste figé après lecture mais est détruit avec la zone; autres sprites cast/impact restent stricts et zone loop/stretch inchangée. CI Node + Chrome avant GREEN, checkpoint et publication fast-forward sous lease; Android manuel séparé.


## 2026-10-11 — Exports auteur Charge tellurique / Moussados + coloration de statut personnalisable

- **Base GREEN exacte** : `gh-pages` `f0516248f7ff5c7ea2db8538b0bb336ef220eef0` (CI 38109758767 SUCCESS ; Pages 38109758751 SUCCESS).
- **Checkpoint départ** : `checkpoint/lab-start-author-refresh-model-tint-blink-v1-2026-10-11` ; **travail** : `work/lab-author-refresh-model-tint-blink-v1-2026-10-11`.
- **Données auteur immuables** : fichiers remis `gensrpg-capture-skill-cap_earth_atk_3(1).json` et `gensrpg-capture-creature-crea_mossback(1).json`. Remplacer respectivement `data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json` et `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json` **à l'identique** et par ID ; conserver coûts, zones, effets, apparences, compétences, quatre slots, statistiques et couleurs de l'auteur. Les owners actifs sont `configuredSkills` / `configuredCreatures` via le bootstrap existant, pas de fallback.
- **Raccord d'effet visuel protégé** : modèle existant `StatusVisualV3` (`src/contracts/skill-presentation-binding-v3.js`), adaptateur unique `src/adapters/renderer/capture-skill-presentation-assets-v2.js`, renderer `src/adapters/renderer/dom-status-fx.js`, unique éditeur `src/ui/capture-editor-human-v2.js`. Prévoir palette étendue avec noir + couleur hexadécimale libre, intensité existante ; clignotement optionnel avec période réglable et cycle de visibilité, possédé par l'instance de statut, sans autre timer, boucle ou source de vérité. Compatibilité totale des anciens statuts.
- **Fichiers autorisés** : les deux JSON ci-dessus, quatre propriétaires de tint/éditeur, tests dédiés TDD et tests anti-régression, ce journal, rapport. Ne toucher à aucun autre preset, catalogue ou asset, ni `global-assets`, `main`, autres laboratoires ou `Zombicide-40k`.
- **Tests avant publication** : RED : fidélité des deux transferts (incluant couleur #5fad47 et nouveau sprite prairie), roundtrip, nombre d'IDs, validations de couleur noire/autres HEX, période, activation/désactivation et conservation après export/import, projection côté joueur/adversaire, animation native une seule fois par instance sans fuite et suppression lors de la disparition, chemin réels des statuts ; GREEN : CI foundation + Chromium sur SHA final, checkpoint GREEN exact, fast-forward `gh-pages` avec lease puis CI/Pages. Validation artistique Android séparée.
- **Risques contrôlés** : un effet de statut répété `while_inside` ne doit pas recréer l'animation à chaque `sync`; éviter double moteur/coloration par couche concurrente ; n'ajouter aucune cadence globale ; ne pas modifier les statuts gameplay ni la régénération d'énergie. Les autres effets de coloration qui utiliseraient d'autres contrats ne seront pas migrés artificiellement.


## 2026-10-11 — Sélecteurs de canaux de résistance/éléments dynamiques

- **Incident** : dans l'éditeur, `Canal résistance` des stats personnalisées et du registre exige de taper manuellement `nature`, etc. Les effets de dégâts et dégâts différés emploient aussi du texte libre ou une liste figée. Risque de fautes d'identifiant et de perte d'éléments personnalisés.
- **Base GREEN exacte** : `gh-pages` `bffaad8964a3828d2695f7ad98fae29ac9e997c7`; checkpoint `checkpoint/lab-start-dynamic-element-channel-selects-v1-2026-10-11`, branche `work/lab-dynamic-element-channel-selects-v1-2026-10-11`.
- **Autorité** : les identifiants viennent du menu d'éléments Capture existant et du `CaptureStatRegistryV1` live ; le helper UI ne crée aucun second registre de gameplay. Les canaux `physical` et les IDs existants hors registre, déjà enregistrés dans des transferts auteur, restent sélectionnables sans perte. Une nouvelle stat personnalisée peut référencer son propre ID, même avant application au registre ; une fois ajoutée, ses canaux apparaissent partout où disponibles. Le choix ne modifie ni dégâts, ni résistances, ni règles d'éléments, ni exports, ni fiches sauvegardées.
- **Périmètre** : `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, un helper UI pur si nécessaire, tests de sélecteur dynamique / bootstrap / non-régression, ce journal et rapport. Aucun changement aux contrats et `src/core` ; aucune création de nouvel élément gameplay implicite ; jamais toucher `global-assets`, `main`, GenSrpG ou Exploration.
- **TDD** : reproduire la saisie brute, tester liste officielle feu/nature/éléments historiques, ajout de stat personnalisée et options dynamiques, null (aucun canal), préservation d'identifiant déjà importé et lecture fidèle, inclure zone / DoT / dégâts programmés ; CI foundation et Chromium, checkpoint final SHA exact, publication fast-forward `gh-pages` sous lease puis CI/Pages ; validation tactile Android distincte.
- **Risques** : une liste dérivée du registre uniquement ne doit pas faire disparaître les anciens IDs natifs ; pas de surcharge de `skillStatusChannel`, pas de reset d'effet déjà édité lorsque le registre change ; distinct de l'écran d'éléments/création de nouveaux types de jeu qui nécessitera un contrat métier dédié.


## 2026-10-11 — Séquence de secousses caméra pour Séisme

- **Base** : `gh-pages` `b6e267240bd02772458f9b7e2cc6a38f81135eff`; checkpoint `checkpoint/lab-start-camera-shake-sequences-v1-2026-10-11` ; travail `work/lab-camera-shake-sequences-v1-2026-10-11`.
- **Demande** : au lieu d'une unique secousse uniforme à l'impact, permettre de composer plusieurs secousses successives avec amplitude, durée et pause indépendantes, utilisables pour Séisme et toutes les capacités. Conserver intacte la forme historique `feedback.cameraShake={amplitudePx,durationMs}` des exports auteurs.
- **Autorités** : `SkillPresentationBindingV4` valide une éventuelle `cameraShake.sequence` sur la même structure de présentation (les versions supérieures héritent du contrat) ; `DomCameraFxRenderer` génère une *unique* timeline animée WAAPI depuis les impulsions, n'introduit ni minuteur ni autre autorité ; `DomSkillFxRenderer` délègue la séquence sans en recalculer le mouvement ; éditeur `capture-editor-human-v2.js` & HTML gèrent les champs uniquement.
- **Contrat proposé** : facultatif `sequence: [{pauseMs,amplitudePx,durationMs}, ...]` jusqu'à huit impulsions, pause 0..2500ms, amplitude >0..24px, durée 30..2000ms, durée cumulée <= 10000ms. Une séquence non vide surclasse les champs legacy `amplitudePx/durationMs` conservés pour compatibilité d'export. Les animations reviennent à (0,0), les pauses restent immobiles ; aucun effet sur la durée ou le résultat du combat.
- **Périmètre** : `src/contracts/skill-presentation-binding-v4.js`, `src/adapters/renderer/dom-camera-fx.js`, `src/adapters/renderer/dom-skill-fx.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, tests ciblés, ce journal et rapport. Protéger intégralement gameplay, FX des projectiles, statuts, sprites, sons, assets, `main`, `global-assets`, GenSrpG et Exploration ; ne changer aucun export auteur en place.
- **TDD & GREEN** : test RED de la séquence V9/V10 et rejets de schéma malformé, projection éditeur/roundtrip, une timeline WAAPI avec pauses et plusieurs amplitudes, délégué FX, annulation/remplacement et ancien shake inchangé ; CI foundation + Chromium, checkpoint GREEN, fast-forward sous lease et recontrôle Pages/CI. Android paysage manuel distinct, éviter séquences trop violentes.


## 2026-10-11 — Moussados : export auteur avec nouvel ultime sismique (en attente d'export de compétence)

- **Demande** : intégrer le fichier utilisateur `gensrpg-capture-creature-crea_mossback(2).json` en même temps que la capacité associée « secousse sismique » annoncée. Le fichier reçu est une **créature** dont l'ID stable est `crea_mossback`, avec l'ultime `cap_earth_atk_7` ; ce n'est pas le fichier de définition de la capacité.
- **Base** : `gh-pages` `9f417bcae843456c55a44b3547e834d055695acd`, checkpoint `checkpoint/lab-start-mossback-seismic-ultimate-export-v1-2026-10-11`, branche `work/lab-mossback-seismic-ultimate-export-v1-2026-10-11`.
- **Autorités** : `configuredCreatures` pour l'export de créature via `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1`, `configuredSkills` pour la future capacité par ID stable via l'import existant ; aucun mock/duplication.
- **État et blocage** : vérification du catalogue actif et des fichiers `data/capture/showcase` : aucun transfert de `cap_earth_atk_7` n'a été livré ni trouvé. L'export créature est préparé à l'identique, mais **pas de publication ni de checkpoint GREEN tant que la définition de `cap_earth_atk_7` n'est pas disponible et validée**. Si la deuxième pièce jointe arrive, l'intégrer sur cette même branche après lecture charte.
- **Périmètre autorisé** : `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json` (remplacement exact), un futur `data/capture/showcase/cap_earth_atk_7.capture-skill-transfer-v1.json` si et seulement si export utilisateur reçu, `src/catalogs/capture-showcase-skill-presets-v1.js`, tests de transfert/roundtrip/roster et de la nouvelle capacité, ce journal et rapport. Protéger les autres créatures, compétences, statuts, FX, animation sismique, `main`, `global-assets`, GenSrpG et Exploration.
- **Tests prévus** : id/compétence/loadout sans doublon, contenu auteur intact, import validé, `configuredSkills` retrouve `cap_earth_atk_7` pour le slot ultime, sentinelle 103 créatures, vraie chaîne éditeur et combat, Node + Chromium ; checkpoint GREEN exact + publication par lease uniquement après tous les tests. Validation utilisateur Android distincte.


## 2026-10-11 — Séisme : choix du moment de l'impact visuel et raccourci de séquence

- Base GREEN gh-pages : `d6efed13c3b900a093e299c44be36d3491011341`; checkpoint `checkpoint/lab-start-seismic-impact-visual-timing-v1-2026-10-11`; work `work/lab-seismic-impact-visual-timing-v1-2026-10-11`.
- Retour : le flash et le sprite d'impact apparaissent dès le début de la secousse ; souhait de les afficher **pendant** ou **après** les secousses. L'ajout manuel de chaque secousse manque d'ergonomie.
- Autorité : `feedback.cameraShake` reste le seul contrat des effets ; champ facultatif `impactVisualTiming` = `immediate` (défaut compatible), `during` (mi-temps des secousses), `after` (fin). Le renderer DOM anime une seule timeline caméra existante. Le sprite et le flash d'impact sont retardés via animations natives, **pas les dégâts, collisions ni événements** ; sprites / flash / particules/ fumée de feedback sont synchronisés autant que leur implémentation le permet. L'éditeur apporte un bouton de modèle de séquence sismique simple, sur les champs existants, aucun second contrat ni moteur.
- Périmètre : `src/contracts/skill-presentation-binding-v4.js`, `src/adapters/renderer/dom-skill-fx.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, tests ciblés et docs. Ne pas toucher aux exports auteur existants, aux autres effets, au Gameplay, à `Zombicide-40k`, Exploration, `main`, `global-assets`.
- Tests TDD : ancien contrat inchangé, options valides/invalides, timing d'impact sur une timeline séquentielle, aucun timer supplémentaire, durée gameplay inchangée, source sprite/flash, roundtrip éditeur, bibliothèque 103 créatures et smokes navigateur. CI+checkpoint GREEN exact avant publication, vérification GitHub Pages et Android manuel distincte.


## 2026-10-11 — Séisme : afficher les nombres et flash de dégâts au vrai impact visuel

- **Retour utilisateur** : même après avoir choisi « Après les secousses », le nombre de dégâts et le flash de dommage se jouent encore au début. Cause démontrée : `DomSkillFxRenderer` applique `impactVisualTiming` au sprite/flash d'impact ; les deux clients Combat consomment séparément `CombatRuntime.onHealthDelta` immédiatement pour le nombre flottant et la surbrillance de créature, sans prendre en compte ce décalage.
- **Base GREEN exacte** : `gh-pages` `2371dd736016b6a844ef64eb810197111e01d934`. Checkpoint `checkpoint/lab-start-seismic-damage-cue-sync-v1-2026-10-11`, travail `work/lab-seismic-damage-cue-sync-v1-2026-10-11`.
- **Autorités** : présentation `SkillPresentationBindingV4.feedback.cameraShake.impactVisualTiming` ; délai unique `impactVisualDelayForCameraShakeV1` ; `CombatRuntime` reste maître de l'application des PV. Un petit adaptateur de corrélation UI associe uniquement les événements directs `resolution.events[type=hit]` à l'actualisation `onHealthDelta` suivante par acteur, PV final et quantité réellement appliquée. Les variations de PV sans correspondance (DoT, HoT, zones, soins ou changements externes) restent immédiates.
- **Périmètre** : adaptateur renderer de délai de feedback, `src/adapters/renderer/dom-skill-fx.js`, `src/adapters/renderer/dom-damage-feedback.js`, les deux vrais clients `src/ui/combat-test-ui.js` et `src/ui/combat-2v2-test-ui.js`, tests dédiés et ce document. Aucun changement au core, à la valeur des PV, aux événements, à l'import/export de Séisme, à la bibliothèque, à `main`, `global-assets`, GenSrpG ou Exploration.
- **TDD et GREEN** : les nombres flottants et le flash du modèle démarrent lors de l'impact visuel au timing `during`/`after` ; cas legacy zéro inchangé ; multi-cibles, 1v1 et 2v2 ; ne jamais retarder un tick de dégâts de zone ni un soin ; une ancienne correspondance est effacée à chaque état du runtime ; annulation WAAPI et nettoyage. Fondation + deux smokes Chromium, checkpoint GREEN exact, publication sous lease et nouvelle CI/Pages. Validation artistique Android séparée.
- **Limite explicitée** : la jauge de PV et le KO dérivent toujours immédiatement de l'état autoritaire : aucun faux HP visuel ni retard des règles ; un véritable décalage des PV ou de l'animation de recul requiert un chantier de timeline de résolution séparé.


## Raccord Labo — icônes Capture V2 — 2026-10-11

- Base déploiement `gh-pages` : `51a53742209c8505b387271e729c89d0025dc487` ; checkpoint `checkpoint/lab-start-capture-skill-icons-v2-library-cache-2026-10-11`.
- Branche `work/lab-capture-skill-icons-v2-library-cache-2026-10-11`, périmètre uniquement cache catalogue `src/assets/global-visual-library.js`, test dédié et cette documentation.
- Asset owner inchangé : `global-assets` SHA GREEN `0c78b519588baa3535654beae6f185046beb3499`, huit icônes avec IDs stables et CI verte.
- Objectif : nouvelle révision `2026-10-11-v24-capture-skill-icons-v2` afin de recharger le catalogue pour la bibliothèque visuelle de l’éditeur ; aucune modification de `configuredSkills`, gameplay, FX Core ou renderer.
- Vérifications : URL propriétaire `global-assets`, 8 chemins de ressource, tests lab complets, checkpoint GREEN exact avant FF `gh-pages`.
- Risques : cache obsolète et concurrence de déploiement ; un seul resolver existant réutilisé, pas de seconde bibliothèque.


## 2026-10-11 — Remplacement de trois compétences auteur après Skill Icons V2

- **Base GREEN** : `gh-pages` `b5676ad01ec8352df2623b7c020ccf9f4c5d0a97` (CI `38133415589` et Pages `38133415460` réussies).
- **Checkpoint départ** : `checkpoint/lab-start-author-skill-triple-replace-v1-2026-10-11`; branche de travail unique `work/lab-author-skill-triple-replace-v1-2026-10-11`.
- **Dernier travail repris** : huit icônes Capture V2, propriétaire exclusif `global-assets` SHA `0c78b519588baa3535654beae6f185046beb3499`, cache éditeur V24 déjà publié ; ne pas recréer ni réinstaller les icônes.
- **Demande et source de vérité** : remplacer exactement trois transferts auteur `cap_earth_atk_7` / `cap_earth_atk_3` / `cap_fire_special_1` par les JSON de ce fil ; identifiants stables et entrée catalogue unique, aucune mutation des autres compétences ou des loadouts de créatures.
- **Fichiers permis** : les trois `data/capture/showcase/*.capture-skill-transfer-v1.json`, leurs tests d'intégrité / de raccord et tests hérités à empreinte ancienne, ce journal, rapport ciblé. Les contrats / FX / règles de combat / assets / UI / autres labs / `main` sont hors périmètre.
- **Validation requise** : test RED préalable ; SHA-256 octet exact auteur, import/export, catalogue `configuredSkills` par ID, Icônes disponibles, Charge tellurique tint clignotant 1,5 s, Cendre aveuglante, Séisme primordial et sa contrainte `damage_taken` ; tests foundation et smokes Chromium au commit final, checkpoint GREEN et fast-forward sous lease ; contrôle Pages et CI après publication, validation tactile Android distincte.
- **Points de vigilance** : ne pas remplacer l'icon `Morsure brûlante` par un asset à un nom plus logique : respecter le JSON reçu ; `Séisme primordial` conserve son shake simple de 50 px et ne demande pas automatiquement un timing d'impact différé ; éviter de masquer ce comportement.

## 2026-10-11 — Projectile direct / skyfall et icônes Cendre / Morsure

- **Problème utilisateur** : une Boule de feu directe est esquivée par un simple déplacement depuis le lot moving-target-projectile-evasion ; les deux icônes de compétences sont mal associées.
- **Base GREEN** : gh-pages `026cd22a2c0021c2de10f624f941cc36ad430ba5`, CI et Pages SUCCESS ; checkpoint de départ `checkpoint/lab-start-projectile-direct-skyfall-icons-v1-2026-10-11`, branche `work/lab-projectile-direct-skyfall-icons-v1-2026-10-11`.
- **Test RED** : `8653ab433e47d0633ab8c886b10fe14af2fd1183`, exige projectile direct touchant une cible en mouvement ground, skyfall la ratant, contrat rejetant un type inconnu et icônes conformes.
- **Propriétaires** : `SkillDefinition.projectileTargeting` est une donnée de gameplay sémantique (par défaut direct, fixed_point si visuel skyfall) ; adaptateur Capture projette le mode au franchissement de frontière ; `ActionResolver` décide seul le hit/evaded. Pas de lecture du DOM, d'images ni de FX dans le Core.
- **Correction d'auteur EXPRESSÉMENT DEMANDÉE** : `cap_fire_special_1` Cendre aveuglante -> `pack:capture:icon-skill-blinding-ash-01`, et `lib_flame_bite` Morsure brûlante -> `pack:capture:icon-skill-burning-bite-01`. Les autres octets de leurs exports (stats, effets, sons et visuels) restent intacts, ID unique, pas de rechargement depuis legacy.
- **Périmètre** : `src/contracts/skill-definition.js`, `src/core/combat/action-resolver.js`, deux adaptateurs Capture, deux JSON auteur, tests sentinelles existants et nouveaux, ce journal/rapport. Protégés : `global-assets`, `main`, les 103 créatures, autres compétences, FX, timeline, explicit dodge, présence et burrow, GenSrpG et Exploration.
- **Critères** : tests Node/integration et navigateur, CI SUCCESS au SHA final, puis checkpoint GREEN exact ; publication gh-pages uniquement fast-forward sous lease ; validation paysage Android distincte.

## 2026-10-11 — Cendre aveuglante : publication de la réparation WebP via cache

- **Retour utilisateur** : l'icône Cendre aveuglante s'affiche anormalement en jeu ; vrai diagnostic dans `global-assets` (WebP tronqué d'un octet).
- **Base GREEN labo** : `gh-pages` `0f356996578ff92fce75a2c48f762449bc90a1bb` ; **base owner asset corrigée** `global-assets` `b24364147c5392a79b1eac9b1286fa11e4cd84a5` (CI `38137772675` SUCCESS ; checkpoint `checkpoint/lab-blinding-ash-webp-repair-v1-green-2026-10-11`).
- **Checkpoint de départ** : `checkpoint/lab-start-blinding-ash-webp-cache-v1-2026-10-11` ; branche `work/lab-blinding-ash-webp-cache-v1-2026-10-11`.
- **Owner unique** : `src/assets/global-visual-library.js`, révision d'URL de l'unique resolver; les octets binaires restent uniquement sur `global-assets`.
- **Périmètre** : le cache-buster `2026-10-11-v24-capture-skill-icons-v2` -> `2026-10-11-v25-blinding-ash-webp-repair`, test sentinelle et documentation ; aucun transfert, icon ID, catalogue, Combat Core, FX ou UI modifiés.
- **Protégés** : 103 créatures, règles de ciblage et projectile, fichiers de compétences, autres médias, `main`, GenSrpG, Exploration.
- **TDD et sortie** : CI RED attendue sur la nouvelle révision, correction minimale, CI foundation + Chromium réel, checkpoint GREEN exact et fast-forward `gh-pages` sous lease ; GitHub Pages doit réussir. Validation Android reste requise pour le rendu.

### Cendre aveuglante WebP — résolution de cache

- Fichier unique réparé et publié sur `global-assets` SHA `b24364147c5392a79b1eac9b1286fa11e4cd84a5` ; CI `38137772675` SUCCESS.
- RED cache `38137867989` FAILURE attendue ; mise à jour minimale `fcb0e7be876eb7670078f1bf12c8760825ea9a01` ; CI `38137905665` SUCCESS (foundation + deux tests navigateur).
- Révision canonique `2026-10-11-v25-blinding-ash-webp-repair`; assetId et catalogue inchangés.
- Rapport : `docs/LAB_BLINDING_ASH_WEBP_CACHE_V1.md`.
- Fin : CI du SHA documentaire, checkpoint GREEN, FF `gh-pages`, Pages SUCCESS ; retour utilisateur Android pour validation réelle.

## 2026-10-11 — Cendre aveuglante : cache de l'icône restaurée depuis sa source

- **Retour utilisateur** : l'icône reste endommagée après réparation du terminal RIFF. Nouveau WebP 128×128 réellement réencodé depuis le PNG original et publié par le seul propriétaire `global-assets` (SHA `18b0673a17c12ba9f80f7ff539bb58b4ee20af01`, CI `38140035474` SUCCESS, checkpoint `checkpoint/lab-blinding-ash-source-restore-v1-green-2026-10-11`).
- **Base exacte** : `gh-pages` `61d09fa488002d4a6c49823939e7daec0bac16e3`, checkpoint `checkpoint/lab-start-blinding-ash-source-restore-cache-v1-2026-10-11`, travail `work/lab-blinding-ash-source-restore-cache-v1-2026-10-11`.
- **Autorité** : l'unique `src/assets/global-visual-library.js` doit rafraîchir l'URL du média sans nouveau resolver, sans import d'assets en dur et sans changer l'asset ID `pack:capture:icon-skill-blinding-ash-01`.
- **Périmètre** : la constante de révision globale `REVISION` (`v25` -> `2026-10-11-v26-blinding-ash-source-restore`), sa sentinelle dans `tests/unit/capture-skill-icons-global-library-v2.test.mjs`, ce journal et un rapport dédié. Aucun changement aux autres fichiers n'est autorisé.
- **Protégés** : le catalogue actif, les 103 créatures, les compétences et exports, combat/FX, les 129 autres médias, `global-assets` dans ce lot, `main`, `Zombicide-40k`, Exploration.
- **Test RED / GREEN** : rendre la sentinelle RED sur v25, corriger la révision unique, vérifier Node + deux smokes Chromium du vrai éditeur 103 créatures, CI au SHA documentaire final, checkpoint exact GREEN, FF `gh-pages` sous lease et GitHub Pages SUCCESS.
- **Risque / validation** : cache navigateur et cache raw.githubusercontent.com distincts ; ne pas déclarer l'apparence mobile corrigée sans nouveau test Android utilisateur.

## 2026-10-11 — Impact rocheux : valeurs FX de test demandées explicitement

- **Retour utilisateur** : `Impact rocheux` présente une traînée/glow visuellement décalée ; après inspection, demande expresse de **placer les valeurs conseillées pour un test manuel**.
- **Autorité** : capacité auteur `cap_earth_atk_4` via le seul transfert `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json`, ensuite `configuredSkills` ; aucun second preset ni compensation dans le renderer.
- **Base live exacte** : `gh-pages` `38bceb6db26141f17a9da614d3df55e9eea4be9a` (CI/Pages GREEN) ; checkpoint `checkpoint/lab-start-rock-impact-fx-settings-v1-2026-10-11` ; branche `work/lab-rock-impact-fx-settings-v1-2026-10-11`.
- **Six champs autorisés** : `feedback.projectileTrail.sizePx: 120 → 8`, `lengthPx: 120 → 50`, `count: 8 → 6`, `anchorY: 0.5 → 0.4`, `feedback.cameraShake.amplitudePx: 600 → 5`, `feedback.aftermathSmoke.sizePx: 120 → 35`. `anchorX=0.5` et `visual.travel.fallHeightPx=650` sont conservés, ainsi que les 100 % autres champs, ids et identités.
- **Frontières protégées** : Combat Runtime/Rules, skyfall et renderer, animations, icônes/sprites/sons, catalogues, les 103 créatures et autres skills, `global-assets`, `main`, `Zombicide-40k`, Exploration.
- **Plan TDD** : test RED sur les six réglages et invariants de la fiche (ID unique au catalogue, normalisation + aller/retour export/import, aucun changement aux autres champs) ; modification chirurgicale des octets du JSON auteur ; Node CI + smokes Chromium, checkpoint GREEN au SHA final puis fast-forward `gh-pages` sous contrôle de SHA ; validation du rendu Android réservée à l'utilisateur.
- **Risque connu** : ces valeurs sont un diagnostic visuel et ne prouvent pas l'absence d'un problème d'ancrage du moteur skyfall ; **ne pas** corriger le renderer dans ce lot.

### Résolution des valeurs FX Impact rocheux

- Source active mise à jour au commit `5a717cee7122a46f2b9fa1004b2e26f971df2626` : seulement six nombres de présentation, sans évolution de contrat ni renderer.
- Nouvelle sentinelle : vérifie toutes les valeurs souhaitées, le transit import/export, la trajectoire skyfall et la conservation octet par octet de l'ancienne source après inversion exacte des six nombres (SHA Git `8da9dceb1396fc428f39fddab6cddd23a957f906`).
- CI `38146871900` a relevé deux assertions historiques obsolètes/mal placées. L'ancienne sentinelle exigée par l'export précédent (`600 px`) est actualisée pour respecter **l'autorisation expresse** ; le test sémantique de cible est fait sur le transfert brut avant normalisation.
- CI `38147064678` **SUCCESS** pour foundation + deux smokes Chromium ; les compétences et créatures non ciblées restent inchangées.
- Rapport : `docs/LAB_ROCK_IMPACT_FX_TEST_VALUES_V1.md`. Après documentation finale CI exacte, checkpoint GREEN + FF `gh-pages` + Pages ; Android non validé tant que l'utilisateur n'a pas essayé.

## 2026-10-11 — Remplacement des deux exports auteur Impact rocheux / Moussados

- **Demande utilisateur** : deux exports fournis à la suite du test réussi des six valeurs FX d'Impact rocheux. Replacer **exactement** `gensrpg-capture-skill-cap_earth_atk_4.json` et `gensrpg-capture-creature-crea_mossback.json`, sans réinterprétation ni modification de moteurs.
- **Source de vérité** : deux fichiers JSON joints à la conversation, bytes SHA256 respectivement `67554e742c0045b882bbfe6053cd4d5dfb93e1bb2855ea4b13eb0f68d2632bb9` (skill, 5179 bytes) et `1c9ec63d0b5ff99e67cb228039a3bd7420fefc27e7eccc5078a401124027fa3e` (creature, 5311 bytes). Identifiants stables `cap_earth_atk_4` / `crea_mossback`.
- **Base source** : `gh-pages` `f47bd97cb84e358075a1bdf372b94c880fe2fa5c`, checkpoint `checkpoint/lab-start-rock-mossback-author-replace-v1-2026-10-11`, branche `work/lab-rock-mossback-author-replace-v1-2026-10-11`. Aucun autre chantier actif trouvé sur ces deux ID à ce HEAD.
- **Écarts exacts** : Impact rocheux : ajout explicite `definition.projectileTargeting: "direct"` malgré son visuel `skyfall` ; `impact.displayScale: 1→1.7`, `offsetY: -25→0`, `opacity: 1→0.7`. Les six nouveaux réglages FX validés avant le présent lot et la hauteur de chute 650 sont maintenus. Moussados : ajout de `presentation.viewOverrides` (joueur scale 1.7 position 0/0, adversaire scale 1.2 position -30/+35), tout le reste identique.
- **Contrat charte 33** : la valeur `projectileTargeting: direct` est écrite par l'éditeur et doit rester exacte. Risque : une cible en mouvement peut ne plus éviter le projectile `skyfall` puisque `direct` s'impose au fallback `fixed_point`. Ne pas corriger silencieusement le JSON ou le moteur ; rendre ce risque explicite au rapport et tester la donnée réelle.
- **Périmètre** : les deux transferts `data/capture/showcase/`, tests sentinelles portant sur ces ID, test d'égalité SHA/roundtrip, ce journal et un rapport dédié. Aucun autre JSON, aucune créature ni capacité du catalogue, aucun asset, aucun moteur, `main`, `global-assets`, GenSrpG principal ou Exploration.
- **Sortie** : TDD RED sur les deux exports, remplacement par identifiant via les mêmes propriétaires `configuredSkills` / `configuredCreatures`, vérifications registres, sockets, positions, stats, résistances, loadout et Combat non perturbés ; CI foundation + deux Chromium, checkpoint GREEN exact, publication FF sous lease, CI/Pages post-deploiement. Validation Android utilisateur distincte.

- **Addendum de l'utilisateur avant publication** : ne pas conserver `projectileTargeting: direct` pour un visuel `skyfall` ; restaurer le ciblage approprié `fixed_point`. L'utilisateur n'a pas explicitement choisi `direct` dans les réglages.
- **Cause vérifiée** : `normalizeSkillDefinition` insère `projectileTargeting: direct` par défaut, et `buildHumanSkillDraftV1` ne le renseigne jamais d'après la trajectoire `skyfall`. Le normaliseur insère donc `direct` dans l'export utilisateur sans interaction dédiée, court-circuitant le fallback existant de l'adaptateur Capture. **Correction du propriétaire d'export** dans `buildHumanSkillDraftV1` : définir `fixed_point` pour projectile skyfall, `direct` pour les autres trajectoires. Pas de modification Core/renderer.
- **Exception autorisée à l'export** : un seul remplacement `"projectileTargeting": "direct" → "fixed_point"` dans le JSON auteur skill fourni ; tous les autres octets sont conservés. SHA256 original `67554e742c0045b882bbfe6053cd4d5dfb93e1bb2855ea4b13eb0f68d2632bb9` (5179 octets), SHA256 avec exception `04c1330d6993bb0d5e90afd2c39d544944d2c8aa4b009cdbd075f18d4c4bed6b` (5184 octets). Moussados reste octet-exact à son export.
- **UX demande future** : presets accessibles/discrets vs avancés pour FX, à cadrer plus tard sans toucher à l'UI dans ce lot ciblé de correction.

- **Implémentation et vérification obtenues** : deux vrais exports remplacés sous les mêmes ID, correction `fixed_point` de l'export skyfall dans `buildHumanSkillDraftV1` et dans l'unique JSON impact ; vue adversaire Moussados `scale 1.2/x -30/y 35` maintenue. Tests actualisés pour opacité impact 70 %, identité SHA256 et statRegistry à l'export.
- **CI 38149017407 SUCCESS** au commit documentaire `f2bdce1f094c2d22f42ed486aeb79bf4753fe53e`, `foundation`, `firestorm-zone-growth-browser`, `creature-library-browser` tous SUCCESS.
- **Rapport** : `docs/LAB_ROCK_MOSSBACK_AUTHOR_REPLACE_V1.md`. Aucun changement aux assets ni aux autres compétences. Prochaines portes : CI au SHA de clôture, checkpoint GREEN exact, FF `gh-pages`, puis CI/Pages post-déploiement SUCCESS. Validation Android demeure distincte.

## 2026-10-11 — Ergonomie visuelle Capture : trois intensités simples non destructives

- **Demande utilisateur** : simplifier l'utilisation de Glow / traînées / fumée / secousses qui paraît obscure aux non-initiés, tout en conservant **tous** les réglages existants. Chantier UI dédié, sans changement de gameplay ni d'assets.
- **Base LIVE** : `gh-pages` `c2db87ff3fbe6363ec1dcadd6533d858f5b45b5c` ; départ `checkpoint/lab-start-capture-fx-quick-controls-v1-2026-10-11` ; branche `work/lab-capture-fx-quick-controls-v1-2026-10-11`. CI et GitHub Pages du HEAD initial SUCCESS.
- **Cause UX** : l'UI a déjà des préréglages Glow (`capture-fx-glow-presets-v1.js`) et particules (`capture-fx-particle-presets-v1.js`) mais leurs liens, les valeurs techniques et les effets `skyfall` ne sont pas évidents. **Ne pas** dupliquer les valeurs de particules ou introduire de second propriétaire.
- **Implémentation bornée** : nouvel assistant « Rendu rapide » à trois intensités (Discret, Équilibré, Spectaculaire) qui **réemploie** les deux catalogues de préréglages V1 et attribue seulement une amplitude de secousse simple mesurée en px (2/5/9). Bouton explicite `Appliquer`; le simple choix affiche un aperçu indicatif et **ne change pas** la capacité. Il garde couleurs FX, ancrages, séquences de secousses, sprites, offsets, audio, stats, dégâts. L'état d'un preset chargé est « Réglages actuels » ; pas d'application tacite au chargement ni à la sélection d'une compétence. Conseils contextuels `skyfall / beam / linéaire`, et alerte pour particules/secousses disproportionnées (simple diagnostic non bloquant).
- **Conserver les outils experts** : 100 % des contrôles numériques sont maintenus dans la section avancée existante, avec explications en français et repères de taille lisibles. Aperçu simplifié annoncé clairement **indicatif** ; aperçu réel en combat par l'outil existant, sans prétendre à une simulation du rendu.
- **Propriétaire unique** : mise en forme et interactions sous `src/ui/capture-editor-human-v2.js`, valeurs regroupées dans un module UI pur `src/ui/capture-fx-quick-mode-v1.js` associant les deux catalogues actuels ; HTML unique `examples/dom-demo/capture-editor-v2.html`, CSS de l'exemple. Test TDD unit/DOM et CI Chromium réel.
- **Protégés** : `configuredSkills`, `configuredCreatures`, leurs JSON auteur (dont `cap_earth_atk_4`), 103 créatures, FX renderer, Combat Rules/Runtime, `global-assets`, `main`, `Zombicide-40k`, Exploration. TDD RED -> GREEN ; CI au SHA final, checkpoint exact, FF sous lease et Pages SUCCESS, validation Android distincte.

## 2026-10-11 — Fusion d'interface FX Capture : Style → Intensité → Personnalisation

- **Accord utilisateur** : regrouper les trois familles de préréglages déjà visibles dans un seul parcours, plutôt que deux sections présentées comme « Mode simple » concurrents.
- **Source LIVE** : `gh-pages` `1819aa821ec2519a4f6c519bddf31b4760e098db` (CI/Pages SUCCESS). Checkpoint départ `checkpoint/lab-start-capture-fx-unified-flow-v1-2026-10-11`; travail `work/lab-capture-fx-unified-flow-v1-2026-10-11`.
- **Propriétaire unique** : présentation dans `examples/dom-demo/capture-editor-v2.html`, classes UI dans `examples/dom-demo/demo.css`, interactions déjà raccordées dans `src/ui/capture-editor-human-v2.js`. Réutiliser les catalogues V1 de pack thématique, intensité glow, particules ; pas de duplicat ni nouveau moteur FX.
- **Parcours cible** : (1) « Style » = pack thématique pour donner une base aux compétences vides, sans remplacer les médias auteur d'une compétence existante ; (2) « Intensité » = Discret / Équilibré / Spectaculaire, aperçu indicatif + clic explicite ; (3) « Personnalisation » = anciens raccourcis Glow et Particules sous un panneau repliable, plus accès aux réglages avancés numériques conservés. Une seule section de parcours visible par défaut ; pas deux titres « Mode simple ».
- **Invariants** : les sélections ne modifient rien avant clic d'application, le rendu des presets écrits demeure sous les propriétaires existants, aucune mutation des JSON exports des 103 créatures ou des skills, import assets et test combat conservés. Si un pack est appliqué, l'étiquette d'intensité revient à « Réglages actuels » (comportement du propriétaire courant).
- **Livrables** : un lot HTML/CSS à structure UI minimaliste, aide des libellés/retours, test RED structure et interactions navigateur réel avec le modèle `cap_earth_atk_4` et la bibliothèque de 103 créatures ; documentation et CI foundation + deux Chromium sur SHA final ; checkpoint GREEN et fast-forward `gh-pages` sous lease seulement après tests.
- **Périmètre exclu** : FX Renderer, Combat Core, génération des presets/catalogues, profils audiovisuels, assets, les JSON auteur, autres dépôts, `main` et `global-assets`. Validation sur Android appartient à l'utilisateur.

### Résolution du parcours FX unifié

- Un seul panneau de guidage Style → Intensité → Personnaliser ; anciens raccourcis Glow et Particules déplacés sous détail repliable, même contrat et mêmes handlers.
- Seuls HTML/CSS/retours de statut UI et les tests de présentation changent ; aucune autre autorité touchée.
- RED `38157473496` FAILURE attendue ; tests historiques rendus compatibles avec le nouveau vocabulaire, sans suppression de sentinelles.
- CI `38157846259` **SUCCESS** sur le SHA technique `914541311a8fac747f06f8eba5d3f86a559dd911` : Foundation + 2 navigations Chromium GREEN ; test de l'ordre des étapes et des effets non destructifs, 103 créatures inchangées.
- Rapport `docs/LAB_CAPTURE_FX_UNIFIED_FLOW_V1.md`. Sortie : CI SHA documentaire, checkpoint GREEN identique, publication FF sous SHA lease et vérification Pages/CI. Contrôle d'ergonomie Android toujours nécessaire.


## 2026-10-11 — Raccord cache de la bibliothèque VFX Air (consommateur Labo Combat)

- Base LIVE `gh-pages` : `d093b4dd2b519bb6cc07dd3d9c424e4f575f8ee6` (CI `38158034825` SUCCESS, déploiement Pages `38158034091` SUCCESS).

- Checkpoint départ : `checkpoint/lab-start-capture-air-vfx-cache-v1-2026-10-11` ; branche : `work/lab-capture-air-vfx-cache-v1-2026-10-11`.

- Autorité médias : `global-assets` GREEN `8633466eae72e320a6cd1c017a8d8f1bc10afcf3` (4 sprites Air, 80 images, 4 atlases, 134 assets dont 73 sprites). Le consommateur ne devient pas propriétaire des fichiers.

- Objectif : actualiser uniquement la révision du cache de l'unique `GLOBAL_VISUAL_LIBRARY` `v26` -> `v27` pour exposer les quatre `assetId` dans l'éditeur. Test sentinelle de résolution d'URL par ID avec la vraie structure du catalogue, maintenue pure et utilisable depuis l'éditeur. Aucune attribution automatique de capacités.

- Fichiers autorisés : `src/assets/global-visual-library.js`, `tests/unit/capture-air-vfx-global-library-v1.test.mjs` (test uniquement) et ce journal; les tests historiques qui fixent une révision exacte ancienne pourront être révisés au minimum si la CI les désigne et l'addendum de périmètre le documente. Aucun autre fichier de production, aucune retouche aux médias ni au moteur.

- Protégés : `global-assets` (owner), `main`, `Zombicide-40k`, Exploration, Combat Rules, `configuredSkills`, `configuredCreatures`, FX/Render Core et les 103 créatures.

- Validation : sentinelles de bibliothèque et recherche catalogue, CI complète + Chromium sur SHA exact, checkpoint GREEN, publication FF sous lease `gh-pages`, Pages SUCCESS ; test manuel Android de l'affichage des nouveaux médias par l'utilisateur.

### Sentinelle historique à conserver pendant le changement de cache Air

Le test existant `tests/unit/capture-skill-icons-global-library-v2.test.mjs` impose encore l'ancienne chaîne exacte de révision `v26`, alors que le cache doit avancer à `v27`. Extension minime du périmètre à cette sentinelle : remplacer l'égalité globale d'une version historique par une vérification de révision datée >= v26, tout en conservant les contrôles des huit icônes et de leurs URLs. Le nouveau test Air vérifiera expressément v27 et la résolution des quatre médias via le resolver déjà existant. Aucun second chargeur ni modification du runtime.


## 2026-10-11 — Modèle auteur Ailevent / Capture

- Source exacte : export `gensrpg-capture-creature-crea_ailevent.json`, `capture-creature-transfer-v1`, SHA-256 `25b6d8a088a728651671c474c3503a59fdb34ddab6053668364622f2690f96ee` (5368 octets).
- Base `gh-pages` `4b583763923edc5b5c0ecec0ca89a2398993fea4`, checkpoint `checkpoint/lab-start-capture-ailevent-author-v1-2026-10-11`, branche `work/lab-capture-ailevent-author-v1-2026-10-11`.
- Owner unique : presets de showcase Capture via transfert existant, remplacement par ID `crea_ailevent` des 103 créatures canonisées ; aucun second catalogue ni mutation du gameplay.
- Fichiers autorisés : un JSON sous `data/capture/showcase/`, `src/catalogs/capture-showcase-creature-presets-v1.js`, tests source/contrat/startup, le présent journal et `docs/LAB_AILEVENT_AUTHOR_PRESET_V1.md`.
- Respect des valeurs source : 170 PV, 15 Air, 20 Vitesse, 10 Défense, résistances Terre +35/Électricité -50, sockets et poses, loadout de quatre compétences, évolution vers Rafalcor et audio auteur. Anciens `sourceStats` et résistances non cataloguées conservés, aucun moteur/statRegistry modifié.
- Interdits : `main`, `global-assets`, autres skills/créatures, Core/FX, son, visuels, `Zombicide-40k`, Exploration. Test RED `f7880becde0d113da24549e6d4f46be1d94e0285`; test exact SHA + import normalisé + 102→103 / 1 occurrence ID ; CI complète et Chromium requis avant GREEN/FF.
- Rapport : `docs/LAB_AILEVENT_AUTHOR_PRESET_V1.md`. Test visuel Android à demander après publication.

## 2026-10-11 — Raccord du cache Vent arrière (client de la bibliothèque)

- Base `gh-pages` `b804d02b31aafda55e500e311ca77512f1d62819` ; checkpoint `checkpoint/lab-start-capture-tailwind-cache-v1-2026-10-11`, branche `work/lab-capture-tailwind-cache-v1-2026-10-11`.
- Média déjà publié dans `global-assets` SHA `c262eeaf4bbdc242409728e680e50bfffab0e121`, 1 icône WebP 128², ID `pack:capture:icon-skill-tailwind-feather-01`, 135 assets / 46 icônes.
- Owner consommateur : `src/assets/global-visual-library.js`, cache v27 → `2026-10-11-v28-capture-tailwind-icon`. Strict périmètre : ce fichier, nouvelle sentinelle et ancien test Air ajusté pour progression additive de version, ce journal et documentation `docs/LAB_CAPTURE_TAILWIND_CACHE_V1.md`.
- Aucun changement gameplay, assets, données auteur, configurations de compétences, `main`, `Zombicide-40k`, Exploration ou second resolver.
- Validation : CI au SHA final, checkpoint GREEN exact, publication FF sous lease, CI + Pages en post-publication ; vérification visuelle Android par utilisateur. Pas d'attribution automatique de l'icône.

## 2026-10-11 — Remplacement de deux compétences Air auteur, avant diagnostic HUD
- Base `gh-pages`: `50a4bd36a0572c34b05c79be2bd650f900039f5e` (CI et Pages GREEN), checkpoint `checkpoint/lab-start-capture-air-dual-skill-import-2026-10-11`, branche `work/lab-capture-air-dual-skill-import-2026-10-11`.
- Ajout exact de deux exports utilisateur `lib_tailwind` et `cap_air_atk_3` sous `data/capture/showcase`; enregistrement dans le registre unique `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, remplacement par ID via Transfer `configuredSkills`, conservation des paramètres auteur (dont 3 statuts réutilisant l'ID `status` et l'icône `core:icon-skill-portal-dash-01`). Aucun changement des règles ou du moteur dans ce lot.
- Fichiers autorisés : deux JSON, catalogue de presets, test dédié, documentation `docs/LAB_CAPTURE_AIR_DUAL_AUTHOR_IMPORT_V1.md`, présent journal ; test CI/Chromium requis, checkpoint GREEN puis FF gh-pages. Diagnostic séparé après publication pour pourquoi Vent arrière n'affiche qu'un statut.

## 2026-10-11 — Vent arrière : statut dupliqué, véritable collision runtime
- Base `gh-pages` `5993a626d0863db0038b3cb2bb3c79502b382b1d` ; checkpoint `checkpoint/lab-start-capture-tailwind-multi-status-2026-10-11`, branche `work/lab-capture-tailwind-multi-status-2026-10-11`.
- Diagnostic du vrai propriétaire : dans `status-effect-runtime-v1`, une entrée par `status.id`; 3 identifiants `status` dans Vent arrière font du refresh, perdant 2 définitions. Le HUD projette l'état restant. Pas de correction d'affichage isolée.
- Périmètre : corriger seulement les IDs en conflit dans le preset `lib_tailwind`, garder son visuel blanc sous la clé cooldown, modifier uniquement `src/ui/capture-editor-human-v2.js` pour des IDs nouveaux uniques et rejet visible des doublons en édition, 2 tests liés et doc `docs/LAB_CAPTURE_TAILWIND_MULTI_STATUS_V1.md` et ce journal. Valeurs, durées, cibles, skill Charge aérienne, 103 créatures, moteur, renderer, assets et dépôts externes interdits de modification.
- TDD RED commit `37d88237fea31fafb9feb8ea4d50eb9501c2df7d`; test réel de 4 statuts et 4 icônes, puis CI/Chromium, checkpoint GREEN SHA exact, FF et Pages. Validation manuelle du rendu sur téléphone.


## 2026-10-11 — Correction Vent arrière, ciblage réel et audit des compétences équipées

- Signal utilisateur : après réparation des 3 collisions ID `status`, combat affiche encore seulement un effet sur le lanceur, et certaines capacités équipées semblent avoir perdu leur configuration.
- Diagnostic owner : `src/ui/combat-2v2-test-ui.js` cible l'ennemi par défaut, Vent arrière avait `targetRelations:[enemy,ally,self]` et les 3 derniers statuts `targetScope:target` : vitesse sur lanceur, 3 autres effets chez cible ennemie, même si IDs désormais uniques. Les tests précédents forçaient `targetId:player` et ne couvraient pas le bouton réel.
- Base `gh-pages` `7212ec92fc9fdc62d194e0c6125379573fee952a`, checkpoint `checkpoint/lab-start-capture-tailwind-self-target-2026-10-11`, branche `work/lab-capture-tailwind-self-target-2026-10-11`.
- Owner : données du preset `lib_tailwind` uniquement, `targetRelations:[self]`, 4 scopes `self`, 3 buffs et 1 malus de défense intacts pour 15 s. IDs, valeurs, présentation, coûts et autre capacité `cap_air_atk_3` intacts.
- Fichiers autorisés : `data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json`, 3 tests ciblés, `docs/LAB_CAPTURE_TAILWIND_SELF_TARGET_V1.md`, ce journal. Aucun moteur/renderer/new loader/main/global-assets/GenSrpG/exploration.
- Auditor : les IDs `cap_air_atk_1..4` sont toujours assignés à Ailevent ; `cap_air_atk_3` a ses médias/sons auteur; les 3 autres restent des compétences natives sans fichier preset auteur actuellement. Les réglages d'une session locale non exportée ne sont pas garantis persistants par GitHub.
- TDD RED `d80ba9fbcb7767ea05d4747af52e1b9ab18e0dca`, sentinelle ciblage bouton/CombatSession/HUD/1v1-2v2 puis CI et checkpoint GREEN + FF / Pages; vérification manuelle sur téléphone ensuite.


## 2026-10-12 — Régression Fireball : tir direct et présence airborne

- Retour utilisateur : Boule de feu touche une créature en plein déplacement aérien. Ancienne règle à préserver : projectile direct suit une cible en déplacement au sol, mais pas une présence aérienne qu'il ne sait pas atteindre.
- Sources LIVE lues : `LAB_CHARTE`, `LAB_ROADMAP`, `LAB_ARCHITECTURE`, `LAB_CURRENT_WORK`, `LAB_CHECKPOINT_POLICY`, `LAB_PROJECTILE_DIRECT_SKYFALL_ICONS_V1` et sentinelles de présence.
- Base `gh-pages` `8139980d6845eaad78f85f63f9a162f23e7c000f`, checkpoint `checkpoint/lab-start-fireball-airborne-presence-2026-10-12`, branche `work/lab-fireball-airborne-presence-2026-10-12`.
- Test RED sur vrai export de Boule de feu / vraie Charge aérienne, `CombatRuntime`, `CombatSession` et `planSkillOutcomeFx` au commit `75f4e3d407a65e21e7a5ea829e33789dc80cd21f` : `hitPresenceStates:null`, hit aérien confirmé.
- Owner : preset actif unique `data/capture/showcase/fireball.capture-skill-transfer-v1.json`; seul champ modifié `hitPresenceStates` passe de `null` à `["surface"]`. Les autres valeurs auteur, sprites/sockets/sons/dégâts et capacités sont protégés. Aucune modification du moteur ou de `global-assets`.
- Périmètre fichiers : fiche Fireball, `tests/unit/capture-showcase-fireball-author-v3.test.mjs`, `tests/integration/capture-fireball-airborne-regression-v1.test.mjs`, doc `docs/LAB_FIREBALL_AIRBORNE_PRESENCE_REGRESSION_V1.md`, présent journal.
- Sentinelles : air raté et pas de dégâts/FX d'impact, sol en mouvement et statique touchés, anti-aérien déclaré autorisé. CI full + Chromium, checkpoint GREEN, FF et Pages, validation tactile Android de l'utilisateur avant GREEN manuel.


## 2026-10-12 — Ailevent + Rafale, deux exports utilisateur

- Base GREEN `gh-pages` `033fb8921f42dae07564badbe4b79e2336a7aab5`; checkpoint `checkpoint/lab-start-capture-ailevent-rafale-author-v2-2026-10-12`, branche `work/lab-capture-ailevent-rafale-author-v2-2026-10-12`.
- Mission : deux fichiers utilisateur exacts. Ailevent SHA256 `6605ee3255f732ce9303be2f7f405aad1ec3f9b947255905944f46b5ce6d9af1` (5391 octets), Rafale SHA256 `27ba4466558875a97845e571b2d5b3b5e6529ac7097dad4e592b694e59a92c29` (4696 octets).
- Owner : transfert Capture officiel de `data/capture/showcase/` ; remplacement du preset `crea_ailevent` par le même ID (11 compétences, slots `lib_gust/cap_air_atk_3/lib_tailwind/vide/vide`), ajout de `lib_gust` au registre `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` pour remplacement du même ID natif, sans second registre.
- Périmètre : 2 JSON, 1 registre, 4 tests existants d'invariant auteur, 1 test de régression dédié, `docs/LAB_AILEVENT_RAFALE_AUTHOR_V2.md`, présent journal ; aucun moteur, données tiers, `main`, `global-assets`, GenSrpG ni Exploration.
- Contrats : données média et de jeu non modifiées ; test exact SHA + transfert batch + inventaire loadout + préservation du garde Fireball airborne ; CI foundation + Chromium ; checkpoint GREEN et FF uniquement après succès, CI/Pages après publication. Test mobile utilisateur distinct.


## 2026-10-12 — Tir direct : ligne de repos stable indépendante des hauteurs de la cible

- Signal utilisateur : Boule de feu MISS une cible aérienne mais le rendu pointe visiblement vers la créature en hauteur ; la simulation de présence seule ne suffit pas à vérifier la collision physique.
- Diagnostic : `src/adapters/renderer/dom-skill-fx.js` prend la cible du vecteur non-skyfall depuis `targetAnchorFor`, qui fournit `getVisibleTargetRectFor` mobile dans le 2v2. La géométrie du projectile suit donc la hauteur/enterrement de la créature.
- Base `gh-pages` `57a4e9a00d1174d56964439194352fabe03d5b3e` avec CI/Pages SUCCESS ; checkpoint `checkpoint/lab-start-direct-projectile-rest-lane-2026-10-12` ; work `work/lab-direct-projectile-rest-lane-2026-10-12`.
- Owner : seul FX renderer. Projectiles directs visent le slot stable `targetAnchors`, SKYFALL conserve cible live ; impact & collision continuent de lire modèle réel et Runtime seul tranche le hit et les dégâts.
- Périmètre : `src/adapters/renderer/dom-skill-fx.js`, `tests/unit/direct-projectile-rest-lane-v1.test.mjs`, `docs/LAB_DIRECT_PROJECTILE_REST_LANE_V1.md`, ce journal. Aucun déplacement des sprites ni changement du gameplay, du moteur, du statRegistry, de `main`, `global-assets`, GenSrpG ou Exploration.
- Test RED `6fbc673e8e1cdb0ee1b5777cab9c1138355e668a`, scénarios cible volante/souterraine dans les deux sens, trajectoire stable/skyfall propriétaire distinct. CI Chromium, checkpoint GREEN et FF sous lease après réussite, puis déploiement Pages; test visuel smartphone distinct.

- Tests hérités mis à jour dans le même périmètre : `tests/unit/skill-fx.test.mjs` exigeait l'ancienne visée sur modèle en hauteur ; vérifie maintenant le slot stable au repos. Le nouveau test contrôle la notation CSS réelle de la frame de départ (zéro sans px). Aucune modification métier supplémentaire.


## 2026-10-12 — Projet direct et collision d'une cible au sol à mi-arène

- Demande : un projectile horizontal doit rester sur sa ligne de repos malgré les mouvements aérien/souterrain, mais **une cible au sol qui croise la ligne avant l'arrivée** doit être touchée au point de rencontre ; le projectile s'arrête, l'impact est sur l'image de la cible à sa position mobile, les PV diminuent immédiatement (joueur et adversaire).
- Base `gh-pages` `781f057b3e574d42bfb710ce6fcd5e15e158db4e` (CI/Pages GREEN) ; checkpoint `checkpoint/lab-start-direct-projectile-midfield-contact-2026-10-12` ; branche `work/lab-direct-projectile-midfield-contact-2026-10-12`.
- Cause potentielle vérifiée dans la chaîne existante : `dom-skill-fx` détecte `sweptPointHitsOpaqueMask` ; `CombatRuntime.reportActionContact` abrège le trajet ; `combat-resolution-presenter` annule et positionne le sprite d'impact sur le modèle vivant. Pas de second calcul physique/dégâts à créer si la sentinelle passe.
- Périmètre du lot : `tests/integration/capture-direct-projectile-midfield-contact-v1.test.mjs`, `docs/LAB_DIRECT_PROJECTILE_MIDFIELD_CONTACT_V1.md`, `docs/LAB_CURRENT_WORK.md`. Aucun changement gameplay, renderer, presets, FX média, `main`, `global-assets`, `Zombicide-40k`, Exploration.
- Critères : au moins une frame sans contact suivie d'un contact vers 50 % arène, 1 hit + dégâts avant temps nominal, projectile annulé, FX d'impact sur la créature mobile, pas de doublon, deux directions, autres sentinelles air/souterrain/skyfall maintenues, CI complète verte, checkpoint GREEN et FF `gh-pages` ; test manuel Android restant.


## 2026-10-12 — Rafale puissance 2 / projectile direct sur centre du corps au repos

- Signal utilisateur : augmenter `lib_gust.projectileClash.power` de 0 à 2, et aligner le projectile direct Rafale sur le **corps visible immobile** plutôt que le centre du conteneur où il passe au-dessus ; conserver les tirs directs sans poursuite de vol/souterrain et le contact au sol à mi-arène.
- Base GREEN `gh-pages` `51d8b205a6aab7aa366552eb2837d231924d5b03`; départ `checkpoint/lab-start-capture-rafale-rest-aim-v1-2026-10-12`; travail `work/lab-capture-rafale-rest-aim-v1-2026-10-12` ; test RED commit `c5d8858107a5a541e3f0001c5d2acb3e7ec4da7e`.
- Owner visuel `src/adapters/renderer/dom-skill-fx.js`: projeter le décalage du centre opaque visible par rapport à son ancre de mouvement sur le slot stable. La translation aérienne/souterraine s'annule ; collision live, Runtime et skyfall inchangés. Owner données `data/capture/showcase/lib_gust.capture-skill-transfer-v1.json`: seul clash power 2. Aucun autre author field changé.
- Fichiers autorisés : ce fichier de preset, le renderer FX, tests ciblés anciens/nouveau, `docs/LAB_CAPTURE_RAFALE_REST_BODY_AIM_V1.md`, ce journal. Tester fondation + Chromium et surfaces/presence/swept contact après changement; GREEN seulement après CI au SHA exact, FF sous lease puis CI/Pages; validation mobile utilisateur en dernier.


## 2026-10-12 — Régression ligne de tir au-dessus du modèle immobile (rest-geometry V2)

- Signal Android : des projectiles directs visent au-dessus d'une créature au repos, y compris après l'ajustement Rafale. Le comportement GREEN de Boule de feu (tir droit, aucune poursuite verticale d'une cible volant/creusant, contact opaque à mi-arène au sol) doit être absolument préservé.
- Base technique LIVE `gh-pages` : `1e56e0cb7b48335b92cf69c2f9cc8f1c80d49ca0`, CI `38232921782` SUCCESS, Pages `38232921246` SUCCESS.
- Checkpoint IMMUTABLE de départ : `checkpoint/lab-start-direct-projectile-rest-geometry-v2-2026-10-12` ; branche de travail : `work/lab-direct-projectile-rest-geometry-v2-2026-10-12`.
- Diagnostic : `restingProjectileAimRectV1` reporte le décalage du corps opaque par rapport à l'ancre de mouvement vers le centre du slot, mais oublie l'offset natif `actor.position` du Creature Profile. Sur les créatures avec placement personnalisé, même immobiles, le point de visée est translaté. Par ailleurs le centre du RECTANGLE englobant opaque n'est pas nécessairement un pixel opaque (silhouette ajourée).
- Owners uniques : `Demo visual actor` fournit l'offset natif déjà normalisé ; `dom-visible-model-contact` expose un point opaque pur dérivé du même masque de collision, sans seconde collision ; `dom-skill-fx` projette ce point sur le slot stable et reste seul propriétaire de la trajectoire. `CombatRuntime` décide toujours des dégâts/présences et du contact.
- Fichiers autorisés : `src/ui/demo-app.js`, `src/ui/combat-2v2-test-ui.js` (passage de donnée uniquement), `src/adapters/renderer/dom-visible-model-contact.js` (point opaque), `src/adapters/renderer/dom-skill-fx.js` (géométrie de tir), `tests/unit/direct-projectile-rest-geometry-v2.test.mjs`, `docs/LAB_DIRECT_PROJECTILE_REST_GEOMETRY_V2.md` et ce journal. Ajustements minimaux des tests sentinelles déjà existants uniquement en cas de contradiction prouvée.
- Protégés : `data/capture/showcase`, `configuredCreatures` (103), `configuredSkills`, sockets/FX source/impact, tir SKYFALL, beam, contact opaque live, dégâts, `hitPresenceStates`, changement de cible, CI et mobilité, `main`, `global-assets`, `Zombicide-40k`, Exploration.
- TDD : RED sur offset auteur positif/négatif + cible immobile, pixel opaque réel avec masque à centre transparent, scale variable, invariance air/souterrain et deux sens de tir ; GREEN sentinelles Fireball surface-only, MIDFIELD swept contact, SKYFALL/beam ; CI Node et vrais Chromium. Aucun checkpoint GREEN avant CI au SHA exact. Publication `gh-pages` seulement fast-forward après réussite et recontrôle du HEAD ; validation réelle Android distincte.

### Rest geometry V2 — validation technique du code

- Code : `d4c83b1bd9d1da03f92e2668e2429128e94e0288` ; correction du test de notation CSS `458252c827547961883f885368c343654994a388`.
- GREEN code CI `38248554062` : 1556/1556 tests Node, Chromium Firestorm et Creature Library SUCCESS. RED `dcb2b63b6d22527a4228b8d521f48b35ce2715f2` avant implémentation.
- Point de collision et dégâts `CombatRuntime` inchangé, `hitPresenceStates` Fireball inchangé ; le renderer calcule une fois la ligne de tir sur point alpha réel + position native auteur, puis conserve la trajectoire ; SKYFALL/beam exclus.
- Rapport `docs/LAB_DIRECT_PROJECTILE_REST_GEOMETRY_V2.md`. Étapes finales : CI SHA documentation, checkpoint GREEN SHA identique, fast-forward non forcé de `gh-pages` si HEAD conforme, CI/Pages après publication ; test smartphone utilisateur distinct.


## 2026-10-12 — Reserve Effect Targeting V2 (chantier officiel)

- Validation utilisateur : rest geometry V2 confirmé sur smartphone ; base GREEN publiée `gh-pages` `8946e587443a720a86910153a70b0935fbd3345f` (CI 38249187061 SUCCESS, Pages 38249186892 SUCCESS).
- Audit : Reserve Targeting V1 existe dans Roster Session via `useSkillOnTarget` et `CombatTargetRefV1`, mais cible unique et hors chemin de sélection du client; les effets multi-target réserve sont explicitement refusés; le HUD ne propose que des targets actifs.
- Objectifs : dégâts/soins distincts sur cible active et réserves du camp visé; soin/dégât sur un membre de réserve ciblé par ID, prix/charge payés une seule fois, sauvegarde des PV par Roster Session.
- Ownership : Skill Contract décrit l'effet; Combat Rules applique effets actifs; Roster Session seul possède la réserve et ses snapshots; Combat Session raccorde une unique commande aux deux propriétaires; Demo UI n'est que présentation/ciblage.
- Départ : `checkpoint/lab-start-reserve-effect-targeting-v2-2026-10-12`; travail `work/lab-reserve-effect-targeting-v2-2026-10-12`; SHA base exact `8946e587443a720a86910153a70b0935fbd3345f`.
- Périmètre autorisé : `src/contracts/skill-effect-v1.js`, `src/contracts/skill-definition.js`, `src/core/combat/action-resolver.js`, `src/core/combat/combat-session.js`, `src/core/combat/roster-session.js`, `src/ui/capture-combat-roster-controller-v1.js`, `src/ui/combat-2v2-test-ui.js`, `src/ui/capture-editor-human-v2.js`, sentinelles nouvelles et existantes ciblées, `docs/LAB_RESERVE_TARGETING_V2.md`, ce journal.
- Protégés : projectile direct/swept alpha, FX/SKYFALL, sprite/audio, capacités existantes, library 103, Arena, Combat Runtime timing/energy, main/global-assets, GenSrpG et Exploration.
- Garde-fous : valider effet/portée avant dépense; ancienne cible unique active inchangée; aucun banc dans CombatState; KO ignoré; même owner de résistance, bouclier et soins; aucune seconde dépense/horloge; 1v1 et 2v2; tests Node/Chromium puis checkpoint GREEN sur SHA CI. Smartphone utilisateur requis pour validation manuelle.

### Reserve Effect Targeting V2 — état de validation du code

- Contrat : deux scopes additifs `all_enemy_reserves` et `all_ally_reserves` (uniquement damage/heal), actifs uniquement en complément d'une cible active. `targetLocations:["reserve"]` et effet `target` conserve le choix d'un membre exact (V1).
- Owners raccordés : `CombatSession` appelle une unique résolution Roster sur `outcome:"hit"`; Roster persiste chaque réserve vivante et utilise les mêmes effets de dégâts/soins/résistances/protections ; le skill est consommé une seule fois. Le ciblage banc dans HUD est projeté à partir du vrai preview Roster, et réutilise les boutons du panneau Rappel en préservant la sélection de remplacement.
- Chemin direct/sprite, combat Runtime, SKYFALL/beam, Library 103, GenSrpG et main non modifiés.
- Test RED nouveau `tests/integration/reserve-effect-targeting-v2.test.mjs` au commit `7dab27a329055090f687e0bac0c2987b1fac2643` ; GREEN 1563/1563 Node à `0eff3468dd0957390992101c0de90d04b4d5248d` CI `38253184241`, avec les deux vrais Chromium OK. Cas mixtes damage/heal, cible réserve nommée, KO exclus, coût unique, rosterless guard; cible UI banc et rappel indépendant.
- Documentation `docs/LAB_RESERVE_TARGETING_V2.md`. Checkpoint GREEN sous condition de CI complète réussie au SHA documentaire final; FF `gh-pages` sous lease, Pages et test utilisateur Android ensuite. Le chemin de ciblage réserve individuel V1 s'exécute immédiatement sans projectile visuel hors terrain, comme documenté.


## 2026-10-12 — Projectile Animation / Depth V1 — chantier officiel

- Demande : Tornade et sprites de projectile avec cadence de boucle indépendante de la durée de trajet ; perspective de taille vers l'ennemi (rétrécit) ou depuis l'ennemi (grossit) ; réglage individuel dans l'éditeur.
- Base technique GREEN publiée `gh-pages` : `00d10a87c4a1041abf8e3a62fa85c0095bd54d66`, CI 38253674926 SUCCESS et Pages 38253674207 SUCCESS. Validation smartphone précédente de Reserve V2 encore attendue ; les travaux restent isolés.
- Départ : `checkpoint/lab-start-projectile-animation-depth-v1-2026-10-12` ; branche : `work/lab-projectile-animation-depth-v1-2026-10-12` ; SHA de base ci-dessus.
- Ownership : Skill Presentation Binding (nouveau V11 additif) valide les réglages ; Asset Projection expose cadence/vues ; renderer FX applique animation et scale visuels ; Human Editor saisit/importe/exporte sans calcul visuel métier.
- Fichiers autorisés : `src/contracts/skill-presentation-binding-v11.js`, `src/contracts/skill-presentation-binding.js`, `src/adapters/renderer/capture-skill-presentation-assets-v2.js`, `src/adapters/renderer/dom-skill-fx.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, tests spécifiques, `docs/LAB_PROJECTILE_ANIMATION_DEPTH_V1.md`, ce journal.
- Protégés : géométrie/contacts/swept alpha, trajectoire projectile direct/SKYFALL, timeline Runtime, dégâts/cooldowns, asset library 103 créatures, sons, autres sprites existants, `main`, `global-assets`, GenSrpG et Exploration.
- TDD : sentinelles RED du contrat V11, vitesse des frames, les deux sens de perspective, conservation des defaults anciens, persistance editor/import-export et vrai rendu ; implémentation minimale puis CI Node + Chromium ; GREEN seulement après CI exacte et publication FF sous lease. Validation Android utilisateur distincte.
- Choix de sécurité : réglages opt-in par compétence ; aucune modification silencieuse des projectiles existants ni de leur contact.


### Projectile Animation / Depth V1 — validation du code

- Nouveau contrat strict V11 (travel uniquement): cadence des frames `frameSpeedMultiplier: 0.25..4` en mode loop; perspective directionnelle `perspectiveAmount: 0..0.5` en projectile linéaire, désactivée par défaut, non compatible avec SKYFALL.
- Éditeur Capture : nouveaux champs visibles, nouveau/charger/sauver/exporter/importer raccordés. Projection d'asset conserve le flux historique et la vue source; un seul renderer FX anime frames et scale sans toucher au Runtime ou au contact opaque.
- TDD RED `be4b28c975dc44337f3bd66f5e1c308816f47ac2`; code+HTML GREEN `99e8a7f0399a921b7d32c722d15021633b75f042` ; CI `38255845203` SUCCESS (fondation Node + Firestorm Chromium + Library 103 Chromium).
- Invariants : anciens projectiles gardent leurs keyframes 0.94 / 1.04 / 0.98, vitesse native et règles inchangées; aucun changement à `main`, `global-assets`, `Zombicide-40k` ou Exploration.
- Rapport : `docs/LAB_PROJECTILE_ANIMATION_DEPTH_V1.md`. Checkpoint final sur SHA documentaire testé, publication FF sous lease et validation smartphone utilisateur distincte.


## 2026-10-12 — Tornade : perspective perceptible et calque arrivée / départ (lot officiel)

- Retour réel utilisateur smartphone : `cap_air_atk_4` Tornade importée avec Binding V11 `perspectiveAmount=0.5`, `travel.displayScale=5`, `frameSpeedMultiplier=1.5` ; rétrécissement peu perceptible ; `travel.layerByView=behind/behind` garde le projectile derrière l’adversaire avant impact alors que le départ doit passer derrière son propre lanceur ; cast et impact ont une opacité auteur de <1% (préserver sans décision).
- Base GREEN publiée `gh-pages` `d971068ab23b66183517b40abf8452b68b308b06`, CI 38256279482 / Pages 38256279073 SUCCESS ; checkpoint `checkpoint/lab-start-tornado-perspective-occlusion-v1-2026-10-12` ; branche `work/lab-tornado-perspective-occlusion-v1-2026-10-12`.
- Diagnostic : le renderer attribue un `z-index` fixe (`behind=2`, `front=7`) au shell tout le trajet ; il n’existe pas de distinction arrivée vs départ. L’ancien montant perspective est plafonné à 50%, déjà utilisé dans la compétence Tornade.
- Ownership : Binding V12 étend V11 de manière strictement additive (seul slot travel) avec ratio de taille distant perceptible + `arrivalLayer` explicite ; Asset Resolver transmet les valeurs ; renderer FX reste propriétaire unique du mouvement de shell et du calque animé, sans nouvelle horloge ; Human Editor expose et préserve les réglages ; preset compétence Tornade issu exclusivement du JSON fourni.
- Fichiers autorisés : `src/contracts/skill-presentation-binding-v12.js`, `src/contracts/skill-presentation-binding.js`, `src/adapters/renderer/capture-skill-presentation-assets-v2.js`, `src/adapters/renderer/dom-skill-fx.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, `src/catalogs/capture-showcase-skill-presets-v1.js`, `data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json`, tests dédiés et de non-régression, `docs/LAB_TORNADO_PERSPECTIVE_OCCLUSION_V1.md`, ce journal.
- Protégés : `CombatRuntime`, action contact/opaque target collision et rest point, skyfall/beam, Timeline durée/énergie, sons, actifs 103 créatures, autres skills et leurs V1-V11, `main`, `global-assets`, `Zombicide-40k` et Exploration.
- TDD : test RED vrai Binding→Asset→FX→HUD & imported Tornade, z-index évolutif et scale 25% distance, deux sens, ancien comportement identique, runtime durée conservée, import/export/hydratation. CI Node + navigateur Chromium ; checkpoint GREEN au SHA vérifié puis FF `gh-pages` sous lease et CI/Pages post-publication. Validation Android utilisateur séparée.


### Tornade perspective / calque V1 — GREEN du code à vérifier au SHA de documentation

- Nouveau contrat V12 additif : ratio distant optionnel `farScaleRatio` 0.15..1, arrivée `arrivalLayer` front/behind ; ancienne perspective V11 inchangée. Le projectile reste derrière son lanceur puis passe devant sa cible avant contact sur le **même** mouvement FX. Tout le gameplay, le mask de collision et la durée restent identiques.
- JSON utilisateur `cap_air_atk_4` conservé à l'identique hormis version V12 et deux options visuelles ; showcase 17→18 items avec tests sentinelles adaptés. Cast/impact auteur initialement <1% opaques, intention préservée.
- RED `b1aea2c1a91ccd892b77ec2ed1b98298f0b50a0c`. Code `599232f1fa17065082d86002b94b5845bd6b7e24` CI `38263241612` SUCCESS : 1576/1576 Node, Firestorm Chromium et Creature Library Chromium GREEN.
- Rapport : `docs/LAB_TORNADO_PERSPECTIVE_OCCLUSION_V1.md`. À valider ensuite : CI SHA documentaire, checkpoint GREEN exact, FF gh-pages sous lease, CI et Pages post-publication ; essai smartphone manuel utilisateur distinct.


## 2026-10-12 — Projectile sprite orientation and perspective UI (chantier officiel)

- Retour Android : projectile Tornade `cap_air_atk_4` vu à l'envers lorsqu'il est tiré par l'IA ; deux réglages perspective apparaissent concurrents dans l'éditeur.
- Base GREEN publiée `gh-pages` `5fc32b67a191f3c8532899d3ee664e24381bf736`, CI 38263945963 et Pages 38263944824 SUCCESS. Départ : `checkpoint/lab-start-projectile-orientation-v1-2026-10-12`, branche : `work/lab-projectile-orientation-v1-2026-10-12`.
- Cause à corriger : le Render Adapter applique `atan2(target-source)-headingRad` à tous les projectiles linéaires ; un FX intrinsèquement vertical pivote de ~180° pour le camp opposé. L'asset metadata `headingRad` est la source de vérité existante pour les visuels directionnels.
- Ownership : Asset Resolver conserve la métadonnée de direction ; FX Renderer ne tourne vers la cible que les sprites explicitement munis d'une orientation native directionnelle ; les sprites neutres/imports restent à l'endroit, quelle que soit la provenance. Human Editor présente `farScaleRatio` comme réglage principal, ancien V11 `perspectiveAmount` en compatibilité avancée ; le contrat historique est conservé.
- Fichiers autorisés : `src/adapters/renderer/dom-skill-fx.js`, `src/assets/global-presentation-asset-resolver-v1.js` uniquement si cause prouvée, `src/ui/capture-editor-human-v2.js` seulement si indispensable à l'UI, `examples/dom-demo/capture-editor-v2.html`, `data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json` si utile, sentinelles/tests dédiés, `docs/LAB_PROJECTILE_ORIENTATION_V1.md`, et ce journal.
- Protégés : Beam, SKYFALL, trajectoire/contact direct, gameplay/timings/dégâts/coûts, autres compétences, contrats V1–V12, `main`, `global-assets`, `Zombicide-40k`, Exploration.
- TDD : test RED pour image non directionnelle vue joueur/IA et import utilisateur, sprite explicitement directionnel préservé, SKYFALL inchangé, aucune régression de scale/calque, éditeur compat et données Tornade ; CI Node + navigateurs ; commit/test/Checkpoint GREEN SHA exact puis FF `gh-pages` sous lease ; validation téléphone utilisateur distincte.

### Projectile orientation V1 — revue / code GREEN

- RED sentinelles `447a052ac2286094317f5ba045194ef927440258` : foundation FAILED comme attendu, navigateurs inchangés SUCCESS.
- Implémentation : `DomSkillFxRenderer` conserve les sprites de déplacement vertical/non directionnels à `rotate(0rad)` pour les deux camps ; seule la métadonnée directionnelle **explicite** `headingRad` enclenche `atan2`. Asset resolver rejette `headingRad:null` comme absence de métadonnée (au lieu de traiter null comme zéro).
- Réglage principal : ratio de taille distante V12 ; ancien V11 `perspectiveAmount` placé dans les détails « historique » tout en restant éditable/importable. Tornade conserve profondeur 0.25 et calque arrivée front, retire uniquement l'ancienne perspective redondante 0.5 → 0 ; dégâts/sprite/sockets/audio/cadence inchangés.
- CI code exact `a2f2d7d80fd2e1ad2d7e3543a49ab734b51d3ee9` run `38271486545` SUCCESS (foundation, Firestorm Chromium, Creature Library Chromium).
- `docs/LAB_PROJECTILE_ORIENTATION_V1.md` ; valider le SHA documentaire exact CI, checkpoint GREEN, FF `gh-pages` sous lease puis CI et Pages post publication ; essai Android utilisateur distinct.


## 2026-10-12 — Trois compétences Air / visibilité des réserves adverses (lot officiel)

- Retour utilisateur : remplacer à l'identique trois exports auteur (`cap_air_atk_7` Ouragan, `lib_tailwind` Vent arrière, `cap_air_atk_4` Tornade) puis rendre les réserves ennemies visibles à la demande en affichant leurs PV et en facilitant le ciblage exact depuis le HUD. Conserver les deux formes : effet automatique `all_enemy_reserves` et compétence à cible individuelle `targetLocations:reserve`.
- Base publiée GREEN `gh-pages` : `dc2c71851d3bf67318f2970e322588eaa14e2bab`, CI `38271801205` et Pages `38271800874` success.
- Checkpoint initial `checkpoint/lab-start-air-skill-bench-ui-v1-2026-10-12` ; branche de travail `work/lab-air-skill-bench-ui-v1-2026-10-12`.
- Propriétaires : fichiers de capacités auteur = unique source dans showcase ; Roster Session reste propriétaire des PV de réserve ; panneau UI/renderer HUD projette uniquement ses snapshots, et appelle l'action de ciblage existante sans modifier règles, coûts, cooldowns ni gestion du rappel.
- Fichiers autorisés : `data/capture/showcase/cap_air_atk_7.capture-skill-transfer-v1.json`, `data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json`, `data/capture/showcase/cap_air_atk_4.capture-skill-transfer-v1.json`, `src/catalogs/capture-showcase-skill-presets-v1.js`, `src/ui/capture-combat-roster-controller-v1.js`, `src/ui/combat-2v2-test-ui.js`, `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, tests de sentinelle/import/interaction, note dédiée et ce journal.
- Protégés : combat Runtime, résolution damage/heal/KO, système Rappel et cooldown, collision/rendu FX, bibliothèque de créatures, autres compétences, `main`, `global-assets`, dépôt GenSrpG et Exploration.
- Tests : contrat d'import des 3 fichiers auteur, identification sans doublons et comportement Ouragan splash actif/réserves, panneau fermé par défaut et ouvrable au toucher, PV des réserves adverses mis à jour via Roster, KO, sélection d'une réserve ennemie autorisée, pas de mutation du rappel, 1v1/2v2, Chromium et fondation. TDD et publication sous lease ; validation manuelle Android distincte.


### Air skills / enemy reserve panel — implementation ready for CI gate
- Three exact creator JSON exports landed once in showcase: Ouragan `cap_air_atk_7` added; Vent arrière `lib_tailwind` and Tornade `cap_air_atk_4` replaced, no silent edits to author fields. Current authored Tornade scale far 0.5, cast opacity 0.7, impact opacity 0.6.
- Enemy reserve panel in combat editor, separate from Rappel: native details collapsed by default, opened on touch/keyboard or automatically for an enemy-reserve single-target skill. Names, PV bars and KO project canonical Roster snapshots. Valid reserve target click uses the existing `useSkillOnTarget`; voluntary switch selection remains untouched.
- `all_enemy_reserves` group effects are unchanged and require no per-member selection; active target remains a normal combat target. No reserve actors have been added to CombatState, no duplicate HP or action owner.
- New RED sentinels `tests/unit/air-skills-enemy-bench-inspection-v1.test.mjs` commit `ac055694b5ba8c70a57c3ac1a08b0f08f8fac4db`; creator imports `f9aff5ce3adf925168734c981f23cdef79117cdf`, UI `ac3a807f443da5d2a2afc95de92eb714123b59fc`. Updated obsolete fixture expectations to the last author JSON, retaining historic tests for engine geometry.
- Final CI must succeed (Node + Chromium Firestorm + Chromium Library), then create checkpoint GREEN on exact commit, FF `gh-pages` under lease, re-check CI/Pages on published SHA. Phone user validation remains pending.


## 2026-10-12 — Placement du panneau réserve adverse près des PV joueur 2 (lot officiel)

- Retour utilisateur validé : le panneau « Réserves adverses », techniquement GREEN à `836519f1baf94f0a3ee0533b39d024d582db0606` (CI `38278438539`, Pages `38278437865`), est actuellement sous la barre de capacités locale ; il doit être situé **en haut de l'arène, directement à côté du HUD de PV adverse**, séparé du bouton adversaire pour préserver le ciblage normal.
- Objectif unique : déplacer **le même** `<details data-combat-enemy-reserves>` à la suite de la carte PV `opponent-1`, le présenter comme un onglet compact en haut à gauche de la carte adverse, avec popover qui s'ouvre vers le bas et reste dans la scène mobile paysage. Aucun clone du panneau.
- Départ : `checkpoint/lab-start-enemy-bench-hud-placement-v1-2026-10-12` ; branche `work/lab-enemy-bench-hud-placement-v1-2026-10-12` ; SHA base exact `836519f1baf94f0a3ee0533b39d024d582db0606`.
- Propriétaire : Demo UI (HTML/CSS) seulement, propriétaire Roster inchangé ; aucun déplacement des cartes adverses ni changement aux dégâts.
- Fichiers autorisés : `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, sentinelles du placement / vrai montage et journal courant ; note de validation dédiée seulement si nécessaire.
- Protégés : fichiers JSON des 3 compétences, commandes / ciblage Roster, `src/ui/combat-2v2-test-ui.js`, FX, Runtime, 103 créatures, positions des combattants, gameplay, `main`, `global-assets`, GenSrpG / Exploration.
- TDD : test RED d'unicité DOM, proximité immédiate entre HUD opponent-1 et panneau, hors du bouton sélectionnable ; CSS position en haut adjacent aux PV et popover en dessous / taille smartphone paysage ; conserver compat JS et test Node + navigateurs Chromium. GREEN uniquement CI SHA exact, checkpoint exact et publication fast-forward sous lease, validation visuelle Android utilisateur séparée.


### Placement réserve adverse — validation du code

- Un seul `<details data-combat-enemy-reserves>` déplacé **immédiatement après le bouton HUD `opponent-1`** dans `examples/dom-demo/capture-editor-v2.html`, hors du bouton cible et avant `opponent-2`, sans doublon, ni déplacement d'un HUD de PV.
- Style consolidé en un seul bloc par propriété, sans surcouche redondante : onglet `position:absolute`, `top:0.45rem`, à gauche du HUD adverse (largeurs paysage correspondant à `min(10.5rem,25%)`) ; menu déroulant vers le bas, limité en largeur/hauteur avec défilement. Le toucher, le clavier et l'ouverture automatique par compétence continuent via le même contrôleur Roster et ses données de PV.
- Test de non-régression RED `tests/unit/enemy-bench-hud-placement-v1.test.mjs` : contrôle unicité et structure, hors commandes locales, position et ouverture paysage. Nouveau micro-lot de présentation uniquement, aucun changement aux compétences importées, Runtime, FX ou sélection des réserves.
- Validation attendue : CI complète Node + 2 Chromium sur SHA documentaire exact ; checkpoint GREEN puis publication non forcée avec lease ; validation visuelle sur Android à confirmer par l'utilisateur.


## 2026-10-12 — Hiérarchie visuelle de l'éditeur Capacité / audit des mécaniques demandées

- Demande produit : priorité ergonomie à l'éditeur Capacité : réglages visuels **Cast / Projectile / Impact / Zone** clairement repérables et directement accessibles ; réglages experts **Glow / traînée / fumée / particules** moins envahissants, repliés à l'ouverture, sans supprimer préréglages rapides Discret/Équilibré/Spectaculaire. Ne pas ouvrir automatiquement ces réglages fins. Préserver les valeurs éditables, sélecteurs, import/export et choix auteur.
- Demande produit différée : onglet des réserves adverses doit accueillir six créatures sans surcharge, PV plus compacts et petite icône par créature. **À planifier en lot UI séparé**, aucun changement au HUD du combat dans ce lot.
- Audit mécanismes : reflet actuel = **renvoi de dégâts subis** par statut `damage_reflection`, différent d'un projectile réellement renvoyé avec sa trajectoire ; `immunity` existe (damage/negative_status), mais la présence « immatériel » + exception d'attaques spéciales est à développer ; stacking `stack`/`maxStacks` existe, seuil déclenchant KO/bonus à prévoir ; drain de **vie** proportionnel aux PV effectivement infligés à développer (à distinguer de `energy_drain`). Document de backlog dédié au diagnostic.
- Base publiée GREEN exacte : `e55dcf53dfd98006902f86e328938248ec3d1251` ; CI `38282307456` et Pages `38282306343` success.
- Checkpoint de départ : `checkpoint/lab-start-skill-editor-visual-hierarchy-v1-2026-10-12` ; branche propriétaire : `work/lab-skill-editor-visual-hierarchy-v1-2026-10-12`.
- Domaine propriétaire : **Human Editor / Demo UI et CSS uniquement**. Fichiers autorisés : `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, sentinelle `tests/unit/skill-editor-visual-hierarchy-v1.test.mjs`, nouveau backlog dans `docs/` et ce journal. Pas de modification `src/` nécessaire puisque les mêmes `data-skill-*` sont conservés.
- Protégés : tous les contrôles `data-*` de skill, valeur/serialization/import/preview, données auteur, Status/Skill/Runtime/FX/Roster/Audio, HUD combat, branches `main` et `global-assets`, projet GenSrpG et labo Exploration.
- TDD : RED pour groupement des contrôles Cast, Projectile, Impact, Zone, onglet de personnalisation des visuels prioritaire, expert glow/fumée indépendant et **replié par défaut**, préréglages rapides conservés et absence de doublon `data-*`. GREEN après Node + tests navigateur Chromium et publication fast-forward sous lease ; validation Android distincte.


### Hiérarchie de l'éditeur — code proposé pour validation CI
- Contrôles auteur `Cast`, `Projectile / Rayon`, `Impact`, `Zone / Aura` désormais séparés par de vrais en-têtes dans la section principale **Personnaliser les animations**, ouverte par défaut et repliable au toucher. Import de sprite personnel conservé avant les réglages fins, conformément au parcours et aux sentinelles existants.
- Le même panneau continue d'héberger tous les `data-skill-*` d'origine sans duplication. Les détails experts `Glow / traînée / fumée / particules` sont regroupés sous `data-skill-fx-expert` fermé par défaut. Préréglages rapides Discret/Équilibré/Spectaculaire inchangés ; raccourci optionnel Glow/particules reste replié.
- Sentinelle RED `tests/unit/skill-editor-visual-hierarchy-v1.test.mjs` commit `ff4d8b4f5a42224174cf4e7c7742f26035a2b51e` et CI RED `38291228766`; code HTML/CSS commit `700b85bd2b0947e0caf77e53366fca50eb1c7417`. Aucune mutation du moteur, de `src/ui`, des assets ou des données auteur.
- Backlog et diagnostic des mécanismes en `docs/LAB_CAPTURE_FUTURE_MECHANICS_BACKLOG_V1.md` ; aucune fonctionnalité de combat nouvelle déclarée livrée.


## 2026-10-12 — Retours smartphone : rayon dans Visuels et cases Mouvement (lot autonome)

- Source : captures utilisateur smartphone 21:31 : cases Surface/Aérien/Souterrain et Créature active/en réserve présentées comme grands blocs verticaux, inadaptés ; panneau distinct « 4 bis — Rayon continu — 3 phases » est hors de « Effets visuels » et paraît dupliqué avec les réglages visuels des animations.
- Diagnostic : les labels `class=check` du panneau Mouvement héritent de `label { display:grid }` et de `input { width:100%; min-height:2.55rem }`; aucun correctif spécifique ne les rend inline. Le module propriétaire `capture-editor-beam-stage-layout-v1.js` **déplace** déjà les champs d’origine Cast/BeamStart/Travel/Impact/sons vers l’affichage trois phases sans créer de seconde valeur ; le doublon est un problème de disposition et de libellés, pas une duplication de champs moteur.
- Objectif : intégrer le panneau canonique de trois phases du rayon **dans la carte « Effets visuels »** (sans « 4 bis »), visible uniquement pour Style Rayon ; présenter ses phases clairement, avec les mêmes champs déplacés par le JS existant. Dans « Mouvement », ranger et aligner les cases à cocher en lignes lisibles touchables, avec notes et groupes distincts, sur smartphone portrait et paysage.
- Base GREEN publiée `3e46159af250d53412698546c45c9aeef3f99dd5` ; départ `checkpoint/lab-start-beam-movement-ui-v1-2026-10-12` ; branche `work/lab-beam-movement-ui-v1-2026-10-12`.
- Périmètre autorisé : `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, `tests/unit/beam-movement-ui-v1.test.mjs` et ce journal. Source de vérité JS `src/ui/capture-editor-beam-stage-layout-v1.js` **protégée**, comme autres scripts, valeurs, import/export, statuts, combat, assets, `main`, `global-assets`, GenSrpG et exploration.
- TDD : test RED exigera un seul panneau rayon dans Effets visuels sans carte 4 bis, disponibilité de trois phases et des contrôles sans duplication ; source JS qui déplace réellement les champs conservée ; tests CSS imposant alignement checkbox/texte et taille compacte dans Mouvement (sur des groupes dédiés). Tests Node, Browser CI et Pages, checkpoint GREEN SHA exact et publication sous lease. Essai réel Android utilisateur séparé.

### Alignement des deux sentinelles historiques Rayon

- La CI RED de l'implémentation (`065ae8c10ff9a2288176dffc283b165aa458c254`, run `38299202413`) a détecté **deux attentes obsolètes** dans `capture-beam-four-stage-layout-v1.test.mjs` et `capture-beam-generic-ux-v1.test.mjs` : toutes deux exigeaient précisément l'ancien emplacement « 4 bis » adjacent à « Effets tactiques ». Leurs tests réels de restauration des 15 contrôles, des paramètres auteur et du modèle réversible restaient verts.
- Seules ces assertions de **placement** sont adaptées à la nouvelle demande : `Effets tactiques -> Mouvement -> Visuels (Rayon) -> Audio`. Les protections de non-duplication, les valeurs, l'import/export et l'essai de vrai changement Rayon/Projectile ne sont pas supprimés.
- Ces deux fichiers de sentinelles rejoignent le périmètre déclaré exclusivement pour cette correction de contrat UI ; la validation complète sera répétée sur le SHA exact final.

### Beam / Mouvement — résultat de code validé avant dernier gate

- Interface : un seul éditeur Rayon, sans « 4 bis », inséré dans la carte « Effets visuels » et masqué lorsque Style ≠ Rayon ; les trois phases déménagement des 15 champs canoniques dans `capture-editor-beam-stage-layout-v1.js` restent inchangées, ainsi que la réversibilité du modèle.
- Mouvement : mêmes options/attributs, mais labels checkbox flex avec case à gauche, cibles Surface/Aérien/Souterrain et Active/Réserve lisibles sur téléphone ; groupes compacts, touche et clavier conservés.
- RED de placement `489e81b47964664bf237882d301d2e7a5e4e1a5a` : `38299074138` FAILED attendu. Code `065ae8c10ff9a2288176dffc283b165aa458c254` : deux sentinelles historiques anciennes imposaient encore la carte `4 bis`, sans panne moteur. Elles ont été alignées sans supprimer les assertions runtime et sans toucher au JS.
- CI intégrale code + sentinelles `00a4facd0c4297101f63bd318fe21a6acf53def9`, run `38299425247` **SUCCESS** : foundation, Firestorm Chromium et bibliothèque créatures Chromium. Dernier gate CI à refaire sur le SHA documentaire puis checkpoint GREEN exact, FF protégé sur `gh-pages`, vérification CI/Pages après publication. Test visuel smartphone utilisateur à valider, non présumé.


## 2026-10-12 — Rayon 3 phases / préréglage inaccessible après déplacement Visuels

- Retour manuel utilisateur : Cast/Projectile/Impact mieux présentés, Mouvement amélioré, mais le préréglage complet Rayon antérieur paraît avoir disparu ; l'éditeur laisse surtout remarquer l'ancien champ « Départ du rayon (lié au lanceur) ». Objectif : retrouver **le même préréglage complet et réversible**, pas en créer un deuxième.
- Cause constatée : `data-skill-beam-pack-apply` et les 3 groupes de phases existent dans `data-skill-beam-stage-editor`, et `applyCaptureBeamVisualPackV1` règle Cast/beamStart/travel/impact. Depuis le précédent lot, ce panneau a `data-beam-active=false` si Style !== Rayon et le CSS masque **le panneau entier**, y compris son bouton de préréglage. Avant le déplacement, son bouton était visible quel que soit le Style.
- Base publiée : `480eeeab1f620df826679db04f68320a6a1cd4b5`, Laboratory CI `38300162723` SUCCESS, Pages `38300162244` SUCCESS. Checkpoint début `checkpoint/lab-start-beam-preset-discoverability-v1-2026-10-12`, branche `work/lab-beam-preset-discoverability-v1-2026-10-12`.
- Périmètre strict : **visibilité du panneau existant** dans Visuels ; bouton « Appliquer le modèle de rayon d'eau » accessible depuis toute forme de compétence, puis trois phases visibles quand Style = Rayon ; mode manuel Rayon aussi disponible ; préréglage et Undo inchangés. Source de vérité unique : `src/ui/capture-editor-beam-stage-layout-v1.js`, `src/ui/capture-editor-human-v2.js` et `src/ui/capture-editor-beam-visual-pack-v1.js` restent protégés.
- Fichiers autorisés : `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, `tests/unit/beam-preset-discoverability-v1.test.mjs`, documentation de ce lot.
- Protégés : aucun changement de timing, audio, sprites, valeurs auteurs, import/export, Runtime, combat, HUD, Mouvement, assets, `main`, `global-assets`, GenSrpG, Exploration.
- TDD : nouvelle sentinelle RED démontre que le CSS ne masque plus `data-skill-beam-stage-editor` en entier ; contrôle visibilité permanente des boutons pack/Undo, phases effectivement cachées hors style Rayon, une seule source de champs, conformité JS et pack complet réversible. Puis CI Node/Chromium, checkpoint GREEN sur commit testé et FF Pages sous lease ; test réel Android utilisateur distinct.

### Adaptation de sentinelle historique Rayon
- La CI du code révèle une unique attente de présentation devenue contradictoire dans `tests/unit/beam-movement-ui-v1.test.mjs` : l'ancien lot imposait de masquer **tout** le panneau si Style != Rayon. C'est précisément la régression UX reproduite ; les contrôles de vrai déplacement, d'unicité, de stages et de Mouvement restent valides.
- Extension de périmètre autorisée pour **cette seule assertion CSS** : `tests/unit/beam-movement-ui-v1.test.mjs`. Modifier l'attente en « bouton modèle visible à tout moment, phases masquées hors Rayon » ; aucune suppression des tests de non-duplication ni du contrôleur. CI complète exigée de nouveau.


### Rayon : récupération du bouton préréglé / code et protection
- Reproduction RED `e3a82caa40e2d99a656b6d24786505cb07e50991`, CI `38301177943` : échec attendu uniquement pour panneau totalement masqué hors Style Rayon.
- Correctif soustractif : suppression du seul sélecteur CSS qui masquait le conteneur `[data-skill-beam-stage-editor][data-beam-active="false"]`. Les `fieldset[data-beam-stage]` restent masqués hors Style Rayon par leurs attributs `hidden` et le layout canonique. Le bouton `Appliquer le modèle de rayon d'eau` et l'annulation restent visibles dans Visuels, y compris avec une forme Projectile : le contrôleur déjà présent sélectionne Rayon, synchronise les phases et applique le même pack trois sprites (Cast/départ, corps, impact).
- Description HTML clarifiée : modèle complet prêt, emplacement dans Visuels, choix d'assets personnalisables, alternative manuelle en sélectionnant Style Rayon.
- Code `9388cea41dded4b5f75110e8b9549d571183d4d6`, titre existant conservé par `d2fe59db3d27fa6da9c8962c005d95a92e303f72` ; CI `38301311976` déclare une seule sentinelle historique obsolète, rectifiée `fea35cab497c662a48684191f9e1c9c9719bb653` : elle protège désormais la visibilité du bouton et le masquage des phases, sans supprimer les tests de mouvement/raccord.
- Aucun changement dans le JS, la logique du pack, les assets, dégâts, sockets, Audio ou fichiers de capacités. Publication uniquement après CI exacte du commit final et checkpoint GREEN ; validation Android à confirmer, indépendamment du gate technique.


## Lot Labo Combat — raccord icônes Air du catalogue global, 2026-10-13

- Mission utilisateur : Rafale/Souffle/Attaque aérienne en style cartoon marron, fond clair, ajout GitHub et raccord au labo combat.
- Bibliothèque GREEN publiée : `global-assets@6f0b006693d672c20a79d93d32582205fa3eed64` (3 WebP, catalogue 138 assets/49 icônes, CI assets SUCCESS).
- Base labo `gh-pages` : `ffd0318fb7b45ae1fd2a1caab6c9711e12d6c818`; checkpoint départ `checkpoint/lab-start-capture-air-icon-bindings-v1-2026-10-13`; work `work/lab-capture-air-icon-bindings-v1-2026-10-13`.
- Propriétaire : SkillPresentationBinding / résolveur de bibliothèque ; modifier exclusivement deux bindings `lib_gust` et `cap_air_atk_3`, cache-buster canonique, tests et documents. `Souffle` reste disponible dans l'éditeur sans auto-binding.
- Protégés : gameplay (dégâts/énergie/effets), autres compétences, créatures, FX, mouvement, Combat Core, fichiers HTML, `main`, `Zombicide-40k`, Exploration.
- Tests : vrais transferts JSON, `createCaptureSkillPresentationAssetsV2`, résolveur canonique et chemins WebP ; CI générale au SHA exact, checkpoint GREEN et fast-forward sous lease.
- Risque : cache versionné, utilisateurs ayant des sauvegardes préexistantes, test visuel Android restant ; aucun écrasement de sauvegarde.
- Statut : EN COURS jusqu'à CI + checkpoint, validation smartphone distincte.

### Compatibilité des sentinelles d'exports auteurs (2026-10-13)

- CI initiale `38336429864` : 1596/1598 tests Node, seules deux sentinelles de SHA historiques ont échoué suite au remplacement demandé des IDs d'icône de Rafale et Charge aérienne. Tests moteur/compétences/Chromium non en cause.
- Périmètre additionnel limité : `tests/unit/capture-ailevent-rafale-author-v2.test.mjs`, `tests/unit/capture-air-dual-skill-import-v1.test.mjs` ; normaliser **uniquement** le nouvel `assetId` d'icône vers l'ancien pour calculer le SHA historique et conserver tous les autres octets d'auteur intacts ; affirmer également les nouvelles icônes en runtime.
- Les deux JSON auteurs sont restitués sans newline final, comme à l'origine. La seule différence d'octets demeure l'`assetId` de l'icône. CI complète à refaire, GREEN suspendu jusque-là.


## 2026-10-13 — Projectile Mirror V1 — chantier ouvert, non livré

- Base exacte : `ffd0318fb7b45ae1fd2a1caab6c9711e12d6c818` (checkpoint `checkpoint/lab-beam-preset-discoverability-v1-green-2026-10-12` ; Laboratory CI `38301685502` SUCCESS ; Pages `38301682440` SUCCESS).
- Checkpoint de départ, posé AVANT toute modification : `checkpoint/lab-start-projectile-mirror-v1-2026-10-13` sur ce SHA.
- Branche isolée : `work/lab-projectile-mirror-v1-2026-10-13`.
- Objectif : statut bénéfique Miroir activable par capacité, renvoi réel d'un projectile droit éligible depuis le contact visible, trajectoire inverse et collision réelle, dégâts seulement après contact avec le lanceur, attribution au défenseur, protections/esquives/clash respectés. Aucun changement de `damage_reflection`.
- Owners : `StatusEffectV1` pour la configuration du statut, `CombatRuntime` / `CombatSession` et `ActionResolver` pour le timing et les dégâts, `ProjectileClash` pour les collisions inter-projectiles, `CombatResolutionPresenter` + `DomSkillFx` comme simples consommateurs visuels, `Human Editor` pour la saisie. Pas d'autre moteur ni boucle ad hoc.
- Fichiers autorisés si le défaut y est reproduit : `src/contracts/status-effect-v1.js`, `src/core/combat/{action-resolver,combat-runtime,combat-session,projectile-clash}.js`, `src/adapters/renderer/{combat-resolution-presenter,dom-skill-fx}.js`, `src/core/fx/skill-fx-plan.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, `tests/integration/projectile-mirror-real-flight-v1.test.mjs`, tests sentinelles impact/clash/protection/présentation, et docs du lot.
- Protégés : `main`, `global-assets`, `Zombicide-40k`, Exploration, données capacités et créatures auteur, préréglage Rayon, 103 créatures, esquive aérienne/souterraine, projectiles fixes tombant du ciel, protections `immunity`, `damage_reflection` et tous les import/exports.
- Contrat minimal : miroir intercepté par le propriétaire Combat Rules au point de contact, aucun PV retiré à cet instant ; le projectile effectue un vrai trajet de retour avec une collision distincte ; aucun dégât sans contact ; une limite déterministe de renvois garantit l'arrêt même avec deux miroirs ; en 2v2 le projectile revient uniquement à son lanceur réel ; les dégâts et crédits passent par `applyCombatDamageV1`.
- TDD : d'abord RED nouveau test de vrai Runtime (cast miroir -> projectile direct -> contact défenseur -> retour -> contact lanceur), puis implémentation ; sentinelles projectile direct/skyfall, clash, KO, statuts/immunités, combat 1v1/2v2, intégration Presenter/DomSkillFx et Chromium de l'éditeur ; CI intégrale et Pages seulement après GREEN.
- Risque élevé : `reaction.reflectForms` est actuellement un renvoi de dégâts instantané au premier impact et `damage_reflection` est indépendant ; interdiction de maquiller l'un ou l'autre en animation sans collision de retour. Pas de publication de code inachevé, ni de checkpoint GREEN sans trajet réellement démontré.


### Projectile Mirror V1 — contrôle technique et demande de validation Android

- Contrat distinct `StatusEffectV1.projectile_mirror` disponible depuis le Human Editor ; le renvoi `damage_reflection` en pourcentage et l'ancien `reaction.reflectForms` sont conservés sans modification fonctionnelle.
- Le même `CombatRuntime` ordonnance le trajet inverse ; origine = point de contact réel du projectile sur le masque de la cible, puis nouvelle collision réelle au retour avant le calcul des dégâts. Maximum deux rebonds successifs, pas de dégâts si retour sans collision. Les tirs `fixed_point` sont exclus du lot.
- 1v1 / 2v2, aucun dégât prématuré, KO attribué à la créature miroir, double miroir borné, projectile clash et métadonnées du point d'impact : tests réels `tests/integration/projectile-mirror-real-flight-v1.test.mjs` + sentinelles de collisions mises à jour.
- RED initial : `4db9fde751593848c879039ef8d76e50a9b08f4c` / CI `38335885725` (3 échecs attendus).
- GREEN sur implémentation et rapport `d8302aecfb9e6ea67b2ba48b915876efe5cb8542` / Laboratory CI `38337068176` : SUCCESS, 1603 / 1603 tests Node, creature-library-browser SUCCESS, Firestorm Chromium SUCCESS.
- Revue de périmètre : uniquement `src/contracts`, `src/core/combat`, `src/core/fx`, `src/adapters/renderer`, `src/ui/capture-editor-human-v2.js`, sentinelles et documentation. Aucun fichier auteur ni branche `main` / `global-assets` / dépôt tiers touché. Rapport : `docs/LAB_PROJECTILE_MIRROR_V1.md`.
- Publication de la preview sur `gh-pages` autorisée seulement si le SHA final avec cette mise à jour documentaire passe la CI, que le checkpoint GREEN corresponde exactement, et que l'avance de `gh-pages` est fast-forward avec vérification Pages SUCCESS.
- **Validation utilisateur smartphone paysage toujours attendue** : aucun GREEN utilisateur avant essai visuel en combat du renvoi.


## 2026-10-13 — Immatériel V1 — lot séparé, EN COURS

- **Décision auteur** : Miroir V1 reste `GREEN technique / validation Android paysage EN ATTENTE` ; ne pas exiger un essai immédiat et ne pas le qualifier de validé utilisateur.
- **Source LIVE** : `gh-pages` `1e2595916b68467cca4b6f73395b89ac77b52ec3` ; CI `38337440979` SUCCESS, déploiement Pages `38337440781` SUCCESS. Checkpoint technique Miroir `checkpoint/lab-projectile-mirror-v1-green-2026-10-13` sur le même SHA ; CI du checkpoint `38337438018` a eu un timeout Chromium non reproduit sur la CI publiée.
- **Checkpoint de départ exact** : `checkpoint/lab-start-intangible-v1-2026-10-13` créé sur `1e2595916b68467cca4b6f73395b89ac77b52ec3` AVANT travaux.
- **Branche dédiée** : `work/lab-intangible-v1-2026-10-13`. Aucun travail sur main, global-assets, Zombicide-40k ou Exploration.
- **Objectif** : statut Immatériel temporaire via l'Immunity Status natif (immunité dégâts + états négatifs), avec capacité explicitement marquée `hitsIntangible` apte à atteindre les êtres immatériels. Les protections ordinaires restent efficaces même contre ces capacités ; buffs positifs, durée/expiration, roster actif/réserve et KO ne doivent pas régresser.
- **Autorité unique** : StatusEffectV1 et SkillDefinition pour contrats ; `combat-protection-v1` pour décision ; `applyCombatDamageV1`, `applyStatusEffectV1`, ActionResolver, ImmediateTacticalEffects, zone/effets différés/ticks DoT réutilisent exclusivement les propriétaires actuels ; Human Editor est un consommateur/éditeur de contrats sans décision de combat.
- **Fichiers autorisés** : `src/contracts/{status-effect-v1,skill-definition}.js`, `src/core/combat/{combat-protection-v1,combat-damage-application-v1,status-effect-runtime-v1,status-effect-instance-v1,action-resolver,immediate-tactical-effects-v1,persistent-zone-runtime-v1,scheduled-effect-runtime-v1,combat-session}.js`, `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, tests ciblés `tests/integration/intangible-status-v1.test.mjs` et sentinelles existantes directement affectées, présent journal et rapport de lot.
- **Protégés** : Miroir réellement projectile, `damage_reflection`, immunity ancienne non-intangible, boucliers, projetiles droits/skyfall, esquive/présence, 1v1/2v2, équipe/réserve, bibliothèques des 103 créatures et exports JSON auteur, préréglage Beam, CI et Pages. Aucun visuel non demandé ni refonte générale.
- **TDD RED** : contrat/status, ordre protection/bouclier, attaques directes/tactiques/zone/DoT, impact de capacité explicitement admise, buff bénéfique, expiration, coexistence avec immunité générale, miroir et KO/crédits, 1v1/2v2/réserve ; tests avant code, puis CI complète Foundation et Chromium.
- **Critères de fin technique** : tous sentinelles GREEN au SHA final, documentation vraie chaîne, checkpoint GREEN exact, publication uniquement fast-forward protégé du `gh-pages` si base inchangée puis vérification CI/Pages. Tests Android utilisateur et feedback visuel optionnel séparés. Pas de déclaration GREEN prématurée.


### Immatériel V1 — clôture du code, portes de publication

- TDD RED au commit `d3df9dd65f414cfbfb298d6497f9a2beb75d89d9` : Laboratory CI `38343286956` FAILURE attendue sur les contrats non encore implémentés.
- Contrats et unique source de vérité : `StatusEffectV1.immunity.intangible=true`, domaines damage + negative_status ; `SkillDefinition.hitsIntangible` explicitement opt-in et faux par défaut. `combatProtectionForIncomingV1` distingue l'immunité Immatériel des immunités standards ; aucun second moteur d'états, timer ou dégâts.
- Raccordés au même owner : hit direct/reflected dans Action Resolver, dégâts/statuts tactiques, DoT via instance native, zone persistante et effet programmé via records existants. Le stun historique sans dégâts consulte désormais la protection aux états négatifs.
- UI : une case « Immatériel » sur la fiche du statut Immunité force la polarité bénéfique et les deux domaines ; une case indépendante par compétence autorise à toucher une cible immatérielle. Le Human Editor importe/exporte exclusivement les contrats canoniques. 103 créatures et médias auteur inchangés.
- Tests réels `tests/integration/intangible-status-v1.test.mjs`, puis CI intégrale au commit de code `b412be59599de39bb3f9146c2ea9783c26c26fcc` : run `38343710483` SUCCESS, Foundation + Firestorm Chromium + bibliothèque créatures Chromium. Rapport `docs/LAB_INTANGIBLE_V1.md`, commit documentaire `53f3732f1fe5e082e254ebbc077c64a8cf3203c3`, run `38343767667` SUCCESS (les trois jobs).
- **Sortie technique conditionnée** à checkpoint GREEN sur SHA exact du dernier journal CI SUCCESS, fast-forward sous lease sur `gh-pages`, puis CI/Pages post-publication SUCCESS.
- **Miroir V1 : validation Android paysage EN ATTENTE à la demande de l'auteur. Immatériel V1 : validation utilisateur elle aussi EN ATTENTE ; aucun GREEN utilisateur présumé.** La future animation/feedback de traversée est un autre lot, non livré.


## 2026-10-13 — Stacks à seuil V1 — lot autonome OUVERT

- Demande auteur : seuil configurable sur une accumulation native, effets positifs/négatifs multiples au seuil (dégâts, soin PV, drain/restauration énergie, statut buff/debuff, nettoyage/dissipation) selon les primitives existantes, sans inventer le vol de vie proportionnel qui reste un lot distinct.
- Base exacte LIVE `gh-pages` `47ef1b07d9ec537ceacc7d11e3353c54e8cf6807`, CI `38343981186` SUCCESS et Pages `38343980753` SUCCESS. Checkpoint départ `checkpoint/lab-start-stack-threshold-v1-2026-10-13` posé AVANT toute modification ; branche `work/lab-stack-threshold-v1-2026-10-13`. Miroir et Immatériel conservent leur validation utilisateur Android EN ATTENTE.
- Source de vérité : `StatusEffectV1.stacking/maxStacks` et instances status du seul `Status Effect Runtime`. Contrat optionnel `onStackThreshold: {count, consume, effects}`. Effets normalisés selon `SkillEffectV1`, exclusivement la chaîne native `Immediate Tactical Effects`, pas d'autre HP/énergie/horloge/statut. Déclenchement seulement lors du franchissement réel (y compris la première application pour seuil 1), jamais à chaque refresh ou au plafond.
- Sémantique : `consume=reset` supprime l'instance quand le seuil est atteint avant exécution des effets ; `consume=keep` conserve les charges mais ne se déclenche qu'au franchissement strict inférieur→supérieur/égal. Le propriétaire Combat Status exécute au maximum un lot d'effets par ajout de charge, après validation, et protège les chaînes récursives.
- Cibles : `target` = porteur du statut, `self` = source de l'application ; pas de scopes équipe/réserve pour ce lot, pas de générateur supplémentaire de zones. Fonctions autorisées : dégâts, heal, énergie ±, apply_status, cleanse, dispel. Un K.O. via dégâts normaux continue de respecter immunités/boucliers et attribution.
- Autorisés : `src/contracts/{status-effect-v1,skill-effect-v1}.js` (si nécessaire), `src/core/combat/{status-effect-runtime-v1,immediate-tactical-effects-v1}.js`, `src/ui/capture-editor-human-v2.js`, tests `tests/integration/stack-threshold-v1.test.mjs` et sentinelles directement concernées, `docs/LAB_STACK_THRESHOLD_V1.md`, présent journal, éventuellement HTML/CSS uniquement si nécessité UI démontrée.
- Protégés : `main`, `global-assets`, `Zombicide-40k`, Exploration, 103 fiches créatures et capacités auteurs, Miroir/Immatériel, Rayon, collision, Damage Application, Roster Session, règles de réserve, HUD existant. Ne pas augmenter les responsabilités des renderers.
- TDD : RED/CI contrat/1er stack/seuil/conservation/réinitialisation/idempotence, effets existants, positif/négatif, immunité/KO/DoT, 1v1/2v2, import/export éditeur ; puis GREEN Foundation + Chromium sur SHA exact, checkpoint GREEN strict, fast-forward protégé gh-pages et CI/Pages post-publication. Essai utilisateur mobile distinct.

### Extension de périmètre sentinelle HUD — affichage de progression uniquement

- Besoin directement issu du backlog stacks : rendre le seuil visible sans second compteur. Autorise uniquement `src/adapters/renderer/dom-status-fx.js` pour remplacer l'indication actuelle des stacks par `actuels / seuil` si `onStackThreshold` existe. Ce composant lit exclusivement `Status RuntimeInstance.definition` et `instance.stacks`, sans jamais calculer ou incrémenter une charge. Aucun changement de HUD pour les statuts sans seuil ni du moteur de présentation/timers. Ajouter une sentinelle dédiée dans `tests/unit/stack-threshold-hud-v1.test.mjs`; repasser les tests Chromium de la bibliothèque et de Firestorm. Le reste du HUD demeure protégé.


### Stacks à seuil V1 — implémentation et vérifications réalisées

- Source code : le status V1 autorise `onStackThreshold` et le kind pur `stack_counter`. Test RED `65a58f4d9af5e876e7467b768aad95a608c68098` / CI `38361044445` (échec attendu), puis implementation avec une seule autorité d'instance et l'exécuteur des effets tactiques existants.
- Déclenchement seulement au franchissement strict : `reset` consomme le statut avant l'effet, `keep` garde les charges sans rafale au plafond ; antirécursion et sortie des événements de dégâts/soin/énergie via le flux tactique. Le canal natif des dommages garde les immunités et le crédit KO.
- Auteur : panneau par statut stack avec seuil entier, choix reset/keep, ajout/retrait de plusieurs effets (dont buff/debuff et énergie), et statut compteur neutre ; `configuredSkills` et contrats import/export restent uniques. Affichage HUD `stacks/seuil` depuis `instance.stacks` existant, uniquement si seuil explicite.
- Extension de périmètre HUD autorisée et notée AVANT modification. Aucun média ni fichier auteur touché ; miroir, immatériel, ciblage/rayon, roster et autres dépôts protégés.
- Test `tests/integration/stack-threshold-v1.test.mjs` et sentinelle `tests/unit/stack-threshold-hud-v1.test.mjs`. CI de code exacte `103627884ea8269fb9c995b1cc06d61605a7e36a` / run `38362418910` : **SUCCESS**, 1629/1629 Node, creature-library-browser Chromium SUCCESS, firestorm-zone-growth-browser Chromium SUCCESS.
- Rapport `docs/LAB_STACK_THRESHOLD_V1.md`. Gate final : CI complète sur le SHA **documentaire** courant, checkpoint `checkpoint/lab-stack-threshold-v1-green-2026-10-13` sur ce SHA exact, vérification fast-forward `gh-pages` avec lease et CI/Pages post-déploiement. **Validation manuelle Android distincte, EN ATTENTE** (y compris Miroir/Immatériel). Le drain de vie proportionnel reste un lot indépendant.


## 2026-10-13 — Reflet sélectif / Armure de pointes V1 — lot isolé OUVERT

- Demande auteur : filtrer le renvoi par attaque de contact, projectile, rayon, zone et autres ; permettre l'Armure de pointes qui riposte aussi au contact sans PV perdus ; distinguer la riposte à l'entrée dans une zone, sans toucher au vrai `projectile_mirror`.
- Source LIVE `gh-pages` `c66d26f212ed0c6bb878d2e910308e508acc12b0` ; Laboratory CI `38363010994` SUCCESS et Pages `38363010608` SUCCESS. Checkpoint initial `checkpoint/lab-start-reflection-trigger-v1-2026-10-13` créé avant tout changement, branche unique `work/lab-reflection-trigger-v1-2026-10-13`.
- Contrats : `StatusEffectV1.damage_reflection` continue par défaut de renvoyer un % des PV réellement perdus de **toutes** les sources, pour préserver les exports. Extensions optionnelles : filtre explicite par forme/source et riposte de contact fixe, qui déclenche une seule fois sur impact contact touchant, même absorption complète. Zone : utiliser la détection d'entrée déjà autoritaire du `persistent-zone-runtime` et son `tickEffect:damage` ; pas de deuxième moteur ou zone implicite créés par un status.
- Owner unique : `combat-damage-application-v1` gère le dommage réellement subi et la contre-application, `ActionResolver` transmet le contexte d'attaque et le contact effectif ; `PersistentZoneRuntime` conserve les entrées et sa propre logique de dégâts ; `Human Editor` configure le Status canonique. Le `projectile_mirror` demeure indépendant.
- Périmètre autorisé : `src/contracts/status-effect-v1.js`, `src/core/combat/{combat-damage-application-v1,action-resolver,immediate-tactical-effects-v1,persistent-zone-runtime-v1,status-effect-runtime-v1}.js`, `src/ui/capture-editor-human-v2.js`, tests d'intégration ciblés, `docs/LAB_REFLECTION_TRIGGER_V1.md`, journal actuel. Extension uniquement si une sentinelle échoue et cause prouvée.
- Protégés : `main`, `global-assets`, Exploration, `Zombicide-40k`, 103 créatures, capacités et médias auteur, imports historiques, HUD, `projectile_mirror`, immunités et boucliers, projectile direct/skyfall, rayon, ciblage 1v1/2v2, KO et Roster Session.
- RED avant code, tests d'inclusion/exclusion et compatibilité historique, riposte contact sur bouclier et sans dégâts, évitement, limite antiréflexion, miroir, zones et 2v2. CI Foundation + deux Chromium et checkpoint GREEN exact, publication FF sous contrôle SHA, puis CI/Pages post-publication ; validation utilisateur Android paysage distincte et toujours en attente.

### Retour utilisateur — Stacks à seuil, 13 octobre 2026

- L'auteur confirme explicitement avoir testé et **validé** le système de stacks livré au SHA `c66d26f212ed0c6bb878d2e910308e508acc12b0`. Le lot `stack-threshold-v1` passe donc son jalon de validation utilisateur pour le fonctionnement testé. Cela ne valide ni Miroir ni Immatériel, qui restent en attente de leurs essais.
- Ce retour est consigné ici à titre de gouvernance uniquement ; aucune mécanique de stacks n'est modifiée dans le chantier actuel.


### Reflet sélectif / Armure de pointes V1 — code, sentinelles, état de sortie

- RED contrat et vraie chaîne : `ae199576dfee5bfdbe82346ac0c708a9100f73cc`; les propriétaires Combat Damage, ActionResolver et PersistentZone sont étendus sans créer de compteur ni de boucle concurrents.
- `StatusEffectV1.damage_reflection` : option `incomingKinds` (par forme/source), `contactDamage` sur attaque de forme `contact` réellement touchante, même si bouclier a tout absorbé. Ancien statut sans option = renvoi proportionnel pour toutes sources sur PV réellement perdus uniquement. `SkillEffectV1.persistent_zone.damageTrigger="entry_only"` rend la zone punitive sensible à l'entrée effective, sans les ticks supplémentaires.
- UI Human Editor : types d'attaques, dégâts fixes, et déclenchement d'une zone uniquement à l'entrée ; statut principal, statut imbriqué de stacks, et zone à statut utilisent le même contrat. Import/export classiques préservés, aucune fiche auteur réécrite.
- Régression réelle du premier montage navigateur : `reflectionContactDamagezone-status` n'était pas une clé valide de `DOMStringMap`, empêchant le montage complet de la bibliothèque (seulement une option statique). Fix à la source `09bfbee6551e05938c3700a2ce6ad36f6f3ce96b`, aucune donnée de créature manquante. Extension justifiée de `tests/browser/capture-creature-library-smoke.mjs` pour rapporter l'erreur de bootstrap et l'état du catalogue lors d'un échec, sans réduire les assertions des 103 IDs.
- Test étendu `tests/integration/selective-damage-reflection-v1.test.mjs`, comprenant la vraie entrée de zone, absence de reticks et roundtrip Human Editor. CI de code `57d24f22597c0ad33b7501847dc17e7ce165b440`, run `38378030619` **SUCCESS**, **1637/1637 tests Node**, deux Chromium **SUCCESS**.
- Rapport : `docs/LAB_REFLECTION_TRIGGER_V1.md`. Publication encore conditionnée à CI sur SHA documentaire exact, checkpoint GREEN sur même SHA, publication fast-forward avec lease et CI/Pages post-publication SUCCESS ; validation Android par l'auteur distincte et non présumée.


## 2026-10-13 — Téléportation esquive projectile direct V1 — micro-lot isolé OUVERT

- Retour auteur : une attaque de forme téléportation continue à subir les dégâts de Boule de feu alors que la téléportation est activée ; ne pas toucher au chantier Drain de vie avant vérification. Un autre fil peut déposer des fichiers simultanément : interdiction de publier sur une base concurrente non vérifiée, aucune modification des fichiers auteurs/assets/UI.
- Base exacte LIVE `gh-pages@9ecda9e80fd5ae5097dc60da480f7cb19e419477`, CI `38378716305` et Pages `38378716289` SUCCESS ; checkpoint départ `checkpoint/lab-start-teleport-direct-projectile-evasion-v1-2026-10-13` posé avant code, branche dédiée `work/lab-teleport-direct-projectile-evasion-v1-2026-10-13`.
- Cause vérifiée : `mobilityEvasionFor` ne protège un projectile **direct** que si le skill téléportation déclare explicitement `evasion.incomingForms:[projectile]` ; la règle implicite de mouvement ne concerne que les projectiles `fixed_point`. Les capacités auteurs de téléportation dépourvues du champ optionnel sont donc vulnérables pendant leur disparition.
- Contrat cible minimal : `approachMode:teleport`, action skill concurrente active, phase `releaseAtMs <= elapsedMs < impactAtMs`, projectile offensif direct -> `evaded` par Combat Rules. La préparation n'est pas protégée, à l'instant de réapparition le projectile peut toucher, les déplacements ground/aerial/burrow restent inchangés, la chute `fixed_point` conserve ses règles.
- Unique owner `src/core/combat/action-resolver.js`; `CombatRuntime` ne fait que fournir l'action et son horloge, `CombatSession` et `Combat Damage` inchangés. Source de vérité unique, sans statut/timer/UI parallèle. Aucun ID de compétence reconnu.
- Fichiers autorisés : `src/core/combat/action-resolver.js`, `tests/integration/teleport-direct-projectile-evasion-v1.test.mjs`, `docs/LAB_TELEPORT_DIRECT_PROJECTILE_EVASION_V1.md`, présent journal. Sentinelles mobility/presence/mirror/skyfall/zone inchangées ; pas de modification des anciens tests.
- Protégés : `main`, `global-assets`, GenSrpG `Zombicide-40k`, Exploration, travail concurrent, tous les assets et JSON de créatures/capacités, bibliothèque 103 créatures, stats, sources et sentinelles des autres lots, Miroir, Immatériel et Stacks validés, UI et renderer.
- TDD RED puis GREEN : tests réels avec la chaîne `CombatRuntime -> CombatSession -> ActionResolver`, projectile direct contre téléport actif sans option d'esquive, vulnérabilité avant release et après impact, esquives non modifiées pour ground/aerial, retours historiques. CI Foundation et les deux Chromium sur SHA exact, checkpoint GREEN, publication uniquement si `gh-pages` est toujours le SHA `9ecda9e80fd5ae5097dc60da480f7cb19e419477` et avance fast-forward sous lease ; vérifier CI/Pages après publication. Validation visuelle Android utilisateur distincte.


### Téléportation / Boule de feu — TDD et sentinelles

- TDD RED `3dd0fe8904aeda8d312bc51c142a0780dc07a41b`, CI `38379623276` : **2 échecs attendus** (teleport sans option d'esquive pendant son travel, 1v1/2v2), 1642 autres tests PASS ; le code historique touchait effectivement pendant la disparition.
- Réparation minimale unique dans `action-resolver.js`, `mobilityEvasionFor` : projectile offensif direct contre téléportation réellement dans la fenêtre `releaseAtMs <= t < impactAtMs` -> `evaded` avec raison `teleport_vanish`. Aucun élargissement ground/aerial ; avant release et après impact, l'attaque reste touchante ; les tirs fixed_point conservent l'ancienne règle.
- Code `0edbddd67a83764d48a1df62e8b12d567815fb5d`, Laboratory CI `38379737449` **SUCCESS** : 1644/1644 Node, Firestorm Chromium SUCCESS, créatures Chromium SUCCESS. Aucune fiche auteur/sprite/son/HTML modifiée.
- Rapport `docs/LAB_TELEPORT_DIRECT_PROJECTILE_EVASION_V1.md`. Portes obligatoires : CI exacte sur dernier SHA documentaire, checkpoint technique GREEN même SHA, `gh-pages` toujours sur base non concurrencée ou sinon ne pas publier, FF avec lease, CI/Pages post-publication SUCCESS. Validation smartphone utilisateur distincte.


## 2026-10-13 — Consommateur Labo Combat : rayon électrique jaune
- Base live gh-pages : 24f66890b29b03e957e8a4a0a32b4ffdda802282 ; checkpoint de départ checkpoint/lab-start-electric-beam-yellow-consumer-v1-2026-10-13, work/lab-electric-beam-yellow-consumer-v1-2026-10-13.
- Autorité du média déjà GREEN : global-assets@ffed974c51d58d59a2e5cf20fd9eca00d76ec111, CI assets 38380599014 SUCCESS, catalogue unique 141 assets / 76 sprites.
- Périmètre exclusif : révision cache src/assets/global-visual-library.js v30, test des trois IDs/sprite-strip et du vrai résolveur de présentation, ajustement non-régressif de sentinelle ancienne Air, présent journal et rapport. Aucun HTML, FX Engine, Combat Core, compétence existante, 103 créatures ou autre dépôt ne doit être modifié.
- But : les 3 sprites deviennent disponibles par les champs existants de l'éditeur : cast, travel/corps, impact, avec form=beam ; ne pas imposer une nouvelle compétence à l'auteur ni toucher au Jet pressurisé. BeamStart reste optionnel/non fourni.
- Gates : CI sur SHA final exact, checkpoint GREEN, fast-forward gh-pages sous lease si aucun travail concurrent, CI+Pages SUCCESS sur SHA publié, test visuel Android distinct.


## 2026-10-13 — Drain de vie V1 — lot indépendant OUVERT

- Accord auteur après validation Stacks / Reflet / correctif Téléportation, avec réserve explicite de reprendre **la dernière base incluant les assets Rayon électrique jaune**. Base unique LIVE `gh-pages@6ff05a15d388136511cf054cdc16231921de52da` (CI `38380995053` SUCCESS et Pages `38380994694` SUCCESS). La base comprend le commit rayon électrique et son cache `v30-capture-electric-beam-yellow`, owner média `global-assets@ffed974c51d58d59a2e5cf20fd9eca00d76ec111` avec Cast 20 frames, Corps 12, Impact 12. Aucun média copié ni modifié.
- Checkpoint de départ `checkpoint/lab-start-life-steal-v1-2026-10-13` avant code ; branche `work/lab-life-steal-v1-2026-10-13`. Pas de travail sur main/global-assets, Zombicide-40k, Exploration ni assets de capacités/créatures.
- Objectif V1 : effet de compétence `SkillEffectV1.kind:"life_steal"` avec pourcentage configurable de la **perte réelle de PV** (après bouclier/immunité/résistance, overkill plafonné), plafond de soin optionnel **par utilisation**, déclenché uniquement après un hit natif de l'action courante. Le propriétaire des PV reste le `CombatState.withFighterHp` et les événements `heal` existants. Aucun nouveau moteur d'énergie, chronomètre ou retour visuel.
- Chaîne de vérité : `ActionResolver` fournit `appliedDamage` de l'impact normal à `ImmediateTacticalEffects`, qui agrège également les dégâts tactiques de la même exécution, applique UNE FOIS le soin sur l'acteur et l'émet via `heal` après tous les autres effets. Reflets, thorns, tir raté, statut, Dot, dégâts de zone persistante, effets différés et attaque renvoyée ne gonflent jamais cette valeur. Le cas multi-cible sur effets immédiats est pris en charge. Le modificateur ne ressuscite pas un lanceur KO.
- Le type `life_steal` est distinct de `energy_drain` et `heal`. Contrat `targetScope:"self"`, `percent` entre 0 et 100 ; `maxHeal` optionnel positif. Il ne porte pas de `amount` fixe. Les anciennes capacités sans cet effet restent identiques, aucune conversion implicite de données auteur. UI Human Editor : effet dédié avec pourcentage et plafond ; import/export V1 identique.
- Périmètre autorisé : `src/contracts/skill-effect-v1.js`, `src/core/combat/{action-resolver,immediate-tactical-effects-v1}.js`, `src/ui/capture-editor-human-v2.js`, `tests/integration/life-steal-v1.test.mjs`, sentinelles directement concernées si nécessaire, `docs/LAB_LIFE_STEAL_V1.md`, présent journal. `combat-damage-application-v1.js` / `global-visual-library.js` strictement protégés.
- TDD RED contre tests de normalisation, soin effectif, overkill, boucliers, immunités, ratés, multi-cible, taux/plafond, KO, reflet et 1v1/2v2 ; GREEN Foundation et deux Chromium ; checkpoint exact ; publication fast-forward sous lease **seulement si la base actuelle est inchangée**, sinon fusion/rebase documentée sans écrasement concurrent. Validation Android séparée.


### Drain de vie V1 — exécution et portes de sortie

- Base validée `6ff05a15d388136511cf054cdc16231921de52da` inclut bien raccord et cache du **rayon électrique jaune v30**, owner `global-assets@ffed974c51d58d59a2e5cf20fd9eca00d76ec111`. La branche est isolée, sans modification de l'owner média, de ses fichiers, de Jet pressurisé ou des 103 créatures.
- TDD RED `e97b2af934387102ca4210ee8289b06ef13b0e8f` ; implémentation sous contrats de skill, ActionResolver et propriétaire tactical existants ; panneau UI dédié, aucune autorité de dégâts ou PV nouvelle.
- `life_steal` : `targetScope:self`, `percent` 0..100, `maxHeal` facultatif ; soin final depuis `appliedDamage` du hit direct + dégâts tactiques immédiats de l'action, cumulé 1v1/2v2 ; exclusions miroirs/dots/zones/reflets, no revive si KO, bouclier/immunité et overkill respectés.
- Sentinelle `tests/integration/life-steal-v1.test.mjs` : dégâts réels, multi-cible, overkill, cap, résistance du bouclier, immunité, retour miroir, riposte mortelle, absence de régression dans le formulaire. Code de sentinelles `168ddc221a5b61b9ea99f4e0d36cafdd58b23548` ; CI `38394157011`, Foundation **1656/1656 PASS**, attente du contrôle final Chromium bibliothèque. Rapport `docs/LAB_LIFE_STEAL_V1.md`.
- La CI et les deux Chromiums sur le SHA final documentaire restent obligatoires avant checkpoint GREEN et avant avance contrôlée de gh-pages. Ne pas publier si autre fil a déplacé la base sans revue.


## 2026-10-13 — Réserves Capture : portraits visuels V1 — prochain lot autorisé

- Décision auteur : Drain de vie V1 demeure GREEN **technique uniquement**, impossible à tester manuellement actuellement ; classé avec Miroir réel, Immatériel et Armure de pointes dans les **validations utilisateur encore à confirmer**, sans aucune réouverture de ces mécaniques. Stacks à seuil conserve sa validation utilisateur. Mobilité Tempo a déjà été réalisé auparavant selon l'auteur : ne pas en faire le prochain chantier.
- Base LIVE contrôlée : `gh-pages@e4a53d82c79f88692f904b73e1a7660680639a08` ; Laboratory CI `38394748761` et Pages `38394747659` SUCCESS.
- Checkpoint initial avant code : `checkpoint/lab-start-reserve-portraits-v1-2026-10-13` ; branche dédiée `work/lab-reserve-portraits-v1-2026-10-13`.
- Besoin : afficher le portrait existant de chaque créature des réserves locales/alliées/adverses à côté de son nom/PV dans les panneaux de roster et réserve adverse, y compris après KO/swap. Rester compact en paysage smartphone ; en cas de portrait absent, conserver la ligne texte utilisable, sans faux asset.
- Propriétaires : `Roster Session` reste seule source de vérité pour membre, PV, sélection, KO et roster. `Visual Creature Descriptor` fournit l'icône par ID de créature. UI actuelle projette des thumbnails sans créer de moteur/registre, modifier aucune mécanique de cible ou rappel.
- Périmètre autorisé pour V1 : `src/ui/capture-combat-roster-controller-v1.js` (présentation des réserves), `src/ui/combat-2v2-test-ui.js` (injection du descripteur existant), `examples/dom-demo/capture-editor-v2.css` (style compact), nouvelles sentinelles `tests/unit/capture-reserve-portraits-v1.test.mjs`, `docs/LAB_RESERVE_PORTRAITS_V1.md` et ce journal. Extensions seulement après cause démontrée.
- Protégés : `main`, `global-assets`, `Zombicide-40k`, labo Exploration, rayon électrique jaune V30, 103 fiches créatures et capacités, autres assets, Combat Rules/Session/Runtime, Roster Session, effets et ciblage reserve V1/V2, compétences et HUD actif.
- TDD RED avant code, GREEN Node et deux Chromium en CI au SHA exact ; checkpoint GREEN, publication fast-forward protégée sur `gh-pages` après recontrôle de concurrence et CI/Pages post-publication ; essai réel Android paysage distinct.

### Backlog ultérieur, **ne pas implémenter dans ce lot** — Contrôle solo de deux créatures en 2v2

- Proposition auteur : conserver les deux combattants actifs dans le 2v2 temps réel, mais permettre à **un humain de contrôler les deux**. Tap/clic sur une créature alliée active = changer instantanément quel acteur pilote la seule barre de capacités, PV/énergie, Esquive et Rappel ; l'autre ne doit plus lancer d'actions IA en mode « deux créatures humaines ».
- Le changement de contrôle est gratuit, sans action de combat, sans invocation, sans reset de cooldown, sans annulation du cast de l'autre. Chaque acteur conserve son propre état/horloge/PV, ciblage et charges selon leurs owners existants. L'ancien mode « humain + IA alliée » reste disponible par défaut ; 1v1 inchangé.
- Point d'architecture : le client actuel utilise `format.localActorId` pour l'interface unique et `controllerId` pour la décision. Prévoir une **sélection d'acteur humain courant** distincte de l'appartenance d'équipe ; ne pas muter `BattleFormat` ni faire piloter artificiellement l'IA. Chantier futur isolé avec vrais tests 2v2, Android et sentinelles de ciblage/rappel.

### Portraits des réserves V1 — résultat de code et test

- Le test RED `tests/unit/capture-reserve-portraits-v1.test.mjs` a reproduit l'absence de portrait. Raccord ajouté via le descripteur visuel canonique par `creatureId` dans le panneau Roster existant (local/allié/adverse), sans nouveau propriétaire de données. Les PV, KO, choix Rappel et cible de réserve restent issus des snapshots Roster. Absence d'icône : texte toujours lisible, aucun placeholder artificiel.
- Dernier SHA de code `e7ba2276ba6fb657f33bfa4f3e8fc671140d9bd8` : CI `38399670373` SUCCESS au second essai du seul job navigateur (timeout de 50 s sans assertion au premier essai), Foundation 1657 tests verts, Chromium Firestorm + 103 créatures verts. Rapport `docs/LAB_RESERVE_PORTRAITS_V1.md`.
- En attente CI exacte du SHA documentaire final et des portes de sortie avant publication sous lease. Validation manuelle Android paysage : À CONFIRMER.

## 2026-10-13 — Contrôle solo de deux créatures actives en 2v2 V1 (lot autonome)

- Décision auteur : **ajouter**, ne jamais remplacer l'actuel 2v2 humain + IA alliée ; permettre aussi un humain contrôlant les **deux** créatures, en tapant/click sur le modèle ou la carte alliée pour basculer la seule interface de commande. Plus tard, deux joueurs humains séparés seront une option future hors du présent lot. Le 1v1 conserve son comportement.
- Base LIVE exacte `gh-pages@c9b19479ea2d89c8b63ed5f8e07f2e36d746237a`, CI `38400771582` et Pages `38400771906` SUCCESS, incluant portraits de réserves GREEN technique. Checkpoint départ créé AVANT code : `checkpoint/lab-start-dual-human-2v2-v1-2026-10-13`, branche isolée : `work/lab-dual-human-2v2-v1-2026-10-13`.
- Contrat de compatibilité : `controllerId:"ai-ally"` = comportement historique, `controllerId:"human-local"` sur les deux slots alliés = contrôle solo partagé. Futur `human-remote` non traité ; jamais interprété comme une IA ni supposé contrôlable localement. `BattleFormat.localActorId` reste l'ancre de l'équipe/l'identité initiale, **pas** une variable mutée à chaque tap.
- UI : un sélecteur explicite uniquement pour les previews 2v2 dans l'éditeur de combat, mode IA par défaut. Un état de sélection local d'acteur, distinct de CombatSession et du choix de cible, projette **un seul HUD** vers l'acteur choisi : capacités, cooldowns, énergie, charges Esquive et commande Rappel. Tap/clic sur allié actif (hors cible de capacité explicitement armée) change la sélection, sans coût, interruption, reset de cooldown ni mutation de `Roster Session`. Chaque acteur utilise exclusivement son `actorId` dans Runtime / Combat Session ; actions concurrentes restent permises.
- Frontière future 2 humains : aucun réseau, aucune communication temps réel et aucune simulation par l'IA ; ce sera un lot distinct. L'option actuelle n'implémente que le solo local.
- Fichiers autorisés : `src/ui/combat-2v2-test-ui.js` et éventuel helper UI pur dédié, `src/ui/capture-editor-combat-test-v1.js` (scénario de test), `src/ui/capture-combat-roster-controller-v1.js` (projection de commandes Rappel pour le contrôlé), `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.css`, tests dédiés `tests/unit/dual-human-2v2-v1.test.mjs` et sentinelles ciblées, `docs/LAB_DUAL_HUMAN_2V2_V1.md`, journal.
- Protégés : moteur Combat Rules, Runtime, Session, dommages, HP, statuts, IA existante (sauf sélection des acteurs par le client), Roster Session, états actifs, assets `global-assets` et cache V30, 103 créatures/skills auteurs, `main`, Exploration, GenSrpG principal et autres fils.
- TDD RED avant correction, GREEN Foundation et deux Chromium sur SHA final, checkpoint GREEN exact, FF sous lease après contrôle de concurrence, CI/Pages après publication. Essais réels Android paysage restent à confirmer séparément.

### Contrôle solo 2v2 V1 — résultats de code

- TDD RED `e15bfc66f55546453d37329d2bb3a393bb0f3932` CI `38401112003` : contrat de sélection local absent (échec attendu).
- L'éditeur conserve IA par défaut, option `solo` seulement en 2v2, mêmes `controllerId` de format ; pas de réseau, aucun changement permanent des fiches. La source unique du HUD et du Rappel lit désormais l'acteur humain sélectionné. Tap allié sans skill armé = changement de HUD, pas cible ni rappel. Cooldowns, charges et combat Runtime restent individuels.
- Tests nouveaux: humain+IA conservé, solo A/B/A, futur distant non capturé, double cast simultané/énergie indépendante, sélection éditeur 1v1/2v2. Deux sentinelles historiques regex adaptées pour vérifier `controlledActorId()` au lieu d'exiger un acteur local constant, sans retirer les garde-fous. Toutes les autres classes de source/propriétaires restent protégées.
- GREEN du code : SHA `8c26482518caddc5a6c3cec73e969eca990fe9f0`, CI `38402179715` Foundation + Firestorm Chromium + bibliothèque 103 créatures SUCCESS. Rapport `docs/LAB_DUAL_HUMAN_2V2_V1.md`.
- CI sur SHA documentaire exact et checkpoint GREEN puis publication FF protégée + CI/Pages à vérifier ; validation manuelle Android paysage **en attente**.

## 2026-10-13 — Ergonomie Capture solo 2v2 et profondeur adversaire paysage V1 (lot visuel isolé)

- Retours auteur smartphone réel : le **switch A/B fonctionne** (validation manuelle du switch), mais l'interface solo 2v2 empile trop de grandes cartes sur la droite et n'est pas encore jouable ; les adversaires paraissent trop proches comparé au 1v1. Ne pas prétendre valider toute l'ergonomie à ce stade.
- Base LIVE officielle: `gh-pages@1c8720c6a5a9811d7bcb6a815016beb0bc476291`, Laboratory CI `38402617967` SUCCESS et Pages `38402618584` SUCCESS. Checkpoint créé avant écriture de code: `checkpoint/lab-start-solo-2v2-ergonomics-perspective-v1-2026-10-13`. Branche dédiée: `work/lab-solo-2v2-ergonomics-perspective-v1-2026-10-13`.
- Diagnostic source: `demo.css` donne au 2v2 de fortes largeurs adverses et des ancres proches, puis `capture-editor-v2.css` applique au paysage des largeurs environ 30-31dvh et des Y 33-34%, d'où une profondeur visuelle insuffisante ; en solo, une `coop-command-stack` étroite empile verticalement la carte allié sur l'énergie, les compétences et le Rappel, alors que le portrait de la créature contrôlée reste séparé.
- Objectif V1 : optimiser **uniquement le portrait paysage 2v2** dans la feuille Capture : mieux répartir et réduire les adversaires (source visuelle, sans scale auteur), rendre le dock solo horizontal et bas (carte allié compacte à gauche de la barre unique à droite), rendre la carte locale compacte, conserver l'Esquive accessible et lisible, laisser davantage de centre d'arène libre. Modifications solo conditionnées à `data-local-control-mode="solo-dual"`; perspective 2v2 visible sur les deux modes 2v2 ; 1v1 inchangé.
- Owner unique : CSS / présentation de la preview ; les frontières `CombatState`, `CombatRuntime`, `RosterSession`, `ActionResolver`, `Visual Controller`, `Hit/Projectile Geometry`, morphologie et assets restent intacts. Les collisions/sockets doivent se baser sur les vrais repères DOM affichés ; pas de transform individuel furtif qui ne serait pas pris en compte par les contacts.
- Périmètre : `examples/dom-demo/capture-editor-v2.css`, `tests/unit/solo-2v2-landscape-layout-v1.test.mjs`, `docs/LAB_SOLO_2V2_LANDSCAPE_LAYOUT_V1.md`, ce journal. Si la CI prouve qu'un contrat HTML manque, arrêt et périmètre réévalué avant toute extension.
- Invariants : IA alliée historique par défaut, solo switch A/B déjà validé, futur human-remote, ciblage allié/ennemi, vraies actions parallèles, l'Esquive native, Rappel, PV, énergie/cooldowns par acteur, capacités, FX, rayon électrique jaune v30, les 103 créatures et leurs scales auteur, la réserve, 1v1, `main`, `global-assets`, Zombicide-40k, Exploration, autres lots.
- TDD sentinelle RED sur CSS avant correction, puis GREEN Foundation + 2 Chromium au SHA exact ; checkpoint GREEN du code/document final ; publication FF sous lease seulement après HEAD identique et CI complète ; CI/Pages post-publication ; essai tactile Android du nouveau placement **à confirmer**.


### Extension de périmètre justifiée par la CI GREEN historique

- La première CI sur code modifié `38416549945` a révélé un échec unique de l'ancienne sentinelle `tests/unit/capture-enemy-landscape-placement-v1.test.mjs` qui imposait **exactement** les anciennes coordonnées 33/34 % et 77/34 %, et interdisait toute largeur de slot. Ce verrou contredit la demande explicite de recul et réduction **visuelle** des adversaires. Il ne signale pas une régression du moteur.
- Extension minimale autorisée à cette sentinelle historique : remplacer uniquement ses assertions d'anciennes coordonnées par la nouvelle configuration 2v2 en paysage, maintenir les garde-fous sur `--creature-display-scale`, `transform: scale()`, le 1v1, les frontières CSS et les tests historiques sans affaiblissement global. Cette sentinelle n'est pas supprimée.

### Solo 2v2 paysage — implémentation CSS et sentinelles

- Modification exclusivement présentation : dock de contrôle solo paysage horizontal avec deux colonnes, carte secondaire compacte et première carte locale réduite ; Esquive adjacente et barre unique plus large. Le mode IA conserve l'ancienne disposition de ses commandes. Adversaires 2v2 paysage reculés en Y et visuellement réduits via les tailles de **slots** et non l'échelle auteur ; les capteurs natifs lisent la vraie géométrie DOM.
- TDD RED sur `tests/unit/solo-2v2-landscape-layout-v1.test.mjs`. CI de code a révélé l'ancienne assertion de coordonnées exactes dans `tests/unit/capture-enemy-landscape-placement-v1.test.mjs` ; modification ciblée en conservant garde-fous 1v1/scales. Aucun moteur ni données auteur modifiés.
- Rapport : `docs/LAB_SOLO_2V2_LANDSCAPE_LAYOUT_V1.md`. Toute validation technique reste distincte de la validation visuelle smartphone Android par l'auteur.

## 2026-10-13 — Correctif régression 1v1 après perspective 2v2 (lot urgent isolé)

- Feedback auteur par test réel : **le 1v1 / solo historique a été dégradé** par la publication `e7366860f8b051d06bf4dabac4bcb3ec5d26167d`. Ce constat manuel a priorité sur CI GREEN précédente. L'ergonomie attendue concerne **exclusivement le 2v2** ; rétablir exactement le rendu stable antérieur du 1v1.
- Analyse de cause : la preview 1v1 et 2v2 réutilise la classe HTML `.arena--coop-2v2`. Le lot visuel récent a modifié sans discrimination les positions/taille des adversaires sous cette classe, dont l'ancre en 1v1. Les autres règles `[data-local-control-mode="solo-dual"]` ne touchent que le 2v2 à deux contrôleurs humains.
- Base officielle `gh-pages@e7366860f8b051d06bf4dabac4bcb3ec5d26167d`, CI `38417206416` et Pages `38417204063` techniquement verts mais **régression utilisateur**. Base pré-régression de référence `1c8720c6a5a9811d7bcb6a815016beb0bc476291`.
- Checkpoint avant code `checkpoint/lab-start-1v1-restore-2v2-scope-v1-2026-10-13`. Branche de correctif `work/lab-1v1-restore-2v2-scope-v1-2026-10-13`.
- Owner / plan : `src/ui/combat-2v2-test-ui.js` expose uniquement sur l'arène le **nombre réel** d'actifs locaux de `BattleFormat`, issu de `resolveCombatPreviewFormatV1`, sans changer la mécanique ; `capture-editor-v2.css` retrouve exactement les valeurs 1v1 pré-régression de la section paysage et applique l'avancement/réduction adversaire **seulement** quand l'arène annonce 2 actifs. Pas de changement d'échelle auteur, combat, collisions/FX, IA, Rappel, Esquive, réseau ou assets.
- Périmètre : `src/ui/combat-2v2-test-ui.js`, `examples/dom-demo/capture-editor-v2.css`, nouvelle sentinelle `tests/unit/capture-1v1-visual-regression-scope-v1.test.mjs`, deux sentinelles CSS ciblées concernées si nécessaire, `docs/LAB_1V1_RESTORE_2V2_SCOPE_V1.md` et ce journal. Ne modifier aucune autre source. Préserver solo 2v2 switch, mode IA alliée, futur humain distant.
- TDD RED sur régression prouvée ; après correctif GREEN Foundation + Chromium créatures + Firestorm, checkpoint GREEN au dernier SHA, FF protégé gh-pages seulement si HEAD inchangé, CI/Pages post-publication, re-test vrai 1v1 Android par l'auteur **non présumé acquis**.

### Régression 1v1 — restauration du rendu original en 2 scopes

- TDD RED commit `a24247bdf93fe04efbacbee6787379997c97bef8`, CI `38419798924` FAILURE attendue : manque de distinction 1v1/2v2 sur la classe CSS commune.
- Réparation CSS : restaurer exactement les coordonnées paysage antérieures du 1v1 (Y far 33/34, X far 77/34, largeurs initiales) en base ; activer la nouvelle perspective (Y 26/28, X 58/36, largeurs 24/23dvh) uniquement sous `[data-combat-active-count="2"]` dérivé du vrai `BattleFormat`. Aucun `transform:scale` supplémentaire.
- Sentinelles d'anciens placements strictement mises à jour pour exiger la sélection sur le **format réel**, plus nouvelle sentinelle des valeurs historiques 1v1 et du contrat de scope. Le HUD du solo deux-créatures reste inchangé.
- Dernier SHA de code `15b2f89666acc5fc8fe9e917e140cc5994f877be`, CI `38420059850` **SUCCESS** (Foundation et les deux Chromium). Rapport `docs/LAB_1V1_RESTORE_2V2_SCOPE_V1.md`.
- CI SHA documentaire final, checkpoint et vérification de concurrence prépublication toujours requis ; validation manuelle 1v1 par l'auteur **À CONFIRMER** après publication.


## 2026-10-13 — Correctif URGENT régressions UI Capture 1v1 + 2v2

- Test utilisateur réel : 1v1 est encore dégradé, **raccourci Réserves adverses manquant** ; 2v2 : blocs capacités géants, deux alliés difficiles à distinguer, cartes ennemies superposées à droite, raccourci Réserves adverses invisible. Le switch solo de deux créatures en 2v2 fonctionne et doit être préservé.
- Base LIVE `gh-pages@774f51f9009854e25827b9682c0c5b2ce347e167`, CI `38420713265` SUCCESS, Pages `38420712632` SUCCESS, mais validation visuelle utilisateur KO. Checkpoint BEFORE code `checkpoint/lab-start-combat-ui-regression-repair-v1-2026-10-13` ; branche dédiée `work/lab-combat-ui-regression-repair-v1-2026-10-13`.
- Cause menu ennemis : `mountCaptureCombatRosterPanelV1.render()` cache entièrement le bouton natif si `benchCount===0` ; l'auteur doit toujours pouvoir le voir, même quand la réserve est vide, avec compteur et explication explicite ; le menu reste un `details` natif avec les vrais membres, sans faux roster ni second owner. Aucun panneau ne doit disparaître silencieusement en 1v1.
- Cause ergonomie 2v2 : `arena--coop-2v2` est partagé avec 1v1 ; les grosses dimensions appliquées au dock `[data-local-control-mode=solo-dual]` (72% largeur) masquent physiquement la deuxième créature. Les deux cartes ennemies demeurent empilées en haut à droite. Le capteur `data-combat-active-count` existe déjà et limite 2v2.
- Périmètre exclusif : `src/ui/capture-combat-roster-controller-v1.js` (raccourci réserve), `examples/dom-demo/capture-editor-v2.css` (raccourci 1v1/2v2 et composition 2v2), sentinelles unitaires dédiées, `docs/LAB_COMBAT_UI_REGRESSION_REPAIR_V1.md`, présent journal. Pas de HTML/runtime si les owners existants suffisent.
- Contrat 1v1 : géométrie adversaire retrouvée comme avant, HUD / dimensions de capacités / contrôles 1v1 intacts, bouton `Réserves adverses · N` toujours accessible avec vrai nombre de réservistes, même N=0 (état explicatif vide). Back et Esquive/Rappel inchangés.
- Contrat 2v2 : deux cartes ennemies **à gauche/droite** sans superposition (left card respecte bouton Retour), bouton réserve adverse distinct et identifiable, panneau compétences **nettement plus compact** qu'en capture rejetée, deuxième allié et sa carte visibles, 5 capacités et Esquive/Rappel accessibles, mode humain+IA et mode deux humains locaux inchangés.
- Interdits : logique de combat, collisions, positions physiques des projectiles, contrats de skills, data auteurs/scales, IA, 103 créatures, assets, other repos, `main`, `global-assets`. Procédure TDD RED->GREEN, CI Foundation + deux Chromium, checkpoint GREEN sur SHA final, FF protégé sous lease seulement si pas de conflit, CI+Pages post-publi ; **validation Android paysage reste à confirmer**.

### État technique du correctif 1v1/2v2 — premier GREEN

- RED confirmé via `tests/unit/capture-combat-ui-regression-repair-v1.test.mjs` à `2a79f7304963441d283fa6a528937b3a080afb47` : menu adversaire caché quand compteur à 0 + grand HUD 2v2 + ennemis empilés.
- Réparation du contrôleur de réserve sur `a7355d1fa5212d82bfc132ba4d757713d0a5ba32` : pas de nouvelle autorité, toujours le vrai `details`, compteur Roster, raccourci conservé et texte explicite quand vide.
- Correctif paysage 2v2 `cfa0b4cd1427a14a0ae08a4937c3a82feea39990` : cartes adverses séparées, accès menu réserve distinct, modèle allié visible dans vrai slot, commandes solo-dual réduites d'environ 72% de largeur scène à max 34%, Esquive et Rappel inchangés. Aucun changement de layout ou skills en 1v1. CI `38424319897` Foundation + Chromium Firestorm + Chromium bibliothèque 103 créatures SUCCESS.
- Rapport `docs/LAB_COMBAT_UI_REGRESSION_REPAIR_V1.md`. Exigences restantes avant publication : CI sur SHA documentaire final, checkpoint GREEN exact, relecture du HEAD de production, FF sous lease, CI + Pages. Reste à valider sur smartphone réel par l'auteur : **1v1 Réserves adverses et 2v2 rendu**.

## 2026-10-13 — Harmonisation du HUD 2v2 IA et perspective adverse (lot V1 indépendant)

- Demande utilisateur après test smartphone : **1v1 historiquement rétabli et validé**, désormais gel absolu. La disposition 2v2 solo récemment publiée est la base visuelle souhaitée, avec allié représenté par une **petite carte en bas au centre** (nom, PV, action), les cinq compétences compactes, accès Rappel/Esquive et Réserves adverses visibles. En 2v2 avec **IA alliée**, appliquer **la même disposition compacte** : la seconde créature est toujours pilotée par l'IA, et sa carte n'est plus empilée en grand au-dessus de commandes. Reculer légèrement vers la **droite** les deux adversaires représentés (leurs modèles, pas les cartes ennemies), exclusivement en vrai 2v2.
- Base LIVE `gh-pages@1588908ef9686705890564278e34a06f7b365114`, CI `38425091518` SUCCESS et Pages `38425091600` SUCCESS. Checkpoint AVANT code : `checkpoint/lab-start-2v2-ai-ui-parity-v1-2026-10-13`; branche `work/lab-2v2-ai-ui-parity-v1-2026-10-13`.
- Owner : CSS de présentation `examples/dom-demo/capture-editor-v2.css` sous sélecteur du **nombre canonique d'actifs** `.arena--coop-2v2[data-combat-active-count="2"]`, jamais la classe commune `.arena--coop-2v2` seule et jamais `[data-combat-active-count="1"]`. Le rendu du HUD est partagé entre humain+IA et solo-dual ; le comportement contrôleur reste délimité par `controllerId`, `localControl.mode` et le Runtime existants.
- Changement prévu : remplacer dans **le seul bloc HUD compact 2v2** les sélecteurs solo-dual par le garde de format réellement à deux actifs ; cela réutilise exactement la disposition que l'auteur vient de voir/tester, sans second HUD ni recopie de styles, y compris action/charge PV de l'IA. Pour les ennemis 2v2 uniquement, déplacer leur ancrage X de 58 à 63 % et de 36 à 41 %, sans toucher Y, largeur, transforms, scales auteur, collisions ou sockets.
- Périmètre : `examples/dom-demo/capture-editor-v2.css`, sentinelles dédiées + mises à jour ciblées des **assertions devenues obsolètes** d'anciennes valeurs de placement si la CI les révèle, `docs/LAB_2V2_AI_UI_PARITY_V1.md`, journal. Aucun changement à la logique du moteur, de l'IA ou au HTML / JS de l'éditeur, ni aux 103 créatures, skills, réserves, assets, `main`, `global-assets` ou autres dépôts.
- Protection : vérification explicite 1v1 (coordonnées, classes, taille barre, raccourci réserve), 2v2 solo-dual switch, 2v2 IA (acteurs et commande IA inchangés), status de carte alliée, deux cartes adversaires, boutons Réserves adverses / Esquive / Rappel. TDD RED puis minimal GREEN et CI Foundation + deux navigateurs Chromium sur SHA exact, checkpoint GREEN, publication FF sous lease après comparaison production, CI + Pages après publication. Test visuel final Android paysager par utilisateur : à confirmer.

### Résultats d'implémentation 2v2 IA + solo — présentation commune

- Sentinelle TDD RED `tests/unit/capture-2v2-ai-solo-ui-parity-v1.test.mjs` commit `26043e51a8c568f2d9893e155f4a0997774d7300` : mode IA sans dock compact identique au solo + adversaires aux anciennes abscisses.
- Source CSS unique corrigée au commit `30050b25931f0a727dede04df26a6bea4a1db637` : les **14 règles compactes** du HUD 2v2 utilisent désormais le compteur réel `[data-combat-active-count="2"]`, non le choix solo. HUD IA et solo-dual identiques visuellement, et non deux contrôleurs ; le mode 1v1 n'est pas ciblé. Adversaires +5 points X chacun (63 % / 41 %) exclusivement en 2v2.
- Les quatre sentinelles historiques impactées ont été recalées sur le contrat de format à deux acteurs actifs, plutôt que de supprimer leurs protections ; dernière CI de code `38428292073` SUCCESS Foundation + Firestorm Chromium + bibliothèque 103 créatures au SHA `3a673f8ac70a401506c0fe4e901773324dcd0caa`.
- Rapport dédié : `docs/LAB_2V2_AI_UI_PARITY_V1.md`. La validation ergonomique Android 2v2 IA et le décalage ennemis restent à faire par l'auteur. Portes requises avant publication : CI du SHA documentaire final, checkpoint GREEN, fast-forward protégé sous lease et CI/Pages post-publication. Le 1v1 est **validé utilisateur et gelé**.

## 2026-10-13 — Placement fin des 2 ennemis Capture en vrai 2v2 V1

- Retour utilisateur du rendu IA/solo 2v2 publié : interface et raccourcis **satisfaisants**, mais les deux modèles ennemis doivent être encore légèrement décalés à droite ; **l'ennemi le plus à droite** doit redescendre un peu pour mieux reposer sur l'arène. Modification demandée exclusivement en **2v2**. **Le 1v1 est validé et gelé**.
- Base LIVE `gh-pages@249097c31dc4042e10dcdd26b610c869c61a0b2f`, CI `38428722812` et Pages `38428721945` SUCCESS. Checkpoint avant code `checkpoint/lab-start-2v2-enemy-spatial-adjust-v1-2026-10-13` ; branche `work/lab-2v2-enemy-spatial-adjust-v1-2026-10-13`.
- Propriétaire unique : `examples/dom-demo/capture-editor-v2.css`. Sous **uniquement** `.arena--coop-2v2[data-combat-active-count="2"]` dans la prévisualisation paysage : `opponent-1` (le plus à droite) X 63→68%, Y 26→30% ; `opponent-2` X 41→46%, Y 28% inchangé. Dimensions des slots 24/23dvh, scales auteurs, position des alliés, cartes d'UI, animation/mouvement/collision, points d'ancrage DOM, Huds IA/solo, capacités, Esquive, Rappel, Réserves adverses inchangés. Aucun `transform` ajouté.
- Fichiers autorisés : CSS propriétaire ci-dessus, nouvelle sentinelle RED `tests/unit/capture-2v2-enemy-spatial-adjust-v1.test.mjs`, correction *uniquement des valeurs de coordonnées devenues obsolètes* dans les sentinelles déjà existantes, rapport `docs/LAB_2V2_ENEMY_SPATIAL_ADJUST_V1.md`, présent journal. Protéger `main`, `global-assets`, GenSrpG principal, Exploration, 103 créatures, sons/FX/skills.
- TDD RED sur placement demandé, GREEN Node + deux Chromium au SHA documentaire, checkpoint GREEN, FF sous lease si `gh-pages` n'a pas bougé, post-publication CI et Pages verts. L'appréciation visuelle Android paysage et le contrôle de l'ennemi droit restent **à confirmer après publication**. Pas d'autre retouche UI dans ce lot.

### Ajustement fin des deux adversaires en 2v2 — exécution

- Sentinelle dédiée RED `tests/unit/capture-2v2-enemy-spatial-adjust-v1.test.mjs` commit `e04c1dfaa13a35b12b8eacd3db75b38b5607cadb`, CI `38430967128` FAILURE attendue (positions non encore changées). CSS propriétaire minimal commit `7113745740b99014cf381ba07862e10d85dc5bb2` : `opponent-1` X 68%, Y 30% ; `opponent-2` X 46%, Y 28%, sur format à deux actifs seulement.
- Anciennes sentinelles de coordonnées actualisées sur ces **seules valeurs**, sans modifier les gardes 1v1, HUD, tailles/scales auteurs ou géométrie canonique : `capture-2v2-ai-solo-ui-parity-v1`, `capture-1v1-visual-regression-scope-v1`, `capture-enemy-landscape-placement-v1`, `solo-2v2-landscape-layout-v1`.
- Rapport `docs/LAB_2V2_ENEMY_SPATIAL_ADJUST_V1.md`. Publication conditionnée à CI Foundation + deux Chromium sur SHA documentaire final, checkpoint GREEN et lease. Retour visuel Android à confirmer.

## 2026-10-13 — Imports créature Voltige et capacité Crocs statiques (vitrine Capture)

- Demande explicite : intégrer les deux exports auteur `gensrpg-capture-creature-crea_voltik.json` et `gensrpg-capture-skill-lib_static_bite.json` au **labo Combat**. Source de vérité : les deux exports `capture-*-transfer-v1`, jamais un template nouveau ; conserver intactes les valeurs, sockets face/dos, résistances, stats, effets/stack et loadout.
- Production `gh-pages@e8f1e4c87232332ca6810e295f6d228a98bbffa8` CI `38431513146` SUCCESS, Pages `38431512607` SUCCESS. Checkpoint initial **avant code** `checkpoint/lab-start-voltige-static-bite-showcase-v1-2026-10-13`; branche isolée `work/lab-voltige-static-bite-showcase-v1-2026-10-13`.
- Diagnostic identifiants : `crea_voltik` = fiche native historique parmi 103 entrées ; `lib_static_bite` = capacité référencée par cette fiche et présente dans le registre des capacités historiques. Le propriétaire doit remplacer par **ID stable**, non créer de doublon. Ordre : preset capacité d'abord, créature ensuite via `applyCaptureTransferBatchToEditorStateV1` déjà utilisé au démarrage.
- Médias : assets Voltige face/dos/icône, sprite impact électrique et icône `pack:capture:icon-skill-burning-bite-01` présents dans le catalogue `global-assets@ffed974c51d58d59a2e5cf20fd9eca00d76ec111` ; audio `gensrpg:sound:genrpg-pack2-af938ec6` référencé dans `private-audio-catalog.v1.json`. L'icône correspond nominalement à *Morsure brûlante* malgré la capacité *Crocs statiques* : **ne pas substituer**, conserver exactement l'export auteur et signaler cette différence. Aucun asset à créer/corriger ni aucune modification `global-assets`.
- Propriétaire unique : fichiers natifs de transfert sous `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json` et `data/capture/showcase/lib_static_bite.capture-skill-transfer-v1.json`; ajout à leurs deux listes de présélections `src/catalogs/capture-showcase-{creature,skill}-presets-v1.js`. `configuredCreatures`/`configuredSkills` et recharge/Combat de l'éditeur existants restent propriétaires. Ajustement strict éventuel des sentinelles de longueur figée à quatre après diagnostic, sans affaiblir la couverture.
- Tests prévus : RED avant intégration pour présence/IDs uniques et valeurs exactes, validité du contrat de transfert, vraie transaction d'import `replace`, provenance ID de créature et capacité, stats/sockets/loadout, non-changement des autres natifs, sélection rechargée depuis les Maps, compatibilité d'export Combat V3, présence catalogues assets, CI Foundation + Chromium Firestorm + Chromium bibliothèque créatures. No edit gameplay/core, UI, 1v1/2v2, autres données, autre dépôt, `main`, `global-assets`.
- Checkpoint GREEN uniquement sur commit final validé par CI, publication FF protégée sous lease après absence de conflit, CI/Pages post-publication et validation utilisateur Android facultative séparée pour le rendu. Si le vrai contrat rejette les exports, **arrêter**, documenter et ne pas corriger silencieusement les données.

### Voltige et Crocs statiques — intégration exécutée

- Imports auteur bruts déposés dans `data/capture/showcase`, certificats de contenu Git blob **identiques aux pièces jointes** : `crea_voltik` `038aec78ef20dc8fb589ba3c0e7de1d67d9219d5`, `lib_static_bite` `4253e619a3d19277e2e00311d94c6c1f4def4575`. Deux listes de présélections historiques mises à jour, exclusivement via le chemin unique de transfert existant (remplacement atomique par ID, pas de doublon). Aucune modification des 103 fiches sources historiques ni du moteur.
- TDD RED `tests/unit/capture-voltige-static-bite-showcase-v1.test.mjs` commit `c16fbe57535faa411eec0dfa5649377e95bf429f`, échec attendu avant fichiers/câblage (run `38442694246`). Quatre sentinelles historiques comportant des valeurs figées de nombre de presets (4 créatures, 19 skills) ajustées aux nouvelles longueurs 5 et 20 sans désactiver leurs assertions de contenu/identité.
- CI du code corrigé `38443017508` au SHA `2356eb0827ba828107c07b825e4ea598f299537d` : **SUCCESS** Foundation, Chromium Firestorm et Chromium bibliothèque 103 créatures. Rapport détaillé `docs/LAB_VOLTIGE_STATIC_BITE_SHOWCASE_V1.md`.
- Source originale volontairement inchangée : icône de Crocs statiques pointe encore vers l'asset de Morsure brûlante ; son d'impact libellé projeté « Electrique projectile2 ». Assets référencés existants aux catalogues, aucun nouveau média et aucune nouvelle certification asset. Aucun changement `global-assets`.
- CI complète sur SHA documentaire final, checkpoint GREEN exact, publication FF sous lease et contrôle post-publication CI/Pages restent les portes obligatoires. Validation visuelle Android de ces deux presets en attente de retour utilisateur.


## 2026-10-13 — Huit icônes Capture / activation dans le Labo Combat
- Médias certifiés : `global-assets@e55fea3b559c348be596d7c16250808a39c315a1`, huit WebP 128×128, huit IDs, catalogue 149 assets / 57 icônes, CI SUCCESS, checkpoint `checkpoint/lab-eight-skill-icons-assets-green-2026-10-13`.
- Code base `gh-pages@eab6e5064f03510c7543952f0705360d887b6710`, checkpoint `checkpoint/lab-start-eight-skill-icons-consumer-v1-2026-10-13`, work `work/lab-eight-skill-icons-consumer-v1-2026-10-13`.
- Changement : révision cache v31, test générique de résolution par ID, preview 8 vraies images `examples/dom-demo/capture-eight-skill-icons-preview.html`, documentation `docs/LAB_EIGHT_SKILL_ICONS_CONSUMER_V1.md`.
- Protégés : 103 créatures, fiches de compétences et leurs attributions actuelles, Combat/FX, 2v2, main, GenSrpG et Exploration.
- Gates : CI SHA final, checkpoint GREEN exact, fast-forward gh-pages protégé, CI et Pages sur SHA déployé. Contrôle visuel Android de l'utilisateur requis séparément.

## 2026-10-13 — Export Arc électrique + audits Glow et Immobilisation

- Demande auteur : intégrer intact `gensrpg-capture-skill-lib_chain_lightning.json` (id `lib_chain_lightning`, nom Arc électrique, beam électrique, 20 dégâts ignorant 30% réduction, stun 3s, effets et assets auteur), puis corriger la mémorisation apparente du préréglage d'intensité/Glow à la réouverture, puis expliquer/tester Immobilisation.
- Base LIVE `gh-pages@68d10471f59e2a33f1a6f33191b99bfedb9ac02f`, CI et Pages SUCCESS. Dépôt labo Combat seulement, `gh-pages` production ; autres branches principales interdites.
- Sous-lot A isolé : checkpoint `checkpoint/lab-start-chain-lightning-showcase-v1-2026-10-13`, branche `work/lab-chain-lightning-showcase-v1-2026-10-13`. Owner fichier `data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json` alimenté par export auteur *sans modification* et registre unique `src/catalogs/capture-showcase-skill-presets-v1.js`. Nouveau test sentinelle de transfert et vrai bootstrap, recalage ciblé d'anciens tests de nombre de presets et documentation. Aucun moteur / asset / ancienne fiche modifié.
- Sous-lot B ultérieur séparé, après publication A : préréglage Glow / intensité (UI `src/ui/capture-editor-human-v2.js`, éventuel helper pur `src/ui/capture-fx-quick-mode-v1.js`, tests dédiés). Reproduire pourquoi le sélecteur « Conserver mes réglages actuels » revient à la réouverture alors que les paramètres FX sont sauvegardés ; conserver le principe « sélectionner = aperçu, cliquer Appliquer = changement, enregistrer = persistance », sans écrire de nouveaux champs auteur si dérivation depuis les données suffit.
- Audit Immobilisation sans mutation gameplay dans A/B tant que comportement souhaité non clarifié : statut contractuel `immobilize` stoppe `session.move` (distant), mais vérifier le chemin des attaques de contact et les déplacements animés ; expliquer la différence par rapport à `stun`/Silence et noter toute lacune dans rapport, sans modifier les mécaniques 1v1/2v2.
- Contraintes : charte/checkpoints, 1 lot/branche, TDD RED/GREEN, tests du vrai pipeline, CI Foundation+2 Chromium, checkpoint GREEN exact, lease FF et postpublication CI/Pages. `main`, `global-assets`, autres laboratoires, Zombicide-40k, auteur 103 créatures et visuels gelés.

### Arc électrique — état de l'import
- Source exacte `gensrpg-capture-skill-lib_chain_lightning.json` : fichier 6385 octets ; SHA-256 `9d12c88096f01ebd9bb6e776ca069c698048144e10c0eec5afb1ae40202d9c1a` ; Git blob avant/après `727b0e0962231276f2ab625dafbe6634e57a38a1`. Enregistrement dans `data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json`, déclarée une seule fois dans le catalogue Showcase officiel, 20→21.
- TDD RED `tests/unit/capture-chain-lightning-showcase-v1.test.mjs` commit `5258102d52a5a9bdd7dde631ceb0c4f01f0e6908` ; CSS, mécanique et visuels intacts. Première CI a révélé 3 tests de comptage obsolètes (20 au lieu de 21) et une hypothèse incorrecte de fixture native dans notre nouveau test ; assertions corrigées ciblées sans toucher les données auteur, moteur ou autres checks.
- Rapport `docs/LAB_CHAIN_LIGHTNING_SHOWCASE_V1.md`. Réserver checkpoint GREEN final, FF `gh-pages` protégé et postrelease CI/Pages après dernière CI complète. Glow et immobilisation seront travaillés dans des lots séparés selon charte.

## 2026-10-13 — Correctif ciblé : préréglage Glow / intensité après recharge capacité

- Retour test auteur : il règle « 2. Choisir l'intensité » au plus haut puis constate « Conserver mes réglages actuels » à la réouverture ; l'UI donne l'impression que le préréglage n'est pas enregistré. Ne pas altérer les réglages avancés personnalisés ni la protection contre application implicite.
- Cause identifiée : `writeSkillFeedbackControlsV1` hydrate les vraies valeurs `feedback`, recharge correctement la liste de Glow détaillée via `syncSkillGlowPresetStateV1`, mais invoque `refreshSkillFxQuickControlStateV1(root,{resetSelection:true})` qui force `data-skill-fx-quick-profile="current"` à chaque chargement, même quand les valeurs correspondent exactement à un preset. Exemple fourni : Arc électrique nouvellement publié, Glow `0.85/32px`, particules « intense », secousse `9` correspond à `Spectaculaire`.
- Base LIVE `gh-pages@2ceb7aabc01ec47233dfea63ebc0e26609d6a122`, CI `38459071974` et Pages `38459071845` SUCCESS. Checkpoint AVANT code `checkpoint/lab-start-fx-quick-preset-reload-v1-2026-10-13`, branche `work/lab-fx-quick-preset-reload-v1-2026-10-13`.
- Propriétaire : catalogue UI `src/ui/capture-fx-quick-mode-v1.js` pour dérivation pure des valeurs persistées (réutiliser `captureFxGlowPresetIdForValuesV1`, `captureFxParticlePresetIdForValuesV1` existants), `src/ui/capture-editor-human-v2.js` pour projection du sélecteur lors du **rechargement uniquement**. Le choix sans clic « Appliquer » reste une preview : il ne doit pas écrire la fiche. Une capacité entièrement custom doit continuer à afficher « Conserver mes réglages actuels » ; une capacité correspondant exactement à Spectaculaire doit afficher Spectaculaire.
- Périmètre : 2 fichiers JS UI cités, nouvelle sentinelle `tests/unit/capture-fx-quick-reload-v1.test.mjs`, éventuellement actualisation ciblée du smoke navigateur existant si utile, `docs/LAB_FX_QUICK_PRESET_RELOAD_V1.md` et ce journal. Aucune modification des exports auteur (Arc électrique incl.), des assets, gameplay/Combat Core, statuts, 1v1/2v2, autres laboratoires, `main` ou `global-assets`.
- TDD RED/GREEN, verifier roundtrip `presentation.feedback` réel et projection, CI Foundation + 2 Chromium, checkpoint GREEN même SHA, publication FF protégée par lease, post-release CI/Pages. Validation tactile Android à confirmer.

### Glow — réalisation et contrôles
- TDD RED sur `a6c94079cac6a645df310142230c521e368ba1ef`, test d'identification du preset enregistré via le fichier Arc électrique. Le helper `captureFxQuickProfileIdForValuesV1` ne reconnaît que les signatures exactes Glow + 20 paramètres particules + secousse, réutilise les propriétaires de preset V1 existants et ne persiste aucune nouvelle identité.
- `src/ui/capture-editor-human-v2.js` ne force plus « Conserver mes réglages actuels » au chargement de la capacité ; il dérive l'état affiché des valeurs effectivement sauvegardées et garde « Appliquer » explicite pour tout nouveau choix. Un réglage avancé personnalisé repasse en mode « actuel » sans modifier les autres champs ni l'export.
- CI de code `38459592969` au SHA `7f555e903e810e616a8fe2b884712c196672807e` SUCCESS (Foundation + Firestorm Chromium + bibliothèque créatures Chromium). Rapport `docs/LAB_FX_QUICK_PRESET_RELOAD_V1.md`. Gate restante : CI sur SHA documentaire, checkpoint GREEN exact, promotion protégée, postpublication CI/Pages, validation utilisateur smartphone.

## 2026-10-13 — Clarification des contrôles de combat : Silence / Immobilisation / Stun

- Auteur : **Stun** coupe une capacité en train d'être activée et bloque toutes les actions ; **Immobilisation** empêche les mouvements et doit arrêter toute approche déjà engagée (sur le vrai Runtime, y compris le déplacement visuel) ; **Silence** ne doit plus bloquer les attaques de mêlée, mais limiter les capacités à distance. Les attaques stationnaires et sans mouvement restent utilisables sous Immobilisation. Ne pas modifier les données auteur des statuts.
- Base LIVE `gh-pages@674a274fa52917b2f57776a5b1fe4cf27ec83a8d`, CI et GitHub Pages SUCCESS. Checkpoint avant code `checkpoint/lab-start-control-status-behavior-v1-2026-10-13`; branche indépendante `work/lab-control-status-behavior-v1-2026-10-13`.
- Diagnostic : `src/core/combat/action-resolver.js` bloque toutes les capacités avec Silence et ne consulte Immobilisation que dans `resolveMovement` ; `src/core/combat/combat-runtime.js` gère déjà les actions d'approche en cours et sait annuler via `cancelActionsForActor` et `onInterrupted` (qui ferme l'animation côté UI). `status-applied` et le snapshot du statut sont canoniques, aucun état secondaire.
- Contrat voulu : Silence -> refuser `skill.form !== "contact"` sur compétence (projectile, beam, area, self, aura) mais autoriser `form=contact`, quelles que soient ses animations ; Stun -> comportement existant inchangé. Immobilisation -> refuser `resolveMovement` et tout nouveau `startSkill` à `approachMode in {ground,aerial,teleport,burrow}`, autoriser `approachMode=none`; si un acteur a une telle action active non résolue lorsqu'un statut Immobilisation devient actif, l'annuler **sans appliquer son impact ni le téléporter**, avec `reason="immobilized"`, en réutilisant la vraie annulation Runtime et le `presenter.cancelActionPresentation` existant. Protéger préparation, voyage et contact ; ne pas annuler tirs/projectiles déjà partis d'autrui.
- Propriétaires autorisés : `src/core/combat/action-resolver.js`, `src/core/combat/combat-runtime.js`, `src/adapters/renderer/status-effect-info-v1.js` (description utilisateur), sentinelle neuve `tests/unit/capture-control-status-semantics-v1.test.mjs`, sentinelle historique `tests/unit/status-effect-runtime-v1.test.mjs` seulement pour remplacer l'attente Silence-obsolète, rapport `docs/LAB_CONTROL_STATUS_SEMANTICS_V1.md` et présent suivi. Pas de nouveau contrôleur, pas de deuxième propriétaire, pas de mutation d'export auteur, skills, IA, FX, esquive, Réserve, 1v1/2v2 UI, global-assets, main, GenSrpG/Exploration.
- Tests RED avant code puis GREEN pour Silence contact vs projectile/beam et sans dépense, Immobilisation refuse le départ / laisse le sort stationnaire, annulation d'approche en préparation / après release et absence d'impact après interruption, continuation d'un projectile sans approche, Stun reste prioritaire. CI Foundation + deux Chromium au SHA documentaire, checkpoint GREEN exact, publication fast-forward protégée uniquement si HEAD identique, CI/Pages postproduction. Validation visuelle Android des mouvements interrompus **à confirmer**.

### Première CI et extension strictement documentaire des tests

- Première CI code `38464612765` : **1694 tests Foundation PASS / 1 échec**, lié à l'assertion de l'ancienne phrase `Impossible de se déplacer` dans `tests/unit/status-info-card-v1.test.mjs` ; Chromium Firestorm SUCCESS, navigateur créatures contrôlé séparément. Les nouvelles sentinelles de règles (Silence mêlée, Immobilisation immédiate/déjà engagée, aucune frappe tardive) ne sont pas la cause de cet échec.
- Extension autorisée **seulement** à `tests/unit/status-info-card-v1.test.mjs` pour mettre à jour l'attente du texte désormais explicatif du même statut. Conserver ses autres invariants (durée, UI projections, statuts, source réelle).

### Application de la clarification Silence / Immobilisation — tests en cours

- TDD RED sur sentinelle `capture-control-status-semantics-v1.test.mjs` au commit `4c9f5280f003224d26f7573f0a24c44998e3c711` (run `38464357384` FAILURE attendue). `resolveSkillStart` corrigé par le seul propriétaire `action-resolver.js` : Silence bloque exclusivement `projectile/beam/area`, mais laisse `contact/self/aura` ; Immobilisation refuse tout `approachMode` différent de `none`, ne refuse pas une capacité stationnaire. Stun inchangé.
- `CombatRuntime` consulte désormais les vrais statusEffects après avance et frappe : si une immobilisation devient active, annule toute approche non résolue via `cancelActionsForActor` et callback d'interruption EXISTANTS (annulation visuelle sans impact tardif). Aucune duplication d'authority, aucun changement stats/data auteur/1v1/2v2.
- Statut info pédagogique adapté. CI Foundation `38464612765` : **1694 PASS / 1 FAIL** causé par ancienne phrase tooltip ; extension de sentinelle déclarée avant correction dans ce journal, assertion actualisée sans affaiblir le reste ; aucun défaut mécanique nouveau montré par cette CI. Couverture supplémentaire de self/aura autorisées avec Silence.
- Rapport `docs/LAB_CONTROL_STATUS_SEMANTICS_V1.md`; ne pas promouvoir avant CI Foundation + Chromium Firestorm + Chromium bibliothèque 103 créatures **au SHA documentaire final**, checkpoint GREEN exact et fast-forward avec protection de branche. Android/paysage et Stun ressentis encore non validés manuellement.

## 2026-10-13 — Transferts Voltige/Frappe téléportée + Arc clash 2 + minuterie de stack (lot auteur ciblé)

- Demande : remplacer **exactement** les deux pièces jointes `gensrpg-capture-creature-crea_voltik(2).json` et `gensrpg-capture-skill-teleport-strike.json` dans l'unique bibliothèque active ; mettre `lib_chain_lightning.definition.projectileClash.power=2` en laissant TOUS les autres champs de l'Arc électrique à l'identique ; indiquer directement sous l'icône du statut à charges le **temps avant expiration du cumul** et nombre de charges vers le seuil (exemple `2/3`, `8 s`).
- Diagnostic : le Runtime stack existant réinitialise `expiresAtMs` pour le cumul entier lorsque la charge augmente, sans durées indépendantes par stack ; toute promesse `charge individuelle` serait mensongère. Source de vérité : `CombatState.elapsedMs` + `instance.expiresAtMs` ; la projection `projectStatusEffectInfoV1` calcule déjà `remainingLabel`. Le renderer `DomStatusFxRenderer` affiche déjà `x/seuil` et met à jour les info-bulles mais **pas un badge temps visible**. Réutiliser son `sync` naturel, aucun timer parallèle.
- Base production `gh-pages@bfdf4bba7bf0b46bed92a1e77ed629e65981826a`, CI et Pages SUCCESS. Checkpoint AVANT code `checkpoint/lab-start-voltige-teleport-arc-stack-timer-v1-2026-10-13` et branche isolée `work/lab-voltige-teleport-arc-stack-timer-v1-2026-10-13`.
- Propriétaires : les 3 transferts uniques sous `data/capture/showcase/{crea_voltik,lib_chain_lightning,teleport-strike}.capture-*-transfer-v1.json` ; liste de presets officielle Skills pour l'ID `teleport-strike` (charger d'abord compétences, puis créatures, via `configuredSkills/configuredCreatures` existants) ; `src/adapters/renderer/dom-status-fx.js` projection visuelle seulement ; `examples/dom-demo/demo.css` style badge réservé aux statuts à seuil, sans bouger les dimensions HUD 1v1/2v2.
- Fichiers permis : ces trois données, `src/catalogs/capture-showcase-skill-presets-v1.js`, renderer `dom-status-fx.js`, `demo.css`, sentinelles nouveau `tests/unit/capture-voltige-teleport-arc-stack-timer-v1.test.mjs`, et éventuelles anciennes assertions de comptage (à documenter AVANT edit), `docs/LAB_VOLTIGE_TELEPORT_ARC_STACK_TIMER_V1.md`, présent journal. N'AJOUTER aucun effet/règle/status/horloge. Protéger 103 fiches historiques, Stun/Silence/Immobilisation et leur récent correctif, sauvegarde Glow, 1v1 géométrie et actions, 2v2, FX/Asset Catalog, `main`, `global-assets`, GenSrpG/Exploration.
- Tests RED : 2 transferts valides et identités exactes ; `Voltige` nouvelle compétence au slot 1 sans changer stats/sockets ; `teleport-strike` valeurs 24 dégâts, approche teleport, audio et icône ; arc puissance=2 et autres champs inchangés ; import via `importCaptureTransferJsonV1` / remplacement par IDs sans doublon ; projection affiche `x/3` et `N s`, se rafraîchit au même rythme que `CombatState` et disparaît avec statut ; zéro interval propre et pas de valeur factice.
- Gate : CI Foundation + Chromium Firestorm + Chromium bibliothèque créatures sur SHA final, checkpoint GREEN exact, FF lease protégé si aucun autre chantier n'avance production, CI + Pages après publication ; rendu smartphone à confirmer.

### Diagnostic bloquant : puissance de projectile sur un rayon

- CI RED après `lib_chain_lightning.definition.projectileClash.power=2` : le **contrat source** `src/contracts/projectile-power-v1.js` rejette `power>0` quand `form!==projectile`, avec erreur `ProjectilePowerV1 requires form=projectile when power > 0`. Le module autoritaire `src/core/combat/projectile-clash.js` exclut lui aussi les rayons et ne résout que deux projectiles réellement opposés en vol. Simplement libérer la validation produirait un 2 affiché mais **aucune vraie collision** ; convertir Arc électrique de `beam` à `projectile` briserait ses stages/visuels et la sémantique auteur.
- DÉCISION PAR CHARTE : **ne pas publier** `power=2` dans ce micro-lot, revenir à `power=0` historique vérifié ; bloquer cette sous-demande comme `Beam Clash V1` distinct à concevoir avec l'auteur. Garder l'invariant form=beam pour les médias et cast/impact. Documenter explicitement le refus, aucune validation fictive.
- CI ancienne `38467856065` : autres 3 échecs liés au seul comptage historique `21→22` de Skills Showcase, tests `air-skills-enemy-bench-inspection`, `capture-ailevent-rafale-author-v2`, `capture-air-dual-skill-import-v1`. Extension tests **autorisée uniquement** de ces 3 fichiers pour mise à jour `21→22`, sans relâcher assertions d'identité. D'autres échecs résultent de l'Arc invalide et cessent en restaurant son champ. L'extension du scope est déclarée **avant** adaptation.
- Objectif restant publié dans ce lot : deux exports authentiques (Voltige et Teleport Strike), source unique/catalogue, compteur d'expiration native de charges, et diagnostic exact du Beam Clash bloqué. Aucun changement de contrat Combat/Runtime/Projectile Clash autorisé.

## 2026-10-13 — Beam Clash Power V1 (rayons & projectiles, vrai calcul)

- Demande explicite de l'auteur : un **rayon doit participer au même calcul de puissance que les projectiles**, notamment Arc électrique `lib_chain_lightning` puissance de collision 2 ; ne pas transformer `beam` en `projectile`. Cette évolution reprend seulement la sous-demande bloquée dans `LAB_VOLTIGE_TELEPORT_ARC_STACK_TIMER_V1.md`.
- Production LIVE `gh-pages@5e1b9e6107cb49000a54e17c6d842753994b241b`, CI `38468795383` et Pages `38468795675` SUCCESS. Checkpoint **avant code** `checkpoint/lab-start-beam-clash-power-v1-2026-10-13`, travail `work/lab-beam-clash-power-v1-2026-10-13`.
- Owners : `src/contracts/projectile-power-v1.js` étend l'autorisation existante `form=projectile | beam` ; `src/core/combat/projectile-clash.js` étend **le même** verdict autoritaire et ses événements sans moteur concurrent ; `src/core/combat/combat-runtime.js` conserve ses échéances natives `release→clash→impact`; `data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json` seul propriétaire de l'Arc, changement du champ `definition.projectileClash.power` 0→2 strictement, autres champs immuables.
- Sémantique V1 cadrée : projectiles↔projectiles conservent exactement leur intersection cinématique historique ; pour `beam` le segment occupe la trajectoire entière **pendant** `releaseAtMs..impactAtMs`. Face à un projectile adverse réciproque, collision dès que le rayon est actif et que le projectile est en vol (au premier intervalle de recouvrement) ; pour deux rayons opposés, dès que les deux sont actifs. L'événement conserve le nom `projectile-clash` pour compatibilité avec Presenter/FX, mais contient un `progress` spatial cohérent pour l'action annulée. Aucune collision si puissance 0, fenêtres non recouvrantes, attaques d'un même camp, cibles non réciproques ; plus forte survit, égalité annule les deux ; pas de dégât tardif de l'action annulée.
- Périmètre autorisé : `src/contracts/projectile-power-v1.js`, `src/core/combat/projectile-clash.js`, export auteur Arc ci-dessus, **uniquement tests** de contrats et intégration et leurs anciennes attentes beam=0 à recalibrer après échecs réels ; documentation dédiée `docs/LAB_BEAM_CLASH_POWER_V1.md` et présent journal. Modifier le Presenter seulement en cas d'échec prouvé après extension de périmètre ; aucune modification de la géométrie 1v1/2v2, moteur de rayon graphique, FX, dégâts, autres compétences/créatures, `global-assets`, `main`, autres dépôts.
- TDD : RED pour normaliser Beam power 2, Beam↔Projectile plus fort/faible/égal en vol et windows, Beam↔Beam, Arc réel, annulation/hit dans le vrai `CombatRuntime` ; garder sentinelles Projectile↔Projectile. CI Foundation + Firestorm Chromium + navigateur bibliothèque 103 créatures sur SHA documentaire final ; checkpoint GREEN exact puis fast-forward protégé sous lease si prod immobile, puis CI et Pages post-publi. Smartphone/FX rayons (visualisation du point de collision) à confirmer.

### Extension diagnostiquée — sauvegarde de la puissance des rayons dans l'éditeur

- Lecture LIVE `src/ui/capture-editor-human-v2.js` : `readHumanProjectilePowerV1(root,form)` force `power=0` pour `form!=="projectile"`, ce qui effacerait la nouvelle valeur Beam 2 lors de toute édition. L'UI HTML `examples/dom-demo/capture-editor-v2.html` mentionne seulement les projectiles ; la différence crée une confusion de contrat.
- Extension **déclarée avant code** : autoriser uniquement cette fonction de lecture de puissance dans `src/ui/capture-editor-human-v2.js` (et son export isolé pour test réel), le texte du champ `data-skill-projectile-power` dans `examples/dom-demo/capture-editor-v2.html`, et la sentinelle native nouvelle ; préserver absolument toutes les autres fonctions de cet éditeur, la sauvegarde Glow/FX et les données d'auteur. Une capacité de forme non projectile/beam conserve par défaut puissance zéro.
- Tests : garde pour beam et projectile qui conserve les valeurs saisies ; contact reste 0 ; UI indique « Projectiles et rayons » ; JSON Arc et roundtrip préservent Beam2.
- Première CI de code `38470679530` : **1705 PASS / 1 FAIL** sous Foundation, unique ancienne assertion littérale Beam0 dans `capture-voltige-teleport-arc-stack-timer-v1.test.mjs` ; son actualisation autorisée dans le périmètre tests existant, nouveau contrat/fonctions tests GREEN. Chromium Firestorm SUCCESS ; vérifier créatures. Aucune correction moteur supplémentaire exigée par cette CI.

### Beam Clash V1 — implémentation et contrôle final

- Sentinelle RED avant code `tests/unit/capture-beam-clash-power-v1.test.mjs`, commit `a1da6a21f88621807385d11c3b3ce0a0faa4997f`, CI `38470544109` FAILURE attendue.
- Contrat `src/contracts/projectile-power-v1.js` : conserve le même champ `projectileClash.power` en acceptant maintenant Beam positif (autres formes interdites) ; moteur `src/core/combat/projectile-clash.js` : chemin de collision *continu* pour Rayons ↔ Projectiles et Rayons ↔ Rayons, sans toucher la cinématique projectile ↔ projectile, les événements, ordonnancement natif ni le Presenter.
- Arc électrique export conservé, **seul power 0→2** ; `form=beam`, dégâts/FX/sons auteur inchangés. Un ancien test exigeait `0`, seule assertion obsolète remise à `2` après CI `38470679530` (1705 PASS / 1 FAIL).
- Extension probante : l'éditeur `readHumanProjectilePowerV1` effaçait puissance Beam à la sauvegarde ; autorise maintenant Beam/projectile et laisse 0 ailleurs ; texte de la commande éclairci, sentinelle avec vrai propriétaire de lecture. Documentation `docs/LAB_BEAM_CLASH_POWER_V1.md`.
- Gates encore obligatoires : CI complète sur SHA documentaire final, checkpoint GREEN SHA exact, FF lease sans concurrence et CI + Pages post-publi. Android paysage et FX contact à vérifier manuellement. Pas d'autre lot.

### Contrôle des changements Beam Clash — prêt pour gate final

- UI informative étendue au rayon sans changer la structure HTML ; les deux assertions historiquement centrées sur les expressions `0 = hors système de clash`, `Minimum actif = 1`, `1 contre 1`, `2 contre 1` se sont révélées incompatibles avec la première réécriture (CI `38470995088` : 1705 PASS, 2 FAIL uniquement sur la formulation). L'information historique a été préservée et complétée pour le rayon dans **le même texte propriétaire**, sans retirer les tests ni changer leurs conditions de succès.
- Code + données + UI + tests au SHA `c29a9715f783bb3683020c37d1c2552ae3c8ed21` : CI `38471220553` **Foundation / Chromium Firestorm / Chromium bibliothèque créatures SUCCESS**. Diff contre production = seulement Arc +1 champ, contrat projectile power, moteur clash, lecture/sauvegarde Human Editor, libellé, sentinelles et docs. Pas de patch sur CombatRuntime (réutilisé tel quel).
- Dernier contrôle requis : une CI identique sur ce journal documentaire final, checkpoint GREEN même SHA, FF avec lease production, CI + Pages post-publi. Test Android rendu visuel des rencontres de rayons reste à demander à l'auteur.


## 2026-10-14 — Remplacement auteur Voltige V3 (lot unique et isolé)
- Demande : intégrer exactement le transfert utilisateur `gensrpg-capture-creature-crea_voltik(3).json`, ID stable `crea_voltik`, sans dupliquer ni « améliorer » la fiche ; seules différences observées avec la version courante : `draft.presentation.viewOverrides.opponent.displayScale` 1→0.7 et `position.y` 0→60.
- Base production vérifiée : `gh-pages@97a2e7e7604cfbe865efb1a41aaf81427cd6d5c1` ; CI 38471512786 et Pages 38471511799 SUCCESS. Checkpoint avant code `checkpoint/lab-start-voltige-v3-author-update-2026-10-14`; branche `work/lab-voltige-v3-author-update-2026-10-14`.
- Owner : `configuredCreatures` alimenté par le transfert canonique `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json`. Périmètre : ce JSON (octets exacts), sentinelle `tests/unit/capture-voltige-v3-author-update-v1.test.mjs`, rapport `docs/LAB_VOLTIGE_V3_AUTHOR_UPDATE_V1.md` et présent journal uniquement.
- Protégés : autres 102 fiches, capacités et leurs données, rayons/projectiles/Beam Clash Power V1 explicitement validé par l'auteur, statuts/stacks/horloge, IA, UI 1v1/2v2, assets, `main`, `global-assets`, Zombicide-40k et labo Exploration. Le souci de minuterie de stacks appartient à un lot distinct après publication, l'amélioration IA (Esquive et sélection variée) à un backlog de conception distinct.
- Gates : test RED de non-remplacement, remplacement exact sans transformation, hash source SHA256 `9128a124a0ee8db863c41cf32206a72db7be15f1cca6759dc5070f5075f58535`, parse + import/export + identité/loadout/sockets, CI Foundation + 2 Chromium SHA final, checkpoint GREEN exact et FF protégé puis CI/Pages déployées. Validation rendu Voltige Android à confirmer séparément.

### Voltige V3 — octets sources contrôlés
- Blob Git `f4d21b0a7ef70aedae100deff375beb4dba20493` **exactement égal** au fichier utilisateur de 5430 octets ; commit de remplacement `615b557a59ed785a71ab65113ac5c7e4445244ef`. Diff sémantique limité aux 2 champs de vue adverse (1→0.7, Y0→60), aucun autre champ ou owner touché. Test RED créé avant le remplacement ; CI complète requise sur le SHA documentaire final, puis checkpoint/FF et CI Pages. Rapport `docs/LAB_VOLTIGE_V3_AUTHOR_UPDATE_V1.md`.

### Sentinelle Voltige historique — adaptation minimale après RED
- CI de code 38478210807 : 1707 tests PASS / 1 FAIL ; ancien test `tests/unit/capture-voltige-static-bite-showcase-v1.test.mjs` impose `opponent.displayScale===1`, valeur devenue obsolète dans l'export auteur (0.7). Extension strictement limitée à cette assertion, nouveau check `position.y===60` dans la même sentinelle. Toutes autres attentes conservées. Aucune correction des données ou du moteur pour satisfaire l'ancien test.


## 2026-10-14 — Fluidité du compteur de charges à seuil (lot UI propriétaire)
- Retour réel utilisateur : la durée avant disparition du cumul apparaît de façon irrégulière et saute, difficile de vérifier le fonctionnement ; Beam Clash Power V1 validé explicitement, à ne pas retoucher.
- Base `gh-pages@04cd92106558a439bffcd9b57e03ea678d028671`, checkpoint de départ `checkpoint/lab-start-stack-expiry-clock-ui-v1-2026-10-14`, branche `work/lab-stack-expiry-clock-ui-v1-2026-10-14`, sur l'import auteur Voltige V3 certifié; post-déploiement CI/Pages à vérifier avant publication suivante.
- Cause source vérifiée : `CombatRuntime` appelle `onClock(session.snapshot())` à cadence nominale `tickMs=50` ; `combat-2v2-test-ui.js` ne répercute que `renderAvailability()` dans ce callback, et les icônes de statut ne sont rafraîchies que par `onState` quand le signal métier change. Le temps affiché reste donc figé puis saute malgré l'avancée correcte de `CombatState.elapsedMs`.
- Ownership : `DomStatusFxRenderer` garde le HUD statut; l'UI ne transmet que le snapshot canonique sur le callback d'horloge EXISTANT. Présentation : nombres de secondes entières et stables par plafond (pas de 10e qui tremble) + fine jauge de progression alimentée par `expiresAtMs-elapsedMs` sur la durée du cumul partagé, sans nouvelle horloge ni intervalle, uniquement pour statuts à seuil `time_ms`.
- Fichiers autorisés : `src/adapters/renderer/dom-status-fx.js`, `src/ui/combat-2v2-test-ui.js`, `src/ui/combat-test-ui.js` (même afficheur du test 1v1 legacy, raccord sans toucher aux règles), `examples/dom-demo/demo.css`, nouvelle sentinelle `tests/unit/capture-stack-expiry-clock-ui-v1.test.mjs`, `docs/LAB_STACK_EXPIRY_CLOCK_UI_V1.md`, présent journal. Aucun autre fichier sans diagnostic/extension préalable.
- Protégés : `src/core/combat/`, `CombatRuntime`, `CombatState`, modélisation charges/stack seuil, dégâts, rayons/projectiles/Arc2, presets auteur Voltige V3 et les 103 créatures, FX, AI, IA, modes 1v1/2v2, assets, `main`, `global-assets`, GenSrpG/Exploration.
- Tests : RED ancienne UI sans rafraîchissement sur tick, après correction horloge avance à 50ms dans le HUD via `syncCountdowns`, label stable `ceil` et barre décroissante, rafraîchissement du cumul après nouvelle charge, disparition native, aucun second timer; CI Foundation + 2 Chromium au SHA exact, checkpoint GREEN, FF sous lease et CI/Pages postrelease; validation visuelle Android paysage reste ouverte.
- IA (future, NON implémentée ici) : choix cyclique déterministe et aucune initiative Esquive côté IA, consigner séparément pour un vrai chantier AI plus tard, sans mutation dans ce lot.

### Compteur de charges — correction branchée sur le vrai onClock
- TDD RED commit `53c42d0868f13b11b7d11554cdb2f386a9d67548` / CI `38479106164` FAILURE attendue. Code commit `e51e567fe5e5f60346e01d88bc49d39c8892ccb5` : seul le HUD existant se met à jour depuis le snapshot natif `onClock`; label entier `ceil` + barrette de durée; les deux chemins Combat UI raccordés. Aucun changement Status/Combat Core, ni nouvelle horloge. Rapport `docs/LAB_STACK_EXPIRY_CLOCK_UI_V1.md`. CI complète et gates finales obligatoires, test Android non revendiqué.

### CI de code — sentinelle historique zones persistantes
- CI 38479371767 : 1709 tests PASS / 1 échec d'assertion statique historique dans `tests/unit/persistent-zone-visual-sync-v1.test.mjs` : recherche exacte de `onClock()` sans argument, maintenant remplacé par `onClock(state)` pour le badge. Le vrai comportement `fx.syncPersistentZones` demeure **exclusivement** dans `renderState/onState`, et les deux jobs Chromium sont verts. Extension du périmètre autorisée **uniquement** à la recherche de signature et à une assertion positive du rafraîchissement du compte à rebours, sans supprimer la sentinelle de zones ni toucher au moteur.

## 2026-10-14 — Backlog IA Capture tactique (DOCUMENTATION UNIQUEMENT)
- Constat utilisateur à conserver : IA ne déclenche jamais l'Esquive et répète ses capacités en rotation ; améliorer pour les tests et jeu réel **plus tard**. Le diagnostic source montre le `skillIndex` cyclique et `runtime.startSkill` uniquement, sans stratégie de réaction défensive.
- Base production `gh-pages@78bfcee12f21d985eb7b5381581499bc442edfc1` ; checkpoint `checkpoint/lab-start-capture-ai-tactics-backlog-2026-10-14`, branche documentaire `work/lab-capture-ai-tactics-backlog-2026-10-14`.
- Lot strictement docs : `docs/LAB_CAPTURE_AI_TACTICS_BACKLOG_V1.md`, `docs/LAB_ROADMAP.md` et présent journal. Protection absolue du moteur, IA courante, UI, statuts, timer corrigé, Arc Beam2 validé, assets, données auteur, main, global-assets, GenSrpG/Exploration.
- Pas d'implémentation ni de nouveaux paramètres supposés. Critère documentaire : CI GREEN au SHA exact, checkpoint GREEN documentaire, FF protégé et CI/Pages. Nouveau chantier AI nécessite décision explicite de conception avec RED et vrai Runtime 1v1/2v2.


## 2026-10-14 — AI Capture Tactics V1 / vrai contrôleur de démonstration
- Autorisation auteur : développer l'IA du labo pendant ses éditions de créatures/capacités ; base production vérifiée `gh-pages@80d8597dbbc9a1d763299985ef7183c1bbd71e25` (Foundation/2 Chromium + Pages SUCCESS).
- Checkpoint `checkpoint/lab-start-ai-capture-tactics-v1-2026-10-14` ; branche `work/lab-ai-capture-tactics-v1-2026-10-14`, ne pas toucher aux branches éditées par l'auteur.
- Objectif borné : un choix de compétences adaptatif et reproductible (état, PV, potentiel offensif/soin, disponibilité native, répétition, énergie), et une Esquive IA limitée aux attaques réellement **libérées et visibles**, dans une fenêtre compatible avec les charges et l'horloge natives ; pas d'omniscience ou réaction systématique.
- Propriétaire : `src/core/combat/battle-actor-ai-controller.js` pour les décisions et `src/ui/combat-2v2-test-ui.js` pour le simple raccord `onRelease / onClock` et FX déjà existants. Contrôleur adaptatif opt-in via preset de test, ancien contrat déterministe préservé pour les consommateurs historiques. Des options de profil permettent plus tard des niveaux de difficulté, sans modifier les JSON auteur.
- Fichiers autorisés : ces deux sources, `tests/unit/capture-ai-tactics-v1.test.mjs` (nouveau), `docs/LAB_AI_CAPTURE_TACTICS_V1.md` (nouveau), ce journal ; extension explicite exigée avant tout autre changement.
- Interdits : `CombatRuntime`, `CombatState`, `CombatSession`, `SkillDefinition`, charges/recharges, rayons/clash puissance 2, dégâts/FX projectile, compteur stack, autres UI, tous les assets, données ou exports de créatures/capacités, `global-assets`, `main`, GenSrpG principal et exploration.
- RED : test du vrai `startSkill` depuis prévisualisation existante, choix sous PV/soin et anti-répétition, économie d'énergie, Esquive seulement après `onRelease` vers la cible, vérification charge native/fenêtre réelle, pas d'esquive quand désactivée/KO/déjà en cours ; absence de seconde horloge ; 1v1/2v2.
- GREEN : test unitaire vrai chemin, suite Foundation et deux navigateurs sur même SHA, revue diff/checkpoint GREEN, fast-forward lease seulement sur base inchangée, CI/Pages après publication ; test Android gameplay restant à valider par auteur. Toute divergence => garder branche isolée non publiée.

### Capture AI Tactics V1 — code et vrai chemin de combat GREEN avant rapport final
- TDD RED `58fe507886cb605857278ed3d5284f8e8af0e4b7` → propriétaire IA `b4b0558eb0a9c43310163433db202ce6c8732809` → raccord seule UI Capture `775f9fddf23f5df694d66c0d1b52a6294497c9da` → sentinelle vraie Session/Runtime `ccf89bfbb2bb5e114e1e2b5c6055240390c666e0`.
- CI `38516911395` sur ce dernier SHA : **1716/1716 tests**, Foundation, Chromium Firestorm et Chromium bibliothèque créatures SUCCESS. Aucun changement aux owners moteur/skills/assets ni aux données auteur.
- IA par défaut de la preview : score dégâts/soins/utilité/anti-repeat + variation déterministe et `GameOptions.dodge` si activée. Esquive ne s'arme qu'après libération visible sur la vraie horloge et la réaction native rechargeable ; intégration réelle prouve un projectile `evaded` et une charge dépensée.
- Rapport `docs/LAB_AI_CAPTURE_TACTICS_V1.md`. Gates restants : CI sur ce HEAD documentaire, checkpoint GREEN du même SHA, FF protégé sur `gh-pages`, CI + Pages après publication. Test Android manuel non simulé ; limites V1 explicitement notées.


## 2026-10-14 — Nouveau statut Esquive foudroyante : auto_dodge V1
- Nouvelle priorité auteur, AVANT toute amélioration supplémentaire de l'IA : capacité auto-esquive pendant durée X configurable par éditeur, sans utiliser la recharge du bouton Esquive ni changer les créations actuelles.
- Base de départ VERIFIÉE : gh-pages `2b3bd961fdfacaa2a82c20f0b25969e9b6c36b08`, Laboratoire CI/Pages SUCCESS. Checkpoint `checkpoint/lab-start-automatic-dodge-status-v1-2026-10-14`, branche unique `work/lab-automatic-dodge-status-v1-2026-10-14`.
- Owner : contrat `StatusEffectV1` (`auto_dodge` bénéfique à durée `time_ms`), propriété au vrai instant d'impact par `ActionResolver.resolveSkillCompletion`, en réutilisant `skill-evaded` et la projection native des statuts. Les attaques offensives ciblées et esquivables uniquement ; non-esquivables, soins, DoT/HoT, zones persistantes, clash/forcedOutcome restent inchangés. Portée V1 explicitement bornée ; effets multi-cibles nécessitent un lot séparé.
- Le statut doit être accessible au Human Editor Capture en tant que buff éditable de durée, conservé à l'import/export ; présenter son sens lisiblement dans la fiche statut ; aucun pré-réglage auteur existant modifié.
- Périmètre déclaré : `src/contracts/status-effect-v1.js`, `src/core/combat/action-resolver.js`, `src/ui/capture-editor-human-v2.js`, `src/adapters/renderer/status-effect-info-v1.js`, nouvelle sentinelle `tests/unit/capture-auto-dodge-status-v1.test.mjs`, rapport `docs/LAB_AUTO_DODGE_STATUS_V1.md`, et présent journal. Extension de périmètre après diagnostic écrit seulement.
- Protégés : noyau d'IA actuel, CombatRuntime/horloge, Beam Clash Power 2 validé, collision et projectiles, mécanique bouton Esquive, buffs déjà existants, 1v1/2v2, toutes les fiches créatures/capacités, assets, main, global-assets, GenSrpG principal et exploration.
- Gates : RED strict sur le vrai combat et contrat, correction native, tests d'impact avant/pendant/après buff, dodgeable:false, préemption collision, soin non esquivé, statut défavorable évité, 1v1/2v2 et roundtrip Human Editor, 3 jobs CI et Pages GREEN SHA final, checkpoint exact puis FF protégé, test Android manuel séparé.

### Esquive foudroyante V1 — code isolé et sentinelle native
- RED `ca35bbd2da16c3b3daccaadb01570538a1c8b4d3` ; contrat `16f173675b546853fe5e6daab1ada6aa3e70a123`, ActionResolver `0c0d4afe0c4df6ae1bd2f17b7138485763ccbb79`, Human Editor `28f5076f4110e04dcd9a887c29fe717b01274320`, Status HUD `1da4e03348ec09e1684fee326f2292e2fe3184e7` ; rapport `docs/LAB_AUTO_DODGE_STATUS_V1.md`.
- Foundation premier passage 1722/1722 PASS ; Firestorm Chromium PASS ; navigateur bibliotheque créatures timeout de bootstrap 50s sans assertion (CI 38517850671) → relance du seul job. Aucun patch de test/changement moteur pour masquer la latence. CI sur HEAD final et publication interdite avant 3 jobs GREEN. Android non vérifié.


## 2026-10-14 — Backlog buffs déclenchés par événements de combat (DOCS SEULEMENT)

- Idée auteur à conserver pour plus tard, après test d'Esquive foudroyante : permettre une compétence ultime d'activer pendant une durée configurable (exemple 60 s) un buff qui **réagit aux dégâts effectivement infligés** par le porteur : appliquer une brûlure/un état sur la victime, soigner le porteur, ou exécuter une liste d'effets configurables à chaque déclenchement. Extension future aux compétences passives. L'effet cesse à la fin de la durée du buff ; les statuts déjà infligés conservent leur propre durée.
- Base LIVE `gh-pages@10244bafbb2159332167a80a476081eea2ffb355` CI run `38518372982` SUCCESS et Pages `38518372516` SUCCESS ; checkpoint `checkpoint/lab-start-triggered-buff-backlog-2026-10-14` ; branche `work/lab-triggered-buff-backlog-2026-10-14`.
- Objectif de ce lot : **traçabilité documentaire uniquement**. Fichiers autorisés : `docs/LAB_CURRENT_WORK.md`, `docs/LAB_ROADMAP.md`, nouvelle note `docs/LAB_TRIGGERED_BUFFS_BACKLOG_V1.md`. Aucun code/test de fonctionnalité ni modification d'une création auteur.
- Ownership envisagé (NON implémenté) : contrat de statut réutilisable attachant `trigger -> conditions -> effets -> cibles` à un buff/passif ; événements de combat canoniques après résolution réelle des dégâts, réutilisation des `SkillEffectV1` et `StatusEffectV1`, et de l'horloge `CombatState.elapsedMs`. Définitions/validation/comportement et exposition Human Editor devront être conçus en lots distincts après décision.
- Arbitrages futurs à fixer avant TDD : « dégât » = PV réellement perdus vs coup/absorption ; AOE et dégâts périodiques ; cible victime/soi/allié ; effet par cible/par attaque ; conditions/chances/cooldown/plafonds ; interdiction de boucle de procs (soin/renvoi/DoT/effet secondaire) ; combat 1v1/2v2 ; empilement, passifs, décès/rappel et export/import.
- Protégés : moteur Rules/Runtime/Status actuel, buffs, auto_dodge/Esquive foudroyante publiée, IA tactique, puissance de rayons 2/Beam Clash, créatures et skills auteur, UI, assets, `global-assets`, `main`, dépôt GenSrpG et Exploration.
- Critère de fin documentaire : une note claire, roadmap + current synchronisés, revue diff seulement docs, CI Foundation + deux navigateurs GREEN SHA final, checkpoint GREEN du même SHA et FF sous lease avant publication ; aucun comportement de jeu nouveau revendiqué.

## 2026-10-14 — Triggered Buffs V1 (autorisé par l’auteur)

- L'auteur autorise le développement immédiat des buffs configurables déclenchés par événements, et effectuera ensuite un test global des nouvelles mécaniques. Base `gh-pages@32f675c9a32ac96fc8835f0cc6fc4188c2f59449` CI/Pages SUCCESS (38536315826 / 38536315900). Checkpoint `checkpoint/lab-start-triggered-buff-v1-2026-10-14`, branche `work/lab-triggered-buff-v1-2026-10-14`.
- Portée V1 délimitée : un statut temporaire `triggered_buff` bénéfique (`time_ms`, durée X, empilement `refresh` ou `replace`) porte `onDamageDealt.effects` (liste de vrais `SkillEffectV1` autorisés : damage, heal, energy_restore, energy_drain, apply_status, cleanse, dispel avec cible self ou target). Déclenchement une fois par victime dès qu'une attaque offensive de la capacité du porteur retire **effectivement > 0 PV** en impact direct ou tactical damage. Une esquive, un clash, un bouclier absorbant entièrement, un DoT/HoT tick, un renvoi/une riposte et une attaque où le buff expire ne déclenchent rien. La victime conserve la durée propre de la brûlure appliquée même après fin du buff.
- Sécurité : appliquer seulement aux événements de dégâts originaux capturés avant procs ; ne jamais réanalyser les événements des effets déclenchés, évitant les boucles. Pas de deuxième horloge ni de bypass du vrai Runtime/Combat State/Status Runtime ; limiter le nombre d'effets à 12 et les seules cibles explicites.
- Autorités : contrat `src/contracts/status-effect-v1.js`, résolution `src/core/combat/action-resolver.js`, réutilisation `src/core/combat/immediate-tactical-effects-v1.js` ; édition/import/export `src/ui/capture-editor-human-v2.js`; description `src/adapters/renderer/status-effect-info-v1.js`.
- Périmètre autorisé (développement) : 4 fichiers précédents (Status contract, Action Resolver, Human Editor, status-info), une sentinelle `tests/unit/capture-triggered-buff-v1.test.mjs`, `docs/LAB_TRIGGERED_BUFF_V1.md`, ce journal et mise à jour `docs/LAB_ROADMAP.md`. Toute extension nécessite justification dans le journal avant changement.
- Intouchables : export/JSON des créatures, compétences, loadouts et assets de l'auteur ; `global-assets`, `main`, dépôts GenSrpG/Exploration ; CombatRuntime/horloge, projectiles/rayons/Arc2, IA actuelle, auto_dodge et Esquive bouton, zones, damage calcul, UI hors Human Editor. Aucune copie d'effet dans un nouveau owner parallèle.
- Gates : RED avant code, vrai `CombatSession / Action Resolver` et vrai import/export auteur, erreurs de configuration, dégâts / soins / brûlure, effet sans dommage 0, expiration 60 s, self/target, non-récursivité et 2v2 ; CI Foundation + deux Chromium sur SHA final ; checkpoint GREEN exact, FF avec lease et CI/Pages post-publi. Validation Android par l'auteur au test global, sans prétendre l'avoir faite. Passifs permanents hors V1.


### Buffs déclenchés V1 — mécanique et éditeur raccordés, revue CI
- TDD RED `2655f4b9d4ea863edf4baa868e1b3c9b30caec90`. Contrat Status `c7e0d0adda2086d0911994d4d93efb35e47ba915`; résolution owner Action Resolver `cae484e6efaff1aa0a3f55ae25658ab4c77d5901` ; projection statut `19613687ff52c23b5fbc2f255fd5547b393c9029` ; Human Editor `d8ced3aa0c90f74005e0e5f7d340bea3c437c690` ; test confirmé plus complet `ad8b6d4a1b7c2a4aeb335893c6392337116a3c7d` ; ergonomie stacking auteur `74b456997d38a698a1db5ad3a56f947e7b2befa2`.
- Vrai buff `triggered_buff.onDamageDealt.effects` à durée canonique, avec liste d'effets paramétrables. Atteinte HP native strictement positive ; aucun proc si evaded, full-shield, hors durée ; seules les attaques natives directes/tactiques du porteur sont concernées et les effets produits ne génèrent pas de procs récursifs. Les statuts secondaires conservent leur durée, les effets de heal/damage/statuts passent par `applyImmediateTacticalEffectsV1`. Human Editor expose la liste sur le vrai effet `apply_status`, import/export testés.
- Gates code exact `ad8b6d4a1b7c2a4aeb335893c6392337116a3c7d` : CI `38537565952` **Foundation, Firestorm Chromium, Bibliothèque créatures Chromium SUCCESS** ; gate ergonomie `74b456997d38a698a1db5ad3a56f947e7b2befa2` : CI `38537735102` **3 jobs SUCCESS**. Rapport `docs/LAB_TRIGGERED_BUFF_V1.md` et Roadmap mis à jour.
- Dernier gate : CI finale 3 jobs SHA **exact** après le présent journal, checkpoint `checkpoint/lab-triggered-buff-v1-green-2026-10-14`, FF lease protégé sur `gh-pages`, CI+Pages après publication. Android paysage : validation utilisateur globale ultérieure (non revendiquée).

## 2026-10-14 — Event Trigger V2 / statut événement → effets génériques (nouvelle exigence auteur)

- Constat/autorisation : l'auteur corrige la V1 trop figée `onDamageDealt` ; le système doit proposer **un déclencheur éditable et des effets éditables**, permettant notamment `se déplace -> subit dégâts` et `réussit une esquive -> se soigne`, et extensible aux autres événements. Le moteur d'effets ne doit pas être un ensemble de scripts par compétence.
- Base `gh-pages@75a491f9e2bf695c63fb274dfbad6c7e71345648`, Laboratoire CI + Pages SUCCESS. Checkpoint `checkpoint/lab-start-event-trigger-v2-2026-10-14` et branche isolée `work/lab-event-trigger-v2-2026-10-14`. L'auteur poursuit ses éditions de créatures/capacités ailleurs : aucun JSON/asset modifié.
- Périmètre technique borné V2 : contract `triggered_buff.onEvent={event,effects}` avec événements `damage_dealt`, `damage_taken`, `movement` (changement tactique de bande réellement réussi), `evaded` (attaque dirigée contre le porteur effectivement esquivée). Tous s'appliquent au porteur d'un statut temporaire actif (bénéfique **ou** négatif) sur l'horloge de combat. Effets existants `SkillEffectV1` (self=porteur, target=autre acteur du déclencheur ou porteur pour movement). Ancien `onDamageDealt` V1 conservé **strictement compatible** ; pas deux déclencheurs concurrents sur le même statut. Les déplacements d'approche d'une compétence ou défilement graphique ne sont PAS des mouvements tactiques `movement` V2 ; extensions futures séparées.
- Autorité unique visée : nouveau petit dispatch pur `src/core/combat/triggered-buff-events-v1.js` qui réutilise `activeStatusEffectsV1` et `applyImmediateTacticalEffectsV1`, sans seconde horloge. Remplacer le helper spécialisé `applyTriggeredBuffsForOriginalDamageV1` dans `ActionResolver` par l'appel générique, alimenter `resolveMovement`, conserver les résultats `evaded` du resolver comme origine. Les événements des procs sont exclus des origins ; aucun effet sur un preview échoué. Résolution/Session restent propriétaires du vrai hit/déplacement/esquive.
- Fichiers autorisés : `src/contracts/status-effect-v1.js`, `src/core/combat/action-resolver.js`, nouveau `src/core/combat/triggered-buff-events-v1.js`, `src/ui/capture-editor-human-v2.js`, `src/adapters/renderer/status-effect-info-v1.js`, nouvelle sentinelle `tests/unit/capture-event-triggers-v2.test.mjs`, `docs/LAB_EVENT_TRIGGERS_V2.md`, `docs/LAB_ROADMAP.md`, `docs/LAB_CURRENT_WORK.md`. Aucun autre fichier de gameplay sans nouveau diagnostic dans le journal.
- Protégés : toutes créations auteur, export/import existants, moteur horloge/Runtime, UI combat, IA tactique, rayons/Arc 2/projectile clash, impact, Combat Damage, Esquive bouton et auto_dodge, V1 `onDamageDealt`, mini-jeux et autres dépôts.
- Limites/sécurité : pas d'effet déclenché par un autre effet déclenché (barrière anti-récursion), règles d'immunité/HP du moteur natives, pas de trigger sur tentative de mouvement interdite ni sur attaque esquivée pour `damage_dealt`, durée d'expiration à l'instant réel. Préviews calculatoires sans mutation de session. Sorties des morts/rappels et événements multi-source complexes à planifier plus tard. Conditions avancées, chances, passifs permanents, déplacements de trajet, ticks DoT/HoT à étendre après ce lot ; ne pas prétendre moteur universel complet.
- Gates : tests RED couvrant anciennes V1, nouveaux triggers mouvement/esquive/dégâts reçus/ambiguïté self-target et expiration + immunité/2v2, validations input auteur/import/export, Foundation + 2 Chromium, checkpoint GREEN du SHA exact, FF sous lease et CI+Pages post-publication ; test manuel smartphone par l'auteur.


### Event Trigger V2 — code natif, éditeur et tests GREEN sur SHA de code
- RED `5cba0a90af474c7eb23f844e0daf7ebfc981271b`; nouveau contrat `1aac45e0ecda370ad4135ad4d728b0a4d8e8cd53` ; centralisation Event Dispatcher `3b7cbacd3fd0ba607b9d5ad39c31e8e6451d98d2`; raccord propriétaire Action Resolver mouvement/dégâts subis/esquive `3b7222dfb04db5b348a739cfa6ca547942b7f26f`; édition et compatibilité des exports `10069960bf1437eabe6fad2d5b6ed6f5a66c735a` + `ea611870491cae4bc5596c82e5db0c5bb5e3eb14`; statut HUD `b31ba5d782486f3c3d6df6b77d3ab70c629cb6bd`.
- CI code `38542755596` au SHA `ea611870491cae4bc5596c82e5db0c5bb5e3eb14` : **Foundation + deux jobs Chromium SUCCESS**. Ancienne sentinelle `capture-triggered-buff-v1.test.mjs` protégée, V2 teste contrat, curse `movement -> damage:self`, `evaded -> heal:self`, dégâts subis, absence de no-op, expiration/preview non-mutante, 2v2 et build auteur. Les premiers RED (absence de V2), puis ancien libellé d'éditeur V1 non conforme, ont été corrigés sans supprimer de sentinelles.
- Document `docs/LAB_EVENT_TRIGGERS_V2.md` et Roadmap mis à jour ; diffusion des événements par `ActionResolver` et application par un **seul dispatcher** sur les owners natifs. Aucune création user/asset/JSON touchée. `movement` V2 désigne changement de bande tactique, PAS encore approche en attaque, dont l'événement moteur est différent ; préciser honnêtement au rapport.
- Gates restants : CI complète sur **SHA du journal final**, revue diff, checkpoint `checkpoint/lab-event-trigger-v2-green-2026-10-14` sur ce SHA exact, fast-forward protégé de `gh-pages`, CI + Pages de production. Rendu smartphone Android est réservé à la validation utilisateur.


## 2026-10-14 — Event Trigger V2.1 / vrai déplacement d'approche des capacités Capture
- Diagnostic post-V2 : `src/ui/combat-2v2-test-ui.js` n'invoque pas `CombatSession.move` ; le vrai combat Capture se déplace le plus souvent via `SkillDefinition.approachMode` (ground, aerial, teleport, burrow). Le nouveau `movement` V2 n'était relié qu'au changement tactique de bande de distance ; sans un raccord natif à la résolution d'approche, la malédiction `je me déplace -> je prends des dégâts` serait peu testable dans la vraie preview Capture.
- Autorisation auteur continue pour généraliser les déclencheurs. Base production `gh-pages@7666e2951377be718f9f555bb13ecbfa836dafc6`, CI+Pages postpublication V2 SUCCESS (38543391883/38543391697). Checkpoint `checkpoint/lab-start-approach-movement-trigger-v1-2026-10-14`, branche `work/lab-approach-movement-trigger-v1-2026-10-14`.
- Périmètre fermé : réutiliser **le même** `applyEventTriggeredBuffsV2(eventType:"movement")` lors de la résolution de compétence ayant `approachMode` différent de none et un trajet natif strictement positif, uniquement lorsque l'approche arrive effectivement au bout (SkillCompletion) ; pas au clic UI, ni par frame, ni sur un skill stationnaire. L'instant du déclencheur est celui de la **fin du mouvement/impact natif** ; pour `target`, l'autre acteur est la cible de l'approche, `self` est la créature mobile. L'issue d'impact peut être hit ou evaded : le mouvement a eu lieu dans les deux cas, sauf si l'action est annulée/KO avant sa completion.
- Fichiers autorisés : `src/core/combat/action-resolver.js` (owner uniquement), nouvelle sentinelle `tests/unit/capture-approach-movement-trigger-v1.test.mjs`, `docs/LAB_EVENT_TRIGGERS_V2.md`, `docs/LAB_CURRENT_WORK.md`. Aucune extension de contrat, d'éditeur, de moteur Runtime, de rayons/clash, d'FX, de donjon, d'assets ou de données auteur. 
- Sentinelles : acteur maudit avec skill sol/aérien/téléport/souterrain perd PV au véritable succès d'approche ; skills stationnaires ne déclenchent rien ; expiration ne produit pas d'effet ; vraie Session / Runtime, 2v2 et anciens triggers dégâts/esquive restent GREEN ; pas de double proc et pas de timer parallèle. CI Foundation + deux navigateurs / FF lease/checkpoint/CI Pages exigées. Android visuel sera contrôlé par l'auteur lors du test global.


### Event Trigger V2.1 — mouvement natif des approches (code GREEN)
- TDD RED `7ad98520e68b87bb5763f3377b587f8d03b20db6` ; raccord exclusif dans `ActionResolver.resolveSkillCompletion` commit `3f1bc9c8e1d537f4dbb303f95a7df24f6a6e8673`. Le même Event Dispatcher écoute `movement` pour les vraies approches (ground/aerial/teleport/burrow, voyage positif, action complétée). L'ancienne V2 `CombatSession.move` et tous les triggers dégâts/esquive ne changent pas.
- CI sur commit de code `38543806007` : **Foundation + Firestorm Chromium + Créatures Chromium SUCCESS**, aucune régression. Sentinelle `capture-approach-movement-trigger-v1.test.mjs` couvre quatre approches, un proc -7 PV, exclusion projectile/rayon stationnaire, expiration et 2v2. Mise à jour de la note `docs/LAB_EVENT_TRIGGERS_V2.md`.
- Gates restants : dernière CI 3 jobs du **même SHA de journal final**, contrôle production SHA de base `7666e2951377be718f9f555bb13ecbfa836dafc6`, checkpoint `checkpoint/lab-approach-movement-trigger-v1-green-2026-10-14`, FF lease protégé puis CI/Pages GREEN. Aucun test Android physique revendiqué.

## 2026-10-14 — Régression utilisateur : Esquive foudroyante vs Impact rocheux Skyfall + multi-cible
- Départ vérifié `gh-pages@6bc637802e123b1e354222880b3290e4c20abb5b` CI `38544191380` et Pages `38544189686` SUCCESS. Checkpoint `checkpoint/lab-start-auto-dodge-multitarget-impact-rocheux-2026-10-14`, branche unique `work/lab-auto-dodge-multitarget-impact-rocheux-2026-10-14`.
- Retour de test Android : compétence auteur Esquive foudroyante (statut `auto_dodge`) protège contre les projectiles frontaux mais pas contre **Impact rocheux**. Diagnostic factuel source : `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json` possède `form:projectile`, `projectileTargeting:fixed_point`, `dodgeable:true`, `effect.damage:0`, et l'effet réel `effects: [{kind:damage,targetScope:all_enemies,amount:30,channel:earth}]`; `ActionResolver.autoDodgeEvasionFor` refuse délibérément tout effet multi-cibles pour éviter de protéger un allié par erreur. `applyImmediateTacticalEffectsV1` applique alors les dégâts par victime sans consulter `auto_dodge`.
- Objectif borné : **par victime** dans le propriétaire réel `src/core/combat/immediate-tactical-effects-v1.js`, empêcher les effets offensifs immédiats esquivables sur chaque porteur actif d'`auto_dodge`, sans annuler la compétence entière ni épargner les autres victimes. Conserver priorité `skill.dodgeable:false`, catégories non offensives, soins et bénéfices, collisions, rayons/clash/retours, DoT/zone persistante et timings. Publier un événement natif de victime esquivée ; préserver les événements `evaded` pour buffs réactifs sans jouer de FX inventés. Conserver les règles mono-cible actuelles.
- Fichiers prévus : `src/core/combat/immediate-tactical-effects-v1.js`, `src/core/combat/action-resolver.js` (seulement branchement des événements d'esquive par cible dans le dispatcher existant si nécessaire), nouvelle sentinelle `tests/unit/capture-auto-dodge-skyfall-multitarget-v1.test.mjs`, `docs/LAB_AUTO_DODGE_SKYFALL_MULTITARGET_V1.md`, ce journal. Aucun changement à la fiche `cap_earth_atk_4`, autres exports, sprites ou assets ; `main` / `global-assets` / GenSrpG / Exploration protégés.
- RED : reproduire directement la fixture `cap_earth_atk_4` convertie en SkillDefinition, avec buff sur cible, autre ennemie sans buff en 2v2, attaque non esquivable, expiration, négatif on-hit, chemins direct/area, immunités / choix mono-cible préservés ; tests vrais `CombatSession` / `CombatRuntime` si possible, pas d'assertions de façade.
- GREEN : Foundation + Firestorm Chromium + Creature Library Chromium au SHA de code/final, revue fichiers et diff, checkpoint GREEN sur SHA exact, fast-forward sous lease de `gh-pages`, CI/Pages postpublication. Visuel Android sur appareil non simulé, à tester par l'auteur.

### Esquive foudroyante vs Impact rocheux — sentinelle multi-cibles et code GREEN
- Diagnostic auteur confirmé par la vraie fiche `cap_earth_atk_4` : le projectile Skyfall est esquivable mais son `damage:all_enemies` contournait `autoDodgeEvasionFor` (qui protège intentionnellement la résolution entière contre le bypass multi-cibles), puis appliquait les dégâts dans Tactical Effects sans contrôle individuel.
- RED `23241c30edccd01405742aa7940809f584fef39d`, code propriétaire Tactical Effects `c6199c911da0d116713797310ea588026fb306b6` (esquive par victime), raccord des événements de réaction V2 `39272d717cc9a169646fde7cecb7ae1f20268a72`. CI de code `38571052360` : 3 jobs Foundation/Firestorm/Creature Library SUCCESS.
- 2v2 réel avec fixture import auteur Impact rocheux, vraie perte de PV sur partenaire non protégé, statut négatif bloqué sur porteur, `dodgeable:false`, expiration, event `skill-target-evaded`, futur buff `evaded -> heal`, nonhostile heal et projectile face sans régression. Aucune modification des presets auteur, moteur de collision/FX ni de l'horloge.
- Rapport `docs/LAB_AUTO_DODGE_SKYFALL_MULTITARGET_V1.md`. Gates finale : CI 3 jobs du présent SHA documentaire, checkpoint GREEN, FF sous lease depuis `gh-pages@6bc637802e123b1e354222880b3290e4c20abb5b`, CI/Pages. Validation Android réelle ouverte.

## 2026-10-14 — Règles natives d'action : Stun Arc électrique et Esquive bouton
- Retour auteur : **Arc électrique** (`lib_chain_lightning`) applique encore un stun 3000 ms mais ne coupe plus une attaque en cours. **Esquive classique** du jeu activable alors que la créature exécute déjà une action ; ce cumul est jugé anormal.
- Base vérifiée `gh-pages@20f26e67d1533984df90debacf323fda2561f299`, CI + Pages GREEN, Esquive foudroyante/Impact rocheux précédent lot fermé et publié. Checkpoint `checkpoint/lab-start-action-stun-dodge-consistency-2026-10-14`, branche `work/lab-action-stun-dodge-consistency-2026-10-14`.
- Diagnostic précis : `ActionResolver` et `ImmediateTacticalEffects` produisent `charge-interrupt` lorsque le statut stun réel est appliqué par `Arc électrique` ; `CombatRuntime.applyResolutionInterrupt` délègue à `interruptActive`, lequel refuse lorsque `!interruptibleDuringPreparation` ou `elapsedMs>=releaseAtMs`, même si un état `stun` est actif et que le record attaque n'est pas résolu. Différent d'une simple interruption de préparation legacy. `CombatRuntime.activateRechargeableReaction` ne vérifie pas `activeByActor`; `src/ui/combat-2v2-test-ui.js` n'utilise pas `lockedByAction` pour désactiver Esquive.
- Lot cohérent : appliquer **stun natif actif** comme contrôle fort : annuler l'action de la victime tant qu'elle est encore **non résolue**, y compris préparation/trajet, via `cancelActionsForActor` existant pour arrêter le visuel et prévenir impact postérieur. Ne pas révoquer une action déjà résolue ; l'interruption legacy `interruptsPreparation` continue à respecter `interruptibleDuringPreparation`. Une attaque autonome déjà partie peut être arrêtée si son action native est encore non résolue : contrat concret à vérifier en tests (pas de rewind des impacts déjà accomplis).
- Esquive bouton : tant que la créature a une action `activeByActor` (préparation, trajet, récupération), `activateRechargeableReaction` refuse `action_in_progress` ou `recovering` **avant** de consommer la moindre charge. Garder la réaction défensive à une attaque ennemie lorsque l'acteur est libre, la durée/charges configurées, IA et 1v1/2v2. UI désactive physiquement le bouton en cas de `lockedByAction` déjà calculé.
- Fichiers autorisés : `src/core/combat/combat-runtime.js`, `src/ui/combat-2v2-test-ui.js`, `tests/unit/capture-stun-dodge-action-consistency-v1.test.mjs`, `docs/LAB_STUN_DODGE_ACTION_CONSISTENCY_V1.md`, `docs/LAB_CURRENT_WORK.md`. Pas de modification Arc électrique, créature ou export auteur, `ActionResolver`, statut `auto_dodge`, moteur collision, puissance rayon 2/Beam Clash, AI scoring, boucliers, timers, ni `global-assets`, `main`, projets GenSrpG/Exploration.
- TDD RED avant changement : vrai Arc électrique via fixture auteur en CombatSession+Runtime frappant préparation interruptible/noninterruptible et attaque en voyage; 0 hit ultérieur si action annulée ; protection contre stun immunisé ; Esquive classique refuse pendant préparation/voyage/récupération sans perte de charge, redevient utilisable libre, UI reflète la même règle.
- GREEN exige CI Foundation + 2 Chromium SHA final, checkpoint GREEN exact, FF avec lease GitHub depuis HEAD contrôlé et CI+Pages post-publication. Test tactile Android différé à utilisateur ; aucun comportement post publication n'est revendiqué avant preuve.

### Arc électrique et Esquive classique — correction et gates
- TDD RED `128c0ca69a754c52239fbd357fa54940fb6dbb31` ; propriétaire Runtime `f926773a09211a0af77741343afb588b43c8c2d0`, blocage bouton UI `169604fe0e36b5e9aefa6a95501a43b9c55a28f9`, correctif unique du harness de test `7230700322a6d79fddb1edbb1ad3060c4134b656` (actorId manquant dans une requête de charge de test, pas bug moteur).
- Stun effectif d'Arc électrique interrompt les actions non résolues pendant préparation et voyage via `cancelActionsForActor`; événement de simple interruption historique reste séparé. Activation d'Esquive ordinaire refusée sous `action_in_progress` / `recovering` avant toute consommation de charge, disponible après récupération ; UI cohérente.
- Sentinelle charge **fichier réel** `lib_chain_lightning`, avance l'horloge native et exige absence de dégâts d'attaque annulée plus tard. CI code requise/contrôlée : Foundation + Firestorm Chromium + bibliothèque créatures Chromium. Note `docs/LAB_STUN_DODGE_ACTION_CONSISTENCY_V1.md`.
- Publication seulement après CI SHA final, checkpoint `checkpoint/lab-action-stun-dodge-consistency-green-2026-10-14`, fast-forward sous lease depuis HEAD de production toujours connu, puis CI/Pages postrelease SUCCESS ; validation Android auteur distincte.

## 2026-10-14 — Intégration export auteur Esquive foudroyante (ID dodge)

- Auteur remet l'export local `gensrpg-capture-skill-dodge(1).json` au schéma `capture-skill-transfer-v1`, `draft.id=definition.id=dodge`, nom `Esquive foudroyante`. **L'export est la source canonique (§33 charte), aucun réglage n'est réinterprété.**
- Base publiée et CI/Pages GREEN `gh-pages@4fc9171e28edf731ace68f3a5f820e7b5069e739` (38577528982 / 38577525161) ; checkpoint `checkpoint/lab-start-author-esquive-foudroyante-dodge-2026-10-14`, branche `work/lab-author-esquive-foudroyante-dodge-2026-10-14`.
- Périmètre : ajouter `data/capture/showcase/dodge.capture-skill-transfer-v1.json` contenant les données auteur **sans modification**, enregistrer son chemin **une seule fois** dans `src/catalogs/capture-showcase-skill-presets-v1.js` pour l'import canonique `configuredSkills` déjà existant en `replace`. Ajouter la sentinelle `tests/unit/capture-esquive-foudroyante-author-import-v1.test.mjs`, note `docs/LAB_ESQUIVE_FOUDROYANTE_AUTHOR_IMPORT_V1.md` et ce journal. Aucun autre fichier autorisé.
- Identité/valeurs : ID `dodge` ne figure pas parmi les fichiers Showcase précédents ; source export 2532 octets SHA-256 `dd5319422c9e413168477d98d56aa26bfa32c2830a42921683340a6beab7ecb4`. Catégorie `defensive`, cible possible soi/allié, effet `apply_status` cible `target` avec `auto_dodge` 10s, 4 énergie, 300ms préparation, cooldown 20s ; icône `core:icon-skill-recall-01` et teinte clignotante blanche 800ms, opacité 0,35.
- Tests RED avant intégration : JSON identique à l'empreinte auteur, parsing/import, registre unique, rechargement de l'ID `dodge` et conservations identité/effets/visuels, true session `CombatSession` appliquant le statut à 10s, aucun détournement du bouton Esquive classique, ni altération Arc électrique/Impact rocheux déjà publiés. Protéger `main`, `global-assets`, `Zombicide-40k`, Exploration, FX, IA, rayon, stun, et données auteur existantes.
- Gates : 3 jobs CI sur SHA final, checkpoint GREEN exact, fast-forward à lease sur `gh-pages`, CI+Pages de publication GREEN. Validation mobile visuelle par l'auteur lors de son test.

### Périmètre explicité après RED/GREEN initial — sentinelles de taille Showcase
- CI `38578763049` : la nouvelle fixture auteur et son import passent leurs propres sentinelles ; Foundation affiche trois régressions **uniquement parce que trois anciens tests figent le nombre de fichiers Showcase à 22**, devenu 23 après ajout demandé. Ne modifier aucune autre assertion auteur. Élargissement borné des fichiers autorisés à `tests/unit/air-skills-enemy-bench-inspection-v1.test.mjs`, `tests/unit/capture-ailevent-rafale-author-v2.test.mjs`, `tests/unit/capture-air-dual-skill-import-v1.test.mjs` pour mettre le décompte manifeste à 23, sans modifier import, API, moteur, FX ni autres assertions.
- L'auteur n'a demandé aucune modification gameplay ; intégrer son transfert exact, vérifié SHA256 et statut `auto_dodge` dans le système natif seulement.

### Esquive foudroyante (export auteur) — vrai chemin opérationnel sur branche
- RED volontaire `368c28d46887fc91b1f6670f1f02b1d1b41a85d4` ; données exactes `3f82b19a79750606f6607e96898d6e7765bd41a1`; registre propriétaire `f3dd187f1a6829f4113c9af33a06379b41bbc034`. SHA-256 de l'export `dd5319422c9e413168477d98d56aa26bfa32c2830a42921683340a6beab7ecb4`.
- Les 3 anciennes sentinelles de taille vitrine ont été alignées à 23 (seule modification d'assertion), justification ci-dessus. Tests avec batch import réel / owner `configuredSkills` commit `28c386d2e2b119427de53ffd5f76cd1ed48d20d3`, CI `38579276536` **Foundation + Firestorm + Creature Library SUCCESS**. Note `docs/LAB_ESQUIVE_FOUDROYANTE_AUTHOR_IMPORT_V1.md` pour détails.
- Aucune création utilisateur existante changée ; compétence `dodge` intégrée comme nouvelle fiche Showcase, avec statut auto_dodge de 10s, icône Recall et teinte clignotante blanche ; pas de réécriture des corrections d'Arc électrique ou de l'esquive classique.
- Gates finaux : revue diff, CI sur SHA présent journal final et 3 jobs SUCCESS, checkpoint `checkpoint/lab-author-esquive-foudroyante-dodge-green-2026-10-14` sur SHA strict, FF sous lease `gh-pages` attendu `4fc9171e28edf731ace68f3a5f820e7b5069e739`, vérifier CI + Pages postpublication. Validation Android par utilisateur.

## 2026-10-14 — Freeze Surcharge ultime Voltige / approche -100%

- Auteur remet le fichier local **`gensrpg-capture-skill-cap_electric_special_2.json`** (`capture-skill-transfer-v1`, id `cap_electric_special_2`, Surcharge, ultime) pour analyser un gel **au remplissage de la barre de préparation d'une attaque avec approche**, après activation de l'ultime. Ne **pas** installer/remplacer sa capacité sur GitHub sans demande distincte ; analyser la configuration exacte.
- Diagnostic préalable du fichier auteur : 5 effets actifs 60s : `approach_time_modifier.modifierPct=-100`, `skill_cooldown_rate_modifier.modifierPct=-100`, `energy_regen_modifier.modifierPct=50`, `stat_modifier(electric).deltaPoints=50`, `triggered_buff.onEvent.damage_dealt -> damage:target 10`. La définition moteur `effectiveApproachTimingMs` ramène `baseMs>0` à **0ms** sous -100%. Les transitions Runtime/renderer attendent un trajet réel pour une approche; repro native et cause précise à établir en tests.
- Attention à la sémantique distincte : `skill_cooldown_rate_modifier=-100%` **suspend** l'avancement de recharge, ne l'accélère pas. `energy_regen_modifier=+50%` accroît l'énergie récupérée par tick; aucun chiffre auteur ne doit être modifié silencieusement.
- Base production immuable pour ce lot : `gh-pages@d3deb8d97d583d9679559d43feb15e9fedaf705d` (CI 38579656746/Pages 38579656573 SUCCESS). Checkpoint `checkpoint/lab-start-surcharge-zero-approach-freeze-2026-10-14`, branche `work/lab-surcharge-zero-approach-freeze-2026-10-14`. Concurrence : intégration Esquive foudroyante auteur, corrections stun et dodge et Skyfall déjà publiées : **ne pas écraser**.
- Périmètre : `src/core/combat/combat-timing.js` (propriétaire du timing d'approche, garantie un délai **strictement positif** pour une compétence réellement mobile avec baseMs>0, même sous -100% ou moins), nouvelle sentinelle `tests/unit/capture-surcharge-zero-approach-freeze-v1.test.mjs` (chaîne Status/Skill/CombatSession/CombatRuntime, préparation→release→impact/recovery; aucune boucle ou valeurs non-finies, 5 statuts exacts), ce journal et `docs/LAB_SURCHARGE_ZERO_APPROACH_TIMING_V1.md`. Si le gel est causé ailleurs, documenter le diagnostic et recadrer avant patch.
- Protégés : jeu/règles cooldown (documenter le -100% sans le modifier), `status-effect-v1`, `action-resolver`, `combat-runtime`, `ui`, sons/sprites, impacts, FX, AI, Esquive et Stun, rayons, tous exports et créatures auteurs, dépôts GenSrpG/Exploration, `main`, `global-assets`.
- TDD RED avant fix, tests normaux et >=100% réduction (résultat min 1ms pour mobile, zéro conservé si baseMs=0 ou approcheMode=none), `CombatRuntime` horloge simulée vraie session, CI Foundation + 2 Chromium GREEN SHA final, checkpoint exact, FF sous lease, CI+Pages de publication ; test smartphone auteur séparé.

### Diagnostic RED — recadrage propriétaire renderer (avant patch)
- RED `153a6a11303f7989770caca4f215ed40e5406e69` prouve que Surcharge `approach -100%` renvoie 0ms ; la vraie Session accepte l'ultime et les cinq statuts. Premier essai de sécurisation `combat-timing.js` a provoqué une **régression d'invariant validé** dans `tests/unit/combat-tactics-switch-travel-v1.test.mjs` : les valeurs <= -100% **sont censées pouvoir produire 0ms**. Ce patch a été **reverti intégralement**, aucune modification durable de l'autorité Timing. La fixture réelle de stat Électricité donne 30 dégâts (10 × 1.5 =15? plus proc 10 =30 selon rules), ne pas fixer arbitrairement 20.
- Le véritable risque spécifique au gel UI est dans `src/adapters/renderer/combat-resolution-presenter.js` : `presentRelease` appelle inconditionnellement `visuals.playApproachFor(... travelMs:0 ...)` dès que `approachMode` est ground/aerial/teleport/burrow, alors que l'action moteur peut légitimement être instantanée. Le renderer d'approche doit être **omis** lorsque durée <= 0 et conserver le chemin immédiat/impact existant, sans toucher Timing/Runtime/Rules.
- **Nouveau périmètre propriétaire justifié :** `src/adapters/renderer/combat-resolution-presenter.js` et test dédié `tests/unit/capture-surcharge-zero-approach-freeze-v1.test.mjs`; `src/core/combat/combat-timing.js` reste **identique à gh-pages de départ**. Sentinelle originale doit redevenir GREEN. Tester avec vrai Runtime+Presenter, non seulement stub.

### Surcharge — TDD et compatibilité confirmés
- RED `153a6a11303f7989770caca4f215ed40e5406e69` (timing zéro et action instantanée) puis diagnostic de conflit avec sentinelle existante `combat-tactics-switch-travel-v1`. Patch timing global entièrement revert `d6fa207273f6eb83b2a24d2b2be54b67aab79686`, modification propriétaire **uniquement visuelle**.
- L'ancien test de sons d'approche exige `playApproachFor(... travelMs:0)` pour conserver callbacks de piste/footfall. Le 1er essai de skip visuel a été rejeté par cette sentinelle (CI 38581666203), puis remplacé par une **durée visuelle minimale 1ms** dans `combat-resolution-presenter.js` commit `023038e22aa5bf9fb65055daf99b771c21b038d4`, sans toucher au `action.travelMs=0`, aux pas, au Runtime/Status/Timing ou aux données. Sentinelle end-to-end modifiée `896b63243affb61b94f55bb27fe6c2310786daf9`. Rapport `docs/LAB_SURCHARGE_ZERO_APPROACH_TIMING_V1.md`.
- Gate technique Foundation SUCCESS et Firestorm Chromium SUCCESS sur SHA `896b63243affb61b94f55bb27fe6c2310786daf9` (run `38581993589`). Dernier gate à confirmer sur SHA **final incluant documentation** : 3 jobs, checkpoint GREEN, FF sous lease et CI+Pages postpublication ; test Android auteur ultérieur.

## 2026-10-14 — Auteur Surcharge corrigée et icône Recall (import Showcase)
- Autorisation explicite : l'auteur fournit `gensrpg-capture-skill-cap_electric_special_2.json` et demande son dépôt dans le Labo Combat, avec **temps de trajet divisé par 2**, **recharge des compétences 2× plus rapide** et icône **Recall**. Ne pas modifier les autres valeurs. Le fichier `dodge` (Esquive foudroyante) a déjà été publié séparément et reste intact.
- Base `gh-pages@3205bd2e8a71850a1c64b401f89595cecea6188d` CI/Pages SUCCESS; checkpoint `checkpoint/lab-start-surcharge-author-correct-2026-10-14`, branche `work/lab-surcharge-author-correct-2026-10-14`.
- Diagnostic vérifié : `approach_time_modifier.modifierPct=-100` était instantané, objectif **-50** ; `skill_cooldown_rate_modifier.modifierPct=-100` stoppait la recharge, objectif **+100**. Le status Électricité `stat_modifier(electric)+50` est déclaré dans le vrai registre ; le soin d'énergie reste +50% ; déclencheur damage_dealt -> damage 10 conservé ; 60s, énergie 3, préparation 2000, ultime 1/combat conservés.
- Icône officielle existante `core:icon-skill-recall-01` -> `assets/library/core/icons/skills/icon_skill_recall_01.webp` (pas de nouvel asset).
- Propriétaire import : `data/capture/showcase/cap_electric_special_2.capture-skill-transfer-v1.json` créé comme transfert auteur avec seulement 3 changements : -100→-50, -100→+100, et `presentation.visual.icon.assetId` Recall ; `src/catalogs/capture-showcase-skill-presets-v1.js` enregistre la fiche UNE fois dans le batch natif `hydrateCaptureShowcaseSkillPresetsV1` (même ID, remplacement canonique). Pas de réécriture de la fiche de Voltige ou de son équipement.
- Fichiers autorisés : les 2 ci-dessus, nouvelle sentinelle `tests/unit/capture-surcharge-author-correct-recall-v1.test.mjs`, note `docs/LAB_SURCHARGE_AUTHOR_CORRECT_RECALL_V1.md`, ce journal. Aucun nouveau code de Runtime / Status / Timing / Renderer.
- RED d'abord : fixture fichier source exact + reconnaissance + registration + roundtrip + vrai combat pour durée trajet/cooldown et cinq effets sans freeze, vérifier pas de régression avec `capture-surcharge-zero-approach-freeze-v1.test.mjs`. Tests Foundation et deux Chromium GREEN du SHA final, checkpoint GREEN exact et FF `gh-pages` sous lease ; CI+Pages prod. Test Android de l'auteur distinct.
- Concurrence protégée : fixes Skyfall/esquive, Stun Arc électrique, Esquive classique, variantes d'approche, auteurs en édition et assets, `main`, `global-assets`, GenSrpG principal et Exploration.

### Surcharge auteur — recadrage sentinelles du décompte Showcase
- Import réel `f01e757051cb84f43f2250fe81ea2accf84cec58` : seules les modifications demandées (-50 temps, +100 recharge, icône Recall) ont été effectuées sur le transfert source fourni, les autres clés restent identiques en JSON. Enregistrement catalog unique `c7fa78281147c85495f6ca8804d46324214a0361`. La nouvelle sentinelle RED a commencé en `768aca2842e89f60d11305f994653a6a53731c1c`.
- Diagnostic CI après registration `38591961491` : 3 anciennes sentinelles de vitrine figent **le nombre historique 23** et échouent de façon attendue après ajout d'UNE fiche → **24**. Les tests de fidélité des créations restent GREEN. Le nouveau test avait également une erreur de regex de comptage (corrigée `075215096e206216a5d625ef6d4441e8d87db1a0`).
- **Extension minime du périmètre autorisé** : adapter uniquement l'assertion `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1.length,23` → `24` dans `tests/unit/air-skills-enemy-bench-inspection-v1.test.mjs`, `tests/unit/capture-ailevent-rafale-author-v2.test.mjs`, `tests/unit/capture-air-dual-skill-import-v1.test.mjs` sans changer aucune fixture/sha/original de l'auteur. Pas de rustine Runtime. Repasser CI et revues.

### Diagnostic final Surcharge — identité native et insert/replace
- Foundation `38592336221` : après adaptation correcte des trois décomptes Showcase 23→24, seule la sentinelle **nouvelle** échoue sur son hypothèse de départ : `capturePortableNativeSkillDraftsV1()` n'inclut pas `cap_electric_special_2` car l'ancienne capacité native est complexe (debuff/stat), non migrée dans ce sous-catalogue. La source historique `CAPTURE_USED_ABILITY_CATALOG_V2` contient bien l'ID, et la créature Voltige le référence.
- La vraie API `planCaptureTransferImportV1` produit `insert-skill` si l'ID n'a pas encore été configuré, puis `replace-skill` à une future réimportation. Corriger **uniquement cette sentinelle nouvelle** pour tester insertion canonique initiale, puis remplacement stable et zéro doublon lors de la réimportation. Ne jamais injecter une fausse capacité pour fabriquer un remplacement. Le transfert auteur lui-même est valide et le test Session x2 est GREEN.

### Surcharge auteur — revue diff, validation native et gates de publication
- Revue scope de la branche avant journal final : **8 fichiers seulement**, exactement 1 nouveau transfert de compétence auteur, 1 registration Showcase, 1 nouvelle sentinelle, 3 assertions de taille, 1 note dédiée, ce journal ; aucun code de combat/horloge/renderer, aucun fichier créature, aucune image ou son, aucune autre compétence modifiée.
- Source auteur importée avec contrôle structurel : après inversion des trois décisions demandées (approach -50 -> -100, cooldown +100 -> -100, suppression seule de l'icône Recall), l'objet JSON initial est **identique** en totalité. Vrai moteur : skill mobile 1200ms -> 600ms, et vitesse cooldown +100% : 1s écoulée retire 2s de recharge. Les cinq effets sont acceptés et donnent le vrai résultat du `CombatSession`.
- CI RED révélait 3 sentinelles de longueur 23 attendues à corriger en 24 et un test mal construit (fixture portable ne contenait pas cette ancienne capacité complexe ; première installation = `insert-skill`, rechargement identique = `noop`). Les rectifications ont concerné **uniquement les tests**, sans changer le contrat ni dupliquer les capacités. Sentinelle du freeze existante protégée.
- Commit fonctionnel/test `bc715c5d0f8c7ce95e1a8c2708be8675fb63c522` : CI `38593094338`, Foundation SUCCESS, Firestorm Chromium SUCCESS, Creature Library Chromium en cours au moment du journal ; exiger ensuite **3 jobs SUCCESS sur le SHA de ce journal** pour checkpoint `checkpoint/lab-surcharge-author-correct-green-2026-10-14`, FF sous lease sur `gh-pages`, et CI+Pages de production du même SHA. Aucune validation physique Android revendiquée ; l'utilisateur poursuit ses tests.

## 2026-10-14 — Correction collisions de statuts entre compétences (rapport utilisateur)
- Base GREEN `gh-pages@7fc9f8327258eef821abc8d7689574d15b4f81ae`, CI `38593501041` + Pages `38593498611` SUCCESS. Branche `work/lab-cross-skill-status-identity-v1-2026-10-14`, checkpoint `checkpoint/lab-start-cross-skill-status-identity-v1-2026-10-14`.
- Deux bugs signalés : (1) `Arc électrique` ne coupe plus l'attaque mobile quand `Surcharge` est active, (2) `Esquive foudroyante` ne fonctionne plus après les 5 effets de l'ultime. Cause confirmée dans les données LIVE : `cap_electric_special_2` (Surcharge) `approach_time_modifier.id=status-1` et `energy_regen_modifier.id=status-2` ; `dodge` (Esquive foudroyante) `auto_dodge.id=status-1` ; `lib_chain_lightning` (Arc électrique) `stun.id=status-2`. `applyStatusEffectV1` prend la définition existante sur match simple `definition.id` puis `refresh` sans la remplacer. Ce n'est PAS une limite numérique.
- Objectif fermé : identité **runtime** par couple `(sourceSkillId, definition.id)` sur le combattant, pour conserver les statuts d'autres capacités simultanément. `refresh`/stack restent autorisés par le même couple, événement de seuil ou expiration sur la bonne instance. Le rendu HUD/FX doit créer une entrée par ce même couple tout en récupérant les visuels avec le `statusId` auteur ORIGINAL et `sourceSkillId`. Aucune modification de JSON auteur, de slot, de status.id ou d'assets.
- Fichiers autorisés : `src/core/combat/status-effect-runtime-v1.js`, `src/core/combat/combat-state.js`, `src/adapters/renderer/dom-status-fx.js`, nouvelle sentinelle `tests/unit/capture-cross-skill-status-identity-v1.test.mjs`, rapport `docs/LAB_CROSS_SKILL_STATUS_IDENTITY_V1.md`, ce journal. Extension si vraie cause à justifier.
- Protégés : `src/core/combat/combat-runtime.js` stun/interrupt et bouton Esquive, `src/core/combat/action-resolver.js` auto_dodge et règles, combat damage/skills, tous exports `data/capture/showcase`, AI, rayons, collisions, moteur FX (sauf clé identité des statuts), `main` `global-assets` et dépôts adjacents. Ne pas contourner les règles par immunité/rustine/stun hardcodé.
- RED : reproduire collision d'ID réel depuis les trois exports auteur, sans artifice ; `CombatSession` Surcharge(approach status-1) + Esquive(status-1), recharge énergie(status-2) + Arc Stun(status-2), HUD distinct, expiration/refresh par source, stack conservé, réel `CombatRuntime` stoppe une attaque mobile après Arc Stun. CI Foundation + 2 Chromium SHA final, checkpoint GREEN même SHA, FF lease et CI/Pages production ; Android à valider auteur.

### Correctif collisions — validations et compatibilité de la charte
- RED sentinelle `ac31dad0d9afbb654145150a5b0b7d089f6ea922` prouve les vrais exports Surcharge+Esquive et Surcharge+Arc ; 5 effets, `status-1` et `status-2` identiques, statu quo insuffisant.
- Runtime `b5b53f3b67e0d36e75bf199fdecd9dc57f0af089`, protection du minuteur action `03f4bea5d1439b6e39dd0f7a6db535fdc6511822`, Etat `8a2c5d0334c48951aecf9ddfcfa3117d90c53796`, HUD `9c6f2714ef8b589497910bea99de29967c64f227`.
- La première clé par `sourceSkillId + id` seule protégeait les créations utilisateurs, mais dégradait deux sentinelles historiques intentionnelles (refresh/stack du **même statut**, ID et définition identiques, depuis des compétences différentes). Correction native `7cb48ef2d892ffa08d735ae724b383f7826b7160` : dédoublement uniquement si définition réellement distincte ; les mêmes définitions peuvent continuer à partager un stack/refresh. Jamais retirer ni contourner les anciennes sentinelles. Consulter `docs/LAB_CROSS_SKILL_STATUS_IDENTITY_V1.md`.
- Le correctif de portée ne modifie pas `CombatRuntime` ni `ActionResolver` ; lorsqu'Arc stun est réellement présent, leur interruption native déjà validée se réactive correctement. Les effets visuels restent rattachés à l'ID et à la source originaux.
- Gate final : Foundation + 2 Chromium au SHA **du présent journal** et diff du dépôt, checkpoint `checkpoint/lab-cross-skill-status-identity-v1-green-2026-10-14` sur SHA exact, FF sous lease avec base de prod validée, CI+Pages postpublication. Android par l'auteur après publication, aucun succès manuel inventé.


## 2026-10-14 — Correction réelle interruption visuelle du déplacement lors d'un stun (retour Android)
- Signalement auteur : après les derniers correctifs les actions fonctionnent, mais le **stun n'interrompt toujours pas un mouvement en cours**. Dépôt seul `slyen4425-cloud/GenSrpg_labo_combat_dynamique`, base prod `gh-pages@a1ecd502a7f87a99892b2cc1e988c97b0c7b25bb` CI run `38600489528` et Pages `38600488777` SUCCESS ; checkpoint `checkpoint/lab-start-stun-motion-visual-cancel-2026-10-14`, branche `work/lab-stun-motion-visual-cancel-2026-10-14`.
- Diagnostic du vrai chemin : `CombatRuntime.applyResolutionInterrupt` annule l'action native non résolue si statut stun actif via `cancelActionsForActor`, appelle `onInterrupted`. Les deux UI `combat-2v2-test-ui` / `combat-test-ui` appellent `presenter.cancelActionPresentation(actorId)`. Mais `src/adapters/renderer/combat-resolution-presenter.js` appelle `visuals.cancelFor(actorSlot)` **seulement si** `rosterVisualsByActor.delete(actorSlot)` est vrai (invocation/rappel), alors que `presentRelease` anime l'approche avec `visuals.playApproachFor` sans créer de rosterVisualsByActor. Donc un mouvement en cours reste visuellement animé après interruption même si l'action et ses dégâts sont annulés.
- Objectif **propriétaire unique** : dans `CombatResolutionPresenter.cancelActionPresentation`, annuler inconditionnellement l'animation en cours du même acteur par `visuals.cancelFor(actorSlot)` (approche, attaques), conserver les nettoyages existants (cast/projectile/sons/pas). Ne jamais annuler un autre combattant ni provoquer un nouveau hit/collision. Garantir les deux parcours UI par le callback existant, sans deuxième machine de mouvement.
- Fichiers autorisés : `src/adapters/renderer/combat-resolution-presenter.js`, nouvelle sentinelle `tests/unit/capture-stun-movement-visual-interrupt-v1.test.mjs`, nouveau rapport `docs/LAB_STUN_MOTION_VISUAL_CANCEL_V1.md`, ce journal. Si la seule correction visuelle ne suffit pas aux vraies scènes, recadrer avant une autre autorité.
- Protégés : Arc électrique auteur, Surcharge, Esquive foudroyante, fichiers `data/capture/showcase`, `global-assets`, `main`, combat `ActionResolver`/`CombatRuntime`/`StatusRuntime`, IA, timer, rayons/clash, collisions, triggers événement, projectiles Skyfall, FX/sons et les autres dépôts GenSrpG/Exploration.
- RED test vrai `CombatSession` + `CombatRuntime` avec fixture auteur `lib_chain_lightning` et `CombatResolutionPresenter` branché via les callbacks de production ; vérifier approche visuelle active, interruption `onInterrupted`, retour à idle / `visuals.cancelFor`, absence de hit tardif, seuls visuels du porteur du stun annulés ; confirmer que stun inefficace/immunisé ne stoppe pas mouvement. CI Foundation + 2 Chromium sur le SHA final ; checkpoint GREEN exact, fast-forward sous lease `gh-pages`, CI/Pages postrelease ; validation Android par utilisateur.

### Stun : correction visuelle du mouvement — test end-to-end et sentinelles
- Reproduction **RED** `f8a0413a6d20bae319f4b2457229f19b79bb7ca5` sur vrais Arc/Runtime/Presenter : l'action mobile était annulée dans le moteur, mais l'animation `playApproachFor` de la créature ne recevait aucun `cancelFor`. Première correction naïve `5893d04db292c99314c39c6b47e8f4a99c8c182d` aurait annulé **deux fois** l'invocation/rappel ; la sentinelle historique `zone-idle-recall-fx-v1` l'a empêchée. Aucune rustine dans Rules/Runtime.
- Correction owner Presenter `afa72a74355c14e50d6cbba362a4870f2b9455a3` : suivis privés par acteur pour les `playApproachFor` en cours et `cancelFor` uniquement si approche ou visuel roster réellement actif ; plus de course après stun et nettoyage dispose/sons. Sentinelles TDD `bab1752050acfc9965063335d1bd854216e8dcbe` : ground, aerial, teleport et vrai callback cancel ; `burrow` n'est pas frappé par Arc lorsqu'en présence souterraine (règle de combat protégée), ne doit donc **pas** recevoir de faux stun.
- Gate code `bab1752050acfc9965063335d1bd854216e8dcbe` run `38617339579` : **Foundation + Firestorm Chromium + Creature Library Chromium SUCCESS**. Rapport `docs/LAB_STUN_MOTION_VISUAL_CANCEL_V1.md` commit `d057c4529ee47466e4456721322a60657958cbd7`. Un seul nouveau test, aucun transfert/asset auteur modifié.
- Fin : exiger CI 3 jobs sur le SHA final de ce journal, checkpoint GREEN exact `checkpoint/lab-stun-motion-visual-cancel-green-2026-10-14`, FF avec lease `gh-pages` attendu à la base `a1ecd502a7f87a99892b2cc1e988c97b0c7b25bb`, puis CI+Pages post-publication. Validation visuelle Android à l'auteur.

## 2026-10-14 — Intégration de l'export auteur Voltige V4 — chargement réel du loadout

- Demande : « Place ce fichier » : `gensrpg-capture-creature-crea_voltik(4).json`, export `capture-creature-transfer-v1` / `draft.id=crea_voltik` fourni par l'auteur. Source SHA-256 `27a57678225ce2ed0f1a0ae270b59a2bcd48ccca79af59e96b84aba09e6c4fd6` (5458 octets). Comparaison **octet pour octet** avec V3 d'origine (SHA-256 `9128a124a0ee8db863c41cf32206a72db7be15f1cca6759dc5070f5075f58535`) : 3 changements seulement : `draft.skillIds` ajoute `dodge`, `loadout.slot-4` passe de `lib_paralyze` à `dodge`, `slot-ultimate` de `null` à `cap_electric_special_2`. Identité, niveau, stats, résistances, visuels, sockets et tous les paramètres inchangés.
- Base LIVE validée `gh-pages@2a322cf094abbd70890aff5c4bbe5fe99f923c9c` ; CI `38617750634` et Pages `38617751355` SUCCESS, incl. interruption native/visuelle des mouvements sur stun récemment corrigée. Checkpoint `checkpoint/lab-start-voltige-v4-author-loadout-2026-10-14`, branche `work/lab-voltige-v4-author-loadout-2026-10-14`.
- Périmètre exact : **remplacer uniquement** `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json` par les octets de l'auteur, maintenir le registre unique existant `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1`; renforcer les tests de transfert fidèle en `tests/unit/capture-voltige-v3-author-update-v1.test.mjs` et nouvelle sentinelle V4 `tests/unit/capture-voltige-v4-author-loadout-v1.test.mjs`; nouveau rapport `docs/LAB_VOLTIGE_V4_AUTHOR_LOADOUT_V1.md` et présent journal. Ajuster uniquement les sentinelles directement obsolètes si la CI révèle des attentes V3 légitimes. Aucune modification des définitions de compétences, moteur, FX, shaders, assets, autres personnages, Catalogues, `main` ou `global-assets`.
- Vérifier que les compétences `dodge` et `cap_electric_special_2` existent déjà une fois dans `configuredSkills` (les transferts Showcase dédiés sont présents). Ne rien créer ni dupliquer.
- RED : contrôle SHA V4 exact, schéma, ID, 15 compétences enregistrées, slot-4 `dodge`, slot-ultimate `cap_electric_special_2` ; vrai import/export `CaptureTransfer`, unicité du registre, stats et sockets inchangés, chargement éditeur et chemin du test Combat inchangés. V3 history test actualisé sans supprimer ses invariants visuels, stats, et sockets ; CI Foundation + 2 navigateurs, checkpoint GREEN SHA exact, fast-forward sous lease protégé, CI + Pages postpublication ; test visuel smartphone à l'auteur.
- Risque principal : import local avec `crea_voltik` pourrait rester affiché depuis IndexedDB local si une version enregistrée personnelle prévaut ; aucune suppression de données utilisateur ne sera faite pour forcer l'affichage. Aucun changement à la correction `stun` ou à l'IA.


### Voltige V4 — remplacement fidèle réalisé, gates
- TDD RED `6133d3b568b5b87a7c36cdde224364a70d29908f` : nouvelle sentinelle V4 attendue après remplacement, CI `38624286418` FAILURE attendu. Remplacement octet-identique `1d204bd9d5ac1a4c4068f001fc3f8a441bb649db` avec Git Blob `a339e8bb77b06f2ff0ed95dc34eebca6277f66b9` (= upload auteur exact).
- Les 3 changements exclusifs sont l'ajout de `dodge` aux compétences connues, le slot-4 `dodge` et le slot-ultimate `cap_electric_special_2`. Deux compétences déjà enregistrées une fois dans Showcase ; aucun fichier compétence modifié. La fiche identité `crea_voltik`, stats, niveaux, sockets et visuels restent inchangés.
- Tests obsolètes V3 corrigés exclusivement pour leurs anciennes attentes de SHA/loadout : `b1d66a85731c71341bc6b89a883c007430c339d6` et `09308ec8280ba099c8d765ad27384b4d4cfdf71c`. Autres assertions conservées (Arc électrique/stack, images, position, import/export). Rapport : `docs/LAB_VOLTIGE_V4_AUTHOR_LOADOUT_V1.md`.
- Fin technique soumise à la réussite des **3 jobs CI sur SHA documentaire final**, checkpoint `checkpoint/lab-voltige-v4-author-loadout-green-2026-10-14` sur SHA exact, publication `gh-pages` fast-forward avec lease depuis `2a322cf094abbd70890aff5c4bbe5fe99f923c9c` seulement si aucun travail concurrent n'a été publié, puis vérification CI/Pages postrelease. Test Android auteur différé, sans succès inventé.


## 2026-10-14 — Frappe téléportée : remplacement fidèle de l'export auteur V1

- Source utilisateur : `gensrpg-capture-skill-teleport-strike(1).json`, schéma `capture-skill-transfer-v1`, `draft.id=definition.id=teleport-strike`. Ancien preset déjà présent : `data/capture/showcase/teleport-strike.capture-skill-transfer-v1.json` ; conserver le même ID et sa déclaration unique dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`.
- Base de départ : `gh-pages@c527e9ae578aa4bd07209f7fa2d69acecf372420`, HEAD prod incluant le chantier Voltige V4. Point de vigilance : CI Laboratory run `38624745283` en échec (Chromium creature-library-browser : timeout 50s après les premiers scénarios), mais foundation et firestorm SUCCESS ; ne pas appeler GREEN ni faire de fast-forward vers `gh-pages` avec une CI rouge.
- Checkpoint de départ : `checkpoint/lab-start-teleport-strike-author-refresh-2026-10-14`. Branche isolée : `work/lab-teleport-strike-author-refresh-2026-10-14`. Ne pas modifier `main`, `global-assets`, `Zombicide-40k` ou l'exploration.
- Propriétaire : unique fichier auteur Showcase, chargé par le catalogue existant et par l'API canonique d'import `CaptureTransfer`; `CombatSession` reste propriétaire du calcul / des cooldowns. Aucun moteur alternatif.
- Delta fonctionnel exact depuis l'ancienne capacité : `preparationMs` 1200 -> 500 ; `recoveryMs` 650 -> 0 ; `cooldownMs` 0 -> 20000 ; effet `damage.amount` 24 -> 16. Les icônes, sons, identifiants, portée, mode `teleport`, énergie 3, projectile clash power 0, slot, catégories et autres champs sont inchangés.
- Fichiers autorisés : le preset `teleport-strike` existant ; sentinelle `tests/unit/capture-voltige-teleport-arc-stack-timer-v1.test.mjs` (anciennes valeurs attendues désormais obsolètes), sentinelle spécifique de transfert/runtime ; rapport `docs/LAB_TELEPORT_STRIKE_AUTHOR_REFRESH_V1.md` et le présent journal. Aucun fichier moteur, autre preset, créature ou asset.
- Tests prévus : cohérence fidèle export/import de l'export auteur, unicité catalogue/IDs, non-régression Voltige et Arc électrique, effets/montants/cooldown/charge dans le vrai `CombatSession`, CI foundation + Firestorm Chromium + Creature Library Chromium (sans prétendre GREEN si le timeout indépendant persiste). Vérification Android utilisateur nécessaire avant GREEN produit.
- Critère de livraison : contrôles unitaires et 3 jobs CI sur le SHA documenté, checkpoint GREEN sur SHA exact uniquement si tous verts, mise à jour `gh-pages` sous lease uniquement sans travail concurrent, puis CI/Pages postpublication ; sinon laisser la branche isolée et rapporter le blocage réel.


### Vérifications techniques effectuées

- Commit source + tests : `f63c8b561c1396b2311042c1ecfc5d3df4f2442a`.
- Fichier auteur : Git Blob `d5306701dae6b9082a0c708d473c72508e6e029a`, égal au blob calculé localement sur le fichier original de 2415 octets ; SHA-256 auteur `9229bcb607939e0ffd6f8e284f3e1f2ba24ab5ec1ef493343a9000ef09f53ab2`.
- Diff JSON exhaustif par rapport à l'ancien preset : **4 propriétés uniquement** (`preparationMs`, `recoveryMs`, `cooldownMs`, `effects[0].amount`). Aucun changement d'assets, d'ID ou de créature.
- CI de branche `38627241110` : **SUCCESS** pour `foundation` (1776/1776 tests Node), `firestorm-zone-growth-browser` et `creature-library-browser`.
- Le timeout Chromium observé sur le premier passage de la base `c527e9a` ne s'est pas reproduit : CI base rejouée en SUCCESS `38626906282`; ne pas le confondre avec une régression introduite par Frappe téléportée.
- Publication conditionnée au résultat des 3 jobs de CI du commit documentaire final ; checkpoint GREEN sur le SHA final exact ; fast-forward avec lease sur `gh-pages`, postpublication CI + Pages, validation Android par l'auteur. **Aucune validation Android automatique revendiquée.**


## 2026-10-14 — Dracendre + Brasier primordial, deux presets auteur

- Dépôt et charte : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`, §§15–18, 33 et 34. Lecture LIVE de `LAB_CHARTE`, `LAB_ROADMAP`, `LAB_ARCHITECTURE`, `LAB_CURRENT_WORK` et politique de checkpoints. `main`, `global-assets`, GenSrpG principal et Exploration sont protégés.
- Point de départ production : `gh-pages@aeb676cbc402fd2427bea2e74ef985a2469cd95f`, CI `38627666638` SUCCESS (3 jobs) et Pages `38627673733` SUCCESS. Checkpoint de départ `checkpoint/lab-start-dracendre-brasier-author-v1-2026-10-14`; branche dédiée `work/lab-dracendre-brasier-author-v1-2026-10-14`. Ne jamais travailler sur la branche de production directement.
- Inputs auteur : `gensrpg-capture-creature-crea_dracendre.json` (4322 octets, SHA-256 `a531d53c9edefd7c8c28ce0f3dc6fdf36a699a834d2573282e161247e519ef0a`), `gensrpg-capture-skill-cap_fire_atk_7.json` (1901 octets, SHA-256 `1e63b095a72d07673fc7c584e54f2b411d0188d44f4007ad551b9282c627deea`). Conservation stricte des octets/valeurs.
- Identités : `crea_dracendre` et `cap_fire_atk_7` existent dans les données historiques ; cette opération crée **deux presets auteur Showcase** non encore présents, chargés dans les autorités `configuredCreatures` et `configuredSkills`, via les catalogues/transfer batch déjà existants ; aucun nouvel owner ni doublon d'ID.
- Périmètre fichiers : créer `data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json` et `data/capture/showcase/cap_fire_atk_7.capture-skill-transfer-v1.json`, déclarer exactement une fois chacun dans `src/catalogs/capture-showcase-creature-presets-v1.js` et `src/catalogs/capture-showcase-skill-presets-v1.js`, adapter l'assertion hardcodée de cinq créatures dans `tests/unit/capture-showcase-creature-presets-v1.test.mjs`, ajouter sentinelle `tests/unit/capture-dracendre-brasier-author-v1.test.mjs`, rapport `docs/LAB_DRACENDRE_BRASIER_AUTHOR_V1.md` et ce journal. Ne pas modifier moteur, règles, assets, autres créatures/compétences.
- Références : 20 compétences dans le preset Dracendre ; slot ultime `null` malgré `cap_fire_atk_7` dans les capacités connues ; ne pas équiper automatiquement. Le niveau requis de Brasier dans le JSON est 20 alors que sa description textuelle mentionne 46 ; ne pas corriger silencieusement. Dracendre réutilise 3 assets Braisombre dans `global-assets`, pas de nouveaux assets produits ; contrôler leur présence réelle, le catalogue unique et la résolution runtime, puis test visuel utilisateur distinct.
- Tests : TDD RED sur transferts absents, unicité des manifestes, conservation SHA-256, vérification de la fiche entière (profil volant, PV, statistiques, 13 résistances, 20 compétences, loadout exact, évolution Lv28, rendu Braisombre), import/export des deux, vrai batch atomique sans doublons et vrai `CombatSession` à 10 dégâts Feu, 0 cooldown ; vérifier les tests existants, les 3 jobs de CI (foundation, Firestorm Chromium et Creature Library Chromium), puis checkpoint GREEN au SHA exact, fast-forward sous lease sur `gh-pages` si inchangé, CI et Pages après publication. Test Android auteur requis pour GREEN utilisateur.
- Attention : règle §34 interdit de déclarer les images Braisombre nouvelles, créées ou vérifiées artistiquement sans inspection de leurs fichiers : uniquement références d'assets existants.


### Dracendre/Brasier — code intégré, recadrage sentinelles, statut de livraison

- Sources exactes : Git Blobs `c972765bf9db4ac02ca0cb7c6676054d1bf03a97` (Dracendre) et `4dd0aa0db81d5ccbd9af252d4fd28058c2e9f651` (Brasier), identiques octet pour octet aux deux exports uploadés. Un preset dans chaque registre déjà propriétaire ; `main` et `global-assets` protégés.
- RED de nouveau test `e50d8b7a`; CODE `a14e0561`. La CI initiale a identifié trois **anciennes assertions de nombre 24** à faire évoluer en 25 et une sentinelle dont la fixture ne chargeait pas `fireball`. Extension strictement sentinelles (3 fichiers de tests de catalogue existants) en `4d334e47`, sans changement métier.
- La validation réelle de l'évolution doit inclure `crea_volcadrake` du catalogue canonique historique : la fixture a été recentrée sur les mêmes imports natifs que Human Editor en `f0f6f704`. Références/chargement depuis les propriétaires uniques, aucun second moteur.
- Les 3 visuels référencés sont des assets Braisombre existants dans `global-assets`; aucun média neuf, pas de contrôle artistique réalisé. La compétence ne fournit aucune présentation (null) et la description évoque niveau 46 malgré `requiredLevel=20` : garder l'export exact ; prévenir l'auteur.
- Rapport `docs/LAB_DRACENDRE_BRASIER_AUTHOR_V1.md`. CI, checkpoint exact et publication conditionnels aux trois jobs du SHA documentaire final ; validation Android utilisateur séparée.

## 2026-10-15 — Lot Dracendre et Vague de chaleur (exports auteur)
Base gh-pages 1efd78b440b679ca2da957fc8207141decb0d8d1. Checkpoint checkpoint/lab-start-dracendre-heatwave-refresh-2026-10-15. Branche work/lab-dracendre-heatwave-refresh-2026-10-15. Charte et roadmap lues.
Périmètre : remplacer le preset Dracendre par l'export utilisateur, ajouter le preset officiel lib_heat_wave et sa déclaration unique dans le manifeste Showcase, mettre à jour les sentinelles obsolètes et créer le test de transfert/runtime ; journal + rapport. Respecter strictement les octets source et utiliser les propriétaires existants configuredCreatures/configuredSkills. Aucune modification moteur, assets, autre dépôt.
Tests : empreintes originales, import/export, équipement, audio, effets, vrai batch, CI 3 jobs, checkpoint GREEN au SHA final, preview et publication par fast-forward sous lease. Test smartphone distinct.
Propositions seulement, hors lot : répétition configurable du son de déplacement durant le vol via scheduler audio existant ; statut multiplicateur de dégâts sortants, indépendant des résistances et universel aux statistiques futures.

## 2026-10-15 — Lot Dégâts sortants universels V1

- Base `gh-pages@2d352918b0ac5f829c2bb349da7fb4ad121d2f06`, checkpoint `checkpoint/lab-start-universal-outgoing-damage-v1-2026-10-15`, branche `work/lab-universal-outgoing-damage-v1-2026-10-15`. Charte, roadmap, architecture et checkpoints relus. Les autres dépôts et `main` sont protégés.
- Besoin auteur : un même coefficient universel des dégâts **infligés** (pas résistances), provenant (a) d'un statut temporaire positif/négatif librement paramétrable, (b) d'une caractéristique personnalisée `Puissance`, ex. 1 point = 1 % de dégâts infligés, sans toucher aux effets élémentaires ou aux résistances. Univers configuré par chaque créateur et compatible nouvelles statistiques.
- Unique owner : `CaptureStatRegistryV1` et `StatEffectRulesV1` pour le coefficient de statut, projection dans `CaptureStatEffectsV1`/`StatusEffectProjectionV1`, calcul final uniquement dans `computeCombatDamageV1`. `Human Editor` propose le coefficient global par point et le statut universel. Aucun second système de dégâts. Pour les dégâts directs, le multiplicateur s'applique sans type ; les dégâts indirects nécessitent vérification des voies existantes.
- Tests : TDD contrat + vrai CombatSession à dégâts physique, feu, personnalisé avec/sans statut (stack, expiration, résistance indépendante), interface Human Editor et export/import, sentinelles existantes, CI trois jobs, checkpoint GREEN seulement au SHA vérifié.
- Son de mouvement volant : **lot distinct** après publication de ce GREEN, branche/checkpoint propres ; conserver `CreaturePresentationBinding.audio.movement` comme autorité, régler répétition et intervalle pendant approche, annuler avec scheduler existant, test 1v1/2v2 et UI.

## 2026-10-15 — Lot Creature Movement Audio Loop V1

- Base `gh-pages@ffd5b6d9abfa42bbd0b663ec8ccb0ca19bb55e0e`, lot dégâts universels déjà GREEN et publié. Checkpoint `checkpoint/lab-start-creature-movement-audio-loop-v1-2026-10-15` et branche `work/lab-creature-movement-audio-loop-v1-2026-10-15` créés. Lecture live charte/roadmap/current work/architecture/checkpoints effectuée. Aucun changement dans le dépôt principal, exploration, `global-assets` ou `main`.
- Mission : dans `Créature > Sons > Déplacement`, activer selon la créature le mode `once` (défaut rétrocompatible), `repeat` (son rejoué avec pause configurable entre répétitions), ou `loop` (son continu). Durée liée **uniquement** au déplacement aérien contact, synchronisée avec `CombatResolutionPresenter` / `DomCombatAudio` existants, arrêt sur fin d'approche, interruption, rappel, KO, dispose ; pas de timer gameplay ni second owner. Les créatures terrestres continuent leurs cues de pas synchronisées.
- Fichiers autorisés : contrat `CreaturePresentationBindingV1` pour `audio.movement` (V2/V3 le réutilisent), `Human Editor` et sa page HTML, `DomCombatAudio`, `CombatResolutionPresenter`, tests audio dédiés / sentinelles, doc de lot et ce journal. **Aucun média binaire nouveau**, pas de modification d'assets ou de compétences.
- Garanties : import/export créatures conserve les nouvelles options, essais réels sur dracendre exporté inchangé (mode par défaut `once`), ancienne option `movement` continue, son de compétence projectile/rayon distinct, pas de multi-autorité. CI 3 jobs au SHA exact, checkpoint GREEN, fast-forward lease et Pages seulement si tous verts. Test sonore Android de l'auteur reste distinct.


## 2026-10-15 — Deux exports auteur + affichage du bonus universel sortant

- Base de production et checkpoint start : `gh-pages@b095994473d75002101ba9001c5ab1c938dccfe6` et `checkpoint/lab-start-author-surchauffe-status-2026-10-15` ; branche isolée `work/lab-author-surchauffe-status-2026-10-15`.
- Source auteur exacte : Vague de chaleur `lib_heat_wave` 3025 octets, SHA256 `322ff8b9ef8cf05b3f9c8bbd2d5fb4bea45bed24024280c24105ae3b643cb5c2`, blob `d8828d4cb0f46e5583880a00437c3901cf04aef6` ; Surchauffe `cap_fire_special_2` 3733 octets, SHA256 `8a312cd22d29bbd02c1731ad597532bcadb644fcf7225a35a45fd2c1a8f162f0`, blob `57b5b00147ece0a33233c30154c387553a618118`.
- Deux capacités au même ID dans un unique registre Showcase : remplacer `data/capture/showcase/lib_heat_wave.capture-skill-transfer-v1.json`, déposer `data/capture/showcase/cap_fire_special_2.capture-skill-transfer-v1.json`, inscrire celle-ci une fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. Aucun changement auteur silencieux, aucune nouvelle autorité ou asset binaire.
- Régression démontrée : `src/adapters/renderer/status-effect-info-v1.js` ne possède pas de cas `outgoing_damage_modifier` dans `effectLinesFor`, donc la carte HUD ne décrit pas le bonus `modifierPct:50` de Surchauffe. Ajouter présentation sémantique de tous dégâts infligés (signes, neutralité, stacks) sur l'instance de Combat, garder durée/skill source calculés par Runtime. Tester vrai HUD 1v1/2v2 par renderer partagé et nouveau contrat de statut.
- Tests attendus : empreintes octets auteur, roundtrips, unicité, vrais statuts positifs/négatifs/stack expirant, HUD source et durée en ms de CombatState, sentinelles historiques catalogue actualisées. CI trois jobs GREEN au SHA, checkpoint/preview, fast-forward lease, Pages. Test Android auteur à part. Dépôts principal, exploration, global-assets, main protégés.


## 2026-10-15 — Ground melee does not pursue an airborne target

- Production baseline `gh-pages@a4a7484e50e5fcfdc019fb47a1077f0f1afd87c3`, checkpoint `checkpoint/lab-start-ground-melee-airborne-lane-2026-10-15`, isolated work branch `work/lab-ground-melee-airborne-lane-2026-10-15`. Read LIVE charter/roadmap/current work/architecture/checkpoints. Other repositories and main/global-assets protected.
- Reproduction: `DemoApp.playApproachFor` takes `target.motion.getBoundingClientRect()` to plan **ground** approach, which includes the target's transient aerial transform. This makes an enemy ground `contact` attack visually climb to an airborne dragon. Meanwhile `skillPresenceReachV1` imposes no implicit airborne restriction on ordinary ground-contact skills (only on explicit presence restrictions/underground).
- Ground attack visual destination should use the target's stable, unanimated fighter-slot ground anchor during active aerial approach, honoring creator positioning offsets and responsive distance scaling. Collision watcher still checks live opaque model silhouettes and can stop on real contact; aerial, teleport, burrow trajectories unaffected. No hardcoded "dragon"/"griffe" names, no new motion owner.
- Native gameplay: default offensive `contact` + `ground` cannot damage a target airborne during impact; explicit `hitPresenceStates: ["surface","airborne"]` remains authoritative. Direct projectile, flying contact, area, normal ground target and subterranean protections keep current semantics. 1v1/2v2 share this owner.
- Tests: pure ground-aim behavior with active aerial vs idle, manual creator offsets/scaling, read-through of both preview clients; native CombatRuntime miss while aerial, hit after landing and when ability explicitly reaches airborne, fireball regressions, CI three jobs + checkpoint GREEN + preview/Pages only if all GREEN. Test Android user separately.


## 2026-10-15 — Vague incendiaire : remplacement exact de l'export auteur

- Base live `gh-pages@062eede4a7fd0049e2f6ccd4f2718d1e28ee60ca` ; checkpoint `checkpoint/lab-start-vague-incendiaire-author-2026-10-15`, branche isolée `work/lab-vague-incendiaire-author-2026-10-15`. Charte, roadmap, architecture et politique de checkpoints relues.
- Source attachée par l'auteur `gensrpg-capture-skill-cap_fire_atk_5.json` : 2440 octets, SHA256 `940b888b237212bbe5235c34c140931a06e2dadbfc4ad29da342009646a21a44`, Git blob `31f0f8d72e1fd04dfe593d2c0d2fced3ad539a1c` (octets exacts vérifiés). `draft.id=cap_fire_atk_5`, `name=Vague incendiaire`.
- Périmètre : déposer un preset au même ID dans le registre unique `data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json` + une seule déclaration `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` ; remplacement canonique `configuredSkills` sans doublon, Dracendre garde son slot par ID ; ajuster uniquement les sentinelles de taille de catalogue, tests de provenance/chargement et rapport.
- Effets auteur intacts : projectile direct Feu, 25 dégâts directs, DoT Feu 8 chaque 2 secondes pendant 10 secondes, cible surface/airborne, touche l'immatériel ; **`cooldownMs:45` représente 45 millisecondes** et `presentation:null` signifie qu'aucun visuel/son de présentation personnalisé n'est inclus. Ces paramètres potentiellement surprenants restent strictement tels que fournis ; avertir l'auteur, pas de retouche silencieuse.
- Pas de changement moteur, trajectoire air/sol, FX, buffs, asset, autres capacités, autre dépôt, `main` ni `global-assets`. Tests d'import/export, empreinte, véritable remplacement, utilisation de la capacité dans CombatRuntime, catalogue/chargement ; CI Foundation + deux browser jobs sur SHA final, checkpoint GREEN, preview et publication par fast-forward sous lease uniquement si tests verts. Smartphone auteur séparé.


## 2026-10-15 — Expanding sphere wave V1 — real geometry collision

- Base `gh-pages@d89766513821b933b2b74283dfcced996c06662f`, checkpoint `checkpoint/lab-start-expanding-sphere-wave-2026-10-15`, branche `work/lab-expanding-sphere-wave-2026-10-15`. Charte, roadmap, current work, architecture et politique checkpoints LIVE lues. Aucun autre dépôt ni `main` ni `global-assets`.
- Demande auteur : une auréole/sphère autour de la créature croît artificiellement et touche une créature au sol ou en vol **seulement si le bord visible la traverse** ; aucune touche automatique au timer et possibilité de manquer en esquivant. Le sprite n'est pas encore fourni dans ce fil : ne pas prétendre importer un média final.
- V1 isolée **mono-cible sélectionnée** : `SkillDefinition.projectileTargeting="expanding_wave"`, `expandingWave:{startRadiusPct,endRadiusPct,thicknessPct}` (rayon en % de largeur d'arène, durée de croissance = `travelMs`), le même `DomSkillFxRenderer` anime un sprite ou un anneau de prévisualisation ; capteur d'alpha `dom-visible-model-contact` vérifie le balayage annulaire et signale le contact à `CombatRuntime.reportActionContact`. Sans collision jusqu'à l'échéance, verdict natif `evaded` (pas de dégâts) ; autres projectiles inchangés. `hitPresenceStates` peut autoriser surface+airborne.
- UI : option « Onde sphérique expansive » dans Trajectoire du projectile + rayons départ / final et épaisseur ; édition/export/import dans le contrat Skill, pas dans l'art brut du sprite. Une attaque non-ondulatoire garde l'ancien format strictement.
- Scope explicite V1 : cible sélectionnée, pas encore de propagation aux ennemis supplémentaires en 2v2, ni collisions multiples par onde ; nécessité d'un lot moteur séparé avec anti-double touche, ciblage / immunité / multi-hit. Ne pas annoncer AoE multi-cible opérationnelle. Test smartphone visuel distinct après CI.
- Tests ciblés : normalisation et roundtrip Human Editor, géométrie alpha et balayage entre frames incluant esquive, vrais contacts 1v1, blocage de dégâts sur absence de contact, collision au sol/en vol, sentinelles projectile direct/skyfall/clash, CI 3 jobs ; GREEN seulement après confirmation.


## 2026-10-15 — Clash de puissance réel pour une onde expansive

- Base live `gh-pages@09eb408f85934b1cdf8f48b66f36ec24f1a2fcd8`, checkpoint `checkpoint/lab-start-expanding-wave-projectile-power-2026-10-15`, branche isolée `work/lab-expanding-wave-projectile-power-2026-10-15`. Charte, roadmap, architecture et policy lues. Deux dépôts tiers, `main` et `global-assets` protégés.
- Auteur demande que `projectileClash.power` (déjà éditable pour `form:projectile`) fonctionne également sur `projectileTargeting:"expanding_wave"`. Ne surtout pas réactiver l'ancien calcul « midpoint », physiquement faux ; conserver l'exclusion des clashs temporels.
- Micro-lot : le propriétaire `DomSkillFxRenderer` détecte une intersection **spatiale réelle et balayée** entre le rayon visible de l'onde et le point d'un projectile adverse, sur la même boucle de surveillance ; il signale exclusivement le contact. Le propriétaire `CombatRuntime` valide les actions opposées, sorties et puissances, puis réutilise `resolveProjectileClash` existant avec un candidat au temps du contact, sans calcul de dégâts côté renderer. Le projectile faible se dissipe, le plus fort poursuit, égalité annule les deux ; attaques qui ne se rencontrent pas ne s'affrontent pas. Préserver 1v1/2v2, les dégâts/envol/esquives, rayons, DoT et projectiles directs.
- Limite V1 déclarée : choc onde vs projectile mobile adverse lorsque les trajectoires sont réellement opposées ; pas de clash géométrique avec les rayons continus ni de dommages AOE secondaires. Ces extensions demanderaient un lot séparé. Pas de sprite auteur reçu ici, aucun média final déclaré ; anneau de fallback existant conservé.
- Tests RED puis GREEN : géométrie balayée, non contact, puissance égale/supérieure/inférieure via vrai Runtime, synchro UI, règlement unique, non-régression des chocs ordinaires, 1v1/2v2, CI Foundation + Firestorm + Creature Library, checkpoint puis Pages. Ne pas modifier les JSON auteur.

### Livraison technique du lot onde / puissance

- Le lot `work/lab-expanding-wave-projectile-power-2026-10-15` possède des tests géométriques et un vrai test DOM → `reportProjectileClashContact` → `resolveProjectileClash` avec valeurs 7 vs 4, 4 vs 4 et 2 vs 6, ainsi que la vérification anti-double-clash et les 2 clients 1v1/2v2.
- CI complète GREEN `38765752953` au code `6ea895ed54b650a811514a3f66d3e55da5f62a16`. Documentation finale et publication restent conditionnées à une CI verte sur SHA de livraison.


## 2026-10-15 — Refresh du sélecteur Bulle de feu expansive

- Production base `gh-pages@47b0e89173688c67b354c7cb41dd7e1a07d428b7`, checkpoint `checkpoint/lab-start-fire-bubble-selector-refresh-2026-10-15`, branche `work/lab-fire-bubble-selector-refresh-2026-10-15`.
- Problème réel : asset `pack:capture:sprite-fire-bubble-expansion-01` présent et catalogué sur `global-assets`, mais révision de cache consommateur datée du 13/10 et filtre `role=travel` excluant `category=skill` malgré `tag=expanding`.
- Périmètre : révision `src/assets/global-visual-library.js`, filtre propriétaire dans `src/ui/capture-editor-human-v2.js`, test dédié, rapport et ce journal uniquement. `global-assets`, `main`, Combat Rules, exports auteur, GenSrpG et Exploration protégés.
- Validation : sentinelle filtre/URL/HTML + CI 3 jobs ; checkpoint GREEN et publication sous lease uniquement si vérifiés, contrôle Android de l'auteur séparé. Aucun média inventé ni sprite auto-équipé.
