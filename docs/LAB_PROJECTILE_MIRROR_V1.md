# Projectile Mirror V1 — renvoi réellement simulé (13 octobre 2026)

## Mission et limites

Faire repartir un projectile droit lors du contact visible avec un statut `projectile_mirror`, et lui faire toucher une cible réellement au retour. Ne pas confondre avec `damage_reflection`, qui retourne une fraction des dégâts déjà subis. Ne pas réutiliser la réaction historique `reaction.reflectForms`, qui ne décrit pas de trajet inverse.

Aucun fichier de compétence ou de créature auteur n'est modifié par le chantier. Aucun changement de `main`, `global-assets`, `Zombicide-40k` ou du laboratoire Exploration.

## Autorités et chaîne opérationnelle

1. L'éditeur natif offre le statut bénéfique `projectile_mirror` via l'effet existant `apply_status` (ciblage `self` ; durée et renouvellement communs), avec son visuel de statut optionnel. Le statut est distinct des renvois chiffrés.
2. `DomSkillFxRenderer`, détecteur existant d'intersection continue contre le masque opaque de la créature, émet sa position d'impact réelle `contactPoint` et l'identité canonique du projectile dans `onProjectileContact`. Les deux UI 1v1/2v2 transmettent ces données sans règle parallèle.
3. `CombatRuntime.reportActionContact` valide le contact. Si la créature ciblée possède un miroir actif, si le tir est de forme `projectile` direct et si la limite de renvoi n'est pas atteinte : `CombatSession.completeAction(... forcedOutcome:"mirrored")` termine le vol sortant **sans appliquer de dégâts**. L'action originale termine son cycle normalement.
4. Le même `CombatRuntime` crée un record secondaire `mirrorReturn`, portant la compétence initiale, le véritable lanceur, la créature qui renvoie, le nombre de rebonds, le point visuel de contact et la durée de trajet. Ce record est inséré dans **le même scheduler et les mêmes collisions `projectile-clash`** mais n'occupe pas le slot d'action propre au défenseur ; il ne consomme pas à nouveau énergie/charge/compétence.
5. `CombatResolutionPresenter` et `planSkillReleaseFx` redessinent l'ancien projectile en sens inverse **depuis `contactPoint`**, vers son vrai lanceur. Le présentateur n'invente pas une nouvelle attaque de la créature qui tient le miroir. Les effets, l'audio de trajet, la trajectoire, les masques et la collision existants sont réutilisés.
6. Un nouveau `reportActionContact` du projectile retourné appelle `CombatSession.completeAction` et l'autorité `applyCombatDamageV1` **une seule fois**, avec les résistances/protections de la cible réelle et les statistiques offensives originales ; le crédit des dégâts/KO revient à la créature ayant renvoyé le projectile. L'action automatique ne déclenche pas une seconde expiration des statuts de fin d'action.
7. Un projectile de retour sans contact visuel se termine en `evaded` au temps limite, sans dégâts. Les projectiles `fixed_point` (chute du ciel) ne sont pas réfléchis par cette première version. Les deux miroirs simultanés peuvent renvoyer jusqu'à deux fois ; un troisième contact termine normalement l'action, évitant une boucle infinie. Les règles historiques `damage_reflection`, `immunity`, bouclier, esquive, KO et collision de projectiles demeurent propriétaires de leurs moteurs existants.

## Tests TDD et protection

- RED de référence : `4db9fde751593848c879039ef8d76e50a9b08f4c` / [CI 38335885725](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/38335885725) : 3 nouveaux tests échouent car `projectile_mirror` n'est pas reconnu ; 1 596 tests existants réussissent et les deux Chromium réussissent.
- Les nouveaux tests `tests/integration/projectile-mirror-real-flight-v1.test.mjs` couvrent le cast du miroir, la collision initiale, les PV intacts avant retour, l'identité acteur/cible et la position visuelle d'origine du retour, la collision de retour en 1v1 et 2v2, le raté sans contact, le double miroir borné, le KO crédité et la compatibilité avec `projectile-clash`.
- Les deux anciens tests de contact continu (`projectile-model-contact-v1` et `projectile-contact-precision-v2`) vérifient toujours l'identité exacte et désormais les coordonnées numériques finies. Les autres sentinelles sur impact, audio, roster, Projectiles directs/fixes, statuts et bibliothèque de créatures restent dans la CI complète.
- Note : les tests Node valident la mécanique et l'acheminement jusqu'au renderer ; les deux suites Chromium de CI protègent le démarrage réel et la croissance Firestorm. Une validation visuelle sur smartphone paysage du nouveau Miroir reste nécessaire avant GREEN utilisateur.

## Livraison et statut

Base GREEN : `ffd0318fb7b45ae1fd2a1caab6c9711e12d6c818`.

Checkpoint de départ : `checkpoint/lab-start-projectile-mirror-v1-2026-10-13`.

Branche isolée : `work/lab-projectile-mirror-v1-2026-10-13`.

Le checkpoint de fin, la CI finale et le SHA Pages doivent être inscrits dans `docs/LAB_CURRENT_WORK.md` **seulement après vérification**. L'état technique n'est pas présenté comme validation Android de l'utilisateur.
