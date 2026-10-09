# Monster Capture — Persistance des zones après rappel — lot 3/4

Date : 2026-10-10.
Source de base : `gh-pages` `ae1175dc82866562b4d958610f57e5430609c98d`.
Checkpoint départ : `checkpoint/lab-start-zone-recall-persistence-v1-2026-10-10`.
Branche isolée : `work/lab-zone-recall-persistence-v1-2026-10-10`.

## Besoin produit

Une créature invoque **Voile brumeux** : une zone au sol procure un bonus de Défense aux alliés présents. L'utilisateur rappelle la créature et en invoque une autre. La zone reste en place et le nouvel arrivant reçoit ce bonus lorsqu'il est effectivement occupant, jusqu'à sortie de zone ou expiration. La zone doit aussi survivre à un remplacement pour K.O. lorsque l'auteur active l'option.

## Contrat et compatibilité

- Champ optionnel `SkillEffectV1.persistent_zone.persistAfterRecall` **booléen**. Si omis, comportement historique : la zone disparaît quand le lanceur est rappelé/remplacé. Valeur `true` disponible **pour une zone `apply_status` uniquement** (support, malus, renvoi de dégâts porté par statut, poison à l'entrée).
- Zone de dégâts directs `tickEffect.kind=damage` avec `persistAfterRecall:true` : **refusée explicitement dans cette V1**. Le calcul/KO après le départ doit pouvoir rester attribué à la bonne créature, et non au remplaçant qui utilise le même slot. Ce raccord sera conçu dans un lot séparé, sans déplacer la formule native de dégâts.
- Les contrats JSON existants ne gagnent aucun nouveau champ par défaut. L'éditeur n'ajoute `persistAfterRecall` que lorsque l'utilisateur coche l'option. Aucune migration auteur, catalogue, preset, bibliothèque média ou créature.

## Propriété et autorité

- `Roster Session` connaît l'ID du membre sortant ; elle notifie `Combat Session` au rappel, changement et K.O.
- `Combat State.persistentZones` demeure l'unique autorité des zones. Les zones marquées `true` conservent `id`, `sourceActorId` stable, durée, rayon, équipe du lanceur ; lors du départ : `detachedFromSource:true` et `originRosterMemberId` immuable. Le lanceur rappelé ne peut pas transférer cette propriété à son successeur.
- `Persistent Zone Runtime` retire les zones non persistantes et les statuts associés ; les zones persistantes restent actives jusqu'à leur expiration native.
- Une relève est un **nouvel occupant** d'un slot qui conserve pourtant le même `actorId`. `occupiedActorIds` est réinitialisé uniquement pour ce slot dans les zones existantes. Le nouvel entrant peut donc recevoir une nouvelle fois `on_enter` ou acquérir `while_inside`; aucun effet de zone n'est automatiquement transféré depuis l'ancien membre en réserve.
- Deux membres peuvent lancer une capacité de même `skillId` / `zoneId` sans que le second renforce la zone détachée du premier. Un ID de génération distingue les instances. Les réactivations du membre courant conservent leur zone propre.
- Les protections/statuts/durée, dégâts de poison et renvoi utilisent les propriétaires natifs existants : aucun `setInterval`, `Date.now()`, second moteur ou règle par nom de capacité.

## Présentation

La zone possède déjà une sprite et un calque dédiés. Lorsque son propriétaire est rappelé, `DOM Skill FX` conserve sa dernière position de rendu comme **point de sol figé**, plutôt que de la déplacer avec le modèle du remplaçant. Cette position visuelle ne décide jamais de la présence ou du gameplay. Si le renderer est entièrement remonté durant le rappel, il peut devoir retrouver une position visuelle par fallback : vérifier spécifiquement dans une future révision de la transition d'arène, sans prétendre à une nouvelle autorité spatiale.

## Tests de non-régression exigés

- Contrat vrai/faux strict et anciens exports inchangés.
- Combat + Roster réels : switch avec bonus Défense, retour à l'ancien membre, sortie/expiration, recall puis summon, 2v2 avec ennemis et alliés intacts, KO et remplacement, pas de transfert de propriétaire.
- `on_enter` rejoué pour un nouvel arrivant malgré l'actorId inchangé ; Poison, Soins, Miroir sont toujours gérés via le statut natif.
- Deux créatures lançant le même `skillId` ne se confondent pas ; vrais rendus de zone figés.
- UI native : édition, sélection du booléen, sauvegarde et export JSON, zone Poison indépendante inchangée ; bibliothèque des 103 créatures et Tempête de flammes intactes.
- GitHub Actions : suite Node complète et Chromium `creature-library-browser` + `firestorm-zone-growth-browser`.

## Périmètre protégé

Aucun changement de `main`, de `global-assets`, de `Zombicide-40k`, du World Builder, des 103 fiches créatures, bibliothèques de sons/sprites ou des données auteur. Aucun média nouveau. La persistance des zones à dégâts directs et le déclencheur autonome de **Miroir destructeur** restent deux extensions distinctes ; la zone appliquant un statut `damage_reflection` est utilisable avec cette option dès ce lot. Le test tactile Android physique de Sylvain n'est pas revendiqué.

## Preuves de CI et décision de livraison

À renseigner après vérification de la CI du commit documentaire final, revue du diff, checkpoint GREEN, preview et publication.
