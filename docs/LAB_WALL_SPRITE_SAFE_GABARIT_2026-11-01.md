# 2026-11-01 — Mur de glace brut 2.5D, découpe et gabarit anti-troncature

## Décision artistique et cible
- L'auteur a refusé l'ancien mur de château ; approuve **un bloc de glace naturelle brut, 3/4 légèrement plongeant**, cohérent avec l'arène Capture 16:9 et le joueur au premier plan.
- 12 frames de formation, une seule lecture, dernière frame = mur achevé et persistant tant que les PV le permettent.
- Asset actif concerné : `pack:capture:sprite-mur-glace-arcanique-01`, employé dans le transfert auteur officiel `mur_de_glace`. Le nom et l'ID historiques restent stables pour l'import/export. Ce chantier n'ajoute aucune deuxième autorité ni nouvelle règle de collision.

## Diagnostic reproductible
- Ancien trio de murs dans la branche `global-assets` : les 12 PNG de `mur_glace` et `mur_glace_arcanique` contiennent des traces de cases voisines et des bordures cyan/violettes. Les tests Chromium existants vérifient le déroulement/maintien, pas la netteté du contenu alpha.
- Source validée du nouveau mur : PNG RGBA **1448 × 1086**, SHA256 `acb4e7f803da857a8d4446253478cfe27869e23f33d84da7ec838e97477bd9b3`.
- À seuil alpha >= 128, on mesure exactement 12 composantes majeures isolées. Boîtes maximales **261 × 172 px** dans la planche source. Les écarts source minimaux pertinents étaient 106 px horizontal et 132 px vertical. Pour les prochaines générations à ces dimensions, les cibles +30 % sont 138 px / 172 px.

## Découpage technique réalisé, vérifié sur les vrais pixels
- 12 objets individuels détectés et extraits de leurs composantes alpha, suppression des fonds parasites presque transparents, sans couper les pointes.
- Recentrage dans des PNG RGBA **512 × 512**, ancrage de sol constant, même échelle pour les 12 poses, proportions inchangées.
- Nouvelle marge contractuelle : `ceil(32 × 1.30) = 42 px`. Mesure des exports : marge horizontale minimale réelle **43 px**, verticale inférieure **60 px** ; toutes les frames passent le contrôle. Au moins 86 px de séparation effective si l'on juxtapose les nouvelles frames.
- Atlas **6144 × 512**, 12 frames horizontales, WebP lossless. GIF de prévisualisation 12 images, avec maintien visuel de la fin. Le cadre 12 représente la barrière complète.
- Remplacement **sur le même chemin** `assets/library/capture/sprites/skills/murs_glace/mur_glace_arcanique/` de la branche propriétaire `global-assets`, sans double catalogue.
- ZIP de livraison : `mur_glace_remplacement_12f_corrige.zip` ; SHA256 `689de105d02c487f15e2f6184ee1bb25e650168205622033052d9b12ab4914cb`. Contient 12 PNG, 1 WebP, 1 GIF, 1 manifest, 1 source originale, revue contact-sheet et mesures JSON (19 fichiers).

## Protection permanente
- Charte officielle `docs/LAB_CAPTURE_CHARTE_MODELES_ANIMATIONS_ICONES_V1.md` : nouvelle exigence 42 px, grille source à espacement accru, nettoyage alpha, ancrage, previews et rejet de toute frame rognée.
- Outil sans dépendance `scripts/validate-sprite-safe-margins.mjs` : inspecte réellement PNG 8-bit RGBA, les filtres de lignes, et refuse toute présence alpha >= 8 dans la marge de 42 px. Test unitaire : marges 42 acceptées / 41 rejetées sur quatre bords / format et image vide rejetés.
- À exécuter sur les 12 PNG après import réel, puis vérifier un aperçu en navigateur 1v1/2v2 et sur Android paysage. Test browser historique des murs à conserver.

## Traçabilité de déploiement (à ne pas confondre)
- `gh-pages` : seule documentation, scripts et tests ; base `de7d5f67d898a5bfd9bbfc82a60b38cc3f037f3c`, START `checkpoint/lab-start-ice-wall-sprite-safe-gabarit-2026-11-01`, WORK `work/lab-ice-wall-sprite-safe-gabarit-2026-11-01`.
- **Le ZIP local n'est pas encore un changement dans `global-assets`**. La publication binaire doit employer les mêmes chemins, puis augmenter la révision cache du catalogue global dans le client, valider CI/Pages et vérifier le rendu réel. Aucun remplacement des images publié par cette PR de documentation seule.
- Aucun changement de `main`, GenSrpG, Exploration, Combat Damage, Combat Barrier State, catalogues d'identifiants ou configuration de Gorice.
