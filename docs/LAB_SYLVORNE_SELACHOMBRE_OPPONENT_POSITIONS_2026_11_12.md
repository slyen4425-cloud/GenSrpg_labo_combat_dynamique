# Ajustements ciblés — Sylvorne et Sélachombre adversaires (12 novembre 2026)

- Base de travail : `main@e7c9269e36fd10d5fe0f4485e4c3669b7f912aad` ; checkpoint de départ `checkpoint/lab-start-sylvorne-selachombre-combat-positions-2026-11-12` ; branche `work/lab-sylvorne-selachombre-combat-positions-2026-11-12`.
- Sylvorne (face adversaire) : même facteur **1,16**, position **Y 0 → +45**, signe positif vers le bas déjà utilisé sur le Loup volcanique. Le joueur (dos) reste à 1,6, Y 0, transform origin 50%/88%.
- Sélachombre (face adversaire) : facteur **1,20 → 0,96** (réduction de 20% sur la dernière publication) ; Y **+45 inchangé**. Vue joueur (dos) **1,74, Y 0**, transform origin 50%/87% inchangés.
- Propriété : **seuls deux transferts canoniques de créatures** changent. Pas de modification de moteur, registre, compétence, stats, médias ou GenSRPG. Les tests couvrent également le transfert vers la métadonnée native d'acteur Sylvorne.
- Barrière de publication : CI complète, tests Chromium et mobile sur SHA exact, fusion contrôlée, revalidation CI/Pages sur `main`, checkpoint de sortie.
