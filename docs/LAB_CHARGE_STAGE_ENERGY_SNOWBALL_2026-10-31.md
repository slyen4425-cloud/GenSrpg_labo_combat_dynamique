# Attaque chargée — préparation par charge, énergie et Boule de neige
Date : 31 octobre 2026

## Cause racine
Le système précédent vérifiait uniquement le nombre d'appuis et leur proximité dans une fenêtre glissante. Aucune préparation minimale ne séparait deux amplifications. Le premier `session.startSkill` débitait l'énergie, mais les réactivations étaient une modification de `chargeState` sans paiement.

## Contrat unique
- `SkillDefinition.chargedAttack` reste propriétaire de la puissance de base, l'incrément, le nombre maximal, la taille et `reactivationWindowMs`.
- `SkillDefinition.preparationMs` (modifié par les règles de vitesse du combat) définit **la préparation de chaque charge**. Aucune réactivation acceptée avant la fin de sa préparation.
- Pour chaque étape, la fenêtre de réactivation s'ouvre après la préparation ; un appui dans cette fenêtre commence la préparation de l'étape suivante. Sans appui, un projectile part après la fenêtre. À la dernière charge permise, le projectile part à la fin de sa préparation.
- Chaque pression **acceptée** utilise `skill.energyCost`. Le premier paiement reste dans `resolveSkillStart` ; les suivants passent par `CombatSession.payChargedActivationEnergy` (transaction sur l'état d'énergie canonique). Un refus ne consomme rien et ne modifie jamais charge, taille ou dégâts. `cooldown`, compteur d'utilisations et projectile restent uniques.
- L'énergie peut se régénérer normalement, mais jamais dépasser les limites de la source canonique.
- Le sprite de cast reste unique et s'amplifie uniquement aux pressions réussies. Le projectile final réutilise le multiplicateur du runtime ; aucune recomposition visuelle n'invente des charges.
- L'éditeur « Effets tactiques > Attaque chargée » et le bestiaire expliquent désormais ces règles.

## Remplacement auteur — Boule de neige
- Transfert utilisateur exact `gensrpg-capture-skill-boule_neige.json` : fichier actif `data/capture/showcase/boule_neige.capture-skill-transfer-v1.json` ; entrée unique du `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`.
- `boule_neige` : glace, projectile direct, 800 ms de préparation **par charge**, 700 ms de fenêtre **après la préparation**, coût 1 énergie/activation, 10 charges maximum, 3 dégâts + 3/charge, taille +10 % par charge.
- Assets conservés : `pack:capture:sprite-boule-de-neige-{cast,projectile,impact}-01`. Aucun asset réécrit, aucun double preset.
- La chaîne de versions des modules publics est renouvelée pour invalider le cache navigateur.

## Vérifications demandées
- RED : sentinelle `tests/unit/capture-charge-stage-energy-snowball-2026-10-31.test.mjs` avant code moteur.
- GREEN : les tests précédents d'attaque chargée adaptés au nouveau contrat; énergie de chaque étape; refus de spam et de manque d'énergie; la vraie Boule de neige relue depuis son export; smoke Chromium réel du runtime (10 activations, 10 unités d'énergie, un projectile).
- Les cinq jobs GitHub Actions doivent réussir sur le SHA final ; vérifier la publication via PR vers `gh-pages` et Pages. La branche `main` est hors périmètre.

## Publication
Les SHA et la preuve CI seront indiqués par les contrôles GitHub en clôture. Aucun état GREEN sans ces preuves.
