# Tempête de flammes — configuration créateur restaurée pour QA

Date : 2026-10-06

## Base

Base exacte :

`19e342700d59c6749dd64c596bc9a9b7667ea10a`

Checkpoint de départ :

`checkpoint/lab-start-firestorm-user-config-v1-2026-10-06`

Branche :

`work/lab-firestorm-user-config-v1-2026-10-06`

## Demande

Sylvain a fourni un export `capture-skill-transfer-v1` de `cap_fire_atk_6` à replacer exactement pour ses tests du correctif d’occupation / calque de Tempête de flammes.

Le fichier fourni a été copié byte-for-byte comme contenu UTF-8 dans :

`data/capture/showcase/cap_fire_atk_6.capture-skill-transfer-v1.json`

Aucune migration, fusion de champs ou application de Starter Pack n’a été effectuée.

## Différence principale avec le preset précédent

Gameplay inchangé :
- persistent zone ;
- short → medium → long ;
- durée 7000 ms ;
- tick 1000 ms ;
- 5 dégâts ;
- reinforce ;
- 3 activations max.

Présentation restaurée depuis l’export utilisateur :
- presentation version 8 ;
- aura scale 1.2 ;
- scale X 2.5 ;
- scale Y 0.8 ;
- offset X 0 ;
- offset Y 0 ;
- layer player/opponent behind ;
- statusVisuals vide ;
- feedback utilisateur restauré (trail, impactBurst, aftermathSmoke, castBurst).

Le preset live précédent avait notamment :
- presentation version 2 ;
- aura scale 3.5 ;
- scale X 2.3 ;
- scale Y 1 ;
- offset Y -50 ;
- pas de bloc feedback dans ce fichier.

## Propriété

Ce lot ne modifie aucun moteur :
- Combat Runtime ;
- Persistent Zone Runtime ;
- renderer ;
- géométrie visible ;
- CSS ;
- dégâts.

Il restaure uniquement la configuration créateur demandée pour reproduire les tests sur la correction précédente.
