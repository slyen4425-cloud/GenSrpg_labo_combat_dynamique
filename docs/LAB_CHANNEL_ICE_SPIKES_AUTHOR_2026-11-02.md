# Pique de glace canalisée — parcours auteur et animation surgissant du sol (2026-11-02)

## Retour et cause
L'auteur a configuré « Pique de glace » sur son téléphone, puis « Vérifier / Tester en combat » a affiché : `channeling cannot combine with contactHold/charged skills/expanding projectiles`. Le contrat natif `SkillDefinition` refuse **toute** canalisation de forme Projectile, ce que ce message anglais ne précise pas. Dans le même temps, la trajectoire « Sous la cible » a été présentée dans le menu Projectile. L'éditeur n'empêchait pas de rechoisir Projectile après avoir activé Canalisation, et un tick jouait seulement un sprite Impact au centre du corps. La combinaison décrite par l'auteur était donc impossible à sauvegarder alors que son intention (pics montant sous une cible à répétition) est réalisable sans projectile physique.

## Modèle sans double autorité
- Pour des pics qui sortent du sol, le **Gameplay** reste une zone ciblée : `form:"area"`, aucun projectile natif, `SkillDefinition.channeling.effects` est la SEULE source des dégâts par tick. `CombatSession` paie énergie et applique les effets ; `CombatRuntime` valide le tick et son timing. `effect.damage=0` et `effects=[]` au lancement empêchent les doublons. Aucune modification de SkillDefinition/Session/Runtime.
- La **présentation** native peut utiliser `visual.travel.trajectoryMode:"under_target"` même sur une forme Zone. Le Render Adapter existant reçoit `type:"channel-pulse"` exclusivement via les callbacks `onChannelTick` en 1v1 et 2v2 (même propriétaire).
- Si un sprite Trajet a le mode `under_target`, l'animation est créée une seule fois **par tick accepté**, ancrée au pied du modèle cible, évoluant visuellement depuis le sol sans collision, sans projectile simulé, sans nouveau timer, ni dégât par FX. Le sprite Impact est conservé comme comportement de repli pour les autres canalisations. Le son d'impact existant est joué par le callback natif. Le Cast est réservé au lancement.
- Choisir une **vraie forme Projectile** avec Canalisation reste interdit explicitement : seuls les sprites et trajectoires visuels de zone sont réutilisés. Cela protège les anciennes collisions, renvois, murs et esquives contre une seconde autorité.
- Le preset de l'éditeur `data-skill-channel-ice-preset` configure `area`, Glace, mode visuel `under_target`, 12 dégâts/tick, intervalle 1000 ms, max 4 ticks, durée max 5000 ms, 3 énergie/tick. Les valeurs sont des exemples éditables. Il ne renomme ni la capacité ni son ID, ni ne remplace les médias choisis ; il ne supprime aucun effet non migrable. Il s'abstient en cas de combinaison ambiguë et explique pourquoi. Un changement tardif sur `form:projectile` durant une canalisation est réorienté visiblement vers Zone/Rayon avec message.
- Le panneau Canalisation explique le rôle exact de Cast/Trajet/Impact/Son et dispose du bouton « Choisir le sprite des pics (Trajet) », qui ouvre et focalise le **même** sélecteur canonique Trajet (sans second média, sans ID manuel).

## Validation
- TDD RED : `tests/unit/capture-ice-spikes-channel-ux-2026-11-02.test.mjs` ajoutée avant modification. Vérifie la validité de `area + channeling`, le maintien des règles interdisant le vrai `projectile + channeling`, la présence du preset, le routage natif des ticks.
- Chromium réel `tests/browser/capture-channel-mine-editor-smoke.mjs` : clique Nouvelle capacité, choisit Pics de glace canalisés, vérifie les effets et l'impossibilité de revenir à un Projectile invalide, puis utilise **Enregistrer comme nouvelle** et constate la fiche dans le sélecteur.
- Chromium `tests/browser/capture-ice-barrier-editor-smoke.mjs` : vrai DOM Render Adapter `channel-pulse` au bas du modèle, transformation sur son point d'ancrage, sans déclencher de contact projectile. Les tests natifs de runtime et les autres FX servent de sentinelles.
- CI Foundation + quatre navigateurs sur SHA final code+tests+docs ; checkpoint GREEN exact et PR `gh-pages`. Vérification Pages et CI postfusion. Test tactile Android distinct, données locales de l'utilisateur non accessibles pour édition directe.

## Gouvernance
Base `gh-pages@6a932f46b212a9eb84828b7958f1f1cfb0bad81b`.
START `checkpoint/lab-start-channel-ice-spikes-ux-2026-11-02`.
WORK `work/lab-channel-ice-spikes-ux-2026-11-02`.
PR #201 ; aucun changement sur `main`, `global-assets`, GenSrpg ou Exploration ; aucun fichier utilisateur écrasé.
