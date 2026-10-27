# Soin lumineux — correction des cibles ennemies (17/10/2026)

## Point de départ
- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base déployée : `gh-pages@82a65b835eb497671255a67e74f4d4e650f64509`, après validation du renvoi de Barrière lumineuse sur Android.
- Checkpoint de départ : `checkpoint/lab-start-heal-target-relations-v1-2026-10-17`.
- Branche unique : `work/lab-heal-target-relations-v1-2026-10-17`.
- Retour auteur : `cap_light_special_1` peut se lancer sur les ennemis, alors que le soin doit cibler l'utilisateur et ses alliés, y compris en réserve.

## Reproduction démontrée
1. Le transfert autoritaire Soin lumineux contenait `definition.targetRelations=["enemy","ally","self"]`.
2. `humanSkillTargetRelationsFromTacticalEffectsV1` inférait `["ally","self"]` depuis `heal 35`, mais y ajoutait `enemy` depuis le `consume_marker` générique. Une prochaine édition réintroduisait donc le défaut.
3. `combatSkillTargetOptionsV1` dérivait correctement ses cibles du contrat ; les ennemis apparaissaient donc légitimes.
4. `resolveSkillStart` ne validait pas la relation de cible lorsqu'il était appelé directement avec un `battleFormat`. La sentinelle RED a révélé cette autorité manquante.
5. L'ajout de ce contrôle a fait tomber trois tests historiques de réserve : pour un membre allié de son propre banc, le contrôleur utilise un *emplacement actif temporaire* qui représente `self` tandis que le membre réellement visé est `ally`. La validation de la relation au membre réel avait déjà réussi.

## Correction — sources de vérité uniques
- Archive exacte conservée : `data/capture/source-exports/gensrpg-capture-skill-cap_light_special_1-2026-10-17.json`. SHA-256 de la source auteur : `395adeb9b56af9a1b518a99e3f746fbcaa2f7199b239b702347b5415e9fb01cf`, 4166 octets.
- Preset actif `data/capture/showcase/cap_light_special_1.capture-skill-transfer-v1.json` : unique changement `targetRelations=["ally","self"]`, tous autres champs strictement identiques à l'auteur, y compris soin 35, retrait de marqueurs, énergie 5, préparation 500ms, recharge 45s, FX.
- `src/ui/capture-editor-human-v2.js` : `consume_marker` ciblé est neutre pour l'inférence de relation ; le soin/dégât principal garde l'autorité et la consommation seule conserve le fallback historique de la forme.
- `src/core/combat/action-resolver.js` : `resolveSkillStart` consulte la règle existante `isSkillTargetAllowed` seulement lorsqu'un `battleFormat` existe ; retour `invalid_target_relation` avant tout coût. Pas de second moteur/règle de ciblage, et les sessions legacy sans format sont préservées.
- `src/core/combat/roster-session.js` : l'emplacement temporaire d'un membre de sa propre réserve utilise une autorisation `self` uniquement sur la **copie zéro effet** de l'action ; la permission sur le vrai membre est vérifiée avant le staging. Ni l'original, ni les cibles réservées, ni les calculs de soins/dégâts ne sont modifiés.

## Sentinelles
- `tests/integration/capture-soin-lumineux-target-relations-v1.test.mjs` : import canonique unique, export/import exact, auto-inférence d'éditeur, garde `CombatSession.previewSkill`, ciblage UI 2v2, soins 35 sur allié actif, coût énergie 5, refus sur deux ennemis actifs et deux réserves ennemies, succès sur propre réserve et réserve alliée.
- `tests/unit/capture-soin-lumineux-author-v1.test.mjs` : SHA exact de la source utilisateur archivée et preuve de différence limitée à `targetRelations` dans le preset actif.
- Conservation des sentinelles historiques sur la réserve, les marqueurs, les projectiles/miroirs et les autres capacités. L'API UI reste une projection des vérifications du moteur.

## Fermeture
- RED `39072903246` (ancienne autorisation ennemie).
- Intermédiaire `39073187261` : trois échecs réserve détectés, aucun GREEN proclamé.
- Après ajustement du staging de réserve `39073300943` : 5 jobs SUCCESS sur le code avant le test complémentaire.
- Exiger cinq jobs SUCCESS **sur SHA documentaire final**, checkpoint GREEN du SHA exact, promotion fast-forward de `gh-pages` depuis la base gelée, GitHub Pages SUCCESS, puis validation sur smartphone par l'auteur.
