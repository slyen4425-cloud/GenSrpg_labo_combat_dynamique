# Esquive foudroyante — statut `auto_dodge` V1

Date : 14 octobre 2026.

## But
Donner à l'éditeur de capacités Capture une **mécanique réutilisable** d'Esquive automatique durant X secondes ; l'auteur pourra créer lui-même la capacité « Esquive foudroyante » en sélectionnant le statut **Esquive automatique (durée X)** comme effet `apply_status` sur soi. Aucune capacité personnelle, créature ou effet visuel inventé ou modifié.

## Contrat et règles
- Nouveau `StatusEffectV1.kind = "auto_dodge"`, polarité **beneficial** et `durationModel = "time_ms"` obligatoire ; durée variable `durationMs`, renouvelable avec `stacking: "refresh"` ou `replace`. Le contrat existant gère la durée, l'expiration et l'export/import de l'effet.
- `ActionResolver.resolveSkillCompletion` lit le statut **actif au moment réel de l'impact** depuis `CombatState.elapsedMs` (ou la date absolue explicitement fournie) : les attaques **offensive**, dirigées contre le porteur, `dodgeable !== false`, sont résolues en `evaded` et portent `evasionReason="auto_dodge"`. Les 4 formes de test (contact, projectile, beam, area) sont couvertes. Pas de dégâts de contact ni statut malus au toucher, aucun counter/thorns déclenché par un faux Hit.
- L'issue forcée, les collisions native Beam/Projectiles et les réactions explicites restent prioritaires. Une attaque `dodgeable:false` traverse ce buff. Soins, capacités personnelles, DoT/HoT, dégâts de zone persistante (sans attaque ciblée), attaques d'effets multi-cibles `all_enemies/all_allies/all_except_self/*reserves` et autres résolutions spécialisées restent inchangés : ce statut n'est **pas** l'immunité aux dégâts et ne doit pas empêcher de toucher un partenaire en 2v2.
- Le buff ne dépense pas de charge et n'active pas la mécanique du bouton Esquive rechargeable ; il ne crée aucune nouvelle horloge, timer ou intervalle.
- Human Editor : menu de type de statut « Esquive automatique (durée X) », polarité forcée « Bénéfique », durée (secondes) déjà disponible, empilement et ID statut via le contrat existant. Fiche statut explique qu'il esquive les attaques ciblées, pas des dégâts ambiants.

## Périmètre de modification
- Contrat : `src/contracts/status-effect-v1.js`.
- Résolution réelle : `src/core/combat/action-resolver.js`.
- Auteur : `src/ui/capture-editor-human-v2.js`.
- Projection : `src/adapters/renderer/status-effect-info-v1.js`.
- Sentinelle : `tests/unit/capture-auto-dodge-status-v1.test.mjs`.
- Présent rapport et `docs/LAB_CURRENT_WORK.md`.
- Aucun autre code/asset édité ; IA Capture V1 déjà publiée sur la base initiale préservée, pas de modification à `battle-actor-ai-controller`. Tous les JSON d'exports utilisateur inchangés.

## Tests / publication
- Premier test RED : `ca35bbd2da16c3b3daccaadb01570538a1c8b4d3` ; règle créée et sentinelle native ; Foundation de code `1722 PASS / 0 FAIL`, et Chromium Firestorm SUCCESS lors de l'essai initial `38517850671`. Chromium bibliothèque créatures a rencontré une **expiration de délai externe à 50s au démarrage du navigateur** ; reprise du seul job échoué et gates CI complètes requis avant déclaration GREEN.
- Contrôles du vrai contrat : auto-buff/self via `CombatSession.useSkill`, `evaded` contact/projectile/beam/area, suppression des dommages et status ennemis on-hit, attaques `dodgeable:false` autorisées, expiration exacte au 3000e ms et 2v2 sans protection du partenaire.
- Android paysage : test manuel à effectuer après publication (look/FX de l'esquive, durée et ciblage).

## Exemple de paramétrage auteur
Créer une compétence personnelle de catégorie Buff/Debuff et sélectionner **Appliquer un statut → Esquive automatique (durée X)**, cible soi, polarité « Bénéfique », puis régler « Durée (secondes) », énergie, chargement, cooldown, visuels et son librement. La mécanique protège dès que le statut est effectivement appliqué, non pendant la préparation du sort.

Cette V1 reste volontairement limitée aux attaques offensives dirigées vers une cible individuelle. Les attaques à zones multi-cibles et dommages persistants nécessiteront une règle d'esquive par victime distincte si l'auteur souhaite également les esquiver.
