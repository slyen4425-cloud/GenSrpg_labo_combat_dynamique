# Labo Combat Capture — Miroir : rebond au contour du sprite (17 octobre 2026)

## Demande / diagnostic

L'auteur a testé **Barrière lumineuse** et n'a observé aucun véritable rebond sur sa bulle visuelle. Son dernier export `gensrpg-capture-skill-lib_magic_barrier.json` (2 824 octets, SHA-256 `324546d0b687a8422f80da80a44cecf095985ed36f6dd8ee3bd9548244b7b270`, blob Git `e7dfd73c14f58a088aff3949ca3118abfa9d219a`) est **correct** : `projectile_mirror` bénéfique de 30 000 ms sur `self`, préparation 350 ms, recharge 50 000 ms, niveau 5. Présentation auteur : `statusVisuals["lib_magic_barrier:0"].sprite` lié au sprite `pack:capture:sprite-status-energy-shield-01`, `displayScale:2.5`, `opacity:0.7`, `playbackMode:"hold-last"`. Le vieux catalogue ne chargeait pas cette fiche auteur comme preset actif. Elle est maintenant enregistrée octet pour octet dans `data/capture/showcase/lib_magic_barrier.capture-skill-transfer-v1.json` et référencée **une seule fois** dans le catalogue officiel des compétences Capture (35 presets, 103 créatures inchangées).

La cause du défaut visuel était la séparation des deux circuits : le statut projetait déjà un sprite sur le modèle via `dom-status-fx`, mais le `watchProjectileContact` de `dom-skill-fx` détectait seulement `sweptPointHitsOpaqueMask` sur la créature. Le projectile traversait donc visiblement le bouclier et devait toucher le corps pour déclencher le miroir, ce qui paraît ne produire aucun renvoi lorsque le contact de modèle ne se produit pas.

## Correction ciblée — autorités conservées

- `src/adapters/renderer/dom-status-fx.js` marque son sprite effectivement monté avec `data-status-kind="projectile_mirror"`, depuis le **même** statut natif en cours. Supprimer/expirer le statut supprime naturellement le sprite ; aucun champ de gameplay ou timer n'est ajouté.
- `src/adapters/renderer/dom-skill-fx.js` lit le sprite de statut **directement dans l'ancre de mouvement de la cible**. Le même cycle RAF qui surveille le projectile calcule sa première entrée sur le contour de la barrière, **avant le masque du corps**. Il émet exactement une demande de contact `onProjectileContact` avec le **premier point traversé**, pas la position après dépassement. Ni second projectile, ni scheduler, ni gestion des dégâts dans le renderer.
- `src/adapters/renderer/dom-visible-model-contact.js` possède le nouveau calcul géométrique pur `sweptPointHitsSpriteEllipseV1`. Il utilise `getBoundingClientRect()` du **sprite transformé à l'écran**, donc échelle, translation, miroir par vue et mouvement sont respectés. La géométrie est une **ellipse des dimensions réelles rendues**. Les segments sont balayés entre deux images, avec transformations d'ancienne/nouvelle surface, pour empêcher la traversée à vitesse élevée. IMPORTANT : aucune prétention de masque alpha pixel-exact du dessin, ni collision avec la créature plutôt que le sprite ; l'ellipse est l'approximation contrôlée pour la bulle protectrice demandée.
- `src/core/combat/combat-runtime.js` conserve **l'unique autorité du renvoi**. Quand le sprite est présent, les métadonnées facultatives `mirrorSpritePresent` et `mirrorSpriteContact` distinguent le choc sur le contour protecteur d'un choc sur le corps hors de cette zone. Seul le choc sur le contour peut produire `forcedOutcome:"mirrored"`; le corps non couvert reçoit son dommage normal. Sans sprite monté, aucun nouveau champ n'est émis : **l'ancienne collision sur la créature et les vieux Miroirs sans visuel restent strictement compatibles**. Le projectile de retour conserve l'ancien `mirrorReturn.contactPoint`, la durée, les dégâts, le rebond max 2, les collisions/clash, le KO et le coût unique. Skyfall continue sa trajectoire historique sans nouveau bouclier de surface.
- Aucun changement aux contrats Status/Skill/Attack, aucun état de barrière côté UI, aucun nouveau media/asset, aucune modification de `main`, `global-assets`, GenSrpG, Exploration ou des 103 créatures.

## Tests de la vraie surface et du retour

`tests/unit/capture-mirror-sprite-surface-v1.test.mjs` :
- segment de tir rapide traversant l'ellipse sans s'y arrêter, retourne le point d'entrée plutôt que l'extrémité ;
- géométrie suit le scale 2,5 et les déplacements de surface, et ignore les tirs manqués ou sortants ;
- **renderer de statut et renderer de projectile réels**, connectés sur un mini DOM factice : le premier monte le sprite/son identité, le second le trouve et déclenche le rebond à x=155 avant le corps x=200 ;
- modèle seul, statut non-miroir, statut retiré : la collision historique est inchangée ;
- JSON auteur exact, statut 30 s / mode « dernière image » / asset, scale 2,5, transparence 0,7, import/export canonique.

`tests/integration/projectile-mirror-real-flight-v1.test.mjs` : ajout de la variante où un impact sur le corps **hors sprite** conserve l'attaque normale et ne crée aucun vol inverse ; puis contact au contour du sprite : aucune perte immédiate, une vraie action inverse part de la coordonnée observée, dégâts appliqués seulement lors de son impact de retour. Les anciennes couvertures miroir 1v1 et 2v2, double rebond, raté, collision/clash, immunité et attribution KO restent actives.

`tests/browser/capture-creature-library-smoke.mjs` : vrai Chromium sélectionne `lib_magic_barrier` après Lumilo, relit ses 30 secondes, son statut `projectile_mirror`, son sprite `energy-shield`, scale 2,5/opacité 70%, réexporte la compétence et vérifie que son statut et sa configuration sont toujours présents. Les tests 2v2 et paysage Android sont exécutés par les suites existantes mais **le contrôle visuel tactile de l'auteur reste attendu**.

## Gouvernance et résultat

Base `gh-pages@4498c65c751c5884ff76c6f8369777b526c050c3` (5/5 et Pages GREEN). Départ `checkpoint/lab-start-mirror-sprite-surface-v1-2026-10-17`, travail `work/lab-mirror-sprite-surface-v1-2026-10-17`. Tests RED après création de la sentinelle, puis GREEN des chemins natifs et compatibilité après correction.

**Code GREEN avant rapport :** `8723ad8dc3dab11181a4c6a8480dbe1640b9d87e`, Laboratory CI `39068003401` **SUCCESS 5/5** : Foundation, creature-library-browser, expanding-wave-2v2-browser, expanding-wave-mobile-preview-browser, firestorm-zone-growth-browser. Un run Chromium antérieur `39067828008` a expiré lors de l'itération HoT/opacity avant même la sonde Barrière ; la répétition `39067977994` a réussi 5/5 avec la sonde.

Après ce document, exiger une **nouvelle CI 5/5 sur le SHA final exact**, checkpoint GREEN égal, promotion de `gh-pages` par fast-forward gardé, CI et Pages de `gh-pages` SUCCESS. Ne pas déclarer testé visuellement sur Android tant que l'auteur n'a pas confirmé.
