# Capture — 4 icônes Ombre / Drain de vie — 18 octobre 2026

## Sélection utilisateur
Quatre images finales **déjà validées** dans la conversation, sans nouvelle génération : Attaque d’ombre, Drain de vie, Voile d’ombre, Malédiction féline. Chacune présente un fond sombre violet, son propre sujet distinct et un encadrement RPG clair. Source PNG RGB 1254×1254 ; export WebP RGB VP8 **128×128** avec PIL LANCZOS (qualité 30, méthode 6).

## Gouvernance
- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`, bibliothèque `global-assets`.
- Base exacte : `5faf0bc4ae2551afe2466d6c0e893f710b27aa27`.
- Point de restauration : `checkpoint/lab-start-capture-shadow-four-icons-2026-10-18`.
- Branche de travail : `work/lab-capture-shadow-four-icons-2026-10-18`.
- Propriétaire unique : Asset Input / catalogue visuel Capture. Pas de modification du moteur, du gameplay, des exports de compétences ou de `main`.

## Placement canonique
Dossier : `assets/library/capture/icons/skills/`.

| Compétence | Nom physique | AssetId |
|---|---|---|
| Attaque d’ombre | `icon_skill_attaque_ombre_01.webp` | `pack:capture:icon-skill-attaque-ombre-01` |
| Drain de vie | `icon_skill_drain_de_vie_01.webp` | `pack:capture:icon-skill-drain-de-vie-01` |
| Voile d’ombre | `icon_skill_voile_ombre_01.webp` | `pack:capture:icon-skill-voile-ombre-01` |
| Malédiction féline | `icon_skill_malediction_feline_01.webp` | `pack:capture:icon-skill-malediction-feline-01` |

Drain de vie : **remplacement volontaire du média existant, sans création de deuxième assetId**. Ancienne provenance conservée dans le bloc `revisions` du manifeste historique pour permettre rollback/audit ; ses champs actifs sont actualisés pour correspondre aux vrais octets présents. Trois nouveaux `assetId` ajoutés au catalogue unique, sans doublons.

Nouveau manifeste : `assets/library/capture/icons/skills/capture_four_shadow_icons_2026_10_18.provenance.json`. Contient SHA-256 PNG source, SHA-256 WebP, Git SHA des vrais blobs et tailles octets.

## Tests prévus
- Résolution du catalogue canonique et unicité des IDs.
- Vérification des octets WebP VP8, largeur/hauteur, empreintes SHA-256/Git.
- Exécution de `npm run ci` (sentinelles existantes incluses).
- Publication `global-assets` uniquement après CI verte, fast-forward sans concurrence, checkpoint final.
- Validation visuelle en éditeur mobile à faire séparément ; aucune validation runtime/Android n'est prétendue.

Cette modification est **uniquement graphique** : les capacités, effets, dégâts, animations et règles restent intacts.
