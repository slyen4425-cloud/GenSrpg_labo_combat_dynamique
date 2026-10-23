# Présence aérienne après contact — protection pendant le piqué (2026-10-23)

## Constat de l'auteur
La trajectoire publiée par la PR #78 fonctionne mieux : décollage, piqué, dégâts au passage, traversée et retour. En revanche, le joueur reçoit encore des dégâts d'attaques ordinaires alors que sa créature est visiblement en plein vol.

## Diagnostic
Les dégâts de l'attaquant aérien sont résolus au **premier contact réel** via `CombatRuntime.reportActionContact`, souvent avant la fin du voyage prévu par Animation Core. L'ancien `enterRecovery` effaçait immédiatement l'action si `recoveryMs=0`, puis l'évaluation défensive (`targetActionContext`) ignorait tout `targetRecord.resolved`. Ainsi la décision native `combatPresenceForActionContextV1` n'avait plus le contexte de l'attaque aérienne, malgré le piqué toujours visible.

## Contrat de correction
- **CombatRuntime**, unique propriétaire de l'action et de l'horloge, conserve son record de vol jusqu'à la **fin du travel nominal d'origine**, après résolution prématurée de la touche ; les dégâts sont résolus immédiatement et une seule fois.
- Le seul marqueur `record.aerialFollowThrough` est un état interne de **ce même record d'action** (pas un statut supplémentaire, ni un bouclier). Le `targetActionContext` est encore fourni à Combat Rules même si le record est déjà résolu, tant que le travel natif se poursuit.
- Le calcul **unique** `skillPresenceReachV1` décide toujours si la cible est `airborne` et accessible : attaque ordinaire offensive = esquivée ; portée explicitement `hitPresenceStates:[..., "airborne"]` = touche. Pas de changement de compétences, ni d'exception codée à un ID d'attaque.
- `movementActive` reste actif jusqu'à la fin nominale et est effacé par le même `removeRecord`. Nouvelle action bloquée tant que le vol n'est pas terminé.
- Annulation/KO/stun/immobilisation pendant cette traversée passent par les callbacks existants : l'animation est annulée normalement ; la présence n'est pas conservée indéfiniment.
- Après la fin du piqué nominal, la créature redevient cible ordinaire. Le segment purement visuel `aerial-home` n'étend pas le temps des effets de combat : son timing reste l'autorité Animation Core et n'est pas recopié dans CombatRuntime.

## Protection anti-régression
Tests d'intégration réels `CombatRuntime + CombatSession` :
1. Contact du joueur à t=300 ms pour un vol nominal de 1600 ms ; adversaire frappe à t=700 ms : cible aérienne, esquive, aucun dégât.
2. Même scénario, attaque adverse explicitement anti-air : dégâts normaux à t=700 ms.
3. Après t=1600 ms, attaque ordinaire reçoit normalement sa résolution, déplacement inactif, aucun dommage aérien rejoué, nouvelle action disponible.
4. Annulation `stun` après le contact annule réellement l'approche via l'unique callback d'interruption, sans immunité fantôme.

À vérifier : suite CI Foundation et 4 navigateurs, puis validation visuelle réelle Android par l'auteur.
