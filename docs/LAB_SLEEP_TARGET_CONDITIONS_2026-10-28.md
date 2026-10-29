# Labo Combat — Sommeil et effets conditionnés par les statuts (28 octobre 2026)

## Besoin auteur
- Sommeil : la créature ne peut pas agir tant qu'elle ne perd pas de véritables PV. Un impact bloqué par bouclier, une esquive, une immunité ou une attaque sans dégât ne réveille pas.
- Capacités conditionnelles : « Si la cible dort, +100 dégâts », mais également déclencher un soin, une application de statut, un marqueur, un nettoyage, etc., en fonction du statut ou du nombre de marqueurs sur la cible.
- Édition humaine sur smartphone : paramètres visibles uniquement au besoin, sélections dans les registres existants, aucune saisie manuelle d'ID.

## Contrats et propriétaires (pas de seconde autorité)
1. **StatusEffectV1** : durée `until_damage` réservée au seul `stun` négatif non empilable. C'est un comportement du statut historique, pas un moteur de sommeil en parallèle.
2. **StatusEffectRuntime** : conserve les instances `until_damage` actives sans horloge arbitraire ; les commandes sont déjà interdites/interrompues par l'autorité Stun existante.
3. **Combat Damage Application** : supprime ces instances uniquement après confirmation `appliedDamage > 0`. Toutes les sources de perte réelle de PV (direct, zone, DoT, renvoi) réutilisent ce propriétaire ; les protections restent inchangées.
4. **SkillEffectV1** : champ optionnel `condition` sur les effets immédiats. Types supportés : `sleep`, `status_kind` (liste officielle des genres de statuts), `marker` (identifiant canonique d'un marqueur enregistré), `minimum`, `invert`. Validation stricte, aucun slug libre en édition.
5. **Immediate Tactical Effects** : condition évaluée pour chaque cible sur l'état de combat au début de l'impact, pas après qu'un effet précédent a réveillé la cible. **Action Resolver** transmet cette photo avant son dégât direct, sans replanifier les actions.
6. **SkillDefinition** : maintient l'interdiction du double dégât inconditionnel (ancien `effect.damage` + `effects[].damage`), mais accepte des dégâts additionnels explicitement **conditionnés** ; cela permet les attaques existantes avec bonus de 100 lorsque la cible dort, sans changer les dégâts normaux.
7. **Human Editor** : case « Sommeil — se réveille après perte de PV », qui masque l'ancienne durée et force la polarité négative ; volet facultatif par effet « Quand appliquer cet effet ? » avec options toujours / Sommeil / genre de statut / marqueur enregistré, minimum de charges et inversion. Les exports et imports conservent la définition native, sans identifiant demandé manuellement.
8. **Présentation** : la fiche du statut indique la durée « jusqu'aux premiers dégâts reçus », sans fausse minuterie.

## Scénarios de non-régression
- Sommeil actif sans limite temporelle jusqu'à perte effective de PV ; tentative de dégât 0 ne le retire pas ; premier dégât positif le retire.
- Coups immédiats successifs : un premier dégât réveille, mais le bonus d'un même impact reconnaît le Sommeil qui existait au début ; un second coup sans Sommeil n'a pas ce bonus.
- Résistances, protections, boucliers, esquives, stun historique, dégâts standards, DoT, marqueurs et raccourcis de l'éditeur inchangés.
- Conditions de marqueur : chaque cible et ses charges réelles, seuil paramétrable et inversion (absence).
- Aucune condition ajoutée rétroactivement aux compétences précédemment enregistrées.
- Périmètre volontairement limité aux effets tactiques **immédiats sur cibles actives** : effets différés, zones persistantes, passive drain de vie et effets de réserve exigent des règles temporelles distinctes ; le contrat refuse explicitement ces combinaisons plutôt que de les exécuter de façon ambiguë.

## Traçabilité et livraison
- Base gh-pages : `89fb37307d4455801b2afe858c3d18e4d7554407`, base global-assets : `0233463ad1c5b2304448ff06d4786e4e66eda215` (non modifiée).
- Checkpoint départ : `checkpoint/lab-start-sleep-target-conditions-2026-10-28` ; branche : `work/lab-sleep-target-conditions-2026-10-28`.
- TDD initial RED : `d39bf786`, autres tests finaux : `tests/integration/capture-sleep-conditional-effects-2026-10-28.test.mjs` et `tests/integration/capture-sleep-condition-authoring-2026-10-28.test.mjs`.
- Une CI intermédiaire a montré deux régressions : `humanTacticalStatusToContractV1` validait encore une durée pour le sommeil, et l'interdiction legacy + tactique rejetait un bonus conditionnel légitime. Corrections au propriétaire du contrat/éditeur ; ne pas masquer les échecs.
- Retirer le workflow et script de migration uniques après leur exécution ; aucune automatisation de mutation du code ne reste déployée dans le laboratoire.
- Finaliser uniquement sur Foundation et quatre Chrome verts au SHA exact, checkpoint GREEN et fusion PR, CI et GitHub Pages GREEN. Validation tactile Android auteur distincte.
