# Charge tellurique / Moussados — exports auteur et coloration du modèle V1

## Base et gouvernance
- Base `gh-pages` : `f0516248f7ff5c7ea2db8538b0bb336ef220eef0`.
- Checkpoint : `checkpoint/lab-start-author-refresh-model-tint-blink-v1-2026-10-11`.
- Branche de travail : `work/lab-author-refresh-model-tint-blink-v1-2026-10-11`.
- Autorités conservées : `configuredSkills` et `configuredCreatures` pour les données, `SkillPresentationBindingV3` pour la présentation de statut, `DomStatusFxRenderer` pour la superposition sur le modèle, `CombatRuntime/Session` pour durée et présence du statut.

## Données importées à l'identique
Deux exports fournis par le créateur remplacent les enregistrements de la vitrine portant les mêmes IDs, sans doublon :
- `cap_earth_atk_3`, **Charge tellurique** : niveau 15 ; cible self + allié ; aura au sol `pack:capture:sprite-flowering-meadow-ground-01`, `hold-last` ; zone personnelle 30 s, régénération d'énergie +50 % ; second statut de vitesse de recharge des compétences +50 % pendant 30 s appliqué à la cible ; teinte `#5fad47` à 35 % et fumée d'auteur. Tout autre champ conservé.
- `crea_mossback`, **Moussados** : données d'apparence, stats, sockets et audio inchangées vis-à-vis de l'export joint ; quatrième slot `cap_earth_atk_3`, aucun déplacement arbitraire du loadout.

Le contenu brut est protégé par test SHA-256 des deux exports et roundtrip du transfert de compétence. Ces SHA-256 sont ceux des fichiers utilisateur (octets UTF-8 originaux), pas les SHA de commits Git.

## Coloration existante étendue
Le statut `presentation.statusVisuals[id]` conserve ses champs `mode`, `tintColor` et `tintOpacity`, et peut ajouter :
- `tintBlinkEnabled` : booléen facultatif, défaut visuel *false* si absent.
- `tintBlinkPeriodMs` : entier facultatif de 120 à 5000 ms, défaut visuel 600 ms si absent. C'est la durée du cycle complet `opacité réglée → 0 → opacité réglée`.
- `tintColor` : tout hexadécimal valide `#RRGGBB`, y compris **noir** `#000000`.

L'éditeur du même statut propose une palette étendue, un sélecteur hexadécimal libre, une intensité, l'interrupteur de clignotement et la vitesse. La palette ne constitue pas une source de vérité : seul `tintColor` est sauvegardé.

Le renderer réutilise un seul masque du sprite du modèle et une animation native `node.animate` par statut actif. Elle ne redémarre pas à chaque `sync`; une modification de réglage l'actualise après annulation de la précédente. Disparition/expiration/KO/roster/dispose relèvent du chemin de suppression de l'unique renderer (qui annule aussi l'animation). Aucune minuterie ni copie des règles de statut dans l'UI. Sur un environnement sans Web Animations, la coloration fixe demeure utilisable.

## Limites et validation
- Aucune nouvelle animation de hit/glow/particle n'est transformée artificiellement en tint de modèle.
- Aucun changement au timing des status ou à leurs effets gameplay.
- Tests : contrat de l'ancien et nouveau format, couleurs y compris noir, bornes, transfert auteur, vrai resolver → renderer → retrait de statut, éditeur. La CI doit également valider la bibliothèque des 103 créatures et les deux smokes Chromium.
- **Validation Android manuelle distincte** : tester vert/noir, clignotement lent/rapide, cumul d'un statut, changement de créature et disparition au terme du statut.
