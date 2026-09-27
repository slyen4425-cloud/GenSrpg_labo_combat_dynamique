# Laboratoire Combat Dynamique — Audit Capture -> adaptateur portable

Date : 2026-09-27

## 1. Objet

Préparer un futur raccord entre le mode Capture de GenSrpG et le moteur de combat dynamique du laboratoire sans :

- importer le runtime historique Capture ;
- créer une dépendance runtime au dépôt `Zombicide-40k` ;
- lire directement le DOM, les globals, les sauvegardes ou les chemins d'assets de GenSrpG ;
- dupliquer Combat Rules, Combat Runtime, Roster Session ou Presentation Assets.

Chaîne cible :

```
GenSrpG Capture / éditeur
        |
        v
export portable versionné
        |
        v
Capture Adapter du laboratoire
        |
        +--> FighterConfig
        +--> SkillDefinition
        +--> RosterDefinition
        +--> BattleFormatDefinition
        +--> Presentation Asset Bindings
        |
        v
Combat Session / Runtime / Presenter existants
```

Le dépôt principal est consulté en lecture seule pendant cet audit.

## 2. Source GenSrpG auditée

Dépôt :
`slyen4425-cloud/Zombicide-40k`

Référence de restructuration consultée :
`work/gensrpg-phase7-dungeon-generated-room-create-restore-2026-09-27`

Production `main` reste gelée sur :
`e8681f9823573ced8aec59c8ddc47a72b02bc663`.

La roadmap GenSrpG prévoit explicitement en Phase 9 de séparer Monster Capture dans
`assets/gensrpg/capture/`.

Le contrat cible actuel :
`assets/gensrpg/capture/module-contract-v1.json`

déclare comme responsabilités futures :

- Monster Capture runtime ;
- créatures ;
- biomes ;
- capture ;
- équipe / réserve ;
- combat Capture.

Ce module est encore `contract-only-not-loaded`.

## 3. État réel du Capture historique

La cartographie Phase 2 prouve que Capture reste aujourd'hui stratifié dans des blocs inline historiques.

Chaîne principale identifiée :

- `captureGameplayModalMount` ;
- `capturePlaytestFix128` ;
- `captureFix129` ;
- `captureFix130` ;
- `captureFix131` ;
- `captureFix132` ;
- `captureFix133` ;
- `captureFix134` ;
- `captureFix135` ;
- `captureFix136` ;
- `captureFix137` ;
- `captureFix138` ;
- `captureFix139` ;
- `captureFix140` ;
- `captureItems141` ;
- `captureBuffs142` ;
- `captureBuffFx143` ;
- `captureAbilityTruth144` ;
- `builtinMonsterCapture162`.

Frontières démontrées par la restructuration :

- `captureFix139` est le meilleur noyau actuel de l'entrée publique Capture ;
- `captureAbilityTruth144` est le dernier propriétaire de la résolution sémantique des capacités Capture ;
- `captureRenderBattleLive` reste un renderer historique stratifié et ne doit pas devenir une dépendance du laboratoire ;
- le seed `builtinMonsterCapture162` possède le profil, dresseur, roster et capacités de démonstration actuels ;
- Shell / Dungeon / Core possèdent encore plusieurs coutures de compatibilité autour de Capture.

Conclusion : **ne pas copier cette chaîne dans le laboratoire**.

## 4. Données Capture dont la propriété est déjà caractérisée

### 4.1 Profil et identité de mode

Le scénario navigateur officiel verrouille actuellement :

- profil intégré : `Monster Capture` ;
- `gameStyle = "dungeon"` pour le substrat historique ;
- famille de contenu : `creature` ;
- profil gameplay : `creature` ;
- module `capture = true` ;
- module `controllableCreatures = true` ;
- `heroPool` utilisé pour le dresseur.

Ces champs servent au Shell et au démarrage de mode.

Ils **ne doivent pas entrer dans Combat Core**.

### 4.2 Progression Capture

Famille persistée :

`gensrpg_capture_progress_v2_<profileId>`

Capture reste propriétaire des règles métier ; Core Storage ne possède que la sérialisation générique.

Defaults caractérisés :

- `xpMultiplier: 1` ;
- `statCap: 300` ;
- `statPointsPerLevel: 5` ;
- `talentEvery: 5` ;
- `maxMoves: 4` ;
- `moveRelearn: "free"`.

Ces règles sont importantes pour l'éditeur Capture, mais elles sont **hors du paquet de combat dynamique minimal**.

### 4.3 Session / roster

Le Capture courant possède déjà :

- sélection d'un dresseur ;
- sélection d'une créature starter ;
- participants ;
- équipe / réserve ;
- monde Capture ;
- état de session.

Le laboratoire possède déjà un propriétaire propre pour le roster :
`src/core/combat/roster-session.js`.

Aucun writer de sauvegarde Capture ne doit être importé.

### 4.4 Capacités

La résolution historique est finalement possédée par
`captureAbilityTruth144`.

Le laboratoire possède déjà un contrat explicite :
`src/contracts/skill-definition.js`.

Le futur raccord doit donc **traduire les données de capacité** au lieu de transporter
`captureBattleApplyAbility`.

## 5. Contrats cibles déjà disponibles dans le laboratoire

### 5.1 FighterConfig / Combat State

Le fighter normalisé accepte aujourd'hui :

- `id` ;
- `maxHp` ;
- `initialHp` / `hp` ;
- `maxEnergy` ;
- `initialEnergy` / `energy` ;
- `energyChargeAmount` ;
- `energyChargeIntervalMs` ;
- `energyChargeProgressMs` ;
- `movementEnergyPerStep` ;
- `chargeTimeModifierPct` ;
- `chargeTimeEffects`.

### 5.2 SkillDefinition

Le contrat possède déjà :

- `id`, `name` ;
- catégories `offensive / defensive / heal / buff_debuff / counter` ;
- formes `contact / projectile / beam / area / self / aura` ;
- `element` ;
- `approachMode` ;
- `energyCost` ;
- `preparationMs` ;
- `travelMs` ;
- `recoveryMs` ;
- distances autorisées ;
- relations de cible `enemy / ally / self / any` ;
- réactions block / reflect / immune / counter / evade ;
- esquive de trajet ;
- effets damage / heal / interruption / stun / tags ;
- interactions projectile via `projectileClash`.

### 5.3 Roster Session

Un membre de roster possède :

- `id` ;
- `creatureId` ;
- `displayName` ;
- `fighterConfigId`.

Le Roster Session conserve les snapshots PV / énergie entre rappel, invocation et remplacement KO.

### 5.4 BattleFormatDefinition

Le format de bataille sépare :

- acteurs ;
- équipes ;
- contrôleurs ;
- acteur local ;
- `creatureId` ;
- `fighterConfigId`.

Le 1v1 et le 2v2 peuvent donc rester des formats de combat, pas des variantes du moteur.

### 5.5 Présentation / assets

La démo du laboratoire possède déjà une séparation :

`AssetDefinition -> Asset Binding -> Presenter / FX / Audio`

Une compétence peut lier par `assetId` :

- icône ;
- cast FX ;
- projectile/travel FX ;
- impact FX ;
- sons ;
- anchors ;
- layers ;
- options de lecture.

Aucun chemin physique GenSrpG ne doit entrer dans SkillDefinition.

## 6. Matrice GenSrpG Capture -> laboratoire

| Source Capture | Destination labo | Traitement |
| --- | --- | --- |
| identifiant créature | `creatureId` / fighter id logique | traduction directe |
| nom créature | `displayName` | traduction directe |
| PV / PV max | FighterConfig | normalisation |
| énergie / ressource de combat | FighterConfig | normalisation vers énergie du moteur |
| vitesse/recharge de ressource | FighterConfig | traduction explicite si donnée disponible |
| mouvement / coût | FighterConfig | traduction explicite |
| capacité id / nom | SkillDefinition | traduction directe |
| dégâts | `effect.damage` | normalisation |
| soin | `effect.heal` | normalisation |
| élément | `element` | table de normalisation data-driven |
| type attaque | `category + form + approachMode` | traduction, jamais inférence renderer |
| coût | `energyCost` | traduction |
| temps de charge | `preparationMs` | traduction |
| trajet | `travelMs` | traduction |
| récupération | `recoveryMs` | traduction |
| portée | `allowedDistances` | traduction |
| cible allié/ennemi/soi | `targetRelations` | traduction |
| blocage / renvoi / immunité | `reaction` | traduction explicite |
| équipe / réserve | RosterDefinition | traduction |
| combat 1v1 / 2v2 | BattleFormatDefinition | construction du format |
| icône/sprite/son | Presentation binding par `assetId` | jamais dans gameplay |
| profil visuel créature | Creature Profile / binding | traduction séparée |
| progression XP/talents | hors Combat Package | reste Capture |
| monde / biome / jour | hors Combat Package | reste Capture |
| boutique / loot | hors Combat Package | reste Capture |
| sauvegarde locale | hors adaptateur | reste GenSrpG / Storage owner |

## 7. Ce qui peut être réutilisé

Réutilisable conceptuellement / par données :

- identité des créatures ;
- stats nécessaires au combat ;
- liste de capacités ;
- effets sémantiques de capacités ;
- équipe / réserve ;
- sélection du format de combat ;
- IDs d'assets une fois les catalogues alignés ;
- règles de progression dans un futur éditeur Capture, mais hors moteur de combat.

Réutilisable **directement comme code historique : rien**.

Le code historique est une source de comportement à caractériser, pas une bibliothèque à importer.

## 8. Ce qui doit être traduit

Nécessite une table / fonction de traduction explicite :

- anciens types de capacités -> `category/form/approachMode` ;
- anciennes portées -> `short/medium/long` ;
- ancienne ressource de capacité -> énergie du moteur ;
- buffs/debuffs historiques -> effets supportés par Combat Rules ;
- résistances / immunités -> règles sémantiques explicites ;
- assets historiques -> `assetId` stables ;
- composition d'équipe Capture -> Roster + BattleFormat.

Une traduction inconnue doit produire une erreur/diagnostic clair ; elle ne doit jamais choisir silencieusement une valeur arbitraire.

## 9. Legacy à ne jamais importer dans le laboratoire

- blocs `captureFix128..144` ;
- DOM du Hub / battle sheet Capture ;
- `captureRenderBattleLive` ;
- wrappers `startConfiguredGame` ;
- logique Shell ;
- globals `window.*` ;
- stockage `localStorage` Capture ;
- timers/retries de transition historiques ;
- writers de progression ;
- détection de contexte Dungeon/Capture ;
- chemins GitHub/GenSrpG codés dans les compétences ;
- logique shop/loot/world dans Combat Core.

## 10. Contrat portable recommandé

Le futur export doit être un objet JSON autonome et versionné, conceptuellement :

```json
{
  "schema": "capture-combat-package",
  "version": 1,
  "creatures": [],
  "skills": [],
  "rosters": {},
  "battleFormat": {},
  "presentation": {
    "creatures": {},
    "skills": {}
  },
  "metadata": {}
}
```

Règles :

- aucun callback ;
- aucune fonction ;
- aucun DOM ;
- aucun storage handle ;
- aucune URL du dépôt principal ;
- aucune référence à un global GenSrpG ;
- IDs stables uniquement ;
- le package contient uniquement les données nécessaires au combat/prévisualisation ;
- progression, monde, biomes, boutique et sauvegarde restent hors package minimal.

## 11. Répartition des responsabilités du futur pont

### Côté GenSrpG — futur, pas dans ce chantier

Un exporter Capture-owned devra :

1. lire les données canonique de l'éditeur Capture ;
2. construire le package portable ;
3. garantir la version du schéma ;
4. ne pas contenir le moteur de combat dynamique.

### Côté laboratoire

Un importer/adaptateur devra :

1. valider le package ;
2. convertir les fighters via Combat State ;
3. convertir les capacités via `normalizeSkillDefinition()` ;
4. construire roster et format de combat ;
5. résoudre les bindings de présentation par `assetId` ;
6. retourner des diagnostics structurés pour les champs non supportés.

### Combat Core

Aucun changement de propriété.

## 12. Ce que l'audit permet de construire immédiatement

Sans toucher à GenSrpG, le laboratoire peut maintenant ajouter par micro-lots :

1. contrat `CaptureCombatPackageV1` pur ;
2. fixture de package exporté ;
3. adaptateur pur package -> contrats existants ;
4. tests d'erreurs de traduction ;
5. prévisualisation de ce package dans le combat 1v1 ;
6. même package dans le format 2v2 ;
7. UI d'édition/prévisualisation du package ;
8. import/export JSON local du package.

Cette UI deviendra ensuite le prototype du futur raccord éditeur.

## 13. Point volontairement non figé

Les noms exacts des champs legacy internes de `builtinMonsterCapture162` et des couches 128-144
ne sont **pas** inscrits comme dépendance du contrat.

C'est volontaire :

- ils appartiennent au runtime historique ;
- leur extraction exacte relève du futur exporter GenSrpG ;
- le laboratoire doit rester stable si ces structures changent pendant la restructuration.

Si un futur chantier GenSrpG doit écrire l'exporter à partir du runtime encore inline,
la règle d'accès au gros `index.html` de la charte GenSrpG devra être appliquée avant modification.

## 14. Décision d'architecture

**GO pour un adaptateur portable, NO-GO pour une copie du code Capture.**

Le prochain micro-lot peut créer le contrat et l'importer pur dans le laboratoire,
sans dépendance à `Zombicide-40k`.
