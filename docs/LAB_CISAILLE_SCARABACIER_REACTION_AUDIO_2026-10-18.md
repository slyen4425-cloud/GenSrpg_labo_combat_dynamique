# Intégration auteur — Cisaille / Scarabacier et sons de réaction (18 octobre 2026)

## Source, précision et propriétaires
- Base `gh-pages@d3acb8c4164027f66fc400ea90a193e76a848ac3` ; source auteur directe `gensrpg-capture-skill-cisaille.json` et `gensrpg-capture-creature-crea_scar_2.json`.
- SHA256 Cisaille : `ee715faf21ace2fb14f2bbfce1c363574a1f257f0be3403f34c17b632becb417` ; Scarabacier : `cb075e8e4133611f0e915af34ec55d0c53494215c9cee275415f851bb99c17c4`.
- Fichier auteur copié sans altération dans `data/capture/showcase/cisaille.capture-skill-transfer-v1.json` et `data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json`, archives immuables sous `data/capture/source-exports/gensrpg-capture-skill-cisaille-2026-10-18.json` et `gensrpg-capture-creature-crea_scar_2-2026-10-18-r2.json`.
- Seul le catalogue capacité ajoute le chemin `cisaille`. Le catalogue créature avait déjà Scarabacier. L'ancien Scarabacier demeure archivé sans modification. La statistique `acier` existe depuis le lot précédent : aucune nouvelle stat ni correction de conversion acier/steel.
- Cisaille : type steel, contact, dégâts 12, drain énergie 2, coût 3, temps d'approche 1,1 s, cooldown 10 s, audio impact `gensrpg:sound:effect-ff9cee8c`.
- Scarabacier : 190 PV, 20 Défense, 15 Acier, fenêtre Défense 500 ms / 90 %, un slot standard équipé `cisaille`, image dodge coque de pierre et audio mouvement déjà enregistré. Les 4 autres slots restent vides. Le canal du dommage de Cisaille est `null` dans l'export : préservé conformément à la charte.
- Nouvelle capacité facultative de présentation : `audio.dodge` et `audio.defense` dans la **fiche créature**, alimentée uniquement par le catalogue audio existant. Chacune peut être librement choisie, pré-écoutée, exportée/réimportée et jouée une fois lors d'une activation **réussie** (joueur / IA). Aucun son inventé ni attribué automatiquement.
- Autorités : `configuredSkills` et `configuredCreatures`, normaliseur `CreaturePresentationBinding`, `createDomCombatAudio` pour la lecture ; décisions et temps de réaction inchangés dans Combat Runtime.
- Tests : identités/hashes/archives, import vrai propriétaire, sentinelles Acier/Scarabacier actualisées pour version auteur, aller-retour de son, absence de fallback et chemin réel 2v2. CI complète + Pages + checkpoint technique requis. Validation audio/tactile utilisateur séparée.
