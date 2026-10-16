# Onde sphérique expansive — collisions indépendantes en 2v2 (16/10/2026)

## Contrat fonctionnel

- Une capacité `form=projectile` / `projectileTargeting=expanding_wave` conserve l'unique sprite, l'unique animation de croissance et l'unique puissance de projectile d'origine.
- En 2v2, **les deux adversaires actifs sont évalués séparément** lorsque le même anneau balaie les pixels opaques de chaque modèle (sol ou air selon `hitPresenceStates`). Une créature ne peut être évaluée qu'une fois par lancement. Les alliés ne sont jamais des cibles possibles.
- Le moteur `CombatRuntime` accepte/refuse chaque contact réel pendant la fenêtre release/impact ; `CombatSession.completeExpandingWaveTarget` réutilise **`resolveSkillCompletion`** pour calculer dégâts, résistance, immunité, effets ciblés, DoT, auto-esquive et réaction. La dépense d'énergie, cooldown, compteur d'utilisations et actions propriétaire n'existent qu'une fois au début de l'action.
- La première cible touchée ou mise K.O. n'arrête pas la progression de l'onde. Lorsque la fin de croissance est atteinte, le Runtime termine l'action sans nouveau dégât ni faux « raté ». Si aucun adversaire n'a été touché, le raté canonique s'applique comme avant.
- Le 1v1 et les projectiles ordinaires conservent leur `reportActionContact` et leur cancellation historiques. Le 2v2 active explicitement le nouveau chemin. Aucun timer de dégâts ni duplicata de shell n'est introduit.
- Aucun changement à l'opacité à 18 % du repère feu persistant, à l'onde validée, aux visuels/audios auteurs, aux règles de la zone Firestorm, aux données du jeu, ni aux dépôts GenSrpG/exploration.

## Autorités et limites

- `DomSkillFxRenderer` : la géométrie visible et l'échantillonnage des deux modèles, à partir de la même WAAPI/DOM shell.
- `CombatRuntime` : époque de l'attaque, filtre des contacts dupliqués, progression, KO/interruption et événement de résolution.
- `CombatSession` + `action-resolver` préexistant : effets gameplay canoniques, sans second système de dégâts.
- `Combat 2v2 UI` : transmet seulement les identifiants de modèles ennemis à surveiller et présente chaque impact. Aucun dégât calculé dans l'UI.
- **Non étendu dans ce lot** : affrontement de puissance contre le projectile d'un troisième acteur non réciproquement visé, onde/onde, onde/beam et effets globaux `all_enemies` déjà diffusés par le moteur (ces derniers sont délibérément exclus des contacts secondaires pour éviter un double effet). Les effets `target` normaux sont gérés par cible. Définir un véritable mode AOE global au-delà de deux acteurs exigera un contrat distinct.

## Preuves

- `tests/integration/expanding-wave-2v2-multitarget-v1.test.mjs` : deux touches uniques + une dépense, allié exclu, absence de contact fantôme, cible K.O. avant deuxième contact, sentinelle de collision opaque à chaque distance.
- `tests/browser/expanding-wave-2v2-smoke.mjs` : DOM Chromium + vraie animation Web Animations calée sur l'horloge virtuelle de CI, un shell animé, coordonnées calculées par le navigateur, deux ennemis touchés depuis chaque équipe sans affecter les alliés.
- En complément, la CI exécute les tests Foundation, navigateur Firestorm et navigateur Creature Library. La validation finale doit concerner le SHA exact de publication et le checkpoint GREEN correspondant. Validation tactile/esthétique Android par l'auteur distincte.
