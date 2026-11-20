# RAIIVEN — COPIES EXACTES DES PLANCHES APPROUVÉES (19/11/2026)

**Référence visuelle pour le standard CHEVAL — pas une source runtime.**

Il s'agit de **véritables copies binaires Git** des fichiers présents sur la branche `global-assets` du même dépôt. Aucune nouvelle génération ni transformation. Les 4 strips sont composés de cellules successives **512×512 PNG RGBA**, de gauche à droite. Les versions maîtres FACE/DOS et les quatre manifestes sources sont également copiés.

| Animations officielles | Vue | Frames | Copie |
|---|---|---:|---|
| Galop | DOS joueur | 7 | [galop_dos_7f.png](galop_dos_7f.png) |
| Attaque | DOS joueur | 5 | [attaque_dos_5f.png](attaque_dos_5f.png) |
| Mouvement | FACE adversaire | 6 | [galop_face_6f.png](galop_face_6f.png) |
| Attaque | FACE adversaire | 5 | [attaque_face_5f.png](attaque_face_5f.png) |

**Modèles maîtres** : [dos](modele_dos.png) et [face](modele_face.png).  
**Traçabilité de chaque copie** : [manifest.json](manifest.json) (chemins originaux, identifiants de blobs Git, nombre d'images, cadence).  
**Import officiel historique** : [PR #346](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/pull/346).

Le nom de l'archive auteur d'attaque FACE contenait historiquement « PROTO », mais sa séquence à 5 frames est **la version ensuite approuvée** ; le manifeste source garde cette provenance exacte.

### Règles de sécurité

- Ces médias **ne sont pas enregistrés dans le catalogue d'assets** et ne changent aucune créature existante.
- Pour une autre créature de type cheval, **référencer le mouvement et les articulations, pas réutiliser les pixels d'apparence de Raiiven**.
- Aucun duplicata de ZIP ou de frames individuelles n'est ajouté : uniquement les six PNG utiles et les manifestes, avec réutilisation des blobs Git originaux.
- Ne pas remplacer les versions originales dans `global-assets`, ne pas supprimer les anciens prototypes et ne pas confondre validation de Raiiven avec validation d'une nouvelle animation.
