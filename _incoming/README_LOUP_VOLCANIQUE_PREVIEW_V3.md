# Loup volcanique — publication V3 à valider

**Statut : fichiers de revue artistique uniquement.** Aucun asset runtime ni modification de créature/skill.

- Archive attendue : `Loup_volcanique_4_animations_PREVIEW_V3_sans_generation.zip`, 40 708 553 octets.
- SHA256 : `606a67e161f9fb1186e2a29b6d90aa415d050de9033c1ede83b5cefb18a7dc80`.
- La source contient les 80 PNG transparentes RGBA 512x512 (20 par action), leurs quatre aperçus animés et quatre atlas. Les **40 frames de déplacement sont conservées à l'identique de V2**.
- Les deux attaques sont découpées dans des planches déjà générées ; **aucune nouvelle image n'a été générée**.
- Un risque source est signalé sur **attaque FACE frame 12** : pas de validation définitive ni d'intégration tant que l'auteur n'a pas confirmé les deux attaques et la conformité aux modèles maîtres.
- Le workflow `import-loup-volcanique-preview-v3.yml` valide l'archive sans la transformer puis publie uniquement sous `assets/library/capture/creatures/loup_volcanique/animation_previews_v3/` sur cette branche.
- **Ne pas fusionner cette branche ni rattacher les médias au catalogue de combat** avant validation explicite de l'auteur. Les anciens médias canoniques FACE/DOS et l'icône restent protégés.
- Checkpoint de départ : `checkpoint/global-assets-start-loup-volcanique-preview-v3-2026-10-20`.

Déposer le ZIP réel dans ce dossier sur la branche `work/global-assets-loup-volcanique-preview-v3-2026-10-20`. Le manifeste et les aperçus apparaîtront alors après l'action GitHub verte.
