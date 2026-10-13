# Capture — Correction de régressions UI 1v1 + ergonomie 2v2 V1

Date : 13 octobre 2026.

## Retours utilisateur (faits)
- Le 1v1 historique est apprécié mais le raccourci « Réserves adverses » a disparu.
- Le nouveau 2v2 permet déjà de changer la créature contrôlée, mais les capacités occupent une surface excessive, l'autre allié est masqué, les deux cartes ennemies s'empilent et la réserve ennemie reste difficile à voir.
- Toute revendication d'ergonomie GREEN sur Android réel reste en attente d'un retest utilisateur.

## Isolation / comparaison
- Base officiellement publiée avant correction : `gh-pages@774f51f9009854e25827b9682c0c5b2ce347e167`, CI `38420713265` et Pages `38420712632` SUCCESS.
- Checkpoint avant tout code : `checkpoint/lab-start-combat-ui-regression-repair-v1-2026-10-13`.
- Branche de travail : `work/lab-combat-ui-regression-repair-v1-2026-10-13`.
- Fichiers d'exécution modifiés seulement : `src/ui/capture-combat-roster-controller-v1.js` (projection UI), `examples/dom-demo/capture-editor-v2.css` (présentation paysage).

## 1v1 : rétablir l'accès réel
- La cause concrète était `enemyPanel.hidden = benchCount === 0` dans le propriétaire du panneau des réserves. Le joueur perdait le seul raccourci natif lorsque tous les ennemis étaient engagés ou que la réserve était vide.
- Le même `details` et les mêmes lignes Roster Session restent propriétaires des véritables créatures/PV/règles de ciblage.
- Le menu reste maintenant accessible, y compris avec `0` réserviste ; il affiche le vrai compteur et un message explicite d'absence de réserve au lieu de disparaître.
- Aucune modification du layout 1v1 : position/échelle ennemie, carte joueur/ennemi, barre de capacités, Esquive et Rappel conservés.
- L'état vide ne fabrique ni monstre ni média et ne permet aucune nouvelle commande.

## 2v2 : lisibilité
- Uniquement sous le `BattleFormat` réel `[data-combat-active-count="2"]` : première carte adversaire en haut à droite, seconde à gauche et éloignée du bouton Retour.
- Le panneau des réserves adverses possède un accès lisible distinct des cartes de PV, et sa liste se déplie toujours avec le `details` natif.
- Le deuxième combattant allié se trouve dans l'espace central dégagé via sa vraie position DOM (capteurs de projectiles / sockets toujours sur cette géométrie).
- Uniquement en mode `[data-local-control-mode="solo-dual"]` : grand dock des capacités réduit de 72 % à `min(19rem,34%)`; icônes/boutons de cinq capacités compactés ; carte de l'autre allié déplacée près du bas de l'arène, hors du panneau de commandes ; Esquive proche de la commande et Rappel natif maintenu.
- En mode humain + IA, aucune modification de l'état de pilotage, des casts ou des capacités ; aucune modification 1v1 de style ni de logique.

## Tests et critères restants
- Nouvelle sentinelle `tests/unit/capture-combat-ui-regression-repair-v1.test.mjs` écrite avant correctif (RED), puis GREEN : contrôle natif du raccourci avec 0 et 2 réservistes, séparation explicite des deux cartes ennemies et sélecteur de format 2v2, taille de la barre en solo-dual, deuxième allié, présence Esquive/Rappel et absence de modification 1v1.
- Fondation Node et navigateurs réels Chromium Firestorm et bibliothèque 103 créatures : requis GREEN sur le code et SHA documentaire final.
- Créer checkpoint GREEN sur SHA exact, vérifier `gh-pages` inchangé depuis la base, publier par fast-forward sous lease puis valider CI et Pages post-publication.
- Test manuel Android paysage du 1v1 **et** 2v2 demandé, notamment vitesse de switch, zone tactile 5 compétences, accès aux deux réserves, PV/cible, absence de recouvrement et impacts/projectiles.
- Strictement exclus : Core Combat, IA, FX, Roster Session, descriptifs auteurs, assets, `global-assets`, `main`, GenSrpG et Exploration.
