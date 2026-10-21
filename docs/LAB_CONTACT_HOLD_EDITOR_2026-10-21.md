# Capture Editor — Maintien au contact : création d'une Sangsue
Date : 21 octobre 2026.

## Contrat auteur
Le noyau CombatRuntime (PR #47) et son raccord au renderer (PR #48) sont deux lots GREEN. Ce troisième lot autorise la composition des effets à l'éditeur tout en conservant **la séparation stricte** entre effets immédiats et effets de maintien.

Dans l'éditeur Capture, une section « Sangsue / Maintien au contact » suit les effets tactiques. Activer le mode affiche l'intervalle des pulsations (100–60000 ms), la durée maximale (0 = attendre blessure, sinon au plus 120000 ms) et une deuxième liste d'effets. Les deux listes utilisent **le même constructeur de SkillEffectV1 et ses champs dynamiques** : dégâts, heal, life_steal, statuts et autres effets du moteur. Le mode demande `form:contact` et `approachMode:ground`. Les zones persistantes et effets différés imbriqués sont interdits par la validation native et désactivés dans la liste répétée.

## Export/réimport
`buildHumanSkillDraftV1` crée une unique `definition.contactHold` et sérialise ses effets dans `effects[]` **distincts** de `definition.effects`. `humanSkillEditorFieldsFromDraftV1` réhydrate les deux tableaux, les cadences et l'activation. Aucun changement des contrats de transfert, de la base de données, de l'exporteur V3, du renderer ou des règles de combat. Les skills classiques sans maintien conservent strictement leur comportement.

## Vérification
Tests unitaires Draft→Fields→Draft→Transfer→SkillDefinition, legacy inchangé, invalidations forme/déplacement/intervalle/zone, découpage DOM et conservation des deux éditeurs de lignes. CI cinq jobs et démarrage éditeur sur vrai navigateur avant checkpoint GREEN. Validation visuelle sur Android de la vraie capacité Sangsue encore distincte.
