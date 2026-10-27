# Labo Combat — Capture FX : réglages simples et transparents

Date : 11 octobre 2026. Dépôt `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande et conception

L'auteur constate que les paramètres de Glow, traînée, fumée et secousse sont difficiles à comprendre pour quelqu'un qui n'a pas les notions de pixels et d'intensité. Il souhaite néanmoins conserver **tous** les réglages avancés des capacités.

L'écran `Effets visuels` possède déjà les catalogues `capture-fx-glow-presets-v1.js` et `capture-fx-particle-presets-v1.js` et le pack starter GenSrpG. Le présent lot **ne crée pas de deuxième propriétaire FX** : il crée une présentation débutant au-dessus de ces deux contrôles existants.

## Ce qui devient accessible

- Trois options de **rendu rapide** : Discret (glow/particules discret, secousse 2 px), Équilibré (glow/particules visible, secousse 5 px) et Spectaculaire (glow/particules intense, secousse 9 px). Valeurs des particules et du glow héritées sans copie des catalogues V1 existants.
- Un **aperçu indicatif**, explicitement présenté comme tel, qui change lors de la sélection. Le rendu complet réel demeure accessible uniquement depuis **Tester le combat**.
- Le choix d'un preset n'écrit aucun paramètre ; seul le bouton `Appliquer cette intensité` appelle les commandes existantes des presets Glow et Particules et renseigne la secousse simple.
- Après chargement/sélection d'une capacité, la liste affiche `Conserver mes réglages actuels`, même si le preset antérieur correspond numériquement à un niveau. **Aucun auto-apply** au chargement, et modifier une valeur avancée ramène l'étiquette à `Réglages actuels`.
- L'auteur conserve les couleurs, sprites/cast/proj/impact, échelles et offsets, sons, attaches/ancrages, séquences manuelles de secousse, tailles de médias, trajectoire, caractéristiques, dommages et temps gameplay. En présence de séquences manuelles, un texte prévient qu'elles priment toujours sur la secousse simple.
- Conseils **contextuels** selon projectile classique, chute `skyfall` ou rayon `beam`.
- Avertissements non bloquants pour traînées de particules au-delà de 24 px (ou longueur au-delà de 95 px), secousses supérieures à 24 px, fumée supérieure à 80 px. Aucune modification silencieuse des valeurs extrêmes déjà enregistrées.
- Zone `Réglages avancés` préexistante conservée et toujours repliable, avec tous les contrôles chiffrés.

## Gouvernance

- Base `gh-pages` : `c2db87ff3fbe6363ec1dcadd6533d858f5b45b5c`.
- Départ `checkpoint/lab-start-capture-fx-quick-controls-v1-2026-10-11`.
- Travail `work/lab-capture-fx-quick-controls-v1-2026-10-11`.
- Propriétaire pur UI : `src/ui/capture-fx-quick-mode-v1.js` (compose les deux catalogues V1 ; n'édicte aucune règle de combat).
- UI actuelle : `src/ui/capture-editor-human-v2.js`, `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/demo.css`.
- Nouveaux tests unitaires `tests/unit/capture-fx-quick-mode-v1.test.mjs` : noms, niveaux, bornes, non-mutation, conservation des champs auteur/séquences, conseil skyfall / beam, présence des contrôles existants. Test RED avant ajout du helper `b4bd14fff0d8879254ed4c3bdc1048bdf72300a3`, CI FAILURE attendue `38154494709`.
- Test navigateur réel : `tests/browser/capture-creature-library-smoke.mjs` — ouvre la vraie fiche `cap_earth_atk_4`, confirme que le choix d'intensité ne touche pas la traînée, applique Spectaculaire puis valide les valeurs Glow/Particules/Secousse et la trajectoire `skyfall`, puis contrôle le retour à `Réglages actuels` après édition avancée. Il garde les tests des 103 créatures.
- Périmètre interdit : aucun changement à `configuredCreatures`, `configuredSkills`, JSON de presets, 103 créatures, catalogue d'assets, FX Renderer, Combat Core, `global-assets`, `main`, `Zombicide-40k`, Exploration.
- Portes : CI foundation + navigateur réels au SHA documentaire final, checkpoint GREEN exact, FF `gh-pages` avec contrôle du SHA, puis GitHub Pages SUCCESS. **Test ergonomique sur téléphone non encore confirmé**, même si technique GREEN.

## Limites assumées

Le petit schéma est une **indication de puissance**, pas le sprite réel. Il ne prédit pas exactement le rendu des effets personnalisés. Les préférences de niveau simple ne sont pas sauvegardées comme champ dans les capacités ; seules les valeurs avancées V1 le sont, afin de préserver les exports/imports et le moteur. Les presets s'appliquent uniquement au clic explicite ; sauvegarder la capacité via l'éditeur conserve ensuite les valeurs résultantes.
