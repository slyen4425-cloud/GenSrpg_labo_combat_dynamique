# 2026-10-31 — Attaque chargée : effet auteur et croissance du cast

## Charte et isolation
- Base testée antérieure : `gh-pages@4fd62cb798ba0eb382d20d4c34b03f57a4559f34`.
- START : `checkpoint/lab-start-charged-cast-scale-2026-10-31`.
- Lot isolé : `work/lab-charged-cast-scale-2026-10-31`.
- Périmètre : unification de la découverte auteur (« Effets tactiques → Type d'effet à ajouter → Attaque chargée → Ajouter un effet »), plan FX cast, update FX et présentation 1v1/2v2, tests. Aucun consommateur GenSrpg, Exploration, data auteur, main modifié.

## Propriété unique / cause
Le contrôle `chargedAttack` se trouvait en Timing alors qu'il définit les dégâts et amplifications d'une capacité. Il est replacé physiquement dans Effets tactiques et ajouté via le même bouton « Ajouter un effet ». Il reste **le même** champ du contrat `SkillDefinition`, pas une nouvelle ligne de dégâts. L'éditeur avertit en cas de doublons d'effets directs.

Les réactivations étaient enregistrées par le Runtime, mais le cast initial ne suivait pas cette progression : seul le projectile de release avait un multiplicateur. Maintenant le Combat Runtime met à jour `chargeState.sizeMultiplier` lors de chaque réactivation et le conserve au release ; le FX plan transmet cette valeur au cast, le presenter adapte le **même** playback via le handle `setSizeMultiplier`, et le DOM utilise la propriété CSS indépendante `scale` sans interrompre les frames ni modifier le `transform` auteur. Le projectile lit exactement le même multiplicateur à son départ.

## Tests / non-régression
- TDD RED : `decd788c4d17b62c2b115c86c9cebe71c4bedcc7`.
- Sentinelles Node : plan cast/release, progression propriétaire, mise à jour sans rejouer le cast, position réelle de l'éditeur, contrats 1v1.
- Chromium : ajout depuis Effets + vrai sprite DOM avec tailles ×1, ×1.1, ×1.2, un seul nœud cast ; suite navigateur existante.
- GREEN soumis à CI complète sur SHA exact ; publication gh-pages et contrôle de déploiement avant communication.
