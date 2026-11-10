# Sylvorne — Gardien des sous-bois, candidat Combat (C2, non publié)

**START :** `main@7c00030ac32cfff5e38bc516db3df25ba4bbe4a4`, checkpoint `checkpoint/lab-start-creature-tree-sylvorne-2026-11-10`, branche `work/lab-creature-tree-sylvorne-2026-11-10`.

Fiche fondée sur les transferts réellement publiés : **Krakenor** 180 PV, vitesse 18, défense 12 ; **Moussados** 200 PV, vitesse 2, défense 0 ; **Gemmor** 170 PV, vitesse 10, défense 10. Sylvorne : **215 PV, vitesse 6, physique 12, défense 24, Nature 22, Terre 13, Esprit 8**. Réaction défensive (2 charges, recharge 30 s, réduction 50 %). Résistances Feu -50 %, Eau +35 %, Terre +25 %, Électricité +25 %, Nature +35 %, Glace -25 %. Capture 25 %, rencontre 6 % (toutes les valeurs de créature sont éditables dans le modèle natif).

| Niveau | Compétence | Effet | Coût / recharge |
|---|---|---|---|
| 1 | Éclat racinaire | 11 Nature + Germination (20 s) ; à 2 charges : +6 Nature et immobilisation 1 s, marque consommée | 3 / 12 s |
| 5 | Écorce vivante | Défense +16 pendant 14 s, sans cumul | 4 / 32 s |
| 10 | Vrilles du sous-bois | Rayon 14 Nature, immobilisation 1,1 s, +1 Germination | 5 / 23 s |
| 15 | Sève ancienne | Soin 22 PV + 3 PV toutes les 3 s pendant 12 s, non cumulable | 7 / 42 s |
| 20 | Forêt souveraine | Ultime 1 fois/combat : 24 Nature à tous, bonus jusqu'à +12 et immobilisation de la cible selon Germination | 10 / 0 s |

**Propriétaires** : `CaptureCreatureTransferV1` et `CaptureSkillTransferV1`, sans nouvel inventaire ou moteur, six fichiers isolés sous `data/capture/candidates`. Aucun changement des 110 entrées historiques ni des presets officiels.

**Visuels :** ZIP auteur conservé `gensrpg_serpent_arbre_icones_modeles.zip`, Git blob `48dcbd6f7cc971ec9e5ed832169e16c1faa329bf` (4 685 709 octets). La lecture binaire par le connecteur texte n'est pas disponible. Les vrais FACE/DOS/ICON doivent être extraits et inspectés (512×512, RGBA transparent, orientation originale) puis enregistrés auprès de la seule bibliothèque visuelle avant de renseigner `presentation`. Aucun assetId ou modèle d'autre créature n'est substitué. **Non publié, non jouable dans le Bestiaire tant que les vrais médias ne sont pas certifiés.**

**Gates** : test contrats/effets original, CI du SHA exact, puis lot media certifié, batch natif, navigateur paysage et Pages sur main. Compatibilité des sauvegardes, Survie/Dungeon, Exploration et GenSRPG protégée. Rollback : `checkpoint/lab-start-creature-tree-sylvorne-2026-11-10`.
