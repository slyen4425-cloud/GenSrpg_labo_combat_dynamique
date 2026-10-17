# Rapport — Soin lumineux, évolution et Miroir (17 octobre 2026)

## Identité du chantier

- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base gelée : `gh-pages@7775bae6bba97fde80cc395027e36d3f34a20a41`.
- Checkpoint départ : `checkpoint/lab-start-light-heal-mirror-regression-v1-2026-10-17`.
- Branche exclusive : `work/lab-light-heal-mirror-regression-v1-2026-10-17`.
- Main, global-assets, Zombicide et Exploration non touchés.
- Statut : code validé 5/5 avant dernières sentinelles, **clôture NON GREEN tant que le SHA final documentaire, publication et Pages ne sont pas attestés**. Test tactile Android séparé.

## Fichier auteur Soin lumineux

- Source réelle de l'auteur : `gensrpg-capture-skill-cap_light_special_1.json`, 4 166 octets, SHA-256 `395adeb9b56af9a1b518a99e3f746fbcaa2f7199b239b702347b5415e9fb01cf`; Git blob `7cab88bdad8ed9fd1c938ddc23a32d85aee2e734`.
- Intégration **sans modification** : `data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json`.
- Registre unique : ajout exactement une fois dans `src/catalogs/capture-showcase-skill-presets-v1.js`. Le catalogue passe de 35 à 36 transferts auteur ; tests historiques de cardinalité alignés sans supprimer leurs assertions d'unicité.
- Contrat exact : soin immédiat `heal 35`, `consume_marker` sur la cible (`markerId:"*", count:"all",minimum:1`), coût énergie 5, préparation 500 ms, cooldown 45 000 ms, aura de soin auteur. Pas de conversion en dégâts, pas de clone de compétence.

## Défaut de renvoi sur Boule de feu, Cendre aveuglante, Rayon lumineux

- Le moteur stocke les instances de statut avec `appliedAtMs` et `expiresAtMs` dans **l'horloge du combat** (`CombatState.elapsedMs`).
- Mais `mirrorCanIntercept` était appelé depuis `processResolution` avec `resolutionClockMs`, dérivé de `performance.now()`. Sur navigateur réellement ouvert depuis plusieurs minutes, une Barrière lumineuse de 30 s était donc vue comme déjà expirée, malgré son sprite visible.
- Fix local dans **le propriétaire existant** `src/core/combat/combat-runtime.js` : utiliser `record.startedAtCombatMs + effectiveAction.impactAtMs` (ou réaction prête) pour vérifier la durée du miroir, tout en conservant `resolutionClockMs` pour la synchronisation des actions. Aucun second timer, horloge, calcul de dégâts, projectile ni masque de créature.
- `dom-status-fx.js`, la surface sprite détectée dans `dom-skill-fx.js` et le même vol retour demeurent les propriétaires. Le rebond continue à naître du point de contact réellement rapporté par le sprite, pas du corps.
- Sentinelle d'intégration ajoutée au test runtime existant : trois transferts auteur réellement lus (`fireball`, `cap_fire_special_1`, `lib_light_bolt`), Barrière lumineuse auteur, horloge navigateur `1_200_000` ms contre combat `0` ms, contact sprite, trajet de retour, pas de dégâts directs au défendeur. Cendre aveuglante utilise ses véritables règles natives de statistique `speed` et `physical`.
- Régression historique conservée : vrais vols 1v1/2v2, clash, deux miroirs, KO, sprite absent/non miroir, tir hors du sprite. L'animation complète sur appareil Android doit encore être validée par l'auteur.

## Blocage de l'éditeur au test de soins

- Screenshot auteur : « Créature cible de l’évolution est obligatoire » affiché au clic sur « Tester en combat ».
- Cause précise : `validate()` dans `capture-editor-human-v2.js` appelait `currentCreatureRecord()` si une modification d'espèce était en cours ; `buildHumanEvolutionV1()` exige une cible pour chaque évolution cochée. Cette validation, pourtant pertinente pour **enregistrer l'espèce**, bloquait le test indépendant d'une capacité.
- Correction locale au propriétaire `capture-editor-combat-test-v1.js` : autoriser le test avec la **créature déjà enregistrée** uniquement lorsqu'un brouillon séparé possède une évolution activée sans cible. Son brouillon reste inchangé et non enregistré ; l'UI affiche explicitement qu'elle utilise la version sauvegardée. La validation stricte à l'enregistrement de l'espèce demeure intacte.
- Un brouillon de nouvelle créature sans aucune version enregistrée n'est pas promu ni créé artificiellement. Dans ce cas, la configuration d'évolution reste à corriger avant test de ce nouveau monstre.
- Sentinelle unitaire + probe Chromium réel : chargement de Lumilo, effacement volontaire de la cible d'évolution dans le formulaire, sélection du transfert auteur Soin lumineux, clic réel « Vérifier la configuration », contrôle de la réussite et de l'absence de mutation silencieuse des données de Lumilo.

## Contrôles et fermeture

- 17/10/2026 : CI `39070857401` code + catalogue + validation + 3 attaques : **Foundation + 4 navigateurs SUCCESS 5/5** au SHA `7cdbb5d8443236e928bb8e9ab711bac26107aaf1`.
- 17/10/2026 : CI `39070955630` avec smoke navigateur d'évolution supplémentaire : **SUCCESS 5/5** au SHA `67bd71bfa4659cee7c7e3635cbe99fcaac345be4`.
- Sentinelle supplémentaire native Soin lumineux (HP +35 et dépense énergie), à vérifier sur nouveau SHA.
- Pour fermer : CI Foundation + 4 jobs Chromium sur SHA final comprenant les présents rapports, checkpoint GREEN du même SHA, fast-forward `gh-pages` sous garde de la base exacte, Pages SUCCESS, puis essai tactile Android de l'auteur. Sans ces preuves : NON GREEN.
