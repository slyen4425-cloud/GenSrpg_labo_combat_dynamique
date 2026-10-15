# Onde expansive — puissance de projectile sur collision réelle

15 octobre 2026. Lot isolé à partir de `gh-pages@09eb408f85934b1cdf8f48b66f36ec24f1a2fcd8`. Checkpoint `checkpoint/lab-start-expanding-wave-projectile-power-2026-10-15`, branche `work/lab-expanding-wave-projectile-power-2026-10-15`.

## Auteur

Le réglage EXISTANT `projectileClash.power` dans Human Editor > Puissance de projectile s'applique aux capacités de forme `projectile`, y compris `projectileTargeting: "expanding_wave"`. La plage est le nombre positif/nul habituel ; zéro signifie « aucun affrontement de puissance ». Le champ est fidèlement importé/exporté par `SkillDefinition`. Aucun sprite, capacité ou créature auteur n'est modifié automatiquement.

## Deux propriétaires sans duplication

- `DomSkillFxRenderer` utilise le même shell animé (sprite ou anneau CSS provisoire) et la surveillance RAF déjà en place pour rechercher le **balayage continu du bord de l'onde** sur la **position écran réelle** du projectile adverse. La routine pure `sweptExpandingWaveMeetsProjectileV1` résout l'intersection géométrique avec l'évolution du rayon entre deux frames ; un projectile éloigné ne déclenche rien, le mouvement rapide n'est pas systématiquement raté.
- L'interface 1v1 et 2v2 passe un signal de contact `onProjectileClashContact` au `CombatRuntime.reportProjectileClashContact`. Ce dernier vérifie acteurs, cibles réciproques, statut release/résolution, horloge et puissance ; aucune donnée de dégâts n'est calculée dans le renderer.
- Le propriétaire existant `resolveProjectileClash` réalise toujours le **seul** règlement : puissance plus forte survit, faible annulée, égalité mutuelle, aucune blessure causée par le clash. Visuels et sons s'annulent via `presentOutcome` et leurs handles déjà existants ; le gagnant conserve sa trajectoire.
- `projectileClashCandidate` (vieil algorithme temporel à intersection fictive au milieu du terrain) continue à IGNORER les ondes. On ne déclenche plus de clash fantôme quand les attaques ne se rencontrent pas.

## Limites exactes V1

- Affrontement sur **contact spatial onde / projectile mobile opposé**, pour deux tirs dont les actions visent des acteurs réciproques. En 2v2, ce premier lot ne traite pas les tirs vers un troisième acteur sans cible réciproque, les clashes onde/rayon continu, onde/onde ni les dégâts multi-cibles : requièrent une extension du propriétaire CombatRuntime et de la géométrie.
- Le projectile ordinaire conserve sa trajectoire, sa collision alpha avec le modèle et son pouvoir ; l'onde conserve ses collisions alpha avec la cible (sol et air), et son échec si elle ne touche jamais la cible. Les dégâts et résistances restent dans CombatSession. La collision de projectile est sondée tant que l'onde animée est active, sans nouveau scheduler.
- Aucun nouveau média : si l'animation de sphère de feu auteur n'est pas raccordée, l'anneau CSS préexistant reste explicitement un **fallback visuel provisoire**. Aucun asset final n'est prétendu livré.

## Critères GREEN

Test `tests/integration/expanding-wave-projectile-clash-v1.test.mjs` : puissance conservée dans plan visuel, géométrie (onde fixe/croissance + projectile en mouvement rapide + lanes séparées), non-regression midpoint, moteur réel puissances égale/supérieure/inférieure et protection anti-double-résolution, zéro/identifiants inconnus, raccord commun 1v1/2v2. Sentinelles expanding sphere, projectile clash, miroir, skyfall et collisions normales incluses dans CI.
Trois jobs (foundation, firestorm-zone-growth-browser, creature-library-browser) attendus SUCCESS au SHA final, checkpoint GREEN et livraison fast-forward `gh-pages` sous lease, puis CI et Pages. Validation physique smartphone par l'auteur distincte.
