# Blocs fermés / Cible projectile visuelle V1

Date : 2026-10-06

## Base

Base exacte :

`0c2a0b6b6594f2603a5475a8181241f1fba7fa4e`

Checkpoint de départ :

`checkpoint/lab-start-collapsed-target-geometry-v1-2026-10-06`

Branche :

`work/lab-collapsed-target-geometry-v1-2026-10-06`

## Retour utilisateur

1. Tous les blocs de l'éditeur doivent être fermés à l'ouverture.
2. Le projectile joueur -> ennemi vise trop haut après le changement de scale/layout.
3. La cible doit suivre automatiquement la taille réellement visible du sprite.

## Diagnostic

### Éditeur

`mountEditorCardDisclosuresV1` initialisait encore une carte sans état explicite à :

`data-collapsed = "false"`

### Projectile

Le départ du projectile était déjà correct :

`SkillPresentationBinding.travel.anchor`
→ socket de la créature
→ `visuals.getFxAnchorFor(...)`.

La collision était également correcte et utilisait déjà le modèle visuel réel :

`createDomVisibleModelCollisionModel`

avec :
- dimensions naturelles de l'image ;
- `object-fit: contain` ;
- masque alpha opaque ;
- transform / scale DOM courant.

Mais la destination de la trajectoire utilisait encore :

`targetAnchors = fighterContainers`

puis le centre du rectangle du slot logique.

Après changement de layout ou de taille de fighter, ce centre logique pouvait diverger du centre de la silhouette réellement visible.

## Correction éditeur

Une carte repliable sans état préalable démarre maintenant avec :

`data-collapsed = "true"`

Si un état explicite true/false existe déjà au remontage, il reste conservé.

Le système Fermer / Dérouler V2 est inchangé.

## Correction géométrie projectile

### Owner unique

`dom-visible-model-contact.js` reste le propriétaire de la géométrie visible.

Une fonction :

`visibleModelOpaqueRect(frame)`

dérive le rectangle écran uniquement depuis :
- le masque opaque déjà utilisé par la collision ;
- les axes écran déjà calculés par le collision model.

Les marges transparentes du PNG ne participent donc plus au centre cible.

Le calcul suit automatiquement :
- scale ;
- translation ;
- rotation ;
- ratio naturel ;
- object-fit ;
- changement de taille du fighter.

Aucun offset fixe n'est introduit.

### Visual Controller

`demo-app.js` expose :

`getVisibleTargetRectFor(slotKey)`

en utilisant le snapshot du même collision model.

### Renderer FX

`dom-skill-fx.js` accepte désormais un callback optionnel :

`targetAnchorFor(slot)`

Pour la trajectoire projectile :
1. si la géométrie visible est disponible, son rectangle opaque est utilisé ;
2. sinon le `targetAnchors` historique reste le fallback.

Le renderer ne reconstruit pas une silhouette lui-même.

### Raccords

Les deux clients :
- duel 1v1 ;
- combat 2v2 / preview Capture ;

utilisent le même :

`visuals.getVisibleTargetRectFor(slotId)`.

## TDD

### RED

CI :

`37430820839`

Résultat observé :
- cartes encore ouvertes par défaut ;
- renderer ignorant encore `targetAnchorFor` ;
- export `visibleModelOpaqueRect` absent.

### GREEN fonctionnel

CI :

`37431194786`

Résultat :

- 1113 tests ;
- 1113 PASS ;
- 0 FAIL.

Tests ajoutés :
- rectangle opaque exclut les marges transparentes ;
- rectangle opaque suit le scale du frame visuel ;
- projectile préfère la géométrie visible au slot logique ;
- 1v1 et 2v2 consomment le même owner ;
- toutes les cartes démarrent fermées.

## Fichiers fonctionnels modifiés

- `src/ui/capture-editor-human-v2.js`
- `src/adapters/renderer/dom-visible-model-contact.js`
- `src/ui/demo-app.js`
- `src/adapters/renderer/dom-skill-fx.js`
- `src/ui/combat-test-ui.js`
- `src/ui/combat-2v2-test-ui.js`

## Protégé

Aucun changement dans :
- Combat Runtime ;
- Combat Session ;
- dégâts ;
- règles de collision sémantique ;
- données de scale ;
- sockets ;
- Cendre aveuglante ;
- layout paysage 16:9 ;
- trail / smoke / glow.

## Validation smartphone

1. ouvrir l'application : tous les blocs doivent être fermés ;
2. dérouler quelques blocs et vérifier que les valeurs sont intactes ;
3. lancer le combat en paysage ;
4. tirer un projectile joueur -> ennemi ;
5. vérifier que la trajectoire vise le centre visuel réel du monstre, même avec les scales actuels ;
6. vérifier aussi ennemi -> joueur afin de détecter toute régression symétrique.
