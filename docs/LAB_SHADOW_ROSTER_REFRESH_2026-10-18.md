# Cinq remplacements auteur Ombre + Noctigriffe — 18 octobre 2026

- Dépôt autonome : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`. Base publique byte exacte `gh-pages@db3122ef3e79697c92f0aa2a00f173533d6035cd`.
- Départ checkpoint `checkpoint/lab-start-shadow-roster-refresh-2026-10-18`, branche `work/lab-shadow-roster-refresh-2026-10-18`.
- Fichiers fournis copiés octet pour octet dans showcase + une nouvelle archive historisée chacun. Les anciennes archives restent immuables. Aucun changement des catalogues de registre, qui listent déjà ces cinq IDs, ni de moteur / UI / sources d'assets.

| ID | Auteur | SHA-256 de la nouvelle version |
| --- | --- | --- |
| cap_shadow_atk_4 | Impact spectral | 3cf8244a38f8e01255490566365765b6155bcea895407d4d35f39a774f00f7ad |
| cap_shadow_atk_1 | Ombre vive | 9c44db0e16a7d8d3f3fce1d638e64ef779fa9c6433f3fbce94f3a3d2be6301b5 |
| lib_lifesteal_strike | Frappe vampirique | 507e912cc42d39955b39b56b492166de7abe0ebdce516df775ec90c469302dc8 |
| cap_shadow_atk_3 | Affaiblissement nocturne | da22623f0a457168f2c22c92f0aa3b08412b180c21d8a5796ff060c26b2e35e7 |
| crea_ombre_2 | Noctigriffe | cf17ee84d120f9eebd9867fdb35f2bf7c56b06159ee8a6a854b71968c65e6f40 |

- Changements observés vs public : Impact spectral projectile visuel fumée remplacé par projectile Ombre, rapidité de frame ×2 et trois sons créateur ; Ombre vive icône Attaque Ombre / opacités auteur ; Frappe vampirique icône Drain de vie ; Affaiblissement nocturne icône Voile d'ombre et approche aucune ; Noctigriffe 2e capacité équipée devient `lib_lifesteal_strike` au lieu de `cap_shadow_atk_2`, visuel esquive fumée. Autres champs conservés selon les cinq sources brutes.
- Les effets ne sont pas réordonnés, ni les stats, sockets et loadouts. `Impact spectral` conserve la description auteur « niveau 16 » tandis que `requiredLevel=15`. Aucun ajustement implicite.
- Les 11 assets visuels/skills pertinents sont référencés dans le catalogue propriétaire `global-assets`, les neuf références audio présentes sous `assets/runtime/audio/private-v1` ; aucun nouveau média ni remplacement physique.
- Contrôle : sentinelle nouvelle vérifie les cinq SHA-256, archive/actif, noms, mécaniques (15 dégâts / 100% réduction ignorée / stun 2,5s, 12 dégâts Ombre, drain 50%, débuff -60% 25s), visuels, stats, résistances, sockets et les cinq remplacements dans les propriétaires canoniques. Les trois sentinelles historiques ont été limitées à la source historique pour les vérifications d'empreinte, en laissant leurs vérifications gameplay sur les données actives.
- Critères GREEN : CI complète, checkpoint de fin exact, publication GitHub Pages, puis test utilisateur sur smartphone. CI/Pages non présumés verts avant résultats observés.
