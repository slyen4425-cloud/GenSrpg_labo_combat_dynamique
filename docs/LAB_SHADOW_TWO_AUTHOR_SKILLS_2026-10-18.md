# Intégration de deux compétences Ombre — 18 octobre 2026

Conformément à la charte §33 : les exports auteur sont intégrés **octet pour octet** sans modifier les valeurs ni l'ordre des effets. Les deux JSON sont la source de vérité ; les copies sous source-exports gardent la provenance ; les deux chemins du catalogue hydratent **configuredSkills** dans l'éditeur existant. Aucune nouvelle autorité.

- **lib_lifesteal_strike — Frappe vampirique** : attaque contact Ombre, niveau 5 ; 4 énergie, 800 ms de préparation, 650 ms de trajet, 25 s de recharge ; effets auteur dans l'ordre `life_steal` 50 % sur `self` puis dégâts 18 sur `target`. Impact lame, icône arcanique et son impact d'origine.
- **cap_shadow_atk_1 — Ombre vive** : contact Ombre niveau 1, approche `teleport` ; 3 énergie, 600 ms de préparation, 10 s de recharge ; dégâts 12 Ombre. Cast/impact projectile ombre, sons travel et impact d'origine.
- Sons vérifiés sur `gh-pages` au départ : `effect-ee93278c.mp3`, `tower-6dbf268f.mp3`, `effect-df32b429.mp3`. Visuels référencés par assetId stable, jamais copiés localement.
- Base `b07a55f8180d69a6a98322902bc1909a1a8d7d0b` ; départ `checkpoint/lab-start-shadow-skills-author-2026-10-18` ; branche `work/lab-shadow-skills-author-2026-10-18`.
- Sentinelle : unicité catalogue, octets SHA-256 des exports, archive identique, effets/visuels/audio, aller-retour import-export et application du plan canonique à configuredSkills sans altérer une capacité voisine.
- Publication et checkpoint GREEN conditionnés au succès de CI ; validation artistique smartphone distincte si nécessaire. Aucune modification de main, Zombicide-40k, global-assets, moteur ou interface.
