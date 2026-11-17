# Bestiaire officiel — 19 portraits narratifs enrichis (17/11/2026)

- Dépôt propriétaire : Labo Combat `main`, base `d4a1fa607db7c6c4088f7361fdb8ef80d2878a92`, checkpoint de départ `checkpoint/lab-start-bestiary-19-portraits-20261117`.
- Audit : les 22 transferts du manifeste Showcase sont publiés avec front/back/icône du registre global `global-assets`; 19 descriptions initiales font moins de 110 caractères ou se limitent à `Na`.
- Les 19 portraits sont désormais stockés dans une **seule source éditoriale dédiée** : `data/capture/bestiary/official-lore.v1.json`. Deux phrases au minimum, français soigné, traits et éléments cohérents, sans ajout de règles.
- **Contrainte vérifiée par CI RED initiale** : les 19 transferts d'auteur `data/capture/showcase/*.capture-creature-transfer-v1.json` sont archivés/garantis octet-par-octet par des sentinelles historiques (28 échecs quand seul `draft.description` était modifié). Cette proposition a été **retirée** : les fichiers des créatures doivent conserver leur blob SHA exact.
- Distinction claire des responsabilités : les exports auteurs restent les sources officielles du gameplay et de la description **d'origine** ; le Bestiaire Showcase possède une unique couche de prose **éditoriale publiée**, optionnelle dans `captureBestiaryCardsV1({publishedLore})`. Ce n'est pas un second catalogue de créatures ni une duplication d'images, de stats ou de descriptions techniques. L'éditeur et les univers personnalisés n'utilisent pas cette couche : ils lisent intégralement leurs descriptions propres.
- Les trois descriptions déjà étoffées — Sylvorne, Sélachombre, Vyrâme — continuent d'être lues directement depuis leur export auteur sans entrée de substitution.
- L'unique lecteur `examples/dom-demo/bestiary.js` charge le JSON lors de l'affichage du Bestiaire officiel et le transmet au projecteur natif ; aucun moteur, ID, statistique, capacité, loadout, image ou source de sauvegarde modifié.
- Test de non-régression `tests/integration/capture-bestiary-published-portraits-20261117.test.mjs` : exactitude des 19 IDs, descriptions qualitatives et uniques, modèle Bestiaire avec couche autorisée et absence de couche pour les univers personnalisés. Les sentinelles de provenance auteur restent strictement inchangées.
- Aucune modification PWA, Exploration, Donjon, Survie ou visuels. Percée d'aurore reste une attaque aérienne sans sprite dédié sur instruction auteur.
- Gates : CI cinq jobs sur SHA exact, vrai navigateur, publication depuis `main`, preuve Pages/HTTPS, checkpoint GREEN après contrôles.

19 portraits : Grainou, Moussados, Venombre, Kitsune Lunaire, Loup volcanique, Gorice, Gemmor, Maraileron, Ailevent, Voltige, Dracendre, Freclairions, Lumilo, Noctigriffe, Scarabacier, Krakenor, Veuve jaune, Ephemus, Veldra.

## Contrôle CI bloquant et correctif restreint
Sur les deux CI du commit `da686d048be080e62133e1e16c5d6ae60931811f`, les 2817 tests de fond et quatre jobs sont verts, mais le navigateur 2.5D échoue dans le contact alpha, écart 8.47 px. La fixture historique possède des positions où seul le bord des vrais masques se touche avant le premier rAF headless. Checkpoint `checkpoint/lab-bestiary-before-ci-shadow-contact-fix-20261117`.
Le correctif ne modifie **que** la position du combattant test dans cette fixture après la vraie transition initiale de l'approche, et exige encore intersection des vraies silhouettes, contact natif, pause et restauration. Aucun test affaibli, aucune modification gameplay. Ne fusionner que si 5/5 GREEN sur SHA exact.
