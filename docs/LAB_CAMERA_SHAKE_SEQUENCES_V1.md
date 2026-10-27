# Séisme — séquences de secousses caméra V1 (11 octobre 2026)

## Diagnostic
Avant ce lot, `feedback.cameraShake` ne connaissait que `amplitudePx` et `durationMs` (version V4 du contrat), `DomSkillFxRenderer` appelait `playCameraFx` une fois et `DomCameraFxRenderer` jouait une unique trajectoire uniforme. Cela empêchait de représenter plusieurs chocs distincts pour Séisme.

## Base et frontières
- Base : `gh-pages` `b6e267240bd02772458f9b7e2cc6a38f81135eff`.
- Checkpoint départ : `checkpoint/lab-start-camera-shake-sequences-v1-2026-10-11`.
- Work : `work/lab-camera-shake-sequences-v1-2026-10-11`.
- Propriétaire du contrat : `SkillPresentationBindingV4`, relayé sans copie par V5 à V10.
- Propriétaire de la caméra : **`DomCameraFxRenderer` existant**, unique animation WAAPI par impact ; déclenchement délégué par `DomSkillFxRenderer`.
- L'éditeur ne définit aucun résultat de combat et n'a pas de minuterie.
- Aucune compétence auteur existante (Séisme ou autre) modifiée automatiquement.

## Contrat
L'ancien format `cameraShake: {amplitudePx, durationMs}` reste valide et conserve son animation `ease-out` historique et ses cinq keyframes.

Le format facultatif est :
```json
{
  "cameraShake": {
    "amplitudePx": 9,
    "durationMs": 210,
    "sequence": [
      { "pauseMs": 0, "amplitudePx": 9, "durationMs": 210 },
      { "pauseMs": 180, "amplitudePx": 15, "durationMs": 330 },
      { "pauseMs": 250, "amplitudePx": 5, "durationMs": 220 }
    ]
  }
}
```
`pauseMs` est un repos immobile **avant** chaque secousse ; aucune répétition automatique. La séquence prédomine uniquement si elle existe et contient au moins une impulsion. Les deux champs historiques sont conservés pour portabilité des transferts. Le contrat valide 1 à 8 secousses, amplitude positive <= 24 px, durée 30 à 2000 ms, pause 0 à 2500 ms, durée cumulée <= 10000 ms. Toute valeur anormale échoue explicitement ; aucun paramètre gameplay n'est affecté.

`cameraShakeTimelineV1` construit des keyframes monotones `offset` avec retour à la position neutre et pause au repos. Le renderer annule le seul mouvement précédent en cas de nouvelle demande, et nettoie `dispose()` sans `setTimeout` additionnel. Les effets d'impact, projectile, damage et les zones restent propriétaires de leurs effets précédents.

## Éditeur
Dans **Enrichissement FX → Réglages experts → Séquence de tremblements** :
- **Ajouter une secousse**, jusqu'à 8 impulsions, chacune avec pause, amplitude et durée ; **Retirer cette secousse**.
- Sur la première activation d'une compétence ayant une secousse simple active, l'ancien réglage est repris comme première impulsion pour ne pas le perdre.
- La secousse simple d'origine est toujours disponible si la liste est vide ; si la liste comporte des lignes, elle a priorité.
- Sauvegarde, réouverture, import et export conservent les valeurs dans `presentation.feedback.cameraShake.sequence`, sans deuxième champ métier.

## Vérification
- Tests TDD : `tests/unit/camera-shake-sequences-v1.test.mjs`, compat V9/V10 et mode historique, bornes, vraie chaîne builder → binding → adapter → renderer, ordonnancement et pauses, annulation, édition.
- GitHub Actions `38125325354` : `foundation`, `creature-library-browser` et `firestorm-zone-growth-browser` tous **SUCCESS** au commit `32b80bdb4c44d86e998157e8f47ea01b60576f57` avant ce document de clôture. Un rerun complet au SHA final est requis avant GREEN.
- Test manuel Android paysage reste distinct : création de trois secousses, pause reconnaissable, différences d'amplitude, retour de caméra au repos, seconde capacité interrompt proprement la première.
