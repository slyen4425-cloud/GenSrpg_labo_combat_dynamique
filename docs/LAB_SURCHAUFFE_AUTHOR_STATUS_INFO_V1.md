# Labo Combat — Exports auteur Surchauffe / Vague de chaleur + carte de statut

**Date :** 15 octobre 2026.

## Portée / sources strictes
- Base production `gh-pages@b095994473d75002101ba9001c5ab1c938dccfe6`, branche `work/lab-author-surchauffe-status-2026-10-15`, checkpoint initial `checkpoint/lab-start-author-surchauffe-status-2026-10-15`.
- Export `gensrpg-capture-skill-lib_heat_wave(1).json` : 3025 octets, SHA256 `322ff8b9ef8cf05b3f9c8bbd2d5fb4bea45bed24024280c24105ae3b643cb5c2`, blob `d8828d4cb0f46e5583880a00437c3901cf04aef6`.
- Export `gensrpg-capture-skill-cap_fire_special_2.json` : 3733 octets, SHA256 `8a312cd22d29bbd02c1731ad597532bcadb644fcf7225a35a45fd2c1a8f162f0`, blob `57b5b00147ece0a33233c30154c387553a618118`.
- Destination : un preset au même ID pour chacun, registre `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` unique ; aucune nouvelle autorité de capacité. Registre passe de 26 à 27, anciennes sentinelles de compte actualisées. Dracendre conserve son loadout (`lib_heat_wave`, `cap_fire_special_2`) intact. Aucune retouche silencieuse des données auteur.

## Cause et correction
- `outgoing_damage_modifier` était présent dans le contrat Status, la projection et le calcul des dégâts, mais absent du texte de `src/adapters/renderer/status-effect-info-v1.js`. La carte du statut pouvait montrer « Status 1 » et durée sans annoncer le bonus réel.
- Correction dans **ce projecteur unique** : libellé « Dégâts infligés », effet « Dégâts infligés (tous types) augmentés de 50 % » pour la Surchauffe, réduction symétrique pour valeurs négatives, stacks dérivés de `instance.stacks`, neutre explicité, durée restante venant de `CombatState.elapsedMs`, origine à partir de l'ID de compétence auteur.
- Bonus de Puissance provenant d'un statut `stat_modifier` également décrit par la même projection de combat, sans deuxième source ni confusion résistance / dégâts subis.
- Visuels, recharge et données du buff Surchauffe (50 %, 20 s, `refresh`) restent **exactement** conformes au fichier fourni, même si le champ description de la capacité est « Technique Feu utilitaire ».

## Validations
- `tests/unit/capture-surchauffe-status-author-v1.test.mjs` : empreinte octet des deux sources, unicité, import/export canonique, calcul des dégâts tous éléments, carte +50 %, −60 % avec deux stacks, durée issue de CombatState, origine, interface HUD réelle avec `DomStatusFxRenderer` sur fixtures 1v1 et 2v2, projection de la statistique Puissance. Test historique Vague de chaleur mis à jour selon le nouvel export.
- CI Foundation / Firestorm / Creature Library doivent réussir au SHA exact ; checkpoint GREEN et preview, publication fast-forward sous lease, CI + GitHub Pages postpublication. Test smartphone à l'auteur.
- Aucun autre dépôt, propriétaire média, `main` ou `global-assets` touché.
