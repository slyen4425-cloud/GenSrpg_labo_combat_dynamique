# GenSrpG Lab — marqueurs permanents V1

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Besoin utilisateur

Le créateur souhaite des marqueurs **sans expiration temporelle**. Sur Android, saisir 0 seconde produisait `StatusEffectV1.durationMs must be greater than 0`. Ce n'était ni le signe d'un « illimité » ni une valeur autorisée par le contrat.

L'éditeur expose maintenant **Durée illimitée — jusqu'au retrait ou à la consommation**, indépendamment de la durée en secondes (désactivée lorsque la case est cochée). La permanence vaut **pendant la session de combat en cours**, pas entre deux combats ni entre les rechargements de l'éditeur.

## Autorités uniques et contrat

- `CaptureMarkerV1` offre `permanent:true` sans `durationMs`, à côté des marqueurs temporaires historiques `durationMs > 0`. La normalisation refuse `permanent:true` accompagné d'un `durationMs`, et le JSON reste portable ; aucune valeur sentinelle infinie ou zéro n'est inscrite.
- `StatusEffectV1` accepte `durationModel:"permanent"` **uniquement** pour un marqueur partagé `stack_counter` avec le tag et le préfixe canoniques. `time_ms` et `owner_action_end` gardent strictement leurs règles actuelles.
- `StatusEffectRuntimeInstance` représente la permanence par `expiresAtMs:null` et `remainingActionEnds:null`. La durée n'est pas rafraîchie (elle n'expire pas) lorsque d'autres capacités empilent des charges.
- `StatusEffectRuntime` conserve les marqueurs permanents lors de l'avancement temporel et au retour de réserve. Si le marqueur possède un `periodic` dégâts/soin, `nextTickAtMs` et l'horloge **native** poursuivent le rythme normal, par exemple 3 charges Venin × 5 = 15 dégâts au tick, sans second timer.
- Retrait/consommation partiel ou complet, élimination du statut, protections dégâts et seuil de charges restent propriétaires natifs. Le seuil de K.O. est distinct de la simple expiration ; un marqueur permanent **n'a pas de déclencheur spécial** parce qu'il est permanent.
- L'infobulle existante affiche « Durée : Permanent » ; le HUD affiche **∞** au lieu d'un compte à rebours à zéro, sans barre de progression trompeuse.

## Source, livraison et vérification

Base `gh-pages@8159ab3454ed49f71a35b6cc2a6db12173e2bd47`, checkpoint `checkpoint/lab-start-permanent-markers-2026-10-17`, branche `work/lab-permanent-markers-2026-10-17`.

Sentinelles :
- Contrat / JSON : statut permanent limité aux marqueurs, permanence strictement booléenne, durée temporaire historique, rejet de 0 et combinaison contradictoire.
- Intégration : marqueur avec/sans tick, empilement de plusieurs compétences sur horloge unique, durée de 40 s sans expiration, réduction des dégâts après consommation partielle, suppression complète des ticks, retour de réserve, infobulle « Permanent », anciens statuts temporaires expirant normalement.
- Vrai navigateur Chromium : création d'un marqueur au nom accentué, durée indiquée à 0 mais permanence cochée, enregistrement puis sélection/rechargement, capacité comportant marqueur temporaire et permanent, validation et export via `configuredSkills`.
- Tests complets Foundation et quatre navigateurs sur un seul SHA final avant checkpoint GREEN et `gh-pages`, puis Pages SUCCESS. Essai tactile sur téléphone réel par l'auteur toujours distinct.
