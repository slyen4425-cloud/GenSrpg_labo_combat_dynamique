# Correctif Esquive foudroyante — Impact rocheux Skyfall multi-cibles

**14 octobre 2026 — cause source vérifiée, correctif par victime.**

## Symptôme confirmé par l'auteur

La capacité personnelle « Esquive foudroyante » crée un statut `auto_dodge` à durée variable. Les projectiles frontaux directs sont évités, mais la capacité auteur **Impact rocheux**, projectile tombant du ciel, inflige encore ses dégâts malgré ce buff.

**Cause précise, non liée au sprite :** la véritable fiche conservée `data/capture/showcase/cap_earth_atk_4.capture-skill-transfer-v1.json` porte `category:offensive`, `form:projectile`, `projectileTargeting:fixed_point`, `dodgeable:true`, `effect.damage:0` et `effects:[{kind:damage,targetScope:all_enemies,amount:30,channel:earth}]`. `ActionResolver.autoDodgeEvasionFor` refuse intentionnellement de résoudre l'**attaque entière** comme `evaded` quand les effets touchent plusieurs victimes : sinon une seule créature protégée empêcherait de toucher tout son camp. Les dégâts réels de l'Impact rocheux passaient ensuite par `applyImmediateTacticalEffectsV1`, qui n'avait aucune décision d'esquive **par victime**.

## Correction chez les propriétaires du combat

- Dans `src/core/combat/immediate-tactical-effects-v1.js`, pour une compétence **offensive, esquivable et à effets multicibles hostiles**, chaque victime portant effectivement `auto_dodge` à l'instant canonique d'impact évite ses dommages/états négatifs/énergie drainée/dissipation ; les victimes non protégées sont résolues normalement. Évaluation une fois par victime avec le snapshot originel de l'impact ; ni seconde horloge ni dépendance au rendu Skyfall.
- Chaque victime protégée obtient un événement métier `skill-target-evaded` unique, avec `evasionReason:auto_dodge` et ID de la compétence défensive, sans prétendre que toute l'attaque a raté.
- Dans `src/core/combat/action-resolver.js`, les événements natifs d'esquive individuels alimentent le dispatcher `evaded` existant. Les effets résultants ne sont pas réutilisés comme nouveaux déclencheurs (pas de boucle).
- Les attaques `dodgeable:false` passent toujours ; projectiles directs mono-cible, autres cibles d'une AOE, buffs positifs, soins, DoT/HoT, dégâts ambiants de zones persistantes, collision/clash/mirror, IA, GameOptions et mécanique bouton Esquive ne sont pas modifiés.

## Preuve de non-régression

Nouvelle sentinelle `tests/unit/capture-auto-dodge-skyfall-multitarget-v1.test.mjs` charge **les données réelles de l'Impact rocheux** et crée un BattleFormat 2v2 natif :
- porteur protégé `100 PV`, adversaire du même camp non protégé `70 PV` (30 dégâts Terre) ;
- buff sur autre victime : protection inversée uniquement pour elle ;
- `dodgeable:false` et expiration exacte laissent toucher ;
- `stun` multicibles exclu sur porteur, appliqué sur allié non protégé ;
- `evaded -> heal:self` après auto-esquive AOE fonctionne via le propriétaire des buffs événementiels ;
- anciennes attaques directes restent évitées et effets de soin non hostiles ne sont pas bloqués.

Test initial RED `23241c30edccd01405742aa7940809f584fef39d`. Code natif `c6199c911da0d116713797310ea588026fb306b6`, événement réactif `39272d717cc9a169646fde7cecb7ae1f20268a72`. CI de code `38571052360`: Foundation, Firestorm Chromium et Creature Library Chromium **SUCCESS**.

## Règle de publication

Checkpoint de départ `checkpoint/lab-start-auto-dodge-multitarget-impact-rocheux-2026-10-14`, base GREEN `gh-pages@6bc637802e123b1e354222880b3290e4c20abb5b`, branche `work/lab-auto-dodge-multitarget-impact-rocheux-2026-10-14`. Fichiers autorisés uniquement : les 2 propriétaires précités, la nouvelle sentinelle, ce rapport et `docs/LAB_CURRENT_WORK.md`.

GREEN final : CI sur SHA documentaire final, checkpoint `checkpoint/lab-auto-dodge-multitarget-impact-rocheux-green-2026-10-14`, FF sous lease protégé, CI/Pages postpublication. Aucun JSON/asset utilisateur modifié. Test tactile/animations Android à confirmer par l'auteur.
