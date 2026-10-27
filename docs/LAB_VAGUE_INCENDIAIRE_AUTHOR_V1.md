# Vague incendiaire — export auteur exact

**15 octobre 2026 — Labo Combat.**

Base GitHub Pages `062eede4a7fd0049e2f6ccd4f2718d1e28ee60ca`.
Branche `work/lab-vague-incendiaire-author-2026-10-15`.
Checkpoint départ `checkpoint/lab-start-vague-incendiaire-author-2026-10-15`.

## Provenance et intégration

Source utilisateur `gensrpg-capture-skill-cap_fire_atk_5.json` — **2440 octets**, SHA256 `940b888b237212bbe5235c34c140931a06e2dadbfc4ad29da342009646a21a44`, blob Git exact `31f0f8d72e1fd04dfe593d2c0d2fced3ad539a1c`. Aucun enrichissement ou correction des champs auteur.
Seul fichier de compétence ajouté :
`data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json`.
Le manifeste `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` le liste une fois ; au chargement, `configuredSkills` remplace le draft natif historique **sous le même ID**, les références Dracendre et le loadout restent valides. Le catalogue natif original demeure une provenance non autoritaire.

## Paramètres à signaler à l'auteur

`Vague incendiaire` (`cap_fire_atk_5`), projectile direct Feu, 25 dégâts de Feu immédiats, puis brûlure 8 dégâts Feu toutes les 2 s pendant 10 s (`damageMode: combat`), vise surface et aérien, touche les cibles immatérielles.
Deux champs éventuellement surprenants **préservés tels quels** : `cooldownMs:45` (**45 millisecondes**, non 45 secondes), `presentation:null` (**aucun visuel/audio personnalisé fourni dans l'export**). Ne pas corriger les données sans nouvelle demande de l'auteur.

## Contrôles

Sentinelle `tests/unit/capture-vague-incendiaire-author-v1.test.mjs` : octets/empreinte/roundtrip source, unicité du manifeste, remplacement canonique sans doublon, Dracendre référence inchangée, gameplay du direct + statut DoT, paramètres exacts. Quatre sentinelles de nombre de presets (27 → 28) ajustées, sans perte des contrôles précédents.
CI Foundation et deux Chromium au SHA final, checkpoint GREEN, preview et publication fast-forward sous lease seulement après succès. Rendu/son physique Android à valider par l'auteur. Aucun nouvel asset ou autre dépôt touché.
