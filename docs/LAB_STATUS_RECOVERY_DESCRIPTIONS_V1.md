# HUD des statuts — descriptions de régénération énergie / compétences V1

Date : 11 octobre 2026.

## Diagnostic confirmé
Le renderer de carte `status-effect-info-v1.js` basculait dans `default: []` pour les nouveaux types `energy_regen_modifier` et `skill_cooldown_rate_modifier`. Le HUD exposait ainsi l'ID technique d'un statut (`cap_earth_atk_3:0`) sans description mécanique. Le gameplay était déjà porté par Combat Timing/State/Session ; le défaut est strictement de présentation.

## Correction délimitée
Le même projecteur, sans timer ni logique Combat, affiche maintenant :
- Énergie +50 % : « Énergie récupérée par tick augmentée de 50 % » ;
- Énergie −50 % : « Énergie récupérée par tick réduite de 50 % » ;
- Énergie ≤−100 % : « Régénération d’énergie suspendue (0 énergie par tick) » ;
- Recharge +100 % : « Vitesse de recharge des compétences augmentée de 100 % » ;
- Recharge −50 % : « Vitesse de recharge des compétences réduite de 50 % » ;
- Recharge ≤−100 % : « Recharge des compétences en pause » ;
- Variation zéro : « inchangée ».
Les stacks utilisent le multiplicateur du statut actif. La dénomination métier remplace l'ID sur ces deux nouveaux types uniquement ; l'origine de compétence, la polarité, la durée et les autres statuts restent natifs.

## Traçabilité et frontières
Base CI GREEN : `gh-pages` `72576fc465e0d5cb819d9126e798b900c2998163` ; Laboratory CI `38092349490` SUCCESS ; Pages `38092348817` SUCCESS.
- checkpoint départ `checkpoint/lab-start-status-recovery-descriptions-v1-2026-10-11` ;
- travail `work/lab-status-recovery-descriptions-v1-2026-10-11` ;
- test RED `155676fd0b69eca7446b847e02cdf5e1cf6752c4`, Laboratory CI `38093485632` FAILURE attendu ;
- correctif `c9b96d9766f6892dec2026ce6744540cde2b3570` ;
- test `tests/unit/status-info-card-v1.test.mjs` (buff, debuff, zéro, pause, stack, nom et source).
Seuls le projecteur HUD, son test, ce rapport et `LAB_CURRENT_WORK` changent ; le Core Combat, les compétences auteur, l'éditeur et tous les sprites sont protégés.

## Publication
GREEN technique seulement après CI complète sur SHA documentaire final, checkpoint final et publication Pages fast-forward lease avec contrôle CI+Pages ; validation Android distincte.
