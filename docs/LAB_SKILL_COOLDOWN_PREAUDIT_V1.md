# Pré-audit — cooldown réel des compétences V1 — 2026-09-27

## Base autoritaire

Checkpoint GREEN :

`checkpoint/lab-capture-editor-exporter-v2-green-2026-09-27`

SHA :

`e8962df53e2f1cd1230877f2836d0098174ed43b`

Ce lot prépare le cooldown demandé pour l'éditeur humain. Il n'ajoute encore aucun contrôle UI.

## Problème

`SkillDefinition` possède actuellement :

- préparation ;
- trajet ;
- récupération ;

mais aucun cooldown après utilisation.

Le Runtime empêche déjà un acteur de démarrer deux actions simultanément, mais dès qu'une action est résolue l'acteur redevient disponible. Ajouter seulement un bouton désactivé ou un timer UI créerait une seconde autorité et violerait la charte.

## Propriétaires retenus

### SkillDefinition

Propriétaire de la configuration :

`cooldownMs`

Règles :

- nombre fini >= 0 ;
- valeur par défaut `0` pour préserver les compétences existantes ;
- indépendant de `preparationMs`, `travelMs` et `recoveryMs`.

### Combat State

Propriétaire de l'état courant des cooldowns.

Par combattant :

`skillCooldowns: { [skillId]: readyAtMs }`

`readyAtMs` est exprimé dans la même horloge que `state.elapsedMs`.

Aucune horloge supplémentaire.

Helpers cibles :

- lecture du cooldown restant ;
- enregistrement du cooldown d'une compétence ;
- expiration/pruning lors de `advanceCombatTime()`.

### Action Resolver

Propriétaire de la règle de disponibilité sémantique.

`resolveSkillStart()` :

- refuse une compétence encore en cooldown ;
- renvoie `outcome: "cooldown"` ;
- expose `remainingCooldownMs` ;
- ne dépense aucune énergie lors du refus ;
- lorsqu'un démarrage est accepté, enregistre immédiatement le cooldown.

`resolveReaction()` :

- applique la même règle aux compétences de réaction ;
- une réaction acceptée démarre également son cooldown.

### Combat Session

Ne possède aucun timer.

Il commit uniquement le nouvel état retourné par Action Resolver.

### Combat Runtime

Reste propriétaire de l'avancement de l'horloge live en appelant déjà :

`session.advanceMs(deltaMs)`.

Aucun tableau de cooldown Runtime, aucun `setTimeout` par compétence.

### UI / IA

Clients uniquement :

- peuvent demander un preview ;
- peuvent lire le snapshot / remaining cooldown ;
- n'activent ni ne terminent un cooldown.

L'IA passe déjà par Session/Runtime : elle recevra donc les mêmes refus que le joueur.

## Moment de démarrage

Décision V1 :

**le cooldown commence lorsqu'une utilisation de compétence est acceptée et son coût d'énergie est engagé.**

Conséquences :

- attaque normale : cooldown dès le start ;
- attaque ensuite bloquée / esquivée / réfléchie : cooldown conservé ;
- attaque contrée pendant sa préparation : cooldown conservé ;
- attaque interrompue après démarrage : cooldown conservé ;
- projectile clash : cooldown conservé ;
- compétence refusée avant démarrage : aucun cooldown ;
- réaction acceptée : cooldown dès l'acceptation.

Cette règle évite le spam volontaire d'une capacité interrompue ou contrée.

## Relation avec recoveryMs

`recoveryMs` et `cooldownMs` restent deux concepts différents.

- recovery : chronologie/récupération de l'action ;
- cooldown : disponibilité future de cette compétence précise.

Le lot cooldown ne transforme pas recovery en verrou global et ne change pas la chronologie des impacts.

## Structure d'état proposée

Exemple :

```js
fighter: {
  ...
  skillCooldowns: {
    fireball: 8200,
    claw: 4600
  }
}
```

Si `state.elapsedMs === 5000` :

- Fireball : 3200 ms restantes ;
- Griffe : expirée.

Les entrées expirées peuvent être supprimées lors de `advanceCombatTime()`.

## Compatibilité roster

Un cooldown appartient au snapshot du combattant actif.

Le futur raccord roster devra donc préserver `skillCooldowns` au même titre que PV/énergie lorsqu'un membre est rappelé puis réinvoqué.

Ce pré-audit ne modifie pas encore Roster Session ; le lot d'implémentation devra vérifier que `replaceFighter` et les snapshots de roster ne détruisent pas silencieusement cet état.

## Ordre de validation

Pour minimiser les régressions :

### Démarrage normal

1. acteur / cible ;
2. portée existante ;
3. cooldown ;
4. énergie ;
5. création de l'action ;
6. dépense énergie + cooldown dans le même état résultant.

### Réaction

1. réaction applicable ;
2. portée existante ;
3. cooldown ;
4. énergie ;
5. fenêtre temporelle ;
6. dépense énergie + cooldown si acceptée.

Aucun état n'est muté sur un refus.

## API observable cible

Refus :

```js
{
  ok: false,
  outcome: "cooldown",
  skillId: "fireball",
  remainingCooldownMs: 1350,
  state
}
```

Le moteur UI pourra plus tard afficher cette valeur sans la calculer lui-même.

## Tests obligatoires du futur lot

1. `SkillDefinition.cooldownMs` : défaut 0 + valeur explicite ;
2. state initial : cooldown map immutable ;
3. start accepté : cooldown enregistré à `elapsedMs + cooldownMs` ;
4. second start avant échéance : refus `cooldown`, zéro dépense ;
5. autre compétence du même acteur reste utilisable ;
6. advanceMs fait expirer le cooldown ;
7. cooldown 0 préserve le comportement historique ;
8. action contrée/interrompue conserve le cooldown ;
9. réaction utilise la même mécanique ;
10. reset efface naturellement les cooldowns ;
11. roster / replace fighter ne crée pas de fuite d'état ;
12. Runtime ne possède aucune horloge cooldown ;
13. tests IA existants restent GREEN ;
14. aucune UI/renderer modifiée.

## Interdits

- timer par bouton ;
- `Date.now()` dans Action Resolver ;
- tableau cooldown dans Demo UI ;
- second ticker dans Combat Runtime ;
- cooldown déduit de la durée d'un son ou FX ;
- cooldown codé dans une capacité par son nom ;
- raccourci spécial pour 1v1/2v2 ;
- modification de dégâts/impact pour ralentir artificiellement le rythme.

## Conclusion

Chaîne autoritaire cible :

`SkillDefinition.cooldownMs`
-> `Action Resolver`
-> `Combat State.skillCooldowns`
-> `Combat Session`
-> horloge existante `Combat Runtime -> advanceMs()`
-> UI/IA en lecture.

Le prochain lot peut donc implémenter un vrai cooldown sans rustine et sans créer une seconde horloge.
