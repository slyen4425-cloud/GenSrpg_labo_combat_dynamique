# Héros vert — référence validée en jeu le 27/11/2026

**Marche : validée par l'auteur en jeu (« parfait »).** Les huit cycles réellement publiés proviennent de [PR Exploration #565](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/565), fusion `3ed0c06e0ffdc798a011ecfcafe9037712864d9c`. CI [45981920240](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/45981920240) et publication Exploration [45981920216](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/45981920216) réussies. Aucun redessin, aucun nouveau sprite produit par cette fiche.

- [Pack auteur HD complet, planches, previews et ZIP directionnels](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/blob/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/GenSRPG_heros_vert_complet_test_jeu.zip) — 512×512 RGBA, marche 48 frames et idle S 6 frames.
- [Catalogue Exploration épinglé](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/blob/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/catalog.json) ; [manifestes de provenance et empreintes des 48 PNG](manifest.json).
- Les PNG réellement joués sont en 128×160 RGBA, issus d'une réduction isotrope commune et centrée du canevas HD. Ne pas recadrer chaque pose selon sa silhouette.

| Direction | Poses | Source canonique exacte |
|---|---:|---|
| N | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/N) |
| NE | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/NE) |
| E | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/E) |
| SE | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/SE) |
| S | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/S) |
| SW | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/SW) |
| W | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/W) |
| NW | 6 | [PNG 00–05](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/tree/3ed0c06e0ffdc798a011ecfcafe9037712864d9c/assets/exploration/actors/official/02_heros_vert/frames/NW) |

Sud-ouest (SW) = miroir horizontal des six poses SE validées ; nord-est (NE) = miroir de NW. Les miroirs ont été explicitement demandés et validés par l'auteur. Ils inversent aussi les éventuels détails asymétriques : ne pas généraliser sans vérifier le nouveau héros. Aucune inversion supplémentaire nécessaire à la lecture.

**Idle :** la séquence S est disponible dans le pack mais n'est pas un idle directionnel intégré et testé en jeu ; ne pas la présenter comme telle. Le chantier éditeur est reporté par l'auteur.

Les liens sont épinglés au commit validé, et les 48 empreintes Git permettent de vérifier chaque source. L'Atelier ne possède aucune copie runtime ni bibliothèque concurrente. Pour produire un autre héros, reprendre la chorégraphie, pas l'identité graphique du héros vert.
