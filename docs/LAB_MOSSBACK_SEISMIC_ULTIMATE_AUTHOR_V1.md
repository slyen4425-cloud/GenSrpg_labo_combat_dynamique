# Labo Combat — Moussados / Séisme primordial, deux exports auteur (11 octobre 2026)

## Provenance et périmètre
- Dépôt autonome : `slyen4425-cloud/GenSrpg_labo_combat_dynamique` ; aucune modification de `Zombicide-40k`, Exploration, `main` ou `global-assets`.
- Base exacte `gh-pages` : `9f417bcae843456c55a44b3547e834d055695acd`, checkpoint `checkpoint/lab-start-mossback-seismic-ultimate-export-v1-2026-10-11`, work `work/lab-mossback-seismic-ultimate-export-v1-2026-10-11`.
- Sources reçues de l'utilisateur (non modifiées) : `gensrpg-capture-creature-crea_mossback(2).json` et `gensrpg-capture-skill-cap_earth_atk_7.json`.
- SHA-256 de l'export créature : `9e37cff16489d17f67a54a3c251ff269971b8c29716eed21a370762777303bd6`.
- SHA-256 de l'export capacité : `c55b4f384bccdd485f1d9e4fc9d39f58d7f28b679c9897b81e88b6fdb1c7f865`.

## Installation par identifiants stables
- `crea_mossback` remplace à l'identique le transfert vitrine dans `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json`. `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1` en charge la seule fiche ; les stats, échelle, résistances, audio, sockets et quatre emplacements restent ceux de l'export.
- `cap_earth_atk_7`, **Séisme primordial**, est ajouté sans collision comme `data/capture/showcase/cap_earth_atk_7.capture-skill-transfer-v1.json` puis déclaré **une seule fois** dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. `configuredSkills` reste l'unique autorité de la capacité ; aucun skill alternatif inventé.
- Le `loadout.slot-ultimate` de Moussados référence `cap_earth_atk_7` et cette compétence est aussi dans `draft.skillIds`.
- Capacités antérieures et réserves de Moussados intégralement conservées ; niveau de la créature toujours 1, accès à l'ultime déterminé par la progression plutôt que par suppression de la fiche.

## Paramètres auteur protégés
- `requiredLevel=20`, `loadoutSlot=ultimate`, élément Terre, attaque offensive `projectile`, cible `enemy`, puissance `amount=100` avec `targetScope=all_enemies`, `ignoreDamageReductionPct=100`, une utilisation par combat.
- Présentation V9 ; sprite impact `pack:capture:sprite-rock-impact-upward-01` et flash blanc ; `cameraShake={amplitudePx:50,durationMs:1200}`. Cette **secousse simple historique** n'est PAS transformée automatiquement en séquence, même si le renderer supporte les séquences.
- La description exportée indique littéralement « Disponible au niveau 46 » alors que la donnée de progression active est `requiredLevel=20` ; conserver les deux tels quels, sans réécrire silencieusement la création de l'auteur.
- Le contrôle visuel d'amplitude simple dans l'éditeur présente actuellement `max=24` tandis que le JSON auteur spécifie `50`. Le contrat du shake simple accepte sa valeur ; toute évolution ergonomique de cette borne devra être un lot propre distinct, sans réduction implicite à 24.

## Sentinelles et clôture
- `tests/unit/capture-mossback-seismic-ultimate-author-v1.test.mjs` couvre le transfert réel créature et le transfert capacité, IDs uniques, SHA source, statistiques/profil/échelle/loadout, coût sismique et secousse exacte.
- `tests/unit/capture-showcase-creature-presets-v1.test.mjs` suit le nouvel emplacement ultime.
- `tests/unit/capture-author-refresh-model-tint-blink-v1.test.mjs` met à jour la sentinelle de fidélité SHA de Moussados pour respecter le nouveau fichier auteur.
- CI foundation + navigateurs, puis checkpoint GREEN exact ; fast-forward `gh-pages` par lease, CI déploiement, validation Android utilisateur distincte.
