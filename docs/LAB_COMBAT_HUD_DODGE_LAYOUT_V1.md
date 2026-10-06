# Combat HUD Dodge Layout V1

Date : 2026-10-06

## Base

Base exacte :

`2c0e838a3ee0cb18f2b71db02ca5ba1866fb1ab5`

Checkpoint de départ :

`checkpoint/lab-start-combat-hud-dodge-layout-v1-2026-10-06`

Branche :

`work/lab-combat-hud-dodge-layout-v1-2026-10-06`

## Retour utilisateur

- bouton Esquive attendu dans l'espace libre entre Capacités et PV ;
- bouton environ 40 % plus petit ;
- icônes de capacités devenues trop petites pendant le combat.

## Cause réelle

La règle de taille des icônes n'avait pas changé.

Le lot Game Options / Dodge avait placé Esquive dans `.combat-primary-actions` avec :

`grid-template-columns: minmax(0, 1fr) auto`

La seconde colonne réservée à Esquive réduisait la largeur restante pour la grille des cinq capacités. Leur taille perçue avait donc diminué sans modification explicite de leur scale.

## Correction

Présentation uniquement :

- Esquive a été sortie de la grille des capacités ;
- `data-combat-dodge` et le raccord Runtime sont inchangés ;
- le bouton vit désormais directement dans l'arène avec la classe `combat-dodge-action--arena` ;
- il est centré horizontalement dans l'espace libre inférieur entre le bloc PV joueur et le bloc Capacités ;
- sa largeur paysage passe de `clamp(4.5rem, 11vw, 6.4rem)` à `clamp(2.7rem, 6.6vw, 3.85rem)`, soit environ 60 % de l'empreinte précédente ;
- la grille des capacités récupère 100 % de la largeur de son bloc ;
- la règle d'icône `clamp(1.45rem, 5.5dvh, 2rem)` reste strictement inchangée.

## TDD RED

HEAD :

`65f7afff95d6063556dc4d39b8d650582c71988b`

CI :

`37529067656`

Résultat :

- 1195 tests ;
- 1193 PASS ;
- 2 FAIL ciblés ;
- aucune autre régression.

Les deux FAIL imposaient :
1. un slot arène dédié pour Esquive ;
2. suppression de la colonne Esquive dans la grille Capacités + réduction d'environ 40 %.

## GREEN technique

HEAD fonctionnel :

`c9fb935305d8554c2e671efedf35bb4172cfcf41`

CI :

`37529214623`

Résultat :

- 1195 / 1195 PASS ;
- 0 FAIL.

## Fichiers fonctionnels modifiés

- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.css`

Test ajouté :

- `tests/unit/capture-combat-hud-dodge-layout-v1.test.mjs`

## Protégé / inchangé

- Combat Runtime ;
- Combat Session ;
- Rechargeable Action ;
- Capture Game Options ;
- Action Resolver ;
- Damage / Status ;
- collision / projectile ;
- SkillPresentationBinding V9 ;
- renderer FX ;
- données auteur et scale des icônes ;
- placement des combattants.

## Validation utilisateur

À vérifier en smartphone paysage :

1. les cinq capacités ont retrouvé leur taille visuelle précédente ;
2. Esquive est entre le bloc PV joueur et le bloc Capacités ;
3. Esquive est nettement plus compacte (~40 % de réduction) ;
4. le bouton reste lisible avec charges / recharge ;
5. 1v1 puis 2v2 : aucune superposition avec PV, capacités ou créatures ;
6. si possible, déclencher une vraie Esquive pour valider le comportement déjà raccordé au Runtime.

Le lot est GREEN technique uniquement jusqu'à validation visuelle utilisateur.
