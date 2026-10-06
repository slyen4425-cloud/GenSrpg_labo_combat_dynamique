# Tempête de flammes — Séquence Runtime / renforcement visuel V1

Date : 2026-10-06

## Base

Base exacte :

`9463b6f3539bc8c7f195e8c9558fb576dd7c820d`

Checkpoint de départ :

`checkpoint/lab-start-firestorm-sequence-regression-v1-2026-10-06`

Branche :

`work/lab-firestorm-sequence-regression-v1-2026-10-06`

## Retours utilisateur

Après stabilisation des dégâts :
- la zone semblait parfois rester visuellement au niveau 2 ;
- un délai restait perceptible entre l'activation et l'apparition / renforcement de la zone ;
- le projectile invisible avait disparu mais un impact artificiel sur la cible restait suspect ;
- Tempête semblait moins fluide qu'avant.

## Audit de la fiche auteur

La fiche active `cap_fire_atk_6` n'avait pas changé entre le restore utilisateur et le début de ce lot :

- `form = beam` ;
- `preparationMs = 2000` ;
- `travelMs = 0` ;
- `recoveryMs = 0` ;
- `cooldownMs = 3500` ;
- `persistent_zone` ;
- `reactivation = reinforce` ;
- `maxActivations = 3` ;
- `radiusGrowthSteps = 1` ;
- progression `short → medium → long`.

La préparation de 2 secondes est également présente dans tous les anciens SHA examinés depuis le chantier FX. Elle n'est donc pas une régression récente ni un projectile caché.

## Faute moteur démontrée : horloge de création de zone

Une nouvelle sentinelle utilise ensemble :

- la vraie fiche Showcase Tempête ;
- `CombatSession` ;
- `CombatRuntime` temps réel ;
- le vrai `syncPersistentZones()` du renderer.

Avec la condition réelle `combat_elapsed_ms >= 25000`, la première activation commence à 25 000 ms et son impact réel a lieu à 27 000 ms.

Avant correction, la zone obtenait pourtant :

`appliedAtMs = 29 000`

au lieu de :

`27 000`.

Cause :

`CombatRuntime` avait déjà avancé `state.elapsedMs` pendant les 2 secondes de préparation, puis `resolveSkillCompletion()` ajoutait une seconde fois `impactAtMs` à `state.elapsedMs`.

Conséquences possibles :
- `appliedAtMs` trop tard ;
- `nextTickAtMs` trop tard ;
- `expiresAtMs` trop tard ;
- chaque renforcement pouvait redécaler l'horloge de la zone ;
- sensation de délai / ticks perturbés lors des actions.

## Correction d'horloge

Le Runtime possède désormais le temps combat absolu du début de l'action :

`startedAtCombatMs`.

Lors de la résolution asynchrone, il transmet au Session/Core :

`resolutionAtMs = startedAtCombatMs + impactAtMs`.

Le Core utilise cette valeur uniquement lorsqu'elle est explicitement fournie.

Les chemins synchrones historiques sans Runtime conservent exactement leur fallback précédent.

Fichiers :
- `src/core/combat/combat-runtime.js`
- `src/core/combat/combat-session.js`
- `src/core/combat/action-resolver.js`

Aucune nouvelle horloge n'est créée : Combat Runtime reste le propriétaire du temps réel.

## Séquence réelle vérifiée

La vraie Tempête est maintenant testée ainsi :

- activation 1 : résolution réelle → `short` ;
- activation 2 : résolution réelle → `medium` ;
- activation 3 : résolution réelle → `long`.

La sentinelle vérifie :
- `activations = 1 / 2 / 3` ;
- `radius = short / medium / long` ;
- timestamps réels ;
- même node de zone conservé ;
- `dataset.zoneRadius` suit le Runtime ;
- transformation visuelle short, medium et long distincte.

Le renderer n'est pas une deuxième autorité : il projette uniquement `state.persistentZones`.

### Pourquoi la zone reste medium pendant le troisième chargement

Pendant les 2 secondes de préparation de la troisième activation, la troisième activation n'est pas encore résolue.

La zone déjà active reste donc légitimement au niveau 2 (`medium`) pendant ce temps.

À la résolution, elle passe à `long`.

Le délai restant avant ce passage n'est plus un bug de projectile ou d'horloge : c'est la valeur auteur `preparationMs = 2000`.

## Faux impact cible supprimé pour les capacités zone-only

Le pipeline générique traitait toute résolution `outcome = hit` comme un impact classique.

Tempête :
- dégâts directs = 0 ;
- aucun projectile ;
- seul effet gameplay = `persistent_zone`.

Malgré cela, le planner pouvait générer :
- un FX d'impact sur la cible ;
- un impact audio ;
- une animation `hit` / recul du modèle cible.

Cela donnait exactement l'impression qu'un projectile invisible arrivait au monstre.

### Sémantique Core unique

Le Core expose maintenant :

`persistentZoneOnly = true`

uniquement lorsque :
- au moins un effet existe ;
- tous les effets structurés sont `persistent_zone` ;
- dégâts directs = 0 ;
- soin direct = 0 ;
- pas de stun / interruption directe.

Aucun nom de capacité n'est testé.

Cette règle s'applique donc à toutes les futures capacités purement persistantes.

### Présentation

Pour une résolution `persistentZoneOnly` :
- aucun target impact FX générique ;
- aucun impact audio dérivé de cet FX ;
- aucune animation `hit` artificielle sur la cible ;
- préparation / attaque du lanceur et apparition/renforcement de la zone restent intactes.

Les vrais ticks ultérieurs continuent de produire leurs `-5` via le chemin Health Delta existant.

## TDD

### Horloge / séquence — RED

La première reproduction réelle a démontré :

`29 000 !== 27 000`

pour `appliedAtMs`.

C'était une faute moteur réelle.

### Horloge / séquence — GREEN

Après correction, la reproduction réelle passe :
- short ;
- medium ;
- long ;
- même node ;
- bons timestamps.

CI intermédiaire :

`37456543778`

Résultat :
- 1121 / 1121 PASS.

### Zone-only presentation — RED

Trois nouvelles sentinelles échouaient :
- Core n'exposait pas `persistentZoneOnly` ;
- planner créait encore un impact ;
- presenter faisait encore reculer la cible.

### Zone-only presentation — GREEN

CI :

`37457256376`

Résultat :
- 1123 tests ;
- 1123 PASS ;
- 0 FAIL.

## Ce qui n'a PAS été modifié

- dégâts Tempête : 5 ;
- tick : 1000 ms ;
- durée : 7000 ms ;
- cooldown : 3500 ms ;
- préparation auteur : 2000 ms ;
- scale / scale X / scale Y / offsets du sprite ;
- short / medium / long ;
- règle long autoritaire ;
- géométrie visible ;
- collision ;
- trail ;
- smoke ;
- Asset Library ;
- autres capacités.

## Validation smartphone

À vérifier sur la preview :

1. attendre les 25 s requises ;
2. activer Tempête :
   - la préparation reste 2 s ;
   - pas de projectile invisible ;
   - pas d'impact/recul artificiel de la cible ;
   - la zone apparaît short à la résolution ;
3. deuxième activation :
   - la zone reste short pendant la préparation ;
   - passe medium à la résolution ;
4. troisième activation :
   - la zone reste medium pendant la préparation ;
   - passe clairement long à la résolution ;
5. vérifier que les ticks restent réguliers malgré les attaques et animations simultanées.

Si le seul point restant jugé mauvais est le délai de 2 s lui-même, ce sera alors un choix de configuration auteur à modifier explicitement (`preparationMs`), et non un correctif moteur à masquer.
