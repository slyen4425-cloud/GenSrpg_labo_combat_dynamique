# Dodge Appearance Visibility V1

Date : 2026-10-08

## Retour utilisateur

La bibliothèque de créatures était de nouveau disponible sur smartphone, mais le réglage visuel d'Esquive n'était pas identifiable dans Apparence.

## Diagnostic

Le contrôle existait déjà dans le HTML et le contrat Dodge FX fonctionnait, mais il était peu découvrable :
- carte Apparence repliée par défaut ;
- bloc placé sous les grandes previews Face / Dos / Icône ;
- aucune sous-section visuelle dédiée.

Le catalogue actif expose également des assets compatibles pour le rôle Dodge.

## Correction UI

Dans Apparence :
- carte ouverte par défaut ;
- sous-section dédiée : `Esquive — effet visuel` ;
- sous-section placée avant Face / Dos / Icône ;
- contrôles conservés :
  - asset ;
  - taille ;
  - décalage X ;
  - décalage Y ;
- rappel de l'import personnel `Esquive / disparition`.

Aucun changement de contrat, renderer ou gameplay.

## TDD

RED :
- `5d01714b716809625005f8a0cf35ce70ab5a4357`
- CI `37725122963`
- 1257 / 1259 PASS
- 2 FAIL ciblés visibilité.

GREEN :
- HTML `56a71a040fa6b854d0e581a74d365112d0d86432`
- CSS `18723744b6d7fa35b82eb7022fdd0e4a1e20fc82`
- CI `37725232125`
- 1259 / 1259 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Domaines protégés

Inchangés :
- Creature Presentation V3 ;
- DOM Dodge FX renderer ;
- Combat Runtime / Rules ;
- charges / recharge / fenêtre active ;
- configuredCreatures ;
- bootstrap bibliothèque ;
- données créatures ;
- Fireball / Goutte / Cendre ;
- main ;
- Zombicide-40k ;
- Exploration.
