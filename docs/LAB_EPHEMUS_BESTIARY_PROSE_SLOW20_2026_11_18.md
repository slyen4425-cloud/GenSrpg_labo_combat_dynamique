# Éphémus — Ralentissement 20 s et descriptions Bestiaire lisibles — 18 novembre 2026

## Périmètre et provenance
- Retour de test auteur réel sur les captures du Bestiaire Éphémus (Labo Combat).
- Base unique : \`main@2b957411cd7d8a7cea60ddf683045fe2e8af40b6\` ; checkpoint START \`checkpoint/lab-start-ephemus-prose-slow20-20261118\`.
- Branche temporaire \`work/lab-ephemus-prose-slow20-20261118\`, fusion sur \`main\` uniquement si cinq jobs CI sur le SHA exact, vraie projection Bestiaire et déploiement Pages prouvés. \`global-assets\` est lecture seule dans ce lot.
- Fichiers métier autorisés : \`data/capture/showcase/ephemus-battement-limbes.capture-skill-transfer-v1.json\` (seulement description + durée du seul ralentissement), \`data/capture/showcase/ephemus-danse-mille-ames.capture-skill-transfer-v1.json\` (description uniquement), \`src/ui/capture-skill-explanation-v1.js\` (unique traduction française des statuts, zones et canalisations), deux imports ESM cache ciblés, sentinelle intégration, présente note et \`docs/LAB_CURRENT_WORK.md\`.
- Protégés : niveaux de compétences, dégâts, énergie, CD, durée du Silence, Voile, ticks et bonus de l'ultime, runtime, créatures voisines, catalogue et ZIP originaux, PWA, Explo/Donjon, données joueur et branches d'autres agents.

## Retour auteur et résultat attendu
1. **Battement des limbes** : conserver l'augmentation native de **30 % du temps d'approche**, mais passer sa durée de **3 à 20 secondes** ; ne pas prétendre une baisse directe de vitesse si le propriétaire moteur utilise \`approach_time_modifier\`. Garder le Silence conditionné par Voile à 1,5 s.
2. **Lanterne des âmes** : le Bestiaire ne doit jamais afficher \`incoming_damage_channel_modifier\`. Le même projecteur \`describeCaptureSkillV1\` traduit le statut \`incoming_damage_channel_modifier\` en **+20 % de dégâts d'Esprit reçus** dans la zone, pendant 5 s, avec 4 dégâts d'Esprit chaque 0,5 s. Aucune nouvelle valeur de gameplay.
3. **Danse des mille âmes** : texte lisible depuis le contrat : canalisation de 3 s, 6 pulsations de 10 dégâts d'Esprit (60 de base si toutes touchent), ralentissement d'approche renouvelé à chaque tic, bonus conditionnel de 40 sur la dernière pulsation sous Voile, interruptions natives et usage unique.
4. L'éditeur et le Bestiaire continuent d'employer **une seule projection française** fondée sur \`SkillDefinition\`, pas de descriptions métier dupliquées dans l'UI. Cache navigateur ESM actualisé sur les deux lecteurs du Bestiaire.

## Vérifications
- Test reproducteur introduit avant le code : \`tests/integration/capture-ephemus-bestiary-prose-slow20-20261118.test.mjs\`.
- Tests sur l'objet normalisé, l'entrée Bestiaire réelle, les effets et le non-affichage de jargon ; préserver tous les tests historiques et les autres espèces.
- Gate final : CI 5/5 sur SHA exact, revue des fichiers touchés, checkpoint GREEN au commit vérifié, fusion sans force, CI et Pages \`main\` sur SHA fusionné, vérification de l'URL de test. Les simples fichiers sur branche ne sont pas publication.
