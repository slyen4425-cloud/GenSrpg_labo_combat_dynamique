# Rayon continu — éditeur 4 étapes près des zones persistantes (2026-10-08)

## Source utilisateur, UX et emplacement
L'ancienne section « Rayon lié — un seul réglage pour les 3 parties » était placée au début de « 7 — Effets visuels ». Les composants étaient éparpillés dans le volet avancé, donc le pack de rayon ne se configurait pas clairement.

L'éditeur possède désormais, **immédiatement après « 4 — Effets tactiques » (qui contient les réglages de zone persistante)**, une carte « Rayon continu — 4 étapes liées » :
1. **Charge** : sprite de préparation + point de sortie + échelle + mode de lecture.
2. **Départ du rayon** : sprite ancré au lanceur + échelle.
3. **Corps continu** : sprite étiré entre source et cible + échelle/animation.
4. **Extrémité cible et impact** : sprite de fin + échelle/durée.

Le bouton « Utiliser les 4 sprites Jet pressurisé » est dans **ce même panneau**, directement au-dessus des quatre étapes ; il remplit les quatre IDs média canoniques + form=beam sur une action explicite. Les champs apparaissent à l'écran quand la forme active est « Rayon ».

## Owner et absence de double autorité
Le module d'UI `src/ui/capture-editor-beam-stage-layout-v1.js` **déplace exactement les douze éléments <label> déjà existants**, sans les cloner et sans garder de valeurs intermédiaires. Le module :
- crée un repère DOM par champ à l'emplacement d'origine ;
- regroupe les 12 champs réels quand Style vaut `beam` ;
- restaure ces mêmes champs au même ordre pour toute autre forme (projectile, contact, zone…) ou lors du teardown ;
- conserve leurs valeurs, événements, choix d'asset, et l'autorité de `readSkillFields` / `buildHumanSkillDraftV1` ;
- synchronise lors du changement manuel de style, du chargement d'une capacité, de la création d'une nouvelle capacité ou de l'action de pack.

Les seules autres modifications sont le marquage HTML, les styles responsives du nouveau panneau et ses sentinelles unitaires/navigateur. Pas de création de registre d'asset ou de deuxième définition de compétence. Le bouton reste optionnel et n'enregistre pas automatiquement une capacité.

## Placement du rayon en combat
Le lot précédent a déjà raccordé `beamStart`, `travel` et `impact` au même objet `DomSkillFxRenderer` (point source / cible suivis avec le propriétaire FX existant). **Ce lot ne modifie pas le moteur de combat ni ces ancrages**. Une éventuelle correction esthétique (bords, échelles, offsets) doit provenir d'un test smartphone précis.

## Protection / base
- Base déployée : `4e9083570561a284838888d1d5e23a6b6a915369`.
- Checkpoint départ : `checkpoint/lab-start-beam-editor-four-stages-v1-2026-10-08`.
- Branche isolée : `work/lab-beam-editor-four-stages-v1-2026-10-08`.
- `main`, `global-assets`, `Zombicide-40k`, Exploration et tous les autres éditeurs/données inchangés.
- Les capacités `cap_water_atk_{1,2,3}`, les dégâts, résistances, énergie, cooldowns, timings, bindings V9 et 103 créatures restent inchangés.
- Aucun nouveau média : 0 sprite créé, 0 WebP/PNG/MP3 ajouté, 0 média remplacé.

## Tests et statut
- TDD RED : test `tests/unit/capture-beam-four-stage-layout-v1.test.mjs` ajouté avant implémentation, vérifie l'emplacement après la zone, une copie par champ, passage réversible `projectile → beam → projectile`, conservation des valeurs et restauration après dispose.
- Tests de structure + faux DOM GREEN à partir de `9c47c0986408868345ef63614e5a69d7c56b2df0` (CI `37813466056` SUCCESS).
- Nouveau test navigateur, sur Chromium, bascule vraiment Style=Rayon et vérifie les **12 contrôles répartis 4+2+3+3**, en plus des trois scénarios de chargement des **103 créatures**.
- Un test historique de déplacement paysage a détecté un `width` CSS inutile dans les règles du nouveau panneau ; supprimé, sans modifier la sentinelle historique ni le moteur.
- Critère GREEN technique final : succès complet Node + Chromium sur commit documentaire, checkpoint, preview et déploiement Pages SUCCESS.
- Critère GREEN produit : validation de la disposition sur smartphone et vérification visuelle du raccord source/corps/cible sur les arènes.
