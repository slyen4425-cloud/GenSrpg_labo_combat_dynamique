# Editor disclosure / Landscape stage V2

Date : 2026-10-06

## Base

Base exacte :

`79d180e9e6b5e9c1f8fe821efe2dd7c0fb2c30ff`

Checkpoint de départ :

`checkpoint/lab-start-editor-disclosure-landscape-v2-2026-10-06`

Branche :

`work/lab-editor-disclosure-landscape-v2-2026-10-06`

## Retour réel

Le premier essai smartphone a montré deux régressions UX :

1. les contrôles Fermer / Dérouler ajoutés en V1 n'étaient pas visibles / exploitables dans l'éditeur mobile ;
2. le plein écran paysage produisait une scène anormalement large : fond d'arène 16:9 centré, acteurs/HUD calculés sur un shell beaucoup plus large, créatures perçues plus grosses et HUD surdimensionné.

Le screenshot utilisateur fourni mesurait 1536 × 684, soit un ratio d'environ 2.25:1, sensiblement plus large que l'arène 16:9.

## Cause disclosure

V1 ajoutait dynamiquement un bouton à droite dans un header `display:flex`.

Sur faible largeur :
- le texte du titre pouvait conserver sa largeur minimale ;
- le bouton pouvait être repoussé hors de la zone utile ;
- l'affordance n'était donc pas fiable sur smartphone.

## Correction disclosure V2

Le petit bouton latéral est supprimé.

Le `.card-title` existant devient lui-même l'unique contrôle :

- `role="button"` ;
- `tabIndex = 0` ;
- clic sur tout le header ;
- clavier Enter / Espace ;
- `aria-expanded` ;
- chevron et libellé visibles via CSS :
  - `▾ Fermer` ;
  - `▸ Dérouler`.

Le header utilise désormais une grille :

`auto | minmax(0, 1fr) | auto`

La colonne droite est donc toujours réservée au contrôle, même sur faible largeur.

Aucun champ enfant ne change son attribut `hidden` : le repli reste purement visuel au niveau de la carte.

## Cause paysage

Le shell plein écran V1 prenait toute la taille du viewport.

Sur un écran ultra-large :
- l'arène DOM prenait toute cette largeur ;
- le fond 16:9 restait contenu / centré ;
- positions et tailles en pourcentage continuaient à dépendre du conteneur étiré ;
- le padding haut du bouton Retour réduisait encore la hauteur disponible.

Cela créait deux référentiels visuels différents dans la même preview.

## Correction paysage V2

Le fullscreen reste demandé via le propriétaire déjà éprouvé `document.documentElement`.

La correction est appliquée uniquement à la composition de preview.

Quand `data-landscape-required="true"` :

- le host centre la scène ;
- `.game` utilise un canvas maximum 16:9 :
  - largeur `min(100%, 177.7778dvh)` ;
  - `aspect-ratio: 16 / 9` ;
  - `padding: 0` ;
- `.arena` est exactement 16:9 ;
- les bandes éventuelles restent à l'extérieur de la scène, pas à l'intérieur du terrain ;
- le bouton Retour devient un petit overlay ;
- les combattants utilisent une largeur pilotée par `dvh` afin que l'orientation ultra-large ne les agrandisse pas simplement parce que la largeur du viewport augmente ;
- les données `displayScale` des créatures restent intactes ;
- les cartes PV, la barre de capacités et le command stack reçoivent une variante paysage compacte.

## Fullscreen

La V2 a brièvement testé `previewShell` comme cible du Fullscreen API, puis ce changement a été retiré avant checkpoint.

Raison : au clic `Tester en combat`, le shell preview est encore masqué pendant la validation / préparation asynchrone. Demander le fullscreen directement sur cet élément aurait pu faire refuser l'API sur certains navigateurs.

La cible visible `document.documentElement`, déjà démontrée sur le smartphone utilisateur, est donc conservée.

Le bug traité était un bug de ratio de scène, pas de propriétaire fullscreen.

## TDD

### RED

Commit :

`985904859f70e24c314bc619ac7763fcc63a44e0`

CI :

`37427605829`

Résultat :

- 1109 tests ;
- 1104 PASS ;
- 5 FAIL attendus ;
- les cinq échecs correspondent aux nouvelles exigences V2.

### GREEN

HEAD fonctionnel avant cette documentation :

`3ecf9b6063a8905a0d54a43aa7f109f11dd6b314`

CI :

`37427986322`

Résultat :

- 1109 tests ;
- 1109 PASS ;
- 0 FAIL.

## Fichiers fonctionnels modifiés

- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.css`

Tests :

- `tests/unit/capture-editor-disclosure-landscape-v2.test.mjs`
- adaptation d'une sentinelle V1 pour accepter le nouveau owner header.

Aucun changement net de `capture-editor-v2.js` par rapport à la base : le propriétaire fullscreen final reste celui déjà validé.

## Domaines non touchés

- Combat Runtime ;
- Combat Session ;
- règles ;
- FX renderer ;
- Actor renderer ;
- données des créatures ;
- displayScale ;
- positions créatures ;
- Cendre aveuglante ;
- sockets ;
- collisions ;
- dégâts.

## Validation smartphone demandée

### Éditeur

1. ouvrir chacun des trois onglets ;
2. vérifier que chaque bloc affiche immédiatement `▾ Fermer` à droite ;
3. toucher n'importe où sur le titre du bloc ;
4. vérifier qu'il devient `▸ Dérouler` ;
5. rouvrir et confirmer que les valeurs sont intactes.

### Combat paysage

1. garder `Combat plein écran paysage` activé ;
2. lancer le combat puis tourner le téléphone ;
3. vérifier que l'image d'arène remplit exactement une scène 16:9 sans être tronquée ;
4. vérifier que les bandes éventuelles sont uniquement hors de la scène sur un écran très large ;
5. vérifier que les créatures n'ont plus l'impression de changer brutalement de scale ;
6. vérifier que les cartes PV et la barre des cinq capacités occupent nettement moins de place ;
7. confirmer que Retour éditeur reste accessible.

Ce lot reste GREEN technique jusqu'à validation visuelle utilisateur.
