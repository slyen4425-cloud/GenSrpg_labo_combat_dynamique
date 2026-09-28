# Pré-audit V1 — Capture Editor -> Combat Test

Date : 2026-09-28

## 1. Statut de départ

Base : `c3d6ee0128fea6728c52b9bc19500d2fca1893d2`.

La prévalidation UI des corrections Capture Editor 1 à 5 reste ouverte : aucune validation smartphone utilisateur postérieure n'est enregistrée. Ce document ne transforme donc pas cette prévalidation en GREEN et ne modifie aucun comportement UI.

Lot courant :

- checkpoint départ : `checkpoint/lab-start-capture-editor-combat-test-bridge-preaudit-2026-09-28` ;
- branche : `work/lab-capture-editor-combat-test-bridge-preaudit-2026-09-28` ;
- nature : documentation / architecture ;
- aucune dépendance runtime à GenSrpG ;
- aucun `captureFix*` ;
- aucun storage ou global caché.

## 2. Chaîne déjà réellement disponible

L'éditeur humain V2 produit déjà le paquet attendu.

Chemin :

```
mountCaptureEditorHumanV2()
  -> validate()
  -> buildHumanEditorExportV2()
  -> exportCaptureEditorDraftsToCombatExportV2()
  -> exportCaptureEditorDraftsToCombatExportV1()
  -> normalizeCaptureCombatExportV1()
```

Le contrôleur d'éditeur conserve ce paquet dans sa fermeture locale `lastExport` et l'expose explicitement avec `getLastExport()`.

Cela signifie qu'aucun nouveau format intermédiaire n'est nécessaire pour lancer un combat test.

## 3. Adaptation déjà réellement disponible

Le laboratoire possède déjà :

`adaptCaptureCombatExportStackV1(export)`.

Cette fonction normalise `CaptureCombatExportV1` puis produit les contrats natifs nécessaires :

- `battleFormat` ;
- `roster` ;
- `fighterConfigs` ;
- `fighters` ;
- `skills` ;
- `skillIdsByActor` ;
- `skillPresentations`.

Conclusion : créer un second « PreviewExport », recopier les valeurs de l'éditeur ou fabriquer un DTO spécial combat serait une duplication de responsabilité.

Le paquet exporté par l'éditeur doit être l'unique entrée Capture du bridge.

## 4. Point de raccord réellement manquant

Le manque se situe après l'Adapter Stack et avant le bootstrap des UIs de combat test.

### 4.1 Combat 2v2 actuel

`mountCoop2v2Test()` charge encore directement :

- un `BattleFormatDefinition` de démo ;
- quatre FighterConfig JSON de démo ;
- quatre SkillDefinition JSON de démo.

Il reconstruit ensuite localement :

- `fighterConfigs` ;
- `fighters` ;
- `skillsById`.

Ce bootstrap n'accepte pas encore les données natives déjà produites par `adaptCaptureCombatExportStackV1()`.

De plus, les contrôleurs IA 2v2 possèdent encore des actorIds et listes de capacités de démo écrits explicitement :

- `ally` ;
- `opponent` ;
- `opponent-b` ;
- listes `claw / fireball / aerial-dive / teleport-strike`.

Ces valeurs sont acceptables pour la page de démonstration actuelle, mais elles empêchent ce fichier d'être le bridge générique de l'éditeur.

### 4.2 Combat test 1v1 / roster actuel

`mountCombatTest()` charge lui aussi ses fighters, roster, skills et policies depuis les fichiers de démo.

Il reste organisé autour des slots historiques `player` / `opponent` et de son scénario de rappel/invocation.

Il ne doit pas devenir une seconde structure de traduction de `CaptureCombatExportV1`.

## 5. Conséquence d'architecture

Le futur bridge ne doit pas être :

```
Editor DOM
 -> valeurs copiées
 -> objet spécial combat-test
 -> UI 2v2
```

Il doit rester :

```
Capture Editor
 -> validate()
 -> CaptureCombatExportV1
 -> adaptCaptureCombatExportStackV1()
 -> données natives du labo
 -> bootstrap générique de Combat Session / Runtime
 -> Presenter / Animation / FX
```

Le Combat Core ne doit connaître ni l'éditeur, ni `CaptureCombatExportV1`.

## 6. Format 1v1 / 2v2 / 3v3 / 4v4

Le bridge ne doit pas appeler directement un chemin spécial « 2v2 ».

La donnée autoritaire existe déjà dans `BattleFormatDefinition` issue du Battle Setup.

Le nombre d'acteurs doit donc être dérivé de :

- `battleFormat.actors` ;
- `battleFormat.teams` ;
- `battleFormat.localActorId` ;
- `controllerId` par acteur.

Les slots visuels et contrôleurs doivent suivre ces données.

Interdit :

- `if (is2v2)` ;
- quatre actorIds codés en dur ;
- dupliquer la logique pour 3v3 ou 4v4 ;
- déduire le format du nombre de cartes visibles.

## 7. Propriétaires proposés

### 7.1 Export

Propriétaire inchangé :

`Capture Editor Exporter V2 -> CaptureCombatExportV1`.

### 7.2 Adaptation

Propriétaire inchangé :

`Capture Adapter Stack V1`.

Aucun second mapping gameplay n'est ajouté.

### 7.3 Bootstrap de preview

Responsabilité à créer/généraliser :

prendre des **contrats natifs déjà adaptés** et initialiser le combat test.

Ce bootstrap n'a pas le droit de remapper les dégâts, PV, énergie, cibles ou cooldowns.

Il orchestre seulement :

- création de `CombatSession` depuis `fighters` ;
- création de `CombatRuntime` ;
- association des SkillDefinition déjà normalisées ;
- association des SkillPresentationBindings ;
- construction des contrôleurs depuis `controllerId` ;
- rendu des acteurs déclarés par `BattleFormatDefinition`.

## 8. Session éditeur / preview

Un futur bouton « Tester en combat » doit obtenir le paquet via l'API explicite de l'éditeur :

`editor.validate()` ou `editor.getLastExport()`.

Aucun accès direct aux inputs HTML ne doit exister côté combat.

Pour permettre un retour à l'éditeur sans perdre le brouillon, le propriétaire recommandé est une fermeture/composition de page explicitement montée, par exemple conceptuellement :

`CaptureEditorPreviewSession`.

Elle possède seulement :

- le contrôleur d'éditeur ;
- le dernier `CaptureCombatExportV1` validé ;
- l'instance de preview combat montée ;
- la transition de vue.

Interdits :

- `window.currentCaptureExport` ;
- localStorage ;
- sessionStorage de fortune ;
- lecture du DOM éditeur par la preview ;
- deuxième copie métier modifiable.

## 9. Découpage recommandé des prochains micro-lots

### Lot A — source de données injectée dans le combat test

But : rendre le bootstrap de combat capable de recevoir un modèle natif fourni en paramètre au lieu d'obliger le chargement des fixtures de démo.

RED à poser avant implémentation :

1. une source injectée doit éviter tout fetch des FighterConfig/SkillDefinition de démo ;
2. les fighters de session doivent provenir exactement du modèle injecté ;
3. les SkillDefinition utilisées doivent être celles du modèle injecté ;
4. le chemin de démo actuel doit continuer à fonctionner sans paramètre injecté.

Ce lot ne connaît pas l'éditeur.

### Lot B — contrôleurs data-driven

But : retirer des contrôleurs de preview les actorIds et skillIds de démonstration codés en dur.

RED :

1. les acteurs IA sont découverts via `battleFormat.actors[].controllerId` ;
2. leurs capacités proviennent de `skillIdsByActor` ;
3. `localActorId` n'est jamais piloté par un contrôleur IA local ;
4. aucune branche `is2v2`.

### Lot C — slots visuels format-driven

But : permettre au même chemin de bootstrap de rendre 1 à 4 actifs par équipe.

RED :

1. 1v1 ;
2. 2v2 ;
3. 3v3 ;
4. 4v4 ;

avec les mêmes contrats et sans fonctions spécifiques par format.

Ce lot est UI et nécessitera sa propre validation smartphone avant GREEN final.

### Lot D — bridge Capture pur

Une fois A/B/C GREEN :

```
CaptureCombatExportV1
 -> adaptCaptureCombatExportStackV1()
 -> bootstrap natif
```

RED :

1. le même objet exporté par l'éditeur est donné à l'Adapter Stack ;
2. aucune reconstruction depuis le DOM ;
3. aucune seconde structure métier ;
4. PV/énergie/skills/targets/cooldowns observés en combat correspondent aux contrats adaptés ;
5. aucun import depuis `Zombicide-40k`.

### Lot E — bouton « Tester en combat »

Seulement après le bridge technique GREEN :

- validation de l'éditeur ;
- lancement de la preview à partir du paquet validé ;
- retour à l'éditeur ;
- conservation du brouillon par propriétaire explicite ;
- test smartphone.

Aucun bouton fictif avant ce lot.

## 10. Tests du vrai chemin attendus

Le test d'intégration final doit exercer :

```
drafts éditeur
 -> exportCaptureEditorDraftsToCombatExportV2
 -> CaptureCombatExportV1
 -> adaptCaptureCombatExportStackV1
 -> CombatSession
 -> CombatRuntime
 -> résolution d'une compétence
 -> CombatResolutionPresenter
```

Il est interdit d'injecter directement un état final dans le renderer.

## 11. Risques identifiés

1. **Réutiliser directement `combat-2v2-test-ui.js` comme bridge**
   - risque : figer l'éditeur sur quatre acteurs et propager ses actorIds de démo.

2. **Créer un second contrat Preview**
   - risque : divergence avec `CaptureCombatExportV1`.

3. **Faire lire l'éditeur par le combat**
   - risque : couplage DOM et deuxième autorité.

4. **Utiliser localStorage pour changer de page**
   - risque : storage caché non propriétaire et brouillons obsolètes.

5. **Faire adapter les stats/skills dans la UI**
   - risque : la UI deviendrait propriétaire de gameplay.

6. **Généraliser 1v1/2v2/3v3/4v4 en un seul big-bang**
   - risque : trop grand lot. Les micro-lots A/B/C doivent isoler source, contrôleurs puis slots.

## 12. Conclusion

Le bridge n'a pas besoin d'un nouveau format.

La frontière correcte existe déjà :

`CaptureCombatExportV1`.

L'adaptation correcte existe déjà :

`adaptCaptureCombatExportStackV1()`.

Le travail restant est de rendre le bootstrap de combat test **injectable puis format-driven**, avant de connecter l'éditeur.

Aucune modification du Combat Core n'est justifiée par ce pré-audit.
