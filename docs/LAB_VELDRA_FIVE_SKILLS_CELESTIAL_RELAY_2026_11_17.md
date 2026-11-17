# Veldra — cinq compétences et Relève céleste (17 novembre 2026)

## Gouvernance et provenance
- Validation explicite de l'auteur le 17 novembre pour les cinq compétences révisées.
- Source unique : Laboratoire Combat `main`, à partir du merge visuels V10 `09d690c0689e0283c97ac5ff7ccae4777d3c2083` (PR #329).
- START `checkpoint/lab-start-veldra-five-skills-revival-20261117`, branche isolée `work/lab-veldra-five-skills-revival-20261117`, PR à certifier.
- Propriétaires existants réutilisés : Showcase + Capture Editor, SkillDefinition, SkillEffectV1, Combat Runtime/Session, Status Runtime, RosterSession, contrôleur Roster UI et catalogue `global-assets` (lecture seule).
- Aucune autre créature/compétence/moteur/source visuelle copiée. La version visuelle V10 de Veldra et les corrections Ephemus V10 restent inchangées.

## Kit créé et équilibrage
| Niveau | Capacité / ID stable | Effets | Coût / recharge |
|---|---|---|---|
| 1 | Plume solaire / `veldra-plume-solaire` | 10 dégâts lumière ; pose 1 Marque solaire 5 s sur la cible | 3 énergie / 8 s |
| 5 | Percée d'aurore / `veldra-percee-aurore` | Attaque contact par approche aérienne ; 12 dégâts lumière et Silence 2 s uniquement si marque solaire active | 4 énergie / 15 s |
| 10 | Égide du zénith / `veldra-egide-zenith` | Soigne 25 PV, +200 DEF durant 6 s (40 % de réduction additionnelle selon la règle 0,2 %/point), retire uniquement les ralentissements | 3 énergie / 45 s |
| 15 | Rayon cardinal / `veldra-rayon-cardinal` | Beam canalisé : cinq ticks de 6 dégâts lumière espacés de 400 ms ; sur le cinquième tick accepté, +10 dégâts si marque solaire active à cet instant | 6 énergie / 50 s |
| 20 | Relève céleste / `veldra-releve-celeste` | Choisit un membre de **sa propre réserve** même KO, restaure 100 PV au maximum, confère +20 % de dégâts sortants universels pendant 30 s et échange les deux membres en une opération Roster | 8 énergie / 110 s |

### Design du cinquième tick
`ChannelingV1.finalTickEffects` est optionnel et ne s'applique que lorsque le seul `CombatRuntime` appelle la cinquième impulsion réelle. Aucune application précoce/au cast ; les ticks refusés par énergie, KO ou interruption n'appliquent aucun finisher. Les autres canalisations sans compteur maximal restent valides si le tableau est absent/vide. La condition `marker:veldra-solar-mark` est vérifiée par le Status Runtime déjà existant.

### Relève alliée : extension limitée
- `SkillEffectV1.ally_reserve_relay` contient uniquement `healAmount`, `outgoingDamagePct`, `durationMs` : trois valeurs éditables, plus la cible native `targetScope=target`.
- `SkillDefinition` impose `form=self`, `targetRelations=['ally']`, `targetLocations=['reserve']` et une seule entrée de cet effet. Refus de la réserve ennemie, d'un coéquipier 2v2 et des doublons de soins.
- `RosterSession` vérifie le membre de sa propre réserve, le KO du lanceur, le verrou `roster_lock`, le délai de rappel volontaire et les préconditions natives (coût/cooldown). La réserve KO est admise **uniquement** pour ce type d'effet.
- Pour soin et bonus, l'action est convertie vers des `SkillEffectV1.heal` et `apply_status(outgoing_damage_modifier)` natifs sur le snapshot de réserve temporairement matérialisé. Ce snapshot demeure sous l'unique RosterSession. Les résistances, inversions, plafonds de PV et statuts suivent le moteur natif. Si la réserve reste à 0 PV après application, aucun échange n'est réalisé.
- À la résolution réelle d'une action réussie, Roster remplace atomiquement le combattant et sauvegarde l'état sortant de Veldra (PV/énergie/recharges/statuts), applique le verrou volontaire normal et renvoie l'événement `roster-allied-relay`. Les collisions/FX/présentations du moteur ne sont pas reproduits.
- Une seconde invocation de la même résolution est refusée par le `WeakSet` de RosterSession.
- L'UI des réserves n'ouvre les sélections KO que si la capacité est l'effet de relève ; l'ancien changement forcé de réserve ennemie et l'ancien Rappel restent inchangés.

### Dissipation ciblée de ralentissements
`SkillEffectV1.cleanse.slowOnly` utilise `removeStatusEffectsV1`, qui retire seulement des statuts négatifs de ralentissement `approach_time_modifier` positifs ou `stat_modifier` sur `speed` négatifs. Le statut `roster_lock` et les autres malus sont conservés.

## Médias
Icônes et sprite des cinq compétences pointent uniquement vers des `assetId` existants dans le catalogue officiel `global-assets`. Les faisceaux réutilisent provisoirement des effets jaunes natifs déjà publiés ; aucune illustration non validée ni source d'assets parallèle.

## Validation / publication
- Test `tests/integration/veldra-five-skills-relay-20261117.test.mjs` : les 5 transferts natifs, le loadout, réanimation KO, PV plafonnés, bonus et durée, conservation Veldra sortant, contrôle réserves/échanges, interdiction de cible ennemie, cooldown et cinquième tick exact avec/sans marque.
- Anciens tests de non-régression et comptages Showcase mis en phase **seulement** avec l'ajout autorisé de cinq capacités, sans supprimer leurs assertions.
- Requis pour GREEN : CI 5/5 sur SHA exact, vrai navigateur éditeur/2v2 et Android paysage, source HTTPS Pages sur le SHA de `main` après merge, checkpoint GREEN, vérification PWA séparée. Les échecs ne doivent pas être masqués.
