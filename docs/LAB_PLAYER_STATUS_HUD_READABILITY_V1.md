# Combat Capture — Buffs/debuffs sur sa propre créature V1

Date : 10 octobre 2026

## Reproduction et cause

Dans le véritable combat `capture-editor-v2.html`, les quatre panneaux disposent déjà de `data-combat-status-icons`. Le renderer natif `createDomStatusFxRenderer` est branché sur `CombatState.fighters[*].statusEffects` pour les deux camps, y compris `local-1` et `local-2`.

La fenêtre d'information `.status-icon__details` était ancrée vers le bas (`top: calc(100% + 0.42rem)`), avec centrage horizontal (`left: 50%; transform: translateX(-50%)`). Cette géométrie convient aux adversaires dont la carte est placée en haut de l'arène. **Le joueur est en bas à gauche, dans `.arena { overflow: hidden }`** : la fiche dépassait sous la carte et à gauche pour les premières icônes. Même risque de débordement pour l'allié en bas à droite.

Le problème démontré est donc **une projection de placement**, pas l'application des buffs/debuffs ni leur horloge. Aucun deuxième système de statut n'est nécessaire.

## Correction minimale

- `demo.css` uniquement pour le visuel : fiche **vers le haut et alignée à gauche** pour `.squad-card--player` ; fiche **vers le haut et alignée à droite** pour `.squad-card--command-ally` ; largeur limitée à la largeur du viewport.
- Icônes du joueur renforcées : diamètre 1,64rem, bordure de 2px, contraste d'affinité buff vert / debuff rouge et espacement plus lisible sur smartphone.
- Le comportement de l'ennemi et du système de cooldown/préparation reste strictement inchangé.
- Aucun nouveau listener, timer, effet, asset, statut ni calcul de gameplay ; même renderer et même nettoyage natif.

## TDD et vérification

- Test RED `2f3a73fbe2f70a620d91d25a9f1abd8a43d3f2d1`, CI `38044116409` FAILURE comme attendu sans règles de placement player/ally.
- Correction de géométrie : `c97fc84ca5224f8c8e50593f07cde1740707991b`, CI `38044135749` SUCCESS.
- Renforcement visuel : `2ef1d68ed3b44b8e6aa660435a9143a58e370d27`, CI `38044162308` SUCCESS.
- Test de vraie liaison statuts Player/Enemy depuis le **même** `DomStatusFxRenderer` : `bb217b993db5980cce7495059cf8148e2c7f5e0c`. Contrôle des deux fiches, de leur texte, des polarités et de la disparition/indépendance du statut joueur, sans faux gameplay.
- Sentinelles `player-status-hud-readability-v1.test.mjs` : placement bas gauche / bas droite, comportement top ennemi non modifié, présence de quatre statusHosts dans vrai HTML et raccord natif `statusFx.sync`.
- Suite complète Node, Chromium éditeur 103 créatures et Firestorm exigés avant GREEN, checkpoint exact et publication. Aucune validation tactile Android physique affirmée.

## Limites

Ce correctif porte sur la lisibilité des icônes et de la fenêtre d'informations, pas sur les animations de particules ou une modification d'effet métier. Sur très petits écrans, une vérification tactile reste requise pour confirmer l'ergonomie en conditions réelles.
