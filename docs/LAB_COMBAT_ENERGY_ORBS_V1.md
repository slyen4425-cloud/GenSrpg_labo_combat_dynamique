# Capture Combat — HUD énergie en orbes remplissables V1

Date : 2026-10-10. Dépôt `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande

Remplacer la petite barre énergie peu visible du HUD de combat par des ronds lumineux remplissables, lisibles sur smartphone en paysage, sans modifier les règles de recharge ou les coûts des capacités.

## Frontières et raccord natif

- L'unique source de vérité reste `Combat State.fighters[localActorId].energy/maxEnergy` ; `src/ui/combat-2v2-test-ui.js` continue à lire le snapshot natif dans sa fonction existante `renderState`.
- Le nouveau composant purement graphique `src/adapters/renderer/combat-energy-orbs-v1.js` projette ce nombre vers des <span> de la vue ; il n'a ni compteur de gameplay, ni timer, ni écouteur global.
- `examples/dom-demo/capture-editor-v2.html` ajoute le support `[data-combat-energy-orbs]`, en conservant l'ancien <progress> technique sous `[data-combat-energy]` pour compatibilité. Le nombre exact `[data-combat-energy-value]` reste affiché.
- `examples/dom-demo/demo.css` possède le dessin des orbes par CSS : cercle, contour, reflets, remplissage vertical bas→haut, transition courte au changement de valeur, animation désactivable via `prefers-reduced-motion`.
- Un orbe par point pour max ≤ 12 (une charge partielle remplit partiellement le cercle). Pour un maximum supérieur à 12, 12 orbes proportionnels représentent la réserve complète ; le total exact reste dans la valeur numérique, sans perte de précision métier.
- La créature remplacée peut changer `maxEnergy` : le renderer reconstruit uniquement le nombre d'orbes nécessaire. Lorsque seul `energy` change, il réutilise les noeuds existants pour éviter les clignotements et préserver la transition.
- Accessibilité : groupe de cercles `role=img` nommé avec les nombres courants en français ; chaque cercle décoratif est masqué à l'accessibilité, l'ancienne barre technique est conservée hors de la vue et masquée aux lecteurs d'écran pour éviter un doublon.

## Tests, risques, limites

- RED TDD : `tests/unit/capture-combat-energy-orbs-v1.test.mjs`, commit `47c57d4f607b210b60e6510e85d3f5f1e74a4cc7`, Laboratory CI `38041983196` FAILED attendue (module graphique manquant).
- GREEN code initial : commit `f6d809fc904af4321051dfdbceecce70bc51d956`, Laboratory CI `38042074133` SUCCESS : les tests Foundation Node, navigateur bibliothèque, navigateur Firestorm sont tous verts.
- Renforcement : test navigateur Chromium sur page native, 5/12 orbes, demi-orbe 50 %, largeur 180px, 6/24 projetés correctement, contraste sémantique et aria-label. Test ajouté au commit `ad3cad0cc9ab30aa9f58ee7cabffda521d513ffb`. Son run final doit passer avant checkpoint GREEN.
- Protections : cinq slots de compétences, esquive, roster, autres statuts, règles d'énergie et FX sont inchangés. Aucun média / preset auteur / data creature / asset ajouté ou modifié.
- Limites : la barre de recharge est remplacée par des **paliers réels**. Entre deux gains natifs, un cercle ne s'anime pas en prévision d'une récupération future ; seule la transition après l'événement de charge est animée, pour ne pas inventer une autre horloge. Les orbes affichent pour le moment l'énergie du combattant local déjà fournie à ce HUD ; pas d'ajout de HUD énergie pour les ennemis.
- Test tactile sur appareil Android physique non revendiqué. Une vérification du confort visuel en paysage par le joueur reste utile même après CI GREEN.

## Gouvernance

Base publique GREEN `d30cc8ebedca16ac8c20bf2561b63ab2ae324c83`. Checkpoint de départ `checkpoint/lab-start-combat-energy-orbs-v1-2026-10-10`, travail `work/lab-combat-energy-orbs-v1-2026-10-10`. Frontières charte `main`, `global-assets`, `Zombicide-40k`, laboratoire Exploration, données auteurs, contrats/Combat State inchangées.

Finalisation protocolaire : attendre CI complète du SHA documentaire ; inspecter diff, checkpoint GREEN exact, preview et publication `gh-pages` seulement via fast-forward sous lease SHA public inchangé, puis vérifier CI+Pages de la version publiée.
