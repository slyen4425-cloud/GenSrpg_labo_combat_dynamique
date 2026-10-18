# Import de Peste noire — 18 octobre 2026

## Source et traçabilité

- Auteur : export original `gensrpg-capture-skill-cap_shadow_atk_5.json`, `capture-skill-transfer-v1`, ID stable `cap_shadow_atk_5`.
- Taille exacte : **2 947 octets**. SHA-256 intégral : `40fd2e5e98199351d12b26e16f067e61639fe7dfd1110c09546026ed6b583fe7`.
- Départ : `gh-pages@b72010f3c30b044a000d494a6ef55ed74c59ee28`, `checkpoint/lab-start-shadow-peste-noire-skill-2026-10-18`, branche `work/lab-shadow-peste-noire-skill-2026-10-18`.
- Source archivée intacte : `data/capture/source-exports/gensrpg-capture-skill-cap_shadow_atk_5-2026-10-18.json`. Même contenu dans `data/capture/showcase/cap_shadow_atk_5.capture-skill-transfer-v1.json`. L'ID déjà connu dans le catalogue natif sous le nom « Onde noire » est remplacé par le preset auteur actif, sans changement de la source historique.

## Contenu exact de la capacité

- Nom : **Peste noire** ; Ombre, buff/debuff, projectile direct, `ultimate`, niveau 20, énergie 12, préparation 3 500 ms, trajet 1 200 ms, cooldown 0, utilisation maximale 1/combat, puissance collision 3.
- `definition.effects = []` : **aucun effet posé**, notamment pas d'`apply_marker` sur `peste`. Il s'agit d'une compétence inachevée pour le test du marqueur ; aucune pose de marqueur, dégâts ou effet de seuil n'a été inventé.
- `presentation.visual={}`, `presentation.audio={}` : pas d'asset visuel ou sonore choisi dans l'export. Les valeurs feedback auteur sont conservées. Aucun nouvel asset ajouté.
- Noctigriffe et son loadout restent inchangés (l'ultimate n'est pas auto-équipé). L'éditeur doit afficher la fiche active depuis `configuredSkills` après l'hydratation du showcase.

## Vérifications

- Sentinelle RED puis GREEN : archive et preset octet exact, unicité du registre, roundtrip transfert, valeurs auteur, absence d'effet inventé et remplacement/ajout sous l'ID canonique sans changement des autres fiches.
- CI complète, `gh-pages` et Pages sont les critères de fin technique. Validation utilisateur en jeu et test de marqueur complet nécessitent un export ultérieur comportant explicitement l'effet `apply_marker` si c'est l'intention.

