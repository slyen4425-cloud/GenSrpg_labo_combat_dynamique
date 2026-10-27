# Combat Capture — IA, rappel/invocation et temps de contact v1

Date : 2026-10-04. Statut : **vérification technique réussie ; validation utilisateur à faire**.

## Résultat

Dans le test de combat de l’éditeur Capture, le panneau Équipe propose désormais une seule commande **Rappel et invocation · Gratuit**. La créature actuelle reste présente et ciblable pendant 1000 ms ; la réserve sélectionnée la remplace immédiatement à la fin. Une attaque adverse ne bloque plus la sélection ni cette commande. Les autres acteurs continuent à combattre.

L’IA utilise les effets natifs de zone à agrandissement : elle conserve assez d’énergie pour commencer la séquence, attend le cooldown entre renforcements et réutilise la capacité jusqu’au plafond. Cette décision est générique, sans branche liée au Loup ni à un identifiant de capacité. La vraie Tempête de flammes atteint short → medium → long sans changer sa définition.

Les capacités peuvent appliquer un statut **Temps de trajet de la créature** avec un pourcentage signé. +50 % transforme 1300 ms en 1950 ms ; -50 % transforme 1300 ms en 650 ms. Durée, polarité, empilement et retrait utilisent les statuts natifs.

## Panne reproduite avant correction

Source antérieure : `0ec42fd2d2b006c939c29a8bdb61e11a26ec97d7`, identique fonctionnellement à la base de ce lot.

Vrai éditeur : Loup actif, Maraileron en réserve, Loup adverse. Ma créature est Prêt, énergie 12/12. Pendant Cendre aveuglante adverse, la réserve et Rappel sont désactivés. Le panneau utilisait le verrou global hasActiveAction, ce qui exigeait une arène entière inactive. Le Runtime savait déjà gérer une action par acteur : le blocage était dans la projection UI. Les définitions recall/summon facturaient aussi 2/3 énergie et nécessitaient deux actions, avec un slot absent entre les deux.

## Contrats et limites

| Sujet | Règle native |
| --- | --- |
| Remplacement | Commande switch : coût 0, préparation fixe 1000 ms, récupération 0 |
| Réserve | Son memberId est figé à l’acceptation ; membre vivant et différent de l’actif |
| Présence | Ancien membre reste actif jusqu’à command-complete ; aucun passage par activeMemberId null |
| Actions | Une action par acteur ; ma propre action en cours empêche encore une seconde action |
| Attaques adverses | Continuent vers le même slot ; le membre présent au contact reçoit le résultat |
| Interruption | Stun avant release ou KO annule le rappel ; relève KO native conservée |
| État du membre | PV, énergie, progression de charge, cooldowns, usages, statuts et compteurs conservés |
| Statuts en réserve | Durées absolues conservées ; statuts expirés supprimés au retour ; ticks manqués non rejoués |
| Zone du membre sortant | Retirée à la relève ; pas de transmission de son aura au nouvel actif ; zones adverses conservées |
| Trajet | Modifie ground/aerial au démarrage de l’action ; durée dérivée figée pour cette action |
| Autres timings | Préparation, récupération, cooldown, projectiles, beams et téléportation indépendants |
| Pourcentage | Somme des statuts actifs × stacks ; durée finale bornée à zéro, puis multiplicateur global natif |
| Compatibilité | recall/summon anciens restent disponibles pour les surfaces historiques ; définitions gratuites, 1000/0 ms |

Le nouveau bouton unique concerne le panneau natif du test Capture. Les anciennes surfaces de démonstration ne sont pas réécrites. Aucun preset de créature/capacité ni asset n’est modifié dans ce lot.

## Propriétaires

- Command Contract/Resolver : kind switch et effect.rosterMemberId, délai de remplacement et command-complete.
- Combat Runtime : horloge existante, concurrence par acteur, interruption native au vrai impact stun et annulation des actions après KO temporel.
- Roster Session : previewSwitch/switchMember atomiques, sauvegarde/restauration du membre ; Session replaceFighter avec clearSourceZones explicite.
- Status Runtime : reprise pure des instances au temps du combat, sans nouvelle horloge.
- Persistent Zone Runtime : suppression des seules zones du membre sortant.
- Decision Controller : lecture des zones/énergie/usages et previewSkill légale ; économie et renforcement, rotation ordinaire hors objectif.
- Status Contract/Combat Timing/Action Resolver : approach_time_modifier/modifierPct et action.travelMs dérivé.
- UI/Presenter : sélection, affichage, statut et animation lisent les sorties natives ; aucune formule de combat dans le DOM.

## Tests et preuve réelle

Les nouveaux tests ont été exécutés RED avant chaque correction, y compris la panne de panneau sous attaque adverse. Les cas complémentaires RED reproduisent le stun ignoré, le KO DoT pendant rappel, 30 dégâts anciens rejoués au retour et l’aura transmise au nouvel actif. Le test IA a été revérifié RED contre l’ancien contrôleur avec un vrai BattleFormat, puis corrigé.

17 tests dédiés couvrent :
- bouton et réserve disponibles pendant l’attaque adverse ;
- remplacement 0 énergie, 999/1000 ms, slot toujours présent, capacités de la réserve ;
- réserve figée, interruption et KO ;
- restitution des PV/énergie/cooldowns/usages/statuts/compteurs ;
- aucun rattrapage de ticks en réserve et aucune aura héritée ;
- économie et short/medium/long, conditions d’activation et limite d’usage ;
- vraie Tempête de flammes non modifiée avec coût 5, cooldown 3500 ms et seuil 25000 ms ;
- 1300 → 1950 ms au Runtime/Presenter, dommages seulement au contact dérivé ;
- expiration en plein trajet sans changement de l’action déjà commencée, empilement et cleanse ;
- accélération, borne zéro, projectiles et téléportation inchangés ;
- champs humains → contrat de capacité normalisé.

**CI complète GitHub : 1006/1006, zéro échec**, source `0e151d26fde11af17525f442f648b2334f07e107`, run `37203265282`, job `111439103810`. Le checkout CI possède les vrais médias. Le miroir local initial n’a pas les 173 MP3 privés et deux documents fondation : aucun faux média n’a été ajouté pour contourner ces vérifications. La CI distante est la preuve complète.

Vraies manipulations via l’éditeur :
1. Loup → Maraileron → Loup à énergie 0, compte à rebours 1 s, nouveaux noms/PV/capacités puis restitution.
2. 2v2 avec trois membres locaux et deux ennemis : rappel local simultané à trois préparations Tempête de flammes. Maraileron entre, son KO ultérieur relève le Loup par le chemin natif.
3. DOM de présentation des adversaires : zones opponent-1 et opponent-2 avec zoneRadius long, après renforcements natifs.
4. Éditeur : Cendre aveuglante configurée temporairement avec le statut trajet +50 % / 30 s, enregistrée, autre fiche sélectionnée puis rechargée avec les mêmes valeurs. Combat : badge adverse « Temps de trajet de la créature augmenté de 50 % ». Ces valeurs de QA ne remplacent pas le preset du dépôt.
5. Vue mobile native editor-mobile-review : relève à 0 énergie, Maraileron actif et Loup réserve ; largeurs 360/390/430 sans débordement horizontal, bouton 44 px de haut et largeur 291/317/352 px ; paysage 740×390, panneau entre y68 et y326.
6. Capture de preuve : `combat-labo-verifie-1791118577236.jpg`, même panneau mobile montrant la relève et le bouton gratuit.

## Reprise et rollback

- Base : `fb4bdb88a744986e25dd542d94105fbe4d94cb6d`
- Départ : `checkpoint/lab-start-combat-tactics-switch-travel-v1-2026-10-04`
- Travail : `work/lab-combat-tactics-switch-travel-v1-2026-10-04`
- Source vérifiée : `0e151d26fde11af17525f442f648b2334f07e107`
- Checkpoint technique : `checkpoint/lab-combat-tactics-switch-travel-v1-ci-2026-10-04`
- Preview dédiée : `preview/lab-combat-tactics-switch-travel-v1-2026-10-04`
- [Éditeur natif vérifié](https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/0e151d26fde11af17525f442f648b2334f07e107/examples/dom-demo/capture-editor-v2.html)

main reste `3197388f2b3ee7491be6e6125a015315158cffa2` ; global-assets reste `0217dca50ec4004d5ac3bb25d6f5998ccf9edc4f`. Zombicide-40k est hors périmètre. Aucun merge vers main et aucun GREEN utilisateur prononcé.
