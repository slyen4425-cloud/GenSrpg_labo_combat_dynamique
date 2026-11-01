# Exports auteur — Gorice et Mur de glace (1er novembre 2026)

## Intégration ciblée
Source unique dans les fichiers `data/capture/showcase` existants, IDs `gorice` et `mur_de_glace`. Les deux fichiers remis sont conservés octet par octet comme archives inertes sous `data/capture/source-exports` ; aucune entrée supplémentaire dans les manifests.

Source Gorice : 4350 octets, SHA256 `c1191e68b1ae956222d23d58f7a0657c17a32426997e69e4859d3231aadeb854`.
Source Mur : 2212 octets, SHA256 `5e87c01a0f53112fbb803604a5a5cc8a2caf0ade8f3dd75e046e6537e51a52b0`.

**Différences voulues :** Gorice conserve son niveau 1, 15 points de Glace, ses visuels et sockets et trois slots équipés ; mur de niveau requis 10, sprite arcanique, scale 1, décalages 80 px vers l'avant et 50 px vers le haut, interceptions projectile/rayon uniquement. Ne pas réactiver `contact` sans modifier explicitement l'export de compétence. Les modes `protected` (devant), `behind` et `arena` (X/Y) sont disponibles dans l'éditeur depuis la PR #189 ; cet export n'indique pas de `placementMode` et reste donc placé **devant** par défaut. L'utilisateur peut choisir derrière dans l'éditeur.

**Hors périmètre :** correction/recadrage des sprites en cours dans un autre chantier. Aucun pixel ou assetId automatiquement changé.

## Sentinelles
RED confirmé : run GitHub Actions 41328441094, Foundation FAIL sur anciens transferts vitrine face aux deux sources fournies, suivi du commit minimal des deux transferts et de l'adaptation des anciennes attentes codées en dur. Tests complets obligatoires avant toute livraison GREEN, puis validation Android distincte.
