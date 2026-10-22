# Marqueurs avancés — 22 octobre 2026

## Demande
Plus seulement un seuil de 3 marqueurs : le créateur veut N charges configurables, des effets de seuil de durée X, une pénalité cumulative à chaque ajout, plusieurs malus/buffs combinés. Exemples : ralentir le déplacement, réduire vitesse de recharge des compétences, dégrader une statistique, diminuer dégâts et régénération d'énergie.

## Propriétaires natifs
- `StatusEffectV1.stack_counter` conserve l'unique compteur partagé par ID canonique ; limite `maxStacks` configurable, sans l'ancienne restriction du champ HTML à 999. La pose d'une compétence reste limitée à 99 charges par effet par le contrat natif de sécurité.
- `onStackThreshold.count` supporte tout seuil positif jusqu'au maximum choisi ; `consume=reset` réinitialise les charges, `consume=keep` les garde.
- `onStackThreshold.repeat="each_addition"` est facultatif et **nécessite `keep`**. Il active le seuil lors du passage N puis à chaque nouvelle charge réelle (jusqu'au plafond) : pas de nouveau tick, pas de déclenchement à charge inchangée, pas de déclenchement en cas de consommation.
- Les effets de seuil continuent de passer par `applyImmediateTacticalEffectsV1` et `StatusEffectRuntime`. `apply_status` s'appuie sur les statuts natifs `approach_time_modifier`, `skill_cooldown_rate_modifier`, `energy_regen_modifier`, `outgoing_damage_modifier`, `stat_modifier`, `silence`, `immobilize`, `stun`. La durée d'un malus peut différer de la durée des charges du marqueur.
- La répétition empile la quantité configurée dans un seul `StatusEffectRuntimeInstanceV1`, avec `maxStacks` égal au plafond des marqueurs. La non-répétition met à jour le statut par `refresh` ; anciens stupéfiants de l'éditeur conservent `replace`.
- Les statuts négatifs respectent les protections existantes ; la réduction de recharge modifie la vitesse du cooldown restant sans réinitialiser son horloge.

## Éditeur
Dans la bibliothèque marqueurs de Capture : maximum de charges non bridé à 999 dans le contrôle ; choix du seuil N ; reset/conserver ; case répétition par nouvelle charge ; type d'effet avec dégâts/soins/énergie/stun/silence/immobilisation, ralentissement/accélération de déplacement et recharge, dégâts sortants, régénération énergie, modification de caractéristiques en points ou % ; durée indépendante par statut ; ajout jusqu'à 12 effets dans le même déclenchement. Statistique choisie dans le `statRegistry` réellement chargé et référence historique conservée si absente.

### Exemples
- **Ralentissement par charge** : max 20, seuil 1, conserver, répétition activée, effet ralentissement déplacement 10 %, durée 8 s. Trois charges = +30 % sur le temps d'approche. Une nouvelle charge ajoute un autre niveau jusqu'au maximum.
- **Déclenchement à trois charges** : seuil 3, conserver, répétition désactivée, ralentissement 40 %, durée 5 s. Un seul effet au premier franchissement, pas à chaque nouvelle charge.
- **Combinaison** : seuil 5, conserver, répétition activée, -10 % vitesse recharge et -2 points de statistique Esprit pendant 6 s, plus dégâts périodiques indépendants si configurés dans le marqueur.

Les champs sauvegardés et les exports restent des `CaptureMarkerV1`; les capacités qui posent le marqueur sont mises à jour par le mécanisme existant `propagateMarker` et leurs IDs ne changent jamais.

## Gouvernance & tests
Base `gh-pages@946940eb60587c031ac810e52d1f34a95c7c3024`, checkpoint START `checkpoint/lab-start-marker-debuff-framework-2026-10-22`, branche `work/lab-marker-debuff-framework-2026-10-22`.

`tests/unit/capture-marker-advanced-debuff-2026-10-22.test.mjs` vérifie le contrat et la résolution native de multiples effets, seuils et répétition, temps réel de déplacement, recharge et expiration. La CI Foundation et les quatre navigateurs est obligatoire avant GREEN technique ; le ressenti smartphone reste à confirmer après publication.
