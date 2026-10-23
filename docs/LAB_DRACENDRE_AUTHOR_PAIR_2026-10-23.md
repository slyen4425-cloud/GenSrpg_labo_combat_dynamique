# Lot auteur — Dracendre V9, deux exports (23 octobre 2026)

## Source exacte
Deux fichiers utilisateur, même identité `crea_dracendre`. Ils sont identiques hormis la configuration du **son de déplacement** :
- `gensrpg-capture-creature-crea_dracendre.json` : pas de mode de répétition.
- `gensrpg-capture-creature-crea_dracendre(1).json` : `audio.movement.mode="repeat"`, `repeatIntervalMs=400`.

Les deux octets originaux sont archivés séparément, avec SHA-256 vérifiés. L'ancienne fiche publique V2 est aussi archivée. La fiche active est remplacée uniquement par la variante *(1)* plus complète, sans fusion approximative ni création de deuxième créature.

## IDs et assets
Conserve le profil `flying`, les statValues, les 20 capacités, les 5 slots, toutes les résistances et transformations, les références auteur d'animations : `movement`, `movementBack`, `rangedAttack`, `rangedAttackBack`. Aucune animation n'est inventée, aucun fichier visuel changé dans ce lot.

## Gouvernance
Base `gh-pages@a4e85f0fdb6e7762ce20b54d9ec9b37097cae7e6`; START `checkpoint/lab-start-dracendre-author-pair-2026-10-23`; work `work/lab-dracendre-author-pair-2026-10-23`.
Seuls les fichiers Dracendre, les trois archives, les deux tests historiquement sensibles, un nouveau test, cette doc et le journal sont autorisés. Les anciens tests d'égalité d'octets portent désormais sur l'archive historique, jamais sur la nouvelle fiche active. Autres créatures et moteur de combat protégés. CI 5/5 et checkpoint GREEN obligatoires avant fusion. Validation visuelle par l'auteur ensuite.

## Bug animation aérienne identifié hors lot
Le présentateur déclenche `playApproachFor(...,"aerial",...)`, mais dans `src/ui/demo-app.js` le rendu `slot.playMovementAppearance(...)` est limité à `approachMode==="ground"`. Correctif dans un **lot moteur distinct** après la fusion des données, avec tests réels sur Dracendre sans changer le Core ou la collision.
