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
