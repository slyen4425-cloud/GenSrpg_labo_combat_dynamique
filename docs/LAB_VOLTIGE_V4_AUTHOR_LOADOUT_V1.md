# Voltige V4 — remplacement exact de la création auteur

**Date : 14 octobre 2026.** Dépôt autonome : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Provenance et fidélité

L'auteur a demandé de remplacer le preset actif de Voltige depuis son export `gensrpg-capture-creature-crea_voltik(4).json`.

- Fichier source vérifié en container : **5458 octets**, UTF-8, SHA-256 `27a57678225ce2ed0f1a0ae270b59a2bcd48ccca79af59e96b84aba09e6c4fd6`.
- Nouvelle destination **unique** : `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json`. L'ID `crea_voltik` reste identique ; le registre `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1` n'est pas modifié.
- Le SHA Git **blob** du nouveau fichier est `a339e8bb77b06f2ff0ed95dc34eebca6277f66b9`, identique à celui calculé sur les octets bruts du fichier fourni (Git Blob V3 précédent `f4d21b0a7ef70aedae100deff375beb4dba20493`).
- La comparaison source V3 / V4 compte **exactement trois changements**, rien d'autre :
  1. `draft.skillIds` ajoute `dodge` en dernière position (15 compétences au lieu de 14).
  2. Emplacement `slot-4` : `lib_paralyze` → `dodge` (Esquive foudroyante).
  3. Emplacement `slot-ultimate` : `null` → `cap_electric_special_2` (Surcharge).

**Préservés à l'identique** : nom Voltige, niveau 1 du preset, XP, stats originales, résistances, énergie, profil `biped`, scaling joueur `0.9` et adversaire `0.7`, position adversaire `(0,60)`, sockets front/back, assets face/dos/icône, audio et autres emplacements. Les capacités de niveau élevé restent enregistrées même si l'auteur commence la partie niveau 1 (la progression appartient au runtime).

## Intégration et tests

- Les capacités `dodge` et `cap_electric_special_2` et leurs transferts Showcase existaient déjà, chacun enregistré une fois dans le registre officiel : **aucun nouvel objet compétence ni aucun doublon**.
- Test TDD RED `tests/unit/capture-voltige-v4-author-loadout-v1.test.mjs` depuis le précédent preset : empreinte exacte attendue V4, ID, 5 slots, 15 compétences, preuves des 2 références disponibles, sauvegarde/import et roundtrip via vrai contrat `CaptureTransfer`, portrait/sockets/stats conservés.
- Sentinelles existantes `capture-voltige-v3-author-update-v1.test.mjs` et `capture-voltige-teleport-arc-stack-timer-v1.test.mjs` conservent leurs vérifications historiques de visuels, statuts, Arc électrique, stacks et délai ; leurs seules attentes obsolètes d'empreinte/loadout ont été adaptées à la nouvelle création explicitement demandée.
- Les tests de bootstrap Showcase déjà existants vérifient l'unicité de l'identité et le chargement depuis le registre actif. CI ciblée puis globale Foundation, Firestorm Chromium et Creature Library Chromium requise avant GREEN.
- Test réel sur smartphone à faire par l'auteur : dans l'éditeur, ouvrir la fiche Voltige, vérifier compétence 4 **Esquive foudroyante**, ultime **Surcharge**, profil/images et test combat.

## Gouvernance

Base de départ `gh-pages@2a322cf094abbd70890aff5c4bbe5fe99f923c9c` (dernier correctif **stun coupe les mouvements** déjà publié, CI+Pages vertes). Checkpoint `checkpoint/lab-start-voltige-v4-author-loadout-2026-10-14`, branche `work/lab-voltige-v4-author-loadout-2026-10-14`.

Uniquement un preset créature, les sentinelles associées et documents de suivi. **Aucun changement à la capacité Surcharge, Esquive foudroyante, Arc électrique, au moteur de stun/mouvements, à l'IA, rayons, autres fiches, assets, `global-assets`, `main` ou aux autres dépôts.** Aucune validation visuelle sur téléphone revendiquée sans test auteur.
