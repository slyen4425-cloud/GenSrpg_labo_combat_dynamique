# Labo Combat — remplacement de trois exports de capacités après icônes Capture V2
**Date :** 11 octobre 2026

## Reprise et frontières
- Charte live : `docs/LAB_CHARTE.md` §33.1–33.11 ; roadmap / architecture / checkpoints / current work relus avant écriture.
- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- HEAD stable d'origine `gh-pages` : `b5676ad01ec8352df2623b7c020ccf9f4c5d0a97`; CI et GitHub Pages réussis.
- Checkpoint avant chantier : `checkpoint/lab-start-author-skill-triple-replace-v1-2026-10-11`.
- Branche de travail : `work/lab-author-skill-triple-replace-v1-2026-10-11`.
- Huit icônes Capture V2 déjà publiées sur l'unique propriétaire `global-assets` / commit `0c78b519588baa3535654beae6f185046beb3499`. Résolution par `src/assets/global-visual-library.js` V24 inchangée. Aucune recréation d'icône.

## Export auteur : sources intactes, remplacement exact par ID stable

| Transfert reçu | ID | SHA-256 des octets UTF-8 | Cible active |
|---|---|---|---|
| `gensrpg-capture-skill-cap_earth_atk_7(1).json` | `cap_earth_atk_7` | `2e4b69a84147aa4a0c22dd464e2e0915bc3c82528aa8d67ea5a8bbead345dde1` | `data/capture/showcase/cap_earth_atk_7.capture-skill-transfer-v1.json` |
| `gensrpg-capture-skill-cap_earth_atk_3.json` | `cap_earth_atk_3` | `51f0a7eb1d648167ca908c3cd7d73e28ab970b49b33726e9e4859118803afc07` | `data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json` |
| `gensrpg-capture-skill-cap_fire_special_1.json` | `cap_fire_special_1` | `c1d1cc723aed981362f56c9b2439c2882b6c88d2038f02d2c2c68916015fa572` | `data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json` |

Trois transferts remplacés à l'identique : aucun remaniement de la définition, du binding, de l'effet, des sons, de la caméra ou des paramètres des auteurs. Le catalogue de vitrine comportait déjà exactement une référence à chaque ID ; **pas de modification du catalogue ni de duplication `configuredSkills`**. Les loadouts créatures restent strictement inchangés.

## Réglages et dépendances vérifiés
- **Séisme primordial** : icône `pack:capture:icon-skill-seismic-shock-01` (« Secousse sismique »), nouvel impératif `damage_taken >= 100`, dégâts Terre `100` sur tous les ennemis, ultime, niveau requis 20, utilisation unique. Shake simple auteur `{amplitudePx:50,durationMs:1200}` toujours présent, *sans* `impactVisualTiming` ni séquence dans le nouveau fichier : comportement par défaut de l'éditeur tant qu'il n'est pas reconfiguré.
- **Charge tellurique** : statut `status` vert `#5fad47`, intensité `0.35`, clignotement activé toutes les `1500 ms` ; zone de Prairie fleurie `hold-last` conservée, statistiques gameplay inchangées.
- **Cendre aveuglante** : icône auteur `pack:capture:icon-skill-burning-bite-01` (« Morsure brûlante », même si différente du nom de compétence), cast bouche / projectile / impact / statut fumée et sons laissés tels quels.
- Vérification catalogue `global-assets` : présence explicite des deux icônes référencées et des sprites des présentations. Pas de copie asset dans `gh-pages`.
- Donnée auteur historique `Séisme primordial` description « niveau 46 » vs `requiredLevel=20` : non corrigée silencieusement.

## Tests et état GREEN
- Test RED initial `tests/unit/capture-author-three-skills-after-icons-v2.test.mjs` : SHA sources, un seul ID catalogue, import/export roundtrip, champs auteur, import/remplacement `configuredSkills`, absence de retouche d'une capacité voisine.
- Mise à jour **ciblée** des deux anciens tests SHA de Charge tellurique / Séisme primordial pour leurs nouveaux exports, et de la sentinelle icône Cendre pour la nouvelle icône choisie ; aucune suppression de sentinelle ni assouplissement du contrat.
- Suite foundation `npm run ci`, smokes Chromium `creature-library-browser` (bibliothèque des 103 créatures) et `firestorm-zone-growth-browser`. Aucun changement core, timeline combat, contrats, assets, UI, `main`, GenSrpG ou Exploration.
- À la publication : checkpoint GREEN au SHA exact des tests, fast-forward non forcée de `gh-pages` avec `expected_sha`, recontrôle CI et GitHub Pages sur le SHA publié.
- La validation de rendu et de bon déroulement des trois capacités en paysage sur Android demeure une étape **utilisateur**, distincte de la CI.
