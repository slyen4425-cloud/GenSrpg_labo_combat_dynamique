# Veldra — Import auteur de deux JSON, tailles FX et sons natifs (18 novembre 2026)

## Source et frontières
- Source unique : Labo Combat \`main@f51010c525bc6ebba5d95795739e66d937291961\`.
- Checkpoint START : \`checkpoint/lab-start-veldra-author-json-audio-scale-20261118\`.
- WORK temporaire : \`work/lab-veldra-author-json-audio-scale-20261118\`.
- Entrée auteur : \`gensrpg-capture-skill-veldra-egide-zenith.json\` (SHA256 \`abb5777cc2ce45eab41e7842fc66370d66bbb0bdd3ad3018dfcf225212695615\`), \`gensrpg-capture-skill-veldra-plume-solaire(1).json\` (SHA256 \`14d66bef3779e895fefe6e4cadb6aa637993f1a1af56d79f886c0630bb1831e1\`). Ces fichiers sont les sources auteur du présent lot. Pas de copie redondante dans le dépôt.
- Objet : appliquer les valeurs du JSON auteur sur les deux fiches canoniques \`data/capture/showcase/veldra-{egide-zenith,plume-solaire}.capture-skill-transfer-v1.json\`, et compléter uniquement les présentations FX/audio des trois autres compétences Veldra.
- Aucun autre propriétaire : ni \`global-assets\`, ni catalogue audio, ni \`main\` concurrent, ni Éphémus actif sur \`work/lab-ephemus-fx-intangible-20261118\`, ni PWA, ni donjon/exploration, ni sauvegardes.

## Différences auteur retenues et compatibilité
- **Égide du zénith** : son de cast \`gensrpg:sound:genrpg-pack2-34855cd9\` (volume 1, sans boucle) ; sprite de cast échelle \`2\`, ancre source libre, décalage Y +30, opacité 0,5, offsetMode \`same\`, couche front sur les deux vues.
- **Plume solaire** : projectile échelle \`1.5\`, ancre \`mouth\`, couche front sur les deux vues, effet 16 frames inchangé ; son projectile \`gensrpg:sound:genrpg-pack2-9291c6e4\` (volume 1, boucle native stoppée au terme du trajet). Temps de trajet auteur \`700 ms\` (avant 500) et récupération \`0 ms\` (avant 150). Dégâts et Marque solaire inchangés.
- Le fichier auteur de Plume utilise une présentation historique V2 ; la présentation canonique reste en **V9** pour ne pas dégrader le moteur actuel. Les champs fournis ont été transposés sur V9, sans seconde autorité ni nouveau skill ID. Les durées FX sont pilotées par les valeurs gameplay existantes ou les réglages de phase, pas par un séquenceur parallèle.
- Les champs de gameplay inchangés sont conservés ; les ajouts de défauts explicites présents dans l'export ne modifient pas les règles.

## Trois compétences restantes — sons du catalogue officiel existant
- **Percée d'aurore** : impact échelle 1,2 ; cast \`genrpg-pack2-99a48e77\` (Air cast1, 0,75), impact \`tower-6472dc3b\` (t6 ability, 0,7).
- **Rayon cardinal** : impact échelle 1,15 ; cast \`genrpg-pack2-a0b4a892\` (Ligth cast1, 0,75), impact \`tower-6472dc3b\` (t6 ability, 0,5). Conserver le faisceau natif et ses 5 ticks.
- **Relève céleste** : cast échelle 1,3 ; cast \`genrpg-pack2-b8525ce4\` (Ligth cast3, 0,75) et release \`academie-ca7e09ad\` (heal, 0,65). Conserver la réanimation et les 100 PV.
- IDs complets préfixés \`gensrpg:sound:\`; résolveur unique \`src/assets/private-audio-runtime-library-v1.js\` depuis \`data/presentation/audio/private-audio-runtime.v1.json\`. Aucun fichier audio supplémentaire, pas de copie des 203 médias.
- Les tailles et volumes des trois compétences complémentaires sont des valeurs initiales modestes à inspecter en rendu PC/mobile, **pas une validation artistique définitive**.

## Validation
- Test TDD créé **avant** les modifications : \`tests/integration/capture-veldra-author-json-audio-scale-20261118.test.mjs\`. Foundation sur commit RED \`18d067b3c56f0b355c746f1ef61ca9f91b64f029\` = 3 échecs ciblés sur taille, audio utilisateur et couverture 5 compétences ; autres tests conservés.
- Assertions d'import exact, du contrat de présentation V9, des 5 sons au minimum, des fichiers MP3 physiques, du résolveur officiel.
- Pour GREEN : CI 5/5 sur SHA final, contrôle navigateur éditeur/combat, checkpoint GREEN, PR vers \`main\` sans force, puis CI et déploiement Pages exact. Si le navigateur échoue, l'annoncer et ne pas valider rétroactivement.
