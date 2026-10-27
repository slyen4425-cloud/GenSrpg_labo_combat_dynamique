# Pré-audit — source éditeur Capture -> laboratoire V1 — 2026-09-27

## Objet

Identifier dans la source réelle GenSrpG les propriétaires de l'éditeur Capture utiles à une future alimentation du laboratoire, sans copier le runtime historique ni créer de dépendance vers `Zombicide-40k`.

Ce document est un audit de frontière. Il ne réalise aucune intégration GenSrpG.

## Source GenSrpG exacte

Checkpoint GREEN retenu :

`checkpoint/gensrpg-phase7-dungeon-generated-branch-plan-green-2026-09-27`

Commit :

`49289784ee92a47fd51089815ca25954cdba4493`

`index.html` :

- taille : `8170062` octets ;
- blob Git : `74e223b2c9877e6a88b6ad6726290d230f1f616e`.

Le fichier fourni par Sylvain dans `labo1.zip` a été vérifié localement :

- fichier : `indexLabo.txt` ;
- taille : `8170062` octets ;
- blob Git recalculé : `74e223b2c9877e6a88b6ad6726290d230f1f616e` ;
- correspondance exacte avec le checkpoint GREEN attendu.

La branche GenSrpG plus récente en cours de travail n'est pas utilisée comme source d'autorité pour cet audit.

## État du module restructuré côté GenSrpG

Au checkpoint observé, `assets/gensrpg/capture/` contient seulement la façade restructurée :

- `entry-v1.js` ;
- `module-contract-v1.json`.

Les propriétaires historiques de création/édition des créatures et capacités restent encore dans le gros `index.html`.

Conséquence : le laboratoire doit récupérer les **contrats et fonctions métier portables**, jamais charger ou recopier le HTML historique comme runtime.

## Propriétaire réel de l'éditeur de créatures Capture

La création/édition d'une créature Capture passe par la famille `SharedEntity`, catégorie `creature`.

Chaîne observée :

`openControllableCreatureLibrary()`
-> `renderControllableCreatureLibrary()`
-> `newControllableCreature() / editSharedEntity()`
-> `openSharedEntityEditor()`
-> `saveSharedEntity()`
-> `saveSharedEntities()`.

Fonctions structurantes :

- `loadSharedEntities()` ;
- `saveSharedEntities()` ;
- `openControllableCreatureLibrary()` ;
- `renderControllableCreatureLibrary()` ;
- `newControllableCreature()` ;
- `editSharedEntity()` ;
- `openSharedEntityEditor()` ;
- `saveSharedEntity()` ;
- helpers éléments/résistances/évolution/spawn/abilities.

Données de créature actuellement éditées :

- identité : `id`, `name` ;
- visuel historique : `icon`, `iconData`, `artData` ;
- niveau ;
- PV ;
- stats RPG : force, agilité, intelligence, esprit, endurance, initiative ;
- éléments ;
- résistances ;
- `abilityIds` ;
- capturable / taux de capture ;
- chance et tags d'apparition ;
- évolution : condition, niveau, cible ;
- description ;
- famille de contenu / univers.

### Décision

Les fonctions DOM et stockage ci-dessus ne sont **pas** des candidats à copier dans le Core du laboratoire.

La partie portable à rapatrier est le **modèle de donnée éditable** et sa normalisation explicite.

Le stockage local, les modales, les IDs DOM et les appels de rendu restent GenSrpG-owned.

## Propriétaire réel des capacités Capture

Les créatures Capture utilisent la **Ability Library**, pas le vieux `openSkillEditor()` de la bibliothèque de compétences Survie.

Chaîne Capture observée :

`sharedEntityRenderAbilities()`
-> `openAbilityLibrary({ kind: "sharedEntity" })`
-> `gensAbilityLibraryForTarget()`
-> `renderAbilityLibrary()`
-> `selectAbilityFromLibrary()`.

Création/édition du répertoire :

- `loadAbilityLibrary()` ;
- `saveAbilityLibrary()` ;
- `newAbilityLibraryEntry()` ;
- `editAbilityLibraryEntry()` ;
- `saveAbilityLibraryEditorFromTalentForm()`.

La cible `sharedEntity` est routée vers la bibliothèque `creature`.

Données historiques observées dans une capacité Capture :

- `id` ;
- `name` ;
- `category` ;
- `type` active/passive ;
- `desc` ;
- `element` ;
- `power` ;
- `requiredLevel` ;
- `effects[]` ;
- `activeMeta` : mana / arme / cooldown historique ;
- `usageScopes` ;
- règles d'utilisation optionnelles ;
- marqueurs built-in / Capture.

Le roster intégré de démonstration est fourni par `gensCaptureExpandedAbilityRoster()`.

### Exclusion explicite : vieux Skill Editor générique

`openSkillEditor()` / `saveSkillToLibrary()` appartiennent à un ancien chemin de compétences personnalisées de héros/Survie.

Ils ne sont pas la source de vérité des capacités Capture actuelles et ne doivent pas être rapatriés comme éditeur Capture.

## Runtime Capture à ne pas rapatrier dans l'éditeur

Les couches suivantes sont des comportements runtime / correctifs historiques et restent hors du chantier éditeur :

- `captureFix132` : UI/gestion d'équipement de compétences en partie ;
- `captureFix133` : remplacement des compétences actives et cartes runtime ;
- `captureFix137` : règles MJ Capture ;
- `captureAbilityTruth144` : résolution finale des effets runtime ;
- `captureFix139` : lancement/entrée de session Capture ;
- `builtinMonsterCapture162` : seed de profil/créatures/capacités.

Ces blocs peuvent servir de documentation comportementale, jamais de dépendance ou de fondation copiée.

## Écart avec les contrats natifs du laboratoire

### Créature

Le laboratoire attend aujourd'hui un `CaptureCombatExportV1.creatures[].combat` explicite pouvant fournir :

- `maxHp` ;
- `maxEnergy` ;
- `initialHp` ;
- `initialEnergy` ;
- `energyChargeAmount` ;
- `energyChargeIntervalMs` ;
- `movementEnergyPerStep` ;
- `chargeTimeModifierPct`.

L'éditeur historique Capture ne possède pas tous ces champs.

Il est interdit de les déduire automatiquement de Force/Agilité/Esprit/niveau.

Ils doivent devenir des champs explicites d'un futur brouillon d'éditeur ou provenir d'une configuration explicitement définie par le créateur.

### Compétence

Le `SkillDefinition` natif du laboratoire exige notamment :

- catégorie native ;
- forme : contact/projectile/beam/area/self/aura ;
- `approachMode` ;
- coût énergie ;
- préparation / trajet / récupération en millisecondes ;
- distances autorisées ;
- relations de cible ;
- esquive data-driven ;
- clash projectile data-driven ;
- réactions ;
- effets sémantiques.

L'Ability Library historique ne possède pas explicitement toutes ces dimensions.

Aucune traduction par nom, ID, texte ou élément n'est autorisée.

### Présentation

Le laboratoire possède déjà `SkillPresentationBindingV1` avec :

- icon ;
- cast ;
- travel ;
- impact ;
- hit ;
- miss ;
- ko ;
- vanish ;
- reappear ;
- return ;
- aura ;
- ground ;
- slots audio correspondants ;
- scale / attachment / anchor / offsets / layer / trigger / playback / rotation / opacity.

L'éditeur historique ne produit pas encore ce binding structuré.

Ce sera un ajout explicite de l'éditeur futur, pas une lecture implicite d'URL ou de chemin.

## Frontière cible

Chaîne retenue :

`Capture Editor`
-> brouillons de données portables
-> exporter Capture explicite
-> `CaptureCombatExportV1`
-> pile d'adaptateurs GREEN du laboratoire
-> `CombatSession / RosterSession / SkillDefinition / PresentationBinding`.

Le futur éditeur ne modifie jamais directement le Combat Runtime.

## Découpage recommandé des prochains micro-lots

### Lot 1 — CaptureCreatureEditorDraftV1

Contrat pur de brouillon de créature.

Objectif :

- préserver les données utiles de l'éditeur historique ;
- ajouter uniquement les champs combat explicitement éditables nécessaires au labo ;
- aucune formule RPG ;
- aucun DOM/storage/GenSrpG ;
- préparer une conversion vers le fragment `CaptureCombatExportV1.creatures[]`.

### Lot 2 — CaptureSkillEditorDraftV1

Contrat pur de brouillon de capacité.

Objectif :

- identité/description ;
- sémantique `SkillDefinition` explicite ;
- binding de présentation séparé ;
- aucun mapping depuis un nom historique ;
- aucune résolution d'asset.

### Lot 3 — exporter pur éditeur -> CaptureCombatExportV1

Composer les brouillons validés vers la frontière déjà GREEN.

### Lot 4 — preview éditeur

Seulement après GREEN des contrats/exporters :

- une UI de labo dédiée peut éditer les brouillons ;
- elle reste cliente des contrats ;
- aucun calcul gameplay dans l'UI.

## Conclusion

Le rapatriement correct n'est pas :

`copier SharedEntity + captureFix* dans le labo`.

Le rapatriement correct est :

`extraire les données éditables -> contrats purs -> exporter -> adaptateurs déjà GREEN`.

Cette stratégie conserve une seule source de vérité, évite les rustines historiques et rend le futur retour vers GenSrpG possible sans réintroduire le monolithe.
