# Labo Combat — Audio des pas possédé par la créature V1

**Date : 10 octobre 2026 — correction du lot Contact Approach Footstep Audio.**

## Retour utilisateur et décision d'autorité
Une attaque identique partagée entre un acteur lourd et un acteur léger ne doit pas imposer le même son de pas. Le précédent lot utilisait `skill.presentation.audio.travel` lors des contacts, source de l'incohérence.

**Une seule autorité à présent : `configuredCreatures[creatureId].draft.presentation.audio.movement`.** Ce slot optionnel contient la référence à l'asset sonore stable et son volume (défaut 1). Les anciens exports restent valides et silencieux si aucun son de déplacement n'a été choisi ; aucune migration automatique depuis les capacités ne serait fidèle.

## Chemin réel d'édition et de combat
1. La section **Sons de la créature** contient le quatrième choix **Pas / déplacement (attaque contact)** et son bouton **Écouter**. Il utilise les options de rôle `movement` dans le catalogue audio existant et un import de session possible. Aucun second sélecteur concurrent.
2. Le Human Editor écrit, relit, réinitialise et sauvegarde `audio.movement` avec les trois rôles historiques attaque/touché/KO. `audioSlots` et `CreaturePresentationBindingV1` normalisent ce même champ ; V2 et V3 le conservent. Export Capture Creature Transfer conserve le choix par ID.
3. `adaptCaptureExportToNativeVisualSourceV1` expose `binding.audio` sur la métadonnée runtime de la créature, sous **son** ID, sans déplacer la propriété vers Combat Rules.
4. `Demo Visual Controller.getCreatureAudioFor(slot)` lit la métadonnée de la créature **effectivement présente dans ce slot** : changement de créature => lecture de la nouvelle fiche.
5. `Animation Core plan.cues` fournit toujours les vrais appuis du profil, avec le même scheduler `onFootfall`. `CombatResolutionPresenter` envoie `type: movement` et `loop: false` au moteur `DomCombatAudio`. Celui-ci appelle **`presentationForCreature(actorSlot)`**, et non `presentationForSkill`, pour ce seul type. `combat-test-ui` et `combat-2v2-test-ui` sont raccordés à la même lecture.
6. Si aucun contact (flying/serpentine/aerial/teleport/burrow), un seul son est déclenché au début du mouvement. Si le profil a 4/2/3 contacts, autant de lectures. Le son d'impact demeure indépendant.

## Garanties anti-régression
- Une attaque contact avec un son de trajet configuré sur la **capacité** ne produit aucun son de pas si la créature n'a pas sélectionné de son de déplacement. C'est voulu : pas de fallback non déterministe.
- Projectiles et rayons consomment **toujours** la capacité `audio.travel`, boucle et annulation comme auparavant.
- Les cues non atteints à cause d'une collision précoce, d'une interruption ou d'une substitution ne doivent pas produire de pas retardés ; les sons déjà déclenchés suivent leur cycle propre et restent annulables au dispose.
- Même compétence équipée par un loup et un golem : sons indépendants du profil de l'acteur et du slot actif ; aucune réécriture du skill.
- Aucun média, créature, preset auteur ou profil retouché ; 103 créatures, data et loadouts protégés.
- Aucun nouveau ticker, calcul de mouvement, couche d'asset, champ gameplay, ni changement de `main`, GenSrpG principal ou Exploration.

## Vérification
- Départ connu et public : `e4fe6368a276411033deed40712c10b9079292c9`, CI/Pages SUCCESS.
- Checkpoint de départ : `checkpoint/lab-start-creature-owned-movement-audio-v1-2026-10-10`; branche `work/lab-creature-owned-movement-audio-v1-2026-10-10`.
- Test RED `tests/unit/creature-owned-movement-audio-v1.test.mjs` avant code, suivi des sentinelles actualisées `contact-approach-footstep-audio-v1.test.mjs` et `private-audio-full-preview-v1.test.mjs`.
- Foundation/Chromium/GitHub Pages à vérifier **au SHA final**, puis checkpoint GREEN, preview et publication sous lease.
- Approbation tactile/auditive sur smartphone reste à obtenir séparément.
