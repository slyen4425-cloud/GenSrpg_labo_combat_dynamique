# Bestiaire — échange forcé depuis la réserve ennemie (30-10-2026)

## Signalement réel
La fiche de Grainou affichait dans le détail de « Liane venimeuse » le message technique `Effet non encore décrit : force_reserve_switch`. L'export source contient déjà un effet valide `force_reserve_switch` et deux applications de marqueurs, sans dégâts immédiats.

## Autorités existantes
- `SkillDefinition` normalise `targetLocations:["reserve"]`, `targetRelations:["enemy"]` et les effets ; aucune donnée n'est recopiée dans le Bestiaire.
- `RosterSession` possède l'échange forcé ; `CombatRuntime` possède sa temporalité et le résultat d'impact. Le remplacement n'est confirmé que sur `hit`, jamais en cas de raté / esquive / blocage / renvoi / interruption.
- `src/ui/capture-skill-explanation-v1.js` est l'unique projection joueur en lecture seule. `captureBestiaryCardsV1` conserve la même référence de formateur, et `bestiary.js` affiche ses phrases, sans système parallèle.

## Comportement joueur
L'effet `force_reserve_switch` décrit en langage naturel la créature ennemie choisie dans la réserve qui remplace de force l'adversaire actif à l'impact. Quand la définition comprend d'autres effets, une phrase explicite qu'ils s'appliquent à la créature nouvellement amenée sur le terrain. Si l'attaque n'atteint pas sa cible, rien n'est échangé/appliqué. Les marqueurs sont décrits par leur formateur existant à partir de leur nom, charges, durée et répétition, sans valeur fixée à Liane.

L'ultime conserve les paramètres exacts de l'auteur et la limite « une fois par combat ». Les compétences sans échange forcé restent inchangées ; la définition sans effets annexes ne doit pas affirmer des effets inexistants.

## Vérifications
- Test unitaire du vrai export Liane, des deux marqueurs, de l'ultime de Grainou et de plusieurs compétences Nature ordinaires.
- Sentinelle Chromium du parcours de la liste Bestiaire → Grainou → Liane venimeuse, avec l'icône Ronce officielle, la description de l'échange, les marqueurs et l'absence de l'identifiant technique.
- CI complète (foundation + 4 Chromium) et publication GitHub Pages exigées.
- Aucun changement à `src/core`, aux contrats, données, sprites, sons ou catalogues.

## Livraison
Source : `gh-pages@5bb179a7096443a2c18b3e5e33fe36c13e11a287`.
START : `checkpoint/lab-start-bestiary-reserve-switch-2026-10-30`.
Work : `work/lab-bestiary-reserve-switch-2026-10-30`.
Statut final confirmé par CI / GitHub Pages (ne pas anticiper).
