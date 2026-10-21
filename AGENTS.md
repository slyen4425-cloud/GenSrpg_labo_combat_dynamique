# Instructions permanentes pour assistants — laboratoire de combat / assets

Ce dépôt est un chantier GenSrpG autonome. La référence normative reste `docs/LAB_CHARTE.md` et sa politique de checkpoints.

## Attente explicite de l'auteur : accès et outils

L'auteur a rappelé **le 21 octobre 2026** qu'il a fourni et configuré les accès et les outils nécessaires aux travaux dans ChatGPT. **La première obligation de l'assistant est de rechercher les accès et outils réellement disponibles avant de dire qu'il ne peut pas accéder à GitHub ou agir sur le dépôt.**

Ne jamais confondre un échec de `web`, un DNS bloqué dans un terminal local, ou un changement de conversation, avec une absence de connexion GitHub. En particulier, les outils GitHub sont souvent exposés dans `functions.exec` sous le préfixe `mcp__GitHub__`, et peuvent être découverts via `ALL_TOOLS`.

### Procédure obligatoire sur chaque reprise

1. Lire la charte, la roadmap, `docs/LAB_CURRENT_WORK.md` et les checkpoints pertinents **sur GitHub** avant d'éditer le projet.
2. Découvrir les outils de la session, particulièrement `functions.exec` / `ALL_TOOLS`, les connecteurs `mcp__GitHub__` et tout autre outil pertinent disponible.
3. **Tester une vraie opération** avec l'outil adapté (lecture du dépôt/branche, inspection des fichiers et CI). Ne pas déclarer indisponible un accès qui n'a pas été testé.
4. Pour les travaux demandés, agir soi-même avec les outils disponibles, sans substituer un prompt à exécuter ni renvoyer d'office l'auteur vers GitHub. Ne demander une action manuelle que si l'opération nécessaire est effectivement impossible via les outils présents et après recherche de solutions alternatives.
5. Si l'opération demande de transférer un fichier binaire, vérifier les méthodes d'écriture et les workflows de dépôt existants avant de conclure à un blocage. Le fait de pouvoir lire GitHub ne garantit pas que tous les transferts binaires soient permis.
6. Ne pas inventer de connexion, de permission, de modification, de publication ou de test : distinguer clairement **accès vérifié**, **travail effectué**, **CI vérifiée**, **publication effective** et **blocage réel**.
7. Si une permission manque, rapporter le nom de l'outil essayé, le type d'erreur et l'étape non accomplie, puis proposer la seule action utilisateur réellement nécessaire.
8. Respecter `main` protégé, `global-assets`, une branche par lot, checkpoints, CI, validation des vrais médias et limites d'indépendance du labo.

### Point important : limites exactes

Cette règle enregistre la **préférence et les autorisations déclarées par l'auteur** ; elle **ne crée ni connexion nouvelle, ni permissions illimitées**. Les outils et capacités peuvent différer entre sessions. Il faut **vérifier ce qui est disponible**, pas affirmer par réflexe que « tout est inaccessible » ni garantir que « tout est accessible ».

### Rappel de reprise

**Ne plus répondre « je n'ai pas les accès GitHub » sans avoir découvert et tenté les outils GitHub de la session.** La charte §32 contient déjà cette obligation. Lire aussi §34 pour la vérification des assets réels.

Les travaux de création/modification dans ce dépôt se font directement lorsqu'ils sont autorisés et possibles, avec preuve de commit, SHA, CI et état honnête.
