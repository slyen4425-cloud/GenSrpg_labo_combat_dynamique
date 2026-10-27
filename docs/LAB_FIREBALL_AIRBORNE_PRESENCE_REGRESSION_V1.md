# Labo Combat — Boule de feu et présence aérienne : sentinelle 2026-10-12

## Régression utilisateur, diagnostic confirmé par RED

Le retour utilisateur indique que Boule de feu cible et touche une créature pendant son attaque/déplacement aérien, malgré la règle d'esquive aérienne antérieure. La charte et les documents LIVE ont été relus, notamment les lois de ciblage `direct` contre `fixed_point` de `docs/LAB_PROJECTILE_DIRECT_SKYFALL_ICONS_V1.md` et la portée de présence `src/core/combat/combat-presence-v1.js`. Le comportement explicitement voulu reste : projectile direct sur une créature courant au **sol** = touchable ; cible réellement `airborne` = hors de portée d'un projectile limité à la surface ; attaque disposant expressément de `hitPresenceStates:["surface","airborne"]` = touchable.

La vraie fiche auteur `data/capture/showcase/fireball.capture-skill-transfer-v1.json` avait `hitPresenceStates:null`, alors que `cap_air_atk_3` (Charge aérienne) n'active pas `evasion.window:"travel"`. Le Core reconnaît pourtant correctement `airborne` pendant l'approche `aerial`. Sans restriction déclarée par Boule de feu, Combat Rules juge la cible atteignable. Un test de l'ancien lot couvrait déjà les projectiles de surface explicites contre `airborne`, mais pas la vraie Boule de feu auteur / Charge aérienne, d'où la régression non détectée.

Test RED : `tests/integration/capture-fireball-airborne-regression-v1.test.mjs`, commit `75f4e3d407a65e21e7a5ea829e33789dc80cd21f` ; la CI `38189324009` révèle `hitPresenceStates:null` et `outcome:"hit"` sur le projectile opposé à la Charge aérienne.

## Réparation minimale dans le vrai propriétaire auteur

- Changement **unique de gameplay** : `data/capture/showcase/fireball.capture-skill-transfer-v1.json`, propriété `draft.definition.hitPresenceStates:null -> ["surface"]`. Retour utilisateur explicitement demandé. Aucun changement d'ID `fireball`, de cible, portée, forme, trajectoire `direct`, éléments, coûts, timing, dégâts, FX, sockets, présentation, animations, audio, compétences attribuées, catalogue ou assets.
- Aucun code de Core, de renderer ou d'UI ne change : la règle de présence `skillPresenceReachV1` et la décision `ActionResolver` existantes deviennent effectives grâce à la bonne configuration auteur.
- L'ancienne sentinelle `tests/unit/capture-showcase-fireball-author-v3.test.mjs` est mise à jour strictement pour ce champ à valeur nouvelle ; toutes ses autres exigences restent.
- Les nouvelles sentinelles utilisent le vrai transfert Capture, l'adaptateur Combat Rules et le vrai `CombatRuntime` : air raté sans dégâts et sans impact sur la cible, sol en mouvement toujours touché, cible immobile touchée, anti-aérien explicitement configurable et actif sur `airborne`.
- Toute autre capacité conserve son comportement. Pas de modification de `global-assets`, `main`, Exploration, `Zombicide-40k`, HUD, collisions, statuts ou moteur, pas de deuxième autorité.

## Gouvernance et sortie

Base `gh-pages` SHA `8139980d6845eaad78f85f63f9a162f23e7c000f`, dernier GREEN en production ; checkpoint départ `checkpoint/lab-start-fireball-airborne-presence-2026-10-12`, branche `work/lab-fireball-airborne-presence-2026-10-12`. Périmètre : fichier Fireball auteur, ancienne sentinelle Fireball, sentinelle nouvelle et documentation `docs/LAB_FIREBALL_AIRBORNE_PRESENCE_REGRESSION_V1.md` + `docs/LAB_CURRENT_WORK.md`. Condition de sortie : CI complète (foundation/Chromium), checkpoint GREEN sur SHA testé, fast-forward non forcé de `gh-pages`, CI/Pages après publication puis test manuel smartphone.

Vérification utilisateur sur le téléphone : lancer Boule de feu pendant une Charge aérienne au moment où la créature est en l'air ; vérifier MISS, 0 dégâts, aucun impact sur créature. Lancer Boule de feu sur cible statique et sur un adversaire se déplaçant au sol ; vérifier impact normal. Tester enfin un vrai sort anti-aérien si disponible.
