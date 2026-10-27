# Rythme de référence Capture — 2026-10-04

État : GREEN utilisateur. Le nouveau rythme de référence a été validé explicitement par Sylvain le 2026-10-04 après test de la preview. Checkpoint de clôture prévu sur le commit documentaire final : checkpoint/lab-combat-reference-pace-v1-green-2026-10-04.

## Références

- Base : 200b42055f2063c9545db6da01d3104e18f1fee0.
- Départ : checkpoint/lab-start-combat-reference-pace-v1-2026-10-04.
- Travail : work/lab-combat-reference-pace-v1-2026-10-04.
- Source vérifiée : 9deff685fef8275c4c1e07d0fa18ac0d7ea24fcc.
- CI source : run 37222043505, job 111494179637, SUCCESS, gardes structure/indépendance OK, 1033 tests / 1033 PASS / 0 FAIL.
- Checkpoint technique : checkpoint/lab-combat-reference-pace-v1-technical-2026-10-04.
- Preview : preview/lab-combat-reference-pace-v1-2026-10-04, examples/dom-demo/capture-editor-v2.html.

Les deux dernières refs pointent le commit documentaire de clôture, dont la source est identique au commit vérifié ci-dessus.

## Comportement livré

Le rythme que Sylvain réglait à 0.5 est désormais la référence affichée 1×. Les nouveaux scénarios de l'éditeur emploient la vitesse native 0.5. Le nouveau 2× équivaut à l'ancien 1× ; 4× à l'ancien 2×. La plage UI 0.5–4 conserve l'accès à l'ancien maximum tout en permettant de ralentir davantage.

CAPTURE_COMBAT_REFERENCE_SPEED_V1 et captureCombatPaceToSkillSpeedV1 appartiennent au contrat Battle Setup Capture. Le champ humain est converti une seule fois à sa lecture. Les deux builders de nouveaux scénarios partagent la même constante par défaut. Le champ exporté skillSpeedMultiplier reste dans ses unités natives historiques, donc les valeurs explicites et le défaut legacy 1 restent inchangés.

Combat Session / Combat Timing continuent de calculer seuls les durées et timestamps. Les définitions et presets créature/capacité ne sont pas réécrits. Le réglage agit sur préparation/trajet/récupération et la préparation de réaction ; cooldowns, cadence des zones/statuts/énergie et rappel gratuit 2 s éditable restent inchangés.

## Vérification

- TDD : 3 RED et 1 témoin avant implémentation ; 47/47 tests ciblés après correction.
- Chaîne réelle Scenario Builder → export sérialisé → Adapter Stack → chargement natif → Combat Session : base 600/400/300 ms devient 1200/800/600 ms au nouveau 1×, puis 600/400/300 ms à 2×. Aucun double ralentissement.
- Compatibilité : valeurs natives explicites 0.5/1/2 préservées ; ancien export sans valeur conserve 1. Rappel reste 2000 ms ; énergie +1 au tick 1000 ms inchangée.
- Éditeur natif desktop, Loup/Griffe : préparation de donnée 1200 ms, facteur global affiché 1 ; action visible « Griffe · 2.3 s » juste après démarrage. Au facteur affiché 2, même capacité « Griffe · 1.1 s ». L'arrondi affiché inclut le modificateur natif du combattant et le temps déjà écoulé ; les assertions de durée exacte se trouvent dans le test déterministe.
- Revue native 390 px : contrôle 1×, texte de référence lisible, rappel 2 secondes et bouton Tester accessibles.
- CI complète checkout GitHub réel : 1033/1033, zéro échec.

Diff limité à 4 fichiers source/page, 2 fichiers test et documentation déclarée. Aucun asset, preset utilisateur, main, global-assets ou fichier du dépôt principal modifié. Validation utilisateur reçue : le rythme est accepté. Le lot peut être clôturé GREEN sans modification supplémentaire du moteur.
