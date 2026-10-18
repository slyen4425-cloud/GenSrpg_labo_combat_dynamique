# Apparence de déplacement configurable — V1 (18 octobre 2026)

## But
L'auteur associe facultativement **un asset image ou une bande de frames horizontales** au déplacement d'une créature. Un Scarabacier pourra être dessiné en boule et tourner pendant son approche. Aucun visuel de Scarabacier n'a été créé ou ajouté dans ce lot.

## Contrat & intégration
- `CreaturePresentationBinding V4` ajoute `visual.movement` : `assetId`, `mode` (roll/sprite/static), `displayScale`, `rotationTurns`, `frameCount`, `transitionMs`.
- V1/V2/V3 inchangés, V4 uniquement pour les créatures configurées par l'auteur.
- Menu `Créature > Apparence > Animation de déplacement`, catalogue unique et assets personnels de session (role `movement`), persistance import/export de la fiche V3 contenant présentation V4.
- Le même adaptateur Capture -> native expose `movementFx` à `createSlot` et `Demo Visual Controller.playApproachFor`. La forme s'active sur **ground approach** ainsi que sur l'événement générique **move** ; les trajectoires et délais restent propriétaires du Combat Runtime / Animation Core.
- Le renderer charge l'asset, découpe la première frame d'une bande horizontale pour que le modèle de collision ait la silhouette de la forme alternative, puis affiche/rotate la forme pendant le déplacement. La silhouette initiale et la taille de collision sont restaurées en interruption / fin / rappel / disparition / changement de créature.
- Le contour de collision d'un sprite animé correspond à **sa première frame** pendant la séquence, pas à chaque frame. Une animation dont la silhouette varie beaucoup nécessitera un futur masque de collision multi-frame ; privilégier une forme de taille constante telle qu'une boule.
- Asset mal formé ou canvas non lisible : aucune substitution visible trompeuse, fallback vers la forme normale.

## Périmètre, ownership, tests
- Base publique `gh-pages@2e516d61ff83eba8b937daf66834903618cfceff`; checkpoint `checkpoint/lab-start-creature-movement-appearance-v1-2026-10-18`; travail `work/lab-creature-movement-appearance-v1-2026-10-18`.
- Aucun changement de coût, effet, dégât, vitesse, onContact, compétence, points d'ancrage, autres créatures, audio ou bibliothèque globale.
- Tests V4, éditeur, assets personnels, copie de draft, swap de collision réel et annulation du renderer, sentinelles historiques et CI complète exigés avant GREEN.
- Validation tactile/visuelle finale utilisateur distincte de la CI ; aucune image importée dans ce lot.
