# Editor disclosure / Combat landscape preview V1

Date : 2026-10-06

## Base

Base exacte :

`48e9adb56be7760eccddf141fd5a56bcd017e7e7`

Checkpoint de départ :

`checkpoint/lab-start-editor-disclosure-landscape-v1-2026-10-06`

Branche :

`work/lab-editor-disclosure-landscape-v1-2026-10-06`

## Retour utilisateur traité

Ce lot traite uniquement l'ergonomie de l'éditeur et l'essai du mode combat paysage :

1. blocs de l'éditeur refermables / déroulables ;
2. réglages avancés de sprites rendus beaucoup plus visibles ;
3. option provisoire de combat plein écran paysage.

Le retour séparé sur la position des FX côté joueur n'est volontairement pas corrigé ici. L'audit a confirmé que le renderer FX est commun aux deux camps et que les points d'ancrage sont pilotés par les données de vue de la créature. Ce correctif doit donc rester un lot séparé afin de ne pas toucher au renderer validé côté ennemi.

## Blocs repliables

Owner :

`mountEditorCardDisclosuresV1` dans `src/ui/capture-editor-human-v2.js`.

Le montage parcourt les cartes existantes de l'éditeur et ajoute une seule commande :

- `Fermer` lorsque le bloc est ouvert ;
- `Dérouler` lorsqu'il est fermé.

L'état de repli est porté uniquement par :

`card.dataset.collapsed`

Le CSS masque les enfants visuellement lorsque la carte est repliée.

Important : aucun contrôle enfant ne voit sa propriété `hidden` modifiée par ce système. Les états métier existants — par exemple les conditions d'activation internes — restent donc possédés par leurs owners actuels et ne sont pas réécrits par l'ergonomie.

Les boutons utilisent une hauteur tactile minimale de 44 px et exposent `aria-expanded`.

## Réglages sprites / FX avancés

Le `details[data-skill-fx-advanced]` existant est conservé.

Aucun nouveau panneau et aucun second formulaire ne sont créés.

Son résumé devient volontairement plus visible :

`Personnaliser les sprites, taille, placement et audio`

Sous-titre :

`Cast · Projectile · Impact · Zone · Statut`

Le bloc possède désormais :

- bordure renforcée ;
- fond distinct ;
- summary de 56 px minimum ;
- texte plus lisible ;
- état ouvert clairement séparé.

## Mode combat plein écran paysage

Nouveau petit owner UI :

`src/ui/capture-preview-display-mode-v1.js`

Il ne connaît ni le Runtime, ni la Session, ni les règles de combat.

Réglage UI :

`Combat plein écran paysage — Test provisoire`

Le réglage est activé par défaut pour faciliter l'essai demandé, mais il est désactivable.

### Entrée

Depuis le clic utilisateur sur `Tester en combat` :

1. l'owner active le besoin paysage ;
2. il tente `requestFullscreen()` ;
3. il tente `screen.orientation.lock("landscape")` ;
4. la Preview Session existante continue ensuite son lancement normal.

La demande de fullscreen est démarrée sur le chemin direct du geste utilisateur, avant les attentes asynchrones de la preview.

### Fallback

Si le navigateur refuse ou ne fournit pas le fullscreen / verrouillage d'orientation, l'échec n'est pas transformé en erreur de combat.

Le shell reste marqué :

`data-landscape-required="true"`

En orientation portrait, le CSS affiche alors un gate :

`Tourne ton téléphone`

La preview de combat reste cachée derrière le gate jusqu'au paysage.

Le bouton `Retour à l'éditeur` reste au-dessus du gate.

### Sortie

Au retour éditeur ou à la destruction de la page :

- unlock orientation uniquement si cet owner avait obtenu le lock ;
- sortie fullscreen uniquement si cet owner l'avait obtenu ;
- suppression de l'état paysage du shell / body.

Si la validation éditeur refuse le lancement, le display mode est également libéré immédiatement.

## TDD

Test dédié :

`tests/unit/capture-editor-disclosure-landscape-v1.test.mjs`

### RED

Commit :

`a4d6384c5efda55507b22f5770e794935ecc1d37`

CI :

`37425385372`

Résultat :

- 1102 tests ;
- 1097 PASS ;
- 5 FAIL attendus ;
- tous les échecs correspondaient aux nouvelles exigences UI.

### Régression historique détectée pendant l'intégration

Le premier câblage a fait échouer une seule sentinelle historique de retry preview, car son harness exécutait le handler de clic isolément sans injecter le nouvel owner d'affichage.

La sentinelle a été adaptée au nouveau propriétaire, et le handler conserve le comportement historique :

- validation refusée => bouton réactivé ;
- erreur adaptation => retour éditeur ;
- sortie preview => retry possible.

### GREEN fonctionnel

HEAD fonctionnel avant documentation :

`44da63e1cb32cf5c4fe102622d48ada130766381`

CI :

`37426013644`

Résultat :

- 1104 tests ;
- 1104 PASS ;
- 0 FAIL.

Les tests exercent aussi directement l'owner plein écran :

- succès fullscreen + lock paysage + release ;
- échec fullscreen / orientation => fallback rotation-gate sans exception.

## Fichiers fonctionnels modifiés

- `src/ui/capture-editor-human-v2.js`
- `src/ui/capture-preview-display-mode-v1.js`
- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.css`
- `examples/dom-demo/capture-editor-v2.js`
- `tests/unit/capture-editor-disclosure-landscape-v1.test.mjs`
- `tests/unit/capture-editor-combat-preview-ui-v1.test.mjs`

## Domaines protégés

Aucun changement dans :

- Combat Runtime ;
- Combat Session ;
- Combat Rules ;
- collisions ;
- dégâts ;
- FX Core ;
- renderer FX ;
- Asset Library ;
- presets créatures / capacités ;
- sockets.

## Validation utilisateur

À tester sur smartphone :

1. ouvrir les onglets Créature / Combat / Capacités ;
2. fermer puis rouvrir plusieurs blocs, notamment Import / Export, Conditions d'activation et Effets tactiques ;
3. vérifier qu'aucune valeur n'est perdue ;
4. vérifier que `Personnaliser les sprites...` est immédiatement repérable ;
5. garder `Combat plein écran paysage` coché et lancer le combat en portrait ;
6. vérifier le gate `Tourne ton téléphone`, puis tourner l'appareil ;
7. vérifier que le combat utilise toute la largeur disponible ;
8. utiliser `Retour à l'éditeur` et vérifier la sortie propre ;
9. décocher le réglage et vérifier que le comportement de preview classique reste disponible.
