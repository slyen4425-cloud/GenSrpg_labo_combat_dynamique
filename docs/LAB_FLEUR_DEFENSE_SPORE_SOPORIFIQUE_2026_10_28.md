# Fleur défensive (12 frames) et export de Spore soporifique — 28 octobre 2026

## Sources réelles, périmètre et provenance

- ZIP validé/déposé : `assets/library/capture/sprites/skills/fleur_defense_12_frames_512.zip`, 6 249 269 octets, SHA-256 `653c5012f182931b4add1bef4641ab8837e749358236dba6b33d5ed0c70f9169`, Git blob `5f3bb2b288f8fdc4dc9c22bb474dfce13bb9b3c4`.
- Import sans réinterpréter les images : 12 **PNG RGBA 512 × 512** conservés octet pour octet, manifeste source, preview WebP animé 12f, planche PNG source ; atlas WebP lossless 6144 × 512 construit puis contrôlé pixel à pixel.
- Catalogue propriétaire unique : `data/assets/catalog/global-visual-assets.v1.json` sur `global-assets`.
- Identifiant ajouté : `pack:capture:sprite-fleur-defense-01`; `category=skill`, format `sprite-strip`, `once`, 12 × 155 ms, `holdLastFrame=true`. Le maintien effectif pendant un buff dépend du runtime et de la configuration de la capacité ; la présence du sprite seule ne prolonge pas la durée d'un effet.
- Dossier de bibliothèque : `assets/library/capture/sprites/skills/fleur_defense/`, atlas `fleur_defense_atlas_12f.webp`, preview `fleur_defense_preview_512.webp`.
- Les médias peuvent être choisis dans la bibliothèque du laboratoire par l'ID sans les associer automatiquement à une capacité.
- La source ZIP, retirée du chemin de bibliothèque après extraction, demeure dans le commit Git antérieur et sa provenance est conservée dans `provenance.json`.

## Fichier de compétence

- Copie de l'export utilisateur : `data/capture/showcase/Spore_soporifique.capture-skill-transfer-v1.json`.
- ID stable `Spore_soporifique`, niveau requis 10, élément Nature, vague expansive projectile, coût énergie 3, 500 ms de préparation et trajet, CD 30 s.
- Le fichier **déclare** un état `stun` pendant 10 000 ms ; il ne déclare pas lui-même une condition « réveil à la réception de dégâts ». Ne pas transformer silencieusement cet export en une autre mécanique de sommeil.
- FX référencés (déjà présents dans le catalogue) : `pack:capture:sprite-fire-bubble-expansion-01` et `pack:capture:sprite-sommeil-z-status-01`.
- Import de fiche actif `configuredSkills` / état du navigateur : **non revendiqué** par le seul stockage de l'export dans `showcase`. Aucun ID dupliqué, aucune modification de roster/créature, pas de changement de gameplay.

## Validation technique

- Branche propriétaire de travail : `work/lab-fleur-defense-spore-soporifique-2026-10-28` ; base `global-assets@4e938b32eb2b1e66ac110a82cd1f550b9c443ddf` et checkpoint `checkpoint/lab-start-fleur-defense-spore-soporifique-2026-10-28`.
- Test sentinelle RED créé avant import : `tests/unit/capture-fleur-defense-spore-soporifique-2026-10-28.test.mjs`.
- Import officiel via `.github/workflows/import-fleur-defense-12f.yml` et `scripts/import_fleur_defense_12f.py` : Git SHA/CRC/source contrôlés, 12 PNG distincts, transparence, dimensions, preview 12 images, atlas RGBA lossless pixel-identique aux frames ; `npm run ci` exécuté dans l'action.
- Fichiers dans le dossier final : 15 médias/source originaux + atlas WebP + séquence JSON + provenance = 18 fichiers, **1 asset logique** ; plus 1 fichier JSON de compétence de démonstration et les fichiers de test/documentation de lot.
- L'archive source livrée n'est pas une garantie de validation artistique finale ; l'auteur conserve la validation visuelle de la séquence et de sa tenue en combat.
- Pas de modification de `main`, `gh-pages`, combat rules, `configuredSkills`, runtime, render adapter ou autre créature.

## Reprise / clôture

Contrôler le SHA du commit de médias, la CI complète après la documentation, l'unicité du catalogue (276 assets, 165 sprites à l'import), la résolution des liens sur la branche source, le checkpoint GREEN technique puis la publication fast-forward non forcée sur `global-assets`. Le test mobile/tenue visuelle reste distinct.
