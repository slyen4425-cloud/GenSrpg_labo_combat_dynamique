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
