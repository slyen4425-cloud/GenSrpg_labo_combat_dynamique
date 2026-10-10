# Labo Combat — Son du trajet synchronisé avec les appuis en attaque contact

**Date : 2026-10-10 — chantier technique V1**

## Retour utilisateur
Réutiliser le champ sonore déjà existant « Son du trajet » comme bruit de pas lors d'une attaque `contact`. Si l'approche a quatre rebonds/appuis, jouer quatre fois le son ; deux appuis, deux fois ; profil volant/sans appui, une fois au départ.

## Diagnostic
- Avant correction : `CombatResolutionPresenter.presentRelease()` n'utilisait `audio.travel` que pour `projectile` et `beam`.
- Les profils de mouvement fournissent déjà des contacts canoniques sous `profile.locomotion.contacts` ; `Animation Core` crée des `plan.cues` `type:"footfall"` aux instants exacts.
- `Demo Visual Controller.schedulePlanCues()` distribue déjà ces cues pour les micro-shakes caméra des profils massifs. Il n'y a pas lieu de déduire des pas à partir des ms ou de créer un second calendrier.
- Profils existants (inchangés) : massif 4 appuis ; quadrupède 2 ; bipède 3 ; volant et serpentin 0.

## Correction par propriétaires existants
- `src/ui/demo-app.js` : `playApproachFor(...,onFootfall)` optionnel ; relais de **chaque** cue `footfall` via le scheduler déjà en production. Seulement lorsqu'aucun cue `footfall` n'existe pour le plan, émission unique au départ. Déclenchement du son conditionné à une attaque contact par le Presenter.
- `src/adapters/renderer/combat-resolution-presenter.js` : acheminement `audio.travel` à chaque signal en contact, en one-shot, sans créer ni jouer un impact additionnel. Protections de génération pour écarter les vieux callbacks ; arrêt des samples actifs à l'interruption et au dispose ; à l'impact normal, sample déjà démarré laissé se terminer sans son supplémentaire.
- `src/adapters/audio/dom-combat-audio.js` : le paramètre ponctuel `loop:false` force une lecture non bouclée du **même assetId** configuré ; il ne change pas `sound.loop` dans la compétence ni le traitement projectile/beam.
- `examples/dom-demo/capture-editor-v2.html` : l'unique champ existant devient « Son du trajet (projectile / rayon / contact) », avec explication des appuis et du vol. Aucun second champ.

## Invariants
- Bibliothèque audio, `travelAudioAssetId`, présentation, fichiers des capacités et des créatures inchangés.
- Les sons de cast, release, impact et zone conservent leurs déclencheurs et leurs volumes auteur.
- Timings, contacts, rebonds, animation, trajectoire, dégâts, énergie, cooldown, règles de collision, disponibilité des skills et silence d'une compétence sans `travelSound.assetId` inchangés.
- Un contact détecté prématurément arrête les cues du trajet inachevés : seuls les pas réellement atteints s'entendent, conformément au mouvement visuel.

## Protocole et tests
- Base publique : `9718da7947481e639e0350c5ba10dea436fe05b2`, GitHub Actions Foundation et Chromium GREEN.
- Checkpoint départ : `checkpoint/lab-start-contact-approach-footstep-audio-v1-2026-10-10`.
- Nouveau test RED : `tests/unit/contact-approach-footstep-audio-v1.test.mjs`; suite Foundation avant correctif en échec attendu.
- Couvre : vrais plans d'approche massif 4 / quadrupède 2 / bipède 3 / volant et serpentin 0 ; callback Presenter par appui ; prise en compte du même assetId `travel` et du `loop:false` contextuel ; projetile conserve sa boucle ; aucune fausse lecture sur une forme non contact ; interruption, callbacks retardés, dispose, résolution ; lisibilité du réglage éditeur.
- Exécution de toute la CI Foundation, Chromium bibliothèque et Firestorm avant checkpoint GREEN. Test auditif Android utilisateur distinct des tests automatiques.
- Zéro nouvel asset média, `main`, `Zombicide-40k`, Exploration et branche `global-assets` non modifiés.
