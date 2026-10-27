# Capture — Voltige (V2), Frappe téléportée et durée visible des charges

Date : 13 octobre 2026

## Source et lot
- Fichiers reçus de l'auteur :
  - `gensrpg-capture-creature-crea_voltik(2).json` → `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json`, **blob Git exact** `80a5028dc34f61dc3ed071a40f755a752e850628` ;
  - `gensrpg-capture-skill-teleport-strike.json` → `data/capture/showcase/teleport-strike.capture-skill-transfer-v1.json`, **blob Git exact** `914b01bda597ba79c53ffbfdd53622bebdbb972b`.
- Source unique : les transferts Capture Showcase, référence unique au registre officiel `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, import par `importCaptureTransferJsonV1`, puis `applyCaptureTransferBatchToEditorStateV1` ; compétences avant créatures. Ne pas dupliquer de registre, ni muter la source native historique 103 monstres.
- `crea_voltik` reste ID stable, profil biped, 120 PV, approche -40%, résistances et sockets originaux inchangés ; slot 1 `teleport-strike`, slot 2 `lib_static_bite`, slot 3 `lib_chain_lightning`, slot 4 `lib_paralyze`, slot ultimate vide.
- `teleport-strike` garde exactement `form=contact`, `approachMode=teleport`, 24 dégâts, coût 3, préparation 1200 ms, déplacement 120 ms, recovery 650 ms, cooldown 0, icône/audios auteurs.
- Tous les autres skills, médiathèques, icônes, 1v1 et 2v2 inchangés.

## Horloge des charges
- Sur un statut à effet de seuil (`definition.onStackThreshold.count`) doté d'une durée `time_ms`, le renderer de statut existant affiche simultanément `2/3` et un petit badge de durée `8 s`.
- Celui-ci vient de `projectStatusEffectInfoV1({instance,elapsedMs:state.elapsedMs}).remainingLabel` déjà canonique, **aucun** `Date.now()`, intervalle, timeout ou nouvelle instance.
- Le Runtime conserve une **seule durée partagée** pour le cumul des charges : chaque application nouvelle rafraîchit `expiresAtMs` du groupe. Il n'existe donc PAS de trois expirations individuelles ; l'indicateur décrit la disparition du cumul, pas d'une charge spécifique.
- Le badge se met à jour via `renderer.sync(state)` existant et disparaît avec le statut, tout comme le compteur. CSS `status-icon__expiry` en haut à gauche de l'icône, compteur `status-icon__stack` en bas à droite ; aucune hauteur/largeur HUD ni position 1v1/2v2 changée.

## Point bloquant déclaré : Arc électrique, puissance 2 sur un rayon
- Demande auteur : `lib_chain_lightning.projectileClash.power=2`. TDD RED : cette tentative est **invalide** pour la fiche `form=beam`. `src/contracts/projectile-power-v1.js` refuse `power>0` sauf `form=projectile` ; `src/core/combat/projectile-clash.js` ignore explicitement les rayons. Échec réel d'import `RangeError: ProjectilePowerV1 requires form=projectile when power > 0`, touchant même la bibliothèque au démarrage.
- Pour respecter la charte (aucune valeur factice / pas de mécanique non raccordée), **ne pas publier une valeur 2 inopérante ni convertir Arc en projectile**, ce qui détruirait son vrai rayon. `power=0` historique conservé avec blob `727b0e0962231276f2ab625dafbe6634e57a38a1`; aucun autre paramètre d'Arc changé.
- Le comportement de collision entre un rayon et un projectile requiert un lot **Beam Clash V1** distinct (contrat, détection spatiale, résolution physique et synchronisation FX), à définir avec l'auteur. Cette sous-demande demeure **non réalisée**, signalée explicitement.

## Charte et vérification
- Production avant début `gh-pages@bfdf4bba7bf0b46bed92a1e77ed629e65981826a`, CI/Pages success.
- Checkpoint avant code `checkpoint/lab-start-voltige-teleport-arc-stack-timer-v1-2026-10-13`; work isolé `work/lab-voltige-teleport-arc-stack-timer-v1-2026-10-13`.
- Sentinelle RED `tests/unit/capture-voltige-teleport-arc-stack-timer-v1.test.mjs` avant mutation d'exports, puis test du vrai renderer (2/3 8 s, 6 s, cumul renouvelé 10 s, 1/3, statut disparu) sans horloge secondaire.
- Three tests de cardinalité `21→22` mis à jour seulement sur les assertions devenues obsolètes : `air-skills-enemy-bench-inspection-v1`, `capture-ailevent-rafale-author-v2`, `capture-air-dual-skill-import-v1`. Assertions d'identité, fidélité et contenus historiques conservées.
- CI Foundation + Chromium Firestorm et bibliothèque 103 créatures sur SHA final requises ; checkpoint GREEN exact, Fast-forward protégé sous lease, CI + Pages post-release. Le ressenti sur Android reste à valider par l'auteur.
