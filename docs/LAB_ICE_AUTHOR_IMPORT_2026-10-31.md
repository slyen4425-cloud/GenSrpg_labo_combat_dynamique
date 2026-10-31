# Import auteur Glace — Poing givrant / Boule de neige r2 (2026-10-31)

## Source et périmètre

- Départ protégé : `gh-pages@5b22b78c0537c6fb83e09a034456e080e2193c3c` ; checkpoint START `checkpoint/lab-start-ice-author-import-2026-10-31` ; branche `work/lab-ice-author-import-2026-10-31`.
- Fichier `gensrpg-capture-skill-poing_givrant.json`, 3297 octets ; SHA256 `385d69ec3a255cde737b78b22745510dcac1d215853ba3827730843af44b164a`.
- Fichier `gensrpg-capture-skill-boule_neige(1).json`, 4937 octets ; SHA256 `5c7434c2804d73173d62919aed7b3e4f00f9e651619475622390e7f0f24278b7`.
- Ces sources sont archivées sans modification dans `data/capture/source-exports`. Les deux copies actives sont exactement égales aux archives, sans réécriture de paramètre auteur.
- Un seul enregistrement officiel par identifiant dans `src/catalogs/capture-showcase-skill-presets-v1.js` : `poing_givrant` ajouté ; `boule_neige` remplacé à l'identifiant existant.

## Détails conservés

- **Poing givrant** : glace, contact, niveau 5, 15 dégâts, énergie 3, préparation 850 ms, trajet 1500 ms, cooldown 40000 ms. Statut malus natif `incoming_effect_modifier`, `affectedPolarity=detrimental`, +50 % dégâts reçus pendant 20000 ms, `stack` et `maxStacks=2`. Média impact `pack:capture:sprite-frost-bolt-impact-01`.
- **Boule de neige r2** : glace, projectile, charge 3+3 avec 10 charges max, préparation de 800 ms par charge, énergie 1 par activation autorisée, fenêtre 700 ms, augmentation taille 10 %, trajet 1100 ms. Cast en boucle (scale 0.8, offset 85/15 et offset adverse -70/15), projectile en boucle scale 1.5, impact et FX auteur conservés. Mécanique d'énergie et de charge existante protégée.
- Les modules ESM de l'éditeur et de la preview utilisent une nouvelle révision coordonnée de cache `liane-audio-r2-20261030-snowball-v46-20261031-stage-energy-boule-20261031-ice-author-r2-20261031`, sans second catalogue. Les assets de la banque globale et toutes les autres compétences/créatures sont inchangés.

## TDD / vérifications

- RED : test `tests/unit/capture-ice-author-import-2026-10-31.test.mjs`, commit `8cb7673316eb8264cd9c5f556f9532834a138159`, exécution GitHub Actions `41216111587` (Foundation FAIL attendu avant import).
- Implémentation exacte : commit `c430bdd152dab376b0f6901ce66b8b22274ccefa` (archives, active, catalogue, anti-cache).
- Sentinelles : octets SHA256, importeur Capture officiel, unicité du registre, paramètres métier, médias, et chaîne ESM.
- Finalisation requise : CI Foundation + quatre Chromium sur le SHA final, checkpoint GREEN exact, fusion PR sur gh-pages, CI fusionnée et Pages réussi. Test Android physique distinct.
- Aucun changement sur `main`, `global-assets`, GenSrpg ou Exploration.
