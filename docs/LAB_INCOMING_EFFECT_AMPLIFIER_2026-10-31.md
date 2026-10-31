# Variation des dégâts et soins reçus — mécanique native

## Périmètre
- Propriétaire : `StatusEffectV1` pour la définition, `Status Runtime` pour la présence/expiration/stacks, `Combat Damage Application` pour la quantité des pertes et récupérations de PV.
- Nouveau statut `kind:"incoming_effect_modifier"`, `modifierPct` signé, `affectedPolarity` parmi `detrimental` (dégâts), `beneficial` (soins), `both` (les deux).
- La polarité **du statut lui-même** (malus/bonus pour les immunités/nettoyages) est indépendante du type de changement qu'il amplifie. Exemple gel = statut négatif avec affectedPolarity=detrimental ; bénédiction de soins = statut positif avec affectedPolarity=beneficial.
- Pour une cible, le bonus est la somme `modifierPct * stacks` des statuts actifs correspondants. Quantité = quantité calculée * `max(0, 1 + bonus / 100)`, arrondie au centième ; aucun dépassement des PV maximum.
- Modificateur de dégâts appliqué **après** attaque / résistances / Défense et **avant** boucliers / perte effective de PV dans `applyCombatDamageV1`. Les immunités et esquives restent souveraines.
- Modificateur des soins appliqué dans l'unique `applyCombatHealV1` appelé par soin tactique, soins périodiques (y compris marqueurs et sur fin d'action), drain de vie.
- Dégâts issus d'impacts directs, statuts périodiques combat ou fixes, zones, effets différés et renvois utilisent `applyCombatDamageV1`. Aucun second calcul et pas de changement aux règles de résistance.
- `affectedPolarity` **ne modifie pas la durée ni la valeur des autres statuts**, marqueurs, réduction de cooldown, statistiques, boucliers ou effets d'énergie. Leur amplification demanderait des contrats distincts pour ne pas inventer de règle unique de « puissance de statut ».
- Édition : `Effets tactiques > Ajouter un effet > Buff / Debuff / Statut > Effets reçus (dégâts et soins, %)`, champs « Variation de puissance reçue (%) » et « Effets concernés ». Même type disponible dans les zones persistantes, sauvegarde/chargement par définition native.
- Aucune compétence auteur existante n'est modifiée, aucune publication `main` automatique.

## Vérification
- Point de départ `gh-pages@489f90337db928b94f2d62e6df542ccf537c55e6`.
- START `checkpoint/lab-start-incoming-effect-amplifier-2026-10-31` ;
  branche `work/lab-incoming-effect-amplifier-2026-10-31`.
- Test RED `tests/unit/capture-incoming-effect-amplifier-2026-10-31.test.mjs` commit `0b81235d4471fcb34b77baa6518a388ae2160501`.
- GREEN : tests et vrai navigateur au SHA final, puis checkpoint si tous réussissent ; ne pas prétendre validé sur Android sans essai utilisateur.
