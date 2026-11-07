# Pique de glace — import auteur et éditeur d'effets unifié

2 novembre 2026 — Labo Combat. 

## Entrée utilisateur
- Fichier : `gensrpg-capture-skill-pique_glace.json`, `capture-skill-transfer-v1`, `draft.id=pique_glace`.
- Canalisation : forme Zone, Glace, 1 tick par seconde, 10 secondes et 10 ticks maximum, 3 énergie par tick ; un effet `damage` de 5 glace sur cible à chaque tick. Aucune frappe immédiate. Les conditions de fin sur dégâts, étourdissement et silence restent actives.
- Visuel absent de l'export : `presentation:null`. Seule complétion du fichier enregistré : binding officiel version 10, sprite original `pack:capture:sprite-pointe-glace-01`, animation Trajet `under_target`, sans projectile physique. Aucun changement aux nombres autorisés par l'auteur.

## UI et absence de doublons
- `SKILL_EFFECT_V1_KINDS` demeure la seule source des effets tactiques. Les états Charged, ChargedEffects, Channeling et ContactHold sont quatre mécaniques distinctes, non des copies d'effets.
- Le menu principal sélectionne le panneau à modifier. Les quatre panneaux sont rattachés à l'éditeur original, masqués quand non sélectionnés, y compris à cause des règles CSS Grid, mais leurs données restent sérialisées par les auteurs uniques existants.
- En important `pique_glace`, la section Canalisation est présélectionnée. « Nouvelle capacité » repart avec les effets immédiats. Aucun second système d'effets, aucun nouveau timer, aucune conversion de sauvegarde.

## Contrôles
- TDD RED `46d26f0c`, échecs attendus initiaux ; les régressions réelles (binding visuel V9 inconnu ; caches modules non alignés ; aide déplacée ; test navigateur sur carte repliée) ont été corrigées à leur cause, sans désactivation de tests.
- Code HEAD `c90d5acdae27db8a71a4b884a24fe8f572d76d6b` : workflow `41457188517`, Foundation + 4 jobs Chromium réussis (5/5).
- CI SHA code+docs final, checkpoint GREEN, PR #205, postfusion CI et Pages : à compléter.
- Revalidation Android, cadence et rendu réel de Pique de glace : à confirmer par l'auteur.

## Exclus
Pas de modification Combat Runtime / Session / dégâts, d'assets, de `global-assets`, de `main`, de GenSrpg ou du Labo Exploration.
