# Capabilities Capture : import auteur Ombre r2 — 18 octobre 2026

## Base et périmètre
- Source GitHub publique `gh-pages@646f7d097ed83eb4f5204781351f7853efd89f26`, avec le cache des sprites Ombre / Drain de vie déjà publié.
- Départ : `checkpoint/lab-start-shadow-skills-author-r2-2026-10-18`. Branche : `work/lab-shadow-skills-author-r2-2026-10-18`.
- Exports du créateur conservés octet pour octet, et réutilisation exclusive du propriétaire `configuredSkills` par le catalogue showcase. Aucune modification du moteur, de la présentation commune, des médias ni des créatures.

## Transferts
1. `lib_lifesteal_strike` — Frappe vampirique : remplacement sous le même ID stable ; SHA-256 des nouveaux octets `05837ae77fd87d7281179c9f0f8fae3d91dc4f38154b6455617f2b22eae3dec9`. Impact auteur changé vers `pack:capture:sprite-life-drain-impact-01`, scale 1, stretch, opacité 0.5 ; effets dans l'ordre d'origine `life_steal` 50 % puis dégâts 18. Ancienne version source du 18 octobre conservée ; nouvel export archivé sous suffixe `-r2`.
2. `cap_shadow_atk_3` — Affaiblissement nocturne : nouvelle capacité niveau 10, Ombre, `buff_debuff`, projectile, puissance collision 1, recharge 60 s ; debuff `outgoing_damage_modifier` -60 % pendant 25 s, `stacking=refresh`, `maxStacks=1`. SHA-256 `cdc1e382b303ec7a8da3be9edc47623937cd170156140986571d6b74089a0eb9`. Cast/status `sprite-shadow-spell-cast-01`, trajet `sprite-projectile-shadow-01` ; visuel, audio, feedback non modifiés.
3. `cap_shadow_atk_1` (Ombre vive) reste inchangée et inscrite une seule fois.

## Tests
- Sentinelle nouvelle de fidélité exacte, archives, identité, unicité, export/import, conditions/status, charge visuelle et accès via `configuredSkills`.
- Sentinelle précédente Frappe vampirique mise à jour uniquement pour le dernier export et sprite impact.
- CI et GitHub Pages à vérifier avant statut GREEN technique ; rendu Android utilisateur à valider séparément.
