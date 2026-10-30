# Audit GitHub Actions du 30 octobre 2026 — Labo Combat

- Branches examinées : `gh-pages` (publication), `main`, et les PR de développement.
- À la date du contrôle : **2 exécutions CI toujours `queued` depuis le 07/10/2026**, toutes deux rattachées à d'anciennes branches ; aucune exécution `in_progress` ni `waiting`.
  - [Run 37642387886](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37642387886) — `preview/lab-cendre-author-export-v3-2026-10-07`.
  - [Run 37642387764](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37642387764) — `checkpoint/lab-cendre-author-export-v3-green-2026-10-07`.
- La publication `gh-pages@4fd0821545eaa41ce1d3115e56f3574db6273426` disposait d'une CI et d'un déploiement GitHub Pages conclus `success`. Ces deux anciennes actions ne sont donc pas établies comme bloqueurs des publications récentes.
- La PR #144 « Liane venimeuse » est ouverte, et les dernières CI de sa branche `6f7e82748…` sont `completed/failure` : **un défaut de test existe réellement** (fondation + smoke bestiaire/éditeur), indépendant des deux vieilles files d'attente. Ne pas masquer ou annuler ces échecs.
- Le connecteur GitHub disponible dans cette session n'expose pas de commande d'annulation Actions. Les deux anciennes exécutions ne sont **pas annulées** par cette livraison ; annulation éventuelle manuelle sur la page du run, après vérification du SHA.
- Correctif de prévention ajouté dans `.github/workflows/ci.yml` : concurrence limitée à la ref exacte et délai maximum de 35 minutes par job. Aucune modification de la mécanique de combat ou du workflow de publication.
