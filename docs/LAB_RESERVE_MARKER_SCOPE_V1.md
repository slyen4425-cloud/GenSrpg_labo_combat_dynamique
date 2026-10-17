# Labo Combat Capture — Marqueurs sur les créatures en réserve (V1)

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Problème confirmé et correction

Le sélecteur de portée de l'éditeur proposait déjà **« Tous les ennemis en réserve »** et **« Toutes les réserves alliées »**. Cependant, `SkillEffectV1.normalizeSkillEffectV1` rejetait `apply_marker` sur ces portées avec l'erreur « Reserve effect scopes support damage/heal only: apply_marker ». Le blocage intervenait avant la sauvegarde ; ainsi la compétence auteur `Nid_frelon` comportait une description « cinq marqueurs sur les ennemis actifs et en réserve » mais `definition.effects: []`.

Modification minimale : le contrat `src/contracts/skill-effect-v1.js` autorise désormais **`apply_marker`** en plus de `damage` et `heal` uniquement pour les portées `all_enemy_reserves` / `all_ally_reserves`. Les autres effets (statuts génériques, énergie, K.O. direct, etc.) demeurent interdits. Les portées de réserve continuent de nécessiter une cible active comme ancre et un Roster Session réel.

**Aucun moteur supplémentaire** : à la réussite de la capacité, `CombatSession.withReserveSkillEffects` délègue au gestionnaire `RosterSession.resolveReserveSkillEffectsV2`. Celui-ci matérialise chaque membre de réserve vivant dans un CombatState détaché **transitoire** puis exécute le même `applyImmediateTacticalEffectsV1` que pour les actifs. L'effet utilise `markerStatusDefinitionV1`, `applyStatusEffectV1` et `combatProtectionForIncomingV1` inchangés : cumul, immunité aux statuts négatifs, seuil K.O. et consommation sont natifs. Le statut est sauvegardé dans `member.savedFighter` ; lors du rappel, `resumeStatusEffectsV1` évite d'appliquer des ticks périodiques accumulés pendant l'absence. La session de combat ne reçoit pas de slot artificiel de réserve. Un seul usage, énergie et cooldown par lancer. Sans roster : `reserve_roster_required` avant dépense.

## Trois exports du 17/10, traitement exact

| Fichier transmis | SHA-256 des octets | Traitement |
| --- | --- | --- |
| `gensrpg-capture-creature-crea_foudrillon(3).json` | `75c41b16850972b102396595b221ba2a161239466b626d0b464d067753bfaba9` | Remplacé **à l'octet près** sous le même ID `crea_foudrillon` |
| `gensrpg-capture-skill-vol_eclaire.json` | `9bd952448526afa70aba8029c054a0a09a8dff50977e2f35dc3dbd0c34bde188` | Ajouté **à l'octet près** sous `vol_eclaire` |
| `gensrpg-capture-skill-Nid_frelon.json` | `90e95343c834ebd5411bf0f4bad11ccccc67395a8da13bbd4a11ba7efc14af9e` | Source **intacte** archivée `data/capture/source-exports/gensrpg-capture-skill-Nid_frelon-2026-10-17.json`. Le preset actif est identique hormis l'ajout des 2 effets demandés qui étaient impossibles à sauvegarder avec l'ancien contrat |

Preuves des blobs Git octet pour octet : `crea_foudrillon` `e712c45cd3fe3b4697a47ae3d68a7eb99d5dbfac` ; `vol_eclaire` `d77ce079073c59734b7a2d516d9c6bc0edd3b7a6` ; archive `Nid_frelon` `532a240cafec31af13e4e38d0fdd32a606521db5`.

`Nid_frelon` **actif** inclut les effets :

```json
[
  {"kind":"apply_marker","targetScope":"all_enemies","marker":"venin-static (définition complète de la bibliothèque)","charges":5},
  {"kind":"apply_marker","targetScope":"all_enemy_reserves","marker":"venin-static (même définition)","charges":5}
]
```

Les données effectives sont des objets de marqueur complets et partagés, issus de la définition Venin statique de Vol éclaire, déjà utilisée par Dard static : `maxStacks:20`, 2 dégâts électriques toutes les 5 secondes en combat lorsqu'actif, K.O. à 20 charges. Il n'y a **aucun dégât instantané de plus inventé** car l'export auteur ne comportait pas de montant. La capacité reste l'ultime projectile, niveau requis 20, coût 8, préparation 2 800 ms, trajet 1 100 ms, puissance de projectile 1, un seul usage par combat ; visuels/audio d'origine conservés.

`vol_eclaire` : niveau requis 15, attaque aérienne, 20 dégâts électriques, **2** charges de Venin. La description dit « 3 », mais le champ effectif `charges:2` du fichier auteur est volontairement respecté. Aucune correction silencieuse de données.

`crea_foudrillon` : toujours Freclairions niveau 1, **26** capacités connues, dont `vol_eclaire` et `Nid_frelon`. Nouveau loadout auteur : Dard static / Choc venimeux / Vent arrière / Vol éclaire / Nid de frelon (ultime). Les niveaux requis 15/20 n'effacent pas les emplacements de l'auteur. Les autres capacités, statuts, stats, images, sons, sockets et résistances ne sont pas retouchés.

## Sentinelles de non-régression

- `tests/integration/reserve-marker-targeting-v1.test.mjs` : contract et scopes, placement 5 charges sur actifs et réserves, plusieurs ennemis actifs et réserves de deux équipes, pas de marqueur allié pour une attaque ennemie, réciprocité alliée, immunité au négatif, persistance après rappel, pas de ticks périodiques pendant la réserve, un usage/coût, absence d'acteurs fantômes, refus sans roster, autres genres réservés refusés.
- `tests/unit/capture-frelon-reserve-marker-author-v1.test.mjs` : octets/hashes des trois sources, `Nid` original sans effet, uniquement deux sous-effets ajoutés à l'actif avec les vrais champs marqueur, import/export et cohérence avec Dard, catalogues sans doublons, 26 capacités et 5 slots. Le catalogue actif passe de 30 à **32** capacités de vitrine (les anciennes restent).
- Sentinelles historiques Freclairions et de nombre de presets mises à jour sans affaiblir leurs autres assertions.
- Smoke Chromium `tests/browser/capture-creature-library-smoke.mjs` : vrai chargement bibliothèque depuis les deux propriétaires, sélection de Freclairions, équipement des 5 slots, Vol éclaire et son nombre de charges réel, Nid et les deux portées validées et affichées dans l'éditeur, retour à Dard et autres tests existants.
- Gate : `npm run ci` + quatre jobs Chromium GREEN sur le SHA final, checkpoint GREEN avant publication contrôlée de `gh-pages`; Pages SUCCESS. Le test visuel Android reste à faire par l'auteur.

## Périmètre

Seul le contrat existant a changé pour élargir une portée de marqueur ; `RosterSession`, `CombatSession`, `StatusEffectRuntime`, `Animation`, `FX`, les registres d'assets et les contrats de progression ne sont **pas modifiés**. Aucun système d'états parallèle. Pas d'intégration à `main`, `global-assets`, Exploration ou au dépôt principal GenSrpG.
