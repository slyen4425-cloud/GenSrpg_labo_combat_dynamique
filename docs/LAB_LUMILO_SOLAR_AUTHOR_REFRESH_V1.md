# Labo Combat — Réconciliation des exports auteur Lumilo et Charge solaire (18 octobre 2026)

## Origine, gouvernance, intégrité

- Source `gh-pages@0dee7386436fd5296efb805b3d7f8e798346ea94` (correction du gel de Charge solaire déjà publiée et techniquement vérifiée).
- Checkpoint de départ `checkpoint/lab-start-lumilo-solar-author-refresh-v1-2026-10-18`, travail exclusivement sur `work/lab-lumilo-solar-author-refresh-v1-2026-10-18`.
- Deux fichiers transmis *après* le message initial « Replace ceci » : `gensrpg-capture-creature-crea_lumilo(1).json` (5499 octets, SHA-256 `d3856255f406ed55ae673a0d377af9cb99211337bfdc7f8302b210058815541f`) et `gensrpg-capture-skill-cap_light_atk_3(1).json` (5127 octets, SHA-256 `86543d6efbb5928d9776c51523c372e0228f0c6eff35683f0855d32d72d304eb`).
- Sources archivées sans toucher à leurs octets dans `data/capture/source-exports/gensrpg-capture-creature-crea_lumilo-2026-10-18-r2.json` et `data/capture/source-exports/gensrpg-capture-skill-cap_light_atk_3-2026-10-18-r2.json`, et copiées *exactement* dans les deux chemins canoniques existants `data/capture/showcase/crea_lumilo.capture-creature-transfer-v1.json` et `data/capture/showcase/cap_light_atk_3.capture-skill-transfer-v1.json`.
- Les catalogues créature et compétence sont inchangés (8 créatures vitrine, 37 capacités actives) ; aucune duplication d'ID.
- Pas de modification moteur, renderer, animation, miroir, dégâts, effets de statut, réserve, autres créatures ou compétences, autres dépôts et `main`.

## Diff exact de la compétence Charge solaire

- `definition.preparationMs` : 0 → **800** ms.
- `definition.cooldownMs` : 0 → **45000** ms.
- `definition.effects` : l'effet `target` et l'effet `all_ally_reserves` +50% dégâts / 30 s sont conservés, l'effet dédié `self` est absent du nouveau fichier. **Ne pas rétablir silencieusement l'effet self** : le lanceur bénéficie toujours de l'effet ciblé s'il se choisit lui-même, mais ne gagne pas automatiquement un buff distinct lorsqu'il cible un autre allié.
- Icône remplacée par `pack:capture:icon-skill-healing-wave-01`.
- Son d'impact ajouté `gensrpg:sound:conflux-43060f16`.
- Aucun autre champ de compétence modifié.

## Diff exact de Lumilo

- Seul le slot standard 4 du loadout change `cap_light_atk_4` → `cap_light_atk_3`. Les résistances, caractéristiques, images, sockets, évolution, dodge, et les autres slots restent strictement inchangés.

## Régression couverte

- Nouvelle sentinelle `tests/integration/capture-lumilo-solar-author-refresh-v1.test.mjs` : archives byte-exactes SHA-256, transferts actifs identiques, uniques dans leurs catalogues, import de créature avec vrai registre statistique, timing/effets/FX et loadout conformes.
- Réconciliation explicite de `capture-lumilo-light-heal-author-v1.test.mjs`, `capture-solar-charge-reserve-status-v1.test.mjs`, `capture-solar-charge-real-presentation-v1.test.mjs` : l'ancien auteur attendait trois statuts, une recharge et une préparation nulles et un autre slot, alors que le nouveau fichier exige deux statuts, 0,8 s et 45 s. Pas de changement du comportement pour faire passer une ancienne attente.
- Scénario vrai navigateur `tests/browser/solar-charge-real-cast-probe.js` : l'ancien smoke ajoutait **à tort** Charge solaire à un second slot, tandis que le nouvel export Lumilo l'équipe déjà au slot 4. Le test lit maintenant le loadout auteur, lance Charge solaire puis Rayon lumineux.
- `tests/browser/capture-creature-library-smoke.mjs` : assertion de rechargement exact des cinq slots Lumilo ajustée au nouvel export.
- La correction précédente du gel visuel (pas de collision/contact inutile pour un pur bonus, l'attaque hostile ground restant conservée) demeure dans `CombatResolutionPresenter`.

## Critères de livraison

- Exiger `Laboratory CI` **5/5 SUCCESS** sur le SHA définitif incluant ce rapport et le journal final : Foundation + quatre navigateurs, dont l'éditeur réel et le lancement de Charge solaire suivi de Rayon lumineux.
- Créer un checkpoint GREEN de ce SHA ; effectuer fast-forward `gh-pages` sous lease depuis `0dee7386436fd5296efb805b3d7f8e798346ea94`, vérifier déploiement Pages SUCCESS.
- Seul le retour Android du demandeur validera le comportement tactile et le résultat artistique en jeu ; le GREEN technique ne remplace pas cette confirmation.
