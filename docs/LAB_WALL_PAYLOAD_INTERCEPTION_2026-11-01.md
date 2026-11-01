# Mur de glace — blocage de la frappe entière après contact réel (2026-11-01)

## Reproduction
Sur la version publiée `gh-pages@b6575a9` le mur absorbe les premiers dégâts, mais les dégâts supplémentaires et les statuts négatifs restent appliqués à Gorice ; les mouvements visuels continuent vers lui. L'utilisateur confirme les PV du mur fonctionnels et demande que le mur interrompe l'attaque.

**Base exacte :** `b6575a9ab00e2a777a32b4d9fe686d7f7c29d6fb`. START `checkpoint/lab-start-wall-hit-interception-2026-11-01`. Branche `work/lab-wall-hit-interception-2026-11-01`.

## Diagnostic et propriétaire
L'interception native `interceptCombatBarrierV1` renvoyait `remainingDamage=damage-absorbed` ; le propriétaire `applyCombatDamageV1` appliquait normalement ce surplus aux PV de la créature. `resolveSkillCompletion` exécutait ensuite les interruptions et tous les effets tactiques (statuts négatifs, drain d'énergie, dégâts secondaires, riposte de mêlée) même lorsqu'un `entityId` géométrique était connu. Enfin les attaques exclusivement statutaires avaient `damage=0`, donc `interceptCombatBarrierV1` ne signalait même pas la collision. Ce sont des bugs de résolution, pas des problèmes de cache ni de visuel.

## Correction minimale
- Un mur réellement intersecté arrête **la frappe entière**, y compris une frappe qui le détruit : aucun surplus HP sur la créature pour le même impact. Les dégâts absorbés sont limités aux PV encore présents du mur ; les suivants ne sont pas reportés.
- Une collision confirmée qui porte **zéro dégât** signale quand même `entityId` sans réduire les PV du mur.
- Le résolveur d'action ne signale plus un `hit` corporel ni une riposte de contact / interruption de préparation si l'attaque a touché le mur ; il émet un événement distinct `combat-entity-hit`.
- Les effets hostiles dirigés vers la créature protégée sont arrêtés : dégâts directs additionnels, marqueurs négatifs, étourdissement, drains, KO, dispel, détonation de marqueurs et effets programmés liés à l'impact. Un `effects[].damage` sans dégâts historiques continue de **blesser le mur** avec le propriétaire Combat Damage ; si le mur est déjà détruit pendant cette frappe, ses autres composantes ne passent pas à la créature.
- Aucune protection n'est inventée lorsque le capteur visuel ne confirme pas l'ID exact, ni pour les dégâts de zone/DoT non interceptables ; les effets alliés/self ne deviennent pas des dégâts au mur.

## TDD et validation
- RED du run [41321758721](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/41321758721), Foundation FAIL : mur 6 PV contre projectile 40 -> 34 dégâts traversent, attendu 0. Sentinelle normalisée ensuite pour respecter l'interdiction des doubles dégâts `effect.damage` + `effects[].damage`.
- Sentinelles `tests/unit/capture-wall-payload-interception-2026-11-01.test.mjs` : débordement projectile/rayon/contact, statuts/débuffs et interruption, statut seul avec dégât zéro, dégâts uniquement dans les effets tactiques, absence de contact observé.
- Sentinelle historique `capture-combat-entity-ice-barrier-2026-10-31` recalée sur le comportement demandé (une seule frappe ne traverse plus le mur).
- CI Foundation + quatre Chromium à confirmer sur **SHA final code+docs**, puis checkpoint GREEN exact / PR `gh-pages` / CI et Pages post-fusion. Validation tactile Android distincte.

## Hors périmètre et suivi
L'arrêt **visuel** de l'approche adverse avant le mur nécessite une interception du mouvement à la position du vrai rectangle ; ce n'est pas un second moteur à improviser. Le positionnement derrière la créature / UX de placement libre et le cadrage/détourage des 12 frames de sprite seront des lots séparés. Aucun changement de `main`, GensRPG, Exploration ou de la banque d'assets.
