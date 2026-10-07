# Creator Audio Import V1

Date : 2026-10-07

## Base

Base exacte :
`5f9d2ae11ccd6b84098d625117de20261fb10997`

Checkpoint de départ :
`checkpoint/lab-start-creator-audio-import-v1-2026-10-07`

Branche :
`work/lab-creator-audio-import-v1-2026-10-07`

Cette base contient déjà :
- Dodge Active Window V1 ;
- Dodge HUD Height V3 ;
- Fireball Author Export V3.

## Objectif

Permettre à un créateur d'importer un son personnel depuis l'éditeur Capture et de l'utiliser via les mêmes bindings et le même Audio Adapter que les sons GenSrpG.

V1 reste volontairement un import de session.

Formats acceptés :
- MP3 ;
- WAV ;
- OGG.

## Architecture

Chaîne unique :

`fichier utilisateur -> Audio Source Manager -> Creator Audio Asset Session -> assetId user:* -> catalogue audio actif -> Skill/Creature Presentation Binding -> Audio Adapter existant`

Aucun second moteur audio n'a été créé.

### Asset Input

Nouveau propriétaire :
`src/assets/audio-source-manager-v1.js`

Responsabilités :
- validation MIME ;
- rejet des fichiers vides ;
- création d'une Object URL ;
- révocation de l'URL au clear/dispose.

### Session créateur

Nouveau module :
`src/assets/creator-audio-asset-session-v1.js`

Chaque import produit un AssetDefinition :
- `id / assetId = user:*` ;
- `assetType: sound` ;
- `mediaType: audio` ;
- `source.scope: user` ;
- rôle audio explicite ;
- URL runtime temporaire ;
- compatibilité combat / capture / editor.

La session possède toutes ses Object URLs et les révoque au teardown.

### Human Editor

Deux importeurs sont exposés :
- Sons de la créature ;
- Audio de la capacité.

Les sons utilisateur sont ajoutés aux mêmes sélecteurs `data-private-audio` que la bibliothèque GenSrpG.

Aucune lecture audio n'est exécutée par Human Editor.

### Preview / Runtime

`examples/dom-demo/capture-editor-v2.js` utilise un resolver audio combiné :

1. Creator Audio Session ;
2. Private Audio Runtime Library ;
3. assets audio de démo.

Le vrai trajet capacité est donc :

`user:* -> SkillPresentationBinding -> CaptureSkillPresentationAssetsV2 -> DomCombatAudio`

`DomCombatAudio` reste inchangé et reste l'unique lecteur des sons de capacité.

## Portée créature

Les sons personnels peuvent être sélectionnés et enregistrés dans les slots audio de créature existants (attaque / touché / KO).

Ce lot ne crée volontairement aucun nouveau déclencheur de son de créature en combat. Si un événement de créature n'est pas encore joué par le moteur existant, l'import ne lui invente pas une seconde autorité.

## Export / persistance

- les exports Capture conservent uniquement les `assetId` ;
- aucun Blob, Data URL ou octet audio n'est injecté dans le gameplay ou le JSON ;
- la persistance IndexedDB / projet est hors périmètre V1 ;
- après rechargement de la page, un son personnel doit être réimporté dans cette version laboratoire.

## TDD

### RED

HEAD :
`4a9e35725c0db66bea76c5eb79fe7d440bf9a921`

CI :
`37620877217`

Résultat :
- 1214 tests ;
- 1208 PASS ;
- 6 FAIL ciblés ;
- aucun autre échec.

Échecs attendus :
1. Audio Source Manager absent ;
2. Creator Audio Session absente ;
3. trajet user asset -> SkillPresentation -> DomCombatAudio absent ;
4. UI import audio absente ;
5. raccord Human Editor absent ;
6. resolver preview combiné absent.

### GREEN fonctionnel

HEAD :
`e27bc607309b3f4287cd8c838b4dcc5316276197`

CI :
`37621182595`

Résultat :
- 1214 / 1214 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

Ajoutés :
- `src/assets/audio-source-manager-v1.js`
- `src/assets/creator-audio-asset-session-v1.js`
- `tests/unit/creator-audio-asset-session-v1.test.mjs`
- `tests/integration/creator-audio-runtime-v1.test.mjs`
- `tests/unit/creator-audio-editor-ui-v1.test.mjs`

Modifiés :
- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.js`

## Domaines protégés / inchangés

Aucun changement dans :
- Combat Runtime ;
- Combat Session ;
- Damage / Status ;
- collision / projectile ;
- Persistent Zone ;
- FX Core / renderer FX ;
- SkillDefinition gameplay ;
- Rechargeable Action / Esquive ;
- Roster ;
- dépôt GenSrpG principal ;
- `main`.

## Validation utilisateur à faire

Dans la preview :
1. onglet Créature -> Sons -> importer un MP3/WAV/OGG ;
2. confirmer que le nouveau son apparaît dans le bon sélecteur ;
3. cliquer Écouter ;
4. onglet Capacité -> Audio -> importer un son ;
5. sélectionner ce son comme Cast / Travel / Impact / Aura selon son rôle ;
6. sauvegarder/configurer la capacité ;
7. lancer le combat de test ;
8. vérifier que le son personnel de capacité est joué par le trajet normal ;
9. revenir à l'éditeur et vérifier que les sélections restent disponibles pendant la session.

Statut : GREEN technique. Validation utilisateur requise.
