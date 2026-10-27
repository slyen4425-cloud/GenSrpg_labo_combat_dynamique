# Laboratoire Combat Dynamique — Audit du futur adaptateur Capture

Date : 2026-09-27

## 1. But

Préparer un futur raccord entre le mode Capture de GenSrpG et le laboratoire sans créer de dépendance runtime entre les deux dépôts.

Chaîne cible :

```
GenSrpG Capture / éditeur
        |
        v
Capture Export Contract
        |
        v
Capture -> Lab Adapter
        |
        +---- FighterConfig
        +---- SkillDefinition
        +---- Roster
        +---- BattleFormatDefinition
        +---- Presentation Bindings
        |
        v
Combat Session / Runtime / Presenter / FX
```

Le laboratoire reste autonome.

## 2. Sources vérifiées

Dépôt GenSrpG lu uniquement :

- dépôt : `slyen4425-cloud/Zombicide-40k` ;
- branche inspectée : `work/gensrpg-phase7-dungeon-generated-room-create-restore-2026-09-27` ;
- HEAD observé : `9ec3a39af709405f5d9ee54a61aa2c041c7339e6` ;
- runtime `index.html` déclaré par la documentation GenSrpG : blob `efcc459c9bade0e35bf123d100e499b3ce7d4eca`, 8 170 213 octets.

Le contenu exact de `index.html` n'a pas été relu dans ce chantier. Conformément à la charte GenSrpG, toute future inspection exacte nécessaire de ce gros fichier passera par la procédure dédiée.

Dépôt laboratoire :

- base : `5ef53a67c5beddd9b70df88d73b242a3f12d282c` ;
- checkpoint : `checkpoint/lab-start-capture-adapter-audit-2026-09-27` ;
- branche : `work/lab-capture-adapter-audit-2026-09-27`.

## 3. État réel de Capture côté GenSrpG

### 3.1 Module cible

La structure future existe déjà :

- `assets/gensrpg/capture/entry-v1.js` ;
- `assets/gensrpg/capture/module-contract-v1.json`.

Le contrat déclare que Capture doit posséder :

- Monster Capture runtime ;
- créatures ;
- biomes ;
- capture ;
- équipe / réserve ;
- combat Capture.

Mais `entry-v1.js` reste volontairement inerte.

### 3.2 Runtime historique encore actif

La cartographie Phase 2 montre encore une chaîne de propriétaires inline Capture :

- `captureGameplayModalMount` ;
- `capturePlaytestFix128` ;
- `captureFix129` à `captureFix140` ;
- `captureItems141` ;
- `captureBuffs142` ;
- `captureBuffFx143` ;
- `captureAbilityTruth144` ;
- `builtinMonsterCapture162`.

Points importants :

- `captureAbilityTruth144` est le dernier propriétaire cartographié de la résolution des capacités Capture ;
- `captureRenderBattleLive` reste un renderer historique stratifié ;
- `captureFix139` reste le propriétaire du chemin de lancement Capture ;
- le provider Shell public ajouté en Phase 5 ne contient pas de gameplay : il route vers Capture139 ;
- Capture utilise encore historiquement un substrat `gameStyle: dungeon`, mais son mode canonique est distinct : `capture`, famille de contenu `creature`.

Conclusion : ces couches sont des **sources à caractériser**, pas du code à importer dans le laboratoire.

## 4. Données Capture prouvées par les sentinelles

Les tests actuels démontrent les surfaces suivantes sans que le laboratoire ait besoin d'importer le runtime historique.

### 4.1 Profil / famille

Le profil intégré Monster Capture possède notamment :

- un `id` stable ;
- un nom ;
- `gameStyle: "dungeon"` pour le substrat historique ;
- un profil gameplay `creature` ;
- les modules `capture` et `controllableCreatures`.

Pour le futur adaptateur, `gameStyle: dungeon` ne doit **pas** devenir une dépendance. Seule l'identité fonctionnelle Capture / creature est pertinente.

### 4.2 Entités créatures

Les sentinelles utilisent :

- `captureTeamEntityRoster()` pour obtenir le roster joueur ;
- `loadSharedEntities()` pour obtenir le pool d'entités ;
- `category === "creature"` pour distinguer les créatures.

Champs explicitement observés dans les tests :

- `id` ;
- `category` ;
- `hp` ;
- `maxHp` ;
- `level` ;
- `stats`.

Les tests modifient notamment dans `stats` :

- `speed` ;
- `agility` / `agilite` ;
- `defense`.

Cela prouve l'existence de ces données, mais ne signifie pas que le laboratoire doit leur attribuer automatiquement une sémantique.

### 4.3 Roster / équipes

Le moteur Capture historique accepte des côtés de bataille de forme observable :

```js
{
  name,
  roster: [creatures...],
  controller
}
```

avec au moins les contrôleurs observés :

- `human` ;
- `mj`.

Le démarrage de bataille observé reçoit aussi des réglages de session tels que :

- `activeSlots` ;
- `teamSize` ;
- `minBattleTeam` ;
- `maxBattleTeam` ;
- `captureAllowed`.

Ces données correspondent conceptuellement au `Roster Session` et au `BattleFormatDefinition` du laboratoire, mais nécessitent une traduction explicite.

### 4.4 Capacités

Les sentinelles prouvent :

- une API historique `captureBattleUseAbility(skillId)` ;
- au moins l'identifiant stable `capture_basic_attack` ;
- `captureAbilityTruth144` comme dernier propriétaire cartographié des effets de capacités.

En revanche, la forme exacte complète d'une capacité historique n'est pas considérée suffisamment caractérisée par les documents/tests lus dans ce lot.

**Règle : ne jamais inférer une SkillDefinition du laboratoire à partir du nom, du texte ou de l'ID d'une capacité historique.**

### 4.5 Progression Capture

Famille de stockage prouvée :

`gensrpg_capture_progress_v2_<profileId>`

Defaults actuellement caractérisés par les tests :

```js
{
  xpMultiplier: 1,
  statCap: 300,
  statPointsPerLevel: 5,
  talentEvery: 5,
  maxMoves: 4,
  moveRelearn: "free"
}
```

Capture reste propriétaire des règles métier. Core Storage ne possède que la sérialisation JSON générique.

Le laboratoire ne doit pas lire cette clé.

### 4.6 Stats communes restructurées

GenSrpG dispose déjà de contrats Core purs pour les stats.

Normalisation canonique observée :

- `agility -> agilite` ;
- `spirit -> esprit` ;
- `strength -> force` ;
- `dexterity -> agilite` ;
- `wisdom -> esprit` ;
- `constitution -> endurance` ;
- `defence -> defense` ;
- `armour -> armor` ;
- `move -> movement`.

Une définition de statistique Core possède conceptuellement :

- `id` ;
- `name` ;
- `icon` ;
- `defaultValue` ;
- `min` ;
- `max` ;
- `visible` ;
- `description`.

Un snapshot canonique expose :

- `heroId` ;
- valeurs canoniques ;
- valeurs dérivées.

Cette couche est une bonne candidate pour alimenter un futur export Capture, mais **le laboratoire ne l'importe pas directement**.

## 5. Contrats déjà propres côté laboratoire

### 5.1 FighterConfig réel

Le Combat State consomme actuellement :

- `id` ;
- `maxHp` ;
- `initialHp` ;
- `maxEnergy` ;
- `initialEnergy` ;
- `energyChargeAmount` ;
- `energyChargeIntervalMs` ;
- `movementEnergyPerStep` ;
- `chargeTimeModifierPct` ;
- `chargeTimeEffects`.

Le moteur ne consomme actuellement ni `level`, ni `speed`, ni `agilite`, ni `defense` comme champs autonomes.

### 5.2 SkillDefinition réel

Le contrat courant sépare déjà :

- identité : `id`, `name` ;
- `category` ;
- `form` ;
- `element` ;
- `approachMode` ;
- énergie ;
- préparation / trajet / récupération ;
- distances ;
- relations de cible ;
- esquive ;
- réactions ;
- interaction projectile ;
- effet sémantique.

Catégories actuelles :

- offensive ;
- defensive ;
- heal ;
- buff_debuff ;
- counter.

Formes actuelles :

- contact ;
- projectile ;
- beam ;
- area ;
- self ;
- aura.

### 5.3 Roster Session

Un membre du roster de laboratoire possède :

- `id` ;
- `creatureId` ;
- `displayName` ;
- `fighterConfigId`.

Le Roster Session possède les snapshots PV / énergie et les changements actif / réserve.

### 5.4 BattleFormatDefinition

Le format de combat sépare :

- acteurs ;
- équipes ;
- contrôleurs ;
- créature ;
- FighterConfig.

Le 2v2 actuel est donc déjà compatible avec une source externe de données **si** celle-ci est traduite vers ce contrat.

### 5.5 Presentation Assets

Le laboratoire possède déjà la séparation correcte :

```
SkillDefinition = gameplay
SkillPresentationBinding = visuel / audio
Asset Catalog = résolution assetId -> ressource
```

Le futur éditeur ne doit jamais écrire un chemin GitHub ou un chemin de fichier dans SkillDefinition.

## 6. Matrice de traduction proposée

| Capture / éditeur | Laboratoire | Politique |
|---|---|---|
| creature.id | roster.member.creatureId + identifiant de définition | direct après validation |
| nom créature | roster.member.displayName | direct |
| hp / maxHp | initialHp / maxHp | direct, clamp explicite |
| stats.speed | aucun champ actuel | conserver en metadata/export, ne pas inventer de mapping |
| stats.agilite | aucun champ actuel | idem |
| stats.defense | aucun champ actuel | idem |
| level | aucun champ Combat State actuel | metadata seulement |
| roster | Roster Session | traduction explicite |
| activeSlots / teamSize | BattleFormat / setup | traduction explicite |
| controller | controllerId | traduction par table autorisée |
| ability id/name | SkillDefinition id/name | identité seulement |
| dégâts | SkillDefinition.effect.damage | seulement si source sémantique explicite |
| soin | SkillDefinition.effect.heal | seulement si source sémantique explicite |
| cible allié/ennemi/soi | targetRelations | traduction explicite |
| projectile/contact/etc. | form | traduction explicite, jamais depuis le nom |
| élément | element | traduction explicite |
| coût | energyCost | uniquement si l'unité/coût Capture est déclaré compatible |
| durée | preparationMs/travelMs/recoveryMs | nécessite contrat explicite ;
| buffs/debuffs | contrat futur d'effets/statuts | ne pas écraser dans tags |
| assets de créature | Creature Presentation Binding | assetId uniquement |
| icon/cast/travel/impact/sounds | SkillPresentationBinding | assetId uniquement |
| progression | hors Combat Session | ne pas importer comme état combat |
| biomes/arène | Arena Presentation Binding | présentation, pas gameplay |

## 7. Ce qui peut être réutilisé directement

### Vert — structure compatible

- identifiants stables ;
- noms affichés ;
- PV/max PV ;
- composition de roster ;
- notion d'actif/réserve ;
- équipes et contrôleurs, après table de traduction ;
- IDs d'assets stables lorsqu'ils existent ;
- définition Core canonique des noms de stats comme source d'export.

### Orange — traduction obligatoire

- stats Capture vers paramètres FighterConfig ;
- règles de charge/énergie ;
- capacité Capture vers SkillDefinition ;
- cible ;
- formes d'attaque ;
- timings ;
- buffs/debuffs ;
- configuration de bataille Capture vers BattleFormatDefinition ;
- bindings de présentation.

### Rouge — ne jamais importer comme fondation

- `captureFix128..140` ;
- `captureItems141` ;
- `captureBuffs142` ;
- `captureBuffFx143` ;
- `captureAbilityTruth144` comme code runtime ;
- `captureRenderBattleLive` ;
- `window.gensCurrentCaptureBattle` ;
- appels DOM `captureGameHub`, `captureBattleLiveBody`, etc. ;
- localStorage Capture ;
- timers/retries de routage ;
- dépendance au `gameStyle: dungeon` ;
- globals Shell/Dungeon ;
- renderer historique.

Ces éléments peuvent être **caractérisés** pour comprendre le comportement, jamais importés comme moteur du laboratoire.

## 8. Frontière recommandée : CaptureExportV1

Le futur raccord doit publier un objet neutre.

Forme conceptuelle minimale :

```js
{
  version: 1,
  creatures: [
    {
      id,
      displayName,
      combat: {
        maxHp,
        initialHp,
        stats
      },
      progression: {
        level
      },
      skillIds: [],
      presentationId
    }
  ],
  skills: [],
  teams: [],
  battle: {},
  presentationBindings: []
}
```

Important :

- ce contrat appartient à la frontière d'intégration, pas au Combat Core ;
- le Core du laboratoire ne doit jamais connaître `CaptureExportV1` ;
- seul l'adaptateur le connaît ;
- l'adaptateur produit des contrats natifs du laboratoire ;
- les champs non pris en charge sont rejetés ou conservés dans une zone explicitement non-runtime ; ils ne reçoivent jamais une sémantique implicite.

## 9. Propriétaire futur proposé

Nouveau domaine d'adaptation, séparé :

`src/adapters/input/capture/`

Responsabilité :

`CaptureExportV1 -> contrats natifs du laboratoire`

Interdit :

- DOM ;
- localStorage / IndexedDB ;
- import depuis `Zombicide-40k` ;
- globals ;
- renderer ;
- animation ;
- FX ;
- calcul de résultat de combat ;
- fallback par nom de compétence ;
- chemins physiques d'assets.

## 10. Plan de micro-lots recommandé

### A — contrat d'export neutre

Créer un contrat pur `CaptureExportV1` côté laboratoire comme fixture d'intégration.

Il décrit uniquement la forme de données attendue, sans dépendance GenSrpG.

### B — adaptateur créature

Transformer une créature exportée en :

- FighterConfig ;
- membre de roster ;
- référence de présentation.

Premier lot limité à PV/énergie explicitement fournis.

### C — adaptateur compétence

Transformer une compétence exportée déjà sémantique en `SkillDefinition`.

Aucune déduction depuis texte/nom.

### D — adaptateur roster / format

Créer les équipes/acteurs pour 1v1 ou 2v2 depuis une configuration exportée.

### E — bindings visuels/audio

Résoudre uniquement des `assetId` vers les Presentation Bindings du labo.

### F — preview éditeur

Une fixture ressemblant à un export d'éditeur alimente le vrai chemin :

`export -> adapter -> Combat Session -> Presenter -> Animation/FX`

Aucun état final injecté artificiellement.

### G — raccord GenSrpG futur

Seulement après validation explicite :

- GenSrpG produit `CaptureExportV1` depuis ses propriétaires restructurés ;
- le laboratoire/package le consomme ;
- aucun des deux dépôts ne lit le stockage privé de l'autre.

## 11. Risques identifiés

1. **Capacités historiques insuffisamment caractérisées**  
   Ne pas écrire un mapping brut avant preuve de leur schéma sémantique réel.

2. **Confusion stats -> gameplay dynamique**  
   Les stats communes existent, mais le Combat State du labo n'utilise pas encore la majorité d'entre elles.

3. **Énergie**  
   Le labo possède sa propre énergie/recharge. Ne pas supposer que le coût historique Capture a la même unité.

4. **Buffs/debuffs**  
   Le labo ne doit pas compresser les effets historiques en simples tags.

5. **Assets**  
   Les chemins physiques GenSrpG ne doivent jamais devenir des références gameplay.

6. **Substrat Dungeon historique**  
   C'est une dette de l'implémentation actuelle, pas un contrat à conserver.

## 12. Conclusion

Le raccord est techniquement viable.

Le chemin propre n'est pas :

`ancien Capture -> copier-coller -> labo`

mais :

`Capture restructuré / éditeur -> export canonique -> adaptateur pur -> contrats natifs du laboratoire`.

Cette approche permet de développer dès maintenant le futur éditeur de créatures/compétences et la preview combat dans le laboratoire, tout en laissant la Phase 9 GenSrpG remplacer plus tard les producteurs legacy sans réécrire le moteur dynamique.
