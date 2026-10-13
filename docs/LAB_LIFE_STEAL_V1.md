# Drain de vie V1 — Rapport technique

Date : 13 octobre 2026

## Base exacte et conservation des assets récents
- Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base LIVE : `gh-pages@6ff05a15d388136511cf054cdc16231921de52da` ; CI `38380995053` SUCCESS, Pages `38380994694` SUCCESS.
- Checkpoint initial : `checkpoint/lab-start-life-steal-v1-2026-10-13` ; branche dédiée : `work/lab-life-steal-v1-2026-10-13`.
- La base est **postérieure** au raccord du rayon électrique jaune. Cache `src/assets/global-visual-library.js` révision `2026-10-13-v30-capture-electric-beam-yellow` ; owner `global-assets@ffed974c51d58d59a2e5cf20fd9eca00d76ec111`.
- Cast 20 frames / 60 ms, Corps 12 frames / 45 ms boucle, Impact 12 frames / 45 ms. Aucune modification de `global-assets`, de `global-visual-library.js`, du Beam Presenter, des skills/assets/créatures existants ni de Jet pressurisé.

## Contrat
`SkillEffectV1.kind:"life_steal"` est distinct de `energy_drain` et `heal`.
```json
{"kind":"life_steal","targetScope":"self","percent":50,"maxHeal":20}
```
- `percent` requis, nombre fini de 0 à 100 ; `maxHeal` facultatif, nombre fini non négatif.
- `targetScope:"self"` requis ; la cible ne reçoit pas le soin, seulement le lanceur.
- Une capacité historique sans cet effet garde le comportement et les exports initiaux ; aucun champ automatique rajouté.
- Seul le hit de l'action courante et les dégâts tactiques **immédiats** qu'elle a réellement appliqués alimentent le drain, en valeur `appliedDamage` issue du Combat Damage owner ; le pool peut intégrer plusieurs ennemis ciblés par `all_enemies`.
- En une utilisation, chaque effet de drain produit son soin basé sur la somme des pertes réelles de PV, après les effets de dégâts de cette action, indépendant de l'ordre du formulaire. La quantité demandée vaut `min(maxHeal (ou ∞), round(pertePV × percent)/100)` ; le soin effectivement appliqué reste plafonné aux PV maximum par `withFighterHp`.
- Zéro drain après bouclier complet, immunité, esquive/KO prématuré, ou dommage nul ; overkill plafonné naturellement aux PV de la cible. Le drain ne ressuscite pas le lanceur K.O. avant le soin.
- Le projectile réel renvoyé n'alimente **aucun** second drain : `ActionResolver` transmet `allowLifeSteal:false` lorsque `action.mirrorReturn`.
- DoT, dégâts différés, effets de zone persistante, renvoi de dégâts et riposte de contact ne contribuent pas au pool ; leur éventuelle extension exige un lot séparé.

## Autorité et Human Editor
- `src/contracts/skill-effect-v1.js` valide le schéma.
- `src/core/combat/action-resolver.js` passe uniquement les pertes de PV de son impact direct non-miroir.
- `src/core/combat/immediate-tactical-effects-v1.js` cumule les impacts tactiques présents et applique le soin via le **même `withFighterHp`** et le même type d'événement `heal` que l'effet soin natif. Pas de nouvel état, tick, calcul de PV concurrent, système de combat parallèle.
- Dans l'éditeur : « Drain de vie — % des PV retirés », champs taux et plafond facultatif ; ciblage soi-même forcé ; import/export stable `configuredSkills`.
- Aucun changement renderer / images / sons / UI Beam ni base de 103 créatures.

## Tests
- Nouvelle sentinelle TDD : `tests/integration/life-steal-v1.test.mjs` créée avant code `e97b2af934387102ca4210ee8289b06ef13b0e8f`.
- Cas : contrat %/plafond strict, soin sur les PV effectivement perdus, overkill, boucliers, immunités, multicible 2v2, seuil de PV max du lanceur, coexistence avec renvoi de dégâts, exclusion du retour miroir, aucun auto-réveil après KO, Human Editor/roundtrip.
- CI code `38394157011` : Node **1656/1656 PASS**, Firestorm Chromium **SUCCESS**, test Chromium bibliothèque créatures à confirmer sur SHA exact avant checkpoint.
- Portes finales : CI SHA final documentaire puis checkpoint GREEN exact, publication fast-forward avec lease si base stable, CI/Pages post-publication. Validation visuelle mobile séparée.
