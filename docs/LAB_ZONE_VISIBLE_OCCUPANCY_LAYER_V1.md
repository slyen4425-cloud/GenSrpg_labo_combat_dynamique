# Tempête de flammes — Occupation visible + calque attaque V1

Date : 2026-10-06

## Base

Base exacte :

`33834f5d41d2e0315be265fd76a59da221e2b18f`

Checkpoint de départ :

`checkpoint/lab-start-zone-visible-occupancy-layer-v1-2026-10-06`

Branche :

`work/lab-zone-visible-occupancy-layer-v1-2026-10-06`

## Retours traités

1. Après activation adverse de Tempête de flammes puis une attaque, le modèle pouvait visuellement disparaître.
2. Une cible visuellement couverte par la zone pouvait parfois ne pas recevoir les ticks attendus.
3. Le produit doit conserver le principe déjà validé : l’emprise visuelle réelle de la zone et le scale des créatures peuvent influencer l’occupation.

## Cause 1 — disparition visuelle

La zone persistante de Tempête est configurée derrière les modèles.

Avant correction :

- persistent-zone behind : `z-index: 2` ;
- fighter en approche `behind` : `z-index: 2`.

Comme la zone persistante est ajoutée dans l’arène après les fighters, une égalité de stacking permettait à la zone de repeindre au-dessus du modèle lors d’une attaque placée derrière.

Ce n’était pas une suppression Runtime de la créature.

### Correction

Uniquement :

`.skill-fx--persistent-zone.skill-fx--layer-behind`

passe de :

`z-index: 2`

à :

`z-index: 1`.

Le fighter le plus bas reste donc toujours au-dessus.

Le `skill-fx--layer-behind` générique n’est pas modifié.

## Cause 2 — occupation visuelle incohérente

Le système précédent avait déjà supprimé la dépendance à une attaque pour “rafraîchir” une zone :

Combat Runtime demandait à chaque tick un échantillon spatial au renderer.

Cependant cet échantillon mélangeait encore deux géométries :

- zone : vrai rectangle rendu de la zone ;
- acteur : rectangle logique de `fighter__motion`.

Depuis le lot précédent, Visual Controller possède déjà la géométrie opaque réelle des créatures via le collision model, utilisée pour le ciblage projectile.

La zone n’en profitait pas encore.

### Correction

`sampleZoneSpatialContext` réutilise désormais le callback existant :

`targetAnchorFor(actorId)`

pour les bounds des acteurs.

Dans les clients natifs 1v1 / 2v2, ce callback pointe déjà sur :

`visuals.getVisibleTargetRectFor(actorId)`

qui dérive de la géométrie opaque du collision model.

Donc le même owner couvre désormais :

- cible projectile ;
- collision ;
- occupation d’une zone persistante.

Si la géométrie visible n’est pas encore disponible, le rectangle logique historique reste le fallback.

## Ce qui ne change pas

Aucun changement dans :

- Combat Runtime ;
- Combat Session ;
- Persistent Zone Runtime ;
- calcul de dégâts ;
- tick de 1000 ms ;
- dégâts Tempête = 5 par tick ;
- durée = 7000 ms ;
- renforcement short → medium → long ;
- données JSON de Tempête ;
- scale / X / Y du sprite de zone ;
- displayScale des créatures ;
- sockets ;
- projectile / trail / fumée / glow.

Le renderer continue uniquement à fournir une mesure. Le Runtime de zone reste seul propriétaire de l’appartenance et des dégâts.

## TDD

### RED

Commit test :

`8f01a2e0461c63a35958c44e662cd6a8aed3d95d`

CI :

`37433827449`

Résultat ciblé :

- échec : échantillon acteur utilisait encore le carré logique ;
- échec : reproduction idle visuellement couverte ;
- échec : persistent-zone behind et fighter-behind au même niveau ;
- fallback sans géométrie visible déjà PASS.

### GREEN

Implémentation :

- géométrie : `97b4b0625aacb87011816910c9200defcc507e12` ;
- calque : `fb47cf2a2bb9fd94be8115cc9a516d087e3a5f4f`.

Le dernier rouge intermédiaire venait uniquement d’une valeur de fixture de test `reactivation: keep`, non supportée par le contrat. La fixture utilise désormais le mode canonique `refresh` ; aucun code produit n’a été modifié pour ce point.

CI GREEN :

`37434040856`

Résultat :

- 1117 tests ;
- 1117 PASS ;
- 0 FAIL.

## Reproduction couverte

Le test d’intégration crée :

- une zone visuelle 100 × 100 ;
- une créature dont le carré logique est volontairement très loin de la zone ;
- la vraie silhouette visible de la créature à l’intérieur de la zone ;
- aucune attaque active.

Deux ticks Runtime consécutifs donnent :

- PV 100 → 95 → 90 ;
- `runtime.activeActions.length === 0`.

Cela protège explicitement contre le retour du symptôme “il faut attaquer pour que la zone fonctionne”.

## Validation smartphone demandée

1. laisser l’ennemi activer Tempête de flammes ;
2. attendre au moins deux ticks sans attaquer : les dégâts doivent être réguliers si le modèle est réellement dans la zone ;
3. laisser ensuite l’ennemi lancer une attaque : son modèle doit rester visible au-dessus des flammes ;
4. tester les trois renforcements short / medium / long ;
5. changer le scale de la créature : l’entrée/sortie doit rester cohérente avec la silhouette affichée ;
6. vérifier joueur → ennemi et ennemi → joueur.

État : GREEN technique uniquement jusqu’au retour smartphone.
