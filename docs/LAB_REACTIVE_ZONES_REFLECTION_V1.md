# Monster Capture — Réactions de dégâts / zones de soutien — plan produit et micro-lot 1

Date : 2026-10-09. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Exemples produit validés

1. **Voile brumeux** (Eau) : bulle de zone au sol ; bonus Défense configurable, option *Persiste après rappel*. Le bonus s'applique aux alliés dans le rayon actuel et cesse dès la sortie de zone / expiration. Aucun buff persistant fantôme une fois sorti.
2. **Zone empoisonnée** : un adversaire franchit la limite réelle de la zone, reçoit un statut Poison, avec durée, ticks et règles de réapplication explicitement configurables. Pas de réapplication à chaque frame, seulement sur entrée et éventuel tick périodique selon contrat.
3. **Bouclier miroir** : un statut natif `damage_reflection` renvoie un pourcentage des dégâts vraiment encaissés, après résistances/immunités/boucliers. Un renvoi ne renvoie jamais à son tour.
4. **Miroir destructeur** : zone au sol durant N secondes, option *Persiste après rappel*. Elle peut déclencher un renvoi (%) quand un allié présent reçoit des dégâts ; une variante ultérieure pourra riposter d'un montant fixe configurable lors du déclencheur « allié blessé ». Le propriétaire de la zone ne doit pas changer quand on rappelle sa créature.

## Autorités, protection des anciens projets

- `CombatState.persistentZones` + `persistent-zone-runtime-v1.js` conservent toute autorité sur durée, rayon, reactivation et présence en zone.
- `CombatDamageApplicationV1` applique toute perte de PV, statuts boucliers et futures réactions / crédits KO. Pas de deuxième système de dégâts dans l'UI ou Renderer.
- `Status Runtime` gère la définition native et la durée des buffs/malus, DoT, HoT, immunités, miroir.
- `Roster Session` gère l'identité d'un membre. Le slot `local` peut survivre au changement de membre mais **l'ancien lanceur ne doit pas devenir le nouveau membre** : persistance de zone => source / équipe immuables et ancre terrain stable, arrêt / nettoyage sans fuite, KO/décès/rappel testés.
- Renderer et FX ne sont que des projections des états propriétaires ; le visuel brume / bulle n'applique aucun statut à lui seul.
- La valeur par défaut des vieilles zones de feu continue de supprimer les zones au rappel ; aucune migration silencieuse ou retouche Firestorm.

## Découpage obligatoire des travaux

### Lot 1 : reflet de dégâts par statut natif (présent chantier)

Ajouter `StatusEffectV1.damage_reflection` : `percent` entre 0 et 100, ciblage via `apply_status`, durée et stacking habituels, UI Human Editor et info statut. Le pourcentage se calcule sur les **PV perdus** après réduction et bouclier. Plusieurs statuts actifs peuvent se cumuler sans dépasser 100 % par impact. Immunité, bouclier du frappeur et absence de PV empêchent un renvoi effectif. Même chemin Damage Application, pas de ping-pong, crédits KO correctement attribués. Les attaques et ticks DoT parcourent la même autorité. Un effet de zone miroir **n'est pas encore** livré dans ce lot.

### Lot 2 : statut et effets à l'intérieur d'une zone

Extension additive de `SkillEffectV1.persistent_zone` pour `tickEffect` contrôlé et pour des effets non offensifs. Support initial `apply_status` + buffs/malus/Poison, avec acquisition à l'entrée et révocation à la sortie/expiration pour les buff locaux, sans retirer les statuts indépendants qui portent les mêmes noms. Le poison « appliqué à l'entrée » peut garder sa durée après la sortie si la règle le prévoit (configurable). Idempotence sous horloge native, immunités et stat native propriétaires, test 1v1/2v2. Garder le comportement feu existant par défaut.

### Lot 3 : persistance optionnelle au changement de membre

Champ `persistAfterRecall: false|true`, défaut false. Zone persistante indépendante du slot remplacé ; préserver propriétaire originel et camp, anchor terrain stable et rayon réel. Le remplaçant peut recevoir le bonus s'il entre dans la zone ; l'ancien membre en réserve ne reçoit aucun tick de zone. Même cadence et expiration; règles pour KO, dépense, refresh, renforcement, 2v2 et éditeur. Ne pas utiliser `sourceActorId` à l'aveugle comme identité de créature après switch.

### Lot 4 : effet miroir attaché à une zone

Réutiliser la mécanique de reflet statutaire et exposer le déclencheur de zone « dégâts reçus par allié en zone », avec `percent` et éventuel `fixedAmount`. Prévoir options d'éligibilité des dégâts, immunité, cadence, cumul, instant de déclenchement, non-récursion, disparition avant/pendant changement de membre. Ne pas dupliquer CombatDamage. UI, export/import complet et vraie preview.

## Protocole et garanties

Pour chaque lot, charte + roadmap + current_work, checkpoint départ, branche dédiée, RED puis code minimal, Node complet et vrais Chromium, revue, checkpoint GREEN exact puis publication gardée sous lease. Ne pas retoucher `main`, `global-assets`, `Zombicide-40k` ni les deux autres laboratoires. Aucune promesse que les 4 lots ont été livrés parce que le contrat ci-dessus est écrit.


## Résultat vérifié du micro-lot 1 — 2026-10-09

- `StatusEffectV1.damage_reflection` est reconnu, valide un pourcentage de 0 à 100, et utilise les durée/stacking natifs. Le Human Editor propose le champ « Dégâts réellement reçus renvoyés (%) » dans le formulaire Buff / Debuff / Statut. La description contextualisée et la fiche de statut affichent le pourcentage.
- L'autorité `Combat Damage Application` applique le renvoi une fois, sur PV effectivement perdus, sans déclencher une réaction à la réaction : refléter 40 % de 20 PV retirés = 8 dégâts renvoyés avant bouclier ou immunité du frappeur. Un bouclier qui absorbe intégralement = 0 ; un miroir réciproque ne boucle pas ; KO crédité une fois.
- Preuves RED `37995395397`, GREEN source `37995536906` : **1350/1350 Node PASS**, Chrome bibliothèque et Firestorm tous verts. GREEN avec parcours réel de l'éditeur `37995645963` : sauvegarde + export JSON d'un statut **35 % / 12 s** puis vérification de 103 créatures et scénarios de Firestorm.
- Diff comparé au point de départ publié `9a1ce6b2ad0f5194a3b6adf53154b5b78abbe984` : neuf fichiers, 4 commits, 0 behind. Aucune mutation de preset, assets, ancienne zone, source de dégâts parallèle.
- Attention : les zones de support ou d'empoisonnement, la survie au changement de créature et le miroir de zone **ne sont pas implémentés** dans cette V1. L'éditeur peut maintenant créer une compétence de renvoi pour son lanceur ou une cible, mais un sprite de zone n'accordera pas encore automatiquement cet effet aux occupants. Aucun feedback visuel dédié au choc réfléchi n'est revendiqué.
