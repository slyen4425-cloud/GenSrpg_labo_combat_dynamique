# Dard static / venin-static — import auteur exact V1

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Sources auteur et absence d'autorité concurrente

Deux pièces reçues (non corrigées et jamais réinterprétées comme valeurs de gameplay) :

- `gensrpg-capture-skill-lib_paralyze.json`, schéma `capture-skill-transfer-v1`, ID `lib_paralyze`, empreinte SHA-256 brute `afc60fb2b91d711cc19fe13c728e0268496ac363fd3f31b93a172c764698b48c` (3723 octets UTF-8 sans `\\n` final).
- `gensrpg-marqueurs(2).json`, schéma `capture-markers-v1` et `markers: []`, empreinte SHA-256 brute `314e46c1799ae05a33aa5986effa2796282f02c0685670a160bd7229d03e429e` (53 octets UTF-8).

Fichiers GitHub strictement identiques :
- `data/capture/showcase/lib_paralyze.capture-skill-transfer-v1.json` : seul transfert utilisé par l'éditeur et `configuredSkills` ;
- `data/capture/source-exports/gensrpg-marqueurs-2026-10-17.json` : archive de provenance seulement, **non chargée** dans le jeu. Une bibliothèque de zéro marqueur ne remplace pas la bibliothèque de l'auteur.

**La vraie définition du marqueur est intégrée à `definition.effects[1].marker` dans le transfert de la capacité**. Le catalogue actif existant répertorie cette seule capacité. `refreshSkillLibraryOptions` relance `markerLibraryController.indexSkills()`, lequel récupère `apply_marker.marker` dans le propriétaire `configuredSkills`. Aucun second store global de gameplay, conversion des debuffs, ni synthèse artificielle depuis l'export vide.

## Valeurs auteur inviolables

- Capacité : ID `lib_paralyze`, nom `Dard static`, description `Place marqeur` (orthographe conservée), élément électrique, forme contact avec approche au sol, niveau 1, énergie 3, préparation 700 ms, trajet 800 ms, récupération 0, cooldown 8000 ms.
- Dégât immédiat : 8 électriques, cible ennemie active ; marqueur appliqué à la cible : 1 charge.
- Marqueur partagé : ID `venin-static`, libellé `venin static`, négatif, durée **permanente pendant le combat**, maximum 20 charges, icône `pack:capture:icon-skill-toxine-01`.
- Tick : 2 dégâts **par charge** toutes les 5000 ms, canal `electric`, `damageMode:"combat"` (résistances et protections natives appliquées).
- Au seuil 20 : `knockout` natif sur la cible, consommation `reset` ; les protections natives restent propriétaires.
- Impact de présentation : `pack:capture:sprite-impact-electric-01`, displayScale 2, durée 600 ms, opacity 0.7, devant pour les deux vues, playback stretch.
- Les deux IDs d'assets existent dans `global-assets/data/assets/catalog/global-visual-assets.v1.json` lors de l'audit. Aucun asset nouveau n'est requis. Le choix d'icône de marqueur reste un `iconAssetId` de contrat ; affichage HUD personnalisé selon les limites du chantier marqueurs documentées, sans prétendre à un nouveau rendu.

## Gouvernance et intégration

Base `gh-pages@f03a907998a00cd189c902b824c34ce51df82032` ; checkpoint `checkpoint/lab-start-lib-paralyze-marker-author-2026-10-17` ; branche `work/lab-lib-paralyze-marker-author-2026-10-17`.

- `lib_paralyze` existait comme capacité du catalogue historique ; le transfert auteur devient sa définition configurable **unique** par ID stable au démarrage dans `configuredSkills`. Aucun ID bis.
- Aucun changement automatique des loadouts créatures, ni des 103 créatures et de leurs ressources historiques. La compétence est accessible pour attribution depuis l'éditeur et les sélections natives.
- Contrôles : strict contrat / round-trip transfert, empreintes des deux uploads, ID enregistré une seule fois, présence des deux assets existants, tick combat natif électrique, seuil KO natif, rechargement via vrai Chromium et récupération du marqueur dans le sélecteur ; CI Foundation et quatre navigateurs.
- Les anciens tests de catalogue avec cardinalité 28 ont été alignés sur **29** et la sentinelle de choix dans l'éditeur préserve l'option déjà sélectionnée au lieu de l'écraser à l'ajout d'un marqueur. Aucun ancien gameplay modifié.
- CI code à `d80896e90dfc6c8634d2fd08e902994b3c63bc3b` run `39021619263` : **5/5 SUCCESS** (Foundation + quatre navigateurs). Publication uniquement après CI sur le SHA documentaire final, checkpoint GREEN exact et Pages SUCCESS. Validation manuelle tactile smartphone à faire par le créateur.

