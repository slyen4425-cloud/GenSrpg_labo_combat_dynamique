# Rapport — Charge solaire +50 % sur les réserves alliées et trois transferts (18 octobre 2026)

## Gouvernance

- Source gelée : `gh-pages@a06707daea393daa753786e3e4ad8c602550f31b`.
- Checkpoint initial : `checkpoint/lab-start-solar-charge-reserve-status-v1-2026-10-18`.
- Branche exclusivement dédiée : `work/lab-solar-charge-reserve-status-v1-2026-10-18`.
- Les autres dépôts, `main`, `global-assets`, FX, miroir et dégâts génériques n'ont pas été modifiés.
- Contrat et mécanique : un seul `SkillEffectV1`, une seule distribution propriétaire `RosterSession.resolveReserveSkillEffectsV2`, une seule application de statut via `applyImmediateTacticalEffectsV1`, une seule horloge `CombatState.elapsedMs`. Aucune deuxième instance de combat/horloge ou scheduler de réserve.

## Trois fichiers auteur

Les trois uploads utilisateur sont conservés à l'octet exact dans `data/capture/source-exports` :

| ID canonique | SHA-256 du fichier fourni | Taille | Archive source |
| --- | --- | ---: | --- |
| `cap_light_atk_3` | `e9556970046f598ccef7e87b48b155ea3ed4c4c05ea7184bc538350e22ceccb2` | 4960 | `gensrpg-capture-skill-cap_light_atk_3-2026-10-18.json` |
| `cap_light_special_1` | `fed29e2e6b467a308dc286ad98cdefbc7ea3ee0bd39afa3874027ca8e6f9ad2e` | 4317 | `gensrpg-capture-skill-cap_light_special_1-2026-10-18.json` |
| `lib_light_bolt` | `68035a9810ce441725e699b1c47ea9e592edb8df5078a1c6c7dc95cb7d86256f` | 5456 | `gensrpg-capture-skill-lib_light_bolt-2026-10-18.json` |

- Les deux transferts actifs `Soin lumineux` et `Rayon lumineux` correspondent exactement aux sources reçues : Soin 35 PV, CD de 30 s, effet secondaire de dégâts 10 configuré à la consommation de marqueurs ; Rayon lumineux 14 dégâts Lumière avec puissance projectile 1. Aucun paramètre artiste ou actif binaire changé.
- `Charge solaire` garde ses deux `apply_status` initiaux : bonus sortant +50 %, statut cible `status-1`, statut lanceur `status-2`, 30 s. Un troisième `apply_status` `all_ally_reserves` ID `status-3` applique le même bonus à chaque membre vivant de réserve alliée, y compris le banc du lanceur et le banc d'un second allié, sans le donner aux ennemis. Visuel de statut `status-3` aligné sur le tint déjà configuré pour `status-1` ; aucun nouvel asset créé.
- Le seul catalogue `src/catalogs/capture-showcase-skill-presets-v1.js` possède maintenant 37 transferts (36 auparavant), avec `cap_light_atk_3` enregistré une fois et les deux autres IDs remplacés sans doublon.

## Cause racine et correction

- L'erreur affichée par l'éditeur « Reserve effect scopes support damage/heal/apply_marker only: apply_status » provenait directement de la whitelist `normalizeSkillEffectV1`. Elle bloquait `all_ally_reserves` avant même le combat.
- La whitelist propriétaire accepte désormais `apply_status` avec les deux scopes de réserve (all_ally_reserves et all_enemy_reserves) comme pour `damage`, `heal` et `apply_marker` ; les autres types non pris en charge (énergie, etc.) restent refusés.
- Le moteur préexistant `RosterSession` applique déjà les effets de réserves via un combattant **éphémère pour calcul natif uniquement**, puis enregistre son statut dans le membre de roster. Aucun faux combattant n'est ajouté au snapshot vivant et le combat entier n'est pas dupliqué. L'expiration en combat, la réactivation et le gain de dégâts après rappel utilisent les autorités de statut et de combat déjà en place. Aucune nouvelle boucle de mise à jour.

## Tests et sentinelles

1. Reproduction initiale RED sur le transfert `Charge solaire` et la whitelist, par intégration.
2. Import des 3 fichiers, SHA-256 d'archives, vérification d'unicité du catalogue à 37 et conservation du contenu auteur ; réconciliation des sentinelles historiques qui validaient les anciennes valeurs.
3. Test natif : Charge solaire appliquée en équipe avec allié actif, +50 % sur trois membres en réserve de deux équipes alliées ; aucune réserve ennemie affectée, coût payé une fois, pas de `__reserve__` persistant dans CombatState.
4. Changement réel de créature : le statut de réserve réapparaît lors du remplacement et porte les dégâts d'une attaque de base 20 à 30 ; expiration à 30 secondes.
5. Cas 1v1 : deux lancements à 10 secondes d'intervalle rafraîchissent le **même** statut de réserve (fin à 40 s), sans doublon ni effet ennemi.
6. Validation native d'un lancement sans Roster : refus explicite `reserve_roster_required` et énergie intacte ; énergie de réserve et autres scopes toujours refusés.
7. Chromium réel `capture-creature-library-smoke` : ouverture du vrai `capture-editor-v2.html`, hydratation de `cap_light_atk_3`, sélection Lumilo, clic sur « Vérifier la configuration » réussi (aucun rejet `apply_status` / réserve).
8. CI `39077724254` sur `11262c4117fc4e69f3ce1fa0cc35b64eabf90091` : **Foundation + 4 jobs navigateur SUCCESS (5/5)**. Source précédente avec test browser `39077552118` également **SUCCESS 5/5**.

## Fermeture et publication

- Exiger après ce rapport la CI 5/5 sur SHA documentaire final, un checkpoint GREEN correspondant à ce SHA exact, fast-forward `gh-pages` sous lease depuis `a06707da...`, puis GitHub Pages SUCCESS ; cette section sera complétée dans `LAB_CURRENT_WORK.md`.
- Le test Android réel (sélection, application du bonus, rappel et durée affichée) reste nécessaire pour le GREEN utilisateur. La validation automatisée n'est pas une validation graphique sur téléphone.
