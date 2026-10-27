# Événements déclencheurs → effets V2 (Monster Capture)

**14 octobre 2026 — extension du moteur de statuts existant ; compatibilité V1 conservée.**

## Principe créateur

Une compétence utilise toujours **Appliquer un statut**, mais ce statut peut désormais être **« Buff à déclenchement — événement → effets »**. La durée reste réglable (par ex. 60 s). Le créateur choisit :

1. **L'événement déclencheur**, indépendant du nom de la capacité ;
2. **Un ou plusieurs effets configurables** (1 à 12) et leurs cibles ;
3. La polarité **bénéfique ou négative**, ainsi que durée et remplacement/rafraîchissement.

La règle est générique ; aucune condition spéciale « compétence X → événement Y » n'est codée.

## Événements actuellement reliés au vrai moteur

| Événement | Déclenchement exact | `self` | `target` |
| --- | --- | --- | --- |
| `damage_dealt` | Une attaque ou effet tactique immédiat inflige effectivement des PV à une cible (HP perdus > 0) | Porteur attaquant | Victime |
| `damage_taken` | Le porteur perd réellement des PV sur ce même coup | Porteur blessé | Source du coup |
| `movement` | Changement tactique de bande **ou** approche de compétence (`ground`, `aerial`, `teleport`, `burrow`) réellement achevée avec trajet positif | Porteur qui se déplace | Cible de l’approche, ou porteur en déplacement tactique |
| `evaded` | Le resolver confirme `outcome=evaded` pour l'attaque ciblée, manuelle ou automatique | Défenseur ayant esquivé | Attaquant |

Les dégâts `onDamageDealt` de V1 continuent de fonctionner et sont lus par **le même dispatcher** ; les exports V1 restent au format d'origine jusqu'à changement explicite du type d'événement dans l'éditeur. Le contrat refuse `onEvent` et `onDamageDealt` simultanés. Aucun effet déclenché n'est réutilisé lui-même comme source : pas de boucle infinie.

**Exemples :** une malédiction à polarité négative posée sur l'ennemi : `movement -> damage:self(7)` ; un buff sur soi `evaded -> heal:self(12)` ; un ultime `damage_dealt -> apply_status:target(Brûlure) + heal:self`. La brûlure déjà appliquée conserve sa propre durée même si le buff origine expire.

## Propriété et fiabilité

- **Source de vérité** : `StatusEffectV1` expose `onEvent.event` et les effets imbriqués du `SkillEffectV1`, `Combat State.elapsedMs` possède le temps, `ActionResolver` émet les événements natifs réels et `triggered-buff-events-v1.js` applique les effets avec `applyImmediateTacticalEffectsV1`.
- Les procs appliquent les règles natives de HP, résistances, boucliers et immunités. Une attaque évitée ou 100 % absorbée ne déclenche pas `damage_dealt` ou `damage_taken`.
- Un événement réussi peut appliquer **plusieurs effets**, mais les événements générés par ces effets ne sont jamais rejoués par le dispatcher.
- La polarité négative permet de poser une malédiction sur l'ennemi. La cible des effets ne peut être que le porteur (`self`) ou l'autre combattant associé à l'événement (`target`). L'attribution du dommage d'une malédiction `movement` V2 reste au porteur pour les effets tactiques ; une attribution au poseur demanderait un contrat explicite distinct.
- Déjà composable 1v1 et 2v2 sans UI de dégâts propriétaire ; aucun second timer/AI/hitbox. Pas de changement de la compétence ou de ses exports de l'auteur.

## Limites clairement assumées

La liste est **extensible** mais seuls ces quatre événements sont aujourd'hui branchés. Les approches natives de compétences déclenchent **une fois à la fin du mouvement**, pas à chaque frame ; les déplacements purement graphiques ou en exploration ne le font pas. Les dégâts de DoT, de zones persistantes, les renvois et les soins ne sont pas encore des déclencheurs spécifiques. `evaded` exige une vraie issue d'esquive, pas un clic sur le bouton.

Les critères complémentaires sont pour de futurs micro-lots : d'autres événements (début déplacement, fin d'approche, soin reçu/donné, KO, effet de statut appliqué, entrée/sortie de zone), conditions/chances/cooldown, multiples événements par même statut et passifs permanents. Les conditions doivent être définies sur des événements canoniques du gameplay, jamais par le renderer.

## Tests et gouvernance

- Départ `gh-pages@75a491f9e2bf695c63fb274dfbad6c7e71345648` ; checkpoint `checkpoint/lab-start-event-trigger-v2-2026-10-14`; branche `work/lab-event-trigger-v2-2026-10-14`.
- `tests/unit/capture-event-triggers-v2.test.mjs` : contrat, refus configuration ambiguë, ancienne V1, `move` effectif et preview sans mutation, malédiction de mouvement qui expire, soin du défenseur à l'esquive confirmée, dégâts subis, protection 2v2, builder Human Editor et sélection du déclencheur.
- Tests existants de `capture-triggered-buff-v1`, dommages, mobilité, IA, rayons et status sont conservés.
- CI Foundation + deux Chromium et déploiement GitHub Pages sur SHA final sont requis avant publication GREEN. Validation smartphone réelle lors du test global par l'auteur, non revendiquée.


## V2.1 — véritable mouvement d'approche dans les compétences Capture

- Le **même dispatcher** `applyEventTriggeredBuffsV2` consomme l'événement `movement` à `SkillCompletion` quand `approachMode` appartient à ground/aerial/teleport/burrow et `travelMs > 0`. L'autre acteur est la cible de l'approche. Les annulations avant résolution et les projectiles/rayons immobiles restent exclus. Événement unique par approche achevée, aucune animation ne devient une autorité gameplay.
- Test natif `tests/unit/capture-approach-movement-trigger-v1.test.mjs` : vrai CombatSession, curse -7 PV pour les quatre modes, attaques stationnaires, expiration, 2v2. Aucun schéma de statut supplémentaire ni modification de Runtime, horloge, FX ou fichiers auteur.
- Base `gh-pages@7666e2951377be718f9f555bb13ecbfa836dafc6`, branche `work/lab-approach-movement-trigger-v1-2026-10-14`, checkpoint de départ `checkpoint/lab-start-approach-movement-trigger-v1-2026-10-14`.
