# Pack Capture — Fluide météorite (2026-10-15)

Le lot comprend trois animations d'une même compétence (sans nouvelle logique métier) : Cast épique, Pluie de météorites, Impact multiple de feu.

## Propriété et gouvernance
- Dépôt labo autonome. Propriétaire stable : `global-assets`, où le catalogue et les médias doivent être publiés ensemble.
- Checkpoint avant import : `checkpoint/lab-start-fluide-meteorite-assets-2026-10-15` à `e55fea3b559c348be596d7c16250808a39c315a1`.
- Branche isolée : `work/lab-fluide-meteorite-assets-2026-10-15`, fusionnant les mises à jour du propriétaire intervenues entretemps (dont Bulle de feu expansive).
- Moteur de combat et `Zombicide-40k` inchangés ; aucun choix de dégâts ou de ciblage dans les visuels.

## Fichiers réels
- `assets/library/capture/sprites/skills/fluide_meteorite/`.
- 60 PNG RGBA 512×512 (20 par phase), 3 atlas transparents WebP 7680×384, manifeste JSON et provenance CSV.
- Sources initiales de trois grilles 5×4 à 1402×1122 : les cellules sources d'environ 280px sont agrandies en 512px, résolution NON native.
- ZIP chargé par l'utilisateur dans `_incoming`, contrôlé/extrait par workflow GitHub ; archive supprimée après commit.
- Vérification source par SHA-256 des 60 PNG avant import et via test de la branche ; les atlas sont inspectés et leurs dimensions vérifiées.

## Catalogue unique et raccord de bibliothèque
- `data/assets/catalog/global-visual-assets.v1.json`.
- `pack:capture:sprite-fluide-meteorite-cast-01` — release — 20 × 70 ms.
- `pack:capture:sprite-fluide-meteorite-projectile-01` — travel/skyfall — 20 × 70 ms.
- `pack:capture:sprite-fluide-meteorite-impact-01` — impact — 20 × 55 ms.
- Entrées référencées par `assetId` avec `resource.file` vers les vrais atlas et `playbackMode=once`, plutôt que des URL figées.
- Important : le jeu doit décider *où* les météorites tombent et appliquer ses effets ; ce pack ne fait qu'afficher les animations.
- Test : `tests/unit/capture-fluide-meteorite-assets-v1.test.mjs`.
- Après CI, valider manuellement les préviews et le séquencement dans l'éditeur / le combat avant GREEN utilisateur. Le catalogage seul ne garantit pas la visibilité dans un éditeur situé sur une autre branche.
