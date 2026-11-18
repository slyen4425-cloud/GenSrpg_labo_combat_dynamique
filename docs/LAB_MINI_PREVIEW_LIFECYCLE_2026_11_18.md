# Chromium mini-preview 2v2 — cycle de vie et diagnostic (18 novembre 2026)

## Constat et preuve
- Base `main@57d2bfc5e6e3428fefe148b80ce963175239abb9`, checkpoint `checkpoint/lab-start-mini-preview-lifecycle-20261118`, branche de préparation `work/lab-mini-preview-lifecycle-20261118`.
- CI main `44366207061` : timeout 40 secondes au smoke Chromium mobile, tandis que les 4 autres jobs réussissent.
- Sur le même ancien smoke, PR Veldra `44366128422` : cinq jobs réussis et démarrage mobile en ~1,5 seconde ; cause du blocage intermittent non démontrée.
- Le smoke ombre 2.5D de `44353246650` échoue indépendamment (contact non déclenché). Aucune relaxation de ce test.

## Contrat et périmètre
- Modifier uniquement le test `tests/browser/expanding-wave-mini-preview-smoke.mjs` ; le site `examples/dom-demo/expanding-wave-2v2-preview.js` dispose déjà du vrai propriétaire `window.addEventListener("pagehide",disposeBattle)`.
- Préserver les 4 modèles, un vrai clic utilisateur, FX `expanding_wave` feu, cible Dragon et couleur auteur, et introduire une vérification observable de libération du propriétaire de session, sur le même test réel.
- Aucun changement gameplay, rendu de production, média, `global-assets`, autres espèces, PWA, sauvegardes, Exploration, Dungeon, branches externes.

## Gate
Test initial RED de sortie de session, correctif minimal de fermeture après les vérifications existantes, CI 5/5 sur SHA exact, vérification Chrome et déploiement Pages même SHA après fusion. Une seule réussite CI ne suffit pas à prouver la disparition définitive de l'instabilité.
