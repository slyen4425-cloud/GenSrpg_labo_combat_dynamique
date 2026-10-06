# Combat expressif — architecture V1

Date : 2026-10-06

## 1. But

Étendre Monster Capture avec davantage de possibilités de création sans ajouter de seconde autorité.

Besoins couverts :

- immunité complète dégâts + états ;
- approche souterraine ;
- pierre-feuille-ciseaux entre surface / aérien / souterrain ;
- attaques explicitement capables d'atteindre certaines présences ;
- action d'esquive avec cooldown ;
- attaques esquivables ou non ;
- ciblage actif ou réserve ;
- effets différés ;
- tempo de mobilité par créature.

## 2. Principe central

Les mécaniques doivent rester orthogonales.

Une capacité ne doit jamais être codée par nom.

Exemple :

`Tornade` n'est pas spéciale parce qu'elle s'appelle Tornade.

Elle peut simplement déclarer qu'elle atteint :

- surface ;
- airborne.

De même :

`Tremblement de terre` peut déclarer :

- surface ;
- underground.

Le Core ne connaît que les contrats.

## 3. Présence de combat

Nouveau concept cible :

`CombatPresenceState`

Valeurs initiales :

- `surface` ;
- `airborne` ;
- `underground`.

La présence est un état sémantique de combat, distinct de la position DOM et du z-index.

### Dérivation

Par défaut :

`surface`.

Pendant la phase de trajet d'une action :

- `approachMode = aerial` -> `airborne` ;
- `approachMode = burrow` -> `underground` ;
- `ground` -> `surface`.

Le Runtime possède déjà les phases temporelles de l'action. La présence transitoire doit donc être dérivée depuis cette action active et son temps, pas pilotée par le renderer.

Le renderer ne fait qu'afficher cette présence.

## 4. Approche souterraine

Étendre le contrat :

`SKILL_APPROACH_MODES`

avec :

`burrow`.

Gameplay :

- préparation normale ;
- pendant le travel : acteur `underground` ;
- impact à l'instant Combat Runtime existant ;
- retour `surface` après impact / récupération.

Présentation :

- Animation Core ajoute un plan `burrow` ;
- disparition sous le sol / déplacement / émergence sont présentation uniquement ;
- aucun watcher de collision souterrain ne devient propriétaire de l'impact ;
- le Runtime reste autoritaire sur le timestamp d'impact.

Le mode `burrow` ne doit pas être implémenté comme un clone de `aerial` avec des conditions dispersées.

## 5. Capacité à atteindre une présence

Nouveau contrat cible de compétence :

`hitPresenceStates`

Exemple :

```json
["surface"]
```

ou :

```json
["surface", "airborne"]
```

ou :

```json
["surface", "underground"]
```

Au moment de la résolution, Combat Rules compare la présence réelle de la cible à cette liste.

Si la cible n'est pas atteignable :

- aucun dégât ;
- aucun debuff ;
- aucun effet immédiat sur la cible ;
- outcome sémantique `evaded` avec cause `presence`.

Cela réutilise le feedback miss existant.

### Compatibilité

Les capacités historiques doivent conserver leur comportement tant qu'elles ne sont pas migrées explicitement.

Le nouveau contrat doit donc avoir une stratégie de compatibilité documentée avant migration en masse.

Aucune migration silencieuse de toutes les compétences.

## 6. Esquive explicite

Le système de réaction existant reste propriétaire.

Une action Esquive est une compétence défensive normale :

- coût énergie configurable ;
- préparation configurable ;
- cooldown configurable ;
- disponibilité calculée par le même Skill cooldown owner ;
- outcome `evaded`.

Extension cible :

- une compétence entrante déclare `dodgeable: true/false` ;
- valeur legacy conservatrice pour les anciennes compétences ;
- l'action d'Esquive générique peut couvrir dégâts + effets négatifs lorsque l'attaque est esquivable.

Aucun bouton d'esquive ne contient de logique métier.

Le bouton ne fait qu'appeler la réaction existante.

## 7. Différence entre portée de présence et esquive

Ces deux règles sont indépendantes.

Exemple :

- une Tornade peut atteindre `airborne` ;
- elle peut néanmoins rester `dodgeable: true`.

Inversement :

- une attaque peut être `dodgeable: false` ;
- mais si elle ne sait pas atteindre `underground`, elle rate quand même une cible souterraine.

Cela crée la base pierre-feuille-ciseaux sans règles spéciales par compétence.

## 8. Immunité complète

L'immunité complète doit être un état persistant, pas une réaction ponctuelle codée dans l'UI.

Concept cible :

`status kind = immunity`

avec domaines initiaux :

- `damage` ;
- `negative_status`.

Exemple :

```json
{
  "kind": "immunity",
  "domains": ["damage", "negative_status"],
  "durationMs": 3000
}
```

Un seul helper Core de protection doit répondre :

`incoming effect -> autorisé / immunisé`.

Les propriétaires existants de dégâts et de statut consomment cette décision.

Interdit :

- un check immunity différent dans chaque compétence ;
- une immunité dans le renderer ;
- une deuxième logique de dégâts.

## 9. Effets différés

Une condition d'activation existante décide si une compétence peut être lancée.

Ce n'est pas la même chose qu'un effet lancé maintenant mais résolu plus tard.

Nouveau concept cible :

`scheduled_effect`.

Exemple :

```json
{
  "kind": "scheduled_effect",
  "trigger": {
    "type": "after_ms",
    "delayMs": 30000
  },
  "effects": [...]
}
```

Owner cible :

`Scheduled Effect Runtime`.

Règles :

- aucune nouvelle horloge ;
- aucun `setTimeout` gameplay par capacité ;
- les effets programmés vivent dans Combat State ;
- Combat Session les avance depuis le même `elapsedMs` que statuses et zones ;
- à échéance ils réutilisent les mêmes primitives damage/heal/status ;
- les futurs triggers conditionnels doivent étendre ce même owner.

## 10. Ciblage de réserve

`RosterSession` reste propriétaire de la réserve.

Le Combat State actif ne doit pas inventer une copie parallèle du banc.

Nouveau contrat cible :

`CombatTargetRefV1`

Deux familles initiales :

- actif : `{ scope: "active", actorId }` ;
- réserve : `{ scope: "reserve", teamId, memberId }`.

SkillDefinition devra pouvoir déclarer où il peut cibler :

- active ;
- reserve ;
- les deux.

La relation allié/ennemi reste distincte de la disponibilité actif/réserve.

Exemples :

- soin d'un allié sur le banc ;
- poison d'une réserve ennemie ;
- buff avant invocation.

Les modifications du membre de réserve doivent passer par Roster Session et ses snapshots.

Les calculs de dégâts / statut doivent être factorisés en primitives pures réutilisables ; ne jamais écrire un second moteur spécial "bench damage".

## 11. Tempo de mobilité créature

Le profil `biped / quadruped / flying / massive / serpentine` reste un profil morphologique de présentation.

La vitesse gameplay ne doit pas y être cachée.

Nouveau champ combat cible :

`approachTimeModifierPct`

ou un preset UI qui écrit explicitement cette valeur.

Exemples UI :

- Très rapide ;
- Rapide ;
- Normal ;
- Lent ;
- Très lent.

Le créateur doit pouvoir voir la valeur réelle appliquée.

Chaîne :

`Skill.travelMs`
-> modificateur permanent de la créature
-> modificateurs temporaires de statut
-> multiplicateur global combat
-> `effectiveApproachTimingMs`.

La compétence conserve donc son temps auteur de base ; la créature influence le temps effectif sans réécrire la compétence.

L'Animation Core reçoit ce temps effectif et adapte son mouvement. Il ne recalcule pas une vitesse gameplay.

## 12. Ordre de résolution cible

Pour une attaque sur acteur actif :

1. target ref valide ;
2. compétence légalement lancée ;
3. progression Runtime ;
4. à l'impact : présence cible vs `hitPresenceStates` ;
5. réaction d'esquive si disponible et attaque `dodgeable` ;
6. immunité / protection ;
7. dégâts ;
8. statuts / effets tactiques ;
9. feedback présentation.

Les owners existants restent responsables de leurs domaines.

## 13. Micro-lots fonctionnels

### Lot A — Presence / reach contract

- `CombatPresenceState` ;
- `hitPresenceStates` ;
- dérivation depuis action active ;
- aucun nouveau mouvement visuel.

### Lot B — Burrow gameplay

- `approachMode = burrow` ;
- présence underground pendant travel ;
- sentinelles d'évasion ;
- puis rendu Animation Core séparé.

### Lot C — Dodge générique

- `dodgeable` ;
- action Esquive générique ;
- cooldown configurable ;
- rejet propre des attaques non esquivables.

### Lot D — Immunity status

- status immunity ;
- protection damage + negative status ;
- primitives uniques.

### Lot E — Scheduled effects

- état programmé ;
- avance via horloge Runtime existante ;
- premier trigger `after_ms`.

### Lot F — Reserve targeting

- `CombatTargetRefV1` ;
- ciblage réserve ;
- mutation via Roster Session ;
- mêmes primitives d'effet.

### Lot G — Creature mobility tempo

- champ combat créature ;
- Fighter config ;
- Combat Timing ;
- UI presets explicites.

### Lot H — Human Editor

Seulement après stabilisation des contrats :

- contrôles lisibles ;
- presets ;
- aucune logique gameplay dans l'éditeur.

## 14. Sentinelles globales à préserver

Chaque lot devra prouver que restent verts :

- projectile collision réelle ;
- ground/aerial/teleport existants ;
- Tempête persistent zone ;
- ticks / Health Delta ;
- cooldown ;
- status ;
- roster recall/invocation ;
- trail / smoke / impact ;
- IA utilisant les mêmes règles que le joueur.

## 15. Interdictions permanentes

- aucune condition par nom de capacité ;
- aucune condition par nom de créature ;
- aucune hitbox gameplay dupliquée dans le renderer ;
- aucune horloge supplémentaire ;
- aucun système de dégâts réserve séparé ;
- aucun `setTimeout` pour Comète ;
- aucun profil visuel qui devient propriétaire de la vitesse gameplay ;
- aucun changement silencieux des valeurs auteur.
