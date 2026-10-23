# CHARTE CANONIQUE — Icônes de compétences Capture (Laboratoire Combat)

**Référence durable pour tout nouvel assistant et toute création d'icônes.** Cette charte complète `docs/LAB_CHARTE.md`, elle ne la remplace pas. Les médias réellement publiés et approuvés dans `global-assets` restent la référence visuelle, pas une description textuelle seule.

## Modèles réels à inspecter avant toute génération

- `assets/library/capture/icons/skills/icon_skill_croc_electrique_01.webp` : impact lumineux, sujet unique, cadre orné ;
- `assets/library/capture/icons/skills/icon_skill_tailwind_feather_01.webp` : silhouette claire et contraste ;
- `assets/library/capture/icons/skills/icon_skill_miroir_magique_01.webp` : lumière magique, fonds sombres ;
- `assets/library/capture/icons/skills/icon_skill_brulure_01.webp` et `icon_skill_fleuraison_01.webp` : série médaillon pour statuts ;
- `assets/library/capture/icons/skills/icon_skill_explosion_flammes_01.webp` et `icon_skill_tsunami_01.webp` : paire élémentaire cadrée.

## Invariants artistiques

1. **Style** Monster Capture / fantasy cartoon peint : iconographie cohérente et lisible sur smartphone, pas de photo, logo, texte, typographie ou UI simulée dans l'image.
2. **Un sujet unique**, geste ou effet identifiable instantanément : la capacité se reconnaît sans lire son nom. Si deux icônes se ressemblent, retravailler la silhouette avant génération définitive.
3. **Contraste volontaire** : centre d'attention clair, fond plus sombre ou secondaire, contours et volumes lisibles. Ne pas multiplier les détails fins illisibles à 48px.
4. **Fond présent et travaillé**, jamais un objet isolé flottant dans le vide ; maintenir la séparation du sujet et du fond.
5. **Cadre cohérent avec la famille existante**. Les capacités d'attaque carrées peuvent employer un cadre fantasy arrondi métallique/doré ; les statuts et buffs existants utilisent souvent des médaillons circulaires. Ne pas imposer le même cadre à toutes les familles sans comparer les assets réellement en production.
6. **Couleur propre à l'élément** : feu rouge/orange/or, eau bleu/turquoise/blanc, spirituel violet/rose/cyan, soin vert/clair, ombre sombre/violet, acier métal/or. S'assurer que le relief et la silhouette restent plus importants que l'effet néon.
7. **Composition carrée, centrée, sans coupure inopinée** ; garder des marges pour les liserés et les particules. Le sujet principal doit rester identifiable après réduction.
8. **Référence visuelle avant génération** : consulter dans GitHub les icônes proches de la famille demandée ; se conformer à leurs proportions, détails, contraste et traitement des cadres. Si aucun modèle n'existe, réutiliser les invariants de cette charte.
9. **Source haute résolution distincte du média final** (PNG carré recommandé) ; image runtime réelle : WebP 128×128 (RGB ou RGBA selon besoin). Réduction de qualité à tester réellement à 128 et à 48 pixels ; enregistrer SHA des fichiers livrés.
10. **Processus** : image source → validation visuelle auteur lorsque nécessaire → découpe/optimisation → tests média réels + catalogue unique `data/assets/catalog/global-visual-assets.v1.json` → CI GitHub → branche officielle `global-assets` → vérification sur appareil. Jamais d'image de remplacement ou de faux badge GREEN.

## Mise à jour

Toute nouvelle famille approuvée peut ajouter ses références ici, dans un lot isolé. Conserver les IDs immuables ; ne pas modifier silencieusement des icônes précédemment validées. La charte du labo, les règles de branches/checkpoints et la vérification réelle des médias s'appliquent toujours.
