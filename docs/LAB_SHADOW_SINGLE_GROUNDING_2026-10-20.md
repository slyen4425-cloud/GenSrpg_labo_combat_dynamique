# Ombre au sol — autorité unique, 20 octobre 2026

## Cause démontrée
Au changement de créature, `setCreature` lançait le chargement de sprite avant de reconstruire l'Actor. Selon si l'image était en cache, `markReady` pouvait calculer et appliquer une géométrie alors qu'un ancien acteur était encore actif, puis `rebuildActor` réécrivait la position d'ombre avec `profile.shadow.bottomPct`. Sur chargement asynchrone, l'ordre inverse donnait un rendu différent. C'était une concurrence réelle de deux writers.

## Propriété finale
- `AnimationPlan.ground -> DomActorRenderer` reste seul propriétaire du déplacement/scale temporel du noeud d'ombre.
- `groundShadowLayoutFromOpaqueMaskV2(mask,profileShadow)` est l'unique calculateur de ses largeur/hauteur/position verticale/alpha statiques.
- `createSlot.setCreature` crée toujours l'acteur **avant** `loadRuntimeAsset`; callback valide seulement token courant et unique événement accepté.
- `rebuildActor` n'écrit plus aucun `--creature-shadow-bottom` ou `--creature-shadow-opacity`.
- Ombre invisible pendant le chargement de la nouvelle image, afin de ne pas afficher la forme précédente sous la nouvelle créature ; visible après acquisition de la bonne empreinte. Aucun second rendu ni fallback caché.
- `profile.bottomPct` sert seulement de repli pour image entièrement transparente, pas de seconde position autoritaire en concurrence avec le masque.
- Inchangés : profils, FX, collisions, gameplay, timings, sprite, id des assets et règles de combat.

## Vérification
`tests/unit/combat-shadow-single-grounding-2026-10-20.test.mjs` contrôle le calcul pur, le profil fallback, la priorité du contact opaque et l'absence de double écriture avec ordre de chargement déterministe. CI complète + Pages, puis comparaison visuelle sur smartphone (idle/attaque/déplacement/rappel).
