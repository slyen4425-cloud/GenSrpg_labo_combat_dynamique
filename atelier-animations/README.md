# 🚩 ATELIER ANIMATIONS — chaîne de fabrication GenSRPG

## Point de reprise permanent

**Premier modèle standard : [🐎 CHEVAL](styles/cheval/README.md)**  
**Références copiées : [Raiiven — 4 planches](styles/cheval/references/raiiven/README.md)**  
**Deuxième modèle standard : [🦍 GORILLE](styles/gorille/README.md)**  
**Références copiées : [Gorice — 4 planches + previews animées](styles/gorille/references/gorice/README.md)**

Les standards sont classés **par morphologie/style de mouvement**, pas par créature et pas par identité graphique. Ils définissent la logique des poses, l'ordre des frames, les appuis au sol, les directions et les transitions. La créature à animer garde **ses propres maîtres FACE/DOS**, anatomie, textures, palette et orientation.

## Procédure (nouvelle direction)

1. Choisir un standard existant : **cheval** ou **gorille**, puis lire sa fiche.
2. Récupérer les vrais PNG maîtres FACE/DOS de la créature cible ; frame 01 = le modèle approuvé à l'identique.
3. Définir les poses clés, puis dessiner les véritables poses intermédiaires : **pas de déplacement global ou d'interpolation floue en guise d'animation**.
4. Inspecter les membres et les transitions, et conserver 512×512 RGBA, marges transparentes, ancrages cohérents.
5. Produire séparément FACE et DOS, planches dans l'ordre, PNG individuels et GIF/WebP animé avec raccord boucle vérifié.
6. Faire valider artistiquement chaque animation ; **aucun raccord automatique** à la bibliothèque ou au jeu.
7. Après validation : test technique, ZIP/atlas/manifestes, puis intégration par la seule bibliothèque canonique.

**Charte obligatoire** : [LAB_CHARTE](../docs/LAB_CHARTE.md) et [Charte visuelle](../docs/LAB_CAPTURE_CHARTE_MODELES_ANIMATIONS_ICONES_V1.md).

## Nettoyage sans suppression

- Nouvelle entrée unique pour l'atelier : ce dossier, relié depuis la racine.
- L'ancien [prototype d'articulation Loup volcanique PR #36](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/pull/36) est **historique / non applicable par défaut**. Les scripts et PR anciens sont laissés intacts ; aucun effacement d'images ou de branches.
- Les copies de référence ne sont **pas** une seconde autorité d'assets : les médias runtime restent dans `global-assets`.
- Ne jamais reprendre automatiquement l'ancien script `scripts/rig_loup_volcanique_canonical_v1.py` comme solution universelle.

## Index des standards

| Morphologie | Standard | Référence | État |
|---|---|---|---|
| Cheval / quadrupède équin | [Cheval](styles/cheval/README.md) | Raiiven, 4 planches approuvées 19/11/2026 | **RÉFÉRENCE INSTALLÉE** |
| Gorille / grand primate massif | [Gorille](styles/gorille/README.md) | Gorice, 4 planches de 12 images et previews, importées 02–03/11/2026 | **RÉFÉRENCE INSTALLÉE** |

Les prochains styles seront ajoutés ici, **sans réécrire ni altérer les références déjà installées**.

### Intégrité

Exécuter `python3 scripts/verify-animation-production-raiiven.py` à la racine. Vérifie la présence et l'identité Git exacte des 10 références, les dimensions PNG et l'ordre des copies. Pour le gorille : `python3 scripts/verify-animation-production-gorice.py` (nécessite Pillow) ; contrôle des 16 copies, 4 atlas et 4 previews animées. Le contrôle visuel/artistique reste distinct.
