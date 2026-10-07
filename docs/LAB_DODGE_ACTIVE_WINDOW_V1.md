# Dodge Active Window V1

Date : 2026-10-07

## Base

Base exacte :

`7689416cfe3ca803946f112c3be8c652de2f3124`

Checkpoint de départ :

`checkpoint/lab-start-dodge-active-window-v1-2026-10-07`

Branche :

`work/lab-dodge-active-window-v1-2026-10-07`

Cette base contient déjà le micro-lot HUD Dodge Position V2 validé techniquement :
- bouton Esquive hors du cadre Capacités ;
- placé juste à gauche du bloc Capacités en paysage ;
- légèrement agrandi par rapport à V1 ;
- grille des cinq capacités toujours pleine largeur.

## Décision produit

Esquive devient une action proactive configurable.

Valeurs par défaut pour les nouvelles configurations :
- recharge d'une charge : 30 000 ms (30 s) ;
- durée active : 500 ms (0,5 s).

Les deux valeurs restent configurables dans Options de jeu.

Sémantique :
1. le joueur appuie sur Esquive ;
2. une charge est consommée immédiatement ;
3. la fenêtre active dure `activeWindowMs` ;
4. tout impact esquivable dont le temps de résolution tombe dans la fenêtre utilise la réaction Esquive existante ;
5. une attaque `dodgeable:false` traverse la fenêtre ;
6. la fenêtre peut éviter plusieurs impacts esquivables tant qu'ils tombent dans les mêmes 0,5 s ;
7. la recharge de la charge démarre au même timestamp d'activation.

## Autorités

Aucune seconde horloge ni second moteur d'Esquive.

- configuration : `CaptureGameOptionsV1` ;
- charge + timestamp d'activation : `Rechargeable Action V1` existant ;
- horloge : `CombatState.elapsedMs` ;
- orchestration des actions entrantes : `CombatRuntime` existant ;
- validation réelle d'une réaction contre une attaque : `resolveReaction` via `CombatSession.previewReaction` ;
- UI : déclenchement et projection uniquement.

La fenêtre active est dérivée de `spentAtMs`, déjà écrit lors de la consommation d'une charge.

## Compatibilité

- export historique sans `gameOptions` : inchangé, Esquive globale absente/désactivée ;
- ancien objet explicite `gameOptions.dodge` sans `activeWindowMs` : sa forme sérialisée reste inchangée ;
- sa sémantique reçoit le défaut de 500 ms via `captureDodgeActiveWindowMsV1` ;
- anciens appels réactifs `previewRechargeableReaction` / `reactWithRechargeableAction` conservés.

## TDD RED

Commits RED :
- Core : `1977b8a2c93a3623d5748b9553ccdb1649c931ed`
- Runtime : `beafcd3ccd1d349e5e246be5c7118ddb09365997`
- UI : `1b86e4c828bc1cb230e1352dfcf59952cf2d7aea`
- compatibilité legacy raffinée : `8ca6758c6d12437676de1a2f5b8a24943c657b82`

CI RED :

`37587807955`

Résultat :
- 1203 tests ;
- 1196 PASS ;
- 7 FAIL ciblés ;
- échecs uniquement sur les nouvelles attentes :
  - activation proactive ;
  - fenêtre avant 500 ms ;
  - expiration à 500 ms ;
  - non-esquivable ;
  - defaults Human Editor ;
  - export activeWindow ;
  - raccord UI Runtime.

## GREEN technique

HEAD fonctionnel avant documentation :

`47227cfb1aa6b7514c61d37ee55f01fa63ceed21`

CI :

`37588239528`

Résultat :
- 1205 / 1205 PASS ;
- 0 FAIL.

Sentinelles spécifiques :
- impact à 300 ms pendant fenêtre 500 ms : `evaded` PASS ;
- fenêtre expirée exactement à 500 ms : attaque `hit` PASS ;
- `dodgeable:false` pendant fenêtre : `hit` PASS ;
- defaults 30 s / 0,5 s : PASS ;
- ancien dodge sans `activeWindowMs` conserve sa forme : PASS ;
- Human Editor exporte 500 ms : PASS ;
- UI appelle `activateRechargeableReaction` et n'ajoute aucun timer : PASS ;
- anciennes sentinelles générales : PASS.

## Fichiers fonctionnels modifiés

- `src/contracts/capture-game-options-v1.js`
- `src/core/combat/rechargeable-action-v1.js`
- `src/core/combat/combat-session.js`
- `src/core/combat/combat-runtime.js`
- `src/ui/combat-2v2-test-ui.js`
- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.html`

Tests :
- `tests/unit/capture-game-dodge-window-v1.test.mjs`
- `tests/integration/game-dodge-active-window-v1.test.mjs`
- `tests/unit/capture-game-dodge-window-ui-v1.test.mjs`
- sentinelle UI historique ajustée : `tests/unit/capture-game-dodge-ui-v1.test.mjs`

## Protégé / inchangé

- Damage / Status ;
- projectile et collision ;
- géométrie visible ;
- SkillDefinition cooldown ;
- Persistent Zone ;
- Roster ;
- FX / SkillPresentationBinding V9 ;
- scales / offsets auteur ;
- données Showcase ;
- `main` ;
- dépôt GenSrpG principal.

## Validation utilisateur

Sur smartphone paysage :
1. vérifier que le bouton est légèrement plus gros que la preview précédente ;
2. vérifier qu'il est juste à gauche du bloc Capacités, sans entrer dans son cadre ;
3. vérifier que les cinq icônes de capacités restent à leur taille restaurée ;
4. dans Options de jeu, confirmer Recharge = 30 s et Durée active = 0,5 s ;
5. lancer le combat puis appuyer sur Esquive même lorsqu'aucune attaque n'est déjà en cours ;
6. constater `Active 0.5 s` puis la recharge ;
7. essayer d'activer Esquive juste avant l'impact d'une attaque esquivable ;
8. vérifier qu'une attaque hors fenêtre touche normalement ;
9. si disponible, vérifier qu'une capacité marquée non esquivable touche même pendant la fenêtre ;
10. tester 1v1 puis 2v2.

Statut : GREEN technique uniquement jusqu'à validation utilisateur.
