# Laboratoire — pré-audit seam CaptureCombatPackageV1 -> démo 2v2

Date : 2026-09-27

## Base

- checkpoint : `checkpoint/lab-capture-combat-package-consolidated-v1-green-2026-09-27`
- SHA : `b74c09cd24236dd03ddacbd531c924176a4c9be8`
- branche d'audit : `work/lab-capture-package-demo-seam-preaudit-2026-09-27`

Aucun runtime n'est modifié dans ce pré-audit.

## 1. Chaîne actuelle

La page :

`examples/dom-demo/coop-2v2.html`

charge uniquement :

`examples/dom-demo/coop-2v2.js`.

Le bootstrap monte :

1. `mountCombatDemo({ root })` pour les créatures/animations visuelles ;
2. `mountCoop2v2Test({ root, visuals, presentationAssets })` pour le combat.

Le propriétaire du chargement gameplay 2v2 est donc :

`src/ui/combat-2v2-test-ui.js`.

## 2. Seam exact

Au début de `mountCoop2v2Test()`, l'UI charge actuellement :

- `demo-coop-2v2.format.json` ;
- quatre FighterConfig JSON ;
- quatre SkillDefinition JSON.

Puis elle construit :

- BattleFormat ;
- skills / skillsById ;
- fighterConfigs ;
- fighters actor-scoped ;
- CombatSession.

Après cette étape, CombatSession / CombatRuntime / Presenter / FX / Audio ne dépendent plus de la provenance des JSON.

Le seam propre se situe donc **avant la création de CombatSession**, au niveau de ces données natives.

## 3. Raccord cible

Ajouter à `mountCoop2v2Test()` un paramètre optionnel générique :

`combatSetup`.

Forme :

```js
{
  format,
  fighterConfigs,
  fighters,
  skillsById,
  localSkills
}
```

Si `combatSetup === null` :

- chemin historique inchangé ;
- les JSON de démo sont chargés exactement comme aujourd'hui.

Si `combatSetup` est fourni :

- aucun JSON gameplay de démo n'est chargé ;
- les contrats natifs fournis sont utilisés directement ;
- la même CombatSession, le même Runtime et la même UI sont conservés.

Le nom reste générique : l'UI ne doit pas connaître Capture.

## 4. Projection depuis CaptureCombatPackageV1

Le bootstrap peut transformer le package sans règle métier :

```js
const localActor = pkg.battleFormat.actor(
  pkg.battleFormat.localActorId
);

const combatSetup = {
  format: pkg.battleFormat,
  fighterConfigs: pkg.fighterConfigs,
  fighters: pkg.initialFighters,
  skillsById: pkg.skills,
  localSkills:
    pkg.skillsByCreature[localActor.creatureId]
};
```

Cette projection ne calcule aucun résultat de combat.

## 5. Preview initiale proposée

Conserver `coop-2v2.html` comme unique page.

Un query param sélectionne seulement la source :

`?source=capture-export`.

Le bootstrap :

1. charge une fixture locale `CaptureCombatExportV1` représentant un export d'éditeur ;
2. appelle `buildCaptureCombatPackageV1` ;
3. projette le package vers `combatSetup` ;
4. monte le même `mountCoop2v2Test()`.

Sans query param, comportement actuel strictement inchangé.

## 6. Visuels créature

`mountCombatDemo()` charge actuellement les métadonnées visuelles de :

- loup_volcanique ;
- golem_moussu ;
- maraileron ;
- braisombre.

Le premier preview CapturePackage utilisera volontairement ces mêmes creatureId.

Ainsi aucun second système de métadonnées créature n'est introduit.

Le futur raccord d'une créature totalement créée dans l'éditeur sera un lot séparé : Creature Presentation / profile / FX anchors.

## 7. Présentation des skills

Le package contient désormais `PresentationBindingV1`.

Cependant le renderer actuel consomme le resolver `demoPresentationAssets`.

Le premier lot de source package peut continuer à utiliser le resolver de démo pour les assets existants, afin de tester uniquement le raccord **données gameplay éditeur -> moteur**.

Un lot ultérieur adaptera :

`PresentationBindingV1 + Asset Catalog -> interface presentationAssets`.

Ne pas mélanger ces deux changements dans le même lot.

## 8. IA

La démo 2v2 possède actuellement des contrôleurs explicitement montés pour :

- ally ;
- opponent ;
- opponent-b.

Leurs listes de techniques sont également configurées dans la démo.

Le premier preview package conserve les mêmes actorId et inclut les mêmes skills nécessaires.

Aucune généralisation controllerId -> controller factory n'est autorisée dans ce premier lot.

Un registre de contrôleurs sera un chantier séparé si nécessaire.

## 9. Compétences locales

Le chemin package doit afficher uniquement :

`skillsByCreature[localCreatureId]`.

Cela permettra de prouver qu'une sélection de compétences provenant de l'éditeur pilote réellement la barre locale.

Le chemin historique garde son comportement existant.

## 10. Fichiers autorisés pour le futur micro-lot runtime

- `src/ui/combat-2v2-test-ui.js` : seam de données optionnel uniquement ;
- `examples/dom-demo/coop-2v2.js` : choix de source + projection native ;
- une fixture JSON locale d'export Capture ;
- tests dédiés ;
- documentation.

Interdits :

- duplication de `coop-2v2.html` ;
- second CombatSession/Runtime ;
- modification Combat Rules ;
- changement de layout/CSS ;
- refonte IA ;
- resolver PresentationBinding ;
- modification du dépôt GenSrpG.

## 11. Critère de réussite futur

- sans query param : preview actuelle strictement identique ;
- avec `?source=capture-export` :
  - fixture -> CaptureCombatPackageV1 -> combatSetup ;
  - même UI 2v2 ;
  - même Runtime ;
  - barre locale issue de la créature locale exportée ;
  - CI GREEN ;
  - validation smartphone avant checkpoint visuel final.
