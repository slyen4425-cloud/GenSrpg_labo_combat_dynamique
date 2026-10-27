# Creature Dodge Appearance FX V1

Date : 2026-10-07

## Besoin

Permettre d'associer un sprite/FX optionnel à l'Esquive, mais comme propriété d'apparence de la créature.

Exemples d'intention :
- créature Foudre : éclair ;
- créature Terre / Nature : feuilles ou poussière ;
- autre créature : fumée, flash, effet personnalisé.

Le moteur ne déduit jamais cet effet automatiquement de l'élément.

## Base

Base exacte :
`f1ef3c934e6065cfdef0e515a8bc19fa06f1c235`

Checkpoint de départ :
`checkpoint/lab-start-creature-dodge-appearance-fx-v1-2026-10-07`

Branche :
`work/lab-creature-dodge-appearance-fx-v1-2026-10-07`

## Architecture

Le gameplay existant reste inchangé :

`HUD Dodge -> Combat Runtime -> activeWindowMs -> Visual Event dodge`

Le nouveau chemin visuel est :

`Creature Presentation -> Combat Export -> Native Visual Source -> Visual Controller -> DOM Dodge FX`

Le Runtime reste l'unique propriétaire :
- de l'activation ;
- des charges ;
- de la recharge ;
- de la fenêtre active ;
- du résultat d'esquive.

Aucun timer gameplay supplémentaire n'a été créé.

## Creature Presentation V3

Nouvelle version indépendante de la présentation créature :

`CreaturePresentationBinding V3`

Ajout optionnel :

```json
"visual": {
  "dodge": {
    "assetId": "…",
    "displayScale": 1,
    "offsetX": 0,
    "offsetY": 0
  }
}
```

Compatibilité :
- V1 et V2 restent supportés ;
- une créature sans Dodge FX reste V2 ;
- aucune migration silencieuse ;
- V3 n'est utilisé que si l'auteur choisit effectivement un effet.

## Éditeur Apparence

Ajouts dans la carte Apparence :
- Effet visuel d'esquive ;
- Taille de l'effet ;
- Décalage X ;
- Décalage Y.

Le choix lit la même bibliothèque visuelle existante.

L'import personnel accepte désormais :
`Esquive / disparition`

Un PNG/WebP/JPEG importé avec ce rôle est ajouté à `Mes assets` et peut être sélectionné comme effet d'Esquive.

## Rendu

Nouveau propriétaire visuel :
`src/adapters/renderer/dom-creature-dodge-fx-v1.js`

Il :
- centre l'effet sur la géométrie réelle de la créature ;
- applique scale et offsets auteur ;
- réutilise le support sprite / sprite-strip existant ;
- étire le playback sur la durée réelle de la fenêtre d'Esquive fournie par le Runtime ;
- se nettoie à la fin ou à l'annulation ;
- n'utilise aucun `setTimeout` d'Esquive.

La disparition générique existante de la créature et de son ombre reste pilotée par l'Animation Core.

## TDD

RED :
- commit `35b0c1f2fcd6ddfd66463e8dc0354a5555fad7c0`
- CI `37683689539`
- 1252 tests
- 1248 PASS
- 4 FAIL ciblés :
  - contrôles éditeur / rôle import absents ;
  - Creature Presentation sans Dodge FX ;
  - Native Visual Source sans Dodge FX ;
  - Visual Controller sans raccord Dodge FX.

GREEN fonctionnel :
- commit `fc04b5adf465107661a611b54718750585f0cfdc`
- CI `37684672450`
- 1252 / 1252 PASS.

Sentinelles renderer / compatibilité :
- `c9bc40a3db5d9b0113b42f4a90f50114d42bb787`
- CI `37684809806`
- 1254 / 1254 PASS.

Vraie chaîne Editor -> Combat Export -> Native Visual Source :
- `ec4302bcf09f9ea799caf60c160403530c5759b1`
- CI `37684989902`
- 1255 / 1255 PASS.

GREEN final avant documentation :
- `70f9de2e36e7127389abfa88fd847c7023b1ff2a`
- CI `37685167740`
- 1255 / 1255 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Domaines protégés

Inchangés :
- Combat Runtime ;
- Game Options Dodge ;
- charges / recharge / activeWindowMs ;
- Combat Rules ;
- Skill Contract ;
- dégâts / collision ;
- Projectile Clash ;
- Roster ownership ;
- Boule de feu ;
- Goutte vive ;
- Cendre aveuglante ;
- audio ;
- main ;
- Zombicide-40k ;
- Exploration.

## Validation utilisateur

À vérifier dans la preview smartphone :

1. ouvrir une créature ;
2. Apparence -> Effet visuel d'esquive ;
3. choisir un asset existant ou importer une image avec le rôle `Esquive / disparition` ;
4. régler taille / X / Y ;
5. mettre à jour la créature ;
6. Tester en combat ;
7. utiliser Esquive ;
8. vérifier que la créature + ombre disparaissent comme avant et que le nouvel FX apparaît au même moment ;
9. vérifier qu'une créature sans effet conserve le comportement historique.
