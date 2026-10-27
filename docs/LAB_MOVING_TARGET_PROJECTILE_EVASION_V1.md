# Combat — projectile contre une cible en déplacement actif V1

Date : 11 octobre 2026.

## Problème
Le projectile `skyfall` fixe sa destination à la position de la cible **au lancement** via `DomSkillFxRenderer`, mais `CombatRuntime` possède une échéance de résolution nominale même sans signal visuel de contact. Jusqu'ici, `ActionResolver.mobilityEvasionFor` n'évitait un projectile que si la compétence de la cible autorisait explicitement `evasion.window="travel"` et `incomingForms=["projectile"]`. Les dommages pouvaient donc être appliqués alors que la cible était dans une approche en déplacement et que le projectile était tombé à son ancien emplacement.

## Correction native et bornée
Dans `ActionResolver` (unique source de résolution), un projectile offensif rate désormais une cible qui effectue **activement** un trajet `ground`, `aerial`, `teleport` ou `burrow`, entre `releaseAtMs` inclus et `impactAtMs` exclu de l'action cible : `outcome="evaded"`, `evasionReason="moving_target"`. Ce mécanisme réutilise la projection existante `MISS` et n'introduit aucun timer ni collision cachée. La protection de présence souterraine reste prioritaire ; une capacité déclarant une portée de présence spéciale préserve son fonctionnement existant.

Les projectiles classiques et skyfall partagent `form="projectile"`, il n'y a pas d'import FX dans le Core. Cible statique touchée normalement ; les compétences non-projectiles ne reçoivent pas cette esquive automatique ; le vieux mécanisme d'esquive explicite reste conservé.

## Frontières et limites
Le trajet FX reste figé à sa géométrie de lancement ; l'impact est affiché sur la cible seulement si le Combat Runtime signale `hit`. **Limite délibérée** : la seule information gameplay disponible ici est l'action de déplacement active. Le cas d'une créature déplacée à la main/visuellement hors des `CombatRuntime` skill travels (par exemple changement instantané de distance) n'est pas encore une collision spatiale autoritaire ; ce futur chantier exige un contrat de coordonnées/impact, pas un listener DOM faisant autorité pour des dégâts.

Aucun changement à `SkillPresentationBindingV10`, `DomSkillFxRenderer`, aux sprites/FX, au Collision Sensor, aux compétences auteur, au moteur projectile clash, aux statuts, à `main`, `global-assets` ou aux autres laboratoires.

## TDD / livraison
- Base `gh-pages` `58b07daaf8d71ec65bdecd30036384bc944230cf` après publication du lot Burrow ; checkpoint `checkpoint/lab-start-moving-target-projectile-evasion-v1-2026-10-11` ; branche `work/lab-moving-target-projectile-evasion-v1-2026-10-11`.
- Test RED `10c86401132888dbea79e3550a688b9deeef097d` : Runtime mouvement ground + projectile offensif sans preset d'esquive ; sentinelles cible statique et non-projectile.
- Correctif `de00a42222acd984edd4570befddac6e374b9df8`.
- CI Node/Chromium, checkpoint final et publication `gh-pages` en fast-forward sous lease nécessaires au GREEN ; test Android utilisateur distinct.
