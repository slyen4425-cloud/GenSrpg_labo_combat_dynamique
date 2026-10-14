# Backlog — Buffs génériques à déclencheurs événementiels (Monster Capture)

**Date : 14 octobre 2026 — idée auteur consignée, non implémentée.**

## Intention produit

Créer une mécanique **générique et éditable** : une compétence peut poser pendant X secondes (par exemple 60 s) un buff sur une créature. Tant qu'il est actif, des **événements de combat** provoquent automatiquement une ou plusieurs conséquences configurées.

Exemples exprimés par l'auteur :
- À chaque fois que la créature buffée **inflige des dégâts**, ajouter une **brûlure** sur la cible touchée ;
- Sur le même événement, ou dans une autre capacité, **soigner le porteur** ;
- Ou **appliquer un statut** / autre effet sur une cible choisie ;
- Après 60 secondes, **ne plus déclencher** d'effets supplémentaires.

Une brûlure ou un statut déjà appliqué avant la fin du buff conserverait sa propre durée (à confirmer comme règle de contrat lors de l'implémentation). À terme, réutiliser **exactement le même mécanisme pour les passifs**, potentiellement sans limite de durée, plutôt que coder un système parallèle.

## Modèle conceptuel suggéré — PAS un schéma de données validé

`Buff actif -> événement canonique (ex. dégâts réellement infligés) -> conditions/filtres configurables -> ensemble d'effets existants -> cibles autorisées`.

Le buff actif conserve sa durée et son état dans le **Status Runtime** actuel ; il consulte la **seule horloge de combat**. La résolution des dégâts et des états reste propriétaire de **Combat Rules**, pas de l'UI, d'une animation, de l'IA ou d'un second planificateur. Les effets produits devraient réutiliser les contrats `SkillEffectV1` / `StatusEffectV1` compatibles plutôt que créer une seconde autorité.

La fonction est **distincte** :
- d'un buff de statistiques ;
- d'un DoT/HoT périodique ;
- du déclencheur `onStackThreshold` réservé au seuil de charges ;
- de `auto_dodge` (esquive sur impact entrant) ;
- du vol de vie attaché à une compétence individuelle ;
- des conditions `activationRequirements.damage_dealt` qui autorisent le lancement d'une compétence et ne constituent **pas** un événement `à chaque dégât`.

## Décisions à prendre avant développement

- Déclencheurs : `on_damage_dealt` après **perte de PV réellement appliquée** (premier candidat), puis éventuellement toucher confirmé, soin donné/reçu, dégâts subis, esquive, KO, début/fin de tour. Ne pas supposer qu'ils sont tous nécessaires.
- Cibles et effets : victime, lanceur, allié, ennemis ; applique_statut, soigne, dégâts, buffs ; liste combinable et ordre déterministe.
- Sémantique : dégâts absorbés par bouclier, attaque multi-cible, DoT, dégâts réfléchis, collision de rayons, attaques qui ratent ; une fois par attaque ou par cible ?
- Sécurité : **anti-récursivité** pour empêcher un effet secondaire (brûlure, soin, renvoi, drain de vie) de se redéclencher indéfiniment ; limitations éventuelles par durée/cible ou délai interne éditables, jamais cachées en dur.
- Durée/charges : réactivation, renouvellement, superposition de plusieurs buffs, dissipation, mort ou rappel, interaction réserve et passifs.
- Autorat : champs explicites du Human Editor, export/import des capacités/traits, rendu/tooltip du buff actif, exemples et validations smartphone.
- Version 1 à considérer : **buff actif temporaire -> dégâts directs confirmés -> une liste limitée d'effets sur le porteur/la victime**, sur le vrai combat 1v1/2v2, après tests RED de timing, non-déclenchement sur esquive, prévention des boucles, expiration et reconduction.

## Cadre du lot actuel

**Documentation seulement. Aucun code de buff à déclencheur créé, aucun export auteur modifié.** Il faudra plus tard un chantier distinct de contrat, tests RED/GREEN dans le vrai Action Resolver/Combat Runtime, Human Editor, et tests 1v1/2v2 sur smartphone. Ne pas déplacer les propriétaires ni toucher au moteur de collision ou à l'IA validée.

Base Git `gh-pages@10244bafbb2159332167a80a476081eea2ffb355`; travail documentaire isolé en `work/lab-triggered-buff-backlog-2026-10-14`, suivi dans `docs/LAB_CURRENT_WORK.md`.
