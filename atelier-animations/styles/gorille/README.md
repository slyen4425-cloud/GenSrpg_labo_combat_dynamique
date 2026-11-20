# 🦍 STANDARD D'ANIMATION — CRÉATURE TYPE GORILLE (GORI)

**Deuxième standard de la chaîne** — locomotion de grand primate massif, et non un style graphique.  
**Référence : [Gorice, 4 séquences de 12 images](references/gorice/README.md)**

## Anatomie et mécanique du mouvement

- **Quatre membres au total** : deux bras et deux jambes, avec mains/pieds cohérents. Ne jamais ajouter de pattes ni faire apparaître une main à la place d'un pied.
- Épaules larges, torse massif, bassin, nuque et tête articulés ; conserver le volume du torse et les longueurs de bras pendant les poses.
- Déplacement bipède lourd ou avec appui sur les mains selon **l'anatomie propre à la nouvelle créature**, avec alternance explicite des appuis. Le modèle ne glisse ni ne se téléporte d'une pose à l'autre.
- Coordination des articulations : genoux fléchis, bassin qui transfère le poids, bras en contre-mouvement, épaules et tête qui accompagnent sans partir dans une autre perspective.
- **Vue joueur DOS et vue adverse FACE sont indépendantes**. Respecter la direction du regard de chaque maître ; aucune inversion miroir automatique.
- La silhouette reste lisible sur mobile, les appuis conservent un ancrage au sol cohérent et les membres restent visibles sur toutes les frames.
- Lors d'une **attaque chargée** : anticipation corporelle, transfert de poids, montée du bras/du poing dans la direction de l'ennemi, posture finale tenue pendant la canalisation. Reprise/récupération à traiter séparément si l'action l'exige.
- Pas d'effets magiques ajoutés par défaut : le standard décrit **le mouvement**, et non les éléments ou compétences de Gorice.

## Les 4 références existantes

| Action | Vue | Frames | Atlas | Preview |
|---|---|---:|---|---|
| Déplacement | DOS / joueur | 12 | [Planche](references/gorice/deplacement_dos_12f.webp) | [Animation](references/gorice/deplacement_dos_preview.webp) |
| Déplacement | FACE / adversaire | 12 | [Planche](references/gorice/deplacement_face_12f.webp) | [Animation](references/gorice/deplacement_face_preview.webp) |
| Charge/canalisation | DOS / joueur | 12 | [Planche](references/gorice/charge_dos_12f.webp) | [Animation](references/gorice/charge_dos_preview.webp) |
| Charge/canalisation | FACE / adversaire | 12 | [Planche](references/gorice/charge_face_12f.webp) | [Animation](references/gorice/charge_face_preview.webp) |

**Les 12 images sont le nombre de poses de Gorice, pas une limite universelle.** Les prochaines créatures peuvent exiger plus d'intermédiaires pour une boucle véritablement fluide.

### Limites des sources historiques

La frame initiale de déplacement Gorice n'est pas certifiée égale au maître en pixels ; la dernière frame joueur a une pause de 400 ms et certaines attaques historiques disposent de marges inférieures à 42 px. Ces fichiers sont conservés **exactement**, sans correction tacite. Pour chaque nouvelle animation, appliquer les critères renforcés de la charte actuelle (première frame fidèle, marges de sécurité, continuité, boucle prévisualisée).

**Aucun impact sur Raiiven, Gorice runtime, les catalogues ou le gameplay.**
