# Mur de glace — fiche Bestiaire et PV visibles (2026-11-02)

## Périmètre
Base : `gh-pages@a0a9a501f1f78faeee40147af577de5f8417ea94`.
Checkpoint initial : `checkpoint/lab-start-wall-bestiary-hp-2026-11-02`.
Branche unique de correction : `work/lab-wall-bestiary-hp-2026-11-02`.
Demande Android : la fiche du Mur de glace doit décrire uniquement l'effet de combat, pas ses coordonnées X/Y de l'éditeur ni une impossibilité d'esquive absurde pour une invocation ; le petit compteur PV du mur doit être lisible même lorsque le mur occupe une grande portion de l'arène.

## Cause racine
- `capture-skill-explanation-v1.js` concaténait directement `placementMode/arenaXPct/arenaYPct` à la phrase de l'effet `summon_entity`, mêlant configuration graphique et description de gameplay. `specialRules` affichait « Cette attaque ne peut pas être esquivée. » pour **tout** `dodgeable=false`, y compris une invocation défensive `self`.
- `CombatEntityOverlayV1` ajoutait le label PV après le sprite en flux vertical `flex`. Avec `visualScale=4` et `visualScaleX=1.5`, il se retrouvait au pied d'un sprite haut de 368 pixels, parfois hors de l'arène. Le même rectangle sprite était déjà utilisé pour la collision : ne pas le déplacer.

## Correction
- Projection pure du même SkillDefinition : `summon_entity` expose ratio PV, statistique et formes interceptées, sans placement ni coordonnées. La règle « attaque non esquivable » est réservée aux compétences offensives ciblant réellement un ennemi. Les données auteur (notamment Glace 2 PV/pt, X47 Y55, scale4 X1,5) et l'éditeur restent intacts.
- Un unique label par entité demeure enfant du même overlay, mais est positionné **hors flux**, au-dessus du sprite. Sa coordonnée verticale est bornée à l'arène visible, avec 6 pixels de marge lorsque l'art déborde au-dessus. Pas de clone, second compteur, double autorité ou modification du rectangle natif de collision, de l'interception, des PV ou du z-index du plan du mur.
- Les points d'entrée Bestiaire HTML/JS, la projection `capture-bestiary-cards-v1`, l'éditeur Capture et le combat 1v1/2v2 utilisent un suffixe de cache commun `wall-bestiary-hp-20261102` pour charger la correction sur smartphone.

## Tests et règles de validation
- RED isolé : `tests/unit/capture-wall-bestiary-hp-2026-11-02.test.mjs`, PR témoin #198 non fusionnée. Couvre le SkillDefinition officiel, les variantes de placement, l'attaque véritablement non esquivable et l'affichage unique du PV.
- Vrai raccord Bestiaire : `captureBestiaryCardsV1` résout le Mur équipé de Gorice depuis les transferts Showcase officiels, sans second catalogue ni description manuscrite.
- Chromium `tests/browser/capture-ice-barrier-editor-smoke.mjs` : label au-dessus du sprite standard, et visible à `visualScale=4`, `visualScaleX=1.5`, `arenaXPct=47`, `arenaYPct=55` dans une arène 400×220 ; vérifie l'unicité du label et l'identité des dimensions de collision avant/après.
- Sentinelle de placement derrière désormais conforme à la projection joueur (pas de géométrie en Bestiaire), tout en conservant validation de l'éditeur et du moteur.
- Critère GREEN : Foundation + quatre tests navigateurs sur le SHA final, checkpoint exact, PR #197 vers gh-pages et contrôle post-fusion. Android manuel distinct. Ne toucher ni à main, ni global-assets, ni aux exports auteur, ni à Combat State/Damage.

