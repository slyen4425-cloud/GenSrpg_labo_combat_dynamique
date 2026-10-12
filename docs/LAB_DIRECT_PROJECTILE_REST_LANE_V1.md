# Labo Combat — Tir direct : trajectoire stable sans suivi vertical de la cible

Date : 2026-10-12. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Retour utilisateur et diagnostic

En combat, une créature en plein vol pouvait afficher un vrai MISS de Boule de feu mais le sprite projectile lui-même remontait vers la créature. La règle de dommages/présence est déjà fixée : Fireball `hitPresenceStates:["surface"]`, aucun impact ni dégâts sur une créature `airborne` ou `underground` (sauf compétence anti-aérienne explicite). Le défaut restant est **visuel** et empêchait de juger les collisions.

Propriétaire unique constaté : `src/adapters/renderer/dom-skill-fx.js`. Jusqu'ici, le projectile non skyfall calculait `to` depuis `projectileTargetRect(targetSlot)`, qui privilégiait `targetAnchorFor` = **le modèle VISIBLE et mobile**. Ainsi le vecteur de tir vers le centre d'une créature élevée ou enterrée inclinait le trajet au-dessus ou en dessous du niveau de combat.

## Règle corrigée dans le renderer existant

- Les projectiles directs utilisent à la libération le rect **stable du slot de combat** (`targetAnchors`, fourni dans le vrai 2v2 par `fighterContainers`), jamais la position momentanée du modèle volant/souterrain. Le segment de lancement est figé (animation linéaire existante). Dans un décor en perspective, la ligne entre le départ et les slots de repos peut être légèrement oblique ; elle ne se réoriente pas vers un envol/creusement.
- Le sprite est toujours lancé depuis le **sourceRect** du lanceur et sa socket déjà existante lorsqu'elle est configurée ; la rotation et les particules réutilisent le seul vecteur stable ; le projectile ne suit plus l'élévation de la cible.
- **Seul** `trajectoryMode="skyfall"` continue de viser le `projectileTargetRect` au lancer, car c'est une mécanique distincte et configurée volontairement (chute du ciel). Le rayon `beam` et les capacités de contact ne sont pas touchés.
- Le **capteur** `watchProjectileContact` lit toujours la collision réelle `targetCollisionModelFor(...).snapshot()` sur les frames ; une collision validée reste l'événement envoyé au seul `CombatRuntime`. Le feedback d'impact `type=impact` utilise toujours le rect vivant de la créature et n'est présenté que sur un résultat légitime. Aucun second système de collision, timer, calcul de dégâts, tolérance cachée ou fallback rajouté.

## Procédure charte / tests

Base GREEN `gh-pages` `57a4e9a00d1174d56964439194352fabe03d5b3e`; checkpoint de départ `checkpoint/lab-start-direct-projectile-rest-lane-2026-10-12` ; branche `work/lab-direct-projectile-rest-lane-2026-10-12` ; RED `tests/unit/direct-projectile-rest-lane-v1.test.mjs` commit `6fbc673e8e1cdb0ee1b5777cab9c1138355e668a` (élévation/enterrement changeaient le vecteur en sens aller et retour). Correction minimale dans le vrai owner renderer + tests.

Périmètre autorisé : `src/adapters/renderer/dom-skill-fx.js`, sentinelle `tests/unit/direct-projectile-rest-lane-v1.test.mjs`, cette documentation et `docs/LAB_CURRENT_WORK.md`. Tests hérités de précision de contact, des impacts, skyfall, Fireball surface-only et cibles au sol, et CI complète Chromium requis. Après réussite : checkpoint GREEN au SHA de la CI, FF non forcé de `gh-pages`, tests et Pages après publication.

**Limite honnête** : ce lot n'invente pas de nouvelles coordonnées de monde ni de détection gameplay 3D. La condition de présence `hitPresenceStates` demeure la source métier pour airborne/underground ; le capteur détecte le contact 2D réel. Le moteur conserve sa gestion nominale de résolution par temps s'il n'obtient pas de signal de contact : ce n'est pas transformé ici. Validation tactile en paysage nécessaire pour confirmer la qualité visuelle du segment, la terminaison et la lisibilité de la collision.

**Interdits inchangés** : `main`, `global-assets`, `Zombicide-40k`, Exploration, médias, fiches de compétences, charges, buffs, valeurs, audio et éditeur.
