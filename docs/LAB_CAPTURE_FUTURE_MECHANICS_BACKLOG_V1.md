# Monster Capture — backlog des mécaniques et réserve adverse (12 octobre 2026)

Ce document enregistre les demandes auteur ; **aucun des mécanismes restant à réaliser n'est déclaré livré** par sa présence ici. Chaque mécanisme doit être traité en lot indépendant, conformément à `LAB_CHARTE.md` et `LAB_ROADMAP.md`.

## A. Renvoi du projectile — à réaliser

La capacité actuelle `StatusEffectV1.damage_reflection` réfléchit un pourcentage des **PV réellement retirés au défenseur**. Elle ne fait pas inverser la trajectoire du projectile. Il faut une réaction distincte de *déviation/renvoi de projectile* qui conserve les contrats de collisions, les événements de résolution et l'autorité de la source de dégâts.

### Attendu

- Si le défenseur active « Miroir », un projectile éligible rencontre son bouclier, rebondit et poursuit une trajectoire réelle en sens inverse, au lieu de déclencher simplement un dégât miroir statique.
- Le projectile visible et sa collision doivent rester synchronisés ; aucun trajet graphique purement fictif. Retour à l'envoyeur possible seulement si sa trajectoire l'atteint effectivement et qu'il est encore éligible.
- Propriétaire et crédit des dégâts réfléchis explicitement définis ; immunités, esquive et collisions de projectiles déjà en place préservées.
- Une limite explicite aux renvois successifs empêche une boucle infinie miroir contre miroir.
- Contrats, tests de trajectoires 1v1/2v2, RED/CI puis rendu visuel réel requis avant GREEN.

## B. Immatériel — à réaliser comme extension d'Immunity Status

Le statut `immunity` existe déjà (domaines `damage`, `negative_status`, durée et stacking ; `docs/LAB_IMMUNITY_STATUS_V1.md`). Cela ne constitue **pas** encore une règle d'attaque « peut toucher une cible immatérielle ».

- Rendre une créature temporairement insensible aux dégâts **et états nuisibles** ordinaires, mais sans supprimer ses buffs bénéfiques ni sa présence dans le roster.
- Marquer par un **contrat explicite** les capacités qui peuvent toucher un être immatériel (aucune condition sur le nom ou l'élément de l'attaque).
- La décision s'effectue dans Combat Rules / Status Protection, avant dégâts et application de statuts ; pas dans l'éditeur, l'affichage ou le renderer.
- Définir le comportement des collisions, zones et attaques de contact, puis un feedback visuel non autoritaire dans un lot distinct.
- Tests incluant immunité totale ordinaire, attaque autorisée, statuts positifs, expiration, K.O. et réserve.

## C. Stacks à seuil — à réaliser en extension du système natif

Le runtime `StatusEffectV1` possède déjà `stacking: "stack"`, `maxStacks` et une polarité `beneficial / detrimental`. En revanche, aucun contrat de déclenchement général « au cinquième stack, appliquer K.O. / gel / autre effet » n'a été validé comme livré.

- Déclencheur paramétrable à un nombre de charges (exemple : 5), aussi bien pour un statut **positif** que négatif.
- Effet(s) au seuil pilotés par les mêmes primitives de combat : K.O. conditionnel, bonus, stun, heal, dégâts ou autre effet autorisé, selon les contrats disponibles.
- Définir les charges après activation : consommation/réinitialisation/maintien, et le comportement des nouveaux stacks au maximum.
- Pas de second compteur d'état dans l'UI ni de dégâts contournant l'immunité ; affichage visuel `3 / 5` à prévoir.
- Tests d'idempotence (un seuil atteint plusieurs fois ne double pas les effets), d'expiration, de stacking en rafales, 1v1/2v2 et réserve.

## D. Drain de vie — à réaliser

Le contrat de skill reconnaît `heal` (soin) et `energy_drain` (drain **d'énergie**), mais ne définit pas un effet dédié de drain **de PV sur dégâts réellement infligés**.

- Effet configurable soignant le lanceur en proportion des PV **effectivement perdus** par sa cible (pourcentage, et éventuellement plafond explicite).
- Si dégâts bloqués/immunisés ou esquivés : drain = 0 ; dégâts limités par les PV restants : drainage également limité. Bouclier absorbe avant calcul.
- Pas de double soin à cause d'un renvoi, d'un DOT ou d'un effet de zone ; leur inclusion éventuelle fait l'objet d'un réglage explicite.
- Soin appliqué par le moteur existant, sans HP local ni nouvelle horloge ; tests de protection, KO, effet multi-cible et export/import.

## E. Réserve adverse — ergonomie 6 créatures, plus tard

Le menu « Réserves adverses » est déjà situé en haut, à côté des PV de `opponent-1` ; il affiche PV/KO depuis `Roster Session` et le ciblage existant.

Lot d'ergonomie futur, à valider sur Android paysage :
- réduire la place **interne** occupée par chaque barre PV sans rendre les cibles trop petites au toucher ;
- ajouter une **petite icône propre à la créature** issue de la bibliothèque de présentation existante, avec fallback texte contrôlé, jamais une nouvelle bibliothèque ;
- accueillir six créatures sur un écran étroit avec panneau scrollable, sans masquer toute l'arène, la carte de PV adverse ni le 2v2 ;
- conserver les KO visibles, le ciblage seulement quand il est permis et l'unique projection des PV de `Roster Session`.

## F. Priorité d'exécution

1. Réorganisation **visuelle seulement** de l'éditeur de capacités (lot `skill-editor-visual-hierarchy-v1`) : Cast/Projectile/Impact plus accessibles, réglages experts Glow/fumée repliés ; ne modifier aucune capacité existante.
2. Valider l'ergonomie sur téléphone réel.
3. Prévoir les mécanismes A-D en **lots distincts**, ordonnés selon dépendances et priorité auteur.
4. Ergonomie réserve E en lot séparé, avec vraie validation 6 créatures.
