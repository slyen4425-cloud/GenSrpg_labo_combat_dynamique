# Raccord éditeur — Pack Sort d'ombre et Drain de vie (18 octobre 2026)

## Sources réelles
- Propriétaire média : branche `global-assets` au SHA exact `5faf0bc4ae2551afe2466d6c0e893f710b27aa27` : médias publiés depuis les deux ZIP utilisateurs authentifiés par SHA-256.
- 80 PNG RGBA 512×512 (agrandissements des planches d'environ 280px par frame, 512 non natif), 4 atlas WebP 7680×384, 2 manifestes et 2 tableaux de provenance.
- Chemins canoniques : `assets/library/capture/sprites/skills/shadow_spell/` et `assets/library/capture/sprites/skills/life_drain/`.
- Quatre assetId distincts : `pack:capture:sprite-shadow-spell-cast-01`, `pack:capture:sprite-shadow-spell-impact-01`, `pack:capture:sprite-life-drain-cast-01`, `pack:capture:sprite-life-drain-impact-01`.
- Phases cast/release à 70ms ×20, impact à 65ms ×20 ; lecture unique. Aucun changement de dégâts, ciblage, soins ou drains réels : des médias uniquement.

## Consommateur : éditeur de combat
- Base exacte gh-pages : `633c74fd3bde843440eb6361737a6a1e41074391` (checkpoint `checkpoint/lab-start-shadow-life-drain-editor-cache-2026-10-18`).
- Branche de travail : `work/lab-shadow-life-drain-editor-cache-2026-10-18`.
- Le module `src/assets/global-visual-library.js` charge toujours le catalogue propriétaire et les atlas depuis `global-assets`, avec nouvelle révision `2026-10-18-v35-shadow-life-drain-vfx` évitant l'ancien cache.
- `src/assets/global-presentation-asset-resolver-v1.js` est réutilisé sans copie ou fork ; les sélecteurs `Bibliothèque GenSrpG` consomment les quatre nouveaux IDs.
- Sentinelle `tests/unit/capture-shadow-life-drain-global-library-v1.test.mjs` : résolutions des quatre vrais fichiers/IDs et cache. Sentinelle Bouclier lumière ajustée pour accepter toute révision supérieure à v34 sans supprimer ses contrôles.
- La compétence auteur reste inchangée : sélectionner librement le Cast / l'Impact voulu dans l'éditeur. La liaison n'attribue ni ne remplace automatiquement les visuels d'une capacité existante.
- Pas de changement de moteur, capacités, formules, animations déjà en place ni de fichiers du dépôt principal.

## Qualité / publication
- CI complète de la branche avant publication gh-pages ; fast-forward sans force seulement si la base n'a pas avancé.
- GitHub Pages CI / déploiement à confirmer sur SHA de publication.
- Contrôle visuel utilisateur sur Android attendu : dans l'éditeur, rechercher les quatre noms, vérifier les préviews Cast et Impact, puis tester une capacité existante.
- Statut GREEN technique uniquement après CI, publication et checkpoint exact ; GREEN utilisateur non revendiqué sans essai visuel.
