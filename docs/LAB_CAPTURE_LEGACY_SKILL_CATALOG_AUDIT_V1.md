# Audit — catalogue historique des capacités Capture

Date : 2026-09-28

## Source autoritaire

Le catalogue a été extrait sans réinterprétation depuis l'état de production exact fourni par l'utilisateur :

- dépôt : `slyen4425-cloud/Zombicide-40k` ;
- commit : `49289784ee92a47fd51089815ca25954cdba4493` ;
- blob Git : `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- taille du fichier source : `8170062` octets ;
- propriétaire seed : `builtinMonsterCapture162` ;
- constante : `MC162_ABILITIES` ;
- résolution canonique historique des effets : `captureAbilityTruth144`.

Le laboratoire ne dépend pas de cette source à l'exécution. Le contenu utile a été copié comme donnée de migration autonome.

## Inventaire

- capacités importées : **173** ;
- IDs uniques : **173** ;
- catégories : `melee` 51, `spell` 46, `defense` 19, `control` 18, `stat` 12, `heal` 11, `ranged` 10, `utility` 6 ;
- éléments : `neutral` 73, `fire` 13, `water` 13, `earth` 13, `electric` 13, `air` 13, `light` 13, `shadow` 13, `poison` 9.

Effets présents dans la source :

- `damage` : 105
- `debuff` : 18
- `buff` : 14
- `heal` : 9
- `attribute` : 7
- `stat_mod` : 6
- `dot` : 5
- `area_damage` : 4
- `resistance_mod` : 3
- `hot` : 2
- `maxhp` : 2
- `regenhp` : 2
- `regenmana` : 2
- `life_steal` : 2
- `magic_damage` : 2
- `resistance` : 2
- `initiative` : 1
- `mana` : 1
- `defense` : 1
- `armor` : 1
- `crit` : 1
- `dodge` : 1
- `heal_all` : 1
- `double_strike` : 1

## Compatibilité avec le contrat natif actuel

Le contrat `SkillDefinition` du laboratoire sait actuellement porter notamment :

- dégâts simples ;
- soin simple ;
- interruption / stun ;
- réactions block / reflect / immunity / counter / evade ;
- coût énergie, timing, cooldown, distances, cibles et forme visuelle.

Le catalogue historique contient en plus des sémantiques non représentées par `SkillDefinition.effect` :

- buffs et debuffs temporaires ;
- DoT / HoT ;
- modificateurs de caractéristiques ;
- modificateurs de résistances ;
- dégâts de zone et multi-cibles ;
- vol de vie ;
- double frappe ;
- régénération PV / mana ;
- effets de résistance ;
- scaling par caractéristique ;
- statuts tels que bleed / poison ;
- effets passifs de progression / caractéristiques.

Caractérisation automatique prudente :

- **87** entrées ont un effet simple damage/heal sans sémantique étendue détectée ;
- **86** entrées nécessitent clairement une extension de contrat avant migration native.

Même les 87 candidates simples ne sont **pas** converties automatiquement : la source historique ne fournit pas toujours les champs natifs du laboratoire tels que `form`, `approachMode`, `energyCost`, `preparationMs`, `travelMs` et `recoveryMs`. Inventer ces valeurs violerait la source de vérité.

## Décision d'architecture

Le fichier :

`data/capture/skills/gensrpg-capture-legacy-skill-catalog.v1.json`

est une **source de migration**, pas un second moteur de combat et pas un catalogue `SkillDefinition` actif.

Chaîne cible :

```
catalogue historique Capture
        |
        v
migration explicite / tests
        |
        v
SkillDefinition natif enrichi
        |
        v
Combat Rules / Runtime
```

Interdits :

- importer ou exécuter `captureFix*` ;
- appeler le runtime de `Zombicide-40k` ;
- copier `captureAbilityTruth144` comme moteur parallèle ;
- jeter silencieusement les effets non supportés ;
- inventer des timings ou coûts pour rendre une capacité artificiellement compatible.

## Micro-lots nécessaires avant exposition complète dans l'éditeur

1. **Effect Contract multi-effets** : représentation d'une liste d'effets sémantiques.
2. **Buff / Debuff + stats** : propriétaire explicite des modificateurs temporaires.
3. **DoT / HoT / statuts** : tick et durée possédés par Combat Runtime.
4. **Ciblage étendu** : self / ally / enemy / all allies / all enemies / zone.
5. **Scaling** : coefficients Force / Agilité / Intelligence / Esprit, sans nombres magiques UI.
6. **Résistances et effets spéciaux** : resistance_mod, life_steal, double_strike, etc.
7. **Migration native** : seulement après ces contrats, conversion entrée par entrée avec tests de parité.
8. **Éditeur** : afficher les capacités migrées nativement, pas le catalogue brut historique.

## Conclusion

Les 173 capacités de GenSrpG sont désormais conservées dans le laboratoire sans perte d'information.

Le prochain travail n'est pas de les recopier une seconde fois, mais d'étendre proprement les contrats Combat du laboratoire afin que leurs effets deviennent réellement exécutables et éditables.
