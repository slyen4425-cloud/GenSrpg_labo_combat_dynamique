# Capture — Backlog IA tactique / Esquive et variété V1

Date : 14 octobre 2026 — note de conception, aucune fonctionnalité développée.

## Besoin utilisateur
L'IA de test n'essaie pas d'Esquive et joue trop souvent ses capacités dans le même ordre ; pour le futur jeu réel, ses décisions doivent être tactiques et variées sans perdre les règles de combat déjà validées.

## Diagnostic source
`src/core/combat/battle-actor-ai-controller.js` maintient `skillIndex`, trie par priorité de renforcement des zones puis par rotation des capacités, choisit la première cible vivante, et invoque `runtime.startSkill`. Il n'appelle pas le vrai système d'Esquive/réaction. C'est un contrôleur de démonstration volontairement simple, pas une IA tactique complète.

## Critères futurs (non codés)
1. Réaction Esquive sur la vraie fenêtre de menace et uniquement pour les attaques éligibles, charges et recharge existantes. Ne pas esquiver à chaque fois, ni réagir à une attaque déjà irréversible.
2. Scoring de compétences d'après situation réelle (PV, rôle, soins, résistances, menace, cible, énergie, statuts, cooldown, portée) avec plusieurs choix possibles et sans abus d'un ordre fixe.
3. Paramétrage de difficulté et profils de comportement, tests reproductibles (seed si variation) et interdiction de tricher par accès aux intentions secrètes.
4. 1v1/2v2, allié IA et duo solo préservés ; `CombatRuntime`, `Combat Rules`, `Roster Session` restent propriétaires du résultat.

**Aucun seuil/probabilité/score n'est décidé maintenant.** Ce chantier devra être conçu et validé séparément avant mise en œuvre.
