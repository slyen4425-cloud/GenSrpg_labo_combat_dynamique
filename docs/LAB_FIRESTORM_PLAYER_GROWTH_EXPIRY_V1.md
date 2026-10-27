# Tempête de flammes — Croissance joueur / expiration durant préparation V1

Date : 2026-10-09. Laboratoire Combat Dynamique, propriétaire de correction : Persistent Zone Runtime, contrat d'action transmis via Action Resolver.

## Identification vérifiée

Source LIVE : `data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json` :
- ID `cap_fire_atk_6`, nom **Tempête de flammes**, ultime feu de niveau 20 (« Vague de flamme » dans le retour de test).
- `persistent_zone`, `zoneId=zone`, `reactivation=reinforce`, `radiusGrowthSteps=1`, `maxActivations=3`, **short / medium / long**.
- 7000 ms, tick 1000 ms, 5 PV/tick, preparation 2000 ms, cooldown 3500 ms, 5 énergie, délai débloquant à 25000 ms.
- Sprite feu, opacité 0.5 ; aucune valeur auteur modifiée.

## Gouvernance

Base publiée vérifiée `gh-pages` : `a1ba2b255aac28bd4fbbf71b8fd4d16ce66f0e3d`.
CI `37951890492` SUCCESS ; Pages `37951889696` SUCCESS.
Checkpoint de départ : `checkpoint/lab-start-firestorm-player-growth-audit-v1-2026-10-09`.
Branche : `work/lab-firestorm-player-growth-audit-v1-2026-10-09`.
Périmètre déclaré dans `docs/LAB_CURRENT_WORK.md` **avant** modification métier, extension au fichier `action-resolver.js` déclarée après reproduction RED, avant correctif. Main et les autres dépôts restent intacts.

## Reproduction et cause exacte

Le test de la vraie fiche, par le vrai Combat Session + Runtime, établit :
1. t=25000 : première activation acceptée ; t=27000 : zone short, expire t=34000.
2. t=33000 : deuxième activation **acceptée** par les règles gameplay avant expiration.
3. t=34001 : ancienne zone expirée et retirée normalement.
4. t=35000 : deuxième activation résolue. **Avant le correctif, zone short, activations=1**, au lieu de **medium, activations=2**.

C'est un défaut gameplay, pas seulement visuel : `applyPersistentZoneEffectsV1` reconstruisait le nombre d'activations à partir de `state.persistentZones` uniquement à la *fin* des deux secondes de préparation. Les zones expirées n'existent plus dans ce tableau. Le joueur déclenche plus facilement le renforcement en fin de durée, tandis que `BattleActorAiController` privilégie déjà les reactivations et met de côté son énergie. Les deux camps utilisent néanmoins le même `CombatRuntime.startSkill` et le même propriétaire de zone.

La séquence de réactivation sans chevauchement d'expiration fonctionnait déjà : short / medium / long, la même zone visuelle/DOM, projection des scales. Les différences visuelles par camp ne nécessitent pas de correctif.

## TDD réel

**Avant tout changement métier**, RED :
- SHA `540a123d697d39823ce4c1c6b46cb2b674415926` ;
- CI `37965720923` : 1333 Node PASS, **1 FAIL ciblé** `'short' !== 'medium'` ; Chromium bibliothèque 103 SUCCESS.

**Après correctif**, GREEN :
- SHA fonctionnel `a77b22852c76b2ea75c7b98de040c8c202e55970` ;
- CI `37966038847` : 1334/1334 Node PASS, 0 FAIL ; Chromium bibliothèque SUCCESS ;
- suite comparant également joueur et IA sur **même skill auteur** et vrais Runtime/Renderer en 1v1/2v2 ; vérifie rayon, `zoneId`, source, activations, transformations, expiration normale et redémarrage à short si une nouvelle activation commence *après* expiration.
- nouvel essai dans **vrai Chromium DOM** via `tests/browser/firestorm-zone-growth-smoke.mjs`, ajouté comme job indépendant de CI, avec vraie fiche JSON + `CombatRuntime` + `PersistentZoneRuntime` + `DomSkillFxRenderer`, et bouton de simulation du joueur qui appelle `runtime.startSkill`, contrôleur IA canonique. **8 scénarios** : 1v1 / 2v2 × joueur / IA × cadence normale / expiration pendant préparation. Le navigateur lit le `data-zone-radius` et mesure la largeur réelle des éléments DOM, pas seulement les états du moteur. Le cas 1v1 officiel de l'éditeur est rendu par le même client `mountCoop2v2Test` que le 2v2. La sentinelle navigateur teste le vrai moteur/renderer avec un adaptateur de clic isolé ; elle ne prétend pas être un test automatisé intégral du bouton natif de l'éditeur.
- CI avec ces 3 jobs : `37966331616`, SHA `ef5ee88aed64840fc6ede922e8e13a4c69074991`, **SUCCESS** (foundation, Chromium bibliothèque et Chromium Firestorm). Job Chromium : `pass:1v1:player:normal|1v1:player:crossing|1v1:ai:normal|1v1:ai:crossing|2v2:player:normal|2v2:player:crossing|2v2:ai:normal|2v2:ai:crossing`.

## Correctif soustractif / propriétaire

- `src/core/combat/persistent-zone-runtime-v1.js` : expose au démarrage une photographie *minimale* des zones `reinforce` encore actives, identifiée par `actorId:skillId:zoneId`. Lorsque l'ancienne zone a expiré **pendant** la préparation et a donc été retirée, le même owner calcule les activations depuis cette photographie. Quand une zone est encore présente à la résolution, le propriétaire utilise toujours **la zone live**, prioritaire. Quand l'activation commence **après** l'expiration, aucune photographie n'existe et le rayon repart short.
- `src/core/combat/action-resolver.js` : transporte cette seule métadonnée de démarrage dans l'action immuable validée ; la restitue à `applyPersistentZoneEffectsV1` au moment de sa résolution canonique.
- Aucun nouveau timer, gestionnaire global, seconde logique UI, stockage parallèle ou code conditionnel sur `cap_fire_atk_6`.

Les ticks de l'ancienne zone cessent à expiration ; sa durée **n'est pas prolongée** au moment de lancer une réactivation. La nouvelle zone reçoit sa durée complète seulement à la résolution. Si un renforcement a lieu alors que la zone est encore en vie, la cadence des ticks programmés est conservée comme avant ; si la précédente est réellement expirée, une nouvelle phase de tick repart à la nouvelle résolution, sans restitution rétroactive.

## Fichiers modifiés dans le lot

- `src/core/combat/action-resolver.js` — petit transport de la métadonnée.
- `src/core/combat/persistent-zone-runtime-v1.js` — autorité du renforcement.
- `tests/unit/firestorm-real-runtime-sequence-v1.test.mjs` — comparateur joueur/IA et RED→GREEN expiration.
- `tests/browser/firestorm-zone-growth-smoke.mjs` — véritable DOM et vrai renderer Chromium, sans asset produit modifié.
- `.github/workflows/ci.yml` — job Chromium dédié (en plus du smoke 103 créatures).
- `docs/LAB_CURRENT_WORK.md` et le présent rapport — gouvernance et traçabilité.

**Aucun** fichier créature, loadout, capacité, preset auteur, sprite, son, Beam, progression, soin, catalogue, GenSrpG, laboratoire Exploration, `global-assets` ou `main` modifié.

## Critères restants avant clôture

- CI de la révision documentaire finale, diff exact, checkpoint GREEN technique et preview sur un même SHA.
- Si HEAD `gh-pages` inchangé, promotion *fast-forward sous lease* puis contrôle séparé Laboratory CI et Pages SUCCESS.
- Contrôle visuel Android de l'éditeur natif (1v1 + 2v2, trois activations, expiration et ticks) par l'utilisateur ; **ne pas l'affirmer vérifié** sur téléphone physique avant retour.

Lien prévu : https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/examples/dom-demo/capture-editor-v2.html
