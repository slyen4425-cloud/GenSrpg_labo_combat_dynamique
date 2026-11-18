# Éphémus — zones/FX canalisés et signal IMMATERIEL — 18 novembre 2026

## Diagnostic constaté sur source unique
- Auteur : en combat, Lanterne (compétence 4) ne laisse aucune zone visible et paraît ne rien faire ; Danse (ultime) ne montre pas sa canalisation ; les frappes annulées par Chrysalide ne signalent pas l'immatérialité.
- Base officielle : \`main@f51010c525bc6ebba5d95795739e66d937291961\` ; checkpoint START \`checkpoint/lab-start-ephemus-fx-intangible-20261118\`, branche temporaire \`work/lab-ephemus-fx-intangible-20261118\`, seule autorité de livraison \`main\`.
- Constat : Lanterne est une véritable paire de \`persistent_zone\` 5000ms, 500ms, mais son sprite est placé dans \`visual.impact\`, alors que le rendu des zones réelles consomme exclusivement \`visual.aura\`. L'absence de représentation oblige le moteur de zone à utiliser une approximation de portée hors des échantillons visuels. Une zone ciblée doit couvrir sa cible choisie à longue portée ; renderer et fallback doivent partager le même centre ciblé.
- Danse est un \`beam\` canalisé (3s, 6 ticks) et non une zone persistante. Son seul média est placé dans \`visual.travel\` alors que \`travelMs=0\`. Le propriétaire existant supporte déjà un \`cast\` tenu jusqu'à \`onChannelEnd\` et un \`impact\` au rythme des vrais ticks.
- Chrysalide applique le statut natif \`immunity\` avec \`intangible:true\` pendant 10s. Les frappes bloquées restent historiquement \`outcome:hit\` avec \`appliedDamage:0\`, mais aucun marqueur visuel de raison n'était projeté. Réutiliser le propriétaire existant : \`applyCombatDamageV1\` → \`hit\` event → \`planSkillOutcomeFx\` → étiquette DOM \`miss\` personnalisée, uniquement si protection \`intangible\` prouvée, jamais pour esquive ordinaire, défense ou mur.

## Périmètre autorisé
- Deux fiches \`data/capture/showcase/ephemus-{lanterne-ames,danse-mille-ames}.capture-skill-transfer-v1.json\` : uniquement \`draft.presentation.visual\`, zéro modification dégâts, zone native, coûts, temps, mécaniques et marqueurs.
- Source de zone existante \`src/core/combat/persistent-zone-runtime-v1.js\` : fallback ciblé uniquement, sans règle de jeu parallèle.
- Source de rendu \`src/adapters/renderer/dom-skill-fx.js\` : représentation des zones réelles sur l'ancre de leur cible si la zone est explicitement ciblée et texte MISS personnalisé.
- Propriétaire dégâts \`src/core/combat/combat-damage-application-v1.js\` : drapeau descriptif immatérialité dérivé du même résultat de protection, jamais nouvelle immunité.
- Propagation de l'événement dans \`src/core/combat/action-resolver.js\` et \`src/core/combat/immediate-tactical-effects-v1.js\`. Plan visuel \`src/core/fx/skill-fx-plan.js\`, \`src/adapters/renderer/combat-resolution-presenter.js\` pour supprimer uniquement le recul d'une attaque réellement annulée par l'immatérialité.
- Tests intégration/rendu existants + test reproducteur \`tests/integration/capture-ephemus-visible-zone-channel-immunity-20261118.test.mjs\`.
- Références autorisées : seulement dix WebP déjà présents en \`global-assets\`. Ne pas modifier \`global-assets\`, sprites, PWA, autres espèces, exploration, donjon, règles de combat des autres capacités, stats/sauvegardes.

## Gates
- RED reproducteur sur la branche avant correctifs.
- CI navigateur + tests natives, pas de faux GREEN.
- Revue au SHA exact, checkpoint GREEN uniquement après 5/5 CI et vrai rendu; merge sur \`main\` non forcé; CI après merge et publication Pages du SHA exact, sans créer de publication parallèle.
