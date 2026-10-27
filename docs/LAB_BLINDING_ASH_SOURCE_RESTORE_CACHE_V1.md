# Labo Combat — Cache V26 pour l'icône Cendre aveuglante reconstruite de sa source

**Date :** 2026-10-11. **Périmètre :** consommateur `gh-pages`, bibliothèque canonique `global-assets` (séparée).

## Problème et correction

Le test Android utilisateur a infirmé la restauration précédente par simple ajout d'un octet RIFF. Le propriétaire `global-assets` a depuis reconstruit **le WebP 128×128 depuis le PNG original**, avec inspection réelle de l'illustration et préservation de la transparence ; asset GREEN `18b0673a17c12ba9f80f7ff539bb58b4ee20af01`, CI `38140035474` SUCCESS ; rapport source `docs/LAB_BLINDING_ASH_SOURCE_RESTORE_V1.md`.

Labo : l'unique resolver `src/assets/global-visual-library.js` change sa constante de révision `2026-10-11-v25-blinding-ash-webp-repair` vers `2026-10-11-v26-blinding-ash-source-restore`. La révision se propage à l'URL unique du catalogue et à toutes les URL média générées. Aucun autre resolver, route conditionnelle, règle de jeu ou copie média.

- Identifiant conservé : `pack:capture:icon-skill-blinding-ash-01`.
- Source unique du média : `global-assets/assets/library/capture/icons/skills/icon_skill_blinding_ash_01.webp`.
- Média changé côté labo : **0**. Un seul fichier binaire média changé côté owner `global-assets` lors du sous-lot précédent.
- Source certifiée côté owner : PNG original `image-gen-1(20261007-190701).png` (1254×1254), sha256 `e6e0f885a335f66007ac75499502d293e61170a08a70280acd41f80a58fcc4d6`.
- Sha256 WebP canonique : `bb452c0435928f7ac88973bee301c6672ed7c16503628bb98fbf6fa82aa17110`.

## Gouvernance

- Base `gh-pages` `61d09fa488002d4a6c49823939e7daec0bac16e3`.
- Départ `checkpoint/lab-start-blinding-ash-source-restore-cache-v1-2026-10-11`.
- Branche `work/lab-blinding-ash-source-restore-cache-v1-2026-10-11`.
- Test ciblé actualisé : `tests/unit/capture-skill-icons-global-library-v2.test.mjs` ; V1 conserve l'assertion des chemins d'icônes, et la CI de laboratoire conserve ses sentinelles navigateurs/103 créatures.
- TDD RED par changement du test avant le code au commit `e52a8320fece6085842590b3f1e87263fa7a05d0` ; CI `38140153905` foundation FAILURE attendue. Correction minimale `59bf5ef3227320834ba253493daf0e7bb39ee3f7`.

## Critères de clôture

Passage CI Foundation + Chromium, rapport mis à jour et checkpoint GREEN sur SHA exact, promotion non forcée de `gh-pages` sous contrôle de la base, vérification Pages SUCCESS.

**Validation utilisateur encore nécessaire :** la CI ne démontre pas le rendu artistique réel sur Android. Tester la capacité `Cendre aveuglante` sur smartphone paysage avec rafraîchissement de page pour charger la révision V26. Ne pas déclarer GREEN utilisateur avant retour explicite.
