# Raccord du pack Air au Labo Combat — cache du catalogue

Date : 2026-10-11.

## Domaine et source de vérité

- Autorité des médias : `global-assets` au SHA GREEN `8633466eae72e320a6cd1c017a8d8f1bc10afcf3` ; les 4 atlas réels et 80 frames y sont publiés avec leurs manifestes, provenance et SHA contrôlés.
- Consommateur : `gh-pages` base exacte `d093b4dd2b519bb6cc07dd3d9c424e4f575f8ee6`, checkpoint de départ `checkpoint/lab-start-capture-air-vfx-cache-v1-2026-10-11`, travail `work/lab-capture-air-vfx-cache-v1-2026-10-11`.
- Identifiant de révision : `2026-10-11-v27-capture-air-vfx` dans `src/assets/global-visual-library.js` ; résolveur de présentations `createGlobalPresentationAssetResolverV1` réutilisé et non dupliqué.
- Aucun changement de `configuredSkills`, moteur FX, règles de combat, bibliothèque créatures, `main`, GenSrpG ou Exploration. Les médias ne sont pas liés automatiquement à une compétence.

## Quatre assets sélectionnables

- `pack:capture:sprite-air-wind-charge-01` : charge de vent, `release`, 20 frames, 80 ms, `once`.
- `pack:capture:sprite-air-wind-bolt-01` : rafale de vent, `travel`, 20 frames, 65 ms, `loop`.
- `pack:capture:sprite-air-wind-tornado-01` : tornade, `travel`, 20 frames, 70 ms, `loop`.
- `pack:capture:sprite-air-wind-impact-01` : impact de vent, `impact`, 20 frames, 65 ms, `once`.

Le fichier de catalogue central est rechargé via son URL GitHub `global-assets` versionnée. Aucune copie ni second catalogue. Le test `tests/unit/capture-air-vfx-global-library-v1.test.mjs` vérifie les quatre chemins et leur résolution via l'adaptateur existant. La sentinelle historique des huit icônes conserve l'invariant sans exiger que la révision globale reste figée à v26.

## Validation

- CI du lot runtime sur `e8e445d49221a1f28a87313d28115f340e35cbbf` : `38163839855`, SUCCESS (fondation + deux contrôles Chromium).
- La présente mise à jour documentaire nécessite la CI verte sur son SHA exact, checkpoint GREEN et fast-forward sans forçage de `gh-pages` ; puis Pages SUCCESS.
- Le contrôle visuel final sur Android reste demandé à l'utilisateur. Les frames 512×512 sont des agrandissements des images source, non une résolution native.
