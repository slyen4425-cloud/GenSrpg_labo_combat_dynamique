# Labo Combat — Stun, Immobilisation et Silence : règles distinctes V1

Date : 13 octobre 2026. Base de départ : `gh-pages@674a274fa52917b2f57776a5b1fe4cf27ec83a8d`, CI et Pages SUCCESS.
Checkpoint avant code : `checkpoint/lab-start-control-status-behavior-v1-2026-10-13`.
Branche isolée : `work/lab-control-status-behavior-v1-2026-10-13`.

## Demande auteur
- **Stun** : contrôle fort, bloque tout et coupe une capacité encore interruptible en préparation. Pas de changement à l'existant.
- **Immobilisation** : interdit le changement de distance et les compétences nécessitant une approche physique/volée/téléportée/souterraine, arrête le trajet **déjà commencé**. Autorise les capacités stationnaires (à distance, buffs, etc.).
- **Silence** : ne doit plus être l'équivalent du Stun ; interdit les capacités **à distance** (projectile, rayon, zone), laisse les attaques de contact et les capacités autonomes sans tir (self/aura). L'auteur veut notamment pouvoir se battre en mêlée sous Silence.

## Cause identifiée
Avant correction, `resolveSkillStart` bloquait **toutes** les compétences sous Silence ; `resolveMovement` vérifiait Immobilisation mais `resolveSkillStart` autorisait toujours une approche, même quand `approachMode` indiquait un mouvement. La boucle Combat Runtime ne stoppait pas les approches déjà en cours quand un statut immobilize était posé.

## Correction par propriétaire, sans deuxième moteur
- `src/core/combat/action-resolver.js` : un même guard de statut autoritaire dans `resolveSkillStart`, rejet `silenced` seulement pour les formes `projectile`, `beam`, `area` ; rejet `immobilized` seulement si `approachMode !== "none"` ; Stun prioritaire, comportement intact. Les rejets précèdent dépenses d'énergie et déclenchement du cooldown.
- `src/core/combat/combat-runtime.js` : après l'avance de l'état canonique et immédiatement après résolution d'une frappe appliquant un statut, consulte le vrai état par `hasActiveStatusKindV1`. Si un acteur immobilisé possède une action de déplacement non encore résolue, appel de `cancelActionsForActor(actorId,{reason:"immobilized"})` **existant**. Son `onInterrupted` existant annule la présentation (FX/mouvement) via `presenter.cancelActionPresentation`. Aucune animation artificielle, aucun second état de contrôle.
- `src/adapters/renderer/status-effect-info-v1.js` : info lisible « déplacement et approches impossibles », et « projectiles/rayons/zones bloqués ; contact et capacités sur soi autorisés ».
- **Aucun changement** aux fiches auteur JSON, au registre des 103 créatures, à leurs capacités/stacks, au statut stun, à la géométrie 1v1/2v2, au gameplay IA, aux sons/assets, au menu Rappel, Esquive, Réserves adverses, `main`, `global-assets` ou autres dépôts.

## Tests et validation
- Sentinelle TDD nouvelle `tests/unit/capture-control-status-semantics-v1.test.mjs` créée **avant code** : refus Silence projectile/beam/area sans dépense, contact autorisé, self/aura autorisées, Immobilisation interdit `move` et approche `ground/aerial/teleport/burrow`, laisse `none`, Stun prioritaire.
- Vrai `createCombatRuntime` testé avec statut entrant durant préparation, pendant trajet au sol et trajet aérien ; doit émettre une seule interruption `immobilized`, retirer l'action et empêcher sa future résolution/impact. Un projectile stationnaire en vol n'est pas annulé par Immobilisation sur son auteur.
- Sentinelle historique `tests/unit/status-effect-runtime-v1.test.mjs` mise en phase avec Silence (forme `projectile`, même contrôle de ressources), autre couverture préservée. Ancienne assertion de tooltip dans `tests/unit/status-info-card-v1.test.mjs` ajustée après échec CI (`38464612765`, 1694 PASS / 1 FAIL uniquement sur texte obsolète), périmètre de test étendu **dans le journal avant modification**.
- CI Foundation et deux navigateurs Chromium requis sur le SHA documentaire final ; checkpoint GREEN exact, publication FF protégée sous lease puis CI + Pages postrelease. Validation visuelle Android du contrôle de l'approche requise séparément.

## Note sur le Stun existant
Le runtime historique interrompt durant la **préparation interruptible** et refuse toute nouvelle capacité, mais ne rembobine pas un projectile déjà lancé. Ce comportement n'a pas été modifié dans ce lot.
