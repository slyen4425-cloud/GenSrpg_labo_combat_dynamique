# Point de reprise courant — 2026-10-08

## Lot techniquement GREEN

Dodge Appearance Visibility V1

Branche :
`work/lab-dodge-appearance-visibility-v1-2026-10-08`

Checkpoint de départ :
`checkpoint/lab-start-dodge-appearance-visibility-v1-2026-10-08`

Base :
`03a6296f2a7aa88d70452983e10ec1415259dfef`

## Résultat

Le réglage visuel d'Esquive est maintenant immédiatement visible dans `Apparence` :

- carte Apparence ouverte par défaut ;
- sous-section dédiée `Esquive — effet visuel` ;
- placée avant Face / Dos / Icône ;
- asset ;
- taille ;
- décalage X ;
- décalage Y ;
- import personnel `Esquive / disparition` conservé.

## TDD

RED :
- `5d01714b716809625005f8a0cf35ce70ab5a4357`
- CI `37725122963`
- 1257 / 1259 PASS.

GREEN :
- HTML `56a71a040fa6b854d0e581a74d365112d0d86432`
- CSS `18723744b6d7fa35b82eb7022fdd0e4a1e20fc82`
- CI `37725232125`
- 1259 / 1259 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_DODGE_APPEARANCE_VISIBILITY_V1.md`

## Inclus depuis la base précédente

- bibliothèque de créatures : 103 actives, bootstrap navigateur isolé du runtime preview ;
- Dodge Appearance FX V1 : vraie chaîne Editor -> Export -> Native Visual Source -> Visual Controller -> DOM Dodge FX ;
- Boule de feu : puissance 2, cast joueur +30 / opposant -30 ;
- Cendre aveuglante : puissance 1 ;
- Goutte vive : puissance 2.

## Domaines protégés

Inchangés :
- Creature Presentation V3 ;
- DOM Dodge FX renderer ;
- Combat Runtime / Rules ;
- charges / recharge / fenêtre active ;
- configuredCreatures ;
- données créatures ;
- Projectile Clash ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action protocolaire

- CI documentaire finale ;
- checkpoint `checkpoint/lab-dodge-appearance-visibility-v1-green-2026-10-08` ;
- preview `preview/lab-dodge-appearance-visibility-v1-2026-10-08` ;
- validation smartphone utilisateur.
