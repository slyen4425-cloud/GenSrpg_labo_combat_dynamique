# Jet acide (Venombre) — intégration auteur du 24 octobre 2026

## Contrat de travail
- Requête : importer exactement l'export auteur `gensrpg-capture-skill-cap_poison_atk_3.json` (`cap_poison_atk_3`, « Jet acide »).
- BASE : `gh-pages@f5c3c3eef363ad6c6f943328b36ee9de6e9f13be`, START : `checkpoint/lab-start-jet-acide-2026-10-24`, travail : `work/lab-jet-acide-2026-10-24`.
- Diagnostic : `cap_poison_atk_3` existe uniquement comme définition historique native (ancienne attaque de mêlée / puissance 5 / niveau 10) et pas encore dans le manifeste Showcase des capacités configurées. Venombre `crea_tox_2` l'équipe en slot 2. La version exportée doit prendre l'autorité par ID stable et priorité des configuredSkills.
- Autorité cible : `data/capture/showcase/cap_poison_atk_3.capture-skill-transfer-v1.json` ; archive d'origine, sans seconde autorité, `data/capture/source-exports/cap_poison_atk_3.author-export-2026-10-24.json`.
- Propriétaire registre : `src/catalogs/capture-showcase-skill-presets-v1.js` ; un seul chemin, une seule occurrence. Ne pas réécrire le catalogue natif historique.
- Données auteur **intactes** : dégâts 16 Poison ignorant 50 % résistance et 50 % réduction de dégâts ; applique −250 points Défense pendant 15 s ; énergie 4, recharge 30 s, préparation 658 ms, trajet 800 ms ; statut visuel `status-2` lié à `pack:capture:sprite-status-curse-01`. Présentation `visual={}` et `audio={}` volontairement conservée, sans ajouter d'icône inventée.
- Périmètre : nouveau transfert, archive source, manifeste, tests de fidélité/round trip/chargement réel/présence chez Venombre/Combat, docs et journal.
- Protégés : moteur et contrats, autres capacités et créatures, loadouts et stats, éditeur, bibliothèque visuelle, GenSrpG principal ; aucun asset supposé « publié » sans preuve.
- Tests : SHA256 du fichier auteur + égalité octet archive/transfert ; unique entrée manifeste ; import `importCaptureTransferJsonV1` ; application en remplacement par l'autorité configurée et rechargement ; combat réel avec dégâts et malus ; description Bestiaire fidèle ; CI 5 jobs. GREEN SHA exact et fusion seulement quand CI complète verte.
