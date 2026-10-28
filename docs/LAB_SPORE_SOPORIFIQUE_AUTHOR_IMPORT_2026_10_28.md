# Spore soporifique — intégration fiche auteur (28 octobre 2026)
- Source auteur immuable : `data/capture/source-exports/gensrpg-capture-skill-Spore_soporifique-2026-10-28.json`, SHA-256 `b1ac566d24a3aaff996661a7127c2e95f9dd3011b5e09436df1050a3d681fbf2`.
- Vitrine active unique : `data/capture/showcase/Spore_soporifique.capture-skill-transfer-v1.json` via `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`.
- Identifiant stable : `Spore_soporifique` ; aucune association automatique à une créature ni modification des loadouts.
- Données strictement conservées : projectile `expanding_wave` Nature, niveau 10, énergie 3, préparation 500 ms, trajet 500 ms, cooldown 30000 ms ; statut **stun** 10000 ms, actualisation sur réapplication.
- Visuels existants (global-assets) : `pack:capture:sprite-fire-bubble-expansion-01` pour trajet et `pack:capture:sprite-sommeil-z-status-01` pour l'effet de statut.
- Le fichier auteur **n'implémente pas** la règle « sommeil tant que la cible ne reçoit pas de dégâts » : il applique un stun de 10 s, sans levée sur dégâts. Ne pas inventer cette mécanique.
- Périmètre : données auteur, catalogue vitrine, test sentinelle et documentation. Propriétaire gameplay existant inchangé, ni moteur, ni UI, ni `global-assets`, ni `main`.
- Base `gh-pages@e7b7e71c8d43d48de78d757cb3f27ef1e1766679`, checkpoint `checkpoint/lab-start-spore-soporifique-skill-2026-10-28`, branche `work/lab-spore-soporifique-skill-2026-10-28`. CI requise avant publication.
