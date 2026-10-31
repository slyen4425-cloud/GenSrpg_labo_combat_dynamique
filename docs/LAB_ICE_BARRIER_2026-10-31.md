# Entité de combat — Mur de glace V1 (2026-10-31)

## Base, gouvernance, autorité
- Base gh-pages `df4c9f8d7da63f7b3f2d94e770d7d7f1e363e570`.
- START `checkpoint/lab-start-combat-ice-barrier-2026-10-31` ; travail `work/lab-combat-ice-barrier-2026-10-31`.
- TDD sentinelle ajoutée en premier : `76295d24195ffc76a921c41ba3d71c3909b8d3e8`. Fix test-fixture : la base Boule de feu apportait une collision projectile invalide pour une compétence self, correctif `675f000201643bbacca8180a93c1d49210128d54`.
- `SkillEffectV1` porte le contrat `summon_entity`, `entityKind=barrier`, `statId`, `hpPerStatPoint`, `interceptKinds`; `Combat State` possède l'unique liste `combatEntities` ; `Combat Damage Application` est seul à réduire les PV de la barrière, comme ceux des combattants.
- `CombatEntityV1` crée la barrière dans l'état de combat lors de la résolution d'un effet natif. Rendu 1v1 et 2v2 = simple projection UI de son état, aucun calcul de dégâts en DOM.
- Aucun nouveau moteur de capture, ni doublon Combat State, ni timer de sprite faisant autorité. `main`, `global-assets`, GenSrpg, Exploration inchangés.

## Contrat du premier jalon
- Formule : `PV max = arrondi_deux_decimales(statValuesById[statId] × hpPerStatPoint)`. Les points sont **figés lors de l'invocation** depuis les statistiques numériques du lanceur. Le registre officiel identifie `glace` ; `ice` est un canal de dégâts différent. Si la stat est zéro, aucune entité n'apparaît.
- Une barrière par créature, compétence et bénéficiaire ; la relancer remplace son état (pas de cumul invisible).
- Elle protège l'acteur désigné contre les attaques de formes sélectionnées : `projectile`, `beam`, `contact`. Le dégât est attribué en priorité aux PV de l'entité. À 0 PV elle est retirée. L'excédent continue vers le combattant, puis ses autres protections.
- DoT, dégâts internes et formes non sélectionnées ne sont pas interceptés. Le lanceur n'est pas bloqué par son propre mur.
- Le mur **n'est pas encore une cible spatiale libre** ; première version = interception défensive sur le combattant protégé. Déplacement 2.5D, projectiles traversants, collisions géométriques, ciblage d'entité direct, IA de familier et durée optionnelle sont explicitement exclus de ce lot. Les familiers doivent réutiliser les contrats de compétences et d'IA existants, pas un deuxième moteur.
- Création sans saisie d'ID technique via `Effets tactiques > Invoquer un mur / obstacle destructible`. Choisir stat officielle, coefficient de PV et formes d'attaque interceptées.
- Preset `mur_de_glace` ajouté à la bibliothèque officielle avec une seule autorité de catalogue. Aucun asset inventé ; l'overlay glace + jauge PV est temporaire jusqu'aux sprites auteur.

## Preuves et validation
- Test `tests/unit/capture-combat-entity-ice-barrier-2026-10-31.test.mjs` : contrat, Glace 80 → 80 PV, mur unique, absence à 0, 30 dégâts interceptés, 65 suivants → 50 mur et 15 créature, DoT/self conservés, bestiaire et import du preset.
- Test Chromium réel `tests/browser/capture-ice-barrier-editor-smoke.mjs` : auteur Glace et coefficient dans l'éditeur, rendu de 80 PV puis 55 après vraie application de 25 dégâts par Combat Damage.
- CI Foundation + 4 navigateurs, puis checkpoint GREEN final et PR gh-pages. Test physique smartphone différé à la demande utilisateur.
