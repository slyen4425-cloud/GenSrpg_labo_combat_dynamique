# Point de reprise courant — 2026-10-08

## Lot actif

Dodge Appearance Visibility V1

Branche :
`work/lab-dodge-appearance-visibility-v1-2026-10-08`

Checkpoint de départ :
`checkpoint/lab-start-dodge-appearance-visibility-v1-2026-10-08`

Base exacte :
`03a6296f2a7aa88d70452983e10ec1415259dfef`

Base GREEN précédente :
`checkpoint/lab-creature-library-browser-startup-regression-v1-green-2026-10-08`

## Retour utilisateur

La bibliothèque de créatures refonctionne sur smartphone, mais le réglage visuel d'Esquive n'est pas visible / identifiable dans Apparence.

## Diagnostic

Le contrôle existe techniquement dans le HTML actuel, mais il est :
- placé sous les grosses previews Face / Dos / Icône ;
- enfoui dans une carte Apparence repliée par défaut ;
- sans sous-section visuelle dédiée.

Le catalogue contient des assets compatibles ; le problème est donc la découvrabilité UI, pas l'absence de données ni du contrat Dodge FX.

## Objectif

Rendre le réglage immédiatement visible dans `Apparence` sans toucher au gameplay :

- carte Apparence ouverte par défaut ;
- sous-bloc explicite `Esquive — effet visuel` ;
- bloc placé avant Face / Dos / Icône ;
- conserver asset / taille / X / Y ;
- conserver import `Esquive / disparition`.

## Périmètre autorisé

- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.css`
- tests UI dédiés
- documentation

## Domaines protégés

Ne pas modifier :
- Creature Presentation V3 ;
- DOM Dodge FX renderer ;
- Combat Runtime / Rules ;
- charges / recharge / fenêtre active ;
- `configuredCreatures` ;
- bootstrap bibliothèque ;
- données créatures ;
- Fireball / Goutte / Cendre ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. RED : la carte Apparence doit être ouverte par défaut et le bloc Dodge identifié avant les previews ;
2. vérifier qu'au moins un asset GenSrpG est compatible avec le rôle Dodge ;
3. appliquer uniquement la correction de structure/visibilité ;
4. CI complète ;
5. checkpoint/preview GREEN ;
6. validation smartphone utilisateur.

## Critère de fin

Sur smartphone, ouvrir l'onglet Créature doit rendre le réglage d'Esquive évident dans Apparence sans changer aucune règle de combat.
