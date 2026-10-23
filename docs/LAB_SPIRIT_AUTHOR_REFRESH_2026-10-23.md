# Capture — mise à jour ciblée des exports auteur Spirituel et Marqueurs (23/10/2026)

## Sources auteur
Trois fichiers joints explicitement : `gensrpg-capture-skill-fleche_spirituel.json` (SHA256 239933c58c9620d8b070f5a19ab248913b569648d413e6f8b6037c0360f494b9), `gensrpg-capture-skill-Onde-Spirituel.json` (SHA256 ae0b511f7c109c999b7996d20e6f887e7dbc0c1e08a5d39c6a134064246a615d), `gensrpg-marqueurs.json` (SHA256 c8e2ade953e2abcbfa965d7016e45687103493a5e2ee2b2d17ead788af0998d4).

## Diagnostic et objectif
Les deux capacités existent déjà dans Capture avec les IDs littéraux `fleche_spirituel` et `Onde Spirituel`. La flèche actuellement publiée reste un contact sans visuel et contient un ancien seuil trois charges ; la nouvelle source auteur est un vrai projectile, avec un effet individuel de ralentissement et de nouveaux assets. Onde Spirituel apporte un nouveau visuel de bouclier et un son. La bibliothèque active de marqueurs contient déjà Venin statique et Peste ; le nouvel export ajoute Éclat spirituel.

## Périmètre
Remplacer **uniquement** les deux fiches `data/capture/showcase/{fleche_spirituel, Onde Spirituel}.capture-skill-transfer-v1.json`, la bibliothèque active `data/capture/showcase/markers.capture-markers-v1.json` avec les trois marqueurs auteur et archiver les trois fichiers complets dans `data/capture/source-exports/...` datés du 23/10. Ne pas modifier les autres capacités, Kitsune, anciens exports datés du 22/10, catalogue d'IDs (déjà enregistrés), moteur Combat ni statRegistry. Pas de conversion des champs auteur : provenance conservée. Marqueur Éclat identique dans la définition partagée et la capacité.

## Tests
Normaliser chaque capacité par `normalizeCaptureSkillTransferV1`, utiliser le véritable import, normaliser les trois marqueurs, vérifier l'identité de `eclat-spirituel` dans les deux sources, éléments/visuels/audio, préserver Venin et Peste sans modification. Adapter l'ancien test qui exigeait que les fichiers actifs soient égaux aux archives immuables du 22/10 : ces archives deviennent des témoins historiques. La CI a aussi révélé une sentinelle du 18/10 qui imposait exactement deux marqueurs ; elle vérifie maintenant toujours l'intégrité SHA-256 de son archive historique inchangée et les deux anciens marqueurs inchangés, tout en acceptant Éclat spirituel comme troisième marqueur actif. Nouveaux tests SHA-256 des trois imports auteur du 23/10. CI 5/5 + sentinelle navigateur et checkpoint GREEN avant la fusion. Validation visuelle finale par l'auteur.

## Gouvernance
Base `gh-pages@0c87aabe6187ca980d9ce8fb80d875e90e6aa931`.
START `checkpoint/lab-start-spirit-author-refresh-2026-10-23`.
WORK `work/lab-spirit-author-refresh-2026-10-23`.
Aucun toucher à `main`, aux autres branches, au labo Exploration et au dépôt principal.
