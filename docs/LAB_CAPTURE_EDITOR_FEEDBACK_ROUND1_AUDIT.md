# Audit — retour utilisateur Éditeur Capture humain — Round 1 — 2026-09-27

## Base testée

Checkpoint de prévalidation :

`checkpoint/lab-capture-editor-human-v2-prevalidation-green-2026-09-27`

SHA :

`227901c1e3ed9f2472a642d54af8dca786b743bf`

CI associées :

- branche work : SUCCESS ;
- checkpoint prévalidation : SUCCESS ;
- preview : SUCCESS.

Ce checkpoint correspond à l'écran réellement testé par Sylvain.

## Retours utilisateur

1. sons non raccordés ;
2. impression de doublon sur les sockets projectile ;
3. PV présents dans l'onglet Combat alors qu'ils appartiennent à la créature ;
4. seule Boule de feu est proposée alors que plusieurs capacités existent déjà ;
5. absence de réglage de taille / scale de créature ;
6. besoin futur de stats configurables influençant les règles de combat ;
7. besoin de stats élémentaires progressables ;
8. Buff/Debuff exposé sans éditeur d'effet générique réel ;
9. absence de passage clair de l'éditeur vers le combat de test.

## Diagnostic par responsabilité

### 1. Audio privé

Source réelle retrouvée :

`slyen4425-cloud/GenSrpG_audio_prive`

État réel :

- dépôt privé ;
- 173 fichiers audio archivés ;
- aucune définition `assetId` ;
- aucun Asset Catalog audio ;
- aucun binding logique ;
- aucun Storage Adapter audio ;
- le README interdit implicitement de considérer les chemins privés comme clés métier.

Conclusion :

La liste audio vide de l'éditeur est cohérente avec l'absence de catalogue. Il est interdit de coder les chemins privés ou un token GitHub dans l'UI.

Nouveau lot requis :

`PrivateAudioCatalogV1 -> AudioAssetProvider -> binding assetId`

La metadata et le stockage des octets doivent rester séparés.

### 2. Socket projectile

Le contrat `CreaturePresentationBindingV1` possède déjà les coordonnées des sockets sur la créature.

Le champ `SkillPresentationBindingV1.visual.*.anchor` est une **référence** à un socket, pas un deuxième emplacement.

Problème UI actuel :

- l'écran Capacité affiche une liste de sockets codée en dur ;
- elle n'est pas dérivée des sockets réellement placés sur la créature ;
- cela donne l'impression que le socket est défini une seconde fois.

Correction autorisée :

- aucun placement de socket dans l'onglet Capacité ;
- l'onglet Créature reste l'unique propriétaire des coordonnées ;
- la capacité choisit uniquement « Point de sortie : <socket existant> » ;
- la liste est dérivée des sockets créature réellement définis ;
- aucun socket inexistant ne peut être référencé.

### 3. PV

Autorité métier :

- PV/maxPV appartiennent au Fighter/Combat State ;
- dans l'éditeur Capture, leurs valeurs initiales sont configurées dans la donnée créature.

Problème ergonomique :

- les champs PV sont actuellement affichés dans l'onglet « Combat ».

Correction :

- déplacer la saisie PV dans l'onglet Créature ;
- ne garder dans « Combat » que les réglages de format et les réglages que le produit souhaite regrouper pour le combat, sans dupliquer la donnée ;
- un seul input DOM par valeur.

### 4. Bibliothèque de capacités

État réel du dépôt :

`data/combat/skills/` contient déjà au moins :

- Boule de feu ;
- Griffe ;
- Plongeon aérien ;
- Frappe téléportée ;
- Riposte ;
- Esquive ;
- Immunité feu ;
- Bouclier miroir ;
- Impact étourdissant.

Problème UI :

La page humaine contient une seule capacité initiale codée pour la démonstration.

Correction structurelle :

- créer un catalogue explicite des SkillDefinition existants ;
- l'éditeur charge ce catalogue ;
- choisir une capacité remplit le formulaire depuis sa donnée réelle ;
- « Nouvelle capacité » reste possible sans écraser le catalogue ;
- les 4 slots référencent la bibliothèque, jamais une liste codée dans le HTML.

Ce lot ne prétend pas encore récupérer toutes les capacités historiques de GenSrpG Capture. Leur import éventuel passe par l'adaptateur Capture déjà documenté.

### 5. Scale de créature

État réel :

`VisualActor` possède déjà `scale`, mais cette valeur est une donnée d'instance visuelle.

`CreaturePresentationBindingV1` ne possède pas encore de taille de présentation persistante.

Conclusion :

Ne pas ajouter un curseur UI non sauvegardé.

Nouveau lot contractuel requis, probablement :

`CreaturePresentationBindingV2.displayScale`

ou une propriété équivalente dont le propriétaire sera explicitement défini.

Le renderer consommera ensuite cette valeur via l'adaptateur visuel existant.

### 6. Stats configurables et scaling combat

Besoin produit confirmé :

- Force peut augmenter les dégâts physiques selon une règle configurable ;
- Défense peut réduire certains dégâts selon une règle configurable ;
- stats élémentaires Feu/Eau/etc. peuvent modifier dégâts/résistances ;
- progression de niveau peut attribuer des points dans ces stats ;
- les coefficients doivent être éditables.

État réel :

Les `sourceStats` Capture existent, mais Combat Rules ne doit pas inventer actuellement une formule depuis ces champs.

Nouveau propriétaire requis :

`CombatStatRulesV1`

Responsabilités futures :

- catalogue des stats ;
- type de stat ;
- règle d'application ;
- coefficient configurable ;
- source/cible ;
- élément éventuel ;
- bornes ;
- calcul pur testé.

Chaîne cible :

`Creature stats -> CombatStatRules -> derived combat modifiers -> Action Resolver`

Interdit :

- formules dans l'UI ;
- `if force ...` dispersés ;
- calculs différents entre preview et runtime.

### 7. Buff / Debuff

`SkillDefinition` possède la catégorie `buff_debuff`, mais le laboratoire ne possède pas encore un système générique de statuts arbitraires permettant d'éditer durée, stat ciblée, amplitude, cumul, dispel, etc.

Décision :

- ne pas présenter « Buff / Debuff » comme une création complète fonctionnelle ;
- l'option création générique sera indiquée « non disponible — Status Effect requis » ;
- les compétences existantes utilisant les mécanismes déjà réels restent chargeables et inspectables ;
- futur propriétaire : `StatusEffectDefinitionV1`.

Il ne s'agit pas de masquer une fonction : l'UI doit refléter exactement la capacité actuelle du moteur.

### 8. Éditeur -> combat de test

État actuel :

L'éditeur produit un `CaptureCombatExportV1` valide, mais n'offre pas de chemin utilisateur pour lancer la démo.

Chaîne cible :

`Human Editor -> Exporter V2 -> Capture Adapter Stack -> Preview Bridge -> Combat Test UI`

Le module de formulaire ne doit pas importer directement Combat Runtime.

Nouveau lot requis :

`CaptureEditorCombatPreviewBridgeV1`

Le bridge de démo compose les deux modules sans transférer leur autorité.

## Découpage de travail

### Lot A — Editor Ownership Cleanup V1

UI uniquement, aucune nouvelle mécanique :

- PV déplacés dans Créature ;
- socket capacité = référence dynamique aux sockets créature ;
- option Buff/Debuff non générique clairement indisponible à la création ;
- aucune donnée cachée / aucun doublon.

### Lot B — Skill Catalog for Editor V1

- catalogue explicite des compétences du laboratoire ;
- chargeur pur ;
- sélection / préremplissage ;
- 4 slots alimentés par le catalogue ;
- aucune liste métier codée dans le HTML.

### Lot C — Creature Scale Contract V1

- contrat ;
- test RED ;
- adaptation vers VisualActor ;
- UI ensuite seulement.

### Lot D — Private Audio Catalog V1

- inventaire privé vers IDs logiques ;
- metadata séparée des octets ;
- aucun token côté navigateur ;
- resolver/storage provider dédié ;
- test de lecture autorisée dans un contexte approprié.

### Lot E — Combat Stat Rules V1

- audit puis contrat séparé ;
- aucune formule avant validation.

### Lot F — Status Effect V1

- seulement si Buff/Debuff doit devenir générique.

### Lot G — Editor Combat Preview Bridge V1

- bouton « Tester le combat » ;
- utilise le vrai export ;
- bridge de démo séparé ;
- aucune logique runtime dans le formulaire.

## Invariants

- aucune modification de GenSrpG ;
- aucune URL privée ou token dans le HTML/JS public ;
- aucun champ UI sans propriétaire réel ;
- aucun système parallèle ;
- aucun masquage d'une donnée invalide ;
- aucun déplacement de responsabilité dans Demo UI ;
- chaque lot possède RED -> implémentation -> CI -> checkpoint.
