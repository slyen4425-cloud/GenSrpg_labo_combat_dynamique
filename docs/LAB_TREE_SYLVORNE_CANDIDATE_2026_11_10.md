# Sylvorne — créature (description : Gardien des sous-bois), C2 non publié

**START :** `main@7c00030ac32cfff5e38bc516db3df25ba4bbe4a4`, checkpoint `checkpoint/lab-start-creature-tree-sylvorne-2026-11-10`, branche `work/lab-creature-tree-sylvorne-2026-11-10`.

Fiche fondée sur les transferts réellement publiés : **Krakenor** 180 PV, vitesse 18, défense 12 ; **Moussados** 200 PV, vitesse 2, défense 0 ; **Gemmor** 170 PV, vitesse 10, défense 10. Sylvorne : **215 PV, vitesse 0, physique 0, défense 24, Nature 22, Terre 13, Esprit 8**. Réaction défensive (2 charges, recharge 30 s, réduction 50 %). Résistances Feu -50 %, Eau +35 %, Terre +25 %, Électricité +25 %, Nature +35 %, Glace -25 %. Capture 25 %, rencontre 6 % (toutes les valeurs de créature sont éditables dans le modèle natif).

| Niveau | Compétence | Effet | Coût / recharge |
|---|---|---|---|
| 1 | Éclat racinaire | 11 Nature + Germination (20 s) ; à 2 charges : +6 Nature et immobilisation 1 s, marques conservées pour l'ultime | 3 / 12 s |
| 5 | Écorce vivante | Défense +100 pendant 14 s (+20 points de % de réduction), sans cumul | 4 / 32 s |
| 10 | Vrilles du sous-bois | Mine de racines : 15 Nature après 2 s, stun de 2 s si Germination présente à l'explosion | 4 / 0 s |
| 15 | Sève ancienne | Soin 22 PV + 3 PV toutes les 3 s pendant 12 s, non cumulable | 7 / 42 s |
| 20 | Forêt souveraine | Ultime 1 fois/combat : 50 Nature à tous, immobilisation 10 s de tous les ennemis actifs, +6 par Germination consommée (max +12) sur la cible principale | 10 / 0 s |

**Propriétaires** : `CaptureCreatureTransferV1` et `CaptureSkillTransferV1`, sans nouvel inventaire ou moteur, six fichiers isolés sous `data/capture/candidates`. Aucun changement des 110 entrées historiques ni des presets officiels.

**Visuels — historique du prototype C2 :** ZIP auteur conservé `gensrpg_serpent_arbre_icones_modeles.zip`, Git blob `48dcbd6f7cc971ec9e5ed832169e16c1faa329bf` (4 685 709 octets). La lecture binaire par le connecteur texte n'est pas disponible. Les vrais FACE/DOS/ICON doivent être extraits et inspectés (512×512, RGBA transparent, orientation originale) puis enregistrés auprès de la seule bibliothèque visuelle avant de renseigner `presentation`. Aucun assetId ou modèle d'autre créature n'est substitué. **Non publié, non jouable dans le Bestiaire tant que les vrais médias ne sont pas certifiés.**

**Gates** : test contrats/effets original, CI du SHA exact, puis lot media certifié, batch natif, navigateur paysage et Pages sur main. Compatibilité des sauvegardes, Survie/Dungeon, Exploration et GenSRPG protégée. Rollback : `checkpoint/lab-start-creature-tree-sylvorne-2026-11-10`.

## Révision auteur du 11 novembre 2026 — PR #291

- Le nom visible reste **Sylvorne**, sans sous-titre ; « Gardien des sous-bois » reste dans la description.
- Statistiques affichées : Vitesse 0 / Physique 0 ; héritage auteur (Force, Agilité, Initiative) aligné à 0 pour éviter une divergence dans les anciens formulaires.
- La défense de +100 points représente +20 points de pourcentage si le coefficient configuré est de 0,2 % par point. La défense de base reste 24.
- Vrilles du sous-bois réutilise exclusivement `scheduled_effect` avec `ground_mine` (2 000 ms, dégâts Nature 15, énergie 4, cooldown 0). `apply_status stun` conditionnel sur Germination est résolu par le moteur au moment de l'explosion (2 s de stun). **Sprite de racine sortant du sol non créé ni associé : à produire dans un prochain lot graphique** ; cercle natif de mine conservé.
- Le seuil Germination à 2 charges **garde** les marques (`keep`) et applique son bonus une fois ; cela permet ensuite à l'ultime de consommer 1 à 2 charges pour son bonus +6/+12. Aucun second compteur.
- Forêt souveraine : 50 Nature à tous les ennemis actifs, immobilisation 10 s, et dégâts supplémentaires de 6 par marque consommée sur la cible principale (max 12).
- Checkpoint de reprise : `checkpoint/lab-start-sylvorne-balance-2026-11-11` sur `d9a6bc61c271bc7e1b81ca717e5f75e0901ecfe3`. Autorité fonctionnelle unique : `main` après CI/browsers et publication. `global-assets` et médias auteur inchangés.
- Le lot C2 médias #290 est fusionné sur `global-assets@9eef5847a2b9907c493d9575a5c148b09d41a5bf` (FACE, DOS, ICÔNE originaux certifiés) ; contrairement au prototype du 10/11, les assets canoniques sont disponibles. Validation utilisateur du rendu et preuve Pages au SHA exact toujours requises.
